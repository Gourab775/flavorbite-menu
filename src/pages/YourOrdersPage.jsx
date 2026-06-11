import { useEffect } from "react";
import { useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useGoBack } from "../context/NavigationContext";
import { useMenu } from "../hooks/useMenu";
import { getDeviceSessionOrders, markDeviceSessionOrdersRead } from "../utils/session";
import { ClipboardList } from "lucide-react";

export function YourOrdersPage() {
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;
  const { restaurant } = useMenu();

  useEffect(() => {
    markDeviceSessionOrdersRead();
  }, []);

  const goBack = useGoBack(`${basePath}/menu`);
  const goBackToMenu = useGoBack(basePath);

  const orders = getDeviceSessionOrders();
  const sortedOrders = orders.slice().reverse();

  const grouped = {};
  sortedOrders.forEach((order) => {
    const code = order.order_code || "unknown";
    if (!grouped[code]) {
      grouped[code] = {
        order_code: code,
        order_type: order.order_type,
        items: [],
        total: 0,
        savedAt: order.savedAt,
      };
    }
    grouped[code].items.push(...(order.items || []));
    grouped[code].total += Math.round(order.total_price || 0);
  });

  const groups = Object.values(grouped).map((group) => {
    const merged = {};
    group.items.forEach((item) => {
      const key = item.name;
      if (merged[key]) {
        merged[key].quantity += item.quantity;
      } else {
        merged[key] = { ...item };
      }
    });
    return { ...group, items: Object.values(merged) };
  });

  groups.sort((a, b) => b.savedAt - a.savedAt);

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={goBack} aria-label="Back">
          ←
        </button>
        <h1 className="topBarTitle">Your Orders</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="yourOrdersBody hideScrollbar">
        {groups.length > 0 ? (
          <div className="ordersContainer">
            {groups.map((group, idx) => (
              <div className="orderCard" key={idx}>
                <div className="orderCardHeader">
                  <div className="orderCardCode">{group.order_code}</div>
                  {group.order_type && (
                    <span className={`orderTypeLabel ${group.order_type}`}>
                      {group.order_type === 'dine_in' ? 'Dine-In' : 'Takeout'}
                    </span>
                  )}
                </div>
                <div className="orderCardRestaurant">{restaurant?.name || "Restaurant"}</div>
                <div className="orderCardItems">
                  {group.items.map((item, iidx) => (
                    <div className="orderCardItem" key={iidx}>
                      <span className="orderCardItemName">{item.name}</span>
                      <span className="orderCardItemQty">×{item.quantity}</span>
                      <span className="orderCardItemPrice">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="orderCardTotal">
                  <span>Total</span>
                  <span>₹{group.total}</span>
                </div>
              </div>
            ))}
            <button
              className="btn primary pressable"
              onClick={goBackToMenu}
              style={{ marginTop: 16, width: "100%", padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              Back to Menu
            </button>
          </div>
        ) : (
          <div className="emptyWrap">
            <div className="emptyIllo" aria-hidden="true"><ClipboardList size={48} strokeWidth={1} opacity={0.3} /></div>
            <h2 className="emptyTitle">No orders yet</h2>
            <p className="emptySub">Your recent orders will appear here once you place them.</p>
            <button className="btn primary pressable" onClick={goBackToMenu} style={{ marginTop: 16 }}>
              Browse Menu
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
