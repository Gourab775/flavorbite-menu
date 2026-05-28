export const TABLE_KEY = "tableId";
export const SLUG_KEY = "restaurantSlug";

export function getStoredTableId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TABLE_KEY);
}

export function setStoredTableId(tableId) {
  if (typeof window !== "undefined" && tableId) {
    localStorage.setItem(TABLE_KEY, tableId);
  }
}

export function getStoredSlug() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SLUG_KEY);
}

export function setStoredSlug(slug) {
  if (typeof window !== "undefined" && slug) {
    localStorage.setItem(SLUG_KEY, slug);
  }
}

export function toTitleCase(str) {
  if (!str) return "";
  return str.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}

export function clearStoredData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TABLE_KEY);
    localStorage.removeItem(SLUG_KEY);
  }
}
