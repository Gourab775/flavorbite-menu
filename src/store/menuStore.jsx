/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { getStoredSlug } from "../utils/constants";

const MenuContext = createContext(null);

function normalizeCategories(data) {
  if (!Array.isArray(data)) return [];
  return data
    .map((c) => ({
      id: String(c.id ?? ""),
      name: String(c.name ?? ""),
      imageUrl: String(c.image ?? c.image_url ?? c.imageUrl ?? ""),
      sortOrder: Number(c.sort_order ?? c.sortOrder ?? 0),
    }))
    .filter((c) => c.id && c.name)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeMenuItems(data) {
  if (!Array.isArray(data)) return [];
  return data
    .map((i) => ({
      id: String(i.id ?? ""),
      name: String(i.name ?? ""),
      price: Number(i.price ?? 0),
      isVeg: Boolean(i.is_veg ?? false),
      isAvailable: Boolean(i.is_available ?? true),
      categoryId: String(i.category_id ?? ""),
      imageUrl: String(i.image_url ?? i.imageUrl ?? ""),
      description: String(i.description ?? ""),
    }))
    .filter((i) => i.id && i.name && i.categoryId);
}

function normalizeFeaturedItems(data) {
  if (!Array.isArray(data)) return [];
  return data
    .map((i) => ({
      id: String(i.id ?? ""),
      imageUrl: String(i.image_url ?? i.imageUrl ?? ""),
      redirectUrl: String(i.redirect_url ?? ""),
      displayOrder: Number(i.display_order ?? i.displayOrder ?? 0),
    }))
    .filter((i) => i.imageUrl);
}

function getSlugFromPath() {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean);
  return segments[0] || null;
}

export function MenuProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [restaurant, setRestaurant] = useState({ id: "", name: "", slug: "", logo: "", paymentId: "" });
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [restaurantError, setRestaurantError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMenu = useCallback(async (slug) => {
    if (!slug) {
      setRestaurantError("Invalid URL - No restaurant specified");
      setRestaurantLoading(false);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setRestaurantError("App configuration error");
      setRestaurantLoading(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setRestaurantLoading(true);

    // Step 1: Fetch restaurant by slug
    const { data: restData, error: restErr } = await supabase
      .from("restaurants")
      .select("id, name, slug, logo, payment_id")
      .eq("slug", slug)
      .single();

    if (restErr || !restData) {
      console.error("[menuStore] Restaurant fetch error:", restErr);
      setRestaurantError("Restaurant not found");
      setRestaurantLoading(false);
      setLoading(false);
      return;
    }

    console.log("[menuStore] Restaurant loaded:", restData);
    const restaurantId = restData.id;

    setRestaurant({
      id: restaurantId,
      name: restData.name ?? "",
      slug: restData.slug ?? "",
      logo: restData.logo ?? "",
      paymentId: restData.payment_id ?? "",
    });
    setRestaurantError(null);
    setRestaurantLoading(false);

    // Step 2: Load categories
    const catsResult = await supabase
      .from("categories")
      .select("id, name, image, sort_order")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true });

    if (!catsResult.error) {
      setCategories(normalizeCategories(catsResult.data));
    } else {
      console.error("[menuStore] Categories error:", catsResult.error);
    }

    // Step 3: Load menu items
    const itemsResult = await supabase
      .from("menu_items")
      .select("id, name, description, price, is_veg, is_available, category_id, image_url")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true);

    if (!itemsResult.error) {
      setMenuItems(normalizeMenuItems(itemsResult.data));
    } else {
      console.error("[menuStore] Menu items error:", itemsResult.error);
    }

    // Step 4: Load featured items
    const featuredResult = await supabase
      .from("featured_items")
      .select("id, image_url, redirect_url, display_order")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!featuredResult.error) {
      setFeaturedItems(normalizeFeaturedItems(featuredResult.data));
    } else {
      console.error("[menuStore] Featured items error:", featuredResult.error);
    }

    if (catsResult.error || itemsResult.error) {
      setError("Failed to load menu data.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const slug = getSlugFromPath() || getStoredSlug();

    if (!cancelled) {
      loadMenu(slug);
    }

    return () => { cancelled = true; };
  }, [loadMenu]);

  const refetch = useCallback(() => {
    const slug = getSlugFromPath() || getStoredSlug();
    return loadMenu(slug);
  }, [loadMenu]);

  const value = useMemo(
    () => ({
      categories,
      menuItems,
      featuredItems,
      restaurant,
      restaurantLoading,
      restaurantError,
      loading,
      error,
      refetch,
      justUpdated: false,
    }),
    [categories, menuItems, featuredItems, restaurant, restaurantLoading, restaurantError, loading, error, refetch]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenuStore() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenuStore must be used within MenuProvider");
  return ctx;
}
