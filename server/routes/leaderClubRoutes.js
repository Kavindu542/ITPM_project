const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Club = require("../models/Club");
const ClubMember = require("../models/ClubMember");
const Meeting = require("../models/Meeting");
const Event = require("../models/Event");
const ClubMembershipApplication = require("../models/ClubMembershipApplication");
const Attendance = require("../models/attendanceModel");
const eventPosterUpload = require("../middleware/eventPosterUpload");

const router = express.Router();

const isValidYyyyMmDd = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
const isValidYyyyMm = (value) => /^\d{4}-\d{2}$/.test(String(value || '').trim());

const toLocalMidnightFromDateOnly = (yyyyMmDd) => {
  const s = String(yyyyMmDd || '').trim();
  const [y, m, d] = s.split('-').map((p) => Number(p));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
};

const toLocalMonthStart = (yyyyMm) => {
  const s = String(yyyyMm || '').trim();
  const [y, m] = s.split('-').map((p) => Number(p));
  return new Date(y, (m || 1) - 1, 1, 0, 0, 0, 0);
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));

router.get("/me/club", requireAuth, async (req, res) => {
  try {
    const leaderId = req.user._id;
    const club = await Club.findOne({ leader: leaderId })
      .populate("leader", "_id name email")
      .populate("members", "_id name email studentId department year")
      .lean();

    if (!club) {
      return res.json({ club: null });
    }

    return res.json({
      club: {
        id: club._id,
        name: club.name,
        description: club.description || "",
        rules: club.rules || "",
        logoUrl: club.logoUrl || "",
        monthlyReportEmailEnabled: !!club.monthlyReportEmailEnabled,
        leader: club.leader
          ? { id: club.leader._id, name: club.leader.name, email: club.leader.email }
          : null,
        members: Array.isArray(club.members)
          ? club.members.map((m) => ({
              id: m._id,
              name: m.name,
              email: m.email,
              studentId: m.studentId || null,
              department: m.department || null,
              year: m.year || null,
            }))
          : [],
        status: club.status || "Active",
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load club" });
  }
});

// Leader: monthly report email settings
router.patch('/report-settings', requireAuth, async (req, res) => {
  try {
    const club = await Club.findOne({ leader: req.user._id });
    if (!club) {
      return res.status(403).json({ message: 'You are not a club leader' });
    }

    const enabled = req.body?.monthlyReportEmailEnabled;
    if (enabled === undefined) {
      return res.status(400).json({ message: 'monthlyReportEmailEnabled is required' });
    }

    club.monthlyReportEmailEnabled = Boolean(enabled);
    club.updatedAt = new Date();
    await club.save();

    return res.json({
      message: 'Report settings updated',
      monthlyReportEmailEnabled: !!club.monthlyReportEmailEnabled,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update report settings' });
  }
});

// Leader Meetings: list
router.get("/meetings", requireAuth, async (req, res) => {
  try {
    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }
    const now = new Date();
    const items = await Meeting.find({ club: club._id, isDeleted: { $ne: true }, date: { $gte: now } })
      .sort({ date: 1 })
      .lean();
    return res.json({
      meetings: items.map((m) => ({
        id: m._id,
        title: m.title,
        date: m.date,
        venue: m.venue || "",
        description: m.description || "",
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load meetings" });
  }
});

// Leader Attendance: list (optional ?meetingId=...)
router.get("/attendance", requireAuth, async (req, res) => {
  try {
    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }

    const meetingId = String(req.query?.meetingId || "").trim();
    let meeting = null;

    const filter = { club: club._id };
    if (meetingId) {
      if (!isValidId(meetingId)) {
        return res.status(400).json({ message: "Valid meetingId is required" });
      }
      meeting = await Meeting.findById(meetingId).select("_id title date club").lean();
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      if (String(meeting.club) !== String(club._id)) {
        return res.status(403).json({ message: "Not allowed" });
      }
      filter.meeting = meeting._id;
    }

    const rows = await Attendance.find(filter)
      .select("_id meeting studentId markedAt")
      .sort({ markedAt: -1 })
      .lean();

    const studentIds = [...new Set(rows.map((r) => String(r.studentId || "").trim()).filter(Boolean))];
    const users = studentIds.length
      ? await User.find({ studentId: { $in: studentIds } }).select("studentId name email").lean()
      : [];
    const byStudentId = new Map(users.map((u) => [String(u.studentId || "").trim().toUpperCase(), u]));

    const items = rows.map((r) => {
      const sid = String(r.studentId || "").trim().toUpperCase();
      const u = byStudentId.get(sid);
      return {
        id: r._id,
        meetingId: String(r.meeting),
        studentId: sid,
        studentName: u?.name || null,
        studentEmail: u?.email || null,
        markedAt: r.markedAt,
      };
    });

    return res.json({
      meeting: meeting
        ? {
            id: meeting._id,
            title: meeting.title,
            date: meeting.date,
          }
        : null,
      count: items.length,
      items,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load attendance" });
  }
});

// Leader Reports: weekly/monthly (max)
router.get('/report', requireAuth, async (req, res) => {
  try {
    const club = await Club.findOne({ leader: req.user._id }).select('_id name').lean();
    if (!club) {
      return res.status(403).json({ message: 'You are not a club leader' });
    }

    const period = String(req.query?.period || '').trim().toLowerCase();

    let start = null;
    let end = null;

    if (period === 'weekly') {
      const weekStart = String(req.query?.weekStart || '').trim();
      if (!isValidYyyyMmDd(weekStart)) {
        return res.status(400).json({ message: 'weekStart (YYYY-MM-DD) is required for weekly reports' });
      }
      start = toLocalMidnightFromDateOnly(weekStart);
      if (!Number.isFinite(start.getTime())) {
        return res.status(400).json({ message: 'Invalid weekStart date' });
      }
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    } else if (period === 'monthly') {
      const month = String(req.query?.month || '').trim();
      if (!isValidYyyyMm(month)) {
        return res.status(400).json({ message: 'month (YYYY-MM) is required for monthly reports' });
      }
      start = toLocalMonthStart(month);
      if (!Number.isFinite(start.getTime())) {
        return res.status(400).json({ message: 'Invalid month value' });
      }
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
    } else {
      return res.status(400).json({ message: "period must be 'weekly' or 'monthly'" });
    }

    // Reports are for understanding past activity.
    // Clamp the end date to now so we don't include future items.
    const now = new Date();
    if (end.getTime() > now.getTime()) end = now;

    // If the selected period is fully in the future, return an empty report.
    if (start.getTime() >= end.getTime()) {
      return res.json({
        club: { id: club._id, name: club.name },
        period,
        start,
        end,
        totals: {
          meetingsCount: 0,
          eventsCount: 0,
          totalAttendanceMarks: 0,
          averageAttendancePerMeeting: 0,
        },
        meetings: [],
        events: [],
      });
    }

    const meetingFilter = {
      club: club._id,
      date: { $gte: start, $lt: end },
      $or: [
        // Not deleted
        { isDeleted: { $ne: true } },
        // Deleted after it occurred (cleanup) => still count as past activity
        {
          $and: [
            { isDeleted: true },
            { deletedAt: { $ne: null } },
            { $expr: { $gte: ['$deletedAt', '$date'] } },
          ],
        },
      ],
    };

    const meetings = await Meeting.find(meetingFilter)
      .select('_id title date venue description')
      .sort({ date: 1 })
      .lean();

    const eventFilter = {
      club: club._id,
      date: { $gte: start, $lt: end },
      $or: [
        { isDeleted: { $ne: true } },
        {
          $and: [
            { isDeleted: true },
            { deletedAt: { $ne: null } },
            { $expr: { $gte: ['$deletedAt', '$date'] } },
          ],
        },
      ],
    };

    const events = await Event.find(eventFilter)
      .select('_id name date venue type')
      .sort({ date: 1 })
      .lean();

    const meetingIds = meetings.map((m) => m._id);

    const attendanceRows = meetingIds.length
      ? await Attendance.find({ club: club._id, meeting: { $in: meetingIds } })
          .select('_id meeting studentId markedAt')
          .sort({ markedAt: 1 })
          .lean()
      : [];

    const groupedAttendance = new Map();
    for (const row of attendanceRows) {
      const key = String(row.meeting);
      if (!groupedAttendance.has(key)) groupedAttendance.set(key, []);
      groupedAttendance.get(key).push(row);
    }

    const uniqueStudentIds = [
      ...new Set(
        attendanceRows
          .map((r) => String(r.studentId || '').trim())
          .filter(Boolean)
          .flatMap((sid) => [sid, sid.toUpperCase(), sid.toLowerCase()])
      ),
    ];

    const users = uniqueStudentIds.length
      ? await User.find({ studentId: { $in: uniqueStudentIds } })
          .select('studentId name email')
          .lean()
      : [];
    const byStudentId = new Map(
      users.map((u) => [String(u.studentId || '').trim().toUpperCase(), u])
    );

    const meetingItems = meetings.map((m) => {
      const rows = groupedAttendance.get(String(m._id)) || [];
      const attendees = rows.map((r) => {
        const sid = String(r.studentId || '').trim().toUpperCase();
        const u = byStudentId.get(sid);
        return {
          studentId: sid,
          studentName: u?.name || null,
          studentEmail: u?.email || null,
          markedAt: r.markedAt,
        };
      });
      return {
        id: m._id,
        title: m.title,
        date: m.date,
        venue: m.venue || '',
        description: m.description || '',
        attendanceCount: attendees.length,
        attendees,
      };
    });

    const eventItems = (events || []).map((e) => ({
      id: e._id,
      name: e.name,
      date: e.date,
      venue: e.venue || '',
      type: e.type || 'Public',
    }));

    const totals = {
      meetingsCount: meetingItems.length,
      eventsCount: eventItems.length,
      totalAttendanceMarks: attendanceRows.length,
      averageAttendancePerMeeting: meetingItems.length
        ? attendanceRows.length / meetingItems.length
        : 0,
    };

    return res.json({
      club: { id: club._id, name: club.name },
      period,
      start,
      end,
      totals,
      meetings: meetingItems,
      events: eventItems,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to generate report' });
  }
});

// Leader Meetings: create
router.post("/meetings", requireAuth, async (req, res) => {
  try {
    const { title, date, venue, description } = req.body || {};
    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "title is required" });
    }
    const dt = new Date(date);
    if (!Number.isFinite(dt.getTime())) {
      return res.status(400).json({ message: "valid date is required" });
    }
    const saved = await Meeting.create({
      title: String(title).trim(),
      club: club._id,
      date: dt,
      venue: String(venue || "").trim(),
      description: String(description || "").trim(),
      createdBy: req.user._id,
    });
    return res.status(201).json({
      message: "Meeting created",
      meeting: {
        id: saved._id,
        title: saved.title,
        date: saved.date,
        venue: saved.venue || "",
        description: saved.description || "",
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create meeting" });
  }
});

// Leader Meetings: update
router.patch("/meetings/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id || !isValidId(id)) {
      return res.status(400).json({ message: "Valid meeting id is required" });
    }

    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (String(meeting.club) !== String(club._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { title, date, venue, description } = req.body || {};

    if (title !== undefined) {
      if (!String(title).trim()) return res.status(400).json({ message: "title is required" });
      meeting.title = String(title).trim();
    }
    if (date !== undefined) {
      const dt = new Date(date);
      if (!Number.isFinite(dt.getTime())) {
        return res.status(400).json({ message: "valid date is required" });
      }
      meeting.date = dt;
    }
    if (venue !== undefined) meeting.venue = String(venue || "").trim();
    if (description !== undefined) meeting.description = String(description || "").trim();

    const saved = await meeting.save();
    return res.json({
      message: "Meeting updated",
      meeting: {
        id: saved._id,
        title: saved.title,
        date: saved.date,
        venue: saved.venue || "",
        description: saved.description || "",
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update meeting" });
  }
});

// Leader Meetings: delete
router.delete("/meetings/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id || !isValidId(id)) {
      return res.status(400).json({ message: "Valid meeting id is required" });
    }

    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }

    const meeting = await Meeting.findById(id).lean();
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (String(meeting.club) !== String(club._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Meeting.updateOne(
      { _id: id },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() } },
    );

    return res.json({ message: "Meeting deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete meeting" });
  }
});

// Leader Events: list
router.get("/events", requireAuth, async (req, res) => {
  try {
    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }
    const now = new Date();
    const items = await Event.find({ club: club._id, isDeleted: { $ne: true }, date: { $gte: now } }).sort({ date: 1 }).lean();
    return res.json({
      events: items.map((e) => ({
        id: e._id,
        name: e.name,
        date: e.date,
        venue: e.venue || "",
        type: e.type || "Public",
        posterUrl: e.posterUrl || "",
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load events" });
  }
});

// Leader Events: create
router.post("/events", requireAuth, eventPosterUpload.single('poster'), async (req, res) => {
  try {
    const { name, date, venue, type } = req.body || {};
    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "name is required" });
    }
    const dt = new Date(date);
    if (!Number.isFinite(dt.getTime())) {
      return res.status(400).json({ message: "valid date is required" });
    }
    const cleanType = String(type || "Public").trim();
    if (!["Members-only", "Public"].includes(cleanType)) {
      return res.status(400).json({ message: "type must be 'Members-only' or 'Public'" });
    }
    const saved = await Event.create({
      name: String(name).trim(),
      club: club._id,
      date: dt,
      venue: String(venue || "").trim(),
      type: cleanType,
      posterUrl: req.file?.filename ? `/uploads/events/${req.file.filename}` : "",
    });
    return res.status(201).json({
      message: "Event created",
      event: {
        id: saved._id,
        name: saved.name,
        date: saved.date,
        venue: saved.venue || "",
        type: saved.type || "Public",
        posterUrl: saved.posterUrl || "",
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create event" });
  }
});

// Leader Events: update
router.patch("/events/:id", requireAuth, eventPosterUpload.single('poster'), async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id || !isValidId(id)) {
      return res.status(400).json({ message: "Valid event id is required" });
    }

    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (String(event.club) !== String(club._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const { name, date, venue, type } = req.body || {};

    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ message: "name is required" });
      event.name = String(name).trim();
    }

    if (date !== undefined) {
      const dt = new Date(date);
      if (!Number.isFinite(dt.getTime())) {
        return res.status(400).json({ message: "valid date is required" });
      }
      event.date = dt;
    }

    if (venue !== undefined) event.venue = String(venue || "").trim();

    if (type !== undefined) {
      const cleanType = String(type || "Public").trim();
      if (!["Members-only", "Public"].includes(cleanType)) {
        return res.status(400).json({ message: "type must be 'Members-only' or 'Public'" });
      }
      event.type = cleanType;
    }

    if (req.file?.filename) {
      event.posterUrl = `/uploads/events/${req.file.filename}`;
    }

    const saved = await event.save();
    return res.json({
      message: "Event updated",
      event: {
        id: saved._id,
        name: saved.name,
        date: saved.date,
        venue: saved.venue || "",
        type: saved.type || "Public",
        posterUrl: saved.posterUrl || "",
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update event" });
  }
});

// Leader Events: delete
router.delete("/events/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id || !isValidId(id)) {
      return res.status(400).json({ message: "Valid event id is required" });
    }

    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }

    const event = await Event.findById(id).lean();
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (String(event.club) !== String(club._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Event.updateOne(
      { _id: id },
      { $set: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() } },
    );
    return res.json({ message: "Event deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete event" });
  }
});

// Leader: list membership applications for their club
router.get("/membership-applications", requireAuth, async (req, res) => {
  try {
    const club = await Club.findOne({ leader: req.user._id })
      .select("_id name")
      .lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }

    const apps = await ClubMembershipApplication.find({ club: club._id })
      .sort({ createdAt: -1 })
      .populate("applicant", "_id name email studentId department year")
      .lean();

    const items = (apps || []).map((a) => ({
      id: a._id,
      createdAt: a.createdAt,
      club: { id: club._id, name: club.name },
      applicant: a.applicant
        ? {
            id: a.applicant._id,
            name: a.applicant.name,
            email: a.applicant.email,
            studentId: a.applicant.studentId || null,
            department: a.applicant.department || null,
            year: a.applicant.year || null,
          }
        : null,
      school: a.school || {},
      personal: a.personal || {},
      contact: a.contact || {},
      languages: Array.isArray(a.languages) ? a.languages : [],
      educationQualifications: a.educationQualifications || "",
      sportsQualifications: a.sportsQualifications || "",
      notes: a.notes || "",
    }));

    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch applications" });
  }
});

// Leader: delete a membership application for their club
router.delete("/membership-applications/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params || {};
    if (!id || !isValidId(id)) {
      return res.status(400).json({ message: "Valid application id is required" });
    }

    const club = await Club.findOne({ leader: req.user._id })
      .select("_id")
      .lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }

    const app = await ClubMembershipApplication.findById(id)
      .select("_id club")
      .lean();
    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (String(app.club) !== String(club._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await ClubMembershipApplication.deleteOne({ _id: id });
    return res.json({ message: "Application deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete application" });
  }
});
router.get("/eligible-students", requireAuth, async (req, res) => {
  try {
    // Leader must have a club
    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }

    // Students not already in this club's members
    const excludeIds = new Set([String(req.user._id), ...club.members.map((m) => String(m))]);

    // Allow both students and club leaders to be added as members of other clubs
    const students = await User.find({ role: { $in: ["student", "club_leader"] } })
      .select("_id name email studentId department year")
      .sort({ name: 1 })
      .lean();

    const list = students
      .filter((s) => !excludeIds.has(String(s._id)))
      .map((s) => ({
        id: s._id,
        name: s.name,
        email: s.email,
        studentId: s.studentId || null,
        department: s.department || null,
        year: s.year || null,
      }));

    return res.json({ count: list.length, students: list });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch students" });
  }
});

router.post("/members", requireAuth, async (req, res) => {
  try {
    const { studentId } = req.body || {};
    if (!studentId || !isValidId(studentId)) {
      return res.status(400).json({ message: "Valid studentId is required" });
    }

    const club = await Club.findOne({ leader: req.user._id });
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    const alreadyMember = club.members.some((m) => String(m) === String(student._id));
    if (alreadyMember) {
      return res.status(409).json({ message: "Student is already a member" });
    }

    // Add to club members
    club.members.push(student._id);
    await club.save();

    // Add to user's clubs list if not present
    if (!Array.isArray(student.clubs)) student.clubs = [];
    if (!student.clubs.some((c) => String(c) === String(club._id))) {
      student.clubs.push(club._id);
      await student.save();
    }

    // Upsert ClubMember record
    const existingCM = await ClubMember.findOne({ club: club._id, student: student._id });
    if (!existingCM) {
      await ClubMember.create({ club: club._id, student: student._id });
    }

    return res.status(201).json({
      message: "Member added",
      member: {
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId || null,
        department: student.department || null,
        year: student.year || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to add member" });
  }
});

module.exports = router;
