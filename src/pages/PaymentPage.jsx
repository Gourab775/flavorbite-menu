import { useEffect, useState } from "react";
import { useLocation, useSearch, useParams } from "wouter";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { useMenu } from "../hooks/useMenu";

function parseAmount(raw) {
  const n = Number(raw);
  return isNaN(n) ? 0 : n;
}

const upiLinks = {
  gpay: "upi://pay",
  phonepe: "phonepe://pay",
  paytm: "paytmmp://pay",
  other: "upi://pay",
};

export function PaymentPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { tableId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const { restaurant } = useMenu();

  const [apps, setApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  const params = new URLSearchParams(search);
  const orderId = params.get("orderId") ?? null;
  const amount = parseAmount(params.get("amount"));

  useEffect(() => {
    console.log("[PaymentPage] orderId:", orderId, "amount:", amount);
  }, [orderId, amount]);

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel("payment-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_orders",
        },
        (payload) => {
          console.log("[PaymentPage] Order update:", payload.new);
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

  useEffect(() => {
    const fetchApps = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setLoadingApps(false);
        return;
      }

      const { data, error } = await supabase
        .from("payment_apps")
        .select("id, app_name, app_logo");

      if (!error) {
        console.log("[PaymentPage] Apps:", data);
        setApps(data ?? []);
      } else {
        console.error("[PaymentPage] Apps error:", error);
      }

      setLoadingApps(false);
    };

    fetchApps();
  }, []);

  const buildUpiLink = (appName) => {
    if (!restaurant.paymentId || !amount || !orderId) return "";
    const note = `Order #${orderId}`;
    const baseLink = upiLinks[appName?.toLowerCase()] || upiLinks.other;
    return `${baseLink}?pa=${encodeURIComponent(restaurant.paymentId)}&pn=${encodeURIComponent(restaurant.name)}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const handleAppSelect = (app) => {
    setSelectedApp(app);
  };

  const handlePay = () => {
    if (!selectedApp) return;

    setIsPaying(true);

    if (!restaurant.paymentId) {
      alert("Payment ID not configured. Please contact the restaurant.");
      return;
    }
    if (!amount || !orderId) {
      alert("Order data missing.");
      return;
    }

    const link = buildUpiLink(selectedApp.app_name);
    console.log("[PaymentPage] Opening UPI:", link);
    setTimeout(() => { window.location.href = link; }, 0);
  };

  return (
    <div className="paymentPage">
      <header className="paymentHeader">
        <button
          className="iconBtn pressable"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className="paymentTitle">Complete Payment</h1>
        <div style={{ width: 38 }} />
      </header>

      <main className="paymentBody">
        <div className="orderSummaryCard">
          <div className="orderSummaryRow">
            <span className="orderSummaryLabel">Order ID</span>
            <span className="orderSummaryValue">
              {orderId ? `#${orderId}` : "—"}
            </span>
          </div>
          <div className="orderSummaryDivider" />
          <div className="orderSummaryRow">
            <span className="orderSummaryLabel">Amount to pay</span>
            <span className="orderSummaryAmount">₹{Math.round(amount)}</span>
          </div>
          <p className="orderSummaryNote">Tap an app to pay directly</p>
        </div>

        <h2 className="paymentSectionTitle"> Select Payment App</h2>

        {loadingApps ? (
          <div className="paymentLoading">
            <span>Loading payment options…</span>
          </div>
        ) : apps.length === 0 ? (
          <div className="paymentEmpty">
            <span>No payment options available</span>
          </div>
        ) : (
          <div className="paymentAppsGrid">
            {apps.map((app) => (
              <button
                key={app.id}
                className={`paymentAppCard ${selectedApp?.id === app.id ? "selected" : ""}`}
                onClick={() => handleAppSelect(app)}
                aria-pressed={selectedApp?.id === app.id}
              >
                <img
                  src={app.app_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.app_name)}&background=ff7a18&color=fff&size=80&bold=true`}
                  alt={app.app_name}
                  className="paymentAppLogo"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.app_name)}&background=ff7a18&color=fff&size=80&bold=true`;
                  }}
                />
                <span className="paymentAppName">{app.app_name}</span>
                {selectedApp?.id === app.id && (
                  <span className="paymentAppCheck" aria-hidden="true">✓</span>
                )}
              </button>
            ))}
          </div>
        )}

        {restaurant.paymentId && (
          <p className="upiIdNote">Pay to: {restaurant.paymentId}</p>
        )}
      </main>

      <div className="paymentFooter">
        <button
          className={`paymentContinueBtn pressable ${selectedApp ? "active" : ""}`}
          disabled={!selectedApp || isPaying}
          onClick={handlePay}
        >
          Pay ₹{Math.round(amount)}
          {selectedApp && (
            <span className="paymentContinueAmount">via {selectedApp.app_name}</span>
          )}
        </button>

        {isPaying && (
          <div className="payment-loading" style={{ textAlign: "center", padding: "16px", color: "#666" }}>
            <div className="btnSpinner" style={{ margin: "0 auto 8px" }} />
            <p style={{ margin: 0, fontSize: "14px" }}>Processing your payment. Please wait...</p>
          </div>
        )}
      </div>
    </div>
  );
}
