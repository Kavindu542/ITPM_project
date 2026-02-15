const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireModuleAdmin } = require('../middleware/moduleAuthMiddleware');
const {
  applyForHostel,
  getMyApplication,
  adminListApplications,
  adminUpdateApplicationStatus,
} = require('../controllers/hostelController');

const router = express.Router();

// Student endpoints
router.post('/apply', requireAuth, applyForHostel);
router.get('/my-application', requireAuth, getMyApplication);

// Admin (warden) endpoints
router.get('/admin/all-applications', requireAuth, requireModuleAdmin('hostel-warden'), adminListApplications);
router.put('/admin/applications/:id', requireAuth, requireModuleAdmin('hostel-warden'), adminUpdateApplicationStatus);

module.exports = router;