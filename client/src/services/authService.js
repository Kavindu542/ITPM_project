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
    const res = await api.post("/auth/module-login", {
      module,
      email,
      password,
    });
    setHasSession(true);
    return res.data;
  },

  async me() {
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
    }
  },

  async logout() {
    const res = await api.post("/auth/logout");
    setHasSession(false);
    return res.data;
  },

  async updateProfile({ name, avatarUrl }) {
    const res = await api.patch("/auth/profile", { name, avatarUrl });
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
