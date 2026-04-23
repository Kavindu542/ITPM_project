const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  rules: { type: String },
  logoUrl: { type: String },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  monthlyReportEmailEnabled: { type: Boolean, default: false },
  monthlyReportLastSentMonth: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Club', ClubSchema);
