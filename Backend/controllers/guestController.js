const mongoose = require('mongoose');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const bcrypt = require('bcryptjs');

// =============================================================================
// PROPERTY DISCOVERY, SEARCH & FILTERING
// =============================================================================

/**
 * @desc    Get available properties for guests with search, filters & date checking
 * @route   GET /api/guest/properties
 * @access  Public / Guest
 */
const getGuestProperties = async (req, res) => {
  try {
    const {
      location,
      propertyType,
      type,
      minPrice,
      maxPrice,
      price,
      guests,
      guests_filter,
      bedrooms,
      beds,
      amenity,
      rating,
      checkIn,
      checkOut,
      checkin,
      checkout,
      sortBy,
    } = req.query;

    const query = {};

    // Only show Available properties by default
    query.status = 'Available';

    // 1. Search by Location or Property Name
    const dest = location || req.query.destination;
    if (dest && dest.trim() !== '') {
      const reg = new RegExp(dest.trim(), 'i');
      query.$or = [{ location: reg }, { name: reg }];
    }

    // 2. Filter by Property Type
    const propType = propertyType || type;
    if (propType && propType.trim() !== '') {
      query.propertyType = { $regex: propType.trim(), $options: 'i' };
    }

    // 3. Price Filter (numeric or preset string)
    let minP = minPrice ? Number(minPrice) : null;
    let maxP = maxPrice ? Number(maxPrice) : null;

    if (price) {
      if (price === 'budget') {
        maxP = 10000;
      } else if (price === 'mid') {
        minP = 10000;
        maxP = 25000;
      } else if (price === 'premium') {
        minP = 25000;
        maxP = 50000;
      } else if (price === 'luxury') {
        minP = 50000;
      }
    }

    if (minP !== null || maxP !== null) {
      query.pricePerNight = {};
      if (minP !== null && !isNaN(minP)) query.pricePerNight.$gte = minP;
      if (maxP !== null && !isNaN(maxP)) query.pricePerNight.$lte = maxP;
    }

    // 4. Capacity Filter (guests)
    const guestCapacity = guests || guests_filter;
    if (guestCapacity) {
      if (typeof guestCapacity === 'string' && guestCapacity.includes('-')) {
        const parts = guestCapacity.split('-');
        query.guests = { $gte: Number(parts[0]) };
      } else if (typeof guestCapacity === 'string' && guestCapacity.includes('+')) {
        const val = Number(guestCapacity.replace('+', ''));
        query.guests = { $gte: val };
      } else if (!isNaN(Number(guestCapacity))) {
        query.guests = { $gte: Number(guestCapacity) };
      }
    }

    // 5. Bedrooms / Beds Filter
    const bedVal = bedrooms || beds;
    if (bedVal) {
      if (typeof bedVal === 'string' && bedVal.includes('+')) {
        const val = Number(bedVal.replace('+', ''));
        query.bedrooms = { $gte: val };
      } else if (!isNaN(Number(bedVal))) {
        query.bedrooms = { $gte: Number(bedVal) };
      }
    }

    // 6. Amenities Filter
    if (amenity && amenity.trim() !== '') {
      query.amenities = { $regex: amenity.trim(), $options: 'i' };
    }

    // 7. Availability Date Range Filter
    const startDate = checkIn || checkin;
    const endDate = checkOut || checkout;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        // Find rooms with conflicting confirmed bookings
        const conflictingBookings = await Booking.find({
          status: 'Confirmed',
          checkIn: { $lt: end },
          checkOut: { $gt: start },
        }).select('room');

        const bookedRoomIds = conflictingBookings.map((b) => b.room);
        if (bookedRoomIds.length > 0) {
          query._id = { $nin: bookedRoomIds };
        }
      }
    }

    // Sorting options
    let sortObj = { createdAt: -1 };
    if (sortBy === 'price-asc') sortObj = { pricePerNight: 1 };
    if (sortBy === 'price-desc') sortObj = { pricePerNight: -1 };
    if (sortBy === 'newest') sortObj = { createdAt: -1 };

    // Execute room query
    let rooms = await Room.find(query)
      .sort(sortObj)
      .populate('owner', 'name avatar')
      .lean();

    // Batch aggregate ratings to avoid N+1 queries
    const roomIds = rooms.map((r) => r._id);
    let statsMap = new Map();

    if (roomIds.length > 0) {
      const ratingStats = await Review.aggregate([
        { $match: { room: { $in: roomIds } } },
        {
          $group: {
            _id: '$room',
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]);

      ratingStats.forEach((stat) => {
        statsMap.set(stat._id.toString(), {
          avgRating: Number(stat.avgRating.toFixed(1)),
          count: stat.count,
        });
      });
    }

    const minRating = rating && rating !== 'any' ? Number(rating) : 0;

    let finalRooms = rooms.map((room) => {
      const stat = statsMap.get(room._id.toString());
      return {
        ...room,
        rating: stat ? stat.avgRating : 4.8,
        reviewCount: stat ? stat.count : 0,
      };
    });

    // Apply minimum rating filter
    if (minRating > 0 && !isNaN(minRating)) {
      finalRooms = finalRooms.filter((r) => r.rating >= minRating);
    }

    if (sortBy === 'rating') {
      finalRooms.sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === 'reviews') {
      finalRooms.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return res.status(200).json({
      success: true,
      count: finalRooms.length,
      data: finalRooms,
    });
  } catch (error) {
    console.error('GetGuestProperties Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching available properties',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single property detail with owner info and reviews
 * @route   GET /api/guest/properties/:id
 * @access  Public / Guest
 */
const getGuestPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format',
      });
    }

    const room = await Room.findById(id).populate('owner', 'name email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Fetch reviews for this room
    const reviews = await Review.find({ room: id })
      .populate('guest', 'name avatar')
      .sort({ createdAt: -1 });

    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : 4.8;

    return res.status(200).json({
      success: true,
      data: {
        ...room.toObject(),
        rating: avgRating,
        reviewCount,
        reviews,
      },
    });
  } catch (error) {
    console.error('GetGuestPropertyById Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching property details',
      error: error.message,
    });
  }
};

