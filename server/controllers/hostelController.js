const HostelApplication = require('../models/HostelApplication');
const HostelComplaint = require('../models/HostelComplaint');

// Student: submit application
async function applyForHostel(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    // Prevent duplicate pending/approved apps for same user
    const existing = await HostelApplication.findOne({ user: userId }).sort({ createdAt: -1 });
    if (existing && (existing.status === 'pending' || existing.status === 'approved')) {
      return res.status(400).json({ message: 'An application already exists' });
    }

    const {
      studentId,
      studentName,
      homeAddress,
      district,
      roomType = '',
      preferredFloor,
      additionalInfo = '',
    } = req.body || {};

    if (!studentId || !studentName || !homeAddress || !district || !preferredFloor) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const app = await HostelApplication.create({
      user: userId,
      studentId,
      studentName,
      homeAddress,
      district,
      roomType,
      preferredFloor,
      additionalInfo,
      status: 'pending',
    });

    return res.status(201).json({ id: app._id, status: app.status });
  } catch (err) {
    console.error('applyForHostel error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Student: get my application
async function getMyApplication(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const app = await HostelApplication.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!app) return res.status(200).json(null);
    return res.json({
      id: app._id,
      status: app.status,
      studentId: app.studentId,
      studentName: app.studentName,
      homeAddress: app.homeAddress,
      district: app.district,
      roomType: app.roomType,
      preferredFloor: app.preferredFloor,
      additionalInfo: app.additionalInfo,
      createdAt: app.createdAt,
    });
  } catch (err) {
    console.error('getMyApplication error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Admin (warden): list all applications
async function adminListApplications(req, res) {
  try {
    const apps = await HostelApplication.find({}).sort({ createdAt: -1 });
    return res.json(
      apps.map((a) => ({
        id: a._id,
        status: a.status,
        studentId: a.studentId,
        studentName: a.studentName,
        homeAddress: a.homeAddress,
        district: a.district,
        roomType: a.roomType,
        preferredFloor: a.preferredFloor,
        additionalInfo: a.additionalInfo,
        createdAt: a.createdAt,
      })),
    );
  } catch (err) {
    console.error('adminListApplications error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Admin (warden): update application status
async function adminUpdateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const app = await HostelApplication.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );
    if (!app) return res.status(404).json({ message: 'Not found' });
    return res.json({ id: app._id, status: app.status });
  } catch (err) {
    console.error('adminUpdateApplicationStatus error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Student: submit a complaint
async function submitComplaint(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const { subject, category, description, urgency } = req.body || {};
    if (!subject || !category || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const complaint = await HostelComplaint.create({
      user: userId,
      studentId: req.user.studentId,
      studentName: req.user.name,
      subject,
      category,
      description,
      urgency: urgency || 'medium',
      status: 'pending',
    });

    return res.status(201).json({ id: complaint._id, status: complaint.status });
  } catch (err) {
    console.error('submitComplaint error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Student: get my complaints
async function getMyComplaints(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const complaints = await HostelComplaint.find({ user: userId }).sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (err) {
    console.error('getMyComplaints error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Admin (warden): list all complaints
async function adminListComplaints(req, res) {
  try {
    const complaints = await HostelComplaint.find({}).sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (err) {
    console.error('adminListComplaints error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Admin (warden): update complaint status
async function adminUpdateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['pending', 'in-progress', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const complaint = await HostelComplaint.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Not found' });
    return res.json({ id: complaint._id, status: complaint.status });
  } catch (err) {
    console.error('adminUpdateComplaintStatus error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}


module.exports = {
  applyForHostel,
  getMyApplication,
  adminListApplications,
  adminUpdateApplicationStatus,
  submitComplaint,
  getMyComplaints,
  adminListComplaints,
  adminUpdateComplaintStatus,
};