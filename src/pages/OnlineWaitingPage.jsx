import { useEffect, useState, useRef } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { supabase } from "../lib/supabaseClient";
import { useMenu } from "../hooks/useMenu";
import { useMenuStore } from "../store/menuStore";
import { getStoredSlug, getStoredTableId } from "../utils/constants";
import lottie from "lottie-web";
import animationData from "../assets/animations/loading.json";

export function OnlineWaitingPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { slug: urlSlug, tableId: urlTableId, orderId } = useParams();
  
  const slug = urlSlug || getStoredSlug();
  const tableId = urlTableId || getStoredTableId();
  const { restaurant } = useMenu();
  const { loadMenu } = useMenuStore();

  useEffect(() => {
    if (slug && !restaurant.id) {
      loadMenu(slug);
    }
  }, [slug, restaurant.id, loadMenu]);

  const searchParams = new URLSearchParams(search);
  const orderCode = searchParams.get("code");

  const [timeLeft, setTimeLeft] = useState(120);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [phone, setPhone] = useState("");
  const animationRef = useRef(null);
  const containerRef = useRef(null);

  // Build base path with optional table
  const basePath = tableId ? `/${slug}/t/${tableId}` : `/${slug}`;

  useEffect(() => {
    const fetchPhone = async () => {
      if (!restaurant.id) return;
      const { data } = await supabase
        .from("restaurants")
        .select("contact_number")
        .eq("id", restaurant.id)
        .single();

      if (data?.contact_number) {
        setPhone(data.contact_number);
      }
    };

    fetchPhone();
  }, [restaurant.id]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel("order-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_orders" },
        (payload) => {
          if (payload.new.id === orderId && payload.new.status === "accepted") {
            navigate(`${basePath}/order-confirmed`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, navigate, basePath]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelModal(false);
    localStorage.removeItem("qr_menu_cart");
    localStorage.removeItem("notes");
    sessionStorage.removeItem("orderData");
    sessionStorage.removeItem("cart_order_note");
    window.dispatchEvent(new Event("cart-cleared"));
    navigate(basePath);
  };

  useEffect(() => {
    if (containerRef.current && !animationRef.current) {
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: animationData
      });
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, []);

  return (
    <div className="pageLayout">
      <header className="topBar">
        <h1 className="topBarTitle">Payment Status</h1>
      </header>

      <main className="checkoutBody hideScrollbar">
        <div className="onlineWaitingContent">
          <div className="onlineWaitingAnimation">
            <div ref={containerRef} />
          </div>
          <h2 className="onlineWaitingTitle">Waiting for Payment Confirmation</h2>
          <p className="onlineWaitingOrderId">
            Order ID: <strong>{orderCode || orderId}</strong>
          </p>
          <p className="onlineWaitingTimer">
            Time remaining: {formatTime(timeLeft)}
          </p>
          <p className="onlineWaitingSubtext">
            Processing your payment. Please wait...
          </p>
          <p className="onlineWaitingHelp">
            If you have completed payment, please wait for confirmation.
            If payment is done but order is not confirmed, contact the manager.
          </p>

          <button
            className="onlineWaitingCancelBtn pressable"
            onClick={handleCancel}
          >
            Cancel Order
          </button>

          <p className="onlineWaitingContact">
            Still not confirmed after 2 minutes?{" "}
            {phone && (
              <span
                className="onlineWaitingContactLink"
                onClick={() => window.location.href = `tel:${phone}`}
              >
                Contact us
              </span>
            )}
          </p>
        </div>
      </main>

      {showCancelModal && (
        <div 
          className="modalOverlay"
          onClick={() => setShowCancelModal(false)}
        >
          <div 
            className="modalContent"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="modalText">
              If your payment is completed, your order will be automatically confirmed.
            </p>
            <button
              className="modalConfirmBtn pressable"
              onClick={handleCancelConfirm}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
