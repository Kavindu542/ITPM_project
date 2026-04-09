const mongoose = require('mongoose');

const Attendance = require('../models/attendanceModel');
const Club = require('../models/Club');
const Meeting = require('../models/Meeting');
const User = require('../models/User');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

exports.markAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params || {};
    const { studentId: studentIdFromBody } = req.body || {};

    if (!meetingId || !isValidId(meetingId)) {
      return res.status(400).json({ success: false, message: 'Valid meetingId is required' });
    }

    let normalizedStudentId = String(req.user?.studentId || '').trim().toUpperCase();
    if (!normalizedStudentId) {
      // Fallback: fetch from DB (token may be missing/old)
      const userId = req.user?.sub || req.user?._id || req.user?.id;
      if (userId && isValidId(userId)) {
        const u = await User.findById(userId).select('studentId').lean();
        normalizedStudentId = String(u?.studentId || '').trim().toUpperCase();
      }
    }

    // Backward-compatible fallback (only if user has no studentId)
    if (!normalizedStudentId) {
      normalizedStudentId = String(studentIdFromBody || '').trim().toUpperCase();
    }

    if (!normalizedStudentId) {
      return res.status(400).json({ success: false, message: 'studentId is missing for this user' });
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

exports.listMeetingAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params || {};

    if (!meetingId || !isValidId(meetingId)) {
      return res.status(400).json({ success: false, message: 'Valid meetingId is required' });
    }

    const meeting = await Meeting.findById(meetingId).select('_id club').lean();
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const leaderId = req.user?._id || req.user?.id;
    if (!leaderId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const allowed = await Club.exists({ _id: meeting.club, leader: leaderId });
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    const docs = await Attendance.find({ meeting: meeting._id })
      .sort({ markedAt: -1 })
      .select('studentId markedAt')
      .lean();

    return res.json({
      success: true,
      meetingId: String(meeting._id),
      count: docs.length,
      items: docs.map((d) => ({ studentId: d.studentId, markedAt: d.markedAt })),
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'Failed to load attendance' });
  }
};
