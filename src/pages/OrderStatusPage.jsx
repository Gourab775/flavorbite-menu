import { useEffect, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { useMenuStore } from "../store/menuStore";
import { getStoredSlug } from "../utils/constants";

export function OrderStatusPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug, tableId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const slug = urlSlug || getStoredSlug();
  const { loadMenu } = useMenuStore();

  useEffect(() => {
    if (slug) {
      loadMenu(slug);
    }
  }, [slug, loadMenu]);
  
  const [lastOrderId] = useState(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("last_order_id");
  });

  useEffect(() => {
    if (!lastOrderId || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel(`order-${lastOrderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          table: "live_orders",
          filter: `id=eq.${lastOrderId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          
          if (newStatus === "accepted") {
            navigate(`/${slug}/t/${currentTableId}/order-confirmed`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lastOrderId, navigate, currentTableId]);

  const goToMenu = useCallback(() => {
    navigate(`/${slug}/t/${currentTableId}`);
  }, [navigate, currentTableId, slug]);

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={goToMenu} aria-label="Back to menu">
          ←
        </button>
        <h1 className="topBarTitle">Order Status</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="emptyWrap">
        <div className="emptyIllo" aria-hidden="true">
          ⏳
        </div>
        <h2 className="emptyTitle">Order Placed</h2>
        <p className="emptySub">
          Your order is being prepared.<br />
          Please complete payment at the counter.
        </p>
        {lastOrderId && (
          <p className="muted" style={{ marginTop: 16 }}>
            Order ID: {lastOrderId.slice(0, 8)}...
          </p>
        )}
        <button className="btn primary pressable" onClick={goToMenu} style={{ marginTop: 24 }}>
          Back to Menu
        </button>
      </main>
    </div>
  );
}
