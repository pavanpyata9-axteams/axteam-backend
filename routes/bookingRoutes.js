const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getAllBookings,
  getBooking,
  updateBookingStatus,
  deleteBooking,
  addBookingFeedback
} = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware, adminOrSelfMiddleware } = require('../middleware/adminMiddleware');

/**
 * @route   POST /api/bookings/create
 * @desc    Create new booking
 * @access  Private (User)
 */
router.post('/create', authMiddleware, createBooking);

// Remove test route - we'll use the main one now

/**
 * @route   GET /api/bookings/user/:userId
 * @desc    Get user bookings
 * @access  Private (User/Admin)
 */
router.get('/user/:userId', authMiddleware, adminOrSelfMiddleware, getUserBookings);

/**
 * @route   GET /api/bookings/all
 * @desc    Get all bookings (Admin only)
 * @access  Private (Admin)
 */
router.get('/all', authMiddleware, adminMiddleware, getAllBookings);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get single booking
 * @access  Private (User/Admin)
 */
router.get('/:id', authMiddleware, getBooking);

/**
 * @route   PATCH /api/bookings/status/:id
 * @desc    Update booking status
 * @access  Private (Admin)
 */
router.patch('/status/:id', authMiddleware, adminMiddleware, updateBookingStatus);

/**
 * @route   PATCH /api/bookings/feedback/:id
 * @desc    Add rating and feedback to completed booking
 * @access  Private (User)
 */
router.patch('/feedback/:id', authMiddleware, addBookingFeedback);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Delete booking
 * @access  Private (User/Admin)
 */
router.delete('/:id', authMiddleware, deleteBooking);

module.exports = router;