// =============================================================================
// WISHLIST MANAGEMENT
// =============================================================================

/**
 * @desc    Get logged-in guest's saved wishlist properties
 * @route   GET /api/guest/wishlist
 * @access  Protected (Guest)
 */
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate({
      path: 'wishlist',
      populate: { path: 'owner', select: 'name avatar' },
    }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const wishlistRooms = user.wishlist || [];
    const roomIds = wishlistRooms.map((r) => r._id);

    let statsMap = new Map();
    if (roomIds.length > 0) {
      const ratingStats = await Review.aggregate([
        { $match: { room: { $in: roomIds } } },
        {
          $group: {
            _id: '$room',
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]);

      ratingStats.forEach((stat) => {
        statsMap.set(stat._id.toString(), {
          avgRating: Number(stat.avgRating.toFixed(1)),
          count: stat.count,
        });
      });
    }

    const finalWishlist = wishlistRooms.map((room) => {
      const stat = statsMap.get(room._id.toString());
      return {
        ...room,
        rating: stat ? stat.avgRating : 4.8,
        reviewCount: stat ? stat.count : 0,
      };
    });

    return res.status(200).json({
      success: true,
      count: finalWishlist.length,
      data: finalWishlist,
    });
  } catch (error) {
    console.error('GetWishlist Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving wishlist',
    });
  }
};

/**
 * @desc    Add property to guest's wishlist
 * @route   POST /api/guest/wishlist/:propertyId
 * @access  Protected (Guest)
 */
const addToWishlist = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format',
      });
    }

    const room = await Room.findById(propertyId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $addToSet: { wishlist: propertyId } },
      { new: true }
    ).select('wishlist').lean();

    return res.status(200).json({
      success: true,
      message: 'Property added to wishlist',
      data: user ? user.wishlist : [],
    });
  } catch (error) {
    console.error('AddToWishlist Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating wishlist',
    });
  }
};

/**
 * @desc    Remove property from guest's wishlist
 * @route   DELETE /api/guest/wishlist/:propertyId
 * @access  Protected (Guest)
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $pull: { wishlist: propertyId } },
      { new: true }
    ).select('wishlist').lean();

    return res.status(200).json({
      success: true,
      message: 'Property removed from wishlist',
      data: user ? user.wishlist : [],
    });
  } catch (error) {
    console.error('RemoveFromWishlist Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while removing from wishlist',
    });
  }
};

// =============================================================================
// BOOKING SYSTEM & VALIDATION
// =============================================================================

/**
 * @desc    Create a new booking with strict server-side validation & pricing calculation
 * @route   POST /api/guest/bookings
 * @access  Protected (Guest)
 */
