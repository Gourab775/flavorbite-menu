const SESSION_KEY = "menu_session";
const TABLE_KEY = "menu_table";
const FLOW_KEY = "menu_flow";

export function initSession() {
  if (typeof window === "undefined") return;
  
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return;
  
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    sessionId,
    createdAt: Date.now(),
  }));
}

export function getSession() {
  if (typeof window === "undefined") return null;
  
  const data = sessionStorage.getItem(SESSION_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function hasValidSession() {
  const session = getSession();
  if (!session) return false;
  
  const maxAge = 2 * 60 * 60 * 1000;
  return (Date.now() - session.createdAt) < maxAge;
}

export function setTableData(tableData) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TABLE_KEY, JSON.stringify(tableData));
}

export function getTableData() {
  if (typeof window === "undefined") return null;
  
  const data = sessionStorage.getItem(TABLE_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function getTableId() {
  const tableData = getTableData();
  return tableData?.id || null;
}

export function getRestaurantId() {
  const tableData = getTableData();
  return tableData?.restaurant_id || null;
}

export function setFlowState(flow) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(FLOW_KEY, flow);
}

export function getFlowState() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(FLOW_KEY);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TABLE_KEY);
  sessionStorage.removeItem(FLOW_KEY);
  sessionStorage.removeItem("qr_table_param");
  
  // Also clear permanent table storage
  localStorage.removeItem("table_token");
  localStorage.removeItem("table_id");
}

// ========== Device Session System (localStorage-based, persists across browser close/open) ==========

const DEVICE_SESSION_KEY = "device_session_v2";
const DEVICE_SESSION_DURATION = 2 * 60 * 60 * 1000;

export function initDeviceSession() {
  if (typeof window === "undefined") return null;

  const existing = getValidDeviceSession();
  if (existing) return existing;

  const now = Date.now();
  const session = {
    id: `dev_${now}_${Math.random().toString(36).substring(2, 11)}`,
    createdAt: now,
    expiresAt: now + DEVICE_SESSION_DURATION,
  };

  localStorage.setItem(DEVICE_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getValidDeviceSession() {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(DEVICE_SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    if (Date.now() >= session.expiresAt) {
      clearDeviceSessionData();
      return null;
    }
    return session;
  } catch {
    clearDeviceSessionData();
    return null;
  }
}

function getDeviceOrdersKey() {
  const raw = localStorage.getItem(DEVICE_SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (Date.now() >= session.expiresAt) {
      clearDeviceSessionData();
      return null;
    }
    return `device_session_orders_${session.id}`;
  } catch {
    clearDeviceSessionData();
    return null;
  }
}

export function addOrderToDeviceSession(order) {
  if (typeof window === "undefined") return;
  const key = getDeviceOrdersKey();
  if (!key) return;

  const raw = localStorage.getItem(key);
  const orders = raw ? JSON.parse(raw) : [];
  orders.push({ ...order, savedAt: Date.now() });
  localStorage.setItem(key, JSON.stringify(orders));
}

export function getDeviceSessionOrders() {
  if (typeof window === "undefined") return [];
  const key = getDeviceOrdersKey();
  if (!key) return [];

  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearDeviceSessionData() {
  if (typeof window === "undefined") return;

  const raw = localStorage.getItem(DEVICE_SESSION_KEY);
  if (raw) {
    try {
      const session = JSON.parse(raw);
      localStorage.removeItem(`device_session_orders_${session.id}`);
    } catch { /* ignore */ }
  }

  localStorage.removeItem(DEVICE_SESSION_KEY);
  localStorage.removeItem("device_session_unread_v2");
  localStorage.removeItem("qr_menu_cart");
  sessionStorage.removeItem("pending_order");
  sessionStorage.removeItem("cart_order_note");
  sessionStorage.removeItem("tableId");
}

// ========== Session-level Order Code (one per 2h device session) ==========

export function getOrCreateDeviceOrderCode() {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(DEVICE_SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    if (Date.now() >= session.expiresAt) {
      clearDeviceSessionData();
      return null;
    }

    if (session.orderCode) return session.orderCode;

    const num = Math.floor(1000 + Math.random() * 9000);
    session.orderCode = "ORD-" + num;
    localStorage.setItem(DEVICE_SESSION_KEY, JSON.stringify(session));
    return session.orderCode;
  } catch {
    return null;
  }
}

// ========== Unread Orders Notification ==========

const DEVICE_UNREAD_KEY = "device_session_unread_v2";

export function markDeviceSessionOrdersUnread() {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEVICE_UNREAD_KEY, "true");
}

export function markDeviceSessionOrdersRead() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEVICE_UNREAD_KEY);
}

export function hasDeviceSessionUnreadOrders() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEVICE_UNREAD_KEY) === "true";
}