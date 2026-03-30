import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { supabase } from "../lib/supabaseClient";

export function OnlineWaitingPage() {
  const [, navigate] = useLocation();
  const { tableId, orderId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;

  const [timeLeft, setTimeLeft] = useState(120);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel("online-payment-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_orders",
        },
        (payload) => {
          console.log("[OnlineWaiting] Order update:", payload.new);
          if (payload.new.id === orderId && payload.new.status === "accepted") {
            navigate(`/t/${currentTableId}/order-confirmed`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, navigate, currentTableId]);

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
    navigate(`/t/${currentTableId}`);
  };

  return (
    <div className="pageLayout">
      <header className="topBar">
        <h1 className="topBarTitle">Payment Status</h1>
      </header>

      <main className="checkoutBody hideScrollbar" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: "64px", marginBottom: "24px" }}>⏳</div>
        <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "16px" }}>
          Waiting for Payment Confirmation
        </h2>
        <p style={{ color: "#666", fontSize: "16px", marginBottom: "8px" }}>
          Order ID: <strong>{orderId}</strong>
        </p>
        <p style={{ color: "#ff7a18", fontSize: "16px", marginBottom: "24px" }}>
          Time remaining: {formatTime(timeLeft)}
        </p>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>
          Processing your payment. Please wait...
        </p>
        <p style={{ color: "#999", fontSize: "13px", maxWidth: "300px", lineHeight: "1.5" }}>
          If you have completed payment, please wait for confirmation.
          If payment is done but order is not confirmed, contact the manager.
        </p>

        <button
          onClick={handleCancel}
          style={{ marginTop: "32px", background: "none", border: "none", color: "#999", fontSize: "14px", textDecoration: "underline", cursor: "pointer" }}
        >
          Cancel Order
        </button>
      </main>

      {showCancelModal && (
        <div style={{
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
        }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", maxWidth: "320px", textAlign: "center" }}>
            <p style={{ fontSize: "16px", marginBottom: "24px" }}>
              If your payment is completed, your order will be automatically confirmed.
            </p>
            <button
              onClick={handleCancelConfirm}
              style={{
                background: "#ff7a18",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "12px 32px",
                fontSize: "16px",
                cursor: "pointer"
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