const createBooking = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, guests, cnic, specialRequests, paymentMethod } = req.body;

    // ── 1. Required Field Validation ──────────────────────────────────────────
    if (!roomId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields: roomId, checkIn, checkOut, guests',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format',
      });
    }

    // ── 2. Date Validation ───────────────────────────────────────────────────
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check-in or check-out date format',
      });
    }

    // Ensure checkIn date is not in the past (midnight comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInMidnight = new Date(checkInDate);
    checkInMidnight.setHours(0, 0, 0, 0);

    if (checkInMidnight < today) {
      return res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past',
      });
    }

    // Ensure checkOut is strictly after checkIn
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be strictly after check-in date',
      });
    }

    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (nights < 1) {
      return res.status(400).json({
        success: false,
        message: 'Booking must be for at least 1 night',
      });
    }

    // ── 3. Guests Count Validation ───────────────────────────────────────────
    const guestCount = Number(guests);
    if (isNaN(guestCount) || guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Number of guests must be at least 1',
      });
    }

    // ── 4. Property Existence & Capacity Validation ───────────────────────────
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    if (room.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `This property is currently marked as ${room.status} and cannot be booked`,
      });
    }

    if (guestCount > room.guests) {
      return res.status(400).json({
        success: false,
        message: `This property accommodates a maximum of ${room.guests} guests. Requested: ${guestCount}`,
      });
    }

    // Host Availability Window Check
    if (room.availableFrom && checkInDate < new Date(room.availableFrom)) {
      return res.status(400).json({
        success: false,
        message: `This property is only available from ${new Date(room.availableFrom).toISOString().split('T')[0]} onwards.`,
      });
    }

    if (room.availableTo && checkOutDate > new Date(room.availableTo)) {
      return res.status(400).json({
        success: false,
        message: `This property is only available up to ${new Date(room.availableTo).toISOString().split('T')[0]}.`,
      });
    }

    // ── 5. Date Conflict Validation (Overlap Check) ───────────────────────────
    // Overlap condition: existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn
    const conflictingBooking = await Booking.findOne({
      room: roomId,
      status: 'Confirmed',
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate },
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'This property is already booked for the selected dates. Please select different dates.',
      });
    }

    // ── 6. Price Calculation (ALWAYS Calculated Server-Side) ──────────────────
    // Never trust total price sent from frontend
    const nightlyTotal = nights * room.pricePerNight;
    const cleaningFee = 3500;
    const serviceFee = 4200;
    const totalPrice = nightlyTotal + cleaningFee + serviceFee;

    // Generate unique reference code e.g. #VEY-89421
    const refCode = `VEY-${Math.floor(10000 + Math.random() * 90000)}`;

    // ── 7. Create Booking Document ────────────────────────────────────────────
    const booking = await Booking.create({
      guest: req.user.userId, // Authenticated guest from JWT
      room: room._id,
      host: room.owner,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights,
      guests: guestCount,
      pricePerNight: room.pricePerNight,
      cleaningFee,
      serviceFee,
      totalPrice,
      status: 'Confirmed',
      cnic: cnic ? String(cnic).trim() : '',
      specialRequests: specialRequests ? String(specialRequests).trim() : '',
      paymentMethod: ['card', 'wallet', 'bank'].includes(paymentMethod) ? paymentMethod : 'card',
      referenceCode: refCode,
    });

    // Mark room status as 'Booked' upon confirmation
    room.status = 'Booked';
    await room.save();

    await booking.populate([
      { path: 'room', select: 'name location propertyType image pricePerNight' },
      { path: 'host', select: 'name email' },
    ]);

    return res.status(201).json({
      success: true,
      message: 'Booking created and confirmed successfully',
      data: booking,
    });
  } catch (error) {
    console.error('CreateBooking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
      error: error.message,
    });
  }
};

