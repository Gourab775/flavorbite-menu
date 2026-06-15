import { useCart } from "../hooks/useCart";

export function VegToggle() {
  const { vegMode, setVegMode } = useCart();

  return (
    <button
      onClick={() => setVegMode(!vegMode)}
      className={`vegTogglePill ${vegMode ? "active" : ""}`}
      aria-pressed={vegMode}
      title={vegMode ? "Showing veg items only" : "Showing all items"}
    >
      <span className="vegToggleLabel">All</span>
      <span className="vegToggleLabel">Veg</span>
      <span className="vegToggleSlider">{vegMode ? "Veg" : "All"}</span>
    </button>
  );
}
