import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { hasDeviceSessionUnreadOrders, markDeviceSessionOrdersRead } from "../utils/session";

export function HamburgerMenu({ slug }) {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(() => hasDeviceSessionUnreadOrders());
  const menuRef = useRef(null);
  const basePath = `/${slug}`;

  const checkUnread = useCallback(() => {
    setHasUnread(hasDeviceSessionUnreadOrders());
  }, []);

  useEffect(() => {
    checkUnread();
    window.addEventListener("device-order-update", checkUnread);
    window.addEventListener("storage", checkUnread);
    return () => {
      window.removeEventListener("device-order-update", checkUnread);
      window.removeEventListener("storage", checkUnread);
    };
  }, [checkUnread]);

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

  const toggleMenu = () => {
    if (!menuOpen) markDeviceSessionOrdersRead();
    setMenuOpen((prev) => !prev);
  };

  const handleNav = (path) => {
    setMenuOpen(false);
    if (path) {
      markDeviceSessionOrdersRead();
      navigate(path);
    }
  };

  return (
    <div className="hamburgerWrap" ref={menuRef}>
      <button
        className={`hamburgerBtn pressable ${menuOpen ? "open" : ""}`}
        onClick={toggleMenu}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span className="hamburgerLine" />
        <span className="hamburgerLine" />
        <span className="hamburgerLine" />
        {hasUnread && <span className="hamburgerBadge" />}
      </button>

      {menuOpen && (
        <>
          <div className="dropdownOverlay" onClick={() => setMenuOpen(false)} />
          <div className="dropdown" role="menu">
            <button className="dropdownItem" role="menuitem" onClick={() => handleNav(`${basePath}/your-orders`)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              My Orders
              {hasUnread && <span className="dropdownBadge" />}
            </button>

            <button className="dropdownItem" role="menuitem" onClick={() => handleNav(`${basePath}/call-waiter`)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              Call Waiter
            </button>

            <button className="dropdownItem" role="menuitem" onClick={() => handleNav(`${basePath}/help-support`)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Help & Support
            </button>

            <button className="dropdownItem" role="menuitem" onClick={() => handleNav(`${basePath}/feedback`)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Feedback / Rate Experience
            </button>

            <div className="dropdownDivider" role="separator" />

            <button className="dropdownItem" role="menuitem" onClick={() => handleNav(`${basePath}/restaurant-info`)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Restaurant Info
            </button>

            <button className="dropdownItem" role="menuitem" onClick={() => handleNav(`${basePath}/faqs`)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              FAQs
            </button>

            <button className="dropdownItem" role="menuitem" onClick={() => handleNav(`${basePath}/terms-privacy`)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Terms & Privacy
            </button>
          </div>
        </>
      )}
    </div>
  );
}
