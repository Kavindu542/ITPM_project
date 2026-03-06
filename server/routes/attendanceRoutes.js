const express = require('express');

const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

// POST /api/attendance/:meetingId/mark
router.post('/:meetingId/mark', attendanceController.markAttendance);

module.exports = router;
