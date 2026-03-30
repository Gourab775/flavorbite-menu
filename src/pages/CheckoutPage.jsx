import { useCallback, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useCart } from "../hooks/useCart";
import { supabase } from "../lib/supabaseClient";
import { Toast } from "../components/Toast";

function generateOrderCode() {
  return "ORD-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
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
    if (!cart || cart.length === 0) {
      setToastMsg("Your cart is empty.");
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
      sessionStorage.removeItem("cart_order_note");
      navigate(`/t/${currentTableId}/waiting/${data.id}`);
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
            style={{ width: "100%" }}
          >
            <span className="payBtnIcon" aria-hidden="true">💳</span>
            <span>
              <span className="payBtnLabel">Pay at Counter</span>
              <span className="payBtnSub">Cash/Card Only</span>
            </span>
            {loading && <span className="btnSpinner" />}
          </button>
        </section>
      </main>

      <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />
    </div>
  );
}
