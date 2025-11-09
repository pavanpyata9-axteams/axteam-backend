const Service = require('../models/Service');

/**
 * Add new service (Admin only)
 * POST /api/services/add
 */
const addService = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      priceRange,
      thumbnailURL,
      duration,
      features
    } = req.body;

    // Validation
    if (!name || !category || !description || !priceRange) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, category, description, priceRange)'
      });
    }

    // Validate price range
    if (!priceRange.min || !priceRange.max) {
      return res.status(400).json({
        success: false,
        message: 'Price range must include min and max values'
      });
    }

    if (priceRange.min < 0 || priceRange.max < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price values cannot be negative'
      });
    }

    if (priceRange.min > priceRange.max) {
      return res.status(400).json({
        success: false,
        message: 'Minimum price cannot be greater than maximum price'
      });
    }

    // Check if service with same name already exists
    const existingService = await Service.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Service with this name already exists'
      });
    }

    // Create service
    const service = new Service({
      name,
      category,
      description,
      priceRange: {
        min: priceRange.min,
        max: priceRange.max,
        currency: priceRange.currency || 'INR'
      },
      thumbnailURL,
      duration: duration || '2-4 hours',
      features: features || []
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service added successfully',
      data: { service }
    });

  } catch (error) {
    console.error('Add service error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error adding service'
    });
  }
};

/**
 * Get all services
 * GET /api/services/list
 */
const getServices = async (req, res) => {
  try {
    const {
      category,
      isActive,
      page = 1,
      limit = 50,
      sortBy = 'popularity',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get services
    const services = await Service.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Service.countDocuments(filter);

    // Get categories for filtering
    const categories = await Service.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      data: {
        services,
        categories,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching services'
    });
  }
};

/**
 * Get single service
 * GET /api/services/:id
 */
const getService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { service }
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching service'
    });
  }
};

/**
 * Update service (Admin only)
 * PATCH /api/services/update/:id
 */
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      description,
      priceRange,
      thumbnailURL,
      duration,
      features,
      isActive
    } = req.body;

    // Find service
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Build update object
    const updateData = {};
    
    if (name) {
      // Check if another service with same name exists
      const existingService = await Service.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingService) {
        return res.status(400).json({
          success: false,
          message: 'Service with this name already exists'
        });
      }
      
      updateData.name = name;
    }
    
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (thumbnailURL !== undefined) updateData.thumbnailURL = thumbnailURL;
    if (duration) updateData.duration = duration;
    if (features) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Validate and update price range
    if (priceRange) {
      if (priceRange.min !== undefined && priceRange.max !== undefined) {
        if (priceRange.min < 0 || priceRange.max < 0) {
          return res.status(400).json({
            success: false,
            message: 'Price values cannot be negative'
          });
        }

        if (priceRange.min > priceRange.max) {
          return res.status(400).json({
            success: false,
            message: 'Minimum price cannot be greater than maximum price'
          });
        }
      }

      updateData.priceRange = {
        ...service.priceRange,
        ...priceRange
      };
    }

    // Update service
    const updatedService = await Service.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: { service: updatedService }
    });

  } catch (error) {
    console.error('Update service error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating service'
    });
  }
};

/**
 * Delete service (Admin only)
 * DELETE /api/services/delete/:id
 */
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if service has active bookings
    const Booking = require('../models/Booking');
    const activeBookings = await Booking.countDocuments({
      'services.serviceId': id,
      status: { $in: ['Pending', 'Confirmed', 'InProgress'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete service with active bookings. Please complete or cancel existing bookings first.'
      });
    }

    await Service.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting service'
    });
  }
};

/**
 * Get popular services
 * GET /api/services/popular
 */
const getPopularServices = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const services = await Service.find({ isActive: true })
      .sort({ popularity: -1, averageRating: -1, totalBookings: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: { services }
    });

  } catch (error) {
    console.error('Get popular services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching popular services'
    });
  }
};

/**
 * Get services by category
 * GET /api/services/category/:category
 */
const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, sortBy = 'popularity', sortOrder = 'desc' } = req.query;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const services = await Service.find({ 
      category, 
      isActive: true 
    })
    .sort(sort)
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: { 
        services,
        category,
        count: services.length
      }
    });

  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching services by category'
    });
  }
};

/**
 * Search services
 * GET /api/services/search
 */
const searchServices = async (req, res) => {
  try {
    const { q: query, category, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Build filter
    const filter = {
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { 'features': { $regex: query, $options: 'i' } }
      ]
    };

    if (category) {
      filter.category = category;
    }

    const services = await Service.find(filter)
      .sort({ popularity: -1, averageRating: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        services,
        query,
        count: services.length
      }
    });

  } catch (error) {
    console.error('Search services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching services'
    });
  }
};

module.exports = {
  addService,
  getServices,
  getService,
  updateService,
  deleteService,
  getPopularServices,
  getServicesByCategory,
  searchServices
};