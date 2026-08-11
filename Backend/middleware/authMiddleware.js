const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// Authentication Middleware
//
// PURPOSE:
//   Protect routes by verifying the JWT sent by the client.
//   If the token is valid, it decodes user info and attaches it to req.user.
//   If invalid or missing, it rejects the request with 401 Unauthorized.
//
// HOW IT WORKS:
//   1. Client sends:  Authorization: Bearer <token>
//   2. We extract the token from that header.
//   3. We verify the token using our JWT_SECRET.
//   4. We attach the decoded payload to req.user = { userId, role }.
//   5. Next middleware/route can now trust req.user.
//
// USAGE:
//   router.get('/me', protect, getMe);
// ─────────────────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // ── Step 1: Extract token from the Authorization header ──────────────────
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // "Bearer eyJhbGciOiJIUzI1NiIsInR..."  →  "eyJhbGciOiJIUzI1NiIsInR..."
      token = authHeader.split(' ')[1];
    }

    // ── Step 2: Reject if no token was provided ──────────────────────────────
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
        hint: 'Include your JWT in the Authorization header: Bearer <token>',
      });
    }

    // ── Step 3: Verify the token ─────────────────────────────────────────────
    // jwt.verify throws if token is invalid or expired
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Expired token
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.',
        });
      }
      // Malformed / tampered token
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Authentication failed.',
      });
    }

    // ── Step 4: Confirm the user still exists in the database ────────────────
    // This handles cases where a user was deleted after their token was issued.
    // We use .select('+password') is NOT used here — we just need the user exists.
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user associated with this token no longer exists.',
      });
    }

    // ── Step 5: Attach user info to the request object ───────────────────────
    // Downstream middleware and route handlers can now use req.user safely.
    // We NEVER attach the password here.
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    // ── Step 6: Continue to the next middleware / route handler ──────────────
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.',
    });
  }
};

module.exports = { protect };
