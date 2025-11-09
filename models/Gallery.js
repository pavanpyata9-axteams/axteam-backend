const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Image title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Washing Machine', 'Refrigerator', 'Geyser', 'Water Purifier', 
      'Microven', 'AC', 'Interior', 'Electrical Service', 
      'Home Maintenance & Services', 'Wall Painting', 'CCTV', 
      'AC Advanced Piping'
    ]
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['Appliance Services', 'Home Repair & Service']
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
gallerySchema.index({ category: 1 });
gallerySchema.index({ section: 1 });
gallerySchema.index({ isActive: 1 });
gallerySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Gallery', gallerySchema);