/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured, supabaseUrl } from "../lib/supabaseClient";
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

function cleanSlug(slug) {
  if (!slug) return DEFAULT_SLUG;
  return String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
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

  const loadMenu = useCallback(async (inputSlug) => {
    const rawSlug = inputSlug || getStoredSlug() || DEFAULT_SLUG;
    const slug = cleanSlug(rawSlug);

    console.log("[menuStore] === FETCH START ===");
    console.log("[menuStore] Input slug:", rawSlug);
    console.log("[menuStore] Cleaned slug:", slug);
    console.log("[menuStore] Supabase URL:", supabaseUrl);

    if (menuCache.has(slug)) {
      console.log("[menuStore] Using cached data for:", slug);
      const cached = menuCache.get(slug);
      dispatch({ type: "SET_DATA", payload: cached });
      return;
    }

    if (currentSlug.current === slug && hasFetched.current) {
      console.log("[menuStore] Already fetched for:", slug);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      console.error("[menuStore] Supabase not configured");
      dispatch({ type: "SET_ERROR", payload: "App configuration error" });
      return;
    }

    dispatch({ type: "START_LOADING" });
    hasFetched.current = true;
    currentSlug.current = slug;

    try {
      console.log("[menuStore] Querying restaurant with slug:", slug);
      
      // Defensive query: use maybeSingle() to avoid 406
      const restaurantQuery = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      console.log("[menuStore] Restaurant query result:");
      console.log("  - data:", restaurantQuery.data);
      console.log("  - error:", restaurantQuery.error);
      console.log("  - status:", restaurantQuery.status);
      console.log("  - count:", restaurantQuery.count);

      const { data: restData, error: restErr } = restaurantQuery;

      // Handle errors
      if (restErr) {
        console.error("[menuStore] Restaurant query error details:");
        console.error("  - message:", restErr.message);
        console.error("  - code:", restErr.code);
        console.error("  - details:", restErr.details);
        console.error("  - hint:", restErr.hint);
        
        if (restErr.code === "PGRST301" || restErr.message?.includes("JWT")) {
          dispatch({ type: "SET_ERROR", payload: "Access denied - check RLS policies" });
        } else if (restErr.message?.includes("not found") || restErr.code === "42P01") {
          dispatch({ type: "SET_ERROR", payload: "Database table not found" });
        } else {
          dispatch({ type: "SET_ERROR", payload: "Failed to load restaurant" });
        }
        return;
      }

      // Handle no data
      if (!restData) {
        console.warn("[menuStore] No restaurant found for slug:", slug);
        console.warn("[menuStore] Possible causes:");
        console.warn("  1. Slug does not exist in database");
        console.warn("  2. RLS policy blocking access");
        console.warn("  3. Slug value mismatch (check exact match)");
        
        dispatch({ type: "SET_ERROR", payload: "Restaurant not found" });
        return;
      }

      console.log("[menuStore] Restaurant found:", restData.name);

      const restaurantId = restData.id;
      const restaurant = {
        id: restaurantId,
        name: restData.name ?? "",
        slug: restData.slug ?? "",
        logo: restData.logo ?? "",
        paymentId: restData.payment_id ?? "",
      };

      // Fetch all menu data in parallel
      console.log("[menuStore] Fetching menu data for restaurant_id:", restaurantId);
      
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

      console.log("[menuStore] Categories:", catsResult.data?.length || 0, "items");
      console.log("[menuStore] Menu items:", itemsResult.data?.length || 0, "items");
      console.log("[menuStore] Featured:", featuredResult.data?.length || 0, "items");

      if (catsResult.error) console.error("[menuStore] Categories error:", catsResult.error);
      if (itemsResult.error) console.error("[menuStore] Menu items error:", itemsResult.error);
      if (featuredResult.error) console.error("[menuStore] Featured error:", featuredResult.error);

      const data = {
        restaurant,
        categories: normalizeCategories(catsResult.data),
        menuItems: normalizeMenuItems(itemsResult.data),
        featuredItems: normalizeFeaturedItems(featuredResult.data),
      };

      menuCache.set(slug, data);
      dispatch({ type: "SET_DATA", payload: data });
      console.log("[menuStore] === FETCH SUCCESS ===");
    } catch (err) {
      console.error("[menuStore] === FETCH ERROR ===");
      console.error("[menuStore] Error type:", err?.constructor?.name);
      console.error("[menuStore] Error message:", err?.message);
      console.error("[menuStore] Error stack:", err?.stack);
      dispatch({ type: "SET_ERROR", payload: "Failed to load menu" });
    }
  }, []);

  useEffect(() => {
    const slug = getSlugFromPath() || getStoredSlug();
    loadMenu(slug);
  }, [loadMenu]);

  const refetch = useCallback(() => {
    const slug = getSlugFromPath() || getStoredSlug();
    const cleanedSlug = cleanSlug(slug);
    menuCache.delete(cleanedSlug);
    hasFetched.current = false;
    loadMenu(slug);
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
