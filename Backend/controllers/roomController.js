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

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching rooms',
      error: error.message
    });
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Public
const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format'
      });
    }

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching the room',
      error: error.message
    });
  }
};

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Public
const createRoom = async (req, res) => {
  try {
    const roomData = { ...req.body };

    // Process amenities if provided
    if (roomData.amenities) {
      roomData.amenities = parseAmenities(roomData.amenities);
    }

    const room = await Room.create(roomData);

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    // Handle Mongoose Validation Errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while creating room',
      error: error.message
    });
  }
};

// @desc    Update a room by ID
// @route   PUT /api/rooms/:id
// @access  Public
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format'
      });
    }

    const updateData = { ...req.body };

    // Process amenities if provided
    if (updateData.amenities) {
      updateData.amenities = parseAmenities(updateData.amenities);
    }

    const room = await Room.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while updating room',
      error: error.message
    });
  }
};

// @desc    Delete a room by ID
// @route   DELETE /api/rooms/:id
// @access  Public
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format'
      });
    }

    const room = await Room.findByIdAndDelete(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      data: { id }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting room',
      error: error.message
    });
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
