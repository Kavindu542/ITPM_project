const mongoose = require('mongoose');

const userLibrarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book ID is required']
  },
  status: {
    type: String,
    enum: ['Reading', 'Completed', 'Wishlist', 'Favorite', 'Downloaded'],
    required: [true, 'Status is required']
  },
  progress: {
    type: Number,
    default: 0,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100%']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  },
  rating: {
    type: Number,
    default: null,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  review: {
    type: String,
    maxlength: [1000, 'Review cannot exceed 1000 characters'],
    default: ''
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure user can't have duplicate entries for same book
userLibrarySchema.index({ userId: 1, bookId: 1 }, { unique: true });
userLibrarySchema.index({ userId: 1, status: 1 });
userLibrarySchema.index({ userId: 1, lastAccessedAt: -1 });

module.exports = mongoose.model('UserLibrary', userLibrarySchema);