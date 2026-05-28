import { memo, useCallback, useMemo, useState } from "react";
import { useCart } from "../hooks/useCart";
import { Toast } from "./Toast";
import { toTitleCase, FALLBACK_IMG } from "../utils/constants";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHatIcon } from "../components/ChefHatIcon";

export const MenuItemCard = memo(function MenuItemCard({ item }) {
  const { qtyById, addToCart, decreaseQty } = useCart();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const qty = useMemo(() => qtyById?.[item.id] ?? 0, [qtyById, item.id]);

  const handleAdd = useCallback(() => {
    addToCart(item);
    setToastMsg(`"${item.name}" added to cart`);
  }, [addToCart, item]);

  const handleIncrease = useCallback(() => {
    addToCart(item);
  }, [addToCart, item]);

  const handleDecrease = useCallback(() => {
    decreaseQty(item.id);
  }, [decreaseQty, item.id]);

  const isVeg = Boolean(item.isVeg);

  return (
    <>
      <article className={`menuCard${!item.isAvailable ? " menuCard--soldOut" : ""}`}>
        <div className="menuImgWrap">
          {!imgLoaded && <div className="imgSkeleton" aria-hidden="true" />}
          {item.imageUrl && item.imageUrl.trim() !== "" ? (
            <img
              className={`menuImg imgFade ${imgLoaded ? "loaded" : ""}`}
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={(e) => {
                if (!e.currentTarget.dataset.fallback) {
                  e.currentTarget.dataset.fallback = "true";
                  e.currentTarget.src = FALLBACK_IMG;
                }
              }}
            />
          ) : (
            <div className="menuImg menuImgPlaceholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChefHatIcon size={32} color="var(--border)" strokeWidth={1} />
            </div>
          )}
          {!item.isAvailable && <div className="soldOutTag" aria-label="Sold out" />}
        </div>

        <div className="menuBody">
          <div className="menuTop">
            <span
              className={`vegDot ${isVeg ? "" : "nonveg"}`}
              title={isVeg ? "Veg" : "Non-veg"}
              aria-label={isVeg ? "Veg item" : "Non-veg item"}
            />
            <h3 className="menuName">{toTitleCase(item.name)}</h3>
          </div>
          <div className="menuPrice">₹{item.price}</div>
          <p className="menuDesc">{item.description}</p>

          <div className="menuActions">
            <AnimatePresence mode="wait">
              {qty > 0 ? (
                <motion.div 
                  key="stepper"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="qtyStepper"
                >
                  <button
                    className="stepBtn"
                    onClick={handleDecrease}
                    aria-label={`Decrease quantity of ${item.name}`}
                    disabled={qty === 0}
                  >
                    −
                  </button>
                  <motion.span 
                    key={qty}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="qty" 
                    aria-live="polite"
                  >
                    {qty}
                  </motion.span>
                  <button
                    className="stepBtn primary"
                    onClick={handleIncrease}
                    aria-label={`Increase quantity of ${item.name}`}
                    disabled={!item.isAvailable}
                  >
                    +
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="addBtn"
                  whileTap={{ scale: 0.92 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="addBtn"
                  onClick={handleAdd}
                  disabled={!item.isAvailable}
                  aria-label={`Add ${item.name} to cart`}
                >
                  + Add
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </article>
      <Toast message={toastMsg} onHide={() => setToastMsg("")} />
    </>
  );
});
