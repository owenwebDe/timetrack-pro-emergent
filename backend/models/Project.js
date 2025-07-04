const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  client: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  budget: {
    type: Number,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  manager: {
    type: String, // User ID
    required: true
  },
  members: [{
    type: String // User IDs
  }],
  tags: [{
    type: String,
    trim: true
  }],
  color: {
    type: String,
    default: '#3B82F6'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  settings: {
    trackTime: { type: Boolean, default: true },
    trackActivity: { type: Boolean, default: true },
    screenshots: { type: Boolean, default: true },
    allowManualTime: { type: Boolean, default: true }
  },
  createdBy: {
    type: String, // User ID
    required: true
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
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add virtual for task count
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: 'id',
  foreignField: 'project_id',
  count: true
});

// Add virtual for total time tracked
projectSchema.virtual('totalTimeTracked', {
  ref: 'TimeEntry',
  localField: 'id',
  foreignField: 'project_id',
  count: true
});

module.exports = mongoose.model('Project', projectSchema);