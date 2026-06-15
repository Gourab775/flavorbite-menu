import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useMenu } from "../hooks/useMenu";
import { useMenuStore } from "../store/menuStore";
import { getTableData, getOrCreateDeviceOrderCode, getValidDeviceSession } from "../utils/session";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { Toast } from "../components/Toast";
import { useGoBack } from "../context/NavigationContext";
import { Bell, CheckCircle } from "lucide-react";

function isValidUUID(val) {
  if (!val || typeof val !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export function CallWaiterPage() {
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;
  const { restaurant, restaurantLoading } = useMenu();
  const { loadMenu } = useMenuStore();
  const goBack = useGoBack(`${basePath}/menu`);
  const goBackToMenu = useGoBack(basePath);

  const [called, setCalled] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  const [showModal, setShowModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [requestTypes, setRequestTypes] = useState([]);
  const [requestTypesLoading, setRequestTypesLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [customMessage, setCustomMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log("[CallWaiterPage] Mounted with slug:", slug, "restaurant.id:", restaurant?.id);
    if (!restaurant?.id && slug) {
      console.log("[CallWaiterPage] Restaurant not loaded yet, calling loadMenu for slug:", slug);
      loadMenu(slug);
    }
  }, [slug, restaurant?.id, loadMenu]);

  useEffect(() => {
    if (!showModal || !restaurant?.id) return;
    console.log('[Waiter Types] Restaurant ID:', restaurant.id);
    setRequestTypesLoading(true);
    setSelectedType(null);
    setCustomMessage("");
    setRequestTypes([]);
    supabase
      .from("waiter_request_types")
      .select("id, restaurant_id, name, sort_order, is_active")
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        console.log('[Waiter Types] Data:', data);
        console.log('[Waiter Types] Error:', error);
        if (error) {
          console.error("[CallWaiterPage] waiter_request_types fetch error:", error);
          console.log("[CallWaiterPage] waiter_request_types query failed — returning empty array, restaurant unaffected");
          setRequestTypes([]);
        } else {
          console.log('[Waiter Types Count]', data?.length);
          setRequestTypes(data || []);
        }
      })
      .catch(err => {
        console.error("[CallWaiterPage] waiter_request_types unexpected error:", err);
        setRequestTypes([]);
      })
      .finally(() => setRequestTypesLoading(false));
  }, [showModal, restaurant?.id]);

  const handleCallWaiter = () => {
    if (!restaurant?.id) {
      setToastMsg("Restaurant data not loaded. Please try again.");
      setToastType("error");
      return;
    }
    const tableData = getTableData();
    if (!tableData?.id) {
      setToastMsg("Table not found. Please scan QR code again.");
      setToastType("error");
      return;
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!selectedType || submitting) return;
    if (!restaurant?.id) {
      setToastMsg("Restaurant data not loaded. Please try again.");
      setToastType("error");
      return;
    }

    const tableData = getTableData();
    if (!tableData?.id) {
      setToastMsg("Table not found. Please scan QR code again.");
      setToastType("error");
      return;
    }

    setSubmitting(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Service not configured. Please contact support.");
      }

      if (!isValidUUID(restaurant.id)) {
        throw new Error(`Invalid restaurant_id: ${restaurant.id}`);
      }

      if (!isValidUUID(tableData.id)) {
        throw new Error(`Invalid table_id: ${tableData.id}`);
      }

      const session = getValidDeviceSession();
      const orderCode = getOrCreateDeviceOrderCode();
      const sessionOrderId = session?.id ?? null;

      console.log('[Selected Request]', selectedType);
      console.log('[Custom Message]', customMessage);

      const payload = {
        restaurant_id: restaurant.id,
        table_id: tableData.id,
        status: "pending",
        order_code: orderCode ?? null,
        session_order_id: sessionOrderId,
        request_type_id: selectedType.id,
        request_type_name: selectedType.name,
        custom_message: customMessage || null,
      };

      console.log('[Insert Payload]', payload);

      const { data: insertedData, error: insertErr } = await supabase
        .from("waiter_calls")
        .insert(payload)
        .select();

      if (insertErr) {
        throw new Error(`Failed to call waiter: ${insertErr.message}`);
      }

      console.log('[Waiter Call Inserted]', insertedData);
      setShowModal(false);
      setCalled(true);
      setToastType("success");
      setToastMsg("Waiter has been called successfully!");
    } catch (err) {
      console.error("[Waiter Call Insert Error]", err);
      const msg = err?.message ?? "Something went wrong. Please try again.";
      setToastMsg(msg);
      setToastType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    if (submitting || closing) return;
    setClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setClosing(false);
      setSelectedType(null);
      setCustomMessage("");
    }, 200);
  };

  const isRestaurantReady = restaurant?.id && isValidUUID(restaurant.id);

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={goBack} aria-label="Back">
          ←
        </button>
        <h1 className="topBarTitle">Call Waiter</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="callWaiterBody">
        {called ? (
          <div className="callWaiterSuccess">
            <div className="callWaiterIconWrap success">
              <CheckCircle size={48} />
            </div>
            <h2 className="callWaiterTitle">Waiter Called!</h2>
            <p className="callWaiterSub">A staff member will be with you shortly.</p>
            <button className="btn primary pressable" onClick={goBackToMenu} style={{ marginTop: 24, width: "100%", maxWidth: 240, padding: "14px 0" }}>
              Back to Menu
            </button>
          </div>
        ) : restaurantLoading ? (
          <div className="callWaiterPrompt">
            <div className="callWaiterIconWrap">
              <Bell size={48} />
            </div>
            <h2 className="callWaiterTitle">Need Assistance?</h2>
            <p className="callWaiterSub">Loading restaurant data...</p>
          </div>
        ) : !isRestaurantReady ? (
          <div className="callWaiterPrompt">
            <div className="callWaiterIconWrap">
              <Bell size={48} />
            </div>
            <h2 className="callWaiterTitle">Need Assistance?</h2>
            <p className="callWaiterSub">Unable to load restaurant data. Please go back and try again.</p>
            <button className="btn primary pressable" onClick={goBackToMenu} style={{ marginTop: 12, padding: "12px 24px" }}>
              Back to Menu
            </button>
          </div>
        ) : (
          <div className="callWaiterPrompt">
            <div className="callWaiterIconWrap">
              <Bell size={48} />
            </div>
            <h2 className="callWaiterTitle">Need Assistance?</h2>
            <p className="callWaiterSub">Tap the button below to call a waiter to your table.</p>
            <button
              className="callWaiterBtn pressable"
              onClick={handleCallWaiter}
            >
              Call Waiter
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <div className={`waiterRequestOverlay ${closing ? "closing" : ""}`} onClick={closeModal}>
          <div className={`waiterRequestSheet ${closing ? "closing" : ""}`} onClick={e => e.stopPropagation()}>
            <div className="waiterRequestHeader">
              <h2 className="waiterRequestTitle">Call Waiter</h2>
              <p className="waiterRequestSub">What do you need help with?</p>
            </div>

            <div className="waiterRequestOptions">
              {requestTypesLoading ? (
                <div className="waiterRequestLoading">
                  <div className="loadingSpinner" />
                  <p>Loading options...</p>
                </div>
              ) : requestTypes.length === 0 ? (
                <div className="waiterRequestEmpty">
                  <p>No waiter request options available.</p>
                </div>
              ) : (
                requestTypes.map(rt => (
                  <button
                    key={rt.id}
                    className={`waiterRequestOption ${selectedType?.id === rt.id ? "selected" : ""}`}
                    onClick={() => setSelectedType(rt)}
                  >
                    <span className={`waiterRequestRadio ${selectedType?.id === rt.id ? "checked" : ""}`}>
                      {selectedType?.id === rt.id && <span className="waiterRequestRadioDot" />}
                    </span>
                    <span className="waiterRequestOptionLabel">{rt.name}</span>
                  </button>
                ))
              )}
            </div>

            {selectedType?.name === "Other Request" && (
              <div className="waiterRequestMessageArea">
                <textarea
                  className="waiterRequestTextarea"
                  placeholder="Describe your request..."
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>
            )}

            <div className="waiterRequestActions">
              <button
                className="waiterRequestCancelBtn"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="waiterRequestSubmitBtn"
                onClick={handleSubmit}
                disabled={!selectedType || submitting}
              >
                {submitting ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMsg} type={toastType} onHide={() => setToastMsg("")} />
    </div>
  );
}
