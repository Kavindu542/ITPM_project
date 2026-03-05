const mongoose = require('mongoose');

const Attendance = require('../models/attendanceModel');
const Meeting = require('../models/Meeting');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

exports.markAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params || {};
    const { studentId } = req.body || {};

    if (!meetingId || !isValidId(meetingId)) {
      return res.status(400).json({ success: false, message: 'Valid meetingId is required' });
    }

    const normalizedStudentId = String(studentId || '').trim().toUpperCase();
    if (!normalizedStudentId) {
      return res.status(400).json({ success: false, message: 'studentId is required' });
    }

    const meeting = await Meeting.findById(meetingId).select('_id club').lean();
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    try {
      const doc = await Attendance.create({
        meeting: meeting._id,
        club: meeting.club || null,
        studentId: normalizedStudentId,
        markedAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Attendance marked',
        data: {
          id: doc._id,
          meetingId: String(doc.meeting),
          studentId: doc.studentId,
          markedAt: doc.markedAt,
        },
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Attendance already marked for this student',
          code: 'DUPLICATE_ATTENDANCE',
        });
      }
      throw err;
    }
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'Failed to mark attendance' });
  }
};
