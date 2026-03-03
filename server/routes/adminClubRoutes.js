const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireModuleAdmin } = require("../middleware/moduleAuthMiddleware");
const User = require("../models/User");
const Club = require("../models/Club");

const router = express.Router();

router.get(
  "/clubs",
  requireAuth,
  requireModuleAdmin("club-and-society"),
  async (req, res) => {
    try {
      const clubs = await Club.find({})
        .populate("leader", "_id name email")
        .select("name description rules logoUrl leader members events status createdAt updatedAt")
        .lean();

      const items = clubs.map((c) => ({
        id: c._id,
        name: c.name,
        description: c.description || "",
        rules: c.rules || "",
        logoUrl: c.logoUrl || "",
        leader: c.leader ? { id: c.leader._id, name: c.leader.name, email: c.leader.email } : null,
        members: Array.isArray(c.members) ? c.members.length : 0,
        events: Array.isArray(c.events) ? c.events.length : 0,
        status: c.status || "Active",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      return res.json({ items, count: items.length });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch clubs" });
    }
  },
);

router.post(
  "/clubs",
  requireAuth,
  requireModuleAdmin("club-and-society"),
  async (req, res) => {
    try {
      const { name, description, rules, logoUrl } = req.body || {};
      const trimmedName = String(name || "").trim().replace(/\s+/g, " ");
      if (!trimmedName) {
        return res.status(400).json({ message: "Club name is required" });
      }

      // Case-insensitive uniqueness guard
      const existing = await Club.findOne({
        name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      }).select("_id");
      if (existing) {
        return res.status(409).json({ message: "A club with this name already exists" });
      }

      const club = await Club.create({
        name: trimmedName,
        description: String(description || "").trim(),
        rules: String(rules || "").trim(),
        logoUrl: String(logoUrl || "").trim(),
        status: "Active",
      });

      return res.status(201).json({
        id: club._id,
        name: club.name,
        description: club.description || "",
        rules: club.rules || "",
        logoUrl: club.logoUrl || "",
        leader: null,
        members: 0,
        events: 0,
        status: club.status,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
      });
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ message: "A club with this name already exists" });
      }
      if (err?.name === "ValidationError") {
        const first = Object.values(err.errors || {})[0];
        return res.status(400).json({ message: first?.message || "Invalid club data" });
      }
      return res.status(500).json({ message: "Failed to create club" });
    }
  },
);

router.patch(
  "/clubs/:id",
  requireAuth,
  requireModuleAdmin("club-and-society"),
  async (req, res) => {
    try {
      const { id } = req.params || {};
      const { name, description, rules, logoUrl, status } = req.body || {};
      const club = await Club.findById(id);
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }

      if (name !== undefined) club.name = String(name).trim();
      if (description !== undefined) club.description = String(description || "").trim();
      if (rules !== undefined) club.rules = String(rules || "").trim();
      if (logoUrl !== undefined) club.logoUrl = String(logoUrl || "").trim();
      if (status !== undefined) club.status = String(status).trim() || "Active";

      await club.save();

      return res.json({
        id: club._id,
        name: club.name,
        description: club.description || "",
        rules: club.rules || "",
        logoUrl: club.logoUrl || "",
        leader: club.leader || null,
        members: Array.isArray(club.members) ? club.members.length : 0,
        events: Array.isArray(club.events) ? club.events.length : 0,
        status: club.status,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
      });
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ message: "A club with this name already exists" });
      }
      return res.status(500).json({ message: "Failed to update club" });
    }
  },
);

router.delete(
  "/clubs/:id",
  requireAuth,
  requireModuleAdmin("club-and-society"),
  async (req, res) => {
    try {
      const { id } = req.params || {};
      const club = await Club.findByIdAndDelete(id);
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }
      return res.json({ message: "Club deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete club" });
    }
  },
);

