const StudyRoom = require('../models/StudyRoom');

exports.getAllStudyRooms = async (req, res) => {
  try {
    const { search = '', building, isActive } = req.query;
    const q = {};

    if (search) {
      q.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (building && building !== 'All') q.building = building;
    if (typeof isActive !== 'undefined') q.isActive = isActive === 'true';

    const rooms = await StudyRoom.find(q).sort({ createdAt: -1 });
    res.json({ success: true, data: rooms });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createStudyRoom = async (req, res) => {
  try {
    const room = await StudyRoom.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateStudyRoom = async (req, res) => {
  try {
    const room = await StudyRoom.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!room) return res.status(404).json({ success: false, message: 'Study room not found' });
    res.json({ success: true, data: room });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteStudyRoom = async (req, res) => {
  try {
    const room = await StudyRoom.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Study room not found' });
    res.json({ success: true, message: 'Study room deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};