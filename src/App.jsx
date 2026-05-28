import { useEffect, useState } from "react";
import { Route, Switch, useRoute, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { CartProvider } from "./hooks/useCart";
import { MenuProvider } from "./store/menuStore";
import { LandingPage } from "./pages/LandingPage";
import { MenuPage } from "./pages/MenuPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { YourOrdersPage } from "./pages/YourOrdersPage";
import { CallWaiterPage } from "./pages/CallWaiterPage";
import { HelpSupportPage } from "./pages/HelpSupportPage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { RestaurantInfoPage } from "./pages/RestaurantInfoPage";
import { FAQsPage } from "./pages/FAQsPage";
import { TermsPrivacyPage } from "./pages/TermsPrivacyPage";
import { CartBar } from "./components/CartBar";
import { NavigationProvider } from "./context/NavigationContext";
import { setStoredSlug } from "./utils/constants";
import { initDeviceSession } from "./utils/session";

const DEFAULT_SLUG = import.meta.env.VITE_RESTAURANT_SLUG || "demo-restaurant";

function AppRoutes() {
  const [_landingMatch, landingParams] = useRoute("/:slug");
  const [_menuMatch, menuParams] = useRoute("/:slug/menu");
  const [_cartMatch, cartParams] = useRoute("/:slug/cart");
  const [_checkoutMatch] = useRoute("/:slug/checkout");
  const [_orderSentMatch] = useRoute("/:slug/order-sent");
  const [_orderSuccessMatch] = useRoute("/:slug/order-success");

  const [location, setLocation] = useLocation();
  const [isReady, setIsReady] = useState(false);

  const slug = landingParams?.slug || menuParams?.slug || cartParams?.slug;

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
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ willChange: "transform, opacity" }}
        >
          <Switch>
            <Route path="/:slug/menu" component={MenuPage} />
            <Route path="/:slug/cart" component={CartPage} />
            <Route path="/:slug/checkout" component={CheckoutPage} />
            <Route path="/:slug/order-sent" component={OrderSuccessPage} />
            <Route path="/:slug/order-success" component={OrderSuccessPage} />
            <Route path="/:slug/your-orders" component={YourOrdersPage} />
            <Route path="/:slug/call-waiter" component={CallWaiterPage} />
            <Route path="/:slug/help-support" component={HelpSupportPage} />
            <Route path="/:slug/feedback" component={FeedbackPage} />
            <Route path="/:slug/restaurant-info" component={RestaurantInfoPage} />
            <Route path="/:slug/faqs" component={FAQsPage} />
            <Route path="/:slug/terms-privacy" component={TermsPrivacyPage} />
            <Route path="/:slug" component={LandingPage} />

            <Route path="/:slug/*" component={NotFoundPage} />
          </Switch>
        </motion.div>
      </AnimatePresence>
      <CartBar />
    </>
  );
}

export default function App() {
  useEffect(() => {
    initDeviceSession();
  }, []);

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
            <NavigationProvider>
              <AppRoutes />
            </NavigationProvider>
          </div>
        </div>
      </MenuProvider>
    </CartProvider>
  );
}