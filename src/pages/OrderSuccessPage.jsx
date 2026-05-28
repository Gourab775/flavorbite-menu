import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useGoBack } from "../context/NavigationContext";

export function OrderSuccessPage() {
  const { slug: urlSlug } = useParams();

  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;

  const [orderData, setOrderData] = useState(null);
  const [showAnim, setShowAnim] = useState(true);

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
    if (showAnim) {
      const timer = setTimeout(() => setShowAnim(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showAnim]);

  const goToMenu = useGoBack(`${basePath}/menu`);

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

          {orderData?.items && orderData.items.length > 0 && (
            <div className="orderDetailsSection">
              <h3 className="orderDetailsTitle">Order Details</h3>
              <div className="orderItemsList">
                {orderData.items.map((item, index) => (
                  <div key={index} className="orderItemRow">
                    <div className="orderItemInfo">
                      <span className="orderItemName">{item.name}</span>
                      <span className="orderItemQty">× {item.quantity}</span>
                    </div>
                    <span className="orderItemPrice">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              {orderData.total_price && (
                <div className="orderTotalRow">
                  <span>Total</span>
                  <span className="orderTotalAmount">₹{Math.round(orderData.total_price)}</span>
                </div>
              )}
            </div>
          )}

          <button className="successBtn" onClick={goToMenu}>
            Back to Menu
          </button>
        </div>
      </main>
    </div>
  );
}
