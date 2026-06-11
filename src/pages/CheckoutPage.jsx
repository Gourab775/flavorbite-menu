import { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useCart } from "../hooks/useCart";
import { useMenu } from "../hooks/useMenu";
import { useMenuStore } from "../store/menuStore";
import { supabase } from "../lib/supabaseClient";
import { Toast } from "../components/Toast";
import { useGoBack } from "../context/NavigationContext";
import { getStoredSlug } from "../utils/constants";
import { addOrderToDeviceSession, getOrCreateDeviceOrderCode, markDeviceSessionOrdersUnread, dispatchDeviceOrderUpdate } from "../utils/session";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, AlertCircle, ArrowRight, Clock, X } from "lucide-react";

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
  const goBack = useGoBack(`${basePath}/cart`);

  const [tableError, setTableError] = useState(null);
  const [orderState, setOrderState] = useState("idle");
  const [countdownVal, setCountdownVal] = useState(10);
  const executeOrderRef = useRef(null);
  const submittingRef = useRef(false);

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

  useEffect(() => {
    if (orderState !== "countdown") return;
    if (countdownVal <= 0) {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setOrderState("submitting");
      if (executeOrderRef.current) {
        executeOrderRef.current();
      }
      return;
    }
    const timer = setTimeout(() => setCountdownVal((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [orderState, countdownVal]);

  const isLoading = localLoading || menuLoading;
  const hasRestaurant = restaurant && restaurant.id;

  // Allowed columns in live_orders — only these keys go into the payload
  const ALLOWED_COLUMNS = new Set([
    "restaurant_id", "table_id", "status", "order_code",
    "total_price", "items", "note", "customer_name", "order_type",
  ]);

  // Check that table_id column actually exists in live_orders
  async function tableIdColumnExists() {
    try {
      const { error } = await supabase.from("live_orders").select("table_id").limit(0);
      return !error;
    } catch {
      return false;
    }
  }

  if (tableError) {
    return (
      <div className="pageLayout">
        <header className="topBar">
          <button className="iconBtn pressable" onClick={goBack}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="topBarTitle">Checkout</h1>
          <div style={{ width: 40 }} />
        </header>
        <main className="emptyState" style={{ height: "calc(100vh - 60px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="emptyIcon" style={{ color: "var(--nonveg)" }}>
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

      const orderCode = getOrCreateDeviceOrderCode() || `ORD-${Date.now()}`;
      console.log("[Checkout] Order code:", orderCode);

      const hasTableId = await tableIdColumnExists();
      console.log("[Checkout] table_id column exists:", hasTableId);

      // Build payload with only the allowed columns
      const pendingOrderRaw = {
        restaurant_id: restaurant.id,
        status: "pending",
        order_code: orderCode,
        total_price: Number(grandTotal) || 0,
        items: itemsPayload,
        note: sessionStorage.getItem("cart_order_note") || undefined,
        order_type: sessionStorage.getItem("selected_order_type"),
      };

      if (hasTableId) {
        pendingOrderRaw.table_id = tableData.id;
      }

      // Strip any keys not in the allowed set
      const pendingOrder = Object.fromEntries(
        Object.entries(pendingOrderRaw).filter(
          ([key, val]) => ALLOWED_COLUMNS.has(key) && val !== undefined && val !== null
        )
      );

      // Validate required fields exist in final payload
      const requiredFields = ["restaurant_id", "status", "order_code", "total_price", "items"];
      for (const field of requiredFields) {
        if (pendingOrder[field] === undefined || pendingOrder[field] === null) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      console.log('ORDER TYPE:', pendingOrder.order_type);
      console.log("[Checkout] Final order payload:", JSON.stringify(pendingOrder, null, 2));

      const { error: insertError } = await supabase
        .from("live_orders")
        .insert(pendingOrder);

      if (insertError) {
        console.error("[Checkout] Supabase insert error:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          payload: JSON.stringify(pendingOrder),
        });
        throw new Error(`Failed to place order: ${insertError.message}`);
      }

      console.log("[Checkout] Order inserted successfully:", {
        order_code: orderCode,
        status: "pending",
      });

      // Only save locally AFTER successful DB insert
      sessionStorage.setItem("pending_order", JSON.stringify(pendingOrder));
      addOrderToDeviceSession(pendingOrder);
      markDeviceSessionOrdersUnread();
      dispatchDeviceOrderUpdate();

      navigate(`${basePath}/order-sent`);
    } catch (err) {
      console.error("[Checkout] Order failed:", err);
      const message = err?.message ?? "Something went wrong. Please try again.";
      setToastMsg(message);
      setToastType("error");
      setOrderState("idle");
      submittingRef.current = false;
    } finally {
      setLocalLoading(false);
    }
  };

  executeOrderRef.current = handleConfirmOrder;

  const handleInitiateOrder = () => {
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
    setOrderState("countdown");
    setCountdownVal(10);
  };

  const handleCancelOrder = () => {
    setOrderState("idle");
    setCountdownVal(10);
    submittingRef.current = false;
  };

  const progress = orderState === "countdown" ? (countdownVal / 10) * 100 : 0;

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button
          className="iconBtn pressable"
          onClick={goBack}
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

        <section className="checkoutSection" style={{ paddingBottom: 100, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <AnimatePresence mode="wait">
            {orderState !== "submitting" ? (
              <motion.button
                key="confirm-btn"
                className="confirmOrderBtn"
                onClick={orderState === "idle" ? handleInitiateOrder : undefined}
                disabled={isLoading || orderState === "countdown"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {isLoading ? "Processing..." : orderState === "countdown" ? `Confirming (${countdownVal}s)` : "Confirm Order"}
                {!isLoading && orderState === "idle" && <ArrowRight size={20} />}
              </motion.button>
            ) : (
              <motion.div
                key="submitting-ui"
                className="submittingContainer"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="submittingSpinner">
                  <span className="submittingDot" />
                  <span className="submittingDot" />
                  <span className="submittingDot" />
                </div>
                <p className="countdownLabel" style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>
                  Placing your order...
                </p>
                <p className="countdownSubtext">
                  Please wait while we confirm with the restaurant
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <AnimatePresence>
        {orderState === "countdown" && (
          <motion.div
            key="countdown-modal-overlay"
            className="countdownModalOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="countdownContainer"
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="countdownHeader">
                <span className="countdownLabel">
                  <Clock size={16} />
                  Confirming order...
                </span>
                <span className="countdownTimer">{countdownVal}s</span>
              </div>
              <div className="countdownTrack">
                <div className="countdownFill" style={{ width: `${progress}%` }} />
                <div className="countdownDot" style={{ left: `${progress}%` }} />
              </div>
              <p className="countdownSubtext">
                Your order will be confirmed automatically unless you cancel
              </p>
              <button
                className="countdownCancelBtn"
                onClick={handleCancelOrder}
                disabled={isLoading}
              >
                <X size={18} />
                Cancel Order
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />
    </div>
  );
}
