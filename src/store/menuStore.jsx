/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { getStoredSlug } from "../utils/constants";

const MenuContext = createContext(null);

const menuCache = new Map();
const DEFAULT_SLUG = "demo-restaurant";

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

const initialState = {
  categories: [],
  menuItems: [],
  featuredItems: [],
  restaurant: { id: "", name: "", slug: "", logo: "", paymentId: "" },
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "START_LOADING":
      return { ...state, loading: true, error: null };
    case "SET_DATA":
      return { ...state, ...action.payload, loading: false, error: null };
    case "SET_ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

function useReducer(reducer, initialState) {
  const [state, setState] = useState(initialState);
  const dispatch = useCallback((action) => {
    setState((prev) => reducer(prev, action));
  }, []);
  return [state, dispatch];
}

export function MenuProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hasFetched = useRef(false);
  const currentSlug = useRef(null);

  const loadMenu = useCallback(async (slug) => {
    const targetSlug = slug || getStoredSlug() || DEFAULT_SLUG;
    const cleanSlug = String(targetSlug).trim().toLowerCase();

    if (menuCache.has(cleanSlug)) {
      const cached = menuCache.get(cleanSlug);
      dispatch({ type: "SET_DATA", payload: cached });
      return;
    }

    if (currentSlug.current === cleanSlug && hasFetched.current) {
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      dispatch({ type: "SET_ERROR", payload: "App configuration error" });
      return;
    }

    dispatch({ type: "START_LOADING" });
    hasFetched.current = true;
    currentSlug.current = cleanSlug;

    try {
      // Use maybeSingle() instead of single() to avoid 406 error
      const { data: restData, error: restErr } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo, payment_id")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (restErr) {
        console.error("[menuStore] Restaurant fetch error:", restErr.message);
        dispatch({ type: "SET_ERROR", payload: "Failed to load restaurant" });
        return;
      }

      if (!restData) {
        console.warn("[menuStore] No restaurant found for slug:", cleanSlug);
        dispatch({ type: "SET_ERROR", payload: "Restaurant not found" });
        return;
      }

      const restaurantId = restData.id;
      const restaurant = {
        id: restaurantId,
        name: restData.name ?? "",
        slug: restData.slug ?? "",
        logo: restData.logo ?? "",
        paymentId: restData.payment_id ?? "",
      };

      // Fetch categories, menu items, and featured items in parallel
      const [catsResult, itemsResult, featuredResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, image, sort_order")
          .eq("restaurant_id", restaurantId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("menu_items")
          .select("id, name, description, price, is_veg, is_available, category_id, image_url")
          .eq("restaurant_id", restaurantId)
          .eq("is_available", true),
        supabase
          .from("featured_items")
          .select("id, image_url, redirect_url, display_order")
          .eq("restaurant_id", restaurantId)
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
      ]);

      const data = {
        restaurant,
        categories: normalizeCategories(catsResult.data),
        menuItems: normalizeMenuItems(itemsResult.data),
        featuredItems: normalizeFeaturedItems(featuredResult.data),
      };

      menuCache.set(cleanSlug, data);
      dispatch({ type: "SET_DATA", payload: data });
    } catch (err) {
      console.error("[menuStore] Unexpected error:", err);
      dispatch({ type: "SET_ERROR", payload: "Failed to load menu" });
    }
  }, []);

  useEffect(() => {
    const slug = getSlugFromPath() || getStoredSlug();
    loadMenu(slug);
  }, [loadMenu]);

  const refetch = useCallback(() => {
    const slug = getSlugFromPath() || getStoredSlug();
    if (slug) {
      menuCache.delete(slug.trim().toLowerCase());
      hasFetched.current = false;
      loadMenu(slug);
    }
  }, [loadMenu]);

  const value = useMemo(
    () => ({
      categories: state.categories,
      menuItems: state.menuItems,
      featuredItems: state.featuredItems,
      restaurant: state.restaurant,
      restaurantLoading: state.loading,
      restaurantError: state.error,
      loading: state.loading,
      error: state.error,
      refetch,
      justUpdated: false,
    }),
    [state, refetch]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenuStore() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenuStore must be used within MenuProvider");
  return ctx;
}
