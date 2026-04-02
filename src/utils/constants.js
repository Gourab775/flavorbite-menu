export function getRestaurantIdFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("restaurant");
}

export const RESTAURANT_ID = getRestaurantIdFromUrl() || import.meta.env.VITE_RESTAURANT_ID || null;

export const INVALID_RESTAURANT_ERROR = "Invalid QR Code - Restaurant not found";
