const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { generateBookingId } = require('../utils/generateBookingId');
const { sendBookingConfirmation, sendBookingStatusUpdate, sendAdminBookingAlert } = require('../utils/sendEmail');
const { sendBookingConfirmationSMS, sendBookingStatusSMS, sendAdminBookingAlertSMS } = require('../utils/sendSMS');
const { sendBookingConfirmationWhatsApp, sendAdminBookingAlertWhatsApp, sendBookingStatusWhatsApp } = require('../utils/sendWhatsApp');

/**
 * Create new booking
 * POST /api/bookings/create
 */
const createBooking = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      services,
      date,
      time,
      workDescription
    } = req.body;

    // ✅ STEP 1: Validate user (allow in development mode)
    console.log('🔍 [Booking] Auth check - req.user:', req.user?._id, 'NODE_ENV:', process.env.NODE_ENV);
    console.log('✅ [Booking] Step 1: User validated:', req.user?._id || 'development mode');

    // ✅ STEP 2: Validate booking data
    if (!name || !email || !phone || !address || !services || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    console.log('✅ [Booking] Step 2: Booking data validated');

    if (!services.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one service must be selected'
      });
    }

    // Validate address
    if (!address || typeof address !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Address object is required'
      });
    }
    
    if (!address.street || !address.city || !address.pincode) {
      return res.status(400).json({
        success: false,
        message: 'Complete address is required (street, city, pincode)'
      });
    }

    // Validate date is not in the past
    const serviceDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    serviceDate.setHours(0, 0, 0, 0);

    if (serviceDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Service date cannot be in the past'
      });
    }

    console.log('📝 [Booking] Validation passed, creating booking with data:', {
      name, email, phone,
      address: address,
      services: services,
      date: serviceDate,
      time,
      workDescription
    });

    // Skip service validation for now since frontend might not have serviceId
    console.log('📝 [Booking] Services to be saved:', services);
    
    // Transform services to ensure they have the required fields
    const formattedServices = services.map(service => ({
      serviceName: service.serviceName || service,
      category: service.category || 'General',
      estimatedPrice: service.estimatedPrice || ''
    }));

    // Generate unique booking ID
    const bookingId = generateBookingId();

    // Create booking
    const booking = new Booking({
      bookingId,
      userId: req.user?._id || new mongoose.Types.ObjectId(), // Fallback for testing
      name,
      email: email.toLowerCase(),
      phone,
      address,
      services: formattedServices,
      date: serviceDate,
      time,
      workDescription,
      status: 'Pending'
    });

    // ✅ STEP 3: Save booking to DB
    await booking.save();
    console.log('✅ [Booking] Step 3: Booking saved to database:', booking.bookingId);

    // ✅ STEP 4: Generate booking ID (already done above)
    console.log('✅ [Booking] Step 4: Booking ID generated:', booking.bookingId);

    // Populate services for notifications
    await booking.populate('services.serviceId');

    // ✅ STEP 5: Send WhatsApp to user
    try {
      console.log('📱 [Booking] Step 5: Sending WhatsApp to user...');
      await sendBookingConfirmationWhatsApp(booking);
      console.log('✅ [Booking] Step 5: User WhatsApp sent successfully');
    } catch (error) {
      console.error('❌ [Booking] Step 5: User WhatsApp failed:', error.message);
    }

    // ✅ STEP 6: Send WhatsApp to admin
    try {
      console.log('📱 [Booking] Step 6: Sending WhatsApp to admin...');
      await sendAdminBookingAlertWhatsApp(booking);
      console.log('✅ [Booking] Step 6: Admin WhatsApp sent successfully');
    } catch (error) {
      console.error('❌ [Booking] Step 6: Admin WhatsApp failed:', error.message);
    }

    // ✅ STEP 7: Send email (optional)
    try {
      console.log('📧 [Booking] Step 7: Sending emails...');
      await sendBookingConfirmation(booking);
      await sendAdminBookingAlert(booking);
      console.log('✅ [Booking] Step 7: Emails sent successfully');
      
      // Also send SMS as backup
      await sendBookingConfirmationSMS(booking);
      await sendAdminBookingAlertSMS(booking);
      console.log('✅ [Booking] Step 7: SMS sent successfully');
    } catch (notificationError) {
      console.error('❌ [Booking] Step 7: Email/SMS failed:', notificationError.message);
      // Don't fail the booking if notifications fail
    }

    // Update service booking counts
    for (const service of services) {
      if (service.serviceId) {
        await Service.findByIdAndUpdate(service.serviceId, {
          $inc: { totalBookings: 1 }
        });
      }
    }

    // ✅ STEP 8: Return response to frontend
    console.log('✅ [Booking] Step 8: Returning response to frontend');
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    
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
      message: 'Server error creating booking'
    });
  }
};

