import { useLocation, useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useMenu } from "../hooks/useMenu";

export function YourOrdersPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;
  const { restaurant } = useMenu();

  const pendingOrder = (() => {
    try {
      const raw = sessionStorage.getItem("pending_order");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={() => navigate(basePath)} aria-label="Back">
          ←
        </button>
        <h1 className="topBarTitle">Your Orders</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="yourOrdersBody hideScrollbar">
        {pendingOrder ? (
          <div className="ordersContainer">
            <div className="orderCard">
              <div className="orderCardHeader">
                <div className="orderCardCode">{pendingOrder.order_code}</div>
                <span className="orderCardStatus pending">Pending</span>
              </div>
              <div className="orderCardRestaurant">{restaurant?.name || "Restaurant"}</div>
              <div className="orderCardItems">
                {pendingOrder.items?.map((item, idx) => (
                  <div className="orderCardItem" key={idx}>
                    <span className="orderCardItemName">{item.name}</span>
                    <span className="orderCardItemQty">×{item.quantity}</span>
                    <span className="orderCardItemPrice">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="orderCardTotal">
                <span>Total</span>
                <span>₹{Math.round(pendingOrder.total_price || 0)}</span>
              </div>
              <div className="orderCardNote">
                {pendingOrder.note && <p>Note: {pendingOrder.note}</p>}
              </div>
            </div>
            <button className="btn primary pressable" onClick={() => navigate(basePath)} style={{ marginTop: 16, width: "100%", padding: "14px 0" }}>
              Back to Menu
            </button>
          </div>
        ) : (
          <div className="emptyWrap">
            <div className="emptyIllo" aria-hidden="true" style={{ fontSize: 48 }}>📋</div>
            <h2 className="emptyTitle">No orders yet</h2>
            <p className="emptySub">Your recent orders will appear here once you place them.</p>
            <button className="btn primary pressable" onClick={() => navigate(basePath)} style={{ marginTop: 16 }}>
              Browse Menu
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
