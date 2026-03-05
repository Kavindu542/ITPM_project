const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  date: { type: Date, required: true },
  venue: { type: String, default: '' },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-delete meetings after the scheduled date/time.
// Note: MongoDB TTL cleanup runs periodically (not instantly).
MeetingSchema.index({ date: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Meeting', MeetingSchema);

