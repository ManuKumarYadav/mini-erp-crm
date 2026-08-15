// API Configuration and Endpoint Constants

const rawUrl = (import.meta.env.VITE_API_URL || "").trim();

/**
 * Normalizes backend root URL (e.g., "https://backend.railway.app" without trailing slash or "/api")
 */
export function getApiRootUrl(): string {
  if (!rawUrl) {
    return "http://localhost:5000";
  }
  let clean = rawUrl.replace(/\/+$/, "");
  if (clean.endsWith("/api")) {
    return clean.slice(0, -4);
  }
  return clean;
}

/**
 * Normalizes backend API base URL (always ends in "/api" without trailing slash)
 */
export function getApiBaseUrl(): string {
  const root = getApiRootUrl();
  return `${root}/api`;
}

export const API_ROOT = getApiRootUrl();
export const API_BASE = getApiBaseUrl();

export const API_ENDPOINTS = {
  AUTH_LOGIN: `${API_BASE}/auth/login`,
  AUTH_ME: `${API_BASE}/auth/me`,
  HEALTH: `${API_BASE}/health`,
  CUSTOMERS: `${API_BASE}/customers`,
  PRODUCTS: `${API_BASE}/products`,
  SALES: `${API_BASE}/sales`,
  ORDERS: `${API_BASE}/orders`,
  DASHBOARD: `${API_BASE}/dashboard`,
  REPORTS: `${API_BASE}/reports`,
};

export default API_ENDPOINTS;
