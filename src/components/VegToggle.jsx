import { useCart } from "../hooks/useCart";

export function VegToggle() {
  const { vegMode, setVegMode } = useCart();

  return (
    <button
      onClick={() => setVegMode(!vegMode)}
      className={`vegToggleSwitch ${vegMode ? "active" : ""}`}
      aria-pressed={vegMode}
      title={vegMode ? "Showing veg items only" : "Showing all items"}
    >
      <span className="vegToggleLabel">All</span>
      <span className="vegToggleLabel">Veg</span>
      <span className="vegToggleThumb">{vegMode ? "Veg" : "All"}</span>
    </button>
  );
}
