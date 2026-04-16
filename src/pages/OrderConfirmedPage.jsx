import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { supabase } from "../lib/supabaseClient";
import lottie from "lottie-web";
import successAnimation from "../assets/animations/Success.json";
import { getStoredSlug } from "../utils/constants";

export function OrderConfirmedPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug, orderId: urlOrderId } = useParams();

  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const animationRef = useRef(null);
  const containerRef = useRef(null);

  const orderId = (() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("orderData");
      if (saved) {
        try {
          return JSON.parse(saved).orderId;
        } catch { return urlOrderId; }
      }
    }
    return urlOrderId;
  })();

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

  useEffect(() => {
    localStorage.removeItem("qr_menu_cart");
    localStorage.removeItem("notes");
    sessionStorage.removeItem("cart_order_note");
    window.dispatchEvent(new Event("cart-cleared"));
  }, []);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("live_orders")
        .select("id, order_code, total_price, items, table_id, status, created_at")
        .eq("id", orderId)
        .single();

      if (!error && data) {
        setOrderData(data);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  const goToMenu = () => {
    navigate(basePath);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="pageLayout">
        <header className="topBar">
          <h1 className="topBarTitle">Order Confirmed</h1>
        </header>
        <main className="orderSuccess">
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            Loading order details...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={goToMenu} aria-label="Back to menu">
          ←
        </button>
        <h1 className="topBarTitle">Order Confirmed</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="orderSuccess">
        <div className="successContainer">
          <div className="successAnimationWrap">
            <div ref={containerRef} className="successAnimation" />
          </div>

          <h2 className="successTitle">Order Confirmed</h2>
          <p className="successText">Thank you for your order!</p>

          {orderData?.order_code && (
            <div className="orderCodeBadge">
              Order ID: <strong>{orderData.order_code}</strong>
            </div>
          )}

          <div className="orderDeliveryInfo">
            <p className="orderDeliveryInfoText">
              Your order is being prepared and will be served directly to your table once ready. No further action is needed — please relax and we'll take care of the rest.
            </p>
          </div>

          {orderData?.items && orderData.items.length > 0 && (
            <div className="orderDetailsSection">
              <h3 className="orderDetailsTitle">Order Details</h3>
              <div className="orderItemsList">
                {orderData.items.map((item, index) => (
                  <div key={index} className="orderItemRow">
                    <div className="orderItemInfo">
                      <span className="orderItemName">{item.name}</span>
                      <span className="orderItemQty">× {item.quantity}</span>
                    </div>
                    <span className="orderItemPrice">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              {orderData.total_price && (
                <div className="orderTotalRow">
                  <span>Total Paid</span>
                  <span className="orderTotalAmount">₹{Math.round(orderData.total_price)}</span>
                </div>
              )}
            </div>
          )}

          <button className="successBtn" onClick={goToMenu}>
            Back to Menu
          </button>
        </div>
      </main>
    </div>
  );
}
