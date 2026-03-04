const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/authMiddleware");
const Club = require("../models/Club");
const User = require("../models/User");
const ClubMembershipApplication = require("../models/ClubMembershipApplication");

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));

// List active clubs for authenticated users
router.get("/", requireAuth, async (req, res) => {
  try {
    const [clubs, myApps] = await Promise.all([
      Club.find({ status: "Active" })
        .populate("leader", "_id name email")
        .select("name description rules logoUrl leader members status createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      ClubMembershipApplication.find({ applicant: req.user._id })
        .select("club")
        .lean(),
    ]);

    const appliedClubIds = new Set((myApps || []).map((a) => String(a.club)));

    const items = (clubs || []).map((c) => {
      const alreadyMember = Array.isArray(c.members)
        ? c.members.some((m) => String(m) === String(req.user._id))
        : false;

      return {
        id: c._id,
        name: c.name,
        description: c.description || "",
        rules: c.rules || "",
        logoUrl: c.logoUrl || "",
        leader: c.leader
          ? { id: c.leader._id, name: c.leader.name, email: c.leader.email }
          : null,
        status: c.status || "Active",
        alreadyMember,
        alreadyApplied: appliedClubIds.has(String(c._id)),
      };
    });

    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch clubs" });
  }
});

// Submit a membership application for a club
router.post("/:clubId/apply", requireAuth, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId || !isValidId(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const fullUser = await User.findById(userId)
      .select("_id role name email studentId")
      .lean();
    if (!fullUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const role = String(fullUser.role || "").trim();
    if (!["student", "club_leader"].includes(role)) {
      return res.status(403).json({ message: "Only students and club leaders can apply" });
    }

    const { clubId } = req.params || {};
    if (!clubId || !isValidId(clubId)) {
      return res.status(400).json({ message: "Valid clubId is required" });
    }

    const club = await Club.findById(clubId)
      .select("_id status members leader")
      .lean();

    if (!club || club.status !== "Active") {
      return res.status(404).json({ message: "Club not found" });
    }

    if (club.leader && String(club.leader) === String(fullUser._id)) {
      return res.status(409).json({ message: "You are already the leader of this club" });
    }

    const isMember = Array.isArray(club.members)
      ? club.members.some((m) => String(m) === String(fullUser._id))
      : false;

    if (isMember) {
      return res.status(409).json({ message: "You are already a member" });
    }

    const body = req.body || {};

    const languagesIn = Array.isArray(body.languages)
      ? body.languages
      : String(body.languages || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((name) => ({ name, proficiency: "" }));

    const languages = (languagesIn || [])
      .map((l) => {
        if (!l) return null;
        if (typeof l === "string") return { name: String(l).trim(), proficiency: "" };
        return {
          name: String(l.name || "").trim(),
          proficiency: String(l.proficiency || "").trim(),
        };
      })
      .filter((l) => l && l.name);

    const payload = {
      club: club._id,
      applicant: fullUser._id,
      school: {
        university: String(body?.school?.university || body.university || "").trim(),
        faculty: String(body?.school?.faculty || body.faculty || "").trim(),
        department: String(body?.school?.department || body.department || "").trim(),
        studentId: String(body?.school?.studentId || body.studentId || fullUser.studentId || "").trim(),
        semester: String(body?.school?.semester || body.semester || "").trim(),
        year: String(body?.school?.year || body.year || "").trim(),
      },
      personal: {
        fullName: String(body?.personal?.fullName || body.fullName || fullUser.name || "").trim(),
        dob: body?.personal?.dob || body.dob ? new Date(body?.personal?.dob || body.dob) : null,
        phone: String(body?.personal?.phone || body.phone || "").trim(),
        address: String(body?.personal?.address || body.address || "").trim(),
      },
      contact: {
        email: String(body?.contact?.email || body.email || fullUser.email || "").trim(),
        alternateEmail: String(body?.contact?.alternateEmail || body.alternateEmail || "").trim(),
      },
      languages,
      educationQualifications: String(body.educationQualifications || "").trim(),
      sportsQualifications: String(body.sportsQualifications || "").trim(),
      notes: String(body.notes || "").trim(),
    };

    if (payload.personal.dob && !Number.isFinite(payload.personal.dob.getTime())) {
      payload.personal.dob = null;
    }

    if (!payload.personal.fullName) {
      return res.status(400).json({ message: "Full name is required" });
    }
    if (!payload.contact.email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const created = await ClubMembershipApplication.create(payload);

    return res.status(201).json({
      message: "Application submitted",
      application: { id: created._id, createdAt: created.createdAt },
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "You already applied to this club" });
    }
    return res.status(500).json({ message: "Failed to submit application" });
  }
});

module.exports = router;
