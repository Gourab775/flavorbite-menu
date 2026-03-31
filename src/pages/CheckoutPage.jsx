import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useCart } from "../hooks/useCart";
import { supabase } from "../lib/supabaseClient";
import { Toast } from "../components/Toast";
import { RESTAURANT_ID } from "../utils/constants";

function generateOrderCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return "ORD-" + num;
}

export function CheckoutPage() {
  const [, navigate] = useLocation();
  const { tableId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const { cart, subtotal, tax, grandTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const orderNote = typeof window !== "undefined" ? sessionStorage.getItem("cart_order_note") || "" : "";

  const handleCounterOrder = async () => {
    console.log("Restaurant ID:", RESTAURANT_ID);
    console.log("Counter flow triggered");
    if (!cart || cart.length === 0) {
      setToastMsg("Your cart is empty.");
      setToastType("error");
      return;
    }

    if (!RESTAURANT_ID) {
      setToastMsg("Restaurant ID missing");
      setToastType("error");
      return;
    }

    setLoading(true);

    try {
      const itemsPayload = cart.map((item) => ({
        id: String(item.id ?? ""),
        name: String(item.name ?? "Unknown Item"),
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        is_veg: Boolean(item.isVeg),
      }));

      const { data, error } = await supabase
        .from("live_orders")
        .insert({
          restaurant_id: RESTAURANT_ID,
          items: itemsPayload,
          table: currentTableId,
          status: "pending",
          payment_mode: "counter",
          order_code: generateOrderCode(),
          total_price: grandTotal,
          note: orderNote || null,
        })
        .select()
        .single();

      if (error) throw error;

      clearCart();
      localStorage.removeItem("qr_menu_cart");
      sessionStorage.removeItem("cart_order_note");
      console.log("Cart cleared after payment");
      navigate(`/t/${currentTableId}/waiting/${data.id}`);
    } catch (err) {
      const message = err?.message ?? "Something went wrong. Please try again.";
      setToastMsg(message);
      setToastType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleOnlineOrder = async () => {
    console.log("Restaurant ID:", RESTAURANT_ID);
    console.log("Online flow triggered");
    if (!cart || cart.length === 0) {
      setToastMsg("Your cart is empty.");
      setToastType("error");
      return;
    }

    if (!RESTAURANT_ID) {
      setToastMsg("Restaurant ID missing");
      setToastType("error");
      return;
    }

    setLoading(true);

    try {
      const itemsPayload = cart.map((item) => ({
        id: String(item.id ?? ""),
        name: String(item.name ?? "Unknown Item"),
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        is_veg: Boolean(item.isVeg),
      }));

      const { data, error } = await supabase
        .from("live_orders")
        .insert({
          restaurant_id: RESTAURANT_ID,
          items: itemsPayload,
          table: currentTableId,
          status: "pending",
          payment_mode: "online",
          order_code: generateOrderCode(),
          total_price: grandTotal,
          note: orderNote || null,
        })
        .select()
        .single();

      if (error) throw error;

      clearCart();
      localStorage.removeItem("qr_menu_cart");
      sessionStorage.removeItem("cart_order_note");
      sessionStorage.setItem("orderData", JSON.stringify({
        orderId: data.id,
        orderCode: data.order_code,
        amount: grandTotal
      }));
      navigate(`/t/${currentTableId}/payment/${data.id}?code=${encodeURIComponent(data.order_code)}&amount=${encodeURIComponent(grandTotal)}`);
    } catch (err) {
      const message = err?.message ?? "Something went wrong. Please try again.";
      setToastMsg(message);
      setToastType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button
          className="iconBtn pressable"
          onClick={() => navigate(`/t/${currentTableId}/cart`)}
          aria-label="Back to cart"
        >
          ←
        </button>
        <h1 className="topBarTitle">Checkout</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="checkoutBody hideScrollbar">
        <section className="checkoutSection">
          <h2 className="checkoutSectionTitle">Items</h2>
          <div className="checkoutItems">
            {cart.map((item) => (
              <div className="checkoutItem" key={item.id}>
                <span className={`vegDot ${item.isVeg ? "" : "nonveg"}`} aria-label={item.isVeg ? "Veg" : "Non-veg"} />
                <span className="checkoutItemName">{item.name}</span>
                <span className="checkoutItemQty">×{item.quantity}</span>
                <span className="checkoutItemPrice">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="checkoutSection">
          <h2 className="checkoutSectionTitle">Bill</h2>
          <div className="billCard">
            <div className="billRows">
              <div className="billRow">
                <span>Subtotal</span>
                <span>₹{Math.round(subtotal)}</span>
              </div>
              <div className="billRow">
                <span>GST (5%)</span>
                <span>₹{Math.round(tax)}</span>
              </div>
              <div className="billRow billRow--total">
                <span>Total</span>
                <span>₹{Math.round(grandTotal)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="checkoutSection">
          <button
            className="payBtn payBtn--counter pressable"
            onClick={handleCounterOrder}
            disabled={loading}
            style={{ width: "100%", marginBottom: "12px" }}
          >
            <span className="payBtnIcon" aria-hidden="true">💳</span>
            <span>
              <span className="payBtnLabel">Pay at Counter</span>
              <span className="payBtnSub">Cash/Card Only</span>
            </span>
            {loading && <span className="btnSpinner" />}
          </button>

          <button
            className="payBtn payBtn--online pressable"
            onClick={handleOnlineOrder}
            disabled={loading}
            style={{ width: "100%" }}
          >
            <span className="payBtnIcon" aria-hidden="true">📱</span>
            <span>
              <span className="payBtnLabel">Pay Online</span>
              <span className="payBtnSub">UPI Only</span>
            </span>
            {loading && <span className="btnSpinner" />}
          </button>
        </section>
      </main>

      <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />
    </div>
  );
}
