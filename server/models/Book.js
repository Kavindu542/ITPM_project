const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Strategy', 'Architecture', 'Science', 'Law', 'Business', 'Philosophy', 'Cybersecurity', 'Education', 'Technology', 'Marketing', 'Environment', 'Other'],
    default: 'Other'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  pages: {
    type: Number,
    required: [true, 'Page count is required'],
    min: [1, 'Pages must be at least 1']
  },
  publishedYear: {
    type: String,
    required: [true, 'Published year is required']
  },
  coverImage: {
    type: String,
    default: ''
  },
  pdfUrl: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  downloads: {
    type: Number,
    default: 0,
    min: [0, 'Downloads cannot be negative']
  },
  availability: {
    type: String,
    enum: ['Available', 'Issued', 'Maintenance'],
    default: 'Available'
  },
  physicalCopies: {
    type: Number,
    default: 1,
    min: [0, 'Physical copies cannot be negative']
  },
  digitalCopy: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better search performance
bookSchema.index({ title: 'text', author: 'text', category: 'text', tags: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ rating: -1 });
bookSchema.index({ downloads: -1 });
bookSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Book', bookSchema);