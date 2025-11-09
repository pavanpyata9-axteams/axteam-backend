const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  serviceCategory: {
    type: String,
    required: [true, 'Service category is required']
  },
  serviceName: {
    type: String,
    required: [true, 'Service name is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  feedback: {
    type: String,
    required: [true, 'Feedback is required'],
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  isApproved: {
    type: Boolean,
    default: true // Auto-approve for now, can be changed later
  },
  isDisplayedOnHomepage: {
    type: Boolean,
    default: true
  },
  adminReply: {
    text: {
      type: String,
      maxlength: [500, 'Admin reply cannot exceed 500 characters']
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    repliedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reviewSchema.index({ userId: 1 });
reviewSchema.index({ bookingId: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ isApproved: 1, isDisplayedOnHomepage: 1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);