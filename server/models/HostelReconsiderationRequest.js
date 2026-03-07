const mongoose = require('mongoose');

const HostelReconsiderationRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'HostelApplication', required: true, index: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    district: { type: String, required: true },
    reason: { type: String, required: true },
    preferredContact: { type: String, default: '' },
    additionalNotes: { type: String, default: '' },
    adminMessage: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('HostelReconsiderationRequest', HostelReconsiderationRequestSchema);
