const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'user'],
    default: 'user'
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  avatar: {
    type: String, // Base64 encoded image
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      desktop: { type: Boolean, default: true },
      mobile: { type: Boolean, default: true }
    },
    privacy: {
      showActivity: { type: Boolean, default: true },
      showProjects: { type: Boolean, default: true }
    },
    tracking: {
      autostart: { type: Boolean, default: false },
      screenshot: { type: Boolean, default: true },
      keyboardActivity: { type: Boolean, default: true },
      mouseActivity: { type: Boolean, default: true }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);