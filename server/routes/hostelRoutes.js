const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireModuleAdmin } = require('../middleware/moduleAuthMiddleware');
const {
  applyForHostel,
  getMyApplication,
  adminListApplications,
  adminUpdateApplicationStatus,
  submitComplaint,
  getMyComplaints,
  adminListComplaints,
  adminUpdateComplaintStatus,
  submitReconsiderationRequest,
  getMyReconsiderationRequests,
  adminListReconsiderationRequests,
  adminUpdateReconsiderationRequestStatus,
  adminCreateMealShopAccount,
  adminCreateLaundryShopAccount,
  adminGetLaundryShopProfile,
  adminUpsertLaundryShopProfile,
  listLaundryShops,
  createLaundryBooking,
  getMyLaundryBookings,
  adminGetLaundryBookings,
  adminUpdateLaundryBookingStatus,
  adminDeleteLaundryBooking,
  adminUpdateLaundryBookingReady,
} = require('../controllers/hostelController');

const router = express.Router();

// Student endpoints
// Student endpoints
router.post('/apply', requireAuth, applyForHostel);
router.get('/my-application', requireAuth, getMyApplication);
router.post('/complaints', requireAuth, submitComplaint);
router.get('/my-complaints', requireAuth, getMyComplaints);
router.post('/reconsideration-requests', requireAuth, submitReconsiderationRequest);
router.get('/my-reconsideration-requests', requireAuth, getMyReconsiderationRequests);
router.get('/laundry/shops', requireAuth, listLaundryShops);
router.post('/laundry/bookings', requireAuth, createLaundryBooking);
router.get('/laundry/my-bookings', requireAuth, getMyLaundryBookings);

// Admin (warden) endpoints
router.get('/admin/all-applications', requireAuth, requireModuleAdmin('hostel-warden'), adminListApplications);
router.put('/admin/applications/:id', requireAuth, requireModuleAdmin('hostel-warden'), adminUpdateApplicationStatus);
router.get('/admin/all-complaints', requireAuth, requireModuleAdmin('hostel-warden'), adminListComplaints);
router.put('/admin/complaints/:id', requireAuth, requireModuleAdmin('hostel-warden'), adminUpdateComplaintStatus);
router.get('/admin/reconsideration-requests', requireAuth, requireModuleAdmin('hostel-warden'), adminListReconsiderationRequests);
router.put('/admin/reconsideration-requests/:id/status', requireAuth, requireModuleAdmin('hostel-warden'), adminUpdateReconsiderationRequestStatus);
router.post('/admin/meal-shop-accounts', requireAuth, requireModuleAdmin('hostel-warden'), adminCreateMealShopAccount);
router.post('/admin/laundry-shop-accounts', requireAuth, requireModuleAdmin('hostel-warden'), adminCreateLaundryShopAccount);
router.get('/admin/laundry/shop-profile', requireAuth, requireModuleAdmin('hostel-laundry'), adminGetLaundryShopProfile);
router.put('/admin/laundry/shop-profile', requireAuth, requireModuleAdmin('hostel-laundry'), adminUpsertLaundryShopProfile);
router.get('/admin/laundry/bookings', requireAuth, requireModuleAdmin('hostel-laundry'), adminGetLaundryBookings);
router.put('/admin/laundry/bookings/:id/status', requireAuth, requireModuleAdmin('hostel-laundry'), adminUpdateLaundryBookingStatus);
router.delete('/admin/laundry/bookings/:id', requireAuth, requireModuleAdmin('hostel-laundry'), adminDeleteLaundryBooking);
router.put('/admin/laundry/bookings/:id/ready', requireAuth, requireModuleAdmin('hostel-laundry'), adminUpdateLaundryBookingReady);

module.exports = router;