import { api } from "./api";

const getBase = () => {
  if (import.meta.env.VITE_API_URL) return String(import.meta.env.VITE_API_URL);
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
};
