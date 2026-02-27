import axios from "axios";

const getApiBase = () => {
  try {
    if (import.meta.env?.VITE_API_URL) {
      const base = String(import.meta.env.VITE_API_URL).replace(/\/+$/, "");
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
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("moduleToken");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
