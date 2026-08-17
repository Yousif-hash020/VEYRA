const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { getHostProperties, getHostBookings } = require('../controllers/roomController');

// ─────────────────────────────────────────────────────────────────────────────
// HOST-ONLY ROUTES
//
// All routes here require:
//   1. protect          → valid JWT → sets req.user = { userId, role }
//   2. authorizeRoles   → req.user.role must be 'host'
//
// A guest receives 403 Forbidden.
// An unauthenticated request receives 401 Unauthorized.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/host/properties
// Returns ONLY the properties owned by the authenticated Host.
router.get('/properties', protect, authorizeRoles('host'), getHostProperties);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/host/bookings
// Returns ONLY the bookings for properties owned by the authenticated Host.
router.get('/bookings', protect, authorizeRoles('host'), getHostBookings);

module.exports = router;
