import { useEffect, useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { supabase } from "../lib/supabaseClient";
import { useMenuStore } from "../store/menuStore";
import { getStoredSlug } from "../utils/constants";
import { motion } from "framer-motion";
import lottie from "lottie-web";
import animationData from "../assets/animations/loading.json";

export function WaitingPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug, tableId, orderId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;
  const slug = urlSlug || getStoredSlug();
  const { loadMenu } = useMenuStore();

  useEffect(() => {
    if (slug) {
      loadMenu(slug);
    }
  }, [slug, loadMenu]);
  const [order, setOrder] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const animationRef = useRef(null);
  const containerRef = useRef(null);

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelModal(false);
    localStorage.removeItem("qr_menu_cart");
    localStorage.removeItem("notes");
    sessionStorage.removeItem("orderData");
    sessionStorage.removeItem("cart_order_note");
    window.dispatchEvent(new Event("cart-cleared"));
    navigate(`/${slug}`);
  };

  useEffect(() => {
    const channel = supabase
      .channel("order-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_orders",
        },
        (payload) => {
          if (payload.new.id === orderId && payload.new.status === "accepted") {
            navigate(`/${slug}/order-confirmed`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, navigate, slug]);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from("live_orders")
        .select("id, order_code")
        .eq("id", orderId)
        .single();
      setOrder(data);
    };
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (containerRef.current && !animationRef.current) {
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: animationData
      });
    }
    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, []);

  const renderAnimation = () => {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-[85vw] h-[85vw] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px]"
      >
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </motion.div>
    );
  };

  return (
    <div className="pageLayout">
      <header className="topBar">
        <h1 className="topBarTitle">Order Status</h1>
      </header>

      <motion.main 
        className="checkoutBody hideScrollbar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          textAlign: "center", 
          padding: "20px 24px 32px", 
          minHeight: "calc(100vh - 60px)"
        }}
      >
        {/* Animation - Primary visual focus */}
        <div className="flex-shrink-0 mb-8 sm:mb-10">
          {renderAnimation()}
        </div>

        {/* Text Content - Centered group */}
        <div className="flex flex-col items-center gap-y-3 sm:gap-y-4">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1f1f1f] leading-tight"
          >
            Complete Payment at Counter
          </motion.h2>
          
          {order?.order_code && (
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-base sm:text-lg text-[#666] font-medium"
            >
              Order ID: <span className="text-[#1f1f1f] font-bold">{order.order_code}</span>
            </motion.p>
          )}
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-sm sm:text-base text-[#999] mt-2 max-w-sm leading-relaxed"
          >
            Please visit the counter to complete your payment. Your order will be confirmed once payment is received.
          </motion.p>
        </div>

        {/* Cancel Button - Secondary action */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          onClick={handleCancel}
          className="mt-10 sm:mt-12 bg-transparent border-2 border-[#dc3545] rounded-xl text-[#dc3545] text-base font-semibold px-8 py-3 cursor-pointer hover:bg-[#dc3545] hover:text-white transition-all duration-200"
        >
          Cancel Order
        </motion.button>
      </motion.main>

      {showCancelModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ background: "#fff", borderRadius: "12px", padding: "24px", maxWidth: "320px", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "16px", marginBottom: "24px" }}>
              Are you sure you want to cancel this order?
            </p>
            <button
              onClick={handleCancelConfirm}
              style={{
                background: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "12px 32px",
                fontSize: "16px",
                cursor: "pointer"
              }}
            >
              Yes, Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
