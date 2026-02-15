const mongoose = require('mongoose');

const ClubMemberSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  dateJoined: { type: Date, default: Date.now },
  attendanceCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('ClubMember', ClubMemberSchema);
