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
};
