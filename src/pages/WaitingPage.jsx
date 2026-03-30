import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { supabase } from "../lib/supabaseClient";

export function WaitingPage() {
  const [, navigate] = useLocation();
  const { tableId, orderId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const [order, setOrder] = useState(null);

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
      </main>
    </div>
  );
}
