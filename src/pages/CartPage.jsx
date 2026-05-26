import { useCallback, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useCart } from "../hooks/useCart";
import { Toast } from "../components/Toast";
import { getStoredSlug } from "../utils/constants";
import { ShoppingBag } from "lucide-react";

const CART_NOTE_KEY = "cart_order_note";

export function CartPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug } = useParams();
  
  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;
  const {
    cart,
    increaseQty,
    decreaseQty,
    removeFromCart,
    clearCart,
    subtotal,
    tax,
    grandTotal,
  } = useCart();

  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const [orderNote, setOrderNote] = useState(() => {
    return sessionStorage.getItem(CART_NOTE_KEY) || "";
  });

  const handleNoteChange = useCallback((e) => {
    const value = e.target.value;
    setOrderNote(value);
    sessionStorage.setItem(CART_NOTE_KEY, value);
  }, []);

  const showToast = useCallback((msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
  }, []);

  const handleRemove = useCallback(
    (item) => {
      removeFromCart(item.id);
      showToast(`"${item.name}" removed`);
    },
    [removeFromCart, showToast]
  );

  const handleClear = useCallback(() => {
    clearCart();
    sessionStorage.removeItem(CART_NOTE_KEY);
    setOrderNote("");
    showToast("Cart cleared");
  }, [clearCart, showToast]);

  if (cart.length === 0) {
    return (
      <div className="pageLayout">
        <header className="topBar">
          <button
            className="iconBtn pressable"
            onClick={() => navigate(basePath)}
            aria-label="Back to menu"
          >
            ←
          </button>
          <h1 className="topBarTitle">My Cart</h1>
          <div style={{ width: 40 }} />
        </header>

        <main className="emptyWrap">
          <div className="emptyIllo" aria-hidden="true">
            <ShoppingBag size={64} strokeWidth={1} opacity={0.3} />
          </div>
          <h2 className="emptyTitle">Your cart is empty</h2>
          <p className="emptySub">Add items from the menu to get started.</p>
          <button
            className="btn primary pressable"
            onClick={() => navigate(basePath)}
          >
            Browse Menu
          </button>
        </main>

        <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />
      </div>
    );
  }

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button
          className="iconBtn pressable"
          onClick={() => navigate(basePath)}
          aria-label="Back to menu"
        >
          ←
        </button>
        <h1 className="topBarTitle">My Cart</h1>
        <button
          className="clearBtn pressable"
          onClick={handleClear}
          aria-label="Clear cart"
        >
          Clear
        </button>
      </header>

      <main className="cartBody hideScrollbar">
        {/* ── Item cards ── */}
        <div className="cartItems">
          {cart.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onRemove={handleRemove}
              onIncrease={() => increaseQty(item.id)}
              onDecrease={() => decreaseQty(item.id)}
            />
          ))}
        </div>

        {/* ── Add Note ── */}
        <div className="noteSection">
          <input
            type="text"
            className="noteInput"
            placeholder="Add note for your order..."
            value={orderNote}
            onChange={handleNoteChange}
            enterKeyHint="done"
            aria-label="Order note"
          />
        </div>

        {/* ── Bill summary ── */}
        <div className="billCard">
          <h3 className="billTitle">Bill Summary</h3>
          <div className="billRows">
            <div className="billRow">
              <span>Subtotal</span>
              <span>₹{Math.round(subtotal)}</span>
            </div>
            <div className="billRow">
              <span>GST &amp; Tax (5%)</span>
              <span>₹{Math.round(tax)}</span>
            </div>
            <div className="billRow billRow--total">
              <span>Total</span>
              <span>₹{Math.round(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div style={{ height: 100 }} />
      </main>

      {/* ── Sticky checkout CTA ── */}
      <div className="stickyCta">
        <button
          className="ctaBtn primary pressable"
          onClick={() => {
            sessionStorage.setItem(CART_NOTE_KEY, orderNote);
            navigate(`${basePath}/checkout`);
          }}
          aria-label="Proceed to checkout"
        >
          <span>Proceed to Checkout</span>
          <span className="ctaPrice">₹{Math.round(grandTotal)}</span>
        </button>
      </div>

      <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />
    </div>
  );
}

// ── Inner item card (memoized) ───────────────────────────────────────────────
function CartItemCard({ item, onRemove, onIncrease, onDecrease }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const isVeg = Boolean(item.isVeg);

  return (
    <div className="cartCard">
      <div className="cartCardImgWrap imgShell">
        {!imgLoaded && <div className="imgSkeleton" aria-hidden="true" />}
        {item.imageUrl && item.imageUrl.trim() !== "" ? (
          <img
            className={`cartCardImg imgFade ${imgLoaded ? "loaded" : ""}`}
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="cartCardImg placeholder" />
        )}
      </div>

      <div className="cartCardBody">
        <div className="cartCardTop">
          <div className="cartCardNameRow">
            <span
              className={`vegDot ${isVeg ? "" : "nonveg"}`}
              title={isVeg ? "Veg" : "Non-veg"}
              aria-label={isVeg ? "Veg item" : "Non-veg item"}
            />
            <span className="cartCardName">{item.name}</span>
          </div>
          <button
            className="removeBtn pressable"
            onClick={() => onRemove(item)}
            aria-label={`Remove ${item.name}`}
          >
            Remove
          </button>
        </div>

        <div className="cartCardBottom">
          <span className="cartCardPrice">₹{item.price} × {item.quantity}</span>
          <div className="stepper">
            <button
              className="stepBtn pressable"
              onClick={onDecrease}
              aria-label="Decrease quantity"
              disabled={item.quantity === 0}
            >
              −
            </button>
            <span className="stepQty" aria-live="polite">{item.quantity}</span>
            <button
              className="stepBtn primary pressable"
              onClick={onIncrease}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <span className="cartCardLineTotal">₹{item.price * item.quantity}</span>
        </div>
      </div>
    </div>
  );
}
