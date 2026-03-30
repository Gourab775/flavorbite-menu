import { useCallback, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useCart } from "../hooks/useCart";
import { placeOrder } from "../utils/liveOrders";
import { RESTAURANT_ID } from "../utils/constants";
import { supabase } from "../lib/supabaseClient";
import { Toast } from "../components/Toast";

const CART_NOTE_KEY = "cart_order_note";

export function CheckoutPage() {
  const [, navigate] = useLocation();
  const { tableId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const { cart, subtotal, tax, grandTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const [orderNote] = useState(() => sessionStorage.getItem(CART_NOTE_KEY) || "");
  const debounceRef = useRef(false);

  const showToast = useCallback((msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
  }, []);

  const place = useCallback(
    async (paymentMode) => {
      if (debounceRef.current) return;
      debounceRef.current = true;

      if (!cart || cart.length === 0) {
        setToastMsg("Your cart is empty.");
        setToastType("error");
        debounceRef.current = false;
        return;
      }

      setLoading(true);

      try {
        const result = await placeOrder({
          restaurantId: RESTAURANT_ID,
          items: cart,
          totalPrice: grandTotal,
          paymentMode,
          note: orderNote || null,
          tableId: currentTableId,
        });

        clearCart();
        sessionStorage.removeItem(CART_NOTE_KEY);
        
        if (paymentMode === "counter") {
          sessionStorage.setItem("last_order_id", result.orderId);
          navigate(`/t/${currentTableId}/order-status`);
        } else {
          navigate(`/t/${currentTableId}/order-success`);
        }
      } catch (err) {
        const message = err?.message ?? "Something went wrong. Please try again.";
        showToast(message, "error");
        debounceRef.current = false;
      } finally {
        setLoading(false);
      }
    },
    [cart, grandTotal, clearCart, navigate, showToast, orderNote, currentTableId]
  );

  const payCounter = () => place("pay_at_counter");

  const payOnline = async () => {
    if (debounceRef.current) return;
    if (!cart || cart.length === 0) {
      setToastMsg("Your cart is empty.");
      setToastType("error");
      return;
    }

    debounceRef.current = true;
    setLoading(true);

    try {
      const orderPayload = {
        restaurant_id: RESTAURANT_ID,
        total_price: grandTotal,
        payment_mode: "online",
        status: "pending",
        note: orderNote || null,
        table: currentTableId,
        items: cart.map((item) => ({
          id: String(item.id ?? ""),
          name: String(item.name ?? "Unknown Item"),
          price: Number(item.price ?? 0),
          quantity: Number(item.quantity ?? 1),
          is_veg: Boolean(item.isVeg),
        })),
      };

      console.log("=== PAY ONLINE DEBUG ===");
      console.log("Table ID:", currentTableId);
      console.log("Payload:", JSON.stringify(orderPayload, null, 2));

      const { data, error } = await supabase
        .from("live_orders")
        .insert([orderPayload])
        .select("id, order_code")
        .single();

      console.log("Response:", data, error);

      if (error) throw error;

      const orderCode = data?.order_code ?? data?.id;
      console.log("[Checkout] Order created:", data);

      clearCart();
      sessionStorage.removeItem(CART_NOTE_KEY);
      navigate(`/t/${currentTableId}/payment?orderId=${encodeURIComponent(orderCode)}&amount=${encodeURIComponent(grandTotal)}`);
    } catch (err) {
      const message = err?.message ?? "Something went wrong. Please try again.";
      showToast(message, "error");
      debounceRef.current = false;
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
          <h2 className="checkoutSectionTitle">Payment</h2>
          <div className="payOptions">
            <button
              className="payBtn payBtn--counter pressable"
              onClick={payCounter}
              disabled={loading}
              aria-label="Pay at Counter"
            >
              <span className="payBtnIcon" aria-hidden="true">💳</span>
              <span>
                <span className="payBtnLabel">Pay at Counter</span>
                <span className="payBtnSub">Cash/Card Only</span>
              </span>
              {loading && <span className="btnSpinner" aria-label="Processing" />}
            </button>

            <button
              className="payBtn payBtn--online pressable"
              onClick={payOnline}
              disabled={loading}
              aria-label="Pay Online"
            >
              <span className="payBtnIcon" aria-hidden="true">📱</span>
              <span>
                <span className="payBtnLabel">Pay Online</span>
                <span className="payBtnSub">UPI Only</span>
              </span>
              {loading && <span className="btnSpinner" aria-label="Processing" />}
            </button>
          </div>
        </section>
      </main>

      <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />
    </div>
  );
}
