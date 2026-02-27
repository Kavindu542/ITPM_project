const LibraryReservation = require('../models/LibraryReservation');

// GET all reservations (Admin)
const getAllReservations = async (req, res) => {
  try {
    const { search, status, type, page = 1, limit = 20 } = req.query;

    let filter = {};

    if (search) {
      filter.$or = [
        { purpose:  { $regex: search, $options: 'i' } },
        { notes:    { $regex: search, $options: 'i' } },
      ];
    }
    if (status && status !== 'All') filter.status = status;
    if (type   && type   !== 'All') filter.type   = type;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await LibraryReservation.countDocuments(filter);

    const reservations = await LibraryReservation.find(filter)
      .populate('userId',      'firstName lastName studentId email')
      .populate('studyRoomId', 'roomNumber name building floor')
      .populate('bookId',      'title author coverImage')
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
const getReservationById = async (req, res) => {
  try {
    const reservation = await LibraryReservation.findById(req.params.id)
      .populate('userId',      'firstName lastName studentId email')
      .populate('studyRoomId', 'roomNumber name building floor')
      .populate('bookId',      'title author coverImage')
      .lean();

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    res.status(200).json({ success: true, data: reservation });

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

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
};