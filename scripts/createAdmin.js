const mongoose = require('mongoose');
const User = require('../models/User');

// Load environment variables
require('dotenv').config();

/**
 * Create default admin user if it doesn't exist
 */
const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('📧 Connected to MongoDB');

    const adminEmail = 'admin@axteam.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminEmail);
      console.log('   Role:', existingAdmin.role);
      console.log('   Active:', existingAdmin.isActive);
      return;
    }

    // Create admin user
    const adminUser = new User({
      name: 'Administrator',
      email: adminEmail,
      phone: '+919876543210',
      password: adminPassword,
      role: 'admin',
      isActive: true
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   Role:', adminUser.role);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📧 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  createAdminUser().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = createAdminUser;