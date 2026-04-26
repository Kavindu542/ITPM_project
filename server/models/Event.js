const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  date: { type: Date, required: true },
  venue: { type: String },
  type: { type: String, enum: ['Members-only', 'Public'], default: 'Public' },
  posterUrl: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

EventSchema.index({ club: 1, isDeleted: 1, date: 1 });

module.exports = mongoose.model('Event', EventSchema);
