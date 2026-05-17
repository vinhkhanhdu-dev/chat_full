const API_BASE =
  import.meta.env.VITE_API_BASE || `${window.location.protocol}//${window.location.hostname}:4000/api`;
let authToken = localStorage.getItem("admin-auth-token") || "";
let unauthorizedHandler = null;

export function setAuthToken(token) {
  authToken = token || "";
  if (authToken) {
    localStorage.setItem("admin-auth-token", authToken);
  } else {
    localStorage.removeItem("admin-auth-token");
  }
}

export function getAuthToken() {
  return authToken;
}

export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw new Error(await response.text());
  }

  return response.status === 204 ? null : response.json();
}

export const api = {
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  getCurrentUser: () => request("/auth/me"),
  getPageBots: () => request("/page-bots"),
  savePageBot: (payload) =>
    payload._id
      ? request(`/page-bots/${payload._id}`, { method: "PUT", body: JSON.stringify(payload) })
      : request("/page-bots", { method: "POST", body: JSON.stringify(payload) }),
  deletePageBot: (id) => request(`/page-bots/${id}`, { method: "DELETE" }),
  syncPageBotProfile: (id) => request(`/page-bots/${id}/sync-profile`, { method: "POST" }),
  getMessages: () => request("/messages"),
  sendManualReply: async ({ pageBotId, customerPsid, text, attachment }) => {
    const formData = new FormData();
    formData.append("pageBotId", pageBotId);
    formData.append("customerPsid", customerPsid);
    formData.append("text", text || "");
    if (attachment) {
      formData.append("attachment", attachment);
    }

    const response = await fetch(`${API_BASE}/messages/reply`, {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "true",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: formData
    });

    if (!response.ok) {
      if (response.status === 401 && unauthorizedHandler) {
        unauthorizedHandler();
      }
      throw new Error(await response.text());
    }

    return response.json();
  },
  getSystemSettings: () => request("/system-settings"),
  saveSystemSettings: (payload) =>
    request("/system-settings", { method: "PUT", body: JSON.stringify(payload) }),
  getOrders: () => request("/orders"),
  getCompanies: () => request("/companies"),
  saveCompany: (payload) =>
    payload._id
      ? request(`/companies/${payload._id}`, { method: "PUT", body: JSON.stringify(payload) })
      : request("/companies", { method: "POST", body: JSON.stringify(payload) }),
  deleteCompany: (id) => request(`/companies/${id}`, { method: "DELETE" }),
  getPromotions: () => request("/promotions"),
  savePromotion: (payload) =>
    payload._id
      ? request(`/promotions/${payload._id}`, { method: "PUT", body: JSON.stringify(payload) })
      : request("/promotions", { method: "POST", body: JSON.stringify(payload) }),
  deletePromotion: (id) => request(`/promotions/${id}`, { method: "DELETE" }),
  getConsultationScripts: () => request("/consultation-scripts"),
  saveConsultationScript: (payload) =>
    payload._id
      ? request(`/consultation-scripts/${payload._id}`, { method: "PUT", body: JSON.stringify(payload) })
      : request("/consultation-scripts", { method: "POST", body: JSON.stringify(payload) }),
  deleteConsultationScript: (id) => request(`/consultation-scripts/${id}`, { method: "DELETE" }),
  getContexts: () => request("/contexts"),
  saveContext: (id, payload) =>
    request(`/contexts/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  resumeBotReply: (payload) => request("/contexts/resume-bot", { method: "POST", body: JSON.stringify(payload) }),
  resetContext: (id) => request(`/contexts/${id}/reset`, { method: "POST" }),
  resetAllContexts: () => request("/contexts/reset-all", { method: "POST" }),
  getSimulatorCases: () => request("/simulator/cases"),
  runSimulatorEvent: (payload) => request("/simulator/events", { method: "POST", body: JSON.stringify(payload) }),
  saveOrder: (payload) =>
    payload._id
      ? request(`/orders/${payload._id}`, { method: "PUT", body: JSON.stringify(payload) })
      : request("/orders", { method: "POST", body: JSON.stringify(payload) }),
  getRules: () => request("/rules"),
  getFaqs: (pageBotId = "") => request(pageBotId ? `/faqs?pageBotId=${pageBotId}` : "/faqs"),
  saveFaq: (payload) =>
    payload._id
      ? request(`/faqs/${payload._id}`, { method: "PUT", body: JSON.stringify(payload) })
      : request("/faqs", { method: "POST", body: JSON.stringify(payload) }),
  deleteFaq: (id) => request(`/faqs/${id}`, { method: "DELETE" }),
  getUsers: () => request("/users"),
  saveUser: (payload) =>
    payload._id
      ? request(`/users/${payload._id}`, { method: "PUT", body: JSON.stringify(payload) })
      : request("/users", { method: "POST", body: JSON.stringify(payload) }),
  getRoles: () => request("/roles"),
  getPermissions: () => request("/roles/permissions"),
  saveRole: (payload) =>
    payload._id
      ? request(`/roles/${payload._id}`, { method: "PUT", body: JSON.stringify(payload) })
      : request("/roles", { method: "POST", body: JSON.stringify(payload) }),
  getOperationsReport: ({ fromDate, toDate }) =>
    request(`/reports/operations?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`),
  saveRule: (payload) =>
    payload._id
      ? request(`/rules/${payload._id}`, { method: "PUT", body: JSON.stringify(payload) })
      : request("/rules", { method: "POST", body: JSON.stringify(payload) }),
  deleteRule: (id) => request(`/rules/${id}`, { method: "DELETE" })
};