router.get(
  "/get-all-students",
  requireAuth,
  requireModuleAdmin("club-and-society"),
  async (req, res) => {
    try {
      const leaderClubs = await Club.find({ leader: { $ne: null } })
        .select("leader")
        .lean();
      const leaderIds = new Set(leaderClubs.map((c) => String(c.leader)));

      const query = { role: "student" };
      if (leaderIds.size > 0) {
        query._id = { $nin: Array.from(leaderIds).map((id) => new mongoose.Types.ObjectId(id)) };
      }

      const students = await User.find(query)
        .select("_id studentId name email department year role")
        .sort({ name: 1 })
        .lean();

      return res.json({
        count: students.length,
        students: students.map((s) => ({
          id: s._id,
          studentId: s.studentId || null,
          name: s.name,
          email: s.email,
          department: s.department || null,
          year: s.year || null,
        })),
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch students" });
    }
  },
);

router.post(
  "/assign-leader",
  requireAuth,
  requireModuleAdmin("club-and-society"),
  async (req, res) => {
    try {
      const { clubId, studentId, replaceExisting } = req.body || {};

      if (!clubId || !studentId) {
        return res
          .status(400)
          .json({ message: "clubId and studentId are required" });
      }

      if (!mongoose.isValidObjectId(clubId) || !mongoose.isValidObjectId(studentId)) {
        return res.status(400).json({ message: "Invalid clubId or studentId" });
      }

      const club = await Club.findById(clubId);
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }

      const student = await User.findById(studentId).select(
        "_id name email role department year clubs club",
      );
      if (!student || student.role !== "student") {
        return res
          .status(400)
          .json({ message: "Selected user is not an eligible student" });
      }

      // If the club already has a leader, decide whether this is a real conflict.
      // - If the current leader record no longer exists, clear the dangling reference.
      // - If assigning the same current leader, treat as idempotent success.
      // - Otherwise require explicit replaceExisting.
      if (club.leader) {
        const currentLeaderId = String(club.leader);
        const selectedStudentId = String(student._id);

        if (currentLeaderId === selectedStudentId) {
          return res.json({
            message: `${student.name} is already the leader of ${club.name}`,
            club: { id: club._id, name: club.name, leaderId: student._id },
            student: {
              id: student._id,
              name: student.name,
              email: student.email,
              department: student.department || null,
              year: student.year || null,
            },
            replaced: false,
            oldLeader: null,
          });
        }

        const currentLeaderExists = await User.exists({ _id: club.leader });
        if (!currentLeaderExists) {
          club.leader = null;
          await club.save();
        } else if (!replaceExisting) {
          return res.status(409).json({
            message: "Club already has a leader. Set replaceExisting to true.",
          });
        }
      }

      const otherLeaderClub = await Club.findOne({
        leader: student._id,
        _id: { $ne: club._id },
      }).select("_id name");
      if (otherLeaderClub) {
        return res.status(409).json({
          message: "This student is already a leader of another club",
          conflictClub: { id: otherLeaderClub._id, name: otherLeaderClub.name },
        });
      }

      const prevLeaderId = club.leader ? new mongoose.Types.ObjectId(club.leader) : null;

      club.leader = student._id;
      if (!club.members?.some?.((m) => String(m) === String(student._id))) {
        club.members = [...(club.members || []), student._id];
      }
      await club.save();

      await User.findByIdAndUpdate(student._id, {
        $set: { role: "club_leader", club: club._id },
        $addToSet: { clubs: club._id },
      });

      if (prevLeaderId) {
        await User.findByIdAndUpdate(prevLeaderId, {
          $set: { role: "student", club: null },
        });
      }

      const oldLeader =
        prevLeaderId && String(prevLeaderId) !== String(student._id)
          ? await User.findById(prevLeaderId).select("_id name email")
          : null;

      return res.json({
        message: `${student.name} is now the leader of ${club.name}`,
        club: { id: club._id, name: club.name, leaderId: student._id },
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          department: student.department || null,
          year: student.year || null,
        },
        replaced:
          !!oldLeader &&
          String(oldLeader._id) !== String(student._id),
        oldLeader: oldLeader
          ? { id: oldLeader._id, name: oldLeader.name, email: oldLeader.email }
          : null,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to assign leader" });
    }
  },
);

router.post(
  "/clubs/:id/remove-leader",
  requireAuth,
  requireModuleAdmin("club-and-society"),
  async (req, res) => {
    try {
      const { id } = req.params || {};
      const club = await Club.findById(id);
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }

      const prevLeaderId = club.leader ? club.leader : null;
      if (!prevLeaderId) {
        return res.json({ message: "No leader to remove" });
      }

      club.leader = null;
      await club.save();

      await User.findByIdAndUpdate(prevLeaderId, {
        $set: { role: "student", club: null },
      });

      return res.json({ message: "Leader removed", club: { id: club._id, name: club.name } });
    } catch (err) {
      return res.status(500).json({ message: "Failed to remove leader" });
    }
  },
);

module.exports = router;

