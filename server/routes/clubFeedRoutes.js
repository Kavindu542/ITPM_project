const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const Event = require("../models/Event");
const Club = require("../models/Club");
const Meeting = require("../models/Meeting");
const User = require("../models/User");

const router = express.Router();

// Authenticated user's feed: meetings for clubs they belong to
router.get("/my/meetings", requireAuth, async (req, res) => {
  try {
    const fullUser = await User.findById(req.user?._id)
      .select("club clubs")
      .lean();
    const clubIds = new Set([
      ...(Array.isArray(fullUser?.clubs) ? fullUser.clubs.map((c) => String(c)) : []),
      fullUser?.club ? String(fullUser.club) : null,
    ].filter(Boolean));
    const hasMembership = clubIds.size > 0;
    if (!hasMembership) return res.json({ hasMembership: false, meetings: [] });
    const meetings = await Meeting.find({ club: { $in: Array.from(clubIds) } })
      .sort({ date: 1 })
      .populate("club", "_id name")
      .lean();
    return res.json({
      hasMembership,
      meetings: meetings.map((m) => ({
        id: m._id,
        title: m.title,
        date: m.date,
        venue: m.venue || "",
        description: m.description || "",
        club: { id: m.club?._id, name: m.club?.name },
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load meetings" });
  }
});

// Authenticated user's feed: events for clubs they belong to (both Members-only and Public)
router.get("/my/events", requireAuth, async (req, res) => {
  try {
    const fullUser = await User.findById(req.user?._id)
      .select("club clubs")
      .lean();
    const clubIds = new Set([
      ...(Array.isArray(fullUser?.clubs) ? fullUser.clubs.map((c) => String(c)) : []),
      fullUser?.club ? String(fullUser.club) : null,
    ].filter(Boolean));
    if (clubIds.size === 0) return res.json({ events: [] });
    const events = await Event.find({ club: { $in: Array.from(clubIds) } }).sort({ date: 1 }).populate("club", "_id name").lean();
    return res.json({
      events: events.map((e) => ({
        id: e._id,
        name: e.name,
        date: e.date,
        venue: e.venue || "",
        type: e.type || "Public",
        club: { id: e.club?._id, name: e.club?.name },
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load events" });
  }
});

// Public events for all users (no auth required in principle, but we keep it behind auth for simplicity)
router.get("/public/events", requireAuth, async (req, res) => {
  try {
    const events = await Event.find({ type: "Public" }).sort({ date: 1 }).populate("club", "_id name").lean();
    return res.json({
      events: events.map((e) => ({
        id: e._id,
        name: e.name,
        date: e.date,
        venue: e.venue || "",
        type: e.type || "Public",
        club: { id: e.club?._id, name: e.club?.name },
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load public events" });
  }
});

module.exports = router;

