import { useLocation, useParams } from "wouter";
import { useCart } from "../hooks/useCart";
import { getStoredSlug, getStoredTableId } from "../utils/constants";

export function CartBar() {
  const [location] = useLocation();
  const { slug: urlSlug, tableId: urlTableId } = useParams();
  const { totalItems, grandTotal } = useCart();

  const slug = urlSlug || getStoredSlug();
  const tableId = urlTableId || getStoredTableId();

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
  if (!slug) return null;

  // Build base path with optional table
  const basePath = tableId ? `/${slug}/t/${tableId}` : `/${slug}`;

  return (
    <div className="cartBarOuter cartBarOuter--visible">
      <button
        className="cartBar pressable"
        onClick={() => window.location.href = `${basePath}/cart`}
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
        <span className="cartBarCta">
          View Cart
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </button>
    </div>
  );
}
