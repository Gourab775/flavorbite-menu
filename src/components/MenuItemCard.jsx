import { memo, useCallback, useMemo, useState } from "react";
import { useCart } from "../hooks/useCart";
import { Toast } from "./Toast";

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
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="menuImg menuImgPlaceholder" />
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
            <h3 className="menuName">{item.name}</h3>
          </div>
          <div className="menuPrice">₹{item.price}</div>
          <p className="menuDesc">{item.description}</p>

          <div className="menuActions">
            {qty > 0 ? (
              <div className="qtyStepper">
                <button
                  className="stepBtn"
                  onClick={handleDecrease}
                  aria-label={`Decrease quantity of ${item.name}`}
                  disabled={qty === 0}
                >
                  −
                </button>
                <span className="qty" aria-live="polite">{qty}</span>
                <button
                  className="stepBtn primary"
                  onClick={handleIncrease}
                  aria-label={`Increase quantity of ${item.name}`}
                  disabled={!item.isAvailable}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                className="addBtn pressable"
                onClick={handleAdd}
                disabled={!item.isAvailable}
                aria-label={`Add ${item.name} to cart`}
              >
                + Add
              </button>
            )}
          </div>
        </div>
      </article>
      <Toast message={toastMsg} onHide={() => setToastMsg("")} />
    </>
  );
});
