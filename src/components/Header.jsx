import { useLocation, useParams } from "wouter";
import { useMenu } from "../hooks/useMenu";
import { getStoredSlug } from "../utils/constants";
import { getTableData } from "../utils/session";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { useState, useEffect, useRef } from "react";

export function Header() {
  const [, navigate] = useLocation();
  const { slug: urlSlug } = useParams();
  
  const slug = urlSlug || getStoredSlug();
  const { restaurant, restaurantLoading, restaurantError } = useMenu();

  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const menuRef = useRef(null);

  const displayName = restaurant.name || (restaurantLoading ? "" : "Restaurant");
  const basePath = `/${slug}`;

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleCallWaiter = async () => {
    setMenuOpen(false);
    try {
      if (isSupabaseConfigured && supabase && restaurant?.id) {
        const tableData = getTableData();
        await supabase.from("waiter_calls").insert({
          restaurant_id: restaurant.id,
          table_id: tableData?.id || null,
          table_number: tableData?.table_number || null,
          status: "pending",
        });
      }
    } catch {
      // silently fallback
    }
    showToast("Waiter has been called!");
  };

  const handleNav = (path) => {
    setMenuOpen(false);
    if (path) navigate(path);
  };

  const tableData = getTableData();
  const tableNumber = tableData?.table_number || localStorage.getItem("table_id");

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

      <div className="hamburgerWrap" ref={menuRef}>
        <button
          className={`hamburgerBtn pressable ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span className="hamburgerLine" />
          <span className="hamburgerLine" />
          <span className="hamburgerLine" />
        </button>

        {menuOpen && (
          <>
            <div className="dropdownOverlay" onClick={() => setMenuOpen(false)} />
            <div className="dropdown" role="menu">
              <button className="dropdownItem" role="menuitem" onClick={() => showToast("Your Orders feature coming soon")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                Your Orders
              </button>

              <button className="dropdownItem dropdownWaiter" role="menuitem" onClick={handleCallWaiter}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                Call Waiter
              </button>

              <button className="dropdownItem" role="menuitem" onClick={() => showToast("For assistance, please contact the restaurant staff directly.")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Help / Support
              </button>

              <button className="dropdownItem" role="menuitem" onClick={() => showToast("Contact restaurant info coming soon")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
                Contact Restaurant
              </button>

              {tableNumber && (
                <div className="dropdownItem dropdownItem--static" aria-disabled="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  Table {tableNumber}
                </div>
              )}

              <button className="dropdownItem" role="menuitem" onClick={() => showToast("Thank you! Your feedback helps us improve.")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Feedback / Rate Experience
              </button>
            </div>
          </>
        )}
      </div>

      {toast && (
        <div className="headerToast">
          {toast}
        </div>
      )}
    </header>
  );
}