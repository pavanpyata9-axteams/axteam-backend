const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

const app = express();

// Trust proxy for Render deployment
app.set("trust proxy", 1);

// Basic middleware setup
app.use(express.json());

// Basic route to test server
app.get("/", (req, res) => res.send("Backend Running"));

// CORS configuration with whitelist
const allowedOrigins = [
  "https://axteam-frontend-new.onrender.com",
  "http://localhost:5173"
];

try {
  const cors = require('cors');
  
  app.use(cors({
    origin: allowedOrigins,
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
    credentials: true
  }));

  app.options('*', cors());
  console.log('✅ CORS initialized');
} catch (error) {
  console.error('❌ CORS setup error:', error.message);
}

// Security middleware (wrapped in try-catch)
try {
  const helmet = require('helmet');
  app.use(helmet());
  console.log('✅ Helmet security enabled');
} catch (error) {
  console.error('⚠️ Helmet security disabled:', error.message);
}

// Rate limiting (wrapped in try-catch)
try {
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);
  console.log('✅ Rate limiting enabled');
} catch (error) {
  console.error('⚠️ Rate limiting disabled:', error.message);
}

// Data sanitization (wrapped in try-catch)
try {
  const mongoSanitize = require('express-mongo-sanitize');
  app.use(mongoSanitize());
  console.log('✅ Mongo sanitization enabled');
} catch (error) {
  console.error('⚠️ Mongo sanitization disabled:', error.message);
}

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB Connected');
    })
    .catch((error) => {
      console.error('❌ MongoDB connection error:', error.message);
    });
} else {
  console.error('❌ MONGODB_URI not found in environment variables');
}

// API routes (wrapped in try-catch)
try {
  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/admin", require("./routes/adminRoutes"));
  app.use("/api/bookings", require("./routes/bookingRoutes"));
  app.use("/api/reviews", require("./routes/reviewRoutes"));
  app.use("/api/services", require("./routes/serviceRoutes"));
  console.log('✅ API routes loaded');
} catch (error) {
  console.error('❌ Route loading error:', error.message);
}

// Server startup
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on ${PORT}`);
});