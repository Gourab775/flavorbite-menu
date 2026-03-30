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
  upi: "upi://pay",
};

function getPaymentKey(appName) {
  const name = appName?.toLowerCase() || "";
  if (name.includes("google") || name.includes("gpay")) return "gpay";
  if (name.includes("phonepe")) return "phonepe";
  if (name.includes("paytm")) return "paytm";
  return "upi";
}

export function PaymentPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { tableId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const { restaurant } = useMenu();

  const [apps, setApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedAppName, setSelectedAppName] = useState("");

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
        .select("id, app_name, app_logo, payment_key");

      if (!error) {
        console.log("[PaymentPage] Apps:", data);
        const mappedApps = (data ?? []).map(app => ({
          ...app,
          payment_key: app.payment_key || getPaymentKey(app.app_name)
        }));
        setApps(mappedApps);
      } else {
        console.error("[PaymentPage] Apps error:", error);
      }

      setLoadingApps(false);
    };

    fetchApps();
  }, []);

  const buildUpiLink = (paymentKey) => {
    if (!restaurant.paymentId || !amount || !orderId) return "";
    const note = `Order #${orderId}`;
    const baseLink = upiLinks[paymentKey] || upiLinks.upi;
    return `${baseLink}?pa=${encodeURIComponent(restaurant.paymentId)}&pn=${encodeURIComponent(restaurant.name)}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const handleAppSelect = (app) => {
    setSelectedPayment(app.payment_key);
    setSelectedAppName(app.app_name);
  };

  const handlePay = () => {
    if (!selectedPayment) {
      alert("Select payment method");
      return;
    }

    console.log("Selected:", selectedPayment);

    if (!restaurant.paymentId) {
      alert("Payment ID not configured. Please contact the restaurant.");
      return;
    }
    if (!amount || !orderId) {
      alert("Order data missing.");
      return;
    }

    const link = buildUpiLink(selectedPayment);
    console.log("Opening:", link);

    if (link) {
      navigate(`/t/${currentTableId}/online-waiting/${orderId}`);
      setTimeout(() => { window.location.href = link; }, 100);
    }
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
                className={`paymentAppCard ${selectedPayment === app.payment_key ? "selected" : ""}`}
                onClick={() => handleAppSelect(app)}
                aria-pressed={selectedPayment === app.payment_key}
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
                {selectedPayment === app.payment_key && (
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
          className={`paymentContinueBtn pressable ${selectedPayment ? "active" : ""}`}
          disabled={!selectedPayment}
          onClick={handlePay}
        >
          Pay ₹{Math.round(amount)}
          {selectedAppName && (
            <span className="paymentContinueAmount">via {selectedAppName}</span>
          )}
        </button>
      </div>
    </div>
  );
}
