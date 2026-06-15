import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { supabase } from "../lib/supabaseClient";

export function OrderSuccessPage() {
  const { slug: urlSlug } = useParams();

  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;

  const [orderData, setOrderData] = useState(null);
  const [showAnim, setShowAnim] = useState(true);
  const [tableNumber, setTableNumber] = useState(null);

  useEffect(() => {
    localStorage.removeItem("qr_menu_cart");
    localStorage.removeItem("notes");
    sessionStorage.removeItem("cart_order_note");
    window.dispatchEvent(new Event("cart-cleared"));

    const pending = sessionStorage.getItem("pending_order");
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        setOrderData(parsed);
        sessionStorage.removeItem("pending_order");
      } catch {
        // ignore parse error
      }
    }
  }, []);

  useEffect(() => {
    if (orderData?.table_id) {
      supabase
        .from("restaurant_tables")
        .select("table_number")
        .eq("id", orderData.table_id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (data && !error) {
            setTableNumber(data.table_number);
          }
        })
        .catch(() => {});
    }
  }, [orderData?.table_id]);

  useEffect(() => {
    if (showAnim) {
      const timer = setTimeout(() => setShowAnim(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showAnim]);

  const [, navigate] = useLocation();
  const goToMenu = () => navigate(`${basePath}/menu`);

  const goToFeedback = () => {
    const params = new URLSearchParams();
    if (orderData?.restaurant_id) params.set("restaurant_id", orderData.restaurant_id);
    if (orderData?.order_code) params.set("order_id", orderData.order_code);
    if (orderData?.table_id) params.set("table_id", orderData.table_id);
    navigate(`${basePath}/feedback?${params.toString()}`);
  };

  const items = orderData?.items || [];

  const orderTypeLabel =
    orderData?.order_type === "takeaway" ? "Takeaway" : "Dine In";

  const total = orderData?.total_price ? Math.round(orderData.total_price) : 0;

  return (
    <div className="pageLayout">
      <header className="topBar">
        <h1 className="topBarTitle">Order Sent</h1>
      </header>
      <main className="orderSuccess">
        <div className="successContainer">
          <div className="successAnimationWrap">
            {showAnim ? (
              <div className="successAnimation">
                <div className="successCheckmark">
                  <svg viewBox="0 0 52 52" className="successCheckmarkSvg">
                    <circle className="successCheckmarkCircle" cx="26" cy="26" r="25" fill="none" />
                    <path className="successCheckmarkCheck" fill="none" d="M14.1 27.2l7.8 7.8c.8.8 2.1.2 2.1-.9V35c0-.6-.5-1.2-1.2-1.2h-1.5c-.7 0-1.2.5-1.2 1.2v1.5c0 1.1.9 1.5 1.5 1.5h1.5c.7 0 1.2-.5 1.2-1.2v-.7c0-.8.8-1.2 1.5-.4l.7.7c.4.4 1.1.4 1.5 0l8.1-8.1c.4-.4.4-1.1 0-1.5l-.7-.7c-.4-.4-1.1-.4-1.5 0l-6.2 6.2c-.5.5-1.4.2-1.4-.5V32h-1.5c-.7 0-1.2.5-1.2 1.2v1.5c0 .7.5 1.2 1.2 1.2H23c.7 0 1.2-.5 1.2-1.2V30.5c0-.7-.5-1.2-1.2-1.2h-1.5c-.7 0-1.2.5-1.2 1.2v.7z" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="successAnimationFallback">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </div>

          <h2 className="successTitle">Order Sent Successfully</h2>
          <p className="successText">Your order has been received and is being prepared.</p>

          {orderData?.order_code && (
            <div className="orderCodeBadge">
              Order ID: <strong>{orderData.order_code}</strong>
            </div>
          )}

          <div className="orderSuccessButtons">
            <button className="successBtn" onClick={goToMenu}>
              Back to Menu
            </button>
            <button className="successBtn successBtnOutline" onClick={goToFeedback}>
              Feedback / Rate Experience
            </button>
          </div>

          {items.length > 0 && (
            <div className="orderSummary">
              <div className="orderSummaryHeader">
                <span className="orderSummaryLine" />
                <h3 className="orderSummaryTitle">Order Summary</h3>
                <span className="orderSummaryLine" />
              </div>

              <div className="orderSummaryItems">
                {items.map((item, index) => (
                  <div key={index} className="orderSummaryRow">
                    <span className="orderSummaryQty">{item.quantity} ×</span>
                    <span className="orderSummaryName">{item.name}</span>
                  </div>
                ))}
              </div>

              <div className="orderSummaryDivider" />

              <div className="orderSummaryInfo">
                <div className="orderSummaryInfoRow">
                  <span className="orderSummaryLabel">Order Type</span>
                  <span className="orderSummaryValue">{orderTypeLabel}</span>
                </div>
                {tableNumber && (
                  <div className="orderSummaryInfoRow">
                    <span className="orderSummaryLabel">Table</span>
                    <span className="orderSummaryValue">{tableNumber}</span>
                  </div>
                )}
              </div>

              <div className="orderSummaryDivider" />

              <div className="orderSummaryTotal">
                <span>Total</span>
                <span className="orderSummaryTotalAmount">₹{total}</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
