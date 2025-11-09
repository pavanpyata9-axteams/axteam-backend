const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAdminBookings,
  getAdminUsers,
  getAdminServices,
  updateUserStatus,
  getSystemHealth,
  getEnhancedStats,
  getAllEnhancedBookings,
  assignTechnician,
  exportBookings
} = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// Import models for direct route handlers
const User = require('../models/User');
const Booking = require('../models/Booking');

/**
 * @route   GET /api/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get('/stats', authMiddleware, adminMiddleware, getAdminStats);

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings for admin with advanced filtering
 * @access  Private (Admin)
 */
router.get('/bookings', authMiddleware, adminMiddleware, getAdminBookings);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users for admin
 * @access  Private (Admin)
 */
router.get('/users', authMiddleware, adminMiddleware, getAdminUsers);

/**
 * @route   GET /api/admin/services
 * @desc    Get all services for admin
 * @access  Private (Admin)
 */
router.get('/services', authMiddleware, adminMiddleware, getAdminServices);

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (Admin)
 */
router.patch('/users/:id/status', authMiddleware, adminMiddleware, updateUserStatus);

/**
 * @route   GET /api/admin/system-health
 * @desc    Get system health and metrics
 * @access  Private (Admin)
 */
router.get('/system-health', authMiddleware, adminMiddleware, getSystemHealth);

// ✅ NEW ENHANCED FEATURES
/**
 * @route   GET /api/admin/stats/enhanced
 * @desc    Get enhanced dashboard statistics with complete data
 * @access  Private (Admin)
 */
router.get('/stats/enhanced', authMiddleware, adminMiddleware, getEnhancedStats);

/**
 * @route   GET /api/admin/bookings/enhanced
 * @desc    Get all bookings with location and technician info
 * @access  Private (Admin)
 */
router.get('/bookings/enhanced', authMiddleware, adminMiddleware, getAllEnhancedBookings);

/**
 * @route   POST /api/admin/bookings/:bookingId/assign-technician
 * @desc    Assign technician to booking with notifications
 * @access  Private (Admin)
 */
router.post('/bookings/:bookingId/assign-technician', authMiddleware, adminMiddleware, assignTechnician);

/**
 * @route   GET /api/admin/export/bookings
 * @desc    Export bookings to Excel file
 * @access  Private (Admin)
 */
router.get('/export/bookings', authMiddleware, adminMiddleware, exportBookings);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user and all associated bookings
 * @access  Private (Admin)
 */
router.delete('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🗑️ [AdminRoutes] Deleting user:', userId);
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account'
      });
    }
    
    // Delete all user's bookings first
    const deletedBookings = await Booking.deleteMany({ userId: userId });
    console.log('🗑️ [AdminRoutes] Deleted user bookings:', deletedBookings.deletedCount);
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    console.log('✅ [AdminRoutes] User deleted successfully:', user.email);
    
    res.json({
      success: true,
      message: 'User and all associated bookings deleted successfully',
      data: {
        deletedUser: user.email,
        deletedBookings: deletedBookings.deletedCount
      }
    });
  } catch (error) {
    console.error('❌ [AdminRoutes] Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting user'
    });
  }
});

module.exports = router;