const mongoose = require('mongoose');

const HostelApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    homeAddress: { type: String, required: true },
    district: { type: String, required: true },
    roomType: { type: String, default: '' },
    preferredFloor: { type: String, required: true },
    additionalInfo: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('HostelApplication', HostelApplicationSchema);