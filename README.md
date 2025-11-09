# AX TEAM Home Services - Backend API

Complete backend system for AX TEAM Home Services - a comprehensive home repair and maintenance service platform.

## 🚀 Features

- **Authentication System**: JWT-based auth with user and admin roles
- **Booking Management**: Complete booking lifecycle management
- **Service Management**: Admin-controlled service catalog
- **Email Notifications**: Automated email notifications for bookings
- **SMS Notifications**: Real-time SMS updates via Twilio/MSG91
- **Admin Dashboard**: Comprehensive analytics and management
- **Security**: Rate limiting, CORS, XSS protection, input sanitization
- **Scalable Architecture**: MongoDB with Mongoose ODM

## 🛠️ Tech Stack

- **Runtime**: Node.js (18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcryptjs
- **Email**: Nodemailer
- **SMS**: Twilio / MSG91
- **Security**: Helmet, CORS, XSS-Clean, Rate Limiting

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account or local MongoDB
- Email service (Gmail recommended)
- SMS service (Twilio or MSG91)

## ⚡ Quick Start

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Setup

Create `.env` file from template:

```bash
cp .env.template .env
```

Configure your `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/axteam-db

# JWT Secret (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=AX TEAM Home Services <noreply@axteam.com>

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URLs
FRONTEND_URL=http://localhost:3000
PRODUCTION_URL=https://your-domain.com

# Admin Credentials
ADMIN_EMAIL=admin@axteam.com
ADMIN_PASSWORD=admin123
ADMIN_PHONE=+919876543210
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Start Production Server

```bash
npm start
```

## 📚 API Documentation

### Base URL
- Development: `http://localhost:5000`
- Production: `https://your-api-domain.com`

### Authentication

All protected routes require `Authorization: Bearer <token>` header.

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "password123"
}
```

#### User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Admin Login
```http
POST /api/auth/admin-login
Content-Type: application/json

{
  "email": "admin@axteam.com",
  "password": "admin123"
}
```

### Booking Management

#### Create Booking
```http
POST /api/bookings/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "services": [
    {
      "serviceId": "service_id_here",
      "serviceName": "AC Repair",
      "category": "AC Services"
    }
  ],
  "date": "2024-01-15",
  "time": "10:00",
  "workDescription": "AC not cooling properly"
}
```

#### Get User Bookings
```http
GET /api/bookings/user/:userId?status=Pending&page=1&limit=10
Authorization: Bearer <token>
```

#### Update Booking Status (Admin)
```http
PATCH /api/bookings/status/:bookingId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "Confirmed",
  "technicianNotes": "Technician assigned",
  "estimatedCost": 1500
}
```

### Service Management

#### Get All Services
```http
GET /api/services/list?category=AC Services&page=1&limit=20
```

#### Add Service (Admin)
```http
POST /api/services/add
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "AC Installation",
  "category": "AC Services",
  "description": "Professional AC installation service",
  "priceRange": {
    "min": 2000,
    "max": 5000
  },
  "thumbnailURL": "https://example.com/image.jpg",
  "features": ["Professional installation", "1 year warranty"]
}
```

### Admin Dashboard

#### Get Dashboard Stats
```http
GET /api/admin/stats?period=30
Authorization: Bearer <admin_token>
```

#### Get All Bookings (Admin)
```http
GET /api/admin/bookings?status=Pending&page=1&limit=20
Authorization: Bearer <admin_token>
```

## 🔧 Deployment

### Deploy to Render

1. Create new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables from `.env.template`

### Deploy to Railway

1. Connect GitHub repo to Railway
2. Set environment variables
3. Deploy automatically

### Deploy to AWS EC2

1. Launch EC2 instance with Node.js
2. Clone repository
3. Install dependencies: `npm install`
4. Set up PM2: `pm2 start server.js --name axteam-backend`
5. Configure Nginx reverse proxy

### Deploy to DigitalOcean

1. Create Droplet with Node.js
2. Clone and setup application
3. Use PM2 for process management
4. Setup Nginx for SSL and reverse proxy

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Rate Limiting**: 100 requests per minute per IP
- **CORS Protection**: Configured for specific origins
- **XSS Protection**: Input sanitization and cleaning
- **MongoDB Injection Protection**: Input sanitization
- **Helmet**: Security headers protection

## 📧 Email Templates

The system sends automated emails for:

- **Booking Confirmation**: Customer receives booking details
- **Status Updates**: Customer notified of booking changes
- **Admin Alerts**: Admin receives new booking notifications

## 📱 SMS Integration

SMS notifications via Twilio or MSG91 for:

- Booking confirmations
- Status updates
- Admin alerts

## 🧪 Testing

### Manual Testing with Postman

Import the provided Postman collection:

```json
{
  "info": {
    "name": "AX TEAM API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{auth_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000",
      "type": "string"
    },
    {
      "key": "auth_token",
      "value": "",
      "type": "string"
    }
  ]
}
```

### Health Check

```http
GET /health
```

Expected response:
```json
{
  "status": "OK",
  "message": "AX TEAM Backend is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## 🚨 Error Handling

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Specific error details"]
}
```

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  role: "user" | "admin",
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Model
```javascript
{
  bookingId: String (unique), // AX-YYYYMMDD-XXXX
  userId: ObjectId,
  name: String,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  services: [{
    serviceId: ObjectId,
    serviceName: String,
    category: String
  }],
  date: Date,
  time: String,
  workDescription: String,
  status: "Pending" | "Confirmed" | "InProgress" | "Completed" | "Cancelled",
  estimatedCost: Number,
  actualCost: Number,
  rating: Number (1-5),
  feedback: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Service Model
```javascript
{
  name: String,
  category: String,
  description: String,
  priceRange: {
    min: Number,
    max: Number,
    currency: String
  },
  thumbnailURL: String,
  duration: String,
  features: [String],
  isActive: Boolean,
  popularity: Number,
  averageRating: Number,
  totalBookings: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🤝 Frontend Integration

### Axios Setup

```javascript
// api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

### Example Usage

```javascript
// Create booking
const bookingData = {
  name: 'John Doe',
  email: 'john@example.com',
  // ... other fields
};

try {
  const response = await API.post('/api/bookings/create', bookingData);
  console.log('Booking created:', response.data);
} catch (error) {
  console.error('Booking error:', error.response.data);
}
```

## 🆘 Support

For technical issues or questions:

- **Email**: support@axteam.com
- **Phone**: +91-9876543210
- **Documentation**: [API Docs](https://api.axteam.com/docs)

## 📄 License

This project is proprietary software owned by AX TEAM Home Services.

---

**AX TEAM Home Services Backend v1.0.0**  
Built with ❤️ for reliable home service management.