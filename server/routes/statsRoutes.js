const express = require('express');
const router = express.Router();

const User = require('../models/User');
const HostelApplication = require('../models/HostelApplication');
const StudyMaterial = require('../models/StudyMaterial');
const Book = require('../models/Book');
const Club = require('../models/Club');

// GET /api/stats  — public, no auth required
router.get('/', async (req, res) => {
  const [
    totalStudents,
    hostelStudents,
    studyMaterials,
    libraryBooks,
    clubs,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    HostelApplication.countDocuments({ status: 'approved' }),
    StudyMaterial.countDocuments({ status: 'published' }).catch(() =>
      StudyMaterial.countDocuments({})
    ),
    Book.countDocuments({}),
    Club.countDocuments({}),
  ]);

  res.json({
    totalStudents,
    hostelStudents,
    studyMaterials,
    libraryBooks,
    clubs,
  });
});

module.exports = router;
