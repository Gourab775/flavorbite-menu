/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured, supabaseUrl } from "../lib/supabaseClient";

const MenuContext = createContext(null);

const menuCache = new Map();
// Use environment variable if available, otherwise demo-restaurant
const DEFAULT_SLUG = import.meta.env.VITE_RESTAURANT_SLUG || "demo-restaurant";

function normalizeCategories(data) {
  if (!Array.isArray(data)) return [];
  return data.map((c) => ({
    id: String(c.id ?? ""),
    name: String(c.name ?? ""),
    imageUrl: String(c.image ?? c.image_url ?? c.imageUrl ?? ""),
    sortOrder: Number(c.sort_order ?? c.sortOrder ?? 0),
  })).filter((c) => c.id && c.name).sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeMenuItems(data) {
  if (!Array.isArray(data)) return [];
  return data.map((i) => ({
    id: String(i.id ?? ""),
    name: String(i.name ?? ""),
    price: Number(i.price ?? 0),
    isVeg: Boolean(i.is_veg ?? false),
    isAvailable: Boolean(i.is_available ?? true),
    categoryId: String(i.category_id ?? ""),
    imageUrl: String(i.image_url ?? i.imageUrl ?? ""),
    description: String(i.description ?? ""),
  })).filter((i) => i.id && i.name && i.categoryId);
}

function normalizeFeaturedItems(data) {
  if (!Array.isArray(data)) return [];
  return data.map((i) => ({
    id: String(i.id ?? ""),
    imageUrl: String(i.image_url ?? i.imageUrl ?? ""),
    redirectUrl: String(i.redirect_url ?? ""),
    displayOrder: Number(i.display_order ?? i.displayOrder ?? 0),
  })).filter((i) => i.imageUrl);
}

function cleanSlug(raw) {
  if (!raw || typeof raw !== "string") return DEFAULT_SLUG;
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
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

function useReducer(reducer, init) {
  const [state, setState] = useState(init);
  const dispatch = useCallback((action) => setState((prev) => reducer(prev, action)), []);
  return [state, dispatch];
}

export function MenuProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const fetchKey = useRef(null);

  const loadMenu = useCallback(async (rawInput) => {
    // GUARD: Ensure we only work with string
    const inputSlug = typeof rawInput === "string" ? rawInput : String(rawInput ?? "");
    const slug = cleanSlug(inputSlug);

    console.log("[MENU] slug:", slug);
    console.log("[MENU] supabaseUrl:", supabaseUrl);
    console.log("[MENU] configured:", isSupabaseConfigured);

    if (menuCache.has(slug)) {
      console.log("[MENU] cache hit");
      dispatch({ type: "SET_DATA", payload: menuCache.get(slug) });
      return;
    }

    if (fetchKey.current === slug) return;
    if (!isSupabaseConfigured || !supabase) {
      dispatch({ type: "SET_ERROR", payload: "Config error" });
      return;
    }

    fetchKey.current = slug;
    dispatch({ type: "START_LOADING" });

    try {
      console.log("[MENU] query: slug =", slug);

       const { data: restaurantData, error } = await supabase
         .from("restaurants")
         .select("id, name, slug, logo, payment_id")
         .eq("slug", slug)
         .maybeSingle();

       // SAFE LOGGING: Only log primitives, no circular objects
       console.log("[MENU] result: data =", restaurantData ? "found" : "null");
       console.log("[MENU] result: error =", error?.message ?? "none");

       // Diagnose the issue
       if (error) {
         console.error("[MENU] Query error (likely RLS or network):", error.message);
         dispatch({ type: "SET_ERROR", payload: `Database error: ${error.message}` });
         return;
       }

       if (!restaurantData) {
         console.warn("[MENU] No restaurant found for slug:", slug, "- trying ilike fallback");
         
         // Try ILIKE fallback for case-insensitive matching
         const { data: ilikeData, error: ilikeError } = await supabase
           .from("restaurants")
           .select("id, name, slug, logo, payment_id")
           .ilike("slug", `%${slug}%`)
           .maybeSingle();

         console.log("[MENU] ilike: data =", ilikeData ? "found" : "null");
         console.log("[MENU] ilike: error =", ilikeError?.message ?? "none");

         if (ilikeError) {
           console.error("[MENU] ILIKE query error:", ilikeError.message);
           dispatch({ type: "SET_ERROR", payload: `Database error: ${ilikeError.message}` });
           return;
         }

         if (ilikeData) {
           console.log("[MENU] Found via ilike fallback, slug was:", ilikeData.slug);
           const row = ilikeData;
           const restaurantId = String(row.id);
           const restaurant = {
             id: restaurantId,
             name: String(row.name ?? ""),
             slug: String(row.slug ?? ""),
             logo: String(row.logo ?? ""),
             paymentId: String(row.payment_id ?? ""),
           };

           const [cats, items, feat] = await Promise.all([
             supabase.from("categories").select("*").eq("restaurant_id", restaurantId),
             supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId),
             supabase.from("featured_items").select("*").eq("restaurant_id", restaurantId),
           ]);

           const data = {
             restaurant,
             categories: normalizeCategories(cats.data),
             menuItems: normalizeMenuItems(items.data),
             featuredItems: normalizeFeaturedItems(feat.data),
           };

           menuCache.set(slug, data);
           dispatch({ type: "SET_DATA", payload: data });
           console.log("[MENU] success via ilike");
           return;
         }

         // No data found in either query
         console.error("[MENU] Restaurant not found in database for slug:", slug);
         dispatch({ 
           type: "SET_ERROR", 
           payload: `Restaurant "${slug}" not found. Please check the slug and ensure the restaurant exists in the database.` 
         });
         return;
       }

       // Successfully found restaurant data
       const row = restaurantData;
      const restaurantId = String(row.id);
      const restaurant = {
        id: restaurantId,
        name: String(row.name ?? ""),
        slug: String(row.slug ?? ""),
        logo: String(row.logo ?? ""),
        paymentId: String(row.payment_id ?? ""),
      };

      const [cats, items, feat] = await Promise.all([
        supabase.from("categories").select("*").eq("restaurant_id", restaurantId),
        supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId),
        supabase.from("featured_items").select("*").eq("restaurant_id", restaurantId),
      ]);

      const data = {
        restaurant,
        categories: normalizeCategories(cats.data),
        menuItems: normalizeMenuItems(items.data),
        featuredItems: normalizeFeaturedItems(feat.data),
      };

      menuCache.set(slug, data);
      dispatch({ type: "SET_DATA", payload: data });
      console.log("[MENU] success");
    } catch (err) {
      console.error("[MENU] Network/Fetch error:", err?.message ?? String(err));
      dispatch({ type: "SET_ERROR", payload: `Network error: ${err?.message ?? "Unknown error"}` });
    }
  }, []);

  const refetch = useCallback((rawInput) => {
    const slug = cleanSlug(rawInput);
    menuCache.delete(slug);
    fetchKey.current = null;
    loadMenu(slug);
  }, [loadMenu]);

  const value = useMemo(() => ({ ...state, loadMenu, refetch }), [state, loadMenu, refetch]);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenuStore() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenuStore must be used within MenuProvider");
  return ctx;
}
