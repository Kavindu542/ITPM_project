const LibraryReservation = require('../models/LibraryReservation');

// GET all reservations (Admin)
const getAllReservations = async (req, res) => {
  try {
    const { search, status, type, page = 1, limit = 20 } = req.query;

    let filter = {};

    if (search) {
      filter.$or = [
        { purpose: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }
    if (status && status !== 'All') filter.status = status;
    if (type && type !== 'All') filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await LibraryReservation.countDocuments(filter);

    const reservations = await LibraryReservation.find(filter)
      .populate('userId', 'name firstName lastName studentId email')
      .populate('studyRoomId', 'roomNumber name building floor')
      .populate('bookId', 'title author coverImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      data: {
        reservations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total,
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET single reservation
// GET single reservation
const getReservationById = async (req, res) => {
  try {
    const reservation = await LibraryReservation.findById(req.params.id)
      .populate('userId', 'name firstName lastName studentId email')
      .populate('studyRoomId', 'roomNumber name building floor')
      .populate('bookId', 'title author coverImage')
      .lean();

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    res.status(200).json({ success: true, data: reservation });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET my reservations
const getMyReservations = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    let filter = { userId: req.user.id };
    if (type && type !== 'All') filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await LibraryReservation.countDocuments(filter);

    const reservations = await LibraryReservation.find(filter)
      .populate('studyRoomId', 'roomNumber name building floor')
      .populate('bookId', 'title author coverImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      data: {
        reservations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total,
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET Seat Availability
const getSeatAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    // Get all seat reservations for the given date that are not cancelled or rejected
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const reservations = await LibraryReservation.find({
      type: 'Seat',
      reservationDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled', 'Rejected'] }
    }).lean();

    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE reservation
const createReservation = async (req, res) => {
  try {
    const reservation = await LibraryReservation.create({
      ...req.body,
      userId: req.user.id,
      userName: req.body.userName || '', // Save the name provided in the input field
      status: req.body.status || 'Confirmed'
    });

    res.status(201).json({ success: true, data: reservation });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE reservation
const updateReservation = async (req, res) => {
  try {
    const reservation = await LibraryReservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    res.status(200).json({ success: true, data: reservation });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE status only
const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const reservation = await LibraryReservation.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(status === 'Cancelled' && {
          cancelledAt: Date.now(),
          cancellationReason: req.body.reason || 'Admin cancelled'
        })
      },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    res.status(200).json({ success: true, data: reservation });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE reservation
const deleteReservation = async (req, res) => {
  try {
    const reservation = await LibraryReservation.findByIdAndDelete(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    res.status(200).json({ success: true, message: 'Reservation deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE MY reservation
const updateMyReservation = async (req, res) => {
  try {
    const reservation = await LibraryReservation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found or unauthorized' });
    }

    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE MY reservation
const deleteMyReservation = async (req, res) => {
  try {
    const reservation = await LibraryReservation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Reservation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllReservations,
  getReservationById,
  getMyReservations,
  getSeatAvailability,
  createReservation,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
  updateMyReservation,
  deleteMyReservation,
};