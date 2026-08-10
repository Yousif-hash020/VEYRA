const mongoose = require('mongoose');

/**
 * Room Schema Definition
 * Represents property listings matching frontend form fields.
 */
const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true
    },
    propertyType: {
      type: String,
      required: [true, 'Property type is required'],
      enum: {
        values: ['Apartment', 'House', 'Villa', 'Hotel Room'],
        message: '{VALUE} is not a valid property type'
      }
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price per night cannot be negative']
    },
    guests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'Must accommodate at least 1 guest']
    },
    bedrooms: {
      type: Number,
      required: [true, 'Number of bedrooms is required'],
      min: [0, 'Bedrooms cannot be negative']
    },
    beds: {
      type: Number,
      required: [true, 'Number of beds is required'],
      min: [0, 'Beds cannot be negative']
    },
    bathrooms: {
      type: Number,
      required: [true, 'Number of bathrooms is required'],
      min: [0, 'Bathrooms cannot be negative']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    amenities: {
      type: [String],
      required: [true, 'At least one amenity is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Amenities must be a non-empty array of strings'
      }
    },
    image: {
      type: String,
      required: [true, 'Property image URL/path is required'],
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'Booked', 'Unavailable'],
        message: '{VALUE} is not a valid status'
      },
      default: 'Available'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Room', roomSchema);
