/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured, supabaseUrl } from "../lib/supabaseClient";

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

function cleanSlug(slug) {
  if (!slug) return null;
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
  const fetchKey = useRef(null);

  const loadMenu = useCallback(async (inputSlug) => {
    const slug = cleanSlug(inputSlug) || DEFAULT_SLUG;

    // Debug: Log everything at entry
    console.group("[menuStore] FETCH START");
    console.log("Input slug:", JSON.stringify(inputSlug));
    console.log("Cleaned slug:", slug);
    console.log("Supabase URL:", supabaseUrl);
    console.log("Supabase configured:", isSupabaseConfigured);

    // Return cached if same slug
    if (menuCache.has(slug)) {
      console.log("Returning cached data for:", slug);
      dispatch({ type: "SET_DATA", payload: menuCache.get(slug) });
      console.groupEnd();
      return;
    }

    // Skip duplicate fetch for same slug
    if (fetchKey.current === slug) {
      console.log("Already fetching slug:", slug);
      console.groupEnd();
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      console.error("Supabase not configured - check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
      dispatch({ type: "SET_ERROR", payload: "App configuration error" });
      console.groupEnd();
      return;
    }

    fetchKey.current = slug;
    dispatch({ type: "START_LOADING" });

    try {
      console.log("Querying: supabase.from('restaurants').select('*').eq('slug', " + JSON.stringify(slug) + ").maybeSingle()");

      const result = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      console.log("Query result:");
      console.log("  data:", result.data);
      console.log("  error:", result.error);
      console.log("  status:", result.status);
      console.log("  count:", result.count);

      const { data: restData, error: restErr } = result;

      if (restErr) {
        console.error("Query error:");
        console.error("  message:", restErr.message);
        console.error("  code:", restErr.code);
        console.error("  details:", restErr.details);
        console.error("  hint:", restErr.hint);
        dispatch({ type: "SET_ERROR", payload: `Query error: ${restErr.message}` });
        console.groupEnd();
        return;
      }

      if (!restData) {
        console.warn("No data returned for slug:", slug);
        console.warn("To fix: Run this SQL in Supabase:");
        console.warn(`  SELECT * FROM restaurants WHERE LOWER(TRIM(slug)) = '${slug}';`);
        console.warn("If empty, insert the row:");
        console.warn(`  INSERT INTO restaurants (id, name, slug) VALUES (gen_random_uuid(), 'Demo', '${slug}');`);
        console.warn("Check RLS policy:");
        console.warn("  CREATE POLICY 'public_read' ON restaurants FOR SELECT USING (true);");
        dispatch({ type: "SET_ERROR", payload: "Restaurant not found" });
        console.groupEnd();
        return;
      }

      console.log("Restaurant found:", restData.name);

      const restaurantId = restData.id;
      const restaurant = {
        id: restaurantId,
        name: restData.name ?? "",
        slug: restData.slug ?? "",
        logo: restData.logo ?? "",
        paymentId: restData.payment_id ?? "",
      };

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

      console.log("Categories:", catsResult.data?.length || 0);
      console.log("Menu items:", itemsResult.data?.length || 0);
      console.log("Featured:", featuredResult.data?.length || 0);

      const data = {
        restaurant,
        categories: normalizeCategories(catsResult.data),
        menuItems: normalizeMenuItems(itemsResult.data),
        featuredItems: normalizeFeaturedItems(featuredResult.data),
      };

      menuCache.set(slug, data);
      dispatch({ type: "SET_DATA", payload: data });
      console.log("FETCH SUCCESS");
      console.groupEnd();
    } catch (err) {
      console.error("FETCH ERROR:", err);
      dispatch({ type: "SET_ERROR", payload: "Failed to load menu" });
      console.groupEnd();
    }
  }, []);

  const refetch = useCallback((slug) => {
    const clean = cleanSlug(slug);
    if (clean) menuCache.delete(clean);
    fetchKey.current = null;
    loadMenu(slug);
  }, [loadMenu]);

  const value = useMemo(
    () => ({
      ...state,
      loadMenu,
      refetch,
    }),
    [state, loadMenu, refetch]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenuStore() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenuStore must be used within MenuProvider");
  return ctx;
}
