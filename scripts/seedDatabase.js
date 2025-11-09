const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Service = require('../models/Service');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📦 MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const sampleServices = [
  // AC Services
  {
    name: "AC Installation & Uninstallation",
    category: "AC Services",
    description: "Professional AC installation and uninstallation service with proper fitting and testing. Includes bracket mounting, copper pipe installation, and gas filling.",
    priceRange: { min: 2000, max: 5000, currency: "INR" },
    duration: "2-4 hours",
    features: ["Professional installation", "Copper pipe work", "Gas filling", "1 month warranty"],
    popularity: 85
  },
  {
    name: "AC Repair & Service",
    category: "AC Services", 
    description: "Complete AC repair and maintenance service including cleaning, gas refilling, and component replacement.",
    priceRange: { min: 800, max: 3000, currency: "INR" },
    duration: "1-3 hours",
    features: ["Filter cleaning", "Gas checking", "Component inspection", "Performance testing"],
    popularity: 95
  },
  {
    name: "AC Gas Filling",
    category: "AC Services",
    description: "Professional AC gas refilling service with leak detection and pressure testing.",
    priceRange: { min: 1500, max: 2500, currency: "INR" },
    duration: "1-2 hours", 
    features: ["Leak detection", "Pressure testing", "Quality gas refill", "Performance check"],
    popularity: 75
  },
  {
    name: "AC Advanced Piping Installation",
    category: "AC Services",
    description: "Advanced copper piping installation for split AC units with proper insulation and drainage.",
    priceRange: { min: 1000, max: 3000, currency: "INR" },
    duration: "2-3 hours",
    features: ["Copper pipe installation", "Proper insulation", "Drainage setup", "Leak testing"],
    popularity: 60
  },

  // Appliance Services
  {
    name: "Washing Machine - Installation & Uninstallation", 
    category: "Appliance Services",
    description: "Professional washing machine installation with water connection, drainage setup, and testing.",
    priceRange: { min: 500, max: 1500, currency: "INR" },
    duration: "1-2 hours",
    features: ["Water connection", "Drainage setup", "Level adjustment", "Test run"],
    popularity: 70
  },
  {
    name: "Washing Machine - Repair & Service",
    category: "Appliance Services", 
    description: "Complete washing machine repair service for all types - top load, front load, semi-automatic.",
    priceRange: { min: 800, max: 2500, currency: "INR" },
    duration: "1-3 hours",
    features: ["Diagnosis", "Component repair", "Cleaning", "Performance testing"],
    popularity: 80
  },
  {
    name: "Refrigerator - Repair & Service",
    category: "Appliance Services",
    description: "Professional refrigerator repair for single door, double door, and side-by-side models.",
    priceRange: { min: 1000, max: 4000, currency: "INR" },
    duration: "1-4 hours",
    features: ["Cooling system check", "Gas refilling", "Component replacement", "Temperature calibration"],
    popularity: 85
  },
  {
    name: "Microwave - Repair & Service", 
    category: "Appliance Services",
    description: "Expert microwave oven repair and maintenance service for all brands and models.",
    priceRange: { min: 800, max: 2000, currency: "INR" },
    duration: "1-2 hours",
    features: ["Component testing", "Magnetron check", "Door seal inspection", "Safety testing"],
    popularity: 50
  },
  {
    name: "Geyser - Installation & Uninstallation",
    category: "Appliance Services",
    description: "Safe geyser installation with proper electrical connections and water supply setup.",
    priceRange: { min: 800, max: 2000, currency: "INR" },
    duration: "1-3 hours", 
    features: ["Wall mounting", "Electrical connection", "Water supply connection", "Safety testing"],
    popularity: 65
  },
  {
    name: "Geyser - Repair & Service",
    category: "Appliance Services",
    description: "Comprehensive geyser repair service including heating element replacement and thermostat repair.",
    priceRange: { min: 600, max: 2500, currency: "INR" },
    duration: "1-2 hours",
    features: ["Heating element check", "Thermostat repair", "Safety valve testing", "Leak fixing"],
    popularity: 70
  },
  {
    name: "Water Purifier - Installation & Uninstallation",
    category: "Appliance Services", 
    description: "Professional water purifier installation with proper plumbing and filter setup.",
    priceRange: { min: 800, max: 2000, currency: "INR" },
    duration: "1-2 hours",
    features: ["Plumbing connection", "Filter installation", "TDS testing", "System calibration"],
    popularity: 60
  },
  {
    name: "Water Purifier - Repair & Service",
    category: "Appliance Services",
    description: "Complete water purifier maintenance including filter replacement and system cleaning.", 
    priceRange: { min: 500, max: 1500, currency: "INR" },
    duration: "1 hour",
    features: ["Filter replacement", "System cleaning", "TDS checking", "Flow rate testing"],
    popularity: 75
  },

  // Electrical Services  
  {
    name: "Complete Wiring - New/Old Buildings & Flats",
    category: "Electrical Services",
    description: "Complete electrical wiring service for new constructions and rewiring of old buildings.",
    priceRange: { min: 5000, max: 25000, currency: "INR" },
    duration: "1-5 days",
    features: ["Complete wiring", "Switch board installation", "Safety testing", "ISI compliance"],
    popularity: 70
  },
  {
    name: "Electrical Repair & Maintenance", 
    category: "Electrical Services",
    description: "General electrical repair and maintenance service for homes and offices.",
    priceRange: { min: 300, max: 2000, currency: "INR" },
    duration: "1-3 hours",
    features: ["Fault diagnosis", "Component replacement", "Safety checking", "Testing"],
    popularity: 90
  },
  {
    name: "Commercial Electrical Works",
    category: "Electrical Services",
    description: "Comprehensive electrical services for commercial buildings and offices.",
    priceRange: { min: 3000, max: 15000, currency: "INR" },
    duration: "1-3 days", 
    features: ["Commercial wiring", "Panel installation", "Load balancing", "Safety compliance"],
    popularity: 45
  },

  // Plumbing Services
  {
    name: "Piping for New Buildings/Flats (Complete Work)",
    category: "Plumbing Services", 
    description: "Complete plumbing installation for new constructions with water supply and drainage systems.",
    priceRange: { min: 8000, max: 30000, currency: "INR" },
    duration: "2-7 days",
    features: ["Water supply lines", "Drainage system", "Fixture installation", "Pressure testing"],
    popularity: 55
  },
  {
    name: "Advanced Pipelining",
    category: "Plumbing Services",
    description: "Advanced plumbing solutions including underground piping and complex drainage systems.",
    priceRange: { min: 2000, max: 10000, currency: "INR" },
    duration: "1-3 days",
    features: ["Underground piping", "Advanced drainage", "Leak detection", "Pressure testing"],
    popularity: 40
  },

  // Home Maintenance
  {
    name: "General Home Repairs",
    category: "Home Maintenance", 
    description: "General home repair and maintenance service for various household issues.",
    priceRange: { min: 500, max: 3000, currency: "INR" },
    duration: "2-6 hours",
    features: ["Multiple repairs", "Quick fixes", "Quality materials", "Clean workspace"],
    popularity: 85
  },
  {
    name: "Home Maintenance & Services",
    category: "Home Maintenance",
    description: "Comprehensive home maintenance service including minor repairs and upkeep.",
    priceRange: { min: 800, max: 5000, currency: "INR" },
    duration: "2-8 hours", 
    features: ["Preventive maintenance", "Multiple services", "Quality assurance", "Follow-up"],
    popularity: 75
  },

  // Interior Services
  {
    name: "Full Building/Flat Interior Work",
    category: "Interior Services",
    description: "Complete interior design and execution service for entire buildings or flats.",
    priceRange: { min: 50000, max: 500000, currency: "INR" },
    duration: "2-8 weeks",
    features: ["Design consultation", "Complete execution", "Quality materials", "Project management"],
    popularity: 35
  },
  {
    name: "Interior Repair & Service (Existing Work)", 
    category: "Interior Services",
    description: "Repair and maintenance of existing interior work including furniture and fixtures.",
    priceRange: { min: 2000, max: 15000, currency: "INR" },
    duration: "1-5 days",
    features: ["Damage assessment", "Quality repairs", "Color matching", "Finishing work"],
    popularity: 50
  },
  {
    name: "Interior Work Adjustments/Changes",
    category: "Interior Services",
    description: "Modifications and adjustments to existing interior work as per requirements.",
    priceRange: { min: 1500, max: 10000, currency: "INR" },
    duration: "1-3 days",
    features: ["Custom modifications", "Design changes", "Quality execution", "Clean finish"],
    popularity: 40
  },

  // Painting Services
  {
    name: "Wall Painting & Touch-up",
    category: "Painting Services",
    description: "Professional wall painting service with primer, putty, and quality paint application.",
    priceRange: { min: 1500, max: 8000, currency: "INR" },
    duration: "1-3 days",
    features: ["Surface preparation", "Primer application", "Quality paint", "Clean finish"],
    popularity: 80
  },
  {
    name: "Complete Building Painting", 
    category: "Painting Services",
    description: "Complete exterior and interior painting service for entire buildings.",
    priceRange: { min: 15000, max: 100000, currency: "INR" },
    duration: "1-4 weeks",
    features: ["Exterior & interior", "Weather protection", "Quality materials", "Professional finish"],
    popularity: 45
  },
  {
    name: "Texture & Designer Painting",
    category: "Painting Services",
    description: "Decorative and textured painting service for walls and ceilings.",
    priceRange: { min: 3000, max: 15000, currency: "INR" },
    duration: "2-5 days",
    features: ["Textured finish", "Designer patterns", "Premium materials", "Artistic execution"],
    popularity: 30
  },
  {
    name: "Wall Paneling - Flats & Buildings",
    category: "Painting Services",
    description: "Decorative wall paneling installation for enhanced interior aesthetics.",
    priceRange: { min: 5000, max: 25000, currency: "INR" },
    duration: "2-7 days", 
    features: ["Premium panels", "Professional installation", "Custom designs", "Durable finish"],
    popularity: 25
  },

  // CCTV Services
  {
    name: "CCTV - Installation & Uninstallation",
    category: "CCTV Services",
    description: "Professional CCTV camera installation with DVR setup and mobile connectivity.",
    priceRange: { min: 3000, max: 15000, currency: "INR" },
    duration: "2-6 hours",
    features: ["Camera installation", "DVR setup", "Mobile app", "Night vision"],
    popularity: 65
  },
  {
    name: "CCTV - Repair & Maintenance",
    category: "CCTV Services", 
    description: "CCTV system repair and maintenance service including camera and DVR servicing.",
    priceRange: { min: 800, max: 3000, currency: "INR" },
    duration: "1-3 hours",
    features: ["System diagnosis", "Component repair", "Software updates", "Performance testing"],
    popularity: 55
  },
  {
    name: "Security System Setup",
    category: "CCTV Services",
    description: "Comprehensive security system installation including alarms and monitoring.",
    priceRange: { min: 5000, max: 25000, currency: "INR" },
    duration: "4-8 hours",
    features: ["CCTV cameras", "Alarm system", "Motion sensors", "Remote monitoring"],
    popularity: 40
  },

  // Cleaning Services
  {
    name: "Cleaning - Entire Building or Flat",
    category: "Cleaning Services",
    description: "Deep cleaning service for entire buildings or flats including all rooms and areas.",
    priceRange: { min: 2000, max: 10000, currency: "INR" },
    duration: "4-12 hours", 
    features: ["Deep cleaning", "All areas covered", "Eco-friendly products", "Professional equipment"],
    popularity: 70
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Service.deleteMany({});

    // Create admin user if not exists
    console.log('👑 Creating admin user...');
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
      
      const adminUser = new User({
        name: 'AX TEAM Admin',
        email: process.env.ADMIN_EMAIL || 'admin@axteam.com',
        phone: process.env.ADMIN_PHONE || '+919876543210',
        password: hashedPassword,
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('✅ Admin user created');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Insert sample services
    console.log('🛠️ Inserting sample services...');
    const services = await Service.insertMany(sampleServices);
    console.log(`✅ Inserted ${services.length} services`);

    // Update popularity and ratings randomly
    console.log('📊 Updating service metrics...');
    for (const service of services) {
      const randomRating = Math.random() * 2 + 3; // 3-5 rating
      const randomBookings = Math.floor(Math.random() * 50) + 5; // 5-55 bookings
      
      await Service.findByIdAndUpdate(service._id, {
        averageRating: parseFloat(randomRating.toFixed(1)),
        totalBookings: randomBookings,
        popularity: Math.floor(Math.random() * 40) + 60 // 60-100 popularity
      });
    }

    console.log('🎉 Database seeded successfully!');
    console.log(`
📊 Summary:
- ${services.length} services created
- Admin user ready
- All categories populated
- Ready for production use

🔑 Admin Login:
Email: ${process.env.ADMIN_EMAIL || 'admin@axteam.com'}
Password: ${process.env.ADMIN_PASSWORD || 'admin123'}
    `);

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
};

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };