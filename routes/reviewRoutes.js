const express = require('express');
const router = express.Router();
const {
  createReview,
  getHomepageReviews,
  getAllReviews,
  replyToReview,
  updateReviewApproval,
  deleteReview
} = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

/**
 * @route   POST /api/reviews/create
 * @desc    Create new review
 * @access  Private (User)
 */
router.post('/create', authMiddleware, createReview);

/**
 * @route   GET /api/reviews/homepage
 * @desc    Get reviews for homepage display
 * @access  Public
 */
router.get('/homepage', getHomepageReviews);

/**
 * @route   GET /api/reviews/all
 * @desc    Get all reviews (Admin only)
 * @access  Private (Admin)
 */
router.get('/all', authMiddleware, adminMiddleware, getAllReviews);

/**
 * @route   PATCH /api/reviews/reply/:id
 * @desc    Reply to a review
 * @access  Private (Admin)
 */
router.patch('/reply/:id', authMiddleware, adminMiddleware, replyToReview);

/**
 * @route   PATCH /api/reviews/approve/:id
 * @desc    Update review approval status
 * @access  Private (Admin)
 */
router.patch('/approve/:id', authMiddleware, adminMiddleware, updateReviewApproval);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review
 * @access  Private (Admin)
 */
router.delete('/:id', authMiddleware, adminMiddleware, deleteReview);

module.exports = router;