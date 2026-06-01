/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { FALLBACK_IMG } from "../utils/constants";

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
  restaurant: { id: "", name: "", slug: "", logo: "" },
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
  const [state, dispatch] = useReducer(reducer, initialState);
  const fetchKey = useRef(null);
  const slugRef = useRef("");

  const fetchFreshFeatured = useCallback(async (restaurantId, slug) => {
    if (!restaurantId || !slug) return;
    try {
      const { data: featData } = await supabase
        .from("featured_items").select("*")
        .eq("restaurant_id", restaurantId)
        .order("display_order", { ascending: true });
      if (featData && fetchKey.current === slug) {
        const activeFeat = featData.filter((f) => f.is_active !== false);
        const featuredItems = normalizeFeaturedItems(activeFeat);
        if (menuCache.has(slug)) {
          const cached = menuCache.get(slug);
          menuCache.set(slug, { ...cached, featuredItems });
        }
        dispatch({ type: "SET_DATA", payload: { featuredItems } });
      }
    } catch {
      // Silently fall back to cached/provided featured data
    }
  }, []);

  const loadMenu = useCallback(async (rawInput) => {
    const inputSlug = typeof rawInput === "string" ? rawInput : String(rawInput ?? "");
    const slug = cleanSlug(inputSlug);

    if (!slug) {
      dispatch({ type: "SET_ERROR", payload: "No restaurant slug provided." });
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      dispatch({ type: "SET_ERROR", payload: "Supabase is not configured. Please check your environment variables." });
      return;
    }

    fetchKey.current = slug;

    if (menuCache.has(slug)) {
      const cached = menuCache.get(slug);
      dispatch({ type: "SET_DATA", payload: cached });
      fetchFreshFeatured(cached.restaurant.id, slug);
      return;
    }

    dispatch({ type: "START_LOADING" });

    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (fetchKey.current !== slug) return;

      if (attempt > 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt - 1)));
        if (fetchKey.current !== slug) return;
      }

      try {
        const { data: restaurantData, error } = await supabase
          .from("restaurants")
          .select("id, name, slug, logo")
          .eq("slug", slug)
          .maybeSingle();

        if (error) {
          if (attempt === MAX_ATTEMPTS) {
            fetchKey.current = null;
            dispatch({ type: "SET_ERROR", payload: `Database error: ${error.message}` });
            return;
          }
          continue;
        }

        let restaurantRow = restaurantData;

        if (!restaurantData) {
          const { data: ilikeData, error: ilikeError } = await supabase
            .from("restaurants")
            .select("id, name, slug, logo")
            .ilike("slug", `%${slug}%`)
            .maybeSingle();

          if (ilikeError) {
            if (attempt === MAX_ATTEMPTS) {
              fetchKey.current = null;
              dispatch({ type: "SET_ERROR", payload: `Database error: ${ilikeError.message}` });
              return;
            }
            continue;
          }

          if (ilikeData) {
            restaurantRow = ilikeData;
          } else {
            const { data: firstData, error: firstError } = await supabase
              .from("restaurants")
              .select("id, name, slug, logo")
              .limit(1)
              .maybeSingle();

            if (firstError) {
              if (attempt === MAX_ATTEMPTS) {
                fetchKey.current = null;
                dispatch({ type: "SET_ERROR", payload: `Database error: ${firstError.message}` });
                return;
              }
              continue;
            }

            if (firstData) {
              restaurantRow = firstData;
            } else {
              fetchKey.current = null;
              dispatch({ 
                type: "SET_ERROR", 
                payload: "No restaurant found. Please create a restaurant in the database first." 
              });
              return;
            }
          }
        }

        const row = restaurantRow;
        const restaurantId = String(row.id);
        const restaurant = {
          id: restaurantId,
          name: String(row.name ?? ""),
          slug: String(row.slug ?? ""),
          logo: String(row.logo ?? ""),
        };

        const [cats, items] = await Promise.all([
          supabase.from("categories").select("*").eq("restaurant_id", restaurantId),
          supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId),
        ]);

        if (fetchKey.current !== slug) return;

        const categories = normalizeCategories(cats.data);
        const menuItems = normalizeMenuItems(items.data);

        // Fetch featured items separately so a column mismatch never blocks menu load
        let featuredItems = [];
        try {
          const { data: featData } = await supabase
            .from("featured_items").select("*")
            .eq("restaurant_id", restaurantId)
            .order("display_order", { ascending: true });
          if (featData) {
            // Filter by active status server-side if column exists, otherwise use all
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
        } catch {
          // main categories are non-critical
        }

        const data = {
          restaurant,
          categories,
          menuItems,
          featuredItems,
          mainCategories,
        };

        menuCache.set(slug, data);
        fetchKey.current = null;
        dispatch({ type: "SET_DATA", payload: data });
        return;
      } catch (err) {
        if (attempt === MAX_ATTEMPTS) {
          fetchKey.current = null;
          dispatch({ type: "SET_ERROR", payload: `Network error: ${err?.message ?? "Unknown error"}` });
          return;
        }
      }
    }
  }, []);

  const refetch = useCallback((rawInput) => {
    const slug = cleanSlug(rawInput);
    menuCache.delete(slug);
    fetchKey.current = null;
    loadMenu(slug);
  }, [loadMenu]);

  // Real-time subscription for featured_items changes
  useEffect(() => {
    const restaurantId = state.restaurant?.id;
    const slug = state.restaurant?.slug;
    if (!restaurantId || !slug || !supabase) return;
    slugRef.current = slug;

    console.log('[Realtime] Channel Created: featured', `featured-${restaurantId}`);
    console.log('[Realtime] Restaurant ID:', restaurantId);

    let channel = null;
    try {
      channel = supabase
        .channel(`featured-${restaurantId}`)
        .on("postgres_changes",
          { event: "*", schema: "public", table: "featured_items", filter: `restaurant_id=eq.${restaurantId}` },
          () => { fetchFreshFeatured(restaurantId, slugRef.current); }
        )
        .subscribe();
      console.log('[Realtime] Featured channel subscribed');
    } catch (err) {
      console.error('[Realtime] Featured subscription failed:', err);
    }

    return () => {
      if (channel) {
        console.log('[Realtime] Channel Removed: featured');
        supabase.removeChannel(channel);
      }
    };
  }, [state.restaurant?.id, state.restaurant?.slug, fetchFreshFeatured]);

  const value = useMemo(() => ({ ...state, loadMenu, refetch }), [state, loadMenu, refetch]);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenuStore() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenuStore must be used within MenuProvider");
  return ctx;
}