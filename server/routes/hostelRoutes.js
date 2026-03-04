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
  adminCreateMealShopAccount,
  adminCreateLaundryShopAccount,
} = require('../controllers/hostelController');

const router = express.Router();

// Student endpoints
// Student endpoints
router.post('/apply', requireAuth, applyForHostel);
router.get('/my-application', requireAuth, getMyApplication);
router.post('/complaints', requireAuth, submitComplaint);
router.get('/my-complaints', requireAuth, getMyComplaints);

// Admin (warden) endpoints
router.get('/admin/all-applications', requireAuth, requireModuleAdmin('hostel-warden'), adminListApplications);
router.put('/admin/applications/:id', requireAuth, requireModuleAdmin('hostel-warden'), adminUpdateApplicationStatus);
router.get('/admin/all-complaints', requireAuth, requireModuleAdmin('hostel-warden'), adminListComplaints);
router.put('/admin/complaints/:id', requireAuth, requireModuleAdmin('hostel-warden'), adminUpdateComplaintStatus);
router.post('/admin/meal-shop-accounts', requireAuth, requireModuleAdmin('hostel-warden'), adminCreateMealShopAccount);
router.post('/admin/laundry-shop-accounts', requireAuth, requireModuleAdmin('hostel-warden'), adminCreateLaundryShopAccount);

module.exports = router;