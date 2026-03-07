import { api } from './api';

export const hostelService = {
  // Student applies for hostel
  applyForHostel: async (formData) => {
    try {
      console.log('Sending hostel application:', formData);
      const response = await api.post('/hostel/apply', formData);
      console.log('Application response:', response.data);
      return response.data;
    } catch (error) {
      console.error('applyForHostel error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error.response?.data || error;
    }
  },

  // Get current student's application
  getMyApplication: async () => {
    try {
      const response = await api.get('/hostel/my-application');
      return response.data;
    } catch (error) {
      // Handle 404 silently - no application exists yet (expected for new users)
      if (error.response?.status === 404) {
        return null;
      }

      console.error('getMyApplication error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error.response?.data || error;
    }
  },

  // Admin: Get all applications
  getAllApplications: async () => {
    try {
      const response = await api.get('/hostel/admin/all-applications');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Admin: Update application status
  updateApplicationStatus: async (applicationId, status) => {
    try {
      const response = await api.put(`/hostel/admin/applications/${applicationId}`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Student: Submit complaint
  submitComplaint: async (complaintData) => {
    try {
      const response = await api.post('/hostel/complaints', complaintData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Student: Submit reconsideration request after rejection
  submitReconsiderationRequest: async (payload) => {
    try {
      const response = await api.post('/hostel/reconsideration-requests', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Student: Get own reconsideration requests
  getMyReconsiderationRequests: async () => {
    try {
      const response = await api.get('/hostel/my-reconsideration-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Student: Get my complaints
  getMyComplaints: async () => {
    try {
      const response = await api.get('/hostel/my-complaints');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Admin: Get all complaints
  getAllComplaints: async () => {
    try {
      const response = await api.get('/hostel/admin/all-complaints');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Admin: Get all reconsideration requests
  getAllReconsiderationRequests: async () => {
    try {
      const response = await api.get('/hostel/admin/reconsideration-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Admin: Approve/reject reconsideration request
  updateReconsiderationRequestStatus: async (requestId, status, adminMessage) => {
    try {
      const response = await api.put(`/hostel/admin/reconsideration-requests/${requestId}/status`, {
        status,
        adminMessage,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Admin: Update complaint status
  updateComplaintStatus: async (complaintId, status) => {
    try {
      const response = await api.put(`/hostel/admin/complaints/${complaintId}`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Admin (warden): Create meal shop login account
  createMealShopAccount: async (payload) => {
    try {
      const response = await api.post('/hostel/admin/meal-shop-accounts', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Admin (warden): Create laundry shop login account
  createLaundryShopAccount: async (payload) => {
    try {
      const response = await api.post('/hostel/admin/laundry-shop-accounts', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Laundry admin: Get own laundry shop profile
  getLaundryShopProfile: async () => {
    try {
      const response = await api.get('/hostel/admin/laundry/shop-profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Laundry admin: Save laundry shop profile
  saveLaundryShopProfile: async (payload) => {
    try {
      const response = await api.put('/hostel/admin/laundry/shop-profile', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Student: List active laundry shops
  getLaundryShops: async () => {
    try {
      const response = await api.get('/hostel/laundry/shops');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Student: Create a laundry booking
  createLaundryBooking: async (payload) => {
    try {
      const response = await api.post('/hostel/laundry/bookings', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Student: Get own laundry bookings
  getMyLaundryBookings: async () => {
    try {
      const response = await api.get('/hostel/laundry/my-bookings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Laundry admin: View student laundry bookings
  getLaundryAdminBookings: async () => {
    try {
      const response = await api.get('/hostel/admin/laundry/bookings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Laundry admin: Update booking status
  updateLaundryBookingStatus: async (bookingId, status) => {
    try {
      const response = await api.put(`/hostel/admin/laundry/bookings/${bookingId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Laundry admin: Delete booking row
  deleteLaundryBooking: async (bookingId) => {
    try {
      const response = await api.delete(`/hostel/admin/laundry/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Laundry admin: Update ready info (yes/no)
  updateLaundryBookingReady: async (bookingId, ready) => {
    try {
      const response = await api.put(`/hostel/admin/laundry/bookings/${bookingId}/ready`, { ready });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
