import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useMenu } from "../hooks/useMenu";
import { getTableData, getOrCreateDeviceOrderCode, getValidDeviceSession } from "../utils/session";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { Toast } from "../components/Toast";
import { Bell, CheckCircle } from "lucide-react";

function isValidUUID(val) {
  if (!val || typeof val !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

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
      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Service not configured. Please contact support.");
      }

      if (!isValidUUID(restaurant.id)) {
        throw new Error(`Invalid restaurant_id: ${restaurant.id}`);
      }

      if (!isValidUUID(tableData.id)) {
        throw new Error(`Invalid table_id: ${tableData.id}`);
      }

      const session = getValidDeviceSession();
      const orderCode = getOrCreateDeviceOrderCode();
      const sessionOrderId = session?.id ?? null;

      const payload = {
        restaurant_id: restaurant.id,
        table_id: tableData.id,
        status: "pending",
        order_code: orderCode ?? null,
        session_order_id: sessionOrderId,
      };

      console.log("[WaiterCall] Inserting waiter call payload:", JSON.stringify(payload, null, 2));

      const { error: insertErr } = await supabase
        .from("waiter_calls")
        .insert(payload);

      if (insertErr) {
        console.error("[WaiterCall] Insert error:", insertErr);
        console.error("[WaiterCall] Failed payload:", JSON.stringify(payload, null, 2));
        throw new Error(`Failed to call waiter: ${insertErr.message}`);
      }

      console.log("[WaiterCall] Successfully inserted waiter call for table:", payload.table_id);

      setCalled(true);
      setToastMsg("");
    } catch (err) {
      console.error("[WaiterCall] Error:", err);
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
