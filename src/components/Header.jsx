import { useLocation, useParams } from "wouter";
import { useMenu } from "../hooks/useMenu";
import { getStoredSlug } from "../utils/constants";
import { HamburgerMenu } from "./HamburgerMenu";

export function Header() {
  const [, navigate] = useLocation();
  const { slug: urlSlug } = useParams();
  
  const slug = urlSlug || getStoredSlug();
  const { restaurant, restaurantLoading, restaurantError } = useMenu();

  const displayName = restaurant.name || (restaurantLoading ? "" : "Restaurant");
  const basePath = `/${slug}`;

  return (
    <header className="header">
      <button className="brand" onClick={() => navigate(basePath)} aria-label="Go to menu">
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
              <span className="brandSubtitle">Premium Dining</span>
            </>
          )}
          {restaurantError && !restaurantLoading && (
            <span className="brandError" title={restaurantError}>
              (offline)
            </span>
          )}
        </div>
      </button>

      <HamburgerMenu slug={slug} />
    </header>
  );
}