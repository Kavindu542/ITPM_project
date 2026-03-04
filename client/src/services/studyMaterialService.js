import { api } from "./api";

const isLoopbackHost = (host) => host === "localhost" || host === "127.0.0.1";

const normalizeLocalBaseUrl = (rawUrl) => {
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

const getBase = () => {
  if (import.meta.env.VITE_API_URL) return normalizeLocalBaseUrl(import.meta.env.VITE_API_URL);
  if (typeof window === "undefined") return "http://127.0.0.1:5000";
  return `${window.location.protocol}//${window.location.hostname}:5000`;
};

export const studyMaterialService = {
  // URLs for opening preview/download in a new tab (cookie auth)
  fileUrl(materialId, { versionId, disposition = "inline" } = {}) {
    const base = getBase();
    const params = new URLSearchParams();
    if (versionId) params.set("versionId", versionId);
    if (disposition) params.set("disposition", disposition);
    const qs = params.toString();
    return `${base}/api/study-material/materials/${materialId}/file${qs ? `?${qs}` : ""}`;
  },

  async listMaterials(filters = {}) {
    const res = await api.get("/study-material/materials", { params: filters });
    return res.data;
  },

  async getMaterial(id) {
    const res = await api.get(`/study-material/materials/${id}`);
    return res.data;
  },

  async uploadSuggestion(formData) {
    const res = await api.post(
      "/study-material/materials/suggestions",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  },

  async toggleBookmark(id) {
    const res = await api.post(`/study-material/materials/${id}/bookmark`);
    return res.data;
  },

  async listBookmarks() {
    const res = await api.get("/study-material/me/bookmarks");
    return res.data;
  },

  async listHistory() {
    const res = await api.get("/study-material/me/history");
    return res.data;
  },

  async listMyUploads(params = {}) {
    const res = await api.get("/study-material/me/uploads", { params });
    return res.data;
  },

  // Admin
  async adminUpload(formData) {
    const res = await api.post("/study-material/admin/materials", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async adminListMaterials(params = {}) {
    const res = await api.get("/study-material/admin/materials", { params });
    return res.data;
  },

  async adminDeleteMaterial(id) {
    const res = await api.delete(`/study-material/admin/materials/${id}`);
    return res.data;
  },

  async adminUpdateMaterial(id, patch) {
    const res = await api.patch(`/study-material/admin/materials/${id}`, patch);
    return res.data;
  },

  async adminAddVersion(id, formData) {
    const res = await api.post(
      `/study-material/admin/materials/${id}/versions`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  },

  async adminQueue(status = "pending") {
    const res = await api.get("/study-material/admin/queue", {
      params: { status },
    });
    return res.data;
  },

  async adminApprove(id, reason = "") {
    const res = await api.post(`/study-material/admin/queue/${id}/approve`, {
      reason,
    });
    return res.data;
  },

  async adminReject(id, reason) {
    const res = await api.post(`/study-material/admin/queue/${id}/reject`, {
      reason,
    });
    return res.data;
  },

  async adminAnalytics() {
    const res = await api.get("/study-material/admin/analytics");
    return res.data;
  },

  async adminDownloadsHistory(params = {}) {
    const res = await api.get("/study-material/admin/downloads", { params });
    return res.data;
  },

  // Missing resource requests
  async listRequests(params = {}) {
    const res = await api.get("/study-material/requests", { params });
    return res.data;
  },

  async submitRequest(payload) {
    const res = await api.post("/study-material/requests", payload);
    return res.data;
  },

  async upvoteRequest(id) {
    const res = await api.post(`/study-material/requests/${id}/upvote`);
    return res.data;
  },

  async adminListRequests(params = {}) {
    const res = await api.get("/study-material/admin/requests", { params });
    return res.data;
  },

  async adminMarkRequestInProgress(id) {
    const res = await api.post(
      `/study-material/admin/requests/${id}/in-progress`,
    );
    return res.data;
  },

  async adminFulfillRequest(id, formData) {
    const res = await api.post(
      `/study-material/admin/requests/${id}/fulfill`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return res.data;
  },

  async adminRejectRequest(id, reason) {
    const res = await api.post(`/study-material/admin/requests/${id}/reject`, {
      reason,
    });
    return res.data;
  },

  // Reviews
  async listMaterialReviews(materialId, params = {}) {
    const res = await api.get(
      `/study-material/materials/${materialId}/reviews`,
      {
        params,
      },
    );
    return res.data;
  },

  async createOrUpdateReview(materialId, payload) {
    const res = await api.post(
      `/study-material/materials/${materialId}/reviews`,
      payload,
    );
    return res.data;
  },

  async voteReview(reviewId, vote) {
    const res = await api.post(`/study-material/reviews/${reviewId}/vote`, {
      vote,
    });
    return res.data;
  },

  async updateOwnReview(reviewId, payload) {
    const res = await api.patch(`/study-material/reviews/${reviewId}`, payload);
    return res.data;
  },

  async deleteOwnReview(reviewId) {
    const res = await api.delete(`/study-material/reviews/${reviewId}`);
    return res.data;
  },

  async adminListReviews(params = {}) {
    const res = await api.get("/study-material/admin/reviews", { params });
    return res.data;
  },

  async adminModerateReview(reviewId, payload) {
    const res = await api.post(
      `/study-material/admin/reviews/${reviewId}/moderate`,
      payload,
    );
    return res.data;
  },

  async adminRespondReview(reviewId, text) {
    const res = await api.post(
      `/study-material/admin/reviews/${reviewId}/respond`,
      { text },
    );
    return res.data;
  },

  async adminReviewAnalytics() {
    const res = await api.get("/study-material/admin/reviews/analytics");
    return res.data;
  },

  // Forum
  async listForumCategories() {
    const res = await api.get("/study-material/forum/categories");
    return res.data;
  },

  async createForumCategory(payload) {
    const res = await api.post(
      "/study-material/admin/forum/categories",
      payload,
    );
    return res.data;
  },
  async adminDeleteForumCategory(slug) {
    const res = await api.delete(
      `/study-material/admin/forum/categories/${encodeURIComponent(slug)}`,
    );
    return res.data;
  },

  async listForumThreads(params = {}) {
    const res = await api.get("/study-material/forum/threads", { params });
    return res.data;
  },

  async getForumThread(threadId) {
    const res = await api.get(`/study-material/forum/threads/${threadId}`);
    return res.data;
  },

  async createForumThread(payload) {
    const res = await api.post("/study-material/forum/threads", payload);
    return res.data;
  },

  async createForumReply(threadId, body) {
    const res = await api.post(
      `/study-material/forum/threads/${threadId}/replies`,
      { body },
    );
    return res.data;
  },

  async upvoteForumThread(threadId) {
    const res = await api.post(
      `/study-material/forum/threads/${threadId}/upvote`,
    );
    return res.data;
  },

  async upvoteForumReply(replyId) {
    const res = await api.post(
      `/study-material/forum/replies/${replyId}/upvote`,
    );
    return res.data;
  },

  async acceptForumReply(replyId) {
    const res = await api.post(
      `/study-material/forum/replies/${replyId}/accept`,
    );
    return res.data;
  },

  async subscribeForumThread(threadId) {
    const res = await api.post(
      `/study-material/forum/threads/${threadId}/subscribe`,
    );
    return res.data;
  },
  async deleteOwnForumThread(threadId) {
    const res = await api.delete(
      `/study-material/forum/threads/${threadId}`,
    );
    return res.data;
  },

  async adminUpdateForumThread(threadId, payload) {
    const res = await api.patch(
      `/study-material/admin/forum/threads/${threadId}`,
      payload,
    );
    return res.data;
  },

  async adminUpdateForumReply(replyId, payload) {
    const res = await api.patch(
      `/study-material/admin/forum/replies/${replyId}`,
      payload,
    );
    return res.data;
  },

  async adminBanForumUser(userId, reason = "") {
    const res = await api.post(
      `/study-material/admin/forum/users/${userId}/ban`,
      { reason },
    );
    return res.data;
  },

  async adminUnbanForumUser(userId) {
    const res = await api.delete(
      `/study-material/admin/forum/users/${userId}/ban`,
    );
    return res.data;
  },

  async adminForumTopContributors() {
    const res = await api.get("/study-material/admin/forum/top-contributors");
    return res.data;
  },

  // AI Chatbot
  async aiChat(message) {
    const res = await api.post("/study-material/ai-chat", { message });
    return res.data;
  },
};
