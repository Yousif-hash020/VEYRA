const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const {
  getGuestProperties,
  getGuestPropertyById,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  createBooking,
  getGuestBookings,
  getGuestBookingById,
  cancelGuestBooking,
  updateGuestProfile,
  changeGuestPassword,
  createReview,
  getRoomReviews,
} = require('../controllers/guestController');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC / GUEST BROWSING ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/guest/test → Debug / verification endpoint
router.get('/test', protect, authorizeRoles('guest'), (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Guest route accessed successfully!',
    authenticatedUser: req.user,
  });
});

// GET /api/guest/properties → Available properties with search & filters
router.get('/properties', getGuestProperties);

// GET /api/guest/properties/:id → Property details with reviews & average rating
router.get('/properties/:id', getGuestPropertyById);

// GET /api/guest/reviews/room/:roomId → Public reviews for a room
router.get('/reviews/room/:roomId', getRoomReviews);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED GUEST ROUTES (Requires JWT + role: "guest")
// ─────────────────────────────────────────────────────────────────────────────

// ── Wishlist APIs ────────────────────────────────────────────────────────────
router.get('/wishlist', protect, authorizeRoles('guest'), getWishlist);
router.post('/wishlist/:propertyId', protect, authorizeRoles('guest'), addToWishlist);
router.delete('/wishlist/:propertyId', protect, authorizeRoles('guest'), removeFromWishlist);

// ── Booking APIs ─────────────────────────────────────────────────────────────
router.post('/bookings', protect, authorizeRoles('guest'), createBooking);
router.get('/bookings', protect, authorizeRoles('guest'), getGuestBookings);
router.get('/bookings/:id', protect, authorizeRoles('guest'), getGuestBookingById);
router.patch('/bookings/:id/cancel', protect, authorizeRoles('guest'), cancelGuestBooking);

// ── Profile & Password APIs ──────────────────────────────────────────────────
router.put('/profile', protect, authorizeRoles('guest'), updateGuestProfile);
router.put('/change-password', protect, authorizeRoles('guest'), changeGuestPassword);

// ── Review Submission ────────────────────────────────────────────────────────
router.post('/reviews', protect, authorizeRoles('guest'), createReview);

module.exports = router;
