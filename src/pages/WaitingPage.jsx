import { useEffect, useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { supabase } from "../lib/supabaseClient";
import Lottie from "lottie-react";
import loadingAnimation from "../assets/animations/loading.json";
import { motion } from "framer-motion";

export function WaitingPage() {
  const [, navigate] = useLocation();
  const { tableId, orderId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const [order, setOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const lottieData = useMemo(() => loadingAnimation, []);

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
    console.log("Cart cleared after cancel");
    navigate(`/t/${currentTableId}`);
  };

  useEffect(() => {
    const channel = supabase
      .channel("order-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_orders",
        },
        (payload) => {
          if (payload.new.id === orderId && payload.new.status === "accepted") {
            navigate(`/t/${currentTableId}/order-confirmed`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, currentTableId, navigate]);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from("live_orders")
        .select("id, order_code")
        .eq("id", orderId)
        .single();
      setOrder(data);
    };
    fetchOrder();
  }, [orderId]);

  return (
    <div className="pageLayout">
      <header className="topBar">
        <h1 className="topBarTitle">Order Status</h1>
      </header>

      <motion.main 
        className="checkoutBody hideScrollbar"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 20px", minHeight: "calc(100vh - 120px)" }}
      >
        <div style={{ width: "180px", height: "180px", marginBottom: "24px" }}>
          <Lottie 
            animationData={lottieData} 
            loop={true}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{ fontSize: "24px", fontWeight: "600", marginBottom: "16px", color: "#1f1f1f" }}
        >
          Waiting for restaurant confirmation...
        </motion.h2>
        
        {order?.order_code && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            style={{ color: "#666", fontSize: "16px", marginTop: "8px" }}
          >
            Order ID: <strong>{order.order_code}</strong>
          </motion.p>
        )}
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          style={{ color: "#999", fontSize: "14px", marginTop: "32px", maxWidth: "280px" }}
        >
          Please do not refresh or leave this page
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          onClick={handleCancel}
          style={{ marginTop: "32px", background: "none", border: "2px solid #dc3545", borderRadius: "8px", color: "#dc3545", fontSize: "14px", fontWeight: "600", padding: "10px 20px", cursor: "pointer" }}
        >
          Cancel Order
        </motion.button>
      </motion.main>

      {showCancelModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ background: "#fff", borderRadius: "12px", padding: "24px", maxWidth: "320px", textAlign: "center" }}
          >
            <p style={{ fontSize: "16px", marginBottom: "24px" }}>
              Are you sure you want to cancel this order?
            </p>
            <button
              onClick={handleCancelConfirm}
              style={{
                background: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "12px 32px",
                fontSize: "16px",
                cursor: "pointer"
              }}
            >
              Yes, Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
