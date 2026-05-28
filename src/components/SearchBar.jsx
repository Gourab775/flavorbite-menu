import { useCallback } from "react";
import { useCart } from "../hooks/useCart";

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useCart();

  const handleClear = useCallback(() => {
    setSearchQuery("");
  }, [setSearchQuery]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === "Search") {
      if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
        e.target.blur();
      }
    }
  }, []);

  return (
    <div className="searchWrap">
      <label className="searchField">
        <span className="searchIcon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for dishes…"
          aria-label="Search dishes"
        />
      </label>
      {searchQuery && (
        <button
          className="searchClearBtn pressable"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
