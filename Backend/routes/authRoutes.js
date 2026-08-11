const express = require('express');
const router = express.Router();

const { register, login, getMe, updateMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// Public Routes — No authentication required
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/register
// Register a new user (guest or host)
router.post('/register', register);

// POST /api/auth/login
// Login with email + password → receive JWT
router.post('/login', login);

// ─────────────────────────────────────────────────────────────────────────────
// Protected Routes — JWT required (protect middleware)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/auth/me
// Get the currently authenticated user's profile
// The backend uses req.user.userId (from JWT) to determine WHICH user to return.
// The frontend cannot choose which user's data it receives.
router.get('/me', protect, getMe);

// PUT /api/auth/me
// Update the currently authenticated user's own profile
// Uses req.user.userId from JWT — prevents IDOR vulnerabilities
router.put('/me', protect, updateMe);

// POST /api/auth/logout
// Client-side logout (explains JWT statelessness)
router.post('/logout', protect, logout);

module.exports = router;
