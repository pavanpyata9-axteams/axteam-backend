const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    minlength: [3, 'Service name must be at least 3 characters'],
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: [
      'AC Services',
      'Appliance Services', 
      'Electrical Services',
      'Plumbing Services',
      'Home Maintenance',
      'Interior Services',
      'Painting Services',
      'CCTV Services',
      'Cleaning Services',
      'General Repairs'
    ]
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  priceRange: {
    min: {
      type: Number,
      required: [true, 'Minimum price is required'],
      min: [0, 'Price cannot be negative']
    },
    max: {
      type: Number,
      required: [true, 'Maximum price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function(v) {
          return v >= this.priceRange.min;
        },
        message: 'Maximum price must be greater than or equal to minimum price'
      }
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  thumbnailURL: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty thumbnails
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  duration: {
    type: String,
    default: '2-4 hours'
  },
  features: [{
    type: String,
    maxlength: [100, 'Feature description cannot exceed 100 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  popularity: {
    type: Number,
    default: 0,
    min: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalBookings: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ popularity: -1 });
serviceSchema.index({ averageRating: -1 });
serviceSchema.index({ name: 'text', description: 'text' });

// Virtual for formatted price range
serviceSchema.virtual('formattedPriceRange').get(function() {
  const min = this.priceRange?.min || 0;
  const max = this.priceRange?.max || 0;
  const currency = this.priceRange?.currency || 'INR';
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
  return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
});

// Ensure virtual fields are serialized
serviceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Service', serviceSchema);