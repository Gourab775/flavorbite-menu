import { useEffect, useState } from "react";
import { useLocation, useSearch, useParams } from "wouter";
import { supabase } from "../lib/supabaseClient";
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

export function PaymentPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { tableId, orderId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const { restaurant } = useMenu();

  const [paymentApps, setPaymentApps] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedAppName, setSelectedAppName] = useState("");

  useEffect(() => {
    const fetchApps = async () => {
      const { data, error } = await supabase
        .from("payment_apps")
        .select("*");

      if (error) {
        console.error(error);
        return;
      }

      setPaymentApps(data);
    };

    fetchApps();
  }, []);

  const searchParams = new URLSearchParams(search);
  const orderCode = searchParams.get("code") ?? null;
  const amount = parseAmount(searchParams.get("amount"));

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

  const buildUpiLink = (paymentKey) => {
    if (!restaurant.paymentId || !amount || !orderCode) return "";
    const note = `Order #${orderCode}`;
    const baseLink = upiLinks[paymentKey] || upiLinks.upi;
    return `${baseLink}?pa=${encodeURIComponent(restaurant.paymentId)}&pn=${encodeURIComponent(restaurant.name)}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const handleAppSelect = (appKey, appName) => {
    setSelectedPayment(appKey);
    setSelectedAppName(appName);
  };

  const handlePay = () => {
    if (!selectedPayment) {
      alert("Select payment method");
      return;
    }

    if (!restaurant.paymentId) {
      alert("Payment ID not configured. Please contact the restaurant.");
      return;
    }
    if (!amount || !orderCode) {
      alert("Order data missing.");
      return;
    }

    const link = buildUpiLink(selectedPayment);
    console.log("Opening:", link);

    if (link) {
      navigate(`/t/${currentTableId}/online-waiting/${orderId}?code=${encodeURIComponent(orderCode)}`);
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
              {orderCode ? `#${orderCode}` : "—"}
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

        {paymentApps.length === 0 ? (
          <div className="paymentEmpty">
            <span>Loading payment options...</span>
          </div>
        ) : (
          <div className="paymentAppsGrid">
            {paymentApps.map((app) => {
              const appKey = app.app_key;
              const isSelected = selectedPayment === appKey;
              return (
              <button
                key={app.id}
                className={`paymentAppCard ${isSelected ? "selected" : ""}`}
                onClick={() => handleAppSelect(appKey, app.app_name)}
                aria-pressed={isSelected}
              >
                <img
                  src={app.app_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.app_name)}&background=ff7a18&color=fff&size=80&bold=true`}
                  alt={app.app_name}
                  className="paymentAppLogo"
                />
                <span className="paymentAppName">{app.app_name}</span>
                {isSelected && (
                  <span className="paymentAppCheck" aria-hidden="true">✓</span>
                )}
              </button>
              );
            })}
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
