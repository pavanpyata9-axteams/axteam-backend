const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create a new review
// @route   POST /api/reviews/create
// @access  Private (User)
const createReview = async (req, res) => {
  try {
    const { bookingId, rating, feedback } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!bookingId || !rating || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID, rating, and feedback are required'
      });
    }

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId).populate('userId', 'name');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only review your own bookings'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed bookings'
      });
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Review already exists for this booking'
      });
    }

    // Get service details from booking
    const primaryService = booking.services[0];
    
    // Create review
    const review = new Review({
      bookingId,
      userId,
      customerName: booking.name,
      serviceCategory: primaryService.category,
      serviceName: primaryService.serviceName,
      rating,
      feedback: feedback.trim()
    });

    await review.save();

    // Update booking with review reference
    booking.rating = rating;
    booking.feedback = feedback;
    await booking.save();

    // Populate the review for response
    await review.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

// @desc    Get all reviews for homepage
// @route   GET /api/reviews/homepage
// @access  Public
const getHomepageReviews = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const reviews = await Review.find({
      isApproved: true,
      isDisplayedOnHomepage: true
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('userId', 'name')
    .select('customerName serviceCategory serviceName rating feedback adminReply createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });

  } catch (error) {
    console.error('Get homepage reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/all
// @access  Private (Admin)
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    
    let filter = {};
    if (status === 'approved') {
      filter.isApproved = true;
    } else if (status === 'pending') {
      filter.isApproved = false;
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * parseInt(page))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('userId', 'name email')
      .populate('bookingId', 'bookingId services')
      .populate('adminReply.repliedBy', 'name');

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: reviews
    });

  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// @desc    Reply to a review (Admin)
// @route   PATCH /api/reviews/reply/:id
// @access  Private (Admin)
const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;
    const adminId = req.user.id;

    if (!replyText || replyText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.adminReply = {
      text: replyText.trim(),
      repliedBy: adminId,
      repliedAt: new Date()
    };

    await review.save();

    // Populate for response
    await review.populate([
      { path: 'userId', select: 'name email' },
      { path: 'adminReply.repliedBy', select: 'name' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      data: review
    });

  } catch (error) {
    console.error('Reply to review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reply',
      error: error.message
    });
  }
};

// @desc    Update review approval status (Admin)
// @route   PATCH /api/reviews/approve/:id
// @access  Private (Admin)
const updateReviewApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, isDisplayedOnHomepage } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (typeof isApproved === 'boolean') {
      review.isApproved = isApproved;
    }

    if (typeof isDisplayedOnHomepage === 'boolean') {
      review.isDisplayedOnHomepage = isDisplayedOnHomepage;
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review status updated successfully',
      data: review
    });

  } catch (error) {
    console.error('Update review approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review status',
      error: error.message
    });
  }
};

// @desc    Delete a review (Admin)
// @route   DELETE /api/reviews/:id
// @access  Private (Admin)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

module.exports = {
  createReview,
  getHomepageReviews,
  getAllReviews,
  replyToReview,
  updateReviewApproval,
  deleteReview
};