const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Club = require("../models/Club");
const ClubMember = require("../models/ClubMember");
const Meeting = require("../models/Meeting");
const Event = require("../models/Event");

const router = express.Router();

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

// Leader Meetings: list
router.get("/meetings", requireAuth, async (req, res) => {
  try {
    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }
    const items = await Meeting.find({ club: club._id })
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

// Leader Events: list
router.get("/events", requireAuth, async (req, res) => {
  try {
    const club = await Club.findOne({ leader: req.user._id }).lean();
    if (!club) {
      return res.status(403).json({ message: "You are not a club leader" });
    }
    const items = await Event.find({ club: club._id }).sort({ date: 1 }).lean();
    return res.json({
      events: items.map((e) => ({
        id: e._id,
        name: e.name,
        date: e.date,
        venue: e.venue || "",
        type: e.type || "Public",
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load events" });
  }
});

// Leader Events: create
router.post("/events", requireAuth, async (req, res) => {
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
    });
    return res.status(201).json({
      message: "Event created",
      event: {
        id: saved._id,
        name: saved.name,
        date: saved.date,
        venue: saved.venue || "",
        type: saved.type || "Public",
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create event" });
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
