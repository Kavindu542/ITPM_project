const express = require('express');

const attendanceController = require('../controllers/attendanceController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/attendance/:meetingId/mark
router.post('/:meetingId/mark', requireAuth, attendanceController.markAttendance);

// GET /api/attendance/:meetingId (leader-only)
router.get('/:meetingId', requireAuth, attendanceController.listMeetingAttendance);

module.exports = router;
