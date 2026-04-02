import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import lottie from "lottie-web";
import successAnimation from "../assets/animations/Success.json";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { useMenu } from "../hooks/useMenu";
import { getStoredSlug, getStoredTableId } from "../utils/constants";

const ORDER_STATUSES = {
  pending: { label: "Order Pending", description: "We've received your order" },
  confirmed: { label: "Order Confirmed", description: "Restaurant is preparing your food" },
  preparing: { label: "Preparing", description: "Your food is being prepared" },
  ready: { label: "Ready", description: "Your order is ready for pickup!" },
  completed: { label: "Completed", description: "Order completed" },
};

export function OrderConfirmedPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug, tableId: urlTableId, orderId: urlOrderId } = useParams();
  
  const slug = urlSlug || getStoredSlug();
  const tableId = urlTableId || getStoredTableId();
  const { restaurant } = useMenu();

  const basePath = tableId ? `/${slug}/t/${tableId}` : `/${slug}`;

  const [orderStatus, setOrderStatus] = useState("confirmed");
  const [orderCode, setOrderCode] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);
  const animationRef = useRef(null);
  const containerRef = useRef(null);
  const channelRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Get order ID from sessionStorage or URL params
  const [orderId, setOrderId] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("orderData");
      if (saved) {
        try {
          return JSON.parse(saved).orderId;
        } catch { return urlOrderId; }
      }
    }
    return urlOrderId;
  });

  // Load success animation
  useEffect(() => {
    if (containerRef.current && !animationRef.current) {
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        animationData: successAnimation
      });
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, []);

  // Clear cart data on mount
  useEffect(() => {
    localStorage.removeItem("qr_menu_cart");
    localStorage.removeItem("notes");
    sessionStorage.removeItem("cart_order_note");
    window.dispatchEvent(new Event("cart-cleared"));
  }, []);

  // Poll for order status (fallback)
  const fetchOrderStatus = async (id) => {
    if (!id || !isSupabaseConfigured || !supabase) return;
    
    try {
      const { data, error } = await supabase
        .from("live_orders")
        .select("status, order_code")
        .eq("id", id)
        .single();

      if (!error && data) {
        if (data.status && data.status !== orderStatus) {
          setOrderStatus(data.status);
          setLastUpdate(new Date().toLocaleTimeString());
        }
        if (data.order_code && !orderCode) {
          setOrderCode(data.order_code);
        }
      }
    } catch (err) {
      console.error("[OrderConfirmed] Poll error:", err);
    }
  };

  // Real-time subscription and polling
  useEffect(() => {
    if (!orderId || !isSupabaseConfigured || !supabase) return;

    // Initial fetch
    fetchOrderStatus(orderId);

    // Set up real-time subscription
    channelRef.current = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log("[OrderConfirmed] Real-time update:", payload.new);
          if (payload.new?.status) {
            setOrderStatus(payload.new.status);
            setLastUpdate(new Date().toLocaleTimeString());
          }
          if (payload.new?.order_code && !orderCode) {
            setOrderCode(payload.new.order_code);
          }
        }
      )
      .subscribe((status) => {
        console.log("[OrderConfirmed] Subscription status:", status);
        // If subscription fails, start polling
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.log("[OrderConfirmed] Falling back to polling");
          pollIntervalRef.current = setInterval(() => {
            fetchOrderStatus(orderId);
          }, 5000);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [orderId]);

  const goToMenu = () => {
    navigate(basePath);
  };

  const statusInfo = ORDER_STATUSES[orderStatus] || ORDER_STATUSES.confirmed;

  // Determine progress steps
  const steps = ["confirmed", "preparing", "ready"];
  const currentStepIndex = steps.indexOf(orderStatus === "pending" ? "confirmed" : orderStatus);

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={goToMenu} aria-label="Back to menu">
          ←
        </button>
        <h1 className="topBarTitle">Order Status</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="orderSuccess">
        <div className="successContainer">
          <div className="successAnimationWrap">
            <div ref={containerRef} className="successAnimation" />
          </div>
          
          <h2 className="successTitle">{statusInfo.label}</h2>
          <p className="successText">{statusInfo.description}</p>
          
          {orderCode && (
            <div className="orderCodeBadge">
              Order ID: <strong>{orderCode}</strong>
            </div>
          )}

          {/* Progress indicator */}
          <div className="orderProgress">
            {steps.map((step, index) => (
              <div 
                key={step} 
                className={`orderStep ${index <= currentStepIndex ? "completed" : ""} ${index === currentStepIndex ? "active" : ""}`}
              >
                <div className="orderStepDot">
                  {index < currentStepIndex ? "✓" : index + 1}
                </div>
                <span className="orderStepLabel">{ORDER_STATUSES[step]?.label?.split(" ").pop()}</span>
              </div>
            ))}
            <div className="orderProgressLine" style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }} />
          </div>

          {lastUpdate && (
            <p className="lastUpdate">Last updated: {lastUpdate}</p>
          )}

          <button className="successBtn" onClick={goToMenu}>
            Back to Menu
          </button>
        </div>
      </main>
    </div>
  );
}
