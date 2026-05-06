import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useCart } from "../hooks/useCart";
import { useMenu } from "../hooks/useMenu";
import { useMenuStore } from "../store/menuStore";
import { supabase } from "../lib/supabaseClient";
import { Toast } from "../components/Toast";
import { getStoredSlug } from "../utils/constants";
import { ArrowLeft, CreditCard, Smartphone, AlertCircle } from "lucide-react";
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

  const [tableError, setTableError] = useState(null);

  useEffect(() => {
    if (slug && !restaurant.id) {
      loadMenu(slug);
    }
    
    // Check for table_token on mount
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

    // Get table_token and table_id from localStorage
    const tableToken = localStorage.getItem("table_token") || null;
    const storedTableId = localStorage.getItem("table_id") || null;

    console.log("[Checkout] Starting Counter Order validation...");
    console.log("[Checkout] Using tableToken from storage:", tableToken);
    console.log("[Checkout] Using storedTableId from storage:", storedTableId);
    
    if (!tableToken) {
      setToastMsg("Table not found. Please scan QR code again.");
      setToastType("error");
      return;
    }

    setLocalLoading(true);

    try {
      // Validate using table_token, NOT id - get the real id from the result
      const { data: tableData, error: tableError } = await supabase
        .from("restaurant_tables")
        .select("id")
        .eq("table_token", tableToken)
        .maybeSingle();

      if (tableError) {
        console.error("[Checkout] Table lookup error:", tableError);
        throw new Error("Could not validate table. Please try again.");
      }

      if (!tableData) {
        console.error("[Checkout] Invalid table_token - not found in DB:", tableToken);
        throw new Error("Invalid table. Please rescan the QR code from the beginning.");
      }

      console.log("[Checkout] Table query result:", tableData);
      console.log("[Checkout] FETCHED_TABLE_ID (real PK):", tableData?.id);

      const validTableId = tableData.id;
      // Double check it matches our stored ID for consistency
      if (storedTableId && storedTableId !== validTableId) {
        console.warn("[Checkout] Stored table_id mismatch! Using verified ID:", validTableId);
      }

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
        table_id: validTableId, // Always use the verified database ID
      };
      
      if (orderNote) {
        orderData.note = orderNote;
      }

      const { data, error } = await supabase
        .from("live_orders")
        .insert(orderData)
        .select()
        .maybeSingle();

      if (error) {
        console.error("[Checkout] Counter order error:", error);
        throw new Error(error.message || "Failed to create order");
      }
      if (!data) throw new Error("Failed to create order - no response data");

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

    // Get table_token and table_id from localStorage
    const tableToken = localStorage.getItem("table_token") || null;
    const storedTableId = localStorage.getItem("table_id") || null;
    
    console.log("[Checkout] Starting Online Order validation...");
    console.log("[Checkout] Using tableToken from storage:", tableToken);
    console.log("[Checkout] Using storedTableId from storage:", storedTableId);
    
    if (!tableToken) {
      setToastMsg("Table not found. Please scan QR code again.");
      setToastType("error");
      return;
    }

    setLocalLoading(true);

    try {
      // Validate using table_token, NOT id - get the real id from the result
      const { data: tableData, error: tableError } = await supabase
        .from("restaurant_tables")
        .select("id")
        .eq("table_token", tableToken)
        .maybeSingle();

      if (tableError) {
        console.error("[Checkout] Table lookup error:", tableError);
        throw new Error("Could not validate table. Please try again.");
      }

      if (!tableData) {
        console.error("[Checkout] Invalid table_token - not found in DB:", tableToken);
        throw new Error("Invalid table. Please rescan the QR code from the beginning.");
      }

      console.log("[Checkout] Table query result:", tableData);
      console.log("[Checkout] FETCHED_TABLE_ID (real PK):", tableData?.id);
      
      const validTableId = tableData.id;
      // Double check it matches our stored ID for consistency
      if (storedTableId && storedTableId !== validTableId) {
        console.warn("[Checkout] Stored table_id mismatch! Using verified ID:", validTableId);
      }

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
        table_id: validTableId, // Always use the verified database ID
      };
      
      if (orderNote) {
        insertData.note = orderNote;
      }

      const { data: orderResponse, error: orderError } = await supabase
        .from("live_orders")
        .insert(insertData)
        .select()
        .maybeSingle();

      if (orderError) {
        console.error("[Checkout] Order insert error:", orderError);
        throw new Error(orderError.message || "Failed to create order");
      }
      if (!orderResponse) throw new Error("Failed to create order - no response data");

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
