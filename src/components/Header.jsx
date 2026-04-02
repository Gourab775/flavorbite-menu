import { useLocation, useParams } from "wouter";
import { useCart } from "../hooks/useCart";
import { useMenu } from "../hooks/useMenu";

export function Header() {
  const [, navigate] = useLocation();
  const { tableId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const { totalItems } = useCart();
  const { restaurant, restaurantLoading, restaurantError } = useMenu();

  const displayName = restaurant.name || (restaurantLoading ? "" : "Restaurant");

  return (
    <header className="header">
      <button className="brand" onClick={() => navigate(`/t/${currentTableId}`)} aria-label="Go to menu">
        <div className="brandLogoWrap">
          {restaurantLoading ? (
            <span className="brandLogoInitial" aria-hidden="true">
              <span className="brandSkeleton" />
            </span>
          ) : restaurant.logo ? (
            <img
              src={restaurant.logo}
              alt={displayName}
              className="brandLogoImg"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          {!restaurantLoading && !restaurant.logo && (
            <span className="brandLogoInitial" aria-hidden="true">
              {displayName.charAt(0)?.toUpperCase() ?? "R"}
            </span>
          )}
        </div>
        <div className="brandText">
          {restaurantLoading ? (
            <span className="brandNameSkeleton" aria-label="Loading restaurant name" />
          ) : (
            <>
              <span className="brandName">{displayName}</span>
            </>
          )}
          {restaurantError && !restaurantLoading && (
            <span className="brandError" title={restaurantError}>
              (offline)
            </span>
          )}
        </div>
      </button>

      <button
        className="cartBtn pressable"
        onClick={() => navigate(`/t/${currentTableId}/cart`)}
        aria-label={`Open cart — ${totalItems} item${totalItems === 1 ? "" : "s"}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        {totalItems > 0 && (
          <span className="cartBtnBadge" aria-live="polite">{totalItems}</span>
        )}
      </button>
    </header>
  );
}
