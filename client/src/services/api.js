import axios from "axios";

const isLoopbackHost = (host) => host === "localhost" || host === "127.0.0.1";

const normalizeLocalApiUrl = (rawUrl) => {
  try {
    const parsed = new URL(String(rawUrl));
    if (typeof window !== "undefined") {
      const uiHost = window.location.hostname || "localhost";
      if (isLoopbackHost(parsed.hostname) && isLoopbackHost(uiHost)) {
        parsed.hostname = uiHost;
      }
    }
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return String(rawUrl).replace(/\/+$/, "");
  }
};

const getApiBase = () => {
  try {
    if (import.meta.env?.VITE_API_URL) {
      const base = normalizeLocalApiUrl(import.meta.env.VITE_API_URL);
      return `${base}/api`;
    }
    if (typeof window !== "undefined") {
      const proto = window.location.protocol || "http:";
      const host = window.location.hostname || "localhost";
      return `${proto}//${host}:5000/api`;
    }
  } catch {
    // ignore
  }
  return "http://127.0.0.1:5000/api";
};

export const api = axios.create({
  baseURL: getApiBase(),
  withCredentials: true,
  timeout: 60000,
  timeoutErrorMessage: "Request timed out",
});

api.interceptors.request.use((config) => {
  const isAuthEndpoint = String(config?.url || "").startsWith("/auth/");
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("moduleToken") ||
    localStorage.getItem("token");

  if (isAuthEndpoint) return config;

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const sentAuthHeader = Boolean(error?.config?.headers?.Authorization);
      if (sentAuthHeader) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("moduleToken");
        localStorage.removeItem("token");
      }
    }
    return Promise.reject(error);
  },
);

export default api;