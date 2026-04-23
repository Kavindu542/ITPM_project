import { api } from "./api";

export const clubService = {
  // Student endpoints
  async listClubs() {
    const res = await api.get("/clubs");
    return res.data;
  },
  async applyToClub(clubId, payload) {
    const res = await api.post(`/clubs/${clubId}/apply`, payload);
    return res.data;
  },

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
  async leaderUpdateMeeting(meetingId, payload) {
    const res = await api.patch(`/leader/meetings/${meetingId}`, payload);
    return res.data;
  },
  async leaderDeleteMeeting(meetingId) {
    const res = await api.delete(`/leader/meetings/${meetingId}`);
    return res.data;
  },

  async leaderGetMeetingAttendance(meetingId) {
    const res = await api.get(`/attendance/${meetingId}`);
    return res.data;
  },
  async leaderListEvents() {
    const res = await api.get("/leader/events");
    return res.data;
  },

  async leaderUpdateReportSettings({ monthlyReportEmailEnabled } = {}) {
    const res = await api.patch('/leader/report-settings', {
      monthlyReportEmailEnabled: Boolean(monthlyReportEmailEnabled),
    });
    return res.data;
  },

  async leaderGetReport({ period, weekStart, month } = {}) {
    const params = { period };
    if (period === 'weekly') params.weekStart = weekStart;
    if (period === 'monthly') params.month = month;
    const res = await api.get('/leader/report', { params });
    return res.data;
  },
  async leaderListMembershipApplications() {
    const res = await api.get("/leader/membership-applications");
    return res.data;
  },
  async leaderDeleteMembershipApplication(applicationId) {
    const res = await api.delete(`/leader/membership-applications/${applicationId}`);
    return res.data;
  },
  async leaderCreateEvent(payload) {
    const res = await api.post("/leader/events", payload);
    return res.data;
  },
  async leaderUpdateEvent(eventId, payload) {
    const res = await api.patch(`/leader/events/${eventId}`, payload);
    return res.data;
  },
  async leaderDeleteEvent(eventId) {
    const res = await api.delete(`/leader/events/${eventId}`);
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
