import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useMenu } from "../hooks/useMenu";
import { getTableData } from "../utils/session";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { Bell, CheckCircle } from "lucide-react";

export function CallWaiterPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;
  const { restaurant } = useMenu();
  const [called, setCalled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCallWaiter = async () => {
    if (called || loading) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase && restaurant?.id) {
        const tableData = getTableData();
        await supabase.from("waiter_calls").insert({
          restaurant_id: restaurant.id,
          table_id: tableData?.id || null,
          table_number: tableData?.table_number || null,
          status: "pending",
        });
      }
    } catch {
      // silently fallback
    }
    setCalled(true);
    setLoading(false);
  };

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={() => navigate(basePath)} aria-label="Back">
          ←
        </button>
        <h1 className="topBarTitle">Call Waiter</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="callWaiterBody">
        {called ? (
          <div className="callWaiterSuccess">
            <div className="callWaiterIconWrap success">
              <CheckCircle size={48} />
            </div>
            <h2 className="callWaiterTitle">Waiter Called!</h2>
            <p className="callWaiterSub">A staff member will be with you shortly.</p>
            <button className="btn primary pressable" onClick={() => navigate(basePath)} style={{ marginTop: 24, width: "100%", maxWidth: 240, padding: "14px 0" }}>
              Back to Menu
            </button>
          </div>
        ) : (
          <div className="callWaiterPrompt">
            <div className="callWaiterIconWrap">
              <Bell size={48} />
            </div>
            <h2 className="callWaiterTitle">Need Assistance?</h2>
            <p className="callWaiterSub">Tap the button below to call a waiter to your table.</p>
            <button
              className="callWaiterBtn pressable"
              onClick={handleCallWaiter}
              disabled={loading}
            >
              {loading ? "Calling..." : "Call Waiter"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
