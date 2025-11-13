const User = require('../models/User');
const Booking = require('../models/Booking');
const Gallery = require('../models/Gallery');
const SupportRequest = require('../models/SupportRequest');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const Service = require('../models/Service');

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 */
const getAdminStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get basic counts
    const [
      totalUsers,
      totalBookings,
      totalServices,
      pendingBookings,
      confirmedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments(),
      Service.countDocuments(),
      Booking.countDocuments({ status: 'Pending' }),
      Booking.countDocuments({ status: 'Confirmed' }),
      Booking.countDocuments({ status: 'InProgress' }),
      Booking.countDocuments({ status: 'Completed' }),
      Booking.countDocuments({ status: 'Cancelled' })
    ]);

    // Get period-specific stats
    const periodBookings = await Booking.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const periodUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      role: 'user'
    });

    // Revenue calculations (if actualCost is available)
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          status: 'Completed',
          actualCost: { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$actualCost' },
          avgOrderValue: { $avg: '$actualCost' }
        }
      }
    ]);

    const periodRevenueResult = await Booking.aggregate([
      {
        $match: {
          status: 'Completed',
          actualCost: { $exists: true, $gt: 0 },
          completedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          periodRevenue: { $sum: '$actualCost' }
        }
      }
    ]);

    // Service popularity
    const popularServices = await Service.find({ isActive: true })
      .sort({ totalBookings: -1, averageRating: -1 })
      .limit(5)
      .select('name category totalBookings averageRating');

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('services.serviceId', 'name category')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('bookingId name phone status date createdAt technician hasTechnician');

    // Booking trends (last 7 days)
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
          }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Category wise bookings
    const categoryStats = await Booking.aggregate([
      { $unwind: '$services' },
      {
        $lookup: {
          from: 'services',
          localField: 'services.serviceId',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      },
      { $unwind: '$serviceDetails' },
      {
        $group: {
          _id: '$serviceDetails.category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const stats = {
      overview: {
        totalUsers,
        totalBookings,
        totalServices,
        totalRevenue: revenueResult[0]?.totalRevenue || 0,
        avgOrderValue: revenueResult[0]?.avgOrderValue || 0
      },
      periodStats: {
        period: parseInt(period),
        newBookings: periodBookings,
        newUsers: periodUsers,
        revenue: periodRevenueResult[0]?.periodRevenue || 0
      },
      bookingStatus: {
        pending: pendingBookings,
        confirmed: confirmedBookings,
        inProgress: inProgressBookings,
        completed: completedBookings,
        cancelled: cancelledBookings
      },
      popularServices,
      recentBookings,
      bookingTrends,
      categoryStats
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching admin statistics'
    });
  }
};

/**
 * Get all bookings for admin
 * GET /api/admin/bookings
 */
const getAdminBookings = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      dateFrom,
      dateTo,
      category
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

    // Build aggregation pipeline for category filtering
    let pipeline = [
      { $match: filter }
    ];

    if (category) {
      pipeline.push(
        { $unwind: '$services' },
        {
          $lookup: {
            from: 'services',
            localField: 'services.serviceId',
            foreignField: '_id',
            as: 'serviceDetails'
          }
        },
        { $unwind: '$serviceDetails' },
        { $match: { 'serviceDetails.category': category } },
        {
          $group: {
            _id: '$_id',
            bookingId: { $first: '$bookingId' },
            userId: { $first: '$userId' },
            name: { $first: '$name' },
            email: { $first: '$email' },
            phone: { $first: '$phone' },
            address: { $first: '$address' },
            services: { $push: '$services' },
            date: { $first: '$date' },
            time: { $first: '$time' },
            status: { $first: '$status' },
            technician: { $first: '$technician' },
            hasTechnician: { $first: '$hasTechnician' },
            createdAt: { $first: '$createdAt' },
            updatedAt: { $first: '$updatedAt' }
          }
        }
      );
    }

    pipeline.push(
      { $sort: sort },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'services.serviceId',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      }
    );

    const [bookings, totalCount] = await Promise.all([
      Booking.aggregate(pipeline),
      category 
        ? Booking.aggregate([...pipeline.slice(0, -4), { $count: "total" }])
        : Booking.countDocuments(filter)
    ]);

    const total = Array.isArray(totalCount) && totalCount[0] ? totalCount[0].total : totalCount;

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
    console.error('Get admin bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching admin bookings'
    });
  }
};

/**
 * Get all users for admin
 * GET /api/admin/users
 */
const getAdminUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      isActive
    } = req.query;

    // Build filter
    const filter = { role: 'user' };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get users with booking counts
    const users = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'userId',
          as: 'bookings'
        }
      },
      {
        $addFields: {
          totalBookings: { $size: '$bookings' },
          lastBooking: { $max: '$bookings.createdAt' }
        }
      },
      {
        $project: {
          password: 0,
          bookings: 0
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Get total count
    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching admin users'
    });
  }
};

/**
 * Get all services for admin
 * GET /api/admin/services
 */
const getAdminServices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      category,
      isActive
    } = req.query;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
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

    res.status(200).json({
      success: true,
      data: {
        services,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get admin services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching admin services'
    });
  }
};

