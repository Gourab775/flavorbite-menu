import { useEffect } from "react";
import { Route, Switch, useRoute, useLocation } from "wouter";
import { CartProvider } from "./hooks/useCart";
import { MenuProvider } from "./store/menuStore";
import { ThemeProvider } from "./context/ThemeContext";
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
import { TableRequiredPage } from "./pages/TableRequiredPage";
import { CartBar } from "./components/CartBar";
import { ThemeSwitcher } from "./components/ThemeSwitcher";

const TABLE_KEY = "tableId";

function getStoredTableId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TABLE_KEY);
}

function AppRoutes() {
  const [isTableRoute, tableParams] = useRoute("/t/:tableId");
  const [isCartRoute, cartParams] = useRoute("/t/:tableId/cart");
  const [isCheckoutRoute] = useRoute("/t/:tableId/checkout");
  const [isPaymentRoute, paymentParams] = useRoute("/t/:tableId/payment/:orderId");
  const [isOrderSuccessRoute] = useRoute("/t/:tableId/order-success");
  const [isOrderStatusRoute] = useRoute("/t/:tableId/order-status");
  const [isOrderConfirmedRoute] = useRoute("/t/:tableId/order-confirmed");
  const [isWaitingRoute, waitingParams] = useRoute("/t/:tableId/waiting/:orderId");
  const [isOnlineWaitingRoute, onlineWaitingParams] = useRoute("/t/:tableId/online-waiting/:orderId");
  const [location, setLocation] = useLocation();

  const tableId = tableParams?.tableId || cartParams?.tableId || paymentParams?.tableId || waitingParams?.tableId || onlineWaitingParams?.tableId;

  useEffect(() => {
    const stored = getStoredTableId();
    if (!isTableRoute && !isCartRoute && !isCheckoutRoute && !isPaymentRoute && !isOrderSuccessRoute && !isOrderStatusRoute && !isOrderConfirmedRoute && !isWaitingRoute && !isOnlineWaitingRoute) {
      if (stored && location === "/") {
        setLocation(`/t/${stored}`);
      }
    }
  }, [location, isTableRoute, isCartRoute, isCheckoutRoute, isPaymentRoute, isOrderSuccessRoute, isOrderStatusRoute, isOrderConfirmedRoute, isWaitingRoute, isOnlineWaitingRoute, setLocation]);

  useEffect(() => {
    if (tableId) {
      localStorage.setItem(TABLE_KEY, tableId);
    }
  }, [tableId]);

  if (!isTableRoute && !isCartRoute && !isCheckoutRoute && !isPaymentRoute && !isOrderSuccessRoute && !isOrderStatusRoute && !isOrderConfirmedRoute && !isWaitingRoute && !isOnlineWaitingRoute && location === "/") {
    return <TableRequiredPage />;
  }

  if (!isTableRoute && !isCartRoute && !isCheckoutRoute && !isPaymentRoute && !isOrderSuccessRoute && !isOrderStatusRoute && !isOrderConfirmedRoute && !isWaitingRoute && !isOnlineWaitingRoute) {
    return <NotFoundPage />;
  }

  const showCartBar = isTableRoute || isCartRoute || isWaitingRoute || isOnlineWaitingRoute;

  return (
    <>
      <ThemeSwitcher />
      <Switch>
        <Route path="/" component={MenuPage} />
        <Route path="/t/:tableId" component={MenuPage} />
        <Route path="/t/:tableId/cart" component={CartPage} />
        <Route path="/t/:tableId/checkout" component={CheckoutPage} />
        <Route path="/t/:tableId/payment/:orderId" component={PaymentPage} />
        <Route path="/t/:tableId/order-success" component={OrderSuccessPage} />
        <Route path="/t/:tableId/order-status" component={OrderStatusPage} />
        <Route path="/t/:tableId/order-confirmed" component={OrderConfirmedPage} />
        <Route path="/t/:tableId/waiting/:orderId" component={WaitingPage} />
        <Route path="/t/:tableId/online-waiting/:orderId" component={OnlineWaitingPage} />
        <Route component={NotFoundPage} />
      </Switch>
      {showCartBar && <CartBar />}
    </>
  );
}

function EtherealBackground() {
  return (
    <div className="etherealBg">
      <div className="etherealShape etherealShape--1" />
      <div className="etherealShape etherealShape--2" />
      <div className="etherealShape etherealShape--3" />
      <div className="etherealShape etherealShape--4" />
      <div className="etherealGrain" />
    </div>
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
        <ThemeProvider>
          <div className="appBackdrop">
            <EtherealBackground />
            <div className="phoneFrame">
              <AppRoutes />
            </div>
          </div>
        </ThemeProvider>
      </MenuProvider>
    </CartProvider>
  );
}
