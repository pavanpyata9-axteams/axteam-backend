/**
 * Middleware to check if user has admin role
 * Should be used after authMiddleware
 */
const adminMiddleware = (req, res, next) => {
  try {
    // Check if user exists (should be set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in admin authentication'
    });
  }
};

/**
 * Middleware to check if user is admin or accessing their own data
 * Should be used after authMiddleware
 */
const adminOrSelfMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Allow if user is admin
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Allow if user is accessing their own data
    const userId = req.params.userId || req.params.id;
    if (userId && userId === req.user._id.toString()) {
      return next();
    }
    
    // Check if the user is accessing their own bookings
    if (req.params.userId && req.params.userId === req.user._id.toString()) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges or own account access required'
    });
    
  } catch (error) {
    console.error('Admin or self middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authorization'
    });
  }
};

module.exports = {
  adminMiddleware,
  adminOrSelfMiddleware
};