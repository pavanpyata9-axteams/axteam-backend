const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin user if it doesn't exist
    await createDefaultAdmin();
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('⚠️  Server will continue without database connection');
    console.log('🔧 To fix: Set up MongoDB Atlas or install MongoDB locally');
    // Don't exit, let server run without DB for testing
  }
};

const createDefaultAdmin = async () => {
  try {
    // Check if we have a database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  Skipping admin creation - no database connection');
      return;
    }

    const User = require('../models/User');
    
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      // Use User model which will hash password automatically
      const adminUser = new User({
        name: 'AX TEAM Admin',
        email: process.env.ADMIN_EMAIL || 'admin@axteam.com',
        phone: process.env.ADMIN_PHONE || '+919876543210',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('👑 Default admin user created');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
  }
};

module.exports = connectDB;