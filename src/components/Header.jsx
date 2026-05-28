import { useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { HamburgerMenu } from "./HamburgerMenu";

export function Header() {
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();

  return (
    <header className="header">
      <button className="iconBtn pressable" onClick={() => window.history.back()} aria-label="Back">
        ←
      </button>
      <HamburgerMenu slug={slug} />
    </header>
  );
}