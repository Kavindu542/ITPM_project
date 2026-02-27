import { api } from "./api";

const HAS_SESSION_KEY = "cc_has_session";

function setHasSession(value) {
  try {
    if (value) {
      localStorage.setItem(HAS_SESSION_KEY, "1");
    } else {
      localStorage.removeItem(HAS_SESSION_KEY);
    }
  } catch {
    // Ignore storage errors (private mode, blocked storage, etc.)
  }
}

function getHasSession() {
  try {
    return localStorage.getItem(HAS_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export const authService = {
  hasSessionHint() {
    return getHasSession();
  },

  async register({ studentId, name, email, password, confirmPassword }) {
    const res = await api.post("/auth/register", {
      studentId,
      name,
      email,
      password,
      confirmPassword,
    });
    return res.data;
  },

  async verifyEmailOtp({ email, otp }) {
    const res = await api.post("/auth/verify-email-otp", { email, otp });
    setHasSession(true);
    return res.data;
  },

  async resendEmailOtp({ email }) {
    const res = await api.post("/auth/resend-email-otp", { email });
    return res.data;
  },

  async forgotPassword({ email }) {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },

  async resetPassword({ email, otp, newPassword, confirmPassword }) {
    const res = await api.post("/auth/reset-password", {
      email,
      otp,
      newPassword,
      confirmPassword,
    });
    return res.data;
  },

  async login({ email, password }) {
    const res = await api.post("/auth/login", { email, password });
    setHasSession(true);
    return res.data;
  },

  async moduleLogin({ module, email, password }) {
    const payload = { module, email, password };

    const res = await api.post("/auth/module-login", payload);

    const token =
      res?.data?.token ||
      res?.data?.accessToken ||
      res?.data?.data?.token;

    if (token) localStorage.setItem("token", token);

    setHasSession(true);
    return res.data;
  },

  async me() {
    if (!getHasSession()) return null;

    // React 18 StrictMode mounts effects twice in dev, which can trigger
    // two concurrent /me calls. Dedupe them to avoid duplicate 401s.
    if (authService.__meInFlight) return authService.__meInFlight;

    authService.__meInFlight = (async () => {
      try {
        const res = await api.get("/auth/me");
        setHasSession(true);
        return res.data;
      } catch (err) {
        if (!err?.response || err?.code === "ECONNABORTED") {
          setHasSession(false);
          return null;
        }
        if (err?.response?.status === 401) {
          setHasSession(false);
          return null;
        }
        throw err;
      } finally {
        authService.__meInFlight = null;
      }
    })();

    return authService.__meInFlight;
  },

  async logout() {
    const res = await api.post("/auth/logout");
    setHasSession(false);
    return res.data;
  },

  async updateProfile({ name, avatarUrl, semester, enrolledModules }) {
    const res = await api.patch("/auth/profile", {
      name,
      avatarUrl,
      semester,
      enrolledModules,
    });
    return res.data;
  },

  async updatePassword({ currentPassword, newPassword, confirmPassword }) {
    const res = await api.patch("/auth/password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return res.data;
  },

  async deleteAccount({ password }) {
    const res = await api.delete("/auth/account", { data: { password } });
    setHasSession(false);
    return res.data;
  },
};

// Internal: shared across module instances for deduping.
authService.__meInFlight = null;
