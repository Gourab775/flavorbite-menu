import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import lottie from "lottie-web";
import successAnimation from "../assets/animations/Success.json";
import { getStoredSlug, getStoredTableId } from "../utils/constants";

export function OrderConfirmedPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug, tableId: urlTableId, orderId: urlOrderId } = useParams();
  
  const slug = urlSlug || getStoredSlug();
  const tableId = urlTableId || getStoredTableId();

  const basePath = tableId ? `/${slug}/t/${tableId}` : `/${slug}`;

  const [orderCode, setOrderCode] = useState("");
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
    if (!orderId) return;
    const saved = sessionStorage.getItem("orderData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.orderCode) setOrderCode(parsed.orderCode);
      } catch { /* ignore */ }
    }
  }, [orderId]);

  const goToMenu = () => {
    navigate(basePath);
  };

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
          
          {orderCode && (
            <div className="orderCodeBadge">
              Order ID: <strong>{orderCode}</strong>
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
