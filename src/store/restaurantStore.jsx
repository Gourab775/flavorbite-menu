/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { DEFAULT_CURRENCY } from "../utils/constants";

const RestaurantContext = createContext(null);
const restaurantCache = new Map();

const RESTAURANT_FIELDS = "id, name, slug, logo, plan, country_code, currency_code, currency_symbol, locale";

function cleanSlug(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function buildRestaurantConfig(row) {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    logo: String(row.logo ?? ""),
    plan: row.plan ? String(row.plan).trim().toLowerCase() : "plus",
    country_code: String(row.country_code ?? DEFAULT_CURRENCY.country_code),
    currency_code: String(row.currency_code ?? DEFAULT_CURRENCY.currency_code),
    currency_symbol: String(row.currency_symbol ?? DEFAULT_CURRENCY.currency_symbol),
    locale: String(row.locale ?? DEFAULT_CURRENCY.locale),
    settings: {},
  };
}

export function RestaurantProvider({ children }) {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchKey = useRef(null);
  const pendingFetches = useRef(new Map());

  const loadRestaurant = useCallback(async (rawInput) => {
    const slug = cleanSlug(rawInput);
    if (!slug) return null;

    fetchKey.current = slug;

    if (restaurantCache.has(slug)) {
      const cached = restaurantCache.get(slug);
      setRestaurant(cached);
      return cached;
    }

    if (pendingFetches.current.has(slug)) {
      return pendingFetches.current.get(slug);
    }

    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase is not configured");
      return null;
    }

    setLoading(true);
    setError(null);

    const promise = (async () => {
      const { data: exactData, error: exactError } = await supabase
        .from("restaurants")
        .select(RESTAURANT_FIELDS)
        .eq("slug", slug)
        .maybeSingle();

      if (exactError) throw exactError;
      if (exactData) return buildRestaurantConfig(exactData);

      const { data: ilikeData, error: ilikeError } = await supabase
        .from("restaurants")
        .select(RESTAURANT_FIELDS)
        .ilike("slug", `%${slug}%`)
        .maybeSingle();

      if (ilikeError) throw ilikeError;
      if (ilikeData) return buildRestaurantConfig(ilikeData);

      const { data: firstData, error: firstError } = await supabase
        .from("restaurants")
        .select(RESTAURANT_FIELDS)
        .limit(1)
        .maybeSingle();

      if (firstError) throw firstError;
      if (firstData) return buildRestaurantConfig(firstData);

      throw new Error("No restaurant found");
    })();

    pendingFetches.current.set(slug, promise);

    try {
      const config = await promise;
      if (fetchKey.current !== slug) return null;
      restaurantCache.set(slug, config);
      setRestaurant(config);
      setLoading(false);
      return config;
    } catch (err) {
      if (fetchKey.current === slug) {
        setError(err.message);
        setLoading(false);
      }
      return null;
    } finally {
      pendingFetches.current.delete(slug);
    }
  }, []);

  const value = useMemo(
    () => ({ restaurant, loading, error, loadRestaurant, isLoaded: !!restaurant }),
    [restaurant, loading, error, loadRestaurant]
  );

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error("useRestaurant must be used within RestaurantProvider");
  return ctx;
}
