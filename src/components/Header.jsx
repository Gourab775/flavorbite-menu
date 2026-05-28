import { useParams, useLocation } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { HamburgerMenu } from "./HamburgerMenu";
import { useMenu } from "../hooks/useMenu";

export function Header() {
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const [, navigate] = useLocation();
  const { restaurant } = useMenu();

  const goToLanding = () => {
    const qs = window.location.search;
    navigate(`/${slug}${qs}`);
  };

  const name = restaurant?.name?.trim() || "";

  return (
    <header className="header">
      <button className="iconBtn pressable" onClick={goToLanding} aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="headerBrand">
        <svg className="headerLocationIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="headerRestaurantName">{name || "Restaurant"}</span>
      </div>

      <HamburgerMenu slug={slug} />
    </header>
  );
}