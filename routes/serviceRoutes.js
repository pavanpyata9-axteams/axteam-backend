const express = require('express');
const router = express.Router();
const {
  addService,
  getServices,
  getService,
  updateService,
  deleteService,
  getPopularServices,
  getServicesByCategory,
  searchServices
} = require('../controllers/serviceController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

/**
 * @route   POST /api/services/add
 * @desc    Add new service
 * @access  Private (Admin)
 */
router.post('/add', authMiddleware, adminMiddleware, addService);

/**
 * @route   GET /api/services/list
 * @desc    Get all services with filtering and pagination
 * @access  Public
 */
router.get('/list', optionalAuth, getServices);

/**
 * @route   GET /api/services/popular
 * @desc    Get popular services
 * @access  Public
 */
router.get('/popular', getPopularServices);

/**
 * @route   GET /api/services/search
 * @desc    Search services
 * @access  Public
 */
router.get('/search', searchServices);

/**
 * @route   GET /api/services/category/:category
 * @desc    Get services by category
 * @access  Public
 */
router.get('/category/:category', getServicesByCategory);

/**
 * @route   GET /api/services/:id
 * @desc    Get single service
 * @access  Public
 */
router.get('/:id', getService);

/**
 * @route   PATCH /api/services/update/:id
 * @desc    Update service
 * @access  Private (Admin)
 */
router.patch('/update/:id', authMiddleware, adminMiddleware, updateService);

/**
 * @route   DELETE /api/services/delete/:id
 * @desc    Delete service
 * @access  Private (Admin)
 */
router.delete('/delete/:id', authMiddleware, adminMiddleware, deleteService);

module.exports = router;