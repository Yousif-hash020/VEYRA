// ─────────────────────────────────────────────────────────────────────────────
// Role-Based Authorization Middleware
//
// PURPOSE:
//   After a user is authenticated (via the protect middleware),
//   this middleware checks whether the user's role is allowed to access
//   the specific route.
//
// HOW IT WORKS:
//   authorizeRoles() is a factory function that returns a middleware.
//   It accepts one or more allowed roles as arguments.
//   It reads req.user.role (set by the protect middleware).
//   If the user's role is in the allowed list → allow (next()).
//   If not → reject with 403 Forbidden.
//
// USAGE:
//   // Only hosts can access this route:
//   router.get('/test', protect, authorizeRoles('host'), handler);
//
//   // Both guests and hosts:
//   router.get('/shared', protect, authorizeRoles('guest', 'host'), handler);
//
// IMPORTANT:
//   This middleware MUST come AFTER protect middleware,
//   because it depends on req.user being set.
// ─────────────────────────────────────────────────────────────────────────────
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by the protect middleware
    // If protect wasn't called first, req.user won't exist
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in first.',
      });
    }

    const userRole = req.user.role;

    // Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This route requires role: [${allowedRoles.join(' or ')}]. Your role is: "${userRole}".`,
      });
    }

    // Role is allowed — continue to the route handler
    next();
  };
};

module.exports = { authorizeRoles };
