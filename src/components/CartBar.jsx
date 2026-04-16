import { useRoute, useLocation } from "wouter";
import { useCart } from "../hooks/useCart";
import { getStoredSlug } from "../utils/constants";

export function CartBar() {
  const [isMenuRoute, params] = useRoute("/:slug");
  const [location] = useLocation();
  const { totalItems, grandTotal } = useCart();

  const slug = params?.slug || getStoredSlug();

  if (!slug) return null;
  if (totalItems === 0) return null;
  if (!isMenuRoute) return null;

  const cleanPath = location?.replace(/\/+$/, "") || "";
  if (cleanPath !== `/${slug}`) return null;

  const basePath = `/${slug}`;

  const handleClick = (e) => {
    e.preventDefault();
    window.location.href = `${basePath}/cart`;
  };

  return (
    <div className="cartBarOuter cartBarOuter--visible">
      <div className="cartBar" onClick={handleClick}>
        <div className="cartBarLeft">
          <div className="cartBarIcon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <div className="cartBarInfo">
            <span className="cartBarCount">{totalItems} item{totalItems === 1 ? "" : "s"}</span>
            <span className="cartBarAmt">₹{Math.round(grandTotal)}</span>
          </div>
        </div>
        <span className="cartBarCta">
          View Cart
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </div>
  );
}