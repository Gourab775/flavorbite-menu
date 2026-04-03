import { useMenuStore } from "../store/menuStore";

export function useMenu() {
  const { categories, menuItems, featuredItems, restaurant, loading, error, refetch } =
    useMenuStore();

  const restaurantLoading = loading && !restaurant.id;
  const restaurantError = error && !restaurant.id ? error : null;

  return {
    categories,
    menuItems,
    featuredItems,
    restaurant,
    slug: restaurant.slug,
    restaurantLoading,
    restaurantError,
    loading,
    error,
    refetch,
  };
}