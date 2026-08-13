const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// ─────────────────────────────────────────────────────────────────────────────
// Load environment variables from .env FIRST — before anything else
// ─────────────────────────────────────────────────────────────────────────────
dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// Route imports
// ─────────────────────────────────────────────────────────────────────────────
const roomRoutes = require('./routes/roomRoutes');
const authRoutes = require('./routes/authRoutes');
const hostRoutes = require('./routes/hostRoutes');
const guestRoutes = require('./routes/guestRoutes');

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Express
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// Connect to MongoDB
// ─────────────────────────────────────────────────────────────────────────────
connectDB();

// ─────────────────────────────────────────────────────────────────────────────
// CORS Configuration
// Allows the frontend to communicate with the backend.
// The Authorization header must be explicitly allowed so JWTs can be sent.
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*', // In production, restrict to your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Body Parsing Middleware
// Allows Express to read JSON and form-encoded request bodies
// ─────────────────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────────────────────

// Authentication routes (register, login, /me, logout)
app.use('/api/auth', authRoutes);

// Role-protected test routes
app.use('/api/host', hostRoutes);
app.use('/api/guest', guestRoutes);

// Existing room management routes (unchanged)
app.use('/api/rooms', roomRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// Root / Health Check
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to VEYRA API',
    version: '2.1.0',
    docs: 'See README.md for full API documentation',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me  [Protected]',
        updateMe: 'PUT /api/auth/me  [Protected]',
        logout: 'POST /api/auth/logout  [Protected]',
      },
      host: {
        test: 'GET /api/host/test  [Protected: host]',
        myProperties: 'GET /api/host/properties  [Protected: host]  — returns only the authenticated host\'s own rooms',
      },
      guest: {
        test: 'GET /api/guest/test  [Protected: guest]',
        properties: 'GET /api/guest/properties  [Public/Guest]  — search & filter available properties',
        propertyDetail: 'GET /api/guest/properties/:id  [Public/Guest]',
        wishlist: 'GET /api/guest/wishlist  [Protected: guest]',
        addToWishlist: 'POST /api/guest/wishlist/:propertyId  [Protected: guest]',
        removeFromWishlist: 'DELETE /api/guest/wishlist/:propertyId  [Protected: guest]',
        createBooking: 'POST /api/guest/bookings  [Protected: guest]',
        myBookings: 'GET /api/guest/bookings  [Protected: guest]',
        bookingDetail: 'GET /api/guest/bookings/:id  [Protected: guest]',
        cancelBooking: 'PATCH /api/guest/bookings/:id/cancel  [Protected: guest]',
        updateProfile: 'PUT /api/guest/profile  [Protected: guest]',
        changePassword: 'PUT /api/guest/change-password  [Protected: guest]',
        createReview: 'POST /api/guest/reviews  [Protected: guest]',
        getReviews: 'GET /api/guest/reviews/room/:roomId  [Public/Guest]',
      },
      rooms: {
        browse: 'GET /api/rooms  [Public]  — all published rooms for discovery',
        single: 'GET /api/rooms/:id  [Public]',
        create: 'POST /api/rooms  [Protected: host]  — owner stamped from JWT',
        update: 'PUT /api/rooms/:id  [Protected: host]  — ownership verified',
        delete: 'DELETE /api/rooms/:id  [Protected: host]  — ownership verified',
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 Handler — Route not found
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Global Error Handler
// Catches any errors thrown by controllers/middleware via next(error)
// ─────────────────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('══════════════════════════════════════════════════');
  console.log(`  🏠 VEYRA API Server`);
  console.log(`  🚀 Running on: http://localhost:${PORT}`);
  console.log(`  🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('──────────────────────────────────────────────────');
  console.log(`  📋 API Info:   http://localhost:${PORT}/api`);
  console.log('══════════════════════════════════════════════════');
  console.log('');
});
