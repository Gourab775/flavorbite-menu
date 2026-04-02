/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { RESTAURANT_ID, INVALID_RESTAURANT_ERROR } from "../utils/constants";

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

export function MenuProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [restaurant, setRestaurant] = useState({ name: "", slug: "", logo: "", paymentId: "" });
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [restaurantError, setRestaurantError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!RESTAURANT_ID) {
      setRestaurantError(INVALID_RESTAURANT_ERROR);
      setRestaurantLoading(false);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured || !supabase) {
        console.error("[menuStore] Supabase not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env");
        setRestaurantError("Supabase not configured");
        setLoading(false);
        return;
      }

      console.log(`[menuStore] Fetching restaurant (ID: ${RESTAURANT_ID})…`);

      const { data: restData, error: restErr } = await supabase
        .from("restaurants")
        .select("name, slug, logo, payment_id")
        .eq("id", RESTAURANT_ID)
        .single();

      if (cancelled) return;

      if (restErr) {
        console.error(`[menuStore] Restaurant fetch error:`, restErr);
        setRestaurantError(restErr.message ?? "Failed to load restaurant");
        setRestaurantLoading(false);
      } else if (restData) {
        console.log(`[menuStore] Restaurant loaded:`, restData);
        setRestaurant({
          name: restData.name ?? "",
          slug: restData.slug ?? "",
          logo: restData.logo ?? "",
          paymentId: restData.payment_id ?? "",
        });
        setRestaurantError(null);
      } else {
        console.warn(`[menuStore] No restaurant found for ID: ${RESTAURANT_ID}`);
        setRestaurantError("Restaurant not found");
      }
      setRestaurantLoading(false);

      const [catsResult, itemsResult, featuredResult] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, image, sort_order")
          .eq("restaurant_id", RESTAURANT_ID)
          .order("sort_order", { ascending: true }),
        supabase
          .from("menu_items")
          .select("id, name, description, price, is_veg, is_available, category_id, image_url")
          .eq("restaurant_id", RESTAURANT_ID)
          .eq("is_available", true),
        supabase
          .from("featured_items")
          .select("id, image_url, redirect_url, display_order")
          .eq("restaurant_id", RESTAURANT_ID)
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
      ]);

      if (cancelled) return;

      if (!catsResult.error) {
        console.log("[menuStore] Categories:", catsResult.data);
        setCategories(normalizeCategories(catsResult.data));
      } else {
        console.error("[menuStore] Categories error:", catsResult.error);
      }

      if (!itemsResult.error) {
        console.log("[menuStore] Menu items:", itemsResult.data);
        setMenuItems(normalizeMenuItems(itemsResult.data));
      } else {
        console.error("[menuStore] Menu items error:", itemsResult.error);
      }

      if (!featuredResult.error) {
        console.log("[menuStore] Featured items:", featuredResult.data);
        setFeaturedItems(normalizeFeaturedItems(featuredResult.data));
      } else {
        console.error("[menuStore] Featured items error:", featuredResult.error);
      }

      if (catsResult.error || itemsResult.error) {
        setError("Failed to load menu data from Supabase.");
      }
      setLoading(false);
    };

    load();

    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel("restaurant-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "restaurants",
            filter: `id=eq.${RESTAURANT_ID}`,
          },
          (payload) => {
            if (cancelled) return;
            console.log("[menuStore] Realtime restaurant update:", payload);
            if (payload.new) {
              setRestaurant((prev) => ({
                ...prev,
                name: payload.new.name ?? prev.name ?? "",
                slug: payload.new.slug ?? prev.slug ?? "",
                logo: payload.new.logo ?? prev.logo ?? "",
                paymentId: payload.new.payment_id ?? prev.paymentId ?? "",
              }));
            }
          }
        )
        .subscribe();

      return () => {
        cancelled = true;
        supabase.removeChannel(channel);
      };
    }

    return () => { cancelled = true; };
  }, []);

  const refetch = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    if (!RESTAURANT_ID) return;
    setLoading(true);
    setError(null);

    const { data: restData, error: restErr } = await supabase
      .from("restaurants")
      .select("name, slug, logo, payment_id")
      .eq("id", RESTAURANT_ID)
      .single();

    if (!restErr && restData) {
      console.log("[menuStore] Refetch — Restaurant:", restData);
      setRestaurant({
        name: restData.name ?? "",
        slug: restData.slug ?? "",
        logo: restData.logo ?? "",
        paymentId: restData.payment_id ?? "",
      });
      setRestaurantError(null);
    } else if (restErr) {
      console.error("[menuStore] Refetch — Restaurant error:", restErr);
      setRestaurantError(restErr.message ?? "Failed to reload restaurant");
    }

    const [catsResult, itemsResult] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, image, sort_order")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("sort_order", { ascending: true }),
      supabase
        .from("menu_items")
        .select("id, name, description, price, is_veg, is_available, category_id, image_url")
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("is_available", true),
    ]);

    if (!catsResult.error) setCategories(normalizeCategories(catsResult.data));
    if (!itemsResult.error) setMenuItems(normalizeMenuItems(itemsResult.data));
    if (catsResult.error || itemsResult.error) {
      setError("Failed to reload menu data.");
    }
    setLoading(false);
  }, []);

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
