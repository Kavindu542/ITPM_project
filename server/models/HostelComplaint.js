const mongoose = require('mongoose');

const HostelComplaintSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        studentId: { type: String },
        studentName: { type: String },
        subject: { type: String, required: true },
        category: { type: String, required: true },
        description: { type: String, required: true },
        urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        status: { type: String, enum: ['pending', 'in-progress', 'resolved', 'rejected'], default: 'pending', index: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('HostelComplaint', HostelComplaintSchema);
