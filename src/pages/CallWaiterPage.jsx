import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useMenu } from "../hooks/useMenu";
import { getTableData, getOrCreateDeviceOrderCode, getValidDeviceSession } from "../utils/session";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { Toast } from "../components/Toast";
import { Bell, CheckCircle } from "lucide-react";

const WAITER_COOLDOWN_MS = 30000;

export function CallWaiterPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;
  const { restaurant } = useMenu();
  const [called, setCalled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const handleCallWaiter = async () => {
    if (loading || called) return;

    const lastCall = localStorage.getItem("waiter_last_call");
    if (lastCall) {
      const elapsed = Date.now() - parseInt(lastCall, 10);
      if (elapsed < WAITER_COOLDOWN_MS) {
        const remaining = Math.ceil((WAITER_COOLDOWN_MS - elapsed) / 1000);
        setToastMsg(`Please wait ${remaining}s before calling again`);
        setToastType("info");
        return;
      }
    }

    if (!restaurant?.id) {
      setToastMsg("Restaurant data not loaded. Please try again.");
      setToastType("error");
      return;
    }

    const tableData = getTableData();
    if (!tableData?.id) {
      setToastMsg("Table not found. Please scan QR code again.");
      setToastType("error");
      return;
    }

    setLoading(true);

    try {
      const { data: existing, error: checkErr } = await supabase
        .from("waiter_calls")
        .select("id")
        .eq("table_id", tableData.id)
        .eq("status", "pending")
        .limit(1);

      if (checkErr) {
        throw new Error("Could not verify request. Please try again.");
      }

      if (existing && existing.length > 0) {
        setToastMsg("Waiter has already been called for your table.");
        setToastType("info");
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Service not configured. Please contact support.");
      }

      const session = getValidDeviceSession();
      const orderCode = getOrCreateDeviceOrderCode();

      const payload = {
        restaurant_id: restaurant.id,
        table_id: tableData.id,
        table_number: tableData.table_number || null,
        status: "pending",
      };

      if (orderCode) payload.order_code = orderCode;
      if (session?.id) payload.session_id = session.id;

      const { error: insertErr } = await supabase
        .from("waiter_calls")
        .insert(payload);

      if (insertErr) {
        throw new Error(`Failed to call waiter: ${insertErr.message}`);
      }

      localStorage.setItem("waiter_last_call", String(Date.now()));
      setCalled(true);
      setToastMsg("");
    } catch (err) {
      const msg = err?.message ?? "Something went wrong. Please try again.";
      setToastMsg(msg);
      setToastType("error");
    } finally {
      setLoading(false);
    }
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

      <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />
    </div>
  );
}
