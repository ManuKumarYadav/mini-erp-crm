import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { API_ROOT, API_BASE } from './config/api'

const originalFetch = window.fetch.bind(window);

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
  const token = localStorage.getItem("token");

  const isApiRequest =
    url.startsWith(API_ROOT) ||
    url.startsWith(API_BASE) ||
    url.startsWith("http://localhost:5000") ||
    url.startsWith("/api");

  if (!token || !isApiRequest) {
    return originalFetch(input, init);
  }

  const headers = new Headers(init?.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return originalFetch(input, { ...init, headers });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
