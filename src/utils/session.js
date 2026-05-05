const SESSION_KEY = "menu_session";
const TABLE_KEY = "menu_table";
const FLOW_KEY = "menu_flow";
const PAYMENT_TOKEN_KEY = "payment_token";

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
  sessionStorage.removeItem(PAYMENT_TOKEN_KEY);
}

export function setPaymentToken(token) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PAYMENT_TOKEN_KEY, token);
}

export function getPaymentToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PAYMENT_TOKEN_KEY);
}

export function clearPaymentToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PAYMENT_TOKEN_KEY);
}

export function clearOrderData() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("orderData");
  sessionStorage.removeItem(FLOW_KEY);
}