import { useCart } from "../hooks/useCart";

export function VegToggle() {
  const { vegMode, setVegMode } = useCart();

  return (
    <button
      onClick={() => setVegMode(!vegMode)}
      className={`vegTogglePill w-24 md:w-28 h-10 ${vegMode ? "active" : ""}`}
      aria-pressed={vegMode}
      title={vegMode ? "Showing veg items only" : "Showing all items"}
    >
      <span className="vegToggleLabel vegToggleLabel--off">OFF</span>
      <span className="vegToggleLabel vegToggleLabel--on">VEG</span>
      <span className="vegToggleSlider" />
    </button>
  );
}
