const mongoose = require('mongoose');

const LaundryBookingSchema = new mongoose.Schema(
  {
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'LaundryShop', required: true, index: true },
    studentUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId: { type: String, default: '' },
    studentName: { type: String, default: '' },
    contactNumber: { type: String, required: true, trim: true },
    floor: { type: String, default: '', trim: true },
    roomNumber: { type: String, default: '', trim: true },
    serviceType: {
      type: String,
      enum: ['washing', 'dry-cleaning', 'ironing'],
      required: true,
    },
    ready: {
      type: Boolean,
      default: false,
      index: true,
    },
    notes: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('LaundryBooking', LaundryBookingSchema);
