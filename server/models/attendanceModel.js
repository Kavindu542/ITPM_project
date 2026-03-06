const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      index: true,
      default: null,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ meeting: 1, studentId: 1 }, { unique: true });

AttendanceSchema.pre('validate', function (next) {
  if (this.studentId) {
    this.studentId = String(this.studentId).trim().toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
