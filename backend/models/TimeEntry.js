const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: String,
    required: true
  },
  project_id: {
    type: String,
    required: true
  },
  task_id: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  is_manual: {
    type: Boolean,
    default: false
  },
  activity_level: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  screenshots: [{
    timestamp: Date,
    image: String, // Base64 encoded image
    activity: Number
  }],
  keyboard_activity: {
    type: Number,
    min: 0,
    default: 0
  },
  mouse_activity: {
    type: Number,
    min: 0,
    default: 0
  },
  applications: [{
    name: String,
    timeSpent: Number, // in seconds
    category: String
  }],
  websites: [{
    url: String,
    timeSpent: Number, // in seconds
    category: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  billable: {
    type: Boolean,
    default: true
  },
  hourlyRate: {
    type: Number,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    min: 0,
    default: 0
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
timeEntrySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate duration when end_time is set
timeEntrySchema.pre('save', function(next) {
  if (this.end_time && this.start_time) {
    this.duration = Math.floor((this.end_time - this.start_time) / 1000);
  }
  next();
});

// Calculate total amount based on duration and hourly rate
timeEntrySchema.pre('save', function(next) {
  if (this.duration && this.hourlyRate) {
    const hours = this.duration / 3600;
    this.totalAmount = hours * this.hourlyRate;
  }
  next();
});

// Add virtual for formatted duration
timeEntrySchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '0h 0m';
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  return `${hours}h ${minutes}m`;
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);