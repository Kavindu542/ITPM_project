const bcrypt = require('bcryptjs');
const HostelApplication = require('../models/HostelApplication');
const HostelComplaint = require('../models/HostelComplaint');
const User = require('../models/User');
const LaundryShop = require('../models/LaundryShop');
const LaundryBooking = require('../models/LaundryBooking');

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

// Admin (warden): create meals shop login credentials
async function adminCreateMealShopAccount(req, res) {
  try {
    const { email, password, name, contactNumber, description } = req.body || {};

    const normalizedEmail = String(email || '').toLowerCase().trim();
    const normalizedName = String(name || '').trim();

    if (!normalizedEmail || !password || !normalizedName) {
      return res.status(400).json({ message: 'email, password and name are required' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      isEmailVerified: true,
      role: 'admin',
      // Keep optional metadata for future feature use.
      department: contactNumber ? String(contactNumber).trim() : null,
      year: description ? String(description).trim() : null,
    });

    return res.status(201).json({
      message: 'Meal shop account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('adminCreateMealShopAccount error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Admin (warden): create laundry shop login credentials
async function adminCreateLaundryShopAccount(req, res) {
  try {
    const { email, password, name, contactNumber, description } = req.body || {};

    const normalizedEmail = String(email || '').toLowerCase().trim();
    const normalizedName = String(name || '').trim();

    if (!normalizedEmail || !password || !normalizedName) {
      return res.status(400).json({ message: 'email, password and name are required' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      isEmailVerified: true,
      role: 'admin',
      department: contactNumber ? String(contactNumber).trim() : null,
      year: description ? String(description).trim() : null,
    });

    await LaundryShop.findOneAndUpdate(
      { adminUser: user._id },
      {
        adminUser: user._id,
        name: normalizedName,
        contactNumber: contactNumber ? String(contactNumber).trim() : '',
        shortDescription: description ? String(description).trim() : '',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      message: 'Laundry shop account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('adminCreateLaundryShopAccount error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Laundry admin: get current laundry shop profile
async function adminGetLaundryShopProfile(req, res) {
  try {
    const adminUser = req.user?._id;
    if (!adminUser) return res.status(401).json({ message: 'Not authenticated' });

    const profile = await LaundryShop.findOne({ adminUser });
    if (!profile) return res.json(null);

    return res.json(profile);
  } catch (err) {
    console.error('adminGetLaundryShopProfile error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Laundry admin: create or update laundry shop profile details
async function adminUpsertLaundryShopProfile(req, res) {
  try {
    const adminUser = req.user?._id;
    if (!adminUser) return res.status(401).json({ message: 'Not authenticated' });

    const {
      logoUrl,
      name,
      location,
      contactNumber,
      availableServices,
      priceInformation,
      openingHours,
      pickupDeliveryAvailable,
      shortDescription,
      isActive,
    } = req.body || {};

    const normalizedName = String(name || '').trim();
    const normalizedContact = String(contactNumber || '').trim();

    if (!normalizedName || !normalizedContact) {
      return res.status(400).json({ message: 'Laundry shop name and contact number are required' });
    }

    const allowedServices = ['washing', 'dry-cleaning', 'ironing'];
    const selectedServices = Array.isArray(availableServices)
      ? availableServices.filter((s) => allowedServices.includes(String(s)))
      : [];

    const profile = await LaundryShop.findOneAndUpdate(
      { adminUser },
      {
        adminUser,
        logoUrl: String(logoUrl || '').trim(),
        name: normalizedName,
        location: String(location || '').trim(),
        contactNumber: normalizedContact,
        availableServices: selectedServices,
        priceInformation: String(priceInformation || '').trim(),
        openingHours: String(openingHours || '').trim(),
        pickupDeliveryAvailable: Boolean(pickupDeliveryAvailable),
        shortDescription: String(shortDescription || '').trim(),
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({
      message: 'Laundry shop profile saved successfully',
      profile,
    });
  } catch (err) {
    console.error('adminUpsertLaundryShopProfile error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Student: list all active laundry shops
async function listLaundryShops(_req, res) {
  try {
    const shops = await LaundryShop.find({ isActive: true }).sort({ updatedAt: -1 });
    return res.json(shops);
  } catch (err) {
    console.error('listLaundryShops error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Student: create a laundry booking
async function createLaundryBooking(req, res) {
  try {
    const studentUser = req.user?._id;
    if (!studentUser) return res.status(401).json({ message: 'Not authenticated' });

    const { shopId, studentName = '', contactNumber, floor = '', roomNumber = '', serviceType, notes = '' } = req.body || {};

    if (!shopId || !contactNumber || !serviceType) {
      return res.status(400).json({ message: 'shopId, contactNumber and serviceType are required' });
    }

    if (!['washing', 'dry-cleaning', 'ironing'].includes(String(serviceType))) {
      return res.status(400).json({ message: 'Invalid serviceType' });
    }

    const shop = await LaundryShop.findById(shopId);
    if (!shop || !shop.isActive) {
      return res.status(404).json({ message: 'Laundry shop not found' });
    }

    const booking = await LaundryBooking.create({
      shop: shop._id,
      studentUser,
      studentId: req.user?.studentId || '',
      studentName: String(studentName || req.user?.name || '').trim(),
      contactNumber: String(contactNumber).trim(),
      floor: String(floor || '').trim(),
      roomNumber: String(roomNumber || '').trim(),
      serviceType: String(serviceType),
      notes: String(notes || '').trim(),
    });

    return res.status(201).json({
      message: 'Laundry booking created successfully',
      booking,
    });
  } catch (err) {
    console.error('createLaundryBooking error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Student: get own laundry bookings
async function getMyLaundryBookings(req, res) {
  try {
    const studentUser = req.user?._id;
    if (!studentUser) return res.status(401).json({ message: 'Not authenticated' });

    const bookings = await LaundryBooking.find({ studentUser })
      .populate('shop', 'name location contactNumber logoUrl')
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (err) {
    console.error('getMyLaundryBookings error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Laundry admin: view student laundry bookings for own shop
async function adminGetLaundryBookings(req, res) {
  try {
    const adminUser = req.user?._id;
    if (!adminUser) return res.status(401).json({ message: 'Not authenticated' });

    const shop = await LaundryShop.findOne({ adminUser });
    const filter = shop ? { shop: shop._id } : {};

    const bookings = await LaundryBooking.find(filter)
      .sort({ createdAt: -1 })
      .populate('shop', 'name')
      .select('studentName contactNumber floor roomNumber serviceType status createdAt notes shop');

    return res.json(bookings);
  } catch (err) {
    console.error('adminGetLaundryBookings error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Laundry admin: update laundry booking status (pending approval action)
async function adminUpdateLaundryBookingStatus(req, res) {
  try {
    const adminUser = req.user?._id;
    if (!adminUser) return res.status(401).json({ message: 'Not authenticated' });

    const { id } = req.params;
    const { status } = req.body || {};
    const allowedStatuses = ['pending', 'accepted', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(String(status))) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const shop = await LaundryShop.findOne({ adminUser });
    const filter = shop ? { _id: id, shop: shop._id } : { _id: id };

    const booking = await LaundryBooking.findOneAndUpdate(filter, { $set: { status: String(status) } }, { new: true });

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    return res.json({ message: 'Booking status updated', booking });
  } catch (err) {
    console.error('adminUpdateLaundryBookingStatus error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Laundry admin: delete a booking row
async function adminDeleteLaundryBooking(req, res) {
  try {
    const adminUser = req.user?._id;
    if (!adminUser) return res.status(401).json({ message: 'Not authenticated' });

    const { id } = req.params;
    const shop = await LaundryShop.findOne({ adminUser });
    const filter = shop ? { _id: id, shop: shop._id } : { _id: id };

    const deleted = await LaundryBooking.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ message: 'Booking not found' });

    return res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error('adminDeleteLaundryBooking error', err);
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
  adminCreateMealShopAccount,
  adminCreateLaundryShopAccount,
  adminGetLaundryShopProfile,
  adminUpsertLaundryShopProfile,
  listLaundryShops,
  createLaundryBooking,
  getMyLaundryBookings,
  adminGetLaundryBookings,
  adminUpdateLaundryBookingStatus,
  adminDeleteLaundryBooking,
};