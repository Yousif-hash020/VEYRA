const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a guest user'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Booking must be associated with a room/property'],
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must be associated with a host owner'],
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    nights: {
      type: Number,
      required: [true, 'Number of nights is required'],
      min: [1, 'Must stay at least 1 night'],
    },
    guests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'Must have at least 1 guest'],
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price per night cannot be negative'],
    },
    cleaningFee: {
      type: Number,
      default: 3500,
    },
    serviceFee: {
      type: Number,
      default: 4200,
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['Confirmed', 'Completed', 'Canceled'],
        message: '{VALUE} is not a valid booking status',
      },
      default: 'Confirmed',
    },
    cnic: {
      type: String,
      trim: true,
      default: '',
    },
    specialRequests: {
      type: String,
      trim: true,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['card', 'wallet', 'bank'],
        message: '{VALUE} is not a valid payment method',
      },
      default: 'card',
    },
    referenceCode: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
