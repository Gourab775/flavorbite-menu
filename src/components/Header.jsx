import { useParams, useLocation } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { HamburgerMenu } from "./HamburgerMenu";

export function Header() {
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const [, navigate] = useLocation();

  const goToLanding = () => {
    const qs = window.location.search;
    navigate(`/${slug}${qs}`);
  };

  return (
    <header className="header">
      <button className="iconBtn pressable" onClick={goToLanding} aria-label="Back">
        ←
      </button>
      <HamburgerMenu slug={slug} />
    </header>
  );
}