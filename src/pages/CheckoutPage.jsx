import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useCart } from "../hooks/useCart";
import { useMenu } from "../hooks/useMenu";
import { useMenuStore } from "../store/menuStore";
import { supabase } from "../lib/supabaseClient";
import { Toast } from "../components/Toast";
import { getStoredSlug } from "../utils/constants";
import { ArrowLeft, CreditCard, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

function generateOrderCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return "ORD-" + num;
}

export function CheckoutPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug } = useParams();
  
  const slug = urlSlug || getStoredSlug();
  
  const { cart, subtotal, tax, grandTotal } = useCart();
  const { restaurant, loading: menuLoading } = useMenu();
  const { loadMenu } = useMenuStore();

  const [localLoading, setLocalLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const orderNote = typeof window !== "undefined" ? sessionStorage.getItem("cart_order_note") || "" : "";

  const basePath = `/${slug}`;

  useEffect(() => {
    if (slug && !restaurant.id) {
      loadMenu(slug);
    }
  }, [slug, restaurant.id, loadMenu]);

  const isLoading = localLoading || menuLoading;
  const hasRestaurant = restaurant && restaurant.id;

  const handleCounterOrder = async () => {
    if (!cart || cart.length === 0) {
      setToastMsg("Your cart is empty.");
      setToastType("error");
      return;
    }

    if (!hasRestaurant) {
      setToastMsg("Restaurant data not loaded. Please go back and try again.");
      setToastType("error");
      return;
    }

    const tableId = localStorage.getItem("table_id") || null;
    console.log("TABLE_ID_BEING_SENT:", tableId);
    
    if (!tableId) {
      setToastMsg("Table not found. Please scan QR code again.");
      setToastType("error");
      return;
    }

    setLocalLoading(true);

    try {
      const itemsPayload = cart.map((item) => ({
        id: String(item.id ?? ""),
        name: String(item.name ?? "Unknown Item"),
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        is_veg: Boolean(item.isVeg),
      }));

      const orderData = {
        restaurant_id: restaurant.id,
        status: "pending",
        order_code: generateOrderCode(),
        total_price: grandTotal,
        payment_mode: "counter",
        items: itemsPayload,
        table_id: tableId,
      };
      
      if (orderNote) {
        orderData.note = orderNote;
      }

      const { data, error } = await supabase
        .from("live_orders")
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error("Counter order error:", error);
        throw new Error(error.message || "Failed to create order");
      }
      if (!data) throw new Error("Failed to create order");

      navigate(`${basePath}/waiting/${data.id}`);
    } catch (err) {
      const message = err?.message ?? "Something went wrong. Please try again.";
      setToastMsg(message);
      setToastType("error");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleOnlineOrder = async () => {
    if (!cart || cart.length === 0) {
      setToastMsg("Your cart is empty.");
      setToastType("error");
      return;
    }

    if (!hasRestaurant) {
      setToastMsg("Restaurant data not loaded. Please go back and try again.");
      setToastType("error");
      return;
    }

    const tableId = localStorage.getItem("table_id") || null;
    console.log("TABLE_ID_BEING_SENT:", tableId);
    
    if (!tableId) {
      setToastMsg("Table not found. Please scan QR code again.");
      setToastType("error");
      return;
    }

    setLocalLoading(true);

    try {
      const itemsPayload = cart.map((item) => ({
        id: String(item.id ?? ""),
        name: String(item.name ?? "Unknown Item"),
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        is_veg: Boolean(item.isVeg),
      }));

      const totalAmount = Math.round(grandTotal * 100) / 100;

      const insertData = {
        restaurant_id: restaurant.id,
        status: "pending",
        payment_mode: "online",
        order_code: generateOrderCode(),
        total_price: totalAmount,
        items: itemsPayload,
        table_id: tableId,
      };
      
      if (orderNote) {
        insertData.note = orderNote;
      }

      const { data: orderResponse, error: orderError } = await supabase
        .from("live_orders")
        .insert(insertData)
        .select()
        .single();

      if (orderError) {
        console.error("Order insert error:", orderError);
        throw new Error(orderError.message || "Failed to create order");
      }
      if (!orderResponse) throw new Error("Failed to create order");

      const tokenValue = `${orderResponse.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      sessionStorage.setItem("orderData", JSON.stringify({
        orderId: orderResponse.id,
        orderCode: orderResponse.order_code,
        amount: totalAmount,
      }));
      
      navigate(`${basePath}/payment/${tokenValue}`);
    } catch (err) {
      const message = err?.message ?? "Something went wrong. Please try again.";
      setToastMsg(message);
      setToastType("error");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button
          className="iconBtn pressable"
          onClick={() => navigate(`${basePath}/cart`)}
          aria-label="Back to cart"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="topBarTitle">Checkout</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="checkoutBody hideScrollbar">
        <section className="checkoutSection">
          <h2 className="checkoutSectionTitle">Items</h2>
          <div className="checkoutItems">
            {cart.map((item) => {
              const isVeg = Boolean(item.isVeg);
              return (
              <div className="checkoutItem" key={item.id}>
                <span
                  className={`vegDot ${isVeg ? "" : "nonveg"}`}
                  title={isVeg ? "Veg" : "Non-veg"}
                  aria-label={isVeg ? "Veg item" : "Non-veg item"}
                />
                <span className="checkoutItemName">{item.name}</span>
                <span className="checkoutItemQty">×{item.quantity}</span>
                <span className="checkoutItemPrice">₹{item.price * item.quantity}</span>
              </div>
              );
            })}
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
          {!hasRestaurant ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
              Loading restaurant data...
            </div>
          ) : (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="payBtn payBtn--counter"
                onClick={handleCounterOrder}
                disabled={isLoading}
                style={{ width: "100%", marginBottom: "12px" }}
              >
                <span className="payBtnIcon" aria-hidden="true">
                  <CreditCard size={20} />
                </span>
                <span>
                  <span className="payBtnLabel">Pay at Counter</span>
                  <span className="payBtnSub">Cash/Card Only</span>
                </span>
                {isLoading && <span className="btnSpinner" />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                className="payBtn payBtn--online"
                onClick={handleOnlineOrder}
                disabled={isLoading}
                style={{ width: "100%" }}
              >
                <span className="payBtnIcon" aria-hidden="true">
                  <Smartphone size={20} />
                </span>
                <span>
                  <span className="payBtnLabel">Pay Online</span>
                  <span className="payBtnSub">UPI Only</span>
                </span>
                {isLoading && <span className="btnSpinner" />}
              </motion.button>
            </>
          )}
        </section>
      </main>

      <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />
    </div>
  );
}
