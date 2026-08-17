const mongoose = require('mongoose');

/**
 * NOTE ON EXISTING DATA:
 * As of the initial ownership migration, there is 1 room document in MongoDB
 * that has no owner (created before ownership was implemented).
 * That document is NOT deleted — it is simply orphaned.
 * To resolve it, manually assign it to a host via a migration script or
 * the MongoDB Atlas UI.  All rooms created after this change will have an owner.
 */

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
        values: ['Apartment', 'House', 'Villa', 'Hotel Room', 'Cabin', 'Chalet', 'Penthouse', 'Lodge'],
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
    images: {
      type: [String],
      required: [true, 'Property images are required (minimum 5, maximum 15)'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 5 && v.length <= 15;
        },
        message: 'Property must have between 5 and 15 images',
      },
    },
    image: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'Booked', 'Unavailable'],
        message: '{VALUE} is not a valid status'
      },
      default: 'Available'
    },
    availableFrom: {
      type: Date,
      default: null
    },
    availableTo: {
      type: Date,
      default: null
    },

    // ── Resource Ownership ────────────────────────────────────────────────────
    // Every room belongs to exactly one Host.
    // This field is ALWAYS set from req.user.userId (the verified JWT).
    // It is NEVER accepted from req.body — the controller strips it out.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Room must have an owner']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Room', roomSchema);
