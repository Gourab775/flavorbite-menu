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
      <span className={`vegToggleLabel${vegMode ? "" : " inactive"}`}>All</span>
      <span className={`vegToggleLabel${vegMode ? " inactive" : ""}`}>Veg</span>
      <span className="vegToggleThumb">
        <span className="vegToggleThumbText active">{vegMode ? "Veg" : "All"}</span>
      </span>
    </button>
  );
}
