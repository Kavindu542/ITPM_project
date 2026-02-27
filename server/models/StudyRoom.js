const mongoose = require('mongoose');

const studyRoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true, // keep this
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [100, 'Room name cannot exceed 100 characters']
  },
  capacity: {
    type: Number,
    required: [true, 'Room capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [50, 'Capacity cannot exceed 50']
  },
  floor: {
    type: Number,
    required: [true, 'Floor number is required'],
    min: [0, 'Floor cannot be negative']
  },
  building: {
    type: String,
    required: [true, 'Building name is required'],
    trim: true
  },
  facilities: [{
    type: String,
    enum: ['WiFi', 'Wifi', 'Projector', 'Whiteboard', 'Computer', 'Air Conditioning', 'AC', 'Power Outlets', 'Printer Access', 'Video Conference', 'Coffee', 'Soundproof', 'Lockable', 'Monitor'],
    trim: true
  }],
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  images: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  accessibility: {
    wheelchairAccessible: {
      type: Boolean,
      default: false
    },
    hearingLoop: {
      type: Boolean,
      default: false
    },
    adjustableDesk: {
      type: Boolean,
      default: false
    }
  },
  operatingHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  bookingRules: {
    maxDuration: {
      type: Number,
      default: 4, // hours
      min: [1, 'Max duration must be at least 1 hour'],
      max: [8, 'Max duration cannot exceed 8 hours']
    },
    advanceBookingDays: {
      type: Number,
      default: 7,
      min: [1, 'Must allow at least 1 day advance booking'],
      max: [30, 'Cannot exceed 30 days advance booking']
    },
    minBookingDuration: {
      type: Number,
      default: 1, // hours
      min: [0.5, 'Minimum booking must be at least 30 minutes']
    }
  }
}, {
  timestamps: true
});

// Indexes
studyRoomSchema.index({ capacity: 1 });
studyRoomSchema.index({ floor: 1, building: 1 });
studyRoomSchema.index({ isActive: 1 });
studyRoomSchema.index({ facilities: 1 });

module.exports = mongoose.model('StudyRoom', studyRoomSchema);