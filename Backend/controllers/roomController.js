const mongoose = require('mongoose');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

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
  'images',
  'status',
  'availableFrom',
  'availableTo',
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
    const rooms = await Room.find({ owner: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all confirmed bookings for this host where checkOut > today (active or upcoming bookings)
    const activeBookings = await Booking.find({
      host: req.user.userId,
      status: 'Confirmed',
      checkOut: { $gt: today },
    }).select('room').lean();

    const bookedRoomIds = new Set(activeBookings.map((b) => b.room.toString()));

    const roomsWithComputedStatus = rooms.map((roomObj) => {
      if (roomObj.status !== 'Unavailable' && (bookedRoomIds.has(roomObj._id.toString()) || roomObj.status === 'Booked')) {
        roomObj.status = 'Booked';
      }
      return roomObj;
    });

    return res.status(200).json({
      success: true,
      count: roomsWithComputedStatus.length,
      data: roomsWithComputedStatus,
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

    // Process images (min 5, max 15) & primary image cover
    if (allowedData.images && Array.isArray(allowedData.images)) {
      if (allowedData.images.length < 5 || allowedData.images.length > 15) {
        return res.status(400).json({
          success: false,
          message: `Validation failed: Property must have between 5 and 15 images. Provided: ${allowedData.images.length}`,
        });
      }
      allowedData.image = allowedData.images[0];
    } else if (allowedData.image && !allowedData.images) {
      allowedData.images = Array(5).fill(allowedData.image);
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

    if (updateData.images && Array.isArray(updateData.images)) {
      if (updateData.images.length < 5 || updateData.images.length > 15) {
        return res.status(400).json({
          success: false,
          message: `Validation failed: Property must have between 5 and 15 images. Provided: ${updateData.images.length}`,
        });
      }
      updateData.image = updateData.images[0];
    } else if (updateData.image && !updateData.images) {
      updateData.images = Array(5).fill(updateData.image);
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

// =============================================================================
// @desc    Get room availability schedule & booked date ranges
// @route   GET /api/rooms/:id/availability
// @access  Public
// =============================================================================
const getRoomAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format',
      });
    }

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Get all active confirmed bookings for this room
    const bookings = await Booking.find({
      room: id,
      status: 'Confirmed',
    })
      .select('checkIn checkOut nights referenceCode')
      .sort({ checkIn: 1 });

    const bookedDates = bookings.map((b) => ({
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      nights: b.nights,
    }));

    let isAvailable = room.status === 'Available';
    let availabilityCheck = null;

    if (checkIn && checkOut) {
      const reqStart = new Date(checkIn);
      const reqEnd = new Date(checkOut);

      if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid check-in or check-out date format',
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const reqStartMidnight = new Date(reqStart);
      reqStartMidnight.setHours(0, 0, 0, 0);

      let available = true;
      let reason = null;

      if (reqStartMidnight < today) {
        available = false;
        reason = 'Check-in date cannot be in the past.';
      } else if (reqEnd <= reqStart) {
        available = false;
        reason = 'Check-out date must be strictly after check-in date.';
      } else if (room.status !== 'Available') {
        available = false;
        reason = `Property is currently marked as ${room.status}.`;
      } else if (room.availableFrom && reqStart < new Date(room.availableFrom)) {
        available = false;
        reason = `Property is not available before ${new Date(room.availableFrom).toISOString().split('T')[0]}.`;
      } else if (room.availableTo && reqEnd > new Date(room.availableTo)) {
        available = false;
        reason = `Property is not available after ${new Date(room.availableTo).toISOString().split('T')[0]}.`;
      } else {
        // Overlap check: existing.checkIn < reqEnd AND existing.checkOut > reqStart
        const conflict = bookings.find(
          (b) => new Date(b.checkIn) < reqEnd && new Date(b.checkOut) > reqStart
        );
        if (conflict) {
          available = false;
          reason = 'Selected dates overlap with an existing confirmed booking.';
        }
      }

      availabilityCheck = {
        checkIn: reqStart,
        checkOut: reqEnd,
        nights: Math.ceil((reqEnd.getTime() - reqStart.getTime()) / (1000 * 3600 * 24)),
        available,
        reason,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        roomId: room._id,
        roomName: room.name,
        status: room.status,
        availableFrom: room.availableFrom,
        availableTo: room.availableTo,
        bookedDates,
        availabilityCheck,
      },
    });
  } catch (error) {
    console.error('GetRoomAvailability Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching property availability',
      error: error.message,
    });
  }
};

// =============================================================================
// @desc    Get all bookings for properties owned by authenticated host
// @route   GET /api/host/bookings
// @access  Protected (Host only)
// =============================================================================
const getHostBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ host: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('room', 'name location propertyType image pricePerNight')
      .populate('guest', 'name email avatar phone cnic')
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('GetHostBookings Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching host bookings',
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
  getRoomAvailability,
  getHostBookings,
};
