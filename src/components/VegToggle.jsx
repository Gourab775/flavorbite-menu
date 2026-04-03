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
      <span className="vegToggleSlider" />
      <span className={`vegToggleLabel vegToggleLabel--off ${!vegMode ? "vegToggleLabel--active" : ""}`}>All</span>
      <span className={`vegToggleLabel vegToggleLabel--on ${vegMode ? "vegToggleLabel--active" : ""}`}>Veg</span>
    </button>
  );
}
