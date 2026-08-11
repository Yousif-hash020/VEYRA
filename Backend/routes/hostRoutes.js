const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { getHostProperties } = require('../controllers/roomController');

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

// GET /api/host/test
// Verify host-only authorization (development/debug route)
router.get('/test', protect, authorizeRoles('host'), (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Host route accessed successfully!',
    description: 'You reached this route because your JWT contains role: "host".',
    authenticatedUser: {
      userId: req.user.userId,
      role: req.user.role,
    },
    note: 'Use GET /api/host/properties to fetch your own property listings.',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/host/properties
// Returns ONLY the properties owned by the authenticated Host.
//
// OWNERSHIP:
//   The controller queries: Room.find({ owner: req.user.userId })
//   Host A receives only Host A's rooms.
//   Host B receives only Host B's rooms.
//   Cross-host access is impossible through this endpoint.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/properties', protect, authorizeRoles('host'), getHostProperties);

module.exports = router;
