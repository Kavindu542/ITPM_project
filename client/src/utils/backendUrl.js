const isLoopbackHost = (host) => host === "localhost" || host === "127.0.0.1";

const normalizeBaseUrl = (rawUrl) => {
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

export const getBackendBaseUrl = () => {
  try {
    if (import.meta.env?.VITE_API_URL) {
      return normalizeBaseUrl(import.meta.env.VITE_API_URL);
    }

    if (typeof window !== "undefined") {
      const proto = window.location.protocol || "http:";
      const host = window.location.hostname || "localhost";

      if (isLoopbackHost(host)) {
        return `${proto}//${host}:5000`;
      }

      // Production fallback when no explicit API URL is configured.
      return window.location.origin;
    }
  } catch {
    // Ignore and use final fallback.
  }

  return "http://127.0.0.1:5000";
};

export const getBackendApiBaseUrl = () => `${getBackendBaseUrl()}/api`;

export const toBackendAssetUrl = (pathLike) => {
  if (!pathLike) return "";

  const value = String(pathLike);
  if (value.startsWith("http")) return value;

  return `${getBackendBaseUrl()}/${value.replace(/^\/+/, "")}`;
};
