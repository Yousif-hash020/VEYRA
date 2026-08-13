const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      // Never returned in queries by default
      select: false,
    },

    role: {
      type: String,
      enum: {
        values: ['guest', 'host'],
        message: 'Role must be either "guest" or "host"',
      },
      required: [true, 'Role is required'],
    },

    // Optional profile fields for guests/hosts
    phone: {
      type: String,
      trim: true,
      default: '',
    },

    avatar: {
      type: String,
      trim: true,
      default: '',
    },

    cnic: {
      type: String,
      trim: true,
      default: '',
    },

    city: {
      type: String,
      trim: true,
      default: '',
    },

    bio: {
      type: String,
      trim: true,
      default: '',
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
      },
    ],

    travelPreferences: {
      stayStyle: { type: String, default: '' },
      favoriteDestination: { type: String, default: '' },
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Pre-save Hook: Hash the password before saving to the database
// This runs automatically every time a user document is saved
// ─────────────────────────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if the password field was modified (or is new)
  // This prevents re-hashing an already hashed password on profile updates
  if (!this.isModified('password')) {
    return next();
  }

  // Salt rounds: higher = more secure but slower. 12 is a good production value.
  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// Instance Method: Compare a plain-text password against the stored hash
// Usage: const isMatch = await user.matchPassword(candidatePassword);
// ─────────────────────────────────────────────────────────────────────────────
userSchema.methods.matchPassword = async function (candidatePassword) {
  // this.password is the hashed password stored in MongoDB
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Return a safe, public-facing user object (strips the password)
// Usage: user.toPublicJSON()
// ─────────────────────────────────────────────────────────────────────────────
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone || '',
    avatar: this.avatar || '',
    cnic: this.cnic || '',
    city: this.city || '',
    bio: this.bio || '',
    travelPreferences: this.travelPreferences || { stayStyle: '', favoriteDestination: '' },
    wishlist: this.wishlist || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
