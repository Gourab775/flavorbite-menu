import { useRoute, useLocation } from "wouter";
import { useCart } from "../hooks/useCart";
import { useFormatCurrency } from "../hooks/useFormatCurrency";
import { getStoredSlug } from "../utils/constants";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronRight } from "lucide-react";

export function CartBar() {
  const [isMenuRoute] = useRoute("/:slug/menu");
  const [location] = useLocation();
  const { totalItems, grandTotal } = useCart();
  const formatCurrency = useFormatCurrency();

  const slug = getStoredSlug();

  if (!slug) return null;
  if (totalItems === 0) return null;
  if (!isMenuRoute) return null;

  const cleanPath = location?.replace(/\/+$/, "") || "";
  if (cleanPath !== `/${slug}/menu`) return null;

  const basePath = `/${slug}`;

  const handleClick = (e) => {
    e.preventDefault();
    window.location.href = `${basePath}/cart`;
  };

  return (
    <AnimatePresence>
      <motion.div 
        key="cartBar"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="cartBarOuter cartBarOuter--visible"
        style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", background: "transparent" }}
      >
        <div className="cartBar" onClick={handleClick} style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.4)" }}>
          <div className="cartBarLeft">
            <div className="cartBarIcon">
              <ShoppingBag size={20} strokeWidth={2.2} />
            </div>
            <div className="cartBarInfo">
              <span className="cartBarCount">{totalItems} item{totalItems === 1 ? "" : "s"}</span>
              <span className="cartBarAmt">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
          <span className="cartBarCta">
            View Cart
            <ChevronRight size={18} strokeWidth={2.5} />
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}