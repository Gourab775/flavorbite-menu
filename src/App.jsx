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
import { setStoredSlug, setStoredTableId, getStoredSlug } from "./utils/constants";

// Default restaurant slug for direct access
const DEFAULT_SLUG = import.meta.env.VITE_RESTAURANT_SLUG || "demo-restaurant";

function AppRoutes() {
  // Slug-based routes
  const [isMenuRoute, menuParams] = useRoute("/:slug");
  const [isTableRoute, tableParams] = useRoute("/:slug/t/:tableId");
  const [isCartRoute, cartParams] = useRoute("/:slug/cart");
  const [isCheckoutRoute] = useRoute("/:slug/checkout");
  const [isPaymentRoute, paymentParams] = useRoute("/:slug/payment/:orderId");
  const [isOrderSuccessRoute] = useRoute("/:slug/order-success");
  const [isOrderStatusRoute] = useRoute("/:slug/order-status");
  const [isOrderConfirmedRoute] = useRoute("/:slug/order-confirmed");
  const [isWaitingRoute, waitingParams] = useRoute("/:slug/waiting/:orderId");
  const [isOnlineWaitingRoute, onlineWaitingParams] = useRoute("/:slug/online-waiting/:orderId");

  const [location, setLocation] = useLocation();
  const [isReady, setIsReady] = useState(false);

  // Extract slug from any route
  const slug = menuParams?.slug || tableParams?.slug || cartParams?.slug || paymentParams?.slug || waitingParams?.slug || onlineWaitingParams?.slug;

  // Extract tableId from route
  const tableId = tableParams?.tableId || waitingParams?.tableId || onlineWaitingParams?.tableId;

  // Store slug and tableId when available
  useEffect(() => {
    if (slug) {
      setStoredSlug(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (tableId) {
      setStoredTableId(tableId);
    }
  }, [tableId]);

  // Check for any slug-based route
  const isAnySlugRoute = isMenuRoute || isTableRoute || isCartRoute || isCheckoutRoute || isPaymentRoute || isOrderSuccessRoute || isOrderStatusRoute || isOrderConfirmedRoute || isWaitingRoute || isOnlineWaitingRoute;

  // Entry logic: Always load menu directly
  useEffect(() => {
    // If at root, redirect to default slug
    if (location === "/" || location === "") {
      const storedSlug = getStoredSlug();
      const targetSlug = storedSlug || DEFAULT_SLUG;
      setLocation(`/${targetSlug}`, { replace: true });
    } else {
      setIsReady(true);
    }
  }, [location, setLocation]);

  // Show loading only briefly while redirecting
  if (!isReady && !isAnySlugRoute) {
    return (
      <div className="pageLayout">
        <main className="loadingPage">
          <div className="loadingSpinner" />
          <p className="loadingText">Loading...</p>
        </main>
      </div>
    );
  }

  const showCartBar = isMenuRoute || isTableRoute || isWaitingRoute || isOnlineWaitingRoute;

  return (
    <>
      <Switch>
        <Route path="/:slug" component={MenuPage} />
        <Route path="/:slug/t/:tableId" component={MenuPage} />
        <Route path="/:slug/cart" component={CartPage} />
        <Route path="/:slug/checkout" component={CheckoutPage} />
        <Route path="/:slug/payment/:orderId" component={PaymentPage} />
        <Route path="/:slug/order-success" component={OrderSuccessPage} />
        <Route path="/:slug/order-status" component={OrderStatusPage} />
        <Route path="/:slug/order-confirmed" component={OrderConfirmedPage} />
        <Route path="/:slug/waiting/:orderId" component={WaitingPage} />
        <Route path="/:slug/online-waiting/:orderId" component={OnlineWaitingPage} />
        <Route path="/:slug/*" component={NotFoundPage} />
      </Switch>
      {showCartBar && <CartBar />}
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
            <AppRoutes />
          </div>
        </div>
      </MenuProvider>
    </CartProvider>
  );
}
