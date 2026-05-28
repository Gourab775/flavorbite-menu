import { useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { HamburgerMenu } from "./HamburgerMenu";
import { useGoBack } from "../context/NavigationContext";

export function Header() {
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const goBack = useGoBack(`/${slug}`);

  return (
    <header className="header">
      <button className="iconBtn pressable" onClick={goBack} aria-label="Back">
        ←
      </button>
      <HamburgerMenu slug={slug} />
    </header>
  );
}