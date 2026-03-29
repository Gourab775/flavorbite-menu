import { supabase, isSupabaseConfigured, supabaseUrl } from "../lib/supabaseClient";

/**
 * Places an order — single insert into live_orders with all items stored as JSONB.
 *
 * @param {Object} params
 * @param {string}  params.restaurantId  - must not be null/undefined
 * @param {Array}   params.items         - cart items [{ id, name, price, quantity, isVeg, table }]
 * @param {number}  params.totalPrice   - must be a number
 * @param {"counter"|"online"} params.paymentMode
 * @param {string|null} params.note - optional order note
 * @param {string|null} params.tableId - optional table number
 * @returns {Promise<{ orderId: string }>}
 */
export async function placeOrder({ restaurantId, items, totalPrice, paymentMode, note = null, tableId = null }) {
  console.log("=== ORDER DEBUG ===");
  console.log("Supabase Configured:", isSupabaseConfigured);
  console.log("Supabase URL:", supabaseUrl);
  console.log("Table ID:", tableId);

  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
    );
  }

  if (!restaurantId || typeof restaurantId !== "string" || restaurantId.trim() === "") {
    throw new Error(
      "Restaurant ID is missing. Check VITE_RESTAURANT_SLUG in your .env file."
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty. Add items before placing an order.");
  }

  const safeTotal = Number(totalPrice);
  if (isNaN(safeTotal) || safeTotal <= 0) {
    throw new Error(
      `Invalid total price "${totalPrice}". Please refresh the cart and try again.`
    );
  }

  if (!["counter", "online"].includes(paymentMode)) {
    throw new Error("Invalid payment mode. Must be 'counter' or 'online'.");
  }

  const orderPayload = {
    restaurant_id: restaurantId.trim(),
    total_price: safeTotal,
    payment_mode: paymentMode,
    status: "pending",
    note: note || null,
    table: tableId || null,
    items: items.map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.name ?? "Unknown Item"),
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      is_veg: Boolean(item.isVeg),
    })),
  };

  console.log("Payload:", JSON.stringify(orderPayload, null, 2));

  console.log("Making request to: POST", supabaseUrl + "/rest/v1/live_orders");

  const { data, error } = await supabase
    .from("live_orders")
    .insert([orderPayload])
    .select("id, order_code")
    .single();

  console.log("Response data:", data);
  console.log("Response error:", error);

  if (error) {
    console.error("[placeOrder] insert error:", error);
    throw new Error(`Order failed: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("Order insert succeeded but no ID was returned. Please try again.");
  }

  console.log("=== ORDER SUCCESS ===");
  return { orderId: data.id };
}
