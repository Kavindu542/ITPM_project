import axios from "axios";

// Use an explicit VITE_API_URL when provided.
// Otherwise, match the browser hostname (localhost vs 127.0.0.1) so auth cookies
// remain same-site and are sent with XHR requests.
const defaultBase = (() => {
  if (typeof window === "undefined") return "http://127.0.0.1:5000";
  return `${window.location.protocol}//${window.location.hostname}:5000`;
})();

const base = import.meta.env.VITE_API_URL || defaultBase;

export const api = axios.create({
  baseURL: `${base}/api`,
  withCredentials: true,
  timeout: 20000,
  timeoutErrorMessage: "Request timed out",
  headers: {
    "Content-Type": "application/json",
  },
});