/**
 * Update user status (Admin only)
 * PATCH /api/admin/users/:id/status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify admin user status'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: { id: user._id, name: user.name, email: user.email, isActive: user.isActive } }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user status'
    });
  }
};

/**
 * Get system health and metrics
 * GET /api/admin/system-health
 */
const getSystemHealth = async (req, res) => {
  try {
    const [
      dbStats,
      uptime,
      memoryUsage
    ] = await Promise.all([
      // Database connection status
      new Promise((resolve) => {
        const mongoose = require('mongoose');
        resolve({
          status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
          host: mongoose.connection.host,
          name: mongoose.connection.name
        });
      }),
      // Server uptime
      process.uptime(),
      // Memory usage
      process.memoryUsage()
    ]);

    res.status(200).json({
      success: true,
      data: {
        database: dbStats,
        server: {
          uptime: Math.floor(uptime),
          uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
          nodeVersion: process.version,
          platform: process.platform,
          environment: process.env.NODE_ENV
        },
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching system health'
    });
  }
};

// Enhanced Dashboard Stats
const getEnhancedStats = async (req, res) => {
  try {
    console.log('📊 [Admin] Getting enhanced dashboard statistics...');

    const [
      totalUsers,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalSupport,
      openSupport,
      totalGallery
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Pending' }),
      Booking.countDocuments({ status: 'Confirmed' }),
      Booking.countDocuments({ status: 'Completed' }),
      Booking.countDocuments({ status: 'Cancelled' }),
      SupportRequest.countDocuments(),
      SupportRequest.countDocuments({ status: 'Open' }),
      Gallery.countDocuments({ isActive: true })
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: totalUsers
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        inProgress: await Booking.countDocuments({ status: 'InProgress' })
      },
      support: {
        total: totalSupport,
        open: openSupport,
        resolved: await SupportRequest.countDocuments({ status: 'Resolved' })
      },
      gallery: {
        total: totalGallery,
        images: await Gallery.countDocuments({ mediaType: 'image', isActive: true }),
        videos: await Gallery.countDocuments({ mediaType: 'video', isActive: true })
      }
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('❌ [Admin] Enhanced stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get All Bookings with Location and Details
const getAllEnhancedBookings = async (req, res) => {
  try {
    console.log('📅 [Admin] Getting all enhanced bookings...');

    const bookings = await Booking.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ [Admin] Found ${bookings.length} bookings`);

    res.status(200).json({
      success: true,
      data: {
        bookings: bookings.map(booking => ({
          ...booking,
          hasLocation: !!(booking.location?.coordinates?.latitude && booking.location?.coordinates?.longitude),
          locationData: booking.location,
          servicesText: booking.services.map(s => s.serviceName).join(', '),
          fullAddress: `${booking.address.street}, ${booking.address.city}, ${booking.address.state} - ${booking.address.pincode}`,
          hasTechnician: !!(booking.technician?.name),
          technicianInfo: booking.technician
        }))
      }
    });

  } catch (error) {
    console.error('❌ [Admin] Get enhanced bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const assignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianName, technicianPhone, technicianEmail } = req.body;

    if (!technicianName || !technicianPhone) {
      return res.status(400).json({ success: false, message: "Missing technician details" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.technician = {
      name: technicianName,
      phone: technicianPhone,
      email: technicianEmail || "",
      assignedAt: new Date(),
    };

    booking.status = "Confirmed";
    booking.hasTechnician = true;

    await booking.save();

    // Return updated booking with technician included
    return res.status(200).json({ 
      success: true, 
      message: "Technician assigned successfully", 
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
        hasTechnician: booking.hasTechnician,
        technician: booking.technician
      }
    });

  } catch (error) {
    console.error("assignTechnician error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Export Bookings to Excel
const exportBookings = async (req, res) => {
  try {
    console.log('📊 [Admin] Exporting bookings to Excel...');

    const bookings = await Booking.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bookings');

    worksheet.columns = [
      { header: 'Booking ID', key: 'bookingId', width: 15 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Service', key: 'service', width: 30 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Technician', key: 'technician', width: 20 },
      { header: 'Tech Phone', key: 'techPhone', width: 15 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Created Date', key: 'createdDate', width: 15 }
    ];

    bookings.forEach(booking => {
      worksheet.addRow({
        bookingId: booking.bookingId,
        customerName: booking.name,
        email: booking.email,
        phone: booking.phone,
        service: booking.services.map(s => s.serviceName).join(', '),
        address: `${booking.address.street}, ${booking.address.city}, ${booking.address.state} - ${booking.address.pincode}`,
        date: booking.date.toDateString(),
        time: booking.time,
        status: booking.status,
        technician: booking.technician?.name || 'Not Assigned',
        techPhone: booking.technician?.phone || '',
        location: booking.location?.coordinates?.latitude ? 
          `${booking.location.coordinates.latitude}, ${booking.location.coordinates.longitude}` : 'Not Available',
        createdDate: booking.createdAt.toDateString()
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });

    const fileName = `bookings-${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(__dirname, '../exports', fileName);

    const exportsDir = path.dirname(filePath);
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Export download error:', err);
      }
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 60000);
    });

  } catch (error) {
    console.error('❌ [Admin] Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
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
};