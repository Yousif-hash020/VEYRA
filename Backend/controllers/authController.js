const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Generate a JWT token for a user
// ─────────────────────────────────────────────────────────────────────────────
const generateToken = (userId, role) => {
  // The payload is what gets encoded inside the JWT.
  // Keep it small and NEVER include the password.
  const payload = {
    userId,
    role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Validate email format
// ─────────────────────────────────────────────────────────────────────────────
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Validate password strength
// ─────────────────────────────────────────────────────────────────────────────
const isValidPassword = (password) => {
  // At least 8 characters
  return password && password.length >= 8;
};

// =============================================================================
// @route   POST /api/auth/register
// @desc    Register a new user (guest or host)
// @access  Public (no authentication needed)
// =============================================================================
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // ── Validation 1: Check all required fields are present ──────────────────
    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, password, confirmPassword, role',
      });
    }

    // ── Validation 2: Name length ────────────────────────────────────────────
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long',
      });
    }

    // ── Validation 3: Email format ───────────────────────────────────────────
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // ── Validation 4: Password strength ─────────────────────────────────────
    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // ── Validation 5: Passwords must match ──────────────────────────────────
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirm password do not match',
      });
    }

    // ── Validation 6: Role must be guest or host ─────────────────────────────
    const allowedRoles = ['guest', 'host'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "guest" or "host"',
      });
    }

    // ── Validation 7: Check if email already exists in MongoDB ───────────────
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please log in.',
      });
    }

    // ── Create the user ──────────────────────────────────────────────────────
    // Note: we do NOT pass confirmPassword to MongoDB.
    // The password will be automatically hashed by the pre-save hook in User.js
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // plain-text here — the model's pre-save hook hashes it
      role,
    });

    // ── Return success response ──────────────────────────────────────────────
    // We do NOT return the password or issue a token here.
    // The user must explicitly log in to receive a JWT.
    res.status(201).json({
      success: true,
      message: `Account created successfully as ${role}. Please log in.`,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Register Error:', error);

    // Handle Mongoose duplicate key error (email already exists)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

// =============================================================================
// @route   POST /api/auth/login
// @desc    Login with email + password, receive JWT
// @access  Public
// =============================================================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validation: Required fields ──────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // ── Find user by email ───────────────────────────────────────────────────
    // We use .select('+password') because the password field has select: false
    // in the schema. Without this, the password won't be returned.
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      // Use a generic message — do NOT reveal whether the email exists
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ── Compare the submitted password against the stored hash ───────────────
    // bcrypt.compare(plain, hashed) returns true if they match
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ── Generate JWT ─────────────────────────────────────────────────────────
    // The payload contains userId and role — enough to identify the user
    // and authorize role-based access, without exposing sensitive data.
    const token = generateToken(user._id, user.role);

    // ── Send the response ────────────────────────────────────────────────────
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

// =============================================================================
// @route   GET /api/auth/me
// @desc    Get the currently authenticated user's profile
// @access  Protected (requires JWT)
// =============================================================================
const getMe = async (req, res) => {
  try {
    // req.user.userId comes from the protect middleware (decoded from JWT).
    // We NEVER trust a userId from the request body or URL params here.
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve user profile.',
    });
  }
};

// =============================================================================
// @route   PUT /api/auth/me
// @desc    Update the currently authenticated user's own profile
// @access  Protected (requires JWT)
//
// OWNERSHIP RULE:
//   We ONLY update the user identified by req.user.userId (from JWT).
//   The frontend CANNOT change which user gets updated.
//   We also restrict which fields can be changed (e.g., no role change here).
// =============================================================================
const updateMe = async (req, res) => {
  try {
    // ── Determine which fields the user is allowed to update ─────────────────
    // We use a whitelist approach: only permit specific fields.
    // Role and email changes are NOT allowed through this route for security.
    const allowedUpdates = {};

    if (req.body.name !== undefined) {
      const newName = req.body.name.trim();
      if (newName.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long',
        });
      }
      allowedUpdates.name = newName;
    }

    // Prevent role escalation: a guest cannot promote themselves to host
    if (req.body.role !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your role. Contact support if needed.',
      });
    }

    // Prevent email changes through this route (would need email verification)
    if (req.body.email !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'Email changes are not allowed through this endpoint.',
      });
    }

    // Prevent password changes through this route (needs dedicated change-password flow)
    if (req.body.password !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'Use the change-password endpoint to update your password.',
      });
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update. You can update: name',
      });
    }

    // ── Update the user — OWNERSHIP: use req.user.userId from JWT ────────────
    // new: true → returns the updated document
    // runValidators: true → runs schema validators on the update
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId, // ← identity comes from JWT, NOT from the request
      allowedUpdates,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.toPublicJSON(),
    });
  } catch (error) {
    console.error('UpdateMe Error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Could not update profile. Please try again.',
    });
  }
};

// =============================================================================
// @route   POST /api/auth/logout
// @desc    Logout endpoint
// @access  Protected (requires JWT)
//
// NOTE ON LOGOUT WITH JWTs:
//   Because JWTs are stateless, the server does NOT maintain a session.
//   The token lives in the client's localStorage, not on the server.
//
//   True server-side JWT invalidation requires a token blacklist (Redis, DB).
//   For this learning project, logout is handled client-side:
//     localStorage.removeItem('token');
//
//   This endpoint exists to:
//   1. Give the frontend a clean logout API to call.
//   2. Explain the concept in the response.
//   3. In a future implementation, this could blacklist the token.
// =============================================================================
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
    note: 'JWT is stateless. Remove the token from localStorage on the client: localStorage.removeItem("token"). For enhanced security in production, consider using HttpOnly cookies and a server-side token blacklist.',
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  logout,
};
