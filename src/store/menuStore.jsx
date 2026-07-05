/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { FALLBACK_IMG, DEFAULT_CURRENCY } from "../utils/constants";
import { useRestaurant } from "./restaurantStore";

const MenuContext = createContext(null);

const menuCache = new Map();
const DEFAULT_SLUG = import.meta.env.VITE_RESTAURANT_SLUG || "demo-restaurant";

function normalizeCategories(data) {
  if (!Array.isArray(data)) return [];
  return data.map((c) => ({
    id: String(c.id ?? ""),
    name: String(c.name ?? ""),
    imageUrl: String(c.image ?? c.image_url ?? c.imageUrl ?? ""),
    sortOrder: Number(c.sort_order ?? c.sortOrder ?? 0),
    mainCategoryId: String(c.main_category_id ?? c.mainCategoryId ?? ""),
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
    imageUrl: String(i.image_url ?? i.imageUrl ?? "") || FALLBACK_IMG,
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

function normalizeMainCategories(data) {
  if (!Array.isArray(data)) return [];
  return data.map((mc) => ({
    id: String(mc.id ?? ""),
    name: String(mc.name ?? ""),
    imageUrl: String(mc.image ?? mc.image_url ?? mc.imageUrl ?? ""),
    sortOrder: Number(mc.sort_order ?? mc.sortOrder ?? 0),
  })).filter((mc) => mc.id && mc.name).sort((a, b) => a.sortOrder - b.sortOrder);
}

function cleanSlug(raw) {
  if (!raw || typeof raw !== "string") return DEFAULT_SLUG;
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

const initialState = {
  categories: [],
  menuItems: [],
  featuredItems: [],
  mainCategories: [],
  restaurant: { id: "", name: "", slug: "", logo: "", plan: "plus", ...DEFAULT_CURRENCY },
  loading: false,
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
  const { loadRestaurant } = useRestaurant();
  const [state, dispatch] = useReducer(reducer, initialState);
  const fetchKey = useRef(null);

  const loadMenu = useCallback(async (rawInput) => {
    console.log("[Restaurant Load] Starting...");

    const inputSlug = typeof rawInput === "string" ? rawInput : String(rawInput ?? "");
    const slug = cleanSlug(inputSlug);

    console.log("[Restaurant Load] Slug:", slug);

    if (!slug) {
      console.error("[Restaurant Load Error] No restaurant slug provided.");
      dispatch({ type: "SET_ERROR", payload: "No restaurant slug provided." });
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      console.error("[Restaurant Load Error] Supabase is not configured.");
      dispatch({ type: "SET_ERROR", payload: "Supabase is not configured. Please check your environment variables." });
      return;
    }

    fetchKey.current = slug;

    if (menuCache.has(slug)) {
      console.log("[Restaurant Load] Using cached data for slug:", slug);
      const cached = menuCache.get(slug);

      // Silently check if the restaurant plan changed in the DB
      try {
        const { data: planCheck } = await supabase
          .from("restaurants")
          .select("plan")
          .eq("id", cached.restaurant.id)
          .maybeSingle();
        if (planCheck) {
          const freshPlan = String(planCheck.plan).trim().toLowerCase();
          if (freshPlan && freshPlan !== cached.restaurant.plan) {
            console.log("[Restaurant Load] Plan changed from", cached.restaurant.plan, "to", freshPlan);
            const updated = {
              ...cached,
              restaurant: { ...cached.restaurant, plan: freshPlan },
            };
            menuCache.set(slug, updated);
            dispatch({ type: "SET_DATA", payload: updated });
            return;
          }
        }
      } catch {
        // Plan check is best-effort; fall through to cached data
      }

      dispatch({ type: "SET_DATA", payload: cached });
      return;
    }

    dispatch({ type: "START_LOADING" });

    const restaurant = await loadRestaurant(slug);
    if (!restaurant) {
      fetchKey.current = null;
      dispatch({ type: "SET_ERROR", payload: "Restaurant not found" });
      return;
    }
    if (fetchKey.current !== slug) return;

    const restaurantId = restaurant.id;
    console.log("[Restaurant Load] Restaurant found:", restaurant.name, "(id:", restaurantId, ", plan:", restaurant.plan, ")");

    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (fetchKey.current !== slug) return;

      if (attempt > 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt - 1)));
        if (fetchKey.current !== slug) return;
      }

      try {

        // Fetch categories and menu_items independently so one failure never blocks the other
        let categories = [];
        let menuItems = [];
        let catError = null;
        let itemError = null;

        try {
          const { data: catData, error: ce } = await supabase
            .from("categories").select("*")
            .eq("restaurant_id", restaurantId);
          if (ce) {
            catError = ce;
            console.error("[Restaurant Load Error] Categories query error:", ce.message);
          } else {
            categories = normalizeCategories(catData);
            console.log("[Restaurant Load] Categories loaded:", categories.length);
          }
        } catch (err) {
          catError = err;
          console.error("[Restaurant Load Error] Categories exception:", err.message);
        }

        try {
          const { data: itemData, error: ie } = await supabase
            .from("menu_items").select("*")
            .eq("restaurant_id", restaurantId);
          if (ie) {
            itemError = ie;
            console.error("[Restaurant Load Error] Menu items query error:", ie.message);
          } else {
            menuItems = normalizeMenuItems(itemData);
            console.log("[Restaurant Load] Menu items loaded:", menuItems.length);
          }
        } catch (err) {
          itemError = err;
          console.error("[Restaurant Load Error] Menu items exception:", err.message);
        }

        if (catError && itemError) {
          console.error("[Restaurant Load Error] Both categories and menu items failed. Aborting.");
          if (attempt === MAX_ATTEMPTS) {
            fetchKey.current = null;
            dispatch({ type: "SET_ERROR", payload: "Failed to load menu data. Please try again." });
            return;
          }
          continue;
        }

        if (fetchKey.current !== slug) return;

        // Fetch featured items separately so a column mismatch never blocks menu load
        let featuredItems = [];
        try {
          const { data: featData } = await supabase
            .from("featured_items").select("*")
            .eq("restaurant_id", restaurantId)
            .order("display_order", { ascending: true });
          if (featData) {
            const withActive = featData.filter((f) => f.is_active !== false);
            featuredItems = normalizeFeaturedItems(withActive);
          }
        } catch {
          // Featured items are non-critical; menu still loads without them
        }

        let mainCategories = [];
        try {
          const { data: mcData } = await supabase
            .from("main_categories").select("*")
            .eq("restaurant_id", restaurantId);
          if (mcData) mainCategories = normalizeMainCategories(mcData);
          console.log("[Restaurant Load] Main categories loaded:", mainCategories.length);
        } catch {
          // main categories are non-critical
        }

        // waiter_request_types are NOT loaded here — they are fetched on-demand
        // by CallWaiterPage and are completely independent of restaurant loading.

        const data = {
          restaurant,
          categories,
          menuItems,
          featuredItems,
          mainCategories,
        };

        menuCache.set(slug, data);
        fetchKey.current = null;
        console.log("[Restaurant Load] Completed successfully for:", restaurant.name);
        dispatch({ type: "SET_DATA", payload: data });
        return;
      } catch (err) {
        console.error("[Restaurant Load Error] Unexpected error:", err?.message ?? "Unknown error");
        if (attempt === MAX_ATTEMPTS) {
          fetchKey.current = null;
          dispatch({ type: "SET_ERROR", payload: `Network error: ${err?.message ?? "Unknown error"}` });
          return;
        }
      }
    }
  }, [loadRestaurant]);

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