import { useLocation, useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";

export function OrderSuccessPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug, tableId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const slug = urlSlug || getStoredSlug();

  return (
    <div className="orderSuccess fadeIn">
      <div className="successCard">
        <div className="successIcon" aria-hidden="true">
          <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="26" cy="26" r="26" fill="#22c55e" />
            <path
              d="M15 26.5L22.5 34L37 19"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="successTitle">Order Placed!</h2>
        <p className="successSub">
          Your order has been received and is being prepared. You can track it on the
          dashboard.
        </p>

        <div className="successDivider" />

        <button
          className="successBtn primary pressable"
          onClick={() => navigate(`/${slug}/t/${currentTableId}`)}
        >
          Browse Menu
        </button>
      </div>
    </div>
  );
}