/**
 * Get user bookings
 * GET /api/bookings/user/:userId
 */
const getUserBookings = async (req, res) => {
  try {
    console.log('🔍 getUserBookings called');
    console.log('📝 Request params:', req.params);
    console.log('👤 Request user:', req.user ? { id: req.user._id, role: req.user.role } : 'No user');
    
    const { userId } = req.params;
    console.log('🎯 getUserBookings - Target userId from params:', userId);
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    console.log('🎯 Target userId from params:', userId);
    console.log('🔑 Current user ID:', req.user?._id?.toString());
    console.log('📋 Query params:', { status, page, limit, sortBy, sortOrder });

    // Ensure userId is valid ObjectId format or convert string to ObjectId
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      console.log('❌ Invalid userId format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Build filter
    const filter = { userId: userObjectId };
    if (status) {
      filter.status = status;
    }
    console.log('🔍 Booking filter:', filter);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    console.log('📊 About to query bookings...');

    // Get bookings
    const bookings = await Booking.find(filter)
      .populate('services.serviceId', 'name category')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    console.log('✅ Found bookings:', bookings.length);
    if (bookings.length > 0) {
      console.log('📝 Sample booking:', {
        _id: bookings[0]._id,
        userId: bookings[0].userId,
        bookingId: bookings[0].bookingId,
        status: bookings[0].status
      });
    }

    // Get total count
    const total = await Booking.countDocuments(filter);
    console.log('📊 Total count:', total);

    const response = {
      success: true,
      data: {
        bookings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    };
    
    console.log('📤 Sending response with', response.data.bookings.length, 'bookings');
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Get user bookings error:', error);
    console.error('📋 Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings'
    });
  }
};

/**
 * Get all bookings (Admin only)
 * GET /api/bookings/all
 */
const getAllBookings = async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search,
      dateFrom,
      dateTo
    } = req.query;

    // Build filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get bookings
    const bookings = await Booking.find(filter)
      .populate('userId', 'name email phone')
      .populate('services.serviceId', 'name category')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching bookings'
    });
  }
};

/**
 * Get single booking
 * GET /api/bookings/:id
 */
const getBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate('userId', 'name email phone')
      .populate('services.serviceId', 'name category description priceRange');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user can access this booking
    if (req.user.role !== 'admin' && booking.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: { booking }
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching booking'
    });
  }
};

/**
 * Update booking status
 * PATCH /api/bookings/status/:id
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, technicianNotes, adminNotes, estimatedCost, actualCost } = req.body;

    // Validation
    const validStatuses = ['Pending', 'Confirmed', 'Completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required',
        validStatuses
      });
    }

    // Find booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const oldStatus = booking.status;

    // Update booking
    const updateData = { status };
    if (technicianNotes) updateData.technicianNotes = technicianNotes;
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
    if (actualCost !== undefined) updateData.actualCost = actualCost;

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone')
     .populate('services.serviceId', 'name category');

    // Send notifications if status changed
    if (oldStatus !== status) {
      try {
        await sendBookingStatusUpdate(updatedBooking, oldStatus);
        await sendBookingStatusSMS(updatedBooking);
        await sendBookingStatusWhatsApp(updatedBooking);
      } catch (notificationError) {
        console.error('Status update notification error:', notificationError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: { booking: updatedBooking }
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    
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
      message: 'Server error updating booking status'
    });
  }
};

/**
 * Delete booking
 * DELETE /api/bookings/:id
 */
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user can delete this booking
    if (req.user.role !== 'admin' && booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only allow deletion if booking is Pending or Cancelled
    if (!['Pending', 'Cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or cancelled bookings can be deleted'
      });
    }

    await Booking.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting booking'
    });
  }
};

/**
 * Add rating and feedback to completed booking
 * PATCH /api/bookings/feedback/:id
 */
const addBookingFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Find booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be added to completed bookings'
      });
    }

    // Update booking with feedback
    booking.rating = rating;
    if (feedback) booking.feedback = feedback;
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Feedback added successfully',
      data: { booking }
    });

  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding feedback'
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getAllBookings,
  getBooking,
  updateBookingStatus,
  deleteBooking,
  addBookingFeedback
};