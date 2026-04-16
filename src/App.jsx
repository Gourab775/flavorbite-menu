import { useEffect, useState } from "react";
import { Route, Switch, useRoute, useLocation } from "wouter";
import { CartProvider } from "./hooks/useCart";
import { MenuProvider } from "./store/menuStore";
import { MenuPage } from "./pages/MenuPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { PaymentPage } from "./pages/PaymentPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { OrderStatusPage } from "./pages/OrderStatusPage";
import { OrderConfirmedPage } from "./pages/OrderConfirmedPage";
import { WaitingPage } from "./pages/WaitingPage";
import { OnlineWaitingPage } from "./pages/OnlineWaitingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { CartBar } from "./components/CartBar";
import { GlobalOrderListener } from "./components/GlobalOrderListener";
import { setStoredSlug, getStoredSlug } from "./utils/constants";

const DEFAULT_SLUG = import.meta.env.VITE_RESTAURANT_SLUG || "demo-restaurant";

function AppRoutes() {
  const [isMenuRoute, menuParams] = useRoute("/:slug");
  const [isCartRoute, cartParams] = useRoute("/:slug/cart");
  const [isCheckoutRoute] = useRoute("/:slug/checkout");
  const [isPaymentRoute, paymentParams] = useRoute("/:slug/payment/:paymentToken");
  const [isOrderSuccessRoute] = useRoute("/:slug/order-success");
  const [isOrderStatusRoute] = useRoute("/:slug/order-status");
  const [isOrderConfirmedRoute] = useRoute("/:slug/order-confirmed");
  const [isWaitingRoute, waitingParams] = useRoute("/:slug/waiting/:orderId");
  const [isOnlineWaitingRoute, onlineWaitingParams] = useRoute("/:slug/online-waiting/:orderId");

  const [location, setLocation] = useLocation();
  const [isReady, setIsReady] = useState(false);

  const slug = menuParams?.slug || cartParams?.slug || 
             paymentParams?.slug || waitingParams?.slug || 
             onlineWaitingParams?.slug;

  useEffect(() => {
    if (slug) {
      setStoredSlug(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (location === "/" || location === "") {
      setLocation(`/${DEFAULT_SLUG}`, { replace: true });
    }
    setTimeout(() => setIsReady(true), 100);
  }, [location, setLocation]);

  if (!isReady) {
    return (
      <div className="pageLayout">
        <main className="loadingPage">
          <div className="loadingSpinner" />
          <p className="loadingText">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <>
      <Switch>
        <Route path="/:slug/cart" component={CartPage} />
        <Route path="/:slug/checkout" component={CheckoutPage} />
        <Route path="/:slug/payment/:paymentToken" component={PaymentPage} />
        <Route path="/:slug/order-success" component={OrderSuccessPage} />
        <Route path="/:slug/order-status" component={OrderStatusPage} />
        <Route path="/:slug/order-confirmed" component={OrderConfirmedPage} />
        <Route path="/:slug/waiting/:orderId" component={WaitingPage} />
        <Route path="/:slug/online-waiting/:orderId" component={OnlineWaitingPage} />
        <Route path="/:slug" component={MenuPage} />

        <Route path="/:slug/*" component={NotFoundPage} />
      </Switch>
      <CartBar />
    </>
  );
}

export default function App() {
  useEffect(() => {
    let lastTouchEnd = 0;
    const handleTouchEnd = (event) => {
      if (!event.cancelable) return;
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
    return () => document.removeEventListener("touchend", handleTouchEnd);
  }, []);

  return (
    <CartProvider>
      <MenuProvider>
        <div className="appBackdrop">
          <div className="phoneFrame">
            <GlobalOrderListener />
            <AppRoutes />
          </div>
        </div>
      </MenuProvider>
    </CartProvider>
  );
}