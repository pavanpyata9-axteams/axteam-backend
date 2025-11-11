const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Trust proxy for Render deployment
app.set("trust proxy", 1);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('📦 MongoDB Connected successfully');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGIN ? 
  process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim()) : 
  ["https://axteam-frontend-new.onrender.com", "http://localhost:5173"];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());

// Data sanitization
app.use(mongoSanitize());

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Health check route (public)
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: Date.now() });
});

// API routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));

// Fallback root route
app.get("/", (req, res) => res.send("Backend Running"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
}).on("error", (err) => {
  console.error("❌ Server failed:", err.message);
});