/**
 * @desc    Get ONLY the logged-in guest's bookings
 * @route   GET /api/guest/bookings
 * @access  Protected (Guest)
 */
const getGuestBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { guest: req.user.userId };

    if (status && ['Confirmed', 'Completed', 'Canceled'].includes(status)) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .populate('room', 'name location propertyType image pricePerNight guests bedrooms')
      .populate('host', 'name email');

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('GetGuestBookings Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving your bookings',
    });
  }
};

/**
 * @desc    Get single booking details for logged-in guest
 * @route   GET /api/guest/bookings/:id
 * @access  Protected (Guest)
 */
const getGuestBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format',
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      guest: req.user.userId, // Strictly restrict to own booking
    })
      .populate('room')
      .populate('host', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('GetGuestBookingById Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving booking details',
    });
  }
};

/**
 * @desc    Cancel an upcoming booking for logged-in guest
 * @route   PATCH /api/guest/bookings/:id/cancel
 * @access  Protected (Guest)
 */
const cancelGuestBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format',
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      guest: req.user.userId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied',
      });
    }

    if (booking.status === 'Canceled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already canceled',
      });
    }

    booking.status = 'Canceled';
    await booking.save();

    // Revert room status to 'Available' if no other active confirmed bookings exist
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const otherActiveBookings = await Booking.find({
      room: booking.room,
      _id: { $ne: booking._id },
      status: 'Confirmed',
      checkOut: { $gt: today },
    });
    if (otherActiveBookings.length === 0) {
      await Room.findByIdAndUpdate(booking.room, { status: 'Available' });
    }

    await booking.populate('room', 'name location image');

    return res.status(200).json({
      success: true,
      message: 'Booking canceled successfully',
      data: booking,
    });
  } catch (error) {
    console.error('CancelGuestBooking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while canceling booking',
    });
  }
};

// =============================================================================
// GUEST PROFILE & SECURITY MANAGEMENT
// =============================================================================

/**
 * @desc    Update guest profile fields
 * @route   PUT /api/guest/profile
 * @access  Protected (Guest)
 */
const updateGuestProfile = async (req, res) => {
  try {
    const { name, phone, avatar, cnic, city, bio } = req.body;

    // Prevent security escalations
    if (req.body.role !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your account role.',
      });
    }

    if (req.body.email !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'Email updates are not permitted through this endpoint.',
      });
    }

    if (req.body.password !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'Password updates are not permitted through this endpoint.',
      });
    }

    const updates = {};
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters',
        });
      }
      updates.name = name.trim();
    }

    if (phone !== undefined) updates.phone = String(phone).trim();
    if (avatar !== undefined) updates.avatar = String(avatar).trim();
    if (cnic !== undefined) updates.cnic = String(cnic).trim();
    if (city !== undefined) updates.city = String(city).trim();
    if (bio !== undefined) updates.bio = String(bio).trim();

    const updatedUser = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.toPublicJSON(),
    });
  } catch (error) {
    console.error('UpdateGuestProfile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
    });
  }
};



// =============================================================================
// REVIEWS & RATINGS
// =============================================================================

/**
 * @desc    Submit a review for a property
 * @route   POST /api/guest/reviews
 * @access  Protected (Guest)
 */
const createReview = async (req, res) => {
  try {
    const { roomId, rating, comment } = req.body;

    if (!roomId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: roomId, rating, comment',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format',
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5',
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Prevent duplicate review for the same room by the same guest
    const existingReview = await Review.findOne({
      guest: req.user.userId,
      room: roomId,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a review for this property',
      });
    }

    const review = await Review.create({
      guest: req.user.userId,
      room: roomId,
      rating: numRating,
      comment: String(comment).trim(),
    });

    await review.populate('guest', 'name avatar');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    console.error('CreateReview Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting review',
    });
  }
};

/**
 * @desc    Get reviews for a property
 * @route   GET /api/guest/reviews/room/:roomId
 * @access  Public / Guest
 */
const getRoomReviews = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format',
      });
    }

    const reviews = await Review.find({ room: roomId })
      .sort({ createdAt: -1 })
      .populate('guest', 'name avatar');

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error('GetRoomReviews Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching room reviews',
    });
  }
};

module.exports = {
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
  createReview,
  getRoomReviews,
};
