import { useLocation, useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { HamburgerMenu } from "./HamburgerMenu";

export function Header() {
  const [, navigate] = useLocation();
  const { slug: urlSlug } = useParams();
  
  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;

  return (
    <header className="header">
      <button className="iconBtn pressable" onClick={() => navigate(basePath)} aria-label="Back to home">
        ←
      </button>
      <HamburgerMenu slug={slug} />
    </header>
  );
}