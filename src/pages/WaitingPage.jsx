import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { supabase } from "../lib/supabaseClient";

export function WaitingPage() {
  const [, navigate] = useLocation();
  const { tableId, orderId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const [order, setOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

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

      <main className="checkoutBody hideScrollbar" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: "64px", marginBottom: "24px" }}>⏳</div>
        <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "16px" }}>
          Please pay at the counter to confirm your order
        </h2>
        {order?.order_code && (
          <p style={{ color: "#666", fontSize: "16px" }}>
            Order ID: <strong>{order.order_code}</strong>
          </p>
        )}
        <p style={{ color: "#999", fontSize: "14px", marginTop: "32px" }}>
          Waiting for confirmation...
        </p>

        <button
          onClick={handleCancel}
          style={{ marginTop: "32px", background: "none", border: "2px solid #dc3545", borderRadius: "8px", color: "#dc3545", fontSize: "14px", fontWeight: "600", padding: "10px 20px", cursor: "pointer" }}
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
          </div>
        </div>
      )}
    </div>
  );
}
