const mongoose = require('mongoose');

const digitalResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Resource type is required'],
    enum: ['eBook', 'Video', 'Audio', 'Document', 'Research Paper', 'Article', 'PDF', 'E-Book', 'Image', 'Other'],
    default: 'Document'
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
  url: {
    type: String,
    default: ''
  },
  thumbnailImage: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: ''
  },
  duration: {
    type: String, // For video/audio resources
    default: null
  },
  format: {
    type: String,
    enum: ['PDF', 'MP4', 'MP3', 'EPUB', 'DOC', 'DOCX', 'PPT', 'PPTX', 'TXT'],
    default: 'PDF'
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
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  publishedYear: {
    type: String,
    default: new Date().getFullYear().toString()
  }
}, {
  timestamps: true
});

// Indexes for better search performance
digitalResourceSchema.index({ title: 'text', author: 'text', category: 'text', tags: 'text' });
digitalResourceSchema.index({ category: 1 });
digitalResourceSchema.index({ type: 1 });
digitalResourceSchema.index({ rating: -1 });
digitalResourceSchema.index({ downloads: -1 });
digitalResourceSchema.index({ views: -1 });
digitalResourceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DigitalResource', digitalResourceSchema);