const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// GUEST-ONLY ROUTES
//
// These routes require:
//   1. A valid JWT (protect middleware)
//   2. The user's role to be "guest" (authorizeRoles middleware)
//
// A host trying to access these routes will receive: 403 Forbidden
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/guest/test
// A test route to verify guest-only authorization
router.get('/test', protect, authorizeRoles('guest'), (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Guest route accessed successfully!',
    description: 'You reached this route because your JWT contains role: "guest".',
    authenticatedUser: {
      userId: req.user.userId,
      role: req.user.role,
    },
    note: 'This route will later be used for guest-specific features like searching and booking properties.',
  });
});

module.exports = router;
