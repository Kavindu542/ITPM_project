import { api } from './api';

export const attendanceService = {
  async markAttendance(meetingId) {
    const res = await api.post(`/attendance/${encodeURIComponent(String(meetingId || ''))}/mark`, {});
    return res.data;
  },

  async leaderGetAttendance({ meetingId } = {}) {
    const params = {};
    if (meetingId) params.meetingId = meetingId;
    const res = await api.get('/leader/attendance', { params });
    return res.data;
  },
};
