const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email'
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^[+]?[1-9][\d\s\-\(\)]{7,15}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      validate: {
        validator: function(v) {
          return /^[0-9]{6}$/.test(v.toString());
        },
        message: 'Please provide a valid 6-digit pincode'
      }
    }
  },
  location: {
    coordinates: {
      latitude: {
        type: Number,
        required: false
      },
      longitude: {
        type: Number,
        required: false
      }
    },
    address: {
      formatted: String,
      placeId: String
    },
    capturedAt: {
      type: Date,
      default: Date.now
    }
  },
  services: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    serviceName: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    estimatedPrice: {
      type: String
    }
  }],
  date: {
    type: Date,
    required: [true, 'Service date is required'],
    validate: {
      validator: function(v) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to beginning of day
        const bookingDate = new Date(v);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate >= today;
      },
      message: 'Service date cannot be in the past'
    }
  },
  time: {
    type: String,
    required: [true, 'Service time is required'],
    validate: {
      validator: function(v) {
        // Accept both HH:MM format and time slot formats like "10:00 AM - 1:00 PM"
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v) || 
               /^.*(AM|PM).*/.test(v) ||
               /^(Morning|Afternoon|Evening|Night)/.test(v);
      },
      message: 'Please provide a valid time format'
    }
  },
  workDescription: {
    type: String,
    maxlength: [1000, 'Work description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'InProgress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  estimatedCost: {
    type: Number,
    min: [0, 'Estimated cost cannot be negative']
  },
  actualCost: {
    type: Number,
    min: [0, 'Actual cost cannot be negative']
  },
  technicianNotes: {
    type: String,
    maxlength: [500, 'Technician notes cannot exceed 500 characters']
  },
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  completedAt: {
    type: Date
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot exceed 500 characters']
  },
  technician: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^[+]?[1-9][\d\s\-\(\)]{7,15}$/.test(v);
        },
        message: 'Please provide a valid technician phone number'
      }
    },
    email: {
      type: String,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid technician email'
      }
    },
    assignedAt: {
      type: Date
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  notifications: {
    adminNotified: {
      type: Boolean,
      default: false
    },
    customerNotified: {
      type: Boolean,
      default: false
    },
    technicianNotified: {
      type: Boolean,
      default: false
    },
    lastNotificationSent: {
      type: Date
    }
  },
  adminReply: {
    type: String,
    maxlength: [1000, 'Admin reply cannot exceed 1000 characters']
  },
  adminReplyDate: {
    type: Date
  },
  hasTechnician: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance (bookingId already has unique index from schema)
bookingSchema.index({ userId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ date: 1 });
bookingSchema.index({ createdAt: -1 });

// Pre-save middleware to update completedAt when status changes to Completed
bookingSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);