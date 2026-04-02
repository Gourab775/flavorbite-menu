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

// Debug logging
if (typeof window !== "undefined") {
  console.log("[APP] VITE_RESTAURANT_SLUG from env:", import.meta.env.VITE_RESTAURANT_SLUG);
  console.log("[APP] Using DEFAULT_SLUG:", DEFAULT_SLUG);
}

function AppRoutes() {
  // Routes without table ID
  const [isMenuRoute, menuParams] = useRoute("/:slug");
  const [isCartRoute, cartParams] = useRoute("/:slug/cart");
  const [isCheckoutRoute] = useRoute("/:slug/checkout");
  const [isPaymentRoute, paymentParams] = useRoute("/:slug/payment/:orderId");
  const [isOrderSuccessRoute] = useRoute("/:slug/order-success");
  const [isOrderStatusRoute] = useRoute("/:slug/order-status");
  const [isOrderConfirmedRoute] = useRoute("/:slug/order-confirmed");
  const [isWaitingRoute, waitingParams] = useRoute("/:slug/waiting/:orderId");
  const [isOnlineWaitingRoute, onlineWaitingParams] = useRoute("/:slug/online-waiting/:orderId");

  // Routes with table ID
  const [isTableRoute, tableParams] = useRoute("/:slug/t/:tableId");
  const [isTableCartRoute, tableCartParams] = useRoute("/:slug/t/:tableId/cart");
  const [isTableCheckoutRoute] = useRoute("/:slug/t/:tableId/checkout");
  const [isTablePaymentRoute, tablePaymentParams] = useRoute("/:slug/t/:tableId/payment/:orderId");
  const [isTableOrderSuccessRoute] = useRoute("/:slug/t/:tableId/order-success");
  const [isTableOrderStatusRoute] = useRoute("/:slug/t/:tableId/order-status");
  const [isTableOrderConfirmedRoute] = useRoute("/:slug/t/:tableId/order-confirmed");
  const [isTableWaitingRoute, tableWaitingParams] = useRoute("/:slug/t/:tableId/waiting/:orderId");
  const [isTableOnlineWaitingRoute, tableOnlineWaitingParams] = useRoute("/:slug/t/:tableId/online-waiting/:orderId");

  const [location, setLocation] = useLocation();
  const [isReady, setIsReady] = useState(false);

  // Extract slug from any route (non-table first, then table variants)
  const slug = menuParams?.slug || tableParams?.slug || cartParams?.slug || tableCartParams?.slug || paymentParams?.slug || tablePaymentParams?.slug || waitingParams?.slug || tableWaitingParams?.slug || onlineWaitingParams?.slug || tableOnlineWaitingParams?.slug;

  // Extract tableId from any route
  const tableId = tableParams?.tableId || tableCartParams?.tableId || tablePaymentParams?.tableId || tableWaitingParams?.tableId || tableOnlineWaitingParams?.tableId;

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

  // Check for any slug-based route (both with and without table ID)
  const isAnySlugRoute = isMenuRoute || isTableRoute || isCartRoute || isTableCartRoute || isCheckoutRoute || isTableCheckoutRoute || isPaymentRoute || isTablePaymentRoute || isOrderSuccessRoute || isTableOrderSuccessRoute || isOrderStatusRoute || isTableOrderStatusRoute || isOrderConfirmedRoute || isTableOrderConfirmedRoute || isWaitingRoute || isTableWaitingRoute || isOnlineWaitingRoute || isTableOnlineWaitingRoute;

  // Entry logic: Always load menu directly
  useEffect(() => {
    // If at root, redirect to configured slug (from env var if available)
    if (location === "/" || location === "") {
      // Prefer environment variable over localStorage
      const targetSlug = DEFAULT_SLUG; // DEFAULT_SLUG already reads from env var
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
        {/* Routes without table ID */}
        <Route path="/:slug" component={MenuPage} />
        <Route path="/:slug/cart" component={CartPage} />
        <Route path="/:slug/checkout" component={CheckoutPage} />
        <Route path="/:slug/payment/:orderId" component={PaymentPage} />
        <Route path="/:slug/order-success" component={OrderSuccessPage} />
        <Route path="/:slug/order-status" component={OrderStatusPage} />
        <Route path="/:slug/order-confirmed" component={OrderConfirmedPage} />
        <Route path="/:slug/waiting/:orderId" component={WaitingPage} />
        <Route path="/:slug/online-waiting/:orderId" component={OnlineWaitingPage} />

        {/* Routes with table ID - MUST come before catch-all */}
        <Route path="/:slug/t/:tableId" component={MenuPage} />
        <Route path="/:slug/t/:tableId/cart" component={CartPage} />
        <Route path="/:slug/t/:tableId/checkout" component={CheckoutPage} />
        <Route path="/:slug/t/:tableId/payment/:orderId" component={PaymentPage} />
        <Route path="/:slug/t/:tableId/order-success" component={OrderSuccessPage} />
        <Route path="/:slug/t/:tableId/order-status" component={OrderStatusPage} />
        <Route path="/:slug/t/:tableId/order-confirmed" component={OrderConfirmedPage} />
        <Route path="/:slug/t/:tableId/waiting/:orderId" component={WaitingPage} />
        <Route path="/:slug/t/:tableId/online-waiting/:orderId" component={OnlineWaitingPage} />

        {/* Catch-all 404 - MUST be last */}
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
