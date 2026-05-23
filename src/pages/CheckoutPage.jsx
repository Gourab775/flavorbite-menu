import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useCart } from "../hooks/useCart";
import { useMenu } from "../hooks/useMenu";
import { useMenuStore } from "../store/menuStore";
import { supabase } from "../lib/supabaseClient";
import { Toast } from "../components/Toast";
import { getStoredSlug } from "../utils/constants";
import { addOrderToDeviceSession, getOrCreateDeviceOrderCode, markDeviceSessionOrdersUnread } from "../utils/session";
import { ArrowLeft, AlertCircle } from "lucide-react";

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

  const basePath = `/${slug}`;

  const [tableError, setTableError] = useState(null);

  useEffect(() => {
    if (slug && !restaurant.id) {
      loadMenu(slug);
    }

    const token = localStorage.getItem("table_token") || new URLSearchParams(window.location.search).get("table");
    if (!token) {
      console.warn("[Checkout] No table_token found on mount.");
      setTableError("Invalid table. Please scan the QR code from your table to proceed.");
    } else {
      console.log("[Checkout] table_token verified on mount:", token);
    }
  }, [slug, restaurant.id, loadMenu]);

  const isLoading = localLoading || menuLoading;
  const hasRestaurant = restaurant && restaurant.id;

  if (tableError) {
    return (
      <div className="pageLayout">
        <header className="topBar">
          <button className="iconBtn pressable" onClick={() => navigate(`${basePath}/cart`)}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="topBarTitle">Checkout</h1>
          <div style={{ width: 40 }} />
        </header>
        <main className="emptyState" style={{ height: "calc(100vh - 60px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="emptyIcon" style={{ color: "#ff6b6b" }}>
            <AlertCircle size={50} strokeWidth={1.5} />
          </div>
          <h2 style={{ marginTop: "20px" }}>Table Required</h2>
          <p className="muted" style={{ maxWidth: "260px", margin: "12px auto" }}>
            {tableError}
          </p>
          <button
            className="btn primary"
            style={{ marginTop: "20px" }}
            onClick={() => navigate(`${basePath}`)}
          >
            Go to Menu
          </button>
        </main>
      </div>
    );
  }

  const handleConfirmOrder = async () => {
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

    const tableToken = localStorage.getItem("table_token") || null;

    if (!tableToken) {
      setToastMsg("Table not found. Please scan QR code again.");
      setToastType("error");
      return;
    }

    setLocalLoading(true);

    try {
      const { data: tableData, error: tableError } = await supabase
        .from("restaurant_tables")
        .select("id")
        .eq("table_token", tableToken)
        .maybeSingle();

      if (tableError) {
        throw new Error("Could not validate table. Please try again.");
      }

      if (!tableData) {
        throw new Error("Invalid table. Please rescan the QR code from the beginning.");
      }

      const itemsPayload = cart.map((item) => ({
        id: String(item.id ?? ""),
        name: String(item.name ?? "Unknown Item"),
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        is_veg: Boolean(item.isVeg),
      }));

      const orderNote = sessionStorage.getItem("cart_order_note") || "";

      const pendingOrder = {
        restaurant_id: restaurant.id,
        status: "pending",
        payment_mode: "counter",
        order_code: getOrCreateDeviceOrderCode(),
        total_price: grandTotal,
        items: itemsPayload,
        table_id: tableData.id,
      };

      if (orderNote) {
        pendingOrder.note = orderNote;
      }

      sessionStorage.setItem("pending_order", JSON.stringify(pendingOrder));
      addOrderToDeviceSession(pendingOrder);
      markDeviceSessionOrdersUnread();

      const { error: insertError } = await supabase
        .from("live_orders")
        .insert(pendingOrder);

      if (insertError) {
        throw new Error("Failed to place order. Please try again.");
      }

      navigate(`${basePath}/order-sent`);
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

        <section className="checkoutSection" style={{ paddingBottom: 100 }}>
          <button
            className="btn primary"
            onClick={handleConfirmOrder}
            disabled={isLoading}
            style={{ width: "100%", padding: "16px", fontSize: "16px", fontWeight: 600 }}
          >
            {isLoading ? "Processing..." : "Confirm Order"}
          </button>
        </section>
      </main>

      <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />
    </div>
  );
}
