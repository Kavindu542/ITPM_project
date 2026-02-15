import { api } from "./api";

export const clubService = {
  // Leader endpoints
  async leaderGetMyClub() {
    const res = await api.get("/leader/me/club");
    return res.data;
  },
  async leaderEligibleStudents() {
    const res = await api.get("/leader/eligible-students");
    return res.data;
  },
  async leaderAddMember(studentId) {
    const res = await api.post("/leader/members", { studentId });
    return res.data;
  },

  async leaderListMeetings() {
    const res = await api.get("/leader/meetings");
    return res.data;
  },
  async leaderCreateMeeting(payload) {
    const res = await api.post("/leader/meetings", payload);
    return res.data;
  },
  async leaderListEvents() {
    const res = await api.get("/leader/events");
    return res.data;
  },
  async leaderCreateEvent(payload) {
    const res = await api.post("/leader/events", payload);
    return res.data;
  },

  async adminListClubs() {
    const res = await api.get("/admin/clubs");
    return res.data;
  },
  async adminCreateClub(payload) {
    const res = await api.post("/admin/clubs", payload);
    return res.data;
  },
  async adminUpdateClub(id, payload) {
    const res = await api.patch(`/admin/clubs/${id}`, payload);
    return res.data;
  },
  async adminDeleteClub(id) {
    const res = await api.delete(`/admin/clubs/${id}`);
    return res.data;
  },
  async listEligibleStudents() {
    const res = await api.get("/admin/get-all-students");
    return res.data;
  },

  async assignLeader({ clubId, studentId, replaceExisting = false }) {
    const res = await api.post("/admin/assign-leader", {
      clubId,
      studentId,
      replaceExisting: !!replaceExisting,
    });
    return res.data;
  },
  async removeLeader(clubId) {
    const res = await api.post(`/admin/clubs/${clubId}/remove-leader`);
    return res.data;
  },

  async myMeetings() {
    const res = await api.get("/club-feed/my/meetings");
    return res.data;
  },
  async myEvents() {
    const res = await api.get("/club-feed/my/events");
    return res.data;
  },
  async publicEvents() {
    const res = await api.get("/club-feed/public/events");
    return res.data;
  },
};
