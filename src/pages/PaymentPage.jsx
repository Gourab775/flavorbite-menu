import { useEffect, useState, useRef } from "react";
import { useLocation, useSearch, useParams } from "wouter";
import { supabase } from "../lib/supabaseClient";
import { useMenu } from "../hooks/useMenu";
import { useMenuStore } from "../store/menuStore";
import { getStoredSlug } from "../utils/constants";

function parseAmount(raw) {
  const n = Number(raw);
  return isNaN(n) ? 0 : n;
}

const upiLinks = {
  gpay: "upi://pay",
  phonepe: "phonepe://pay",
  paytm: "paytmmp://pay",
  bhim: "upi://pay",
  upi: "upi://pay",
};

function getAppKey(appName) {
  const name = appName?.toLowerCase() || "";
  if (name.includes("google")) return "gpay";
  if (name.includes("phonepe")) return "phonepe";
  if (name.includes("paytm")) return "paytm";
  if (name.includes("bhim")) return "bhim";
  return "upi";
}

export function PaymentPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { tableId, orderId: paramOrderId, slug: urlSlug } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const { restaurant } = useMenu();
  const { loadMenu } = useMenuStore();
  const slug = urlSlug || getStoredSlug();

  useEffect(() => {
    if (slug && !restaurant.id) {
      loadMenu(slug);
    }
  }, [slug, restaurant.id, loadMenu]);

  const searchParams = new URLSearchParams(search);
  let orderId = paramOrderId || searchParams.get("orderId");
  let orderCode = searchParams.get("code");
  let amount = parseAmount(searchParams.get("amount"));

  const savedData = typeof window !== "undefined" ? sessionStorage.getItem("orderData") : null;
  if ((!orderId || !amount) && savedData) {
    const parsed = JSON.parse(savedData);
    orderId = orderId || parsed.orderId;
    orderCode = orderCode || parsed.orderCode;
    amount = amount || parseAmount(parsed.amount);
  }

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
  }, []);

  const [paymentApps, setPaymentApps] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedAppName, setSelectedAppName] = useState("");

  const navigate = (to) => {
    if (to === -1) {
      window.history.back();
    } else {
      setLocation(to);
    };
  };

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
          if (payload.new.id === orderId && payload.new.status === "accepted") {
            navigate(`/${slug}/t/${currentTableId}/order-confirmed`);
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

    if (link) {
      navigate(`/${slug}/t/${currentTableId}/online-waiting/${orderId}?code=${encodeURIComponent(orderCode)}`);
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
          {selectedAppName && (
            <p className="orderSummaryMethod">via {selectedAppName}</p>
          )}
        </div>

        <h2 className="paymentSectionTitle"> Select Payment App</h2>

        {paymentApps.length === 0 ? (
          <div className="paymentEmpty">
            <span>Loading payment options...</span>
          </div>
        ) : (
          <div className="paymentAppsGrid">
            {paymentApps.map((app) => {
              const appKey = app.app_key || getAppKey(app.app_name);
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
        </button>
      </div>
    </div>
  );
}
