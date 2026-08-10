const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const roomRoutes = require('./routes/roomRoutes');

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

// Connect to MongoDB Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route - Health Check / Welcome
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to VEYRA Room Management API',
    endpoints: {
      getAllRooms: 'GET /api/rooms',
      getSingleRoom: 'GET /api/rooms/:id',
      createRoom: 'POST /api/rooms',
      updateRoom: 'PUT /api/rooms/:id',
      deleteRoom: 'DELETE /api/rooms/:id'
    }
  });
});

// API Routes
app.use('/api/rooms', roomRoutes);

// 404 Route Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
