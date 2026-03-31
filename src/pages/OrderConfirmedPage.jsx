import { useEffect } from "react";
import { useLocation, useParams } from "wouter";

export function OrderConfirmedPage() {
  const [, navigate] = useLocation();
  const { tableId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;

  useEffect(() => {
    localStorage.removeItem("qr_menu_cart");
    localStorage.removeItem("notes");
    sessionStorage.removeItem("orderData");
    sessionStorage.removeItem("cart_order_note");
    window.dispatchEvent(new Event("cart-cleared"));
    console.log("Cart cleared after order confirmed");
  }, []);

  const goToMenu = () => {
    navigate(`/t/${currentTableId}`);
  };

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={goToMenu} aria-label="Back to menu">
          ←
        </button>
        <h1 className="topBarTitle">Order Confirmed</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="emptyWrap">
        <div className="emptyIllo" aria-hidden="true">
          ✅
        </div>
        <h2 className="emptyTitle">Order Confirmed!</h2>
        <p className="emptySub">
          Your order has been accepted.<br />
          We will prepare it soon.
        </p>
        <button className="btn primary pressable" onClick={goToMenu} style={{ marginTop: 24 }}>
          Order More
        </button>
      </main>
    </div>
  );
}
