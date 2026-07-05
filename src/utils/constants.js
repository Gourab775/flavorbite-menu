export const TABLE_KEY = "tableId";
export const SLUG_KEY = "restaurantSlug";
export const FALLBACK_IMG = "https://t3.ftcdn.net/jpg/05/53/00/78/360_F_553007886_vpgBDlwAyAaCTABowvIaPMPg437haVKR.jpg";

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

export const DEFAULT_CURRENCY = {
  country_code: "IN",
  currency_code: "INR",
  currency_symbol: "₹",
  locale: "en-IN",
};

export function clearStoredData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TABLE_KEY);
    localStorage.removeItem(SLUG_KEY);
  }
}
