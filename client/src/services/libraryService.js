import api from './api';
import axios from 'axios';

// Support Vite + CRA + fallback
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) ||
  'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

export const bookService = {
  getAll: (params = {}) => api.get('/library/books', { params }),
  getById: (id) => api.get(`/library/books/${id}`),
  create: (data) => api.post('/library/books', data),
  update: (id, data) => api.put(`/library/books/${id}`, data),
  delete: (id) => api.delete(`/library/books/${id}`),
};

export const studyRoomService = {
  // Active study rooms
  getAll: (params = {}) => api.get('/library/study-rooms', { params }),

  // Optional availability endpoint (if you already have it)
  getAvailability: (roomId, date) =>
    api.get(`/library/study-rooms/${roomId}/availability`, { params: { date } }),

  // Booking create — goes through reservations
  createBooking: (payload) => api.post('/library/reservations', payload),
  create: (data) => api.post('/library/study-rooms', data),
  update: (id, data) => api.put(`/library/study-rooms/${id}`, data),
  delete: (id) => api.delete(`/library/study-rooms/${id}`)
};

export const digitalResourceService = {
  getAll: (params = {}) => api.get('/library/digital-resources', { params }),
  getById: (id) => api.get(`/library/digital-resources/${id}`),
  create: (data) => api.post('/library/digital-resources', data),
  update: (id, data) => api.put(`/library/digital-resources/${id}`, data),
  delete: (id) => api.delete(`/library/digital-resources/${id}`),
};

export const reservationService = {
  getAll: (params = {}) => api.get('/library/reservations', { params }),
  getById: (id) => api.get(`/library/reservations/${id}`),
  create: (data) => api.post('/library/reservations', data),
  update: (id, data) => api.put(`/library/reservations/${id}`, data),
  updateStatus: (id, data) => api.patch(`/library/reservations/${id}/status`, data),
  delete: (id) => api.delete(`/library/reservations/${id}`),
};

export const libraryStatsService = {
  get: () => api.get('/library/stats'),
};
