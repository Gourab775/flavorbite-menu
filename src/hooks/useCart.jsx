/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "qr_menu_cart";
const LEGACY_STORAGE_KEY = "qr-menu-cart";
const TABLE_KEY = "tableId";

function getTableId() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TABLE_KEY);
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadCart() {
  if (typeof window === "undefined") return [];
  const tableId = sessionStorage.getItem(TABLE_KEY);
  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
    return parsed.items.map((i) => ({
      ...i,
      isVeg: Boolean(i.isVeg ?? false),
      imageUrl: i.imageUrl ?? i.image_url ?? i.imageUrl,
      table: i.table ?? tableId ?? null,
    }));
  }

  // One-time migration from legacy storage (array form).
  const legacy = safeParse(window.localStorage.getItem(LEGACY_STORAGE_KEY));
  if (Array.isArray(legacy)) {
    return legacy.map((i) => ({
      ...i,
      isVeg: Boolean(i.isVeg ?? false),
      imageUrl: i.imageUrl ?? i.image_url ?? i.imageUrl,
      table: tableId ?? null,
    }));
  }

  return [];
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [vegMode, setVegMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleCartCleared = () => {
      setCart([]);
    };
    window.addEventListener("cart-cleared", handleCartCleared);
    return () => window.removeEventListener("cart-cleared", handleCartCleared);
  }, []);


  useEffect(() => {
    try {
      const tableId = getTableId();
      const payload = {
        items: cart.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity ?? 0,
          isVeg: Boolean(i.isVeg),
          image_url: i.imageUrl ?? i.image_url ?? "",
          imageUrl: i.imageUrl ?? i.image_url ?? "",
          table: i.table ?? tableId ?? null,
        })),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [cart]);

  const addToCart = (item) => {
    const tableId = getTableId();
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1, table: tableId }];
    });
  };

  const increaseQty = (itemId) => {
    const tableId = getTableId();
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + 1, table: i.table || tableId } : i))
    );
  };

  const decreaseQty = (itemId) => {
    const tableId = getTableId();
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1, table: i.table || tableId } : i
        );
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearCart = () => setCart([]);

  const totalItems = useMemo(
    () => cart.reduce((acc, i) => acc + (i.quantity ?? 0), 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((acc, i) => acc + (i.price ?? 0) * (i.quantity ?? 0), 0),
    [cart]
  );

  const qtyById = useMemo(() => {
    const map = Object.create(null);
    for (const i of cart) map[i.id] = i.quantity ?? 0;
    return map;
  }, [cart]);

  const tax = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const grandTotal = useMemo(() => subtotal + tax, [subtotal, tax]);

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      increaseQty,
      decreaseQty,
      removeFromCart,
      clearCart,
      totalItems,
      subtotal,
      tax,
      grandTotal,
      qtyById,
      vegMode,
      setVegMode,
      searchQuery,
      setSearchQuery,
    }),
    [
      cart,
      totalItems,
      subtotal,
      tax,
      grandTotal,
      qtyById,
      vegMode,
      searchQuery,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}

