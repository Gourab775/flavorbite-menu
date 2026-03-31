import { useLocation, useParams } from "wouter";
import { useCart } from "../hooks/useCart";

export function CartBar() {
  const [location, navigate] = useLocation();
  const { tableId } = useParams();
  const { totalItems, grandTotal } = useCart();

  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;

  const isHidden =
    location?.includes("/cart") ||
    location?.includes("/checkout") ||
    location?.includes("/payment") ||
    location?.includes("/order-success") ||
    location?.includes("/online-waiting") ||
    location?.includes("/order-confirmed") ||
    location?.includes("/waiting");

  if (isHidden) return null;
  if (totalItems === 0) return null;
  if (!currentTableId) return null;

  return (
    <div className="cartBarOuter cartBarOuter--visible">
      <button
        className="cartBar pressable"
        onClick={() => navigate(`/t/${currentTableId}/cart`)}
        aria-label={`View cart — ${totalItems} item${totalItems === 1 ? "" : "s"}, ₹${Math.round(grandTotal)}`}
      >
        <div className="cartBarLeft">
          <span className="cartBarIcon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </span>
          <div>
            <div className="cartBarCount">{totalItems} item{totalItems === 1 ? "" : "s"}</div>
            <div className="cartBarAmt">₹{Math.round(grandTotal)}</div>
          </div>
        </div>
        <span className="cartBarCta">View Cart →</span>
      </button>
    </div>
  );
}
