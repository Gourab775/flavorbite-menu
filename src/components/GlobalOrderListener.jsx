import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLocation } from "wouter";

export function GlobalOrderListener() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const stored = sessionStorage.getItem("orderData");
    if (!stored) return;

    let orderId;
    try {
      const parsed = JSON.parse(stored);
      orderId = parsed.orderId;
    } catch {
      return;
    }

    if (!orderId) return;

    const channel = supabase
      .channel("global-order-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new?.status === "accepted") {
            const slug = location.split("/")[1] || "desi-spice-kitchen";
            setLocation(`/${slug}/order-confirmed`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location, setLocation]);

  return null;
}