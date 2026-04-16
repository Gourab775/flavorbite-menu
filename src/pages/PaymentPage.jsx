import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { supabase } from "../lib/supabaseClient";
import { useMenu } from "../hooks/useMenu";
import { useMenuStore } from "../store/menuStore";
import { getStoredSlug } from "../utils/constants";

function parseStoredOrder() {
  if (typeof window === "undefined") return null;
  
  const saved = sessionStorage.getItem("orderData");
  if (!saved) return null;
  
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

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
  const { paymentToken: urlToken, slug: urlSlug } = useParams();
  const storedSlug = getStoredSlug();
  const slug = urlSlug || storedSlug;

  const { restaurant, loading: menuLoading } = useMenu();
  const { loadMenu } = useMenuStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [paymentApps, setPaymentApps] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedAppName, setSelectedAppName] = useState("");

  const basePath = `/${slug}`;

  useEffect(() => {
    if (slug && !restaurant.id) {
      loadMenu(slug);
    }
  }, [slug, restaurant.id, loadMenu]);

  useEffect(() => {
    const fetchApps = async () => {
      const { data, error } = await supabase
        .from("payment_apps")
        .select("*");

      if (!error && data) {
        setPaymentApps(data);
      }
    };

    fetchApps();
  }, []);

  useEffect(() => {
    const storedOrder = parseStoredOrder();
    
    if (storedOrder) {
      setOrderData({
        orderId: storedOrder.orderId,
        orderCode: storedOrder.orderCode,
        amount: storedOrder.amount,
      });
    } else if (!urlToken) {
      setError("No order found. Please start from checkout.");
    } else {
      setError("Order data not found. Please try again.");
    }
  }, [urlToken]);

  const navigate = (to) => {
    if (to === -1) {
      setLocation(basePath + "/cart");
    } else {
      setLocation(to);
    }
  };

  const redirect = (msg) => {
    setError(msg);
    setTimeout(() => {
      navigate(basePath + "/cart");
    }, 2000);
  };

  const handleAppSelect = (appKey, appName) => {
    setSelectedPayment(appKey);
    setSelectedAppName(appName);
  };

  const handlePay = () => {
    if (!selectedPayment) {
      setError("Please select a payment method");
      return;
    }
    if (!restaurant.paymentId) {
      setError("Payment not configured. Contact restaurant.");
      return;
    }
    if (!orderData?.amount || !orderData?.orderCode) {
      setError("Order data missing.");
      return;
    }

    const note = `Order #${orderData.orderCode}`;
    const upiLink = `upi://pay?pa=${encodeURIComponent(restaurant.paymentId)}&pn=${encodeURIComponent(restaurant.name)}&am=${encodeURIComponent(Math.round(orderData.amount))}&cu=INR&tn=${encodeURIComponent(note)}`;

    const waitPath = `${basePath}/online-waiting/${orderData.orderId}?code=${encodeURIComponent(orderData.orderCode)}`;

    window.location.href = upiLink;

    setTimeout(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      window.location.href = waitPath;
    }, 2000);
  };

  const handleCancel = async () => {
    navigate(basePath + "/cart");
  };

  if (loading || menuLoading) {
    return (
      <div className="paymentPage">
        <header className="paymentHeader">
          <button className="iconBtn pressable" onClick={handleCancel}>←</button>
          <h1 className="paymentTitle">Loading...</h1>
          <div style={{ width: 38 }} />
        </header>
        <main className="paymentBody">
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            Loading payment...
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="paymentPage">
        <header className="paymentHeader">
          <button className="iconBtn pressable" onClick={handleCancel}>←</button>
          <h1 className="paymentTitle">Error</h1>
          <div style={{ width: 38 }} />
        </header>
        <main className="paymentBody">
          <div style={{ textAlign: "center", padding: "40px", color: "#ef4444" }}>
            {error}
          </div>
        </main>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="paymentPage">
        <header className="paymentHeader">
          <button className="iconBtn pressable" onClick={handleCancel}>←</button>
          <h1 className="paymentTitle">Payment</h1>
          <div style={{ width: 38 }} />
        </header>
        <main className="paymentBody">
          <div style={{ textAlign: "center", padding: "40px" }}>
            Loading order...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="paymentPage">
      <header className="paymentHeader">
        <button className="iconBtn pressable" onClick={handleCancel}>←</button>
        <h1 className="paymentTitle">Complete Payment</h1>
        <div style={{ width: 38 }} />
      </header>

      <main className="paymentBody">
        <div className="orderSummaryCard">
          <div className="orderSummaryRow">
            <span className="orderSummaryLabel">Order ID</span>
            <span className="orderSummaryValue">
              {orderData?.orderCode ? `#${orderData.orderCode}` : "—"}
            </span>
          </div>
          <div className="orderSummaryDivider" />
          <div className="orderSummaryRow">
            <span className="orderSummaryLabel">Amount to pay</span>
            <span className="orderSummaryAmount">₹{Math.round(orderData?.amount || 0)}</span>
          </div>
          {selectedAppName && (
            <p className="orderSummaryMethod">via {selectedAppName}</p>
          )}
        </div>

        <h2 className="paymentSectionTitle">Select Payment App</h2>

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
          Pay ₹{Math.round(orderData?.amount || 0)}
        </button>
      </div>
    </div>
  );
}