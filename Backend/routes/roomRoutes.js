const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES — No authentication required
//
// WHY public?
//   Guests (and unauthenticated visitors) need to browse/discover all listings.
//   This is standard marketplace behaviour.
//   Ownership is NOT enforced here — all published rooms are visible to everyone.
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/rooms       → Browse all available rooms (public discovery)
// GET /api/rooms/:id   → View a single room's details
router.get('/', getRooms);
router.get('/:id', getRoomById);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES — Require JWT + host role
//
// Middleware chain:
//   protect          → verifies JWT, sets req.user = { userId, role }
//   authorizeRoles   → confirms req.user.role === 'host'
//
// A guest calling these routes receives: 403 Forbidden
// An unauthenticated request receives:   401 Unauthorized
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/rooms      → Create a new property (host only)
router.post('/', protect, authorizeRoles('host'), createRoom);

// PUT  /api/rooms/:id  → Update own property (host only, ownership verified)
router.put('/:id', protect, authorizeRoles('host'), updateRoom);

// DELETE /api/rooms/:id → Delete own property (host only, ownership verified)
router.delete('/:id', protect, authorizeRoles('host'), deleteRoom);

module.exports = router;
