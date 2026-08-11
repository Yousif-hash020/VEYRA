const mongoose = require('mongoose');
const Room = require('../models/Room');

/**
 * Helper function to normalize amenities input.
 * Converts comma-separated string to an array of trimmed strings if necessary.
 */
const parseAmenities = (amenities) => {
  if (typeof amenities === 'string') {
    return amenities
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return amenities;
};

// ─────────────────────────────────────────────────────────────────────────────
// WHITELIST: Fields a Host is allowed to set when creating or updating a room.
//
// "owner", "userId", and "_id" are intentionally excluded.
// owner is always stamped from req.user.userId (the verified JWT).
// The frontend cannot override or forge ownership.
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_ROOM_FIELDS = [
  'name',
  'propertyType',
  'location',
  'pricePerNight',
  'guests',
  'bedrooms',
  'beds',
  'bathrooms',
  'description',
  'amenities',
  'image',
  'status',
];

/**
 * Picks only the whitelisted fields from a request body.
 * This ensures "owner", "userId", "_id", etc. can never be
 * injected by the frontend.
 */
const pickAllowedFields = (body) => {
  return ALLOWED_ROOM_FIELDS.reduce((acc, field) => {
    if (body[field] !== undefined) {
      acc[field] = body[field];
    }
    return acc;
  }, {});
};

// =============================================================================
// @desc    Get all rooms (public browse / discovery)
// @route   GET /api/rooms
// @access  Public — anyone (guests, hosts, unauthenticated users) can browse
//
// WHY PUBLIC:
//   Guests need to browse and discover properties listed by all Hosts.
//   This is standard marketplace behaviour (like Airbnb's property listing page).
//   Ownership is NOT the concern here — all published properties are visible.
//
// DIFFERENCE FROM /api/host/properties:
//   This returns ALL rooms from ALL hosts for public discovery.
//   /api/host/properties returns only the authenticated Host's OWN rooms.
// =============================================================================
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .sort({ createdAt: -1 })
      // Populate basic, non-sensitive owner info.
      // We expose: id, name — NOT email, password, or other private fields.
      .populate('owner', 'name');

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching rooms',
      error: error.message,
    });
  }
};

// =============================================================================
// @desc    Get single room by ID (public)
// @route   GET /api/rooms/:id
// @access  Public
// =============================================================================
const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format',
      });
    }

    const room = await Room.findById(id).populate('owner', 'name');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching the room',
      error: error.message,
    });
  }
};

// =============================================================================
// @desc    Get ONLY the authenticated Host's own properties
// @route   GET /api/host/properties
// @access  Protected — host only (protect + authorizeRoles('host'))
//
// OWNERSHIP:
//   Uses req.user.userId (from the verified JWT) to filter.
//   Host A will ONLY receive rooms where owner === Host A's ID.
//   Host B cannot access Host A's properties through this route.
// =============================================================================
const getHostProperties = async (req, res) => {
  try {
    // req.user.userId comes from the verified JWT (set by protect middleware).
    // This is the ONLY source of truth for ownership — never req.body or req.query.
    const rooms = await Room.find({ owner: req.user.userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching your properties',
      error: error.message,
    });
  }
};

// =============================================================================
// @desc    Create a new room
// @route   POST /api/rooms
// @access  Protected — host only (protect + authorizeRoles('host'))
//
// OWNERSHIP:
//   owner is ALWAYS set from req.user.userId.
//   Any "owner" or "userId" sent in req.body is stripped by pickAllowedFields().
//   The frontend cannot forge or override the owner.
// =============================================================================
const createRoom = async (req, res) => {
  try {
    // Strip disallowed fields — owner/userId from the body are silently ignored.
    const allowedData = pickAllowedFields(req.body);

    // Process amenities if provided
    if (allowedData.amenities) {
      allowedData.amenities = parseAmenities(allowedData.amenities);
    }

    // Stamp owner from the verified JWT — this is the ONLY source of ownership.
    const room = await Room.create({
      ...allowedData,
      owner: req.user.userId, // ← JWT, never req.body
    });

    // Populate owner name for the response
    await room.populate('owner', 'name');

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while creating room',
      error: error.message,
    });
  }
};

// =============================================================================
// @desc    Update a room by ID
// @route   PUT /api/rooms/:id
// @access  Protected — host only (protect + authorizeRoles('host'))
//
// OWNERSHIP ENFORCEMENT:
//   1. Find the room matching BOTH _id AND owner === req.user.userId.
//   2. If no match → room does not exist OR belongs to another host → 404.
//   3. Only then apply the update.
//
//   This prevents IDOR: Host A cannot update Host B's room by knowing its ID.
//   The owner field is explicitly excluded from updates.
// =============================================================================
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format',
      });
    }

    // ── Ownership Check ───────────────────────────────────────────────────────
    // We query with BOTH _id AND owner. If the room belongs to another host,
    // findOne returns null — we respond with 404 (we don't reveal "forbidden"
    // to avoid confirming the room's existence to unauthorised callers).
    const room = await Room.findOne({
      _id: id,
      owner: req.user.userId, // ← must match the authenticated host's ID
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or you do not have permission to update it',
      });
    }

    // Strip disallowed fields — owner CANNOT be changed through an update.
    const updateData = pickAllowedFields(req.body);

    if (updateData.amenities) {
      updateData.amenities = parseAmenities(updateData.amenities);
    }

    // Apply the update to the already-verified room document.
    // new: true → returns the updated document.
    // runValidators: true → runs schema validators.
    const updatedRoom = await Room.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name');

    return res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while updating room',
      error: error.message,
    });
  }
};

// =============================================================================
// @desc    Delete a room by ID
// @route   DELETE /api/rooms/:id
// @access  Protected — host only (protect + authorizeRoles('host'))
//
// OWNERSHIP ENFORCEMENT:
//   1. Find room matching BOTH _id AND owner === req.user.userId.
//   2. If no match → room does not exist OR belongs to another host → 404.
//   3. Only then delete.
//
//   Host A cannot delete Host B's property by knowing its MongoDB _id.
// =============================================================================
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format',
      });
    }

    // ── Ownership Check ───────────────────────────────────────────────────────
    const room = await Room.findOne({
      _id: id,
      owner: req.user.userId, // ← must match the authenticated host's ID
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or you do not have permission to delete it',
      });
    }

    // Ownership confirmed — safe to delete.
    await Room.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      data: { id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting room',
      error: error.message,
    });
  }
};

module.exports = {
  getRooms,
  getRoomById,
  getHostProperties,
  createRoom,
  updateRoom,
  deleteRoom,
};
