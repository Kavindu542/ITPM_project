import axios from "axios";
import { getBackendApiBaseUrl } from "../utils/backendUrl";

export const api = axios.create({
  baseURL: getBackendApiBaseUrl(),
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