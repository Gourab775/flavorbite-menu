import { useEffect, useState, useRef } from "react";
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

// Extract restaurant identifier from URL
function getRestaurantIdentifier() {
  if (typeof window === "undefined") return null;
  
  const url = window.location;
  const pathname = url.pathname;
  const search = url.search;
  
  // Check for slug in path: /menu/:slug or /:slug
  const pathSlug = pathname.split("/menu/")[1]?.split("/")[0] || pathname.slice(1).split("/")[0];
  
  // Check for restaurant ID in query params
  const queryId = new URLSearchParams(search).get("restaurant");
  
  const identifier = pathSlug || queryId;
  
  console.log("[Entry] Slug from path:", pathSlug);
  console.log("[Entry] Query ID:", queryId);
  console.log("[Entry] Final identifier:", identifier);
  
  return identifier;
}

function WelcomeScreen() {
  return (
    <div className="pageLayout">
      <main className="loadingPage">
        <div className="scanQRIcon">📱</div>
        <h2 className="loadingTitle">Scan QR Code</h2>
        <p className="loadingText">Scan the QR code on your table to view the menu.</p>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="pageLayout">
      <main className="loadingPage">
        <div className="loadingSpinner" />
        <p className="loadingText">Loading menu...</p>
      </main>
    </div>
  );
}

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
  const [isInitializing, setIsInitializing] = useState(true);
  const hasRedirected = useRef(false);

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

  // Entry logic: On first load, check for identifier and redirect if needed
  useEffect(() => {
    if (hasRedirected.current) return;
    
    const identifier = getRestaurantIdentifier();
    const storedSlug = getStoredSlug();
    const currentSlug = location.slice(1).split("/")[0];
    
    console.log("[Entry] Current location:", location);
    console.log("[Entry] Current slug:", currentSlug);
    console.log("[Entry] Stored slug:", storedSlug);
    
    // If we're at root, check for identifier or stored slug
    if (location === "/" || location === "") {
      if (identifier) {
        // URL has a slug - redirect to proper format
        console.log("[Entry] Redirecting to:", `/${identifier}`);
        hasRedirected.current = true;
        setLocation(`/${identifier}`, { replace: true });
      } else if (storedSlug) {
        // No slug in URL but we have stored slug - redirect
        console.log("[Entry] Redirecting to stored:", `/${storedSlug}`);
        hasRedirected.current = true;
        setLocation(`/${storedSlug}`, { replace: true });
      } else {
        // No identifier anywhere - show welcome
        setIsInitializing(false);
      }
    } else {
      // Not at root - no need to redirect
      setIsInitializing(false);
    }
  }, [location, setLocation]);

  // Show loading while initializing/redirecting
  if (isInitializing && !isAnySlugRoute) {
    return <LoadingScreen />;
  }

  // Show welcome screen only when truly at root with no identifier
  if ((location === "/" || location === "") && !isAnySlugRoute) {
    return <WelcomeScreen />;
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
