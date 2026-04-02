import { useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import lottie from "lottie-web";
import successAnimation from "../assets/animations/Success.json";

export function OrderConfirmedPage() {
  const [, navigate] = useLocation();
  const { tableId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;

  const animationRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    localStorage.removeItem("qr_menu_cart");
    localStorage.removeItem("notes");
    sessionStorage.removeItem("orderData");
    sessionStorage.removeItem("cart_order_note");
    window.dispatchEvent(new Event("cart-cleared"));
    console.log("Cart cleared after order confirmed");
  }, []);

  useEffect(() => {
    if (containerRef.current && !animationRef.current) {
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: false,
        autoplay: true,
        animationData: successAnimation
      });
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
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

      <main className="orderSuccess">
        <div className="successContainer">
          <div className="successAnimationWrap">
            <div ref={containerRef} className="successAnimation" />
          </div>
          <h2 className="successTitle">Order Confirmed!</h2>
          <p className="successText">
            Your order has been accepted.<br />
            We will prepare it soon.
          </p>
          <button className="successBtn" onClick={goToMenu}>
            Order More
          </button>
        </div>
      </main>
    </div>
  );
}
