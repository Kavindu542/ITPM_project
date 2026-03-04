const mongoose = require('mongoose');

const libraryReservationSchema = new mongoose.Schema({
  userName: {
    type: String,
    default: ''
  },
  refName: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  studyRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyRoom',
    default: null
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    default: null
  },
  type: {
    type: String,
    enum: ['Book', 'Study Room', 'Seat'],
    required: [true, 'Reservation type is required']
  },
  seatNumber: {
    type: String,
    default: null
  },
  reservationDate: {
    type: Date,
    required: [true, 'Reservation date is required']
  },
  startTime: {
    type: String,
    default: null
  },
  endTime: {
    type: String,
    default: null
  },
  participants: {
    type: Number,
    default: 1,
    min: [1, 'At least 1 participant required']
  },
  purpose: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  specialRequests: {
    type: String,
    default: ''
  },
  contactNumber: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'In Progress', 'Rejected', 'Expired'],
    default: 'Pending'
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
libraryReservationSchema.index({ userId: 1 });
libraryReservationSchema.index({ studyRoomId: 1 });
libraryReservationSchema.index({ bookId: 1 });
libraryReservationSchema.index({ status: 1 });
libraryReservationSchema.index({ reservationDate: 1 });
libraryReservationSchema.index({ type: 1 });

module.exports = mongoose.model('LibraryReservation', libraryReservationSchema);