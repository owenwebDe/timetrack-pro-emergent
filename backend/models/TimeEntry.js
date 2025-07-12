// backend/models/TimeEntry.js - ENHANCED with proper validation and organization support
const mongoose = require("mongoose");

const timeEntrySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  organizationId: {
    type: String,
    required: true,
    // References Organization.id - all time entries must belong to an organization
  },
  user_id: {
    type: String,
    required: true,
    // Must be a user within the same organization
  },
  project_id: {
    type: String,
    required: true,
    // Must be a project within the same organization
  },
  task_id: {
    type: String,
    default: null,
    // Optional task within the same organization and project
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: "",
  },
  start_time: {
    type: Date,
    required: true,
    default: Date.now,
  },
  end_time: {
    type: Date,
    default: null,
    validate: {
      validator: function (endTime) {
        return !endTime || endTime > this.start_time;
      },
      message: "End time must be after start time",
    },
  },
  duration: {
    type: Number, // in seconds
    default: 0,
    min: 0,
  },
  billable: {
    type: Boolean,
    default: true,
  },
  hourly_rate: {
    type: Number,
    default: 0,
    min: 0,
  },
  total_amount: {
    type: Number,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP", "CAD", "AUD"],
  },
  is_manual: {
    type: Boolean,
    default: false,
  },
  is_approved: {
    type: Boolean,
    default: false,
  },
  approved_by: {
    type: String,
    default: null,
  },
  approved_at: {
    type: Date,
    default: null,
  },
  activity_level: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  screenshots: [
    {
      timestamp: Date,
      url: String,
      activity_level: Number,
    },
  ],
  notes: {
    type: String,
    maxlength: 1000,
    default: "",
  },
  metadata: {
    // Additional data for tracking
    browser: String,
    os: String,
    ip_address: String,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    client_version: String,
  },
  tags: [
    {
      type: String,
      trim: true,
      maxlength: 50,
    },
  ],
  breaks: [
    {
      start_time: Date,
      end_time: Date,
      duration: Number, // in seconds
      reason: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound indexes for organization-scoped queries
timeEntrySchema.index({ organizationId: 1, user_id: 1 });
timeEntrySchema.index({ organizationId: 1, project_id: 1 });
timeEntrySchema.index({ organizationId: 1, task_id: 1 });
timeEntrySchema.index({ organizationId: 1, start_time: -1 });
timeEntrySchema.index({ organizationId: 1, user_id: 1, start_time: -1 });
timeEntrySchema.index({ organizationId: 1, user_id: 1, end_time: 1 }); // For active entries

// Update the updatedAt field before saving
timeEntrySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate duration if end_time is set
timeEntrySchema.pre("save", function (next) {
  if (this.end_time && this.start_time) {
    const durationMs = this.end_time - this.start_time;
    this.duration = Math.round(durationMs / 1000); // Convert to seconds
  }
  next();
});

// Calculate total amount based on duration and hourly rate
timeEntrySchema.pre("save", function (next) {
  if (this.duration > 0 && this.hourly_rate > 0 && this.billable) {
    const hours = this.duration / 3600;
    this.total_amount = hours * this.hourly_rate;
  } else {
    this.total_amount = 0;
  }
  next();
});

// Virtual for organization
timeEntrySchema.virtual("organization", {
  ref: "Organization",
  localField: "organizationId",
  foreignField: "id",
  justOne: true,
});

// Virtual for user
timeEntrySchema.virtual("user", {
  ref: "User",
  localField: "user_id",
  foreignField: "id",
  justOne: true,
});

// Virtual for project
timeEntrySchema.virtual("project", {
  ref: "Project",
  localField: "project_id",
  foreignField: "id",
  justOne: true,
});

// Virtual for task
timeEntrySchema.virtual("task", {
  ref: "Task",
  localField: "task_id",
  foreignField: "id",
  justOne: true,
});

// Virtual for formatted duration
timeEntrySchema.virtual("formattedDuration").get(function () {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  return `${hours
    .toString()
    .padStart(
      2,
      "0"
    )}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
});

// Virtual for hours decimal
timeEntrySchema.virtual("hoursDecimal").get(function () {
  return Math.round((this.duration / 3600) * 100) / 100;
});

// Virtual for is active
timeEntrySchema.virtual("isActive").get(function () {
  return !this.end_time;
});

// Virtual for current duration (for active entries)
timeEntrySchema.virtual("currentDuration").get(function () {
  if (!this.end_time && this.start_time) {
    const now = new Date();
    return Math.round((now - this.start_time) / 1000);
  }
  return this.duration;
});

// Instance method to stop the time entry
timeEntrySchema.methods.stop = function () {
  if (!this.end_time) {
    this.end_time = new Date();
    const durationMs = this.end_time - this.start_time;
    this.duration = Math.round(durationMs / 1000);

    if (this.billable && this.hourly_rate > 0) {
      const hours = this.duration / 3600;
      this.total_amount = hours * this.hourly_rate;
    }
  }
  return this;
};

// Instance method to add break
timeEntrySchema.methods.addBreak = function (startTime, endTime, reason = "") {
  const breakDuration = Math.round((endTime - startTime) / 1000);
  this.breaks.push({
    start_time: startTime,
    end_time: endTime,
    duration: breakDuration,
    reason: reason,
  });

  // Subtract break time from total duration
  this.duration -= breakDuration;
  if (this.duration < 0) this.duration = 0;

  // Recalculate total amount
  if (this.billable && this.hourly_rate > 0) {
    const hours = this.duration / 3600;
    this.total_amount = hours * this.hourly_rate;
  }

  return this;
};

// Instance method to approve entry
timeEntrySchema.methods.approve = function (approvedBy) {
  this.is_approved = true;
  this.approved_by = approvedBy;
  this.approved_at = new Date();
  return this;
};

// Static method to find entries in organization
timeEntrySchema.statics.findInOrganization = function (
  organizationId,
  conditions = {}
) {
  return this.find({ organizationId, ...conditions });
};

// Static method to find user's entries in organization
timeEntrySchema.statics.findUserEntries = function (organizationId, userId) {
  return this.find({ organizationId, user_id: userId });
};

// Static method to find active entries in organization
timeEntrySchema.statics.findActiveEntries = function (organizationId) {
  return this.find({ organizationId, end_time: null });
};

// Static method to get time stats for organization
timeEntrySchema.statics.getOrgStats = function (
  organizationId,
  startDate,
  endDate
) {
  const matchQuery = { organizationId };

  if (startDate || endDate) {
    matchQuery.start_time = {};
    if (startDate) matchQuery.start_time.$gte = new Date(startDate);
    if (endDate) matchQuery.start_time.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalDuration: { $sum: "$duration" },
        totalAmount: { $sum: "$total_amount" },
        entryCount: { $sum: 1 },
        billableTime: {
          $sum: {
            $cond: [{ $eq: ["$billable", true] }, "$duration", 0],
          },
        },
        billableAmount: {
          $sum: {
            $cond: [{ $eq: ["$billable", true] }, "$total_amount", 0],
          },
        },
        avgDuration: { $avg: "$duration" },
        uniqueUsers: { $addToSet: "$user_id" },
        uniqueProjects: { $addToSet: "$project_id" },
      },
    },
    {
      $project: {
        totalHours: { $round: [{ $divide: ["$totalDuration", 3600] }, 2] },
        billableHours: { $round: [{ $divide: ["$billableTime", 3600] }, 2] },
        totalAmount: { $round: ["$totalAmount", 2] },
        billableAmount: { $round: ["$billableAmount", 2] },
        entryCount: 1,
        avgHours: { $round: [{ $divide: ["$avgDuration", 3600] }, 2] },
        userCount: { $size: "$uniqueUsers" },
        projectCount: { $size: "$uniqueProjects" },
      },
    },
  ]);
};

// Static method to get user time stats
timeEntrySchema.statics.getUserStats = function (
  organizationId,
  userId,
  startDate,
  endDate
) {
  const matchQuery = { organizationId, user_id: userId };

  if (startDate || endDate) {
    matchQuery.start_time = {};
    if (startDate) matchQuery.start_time.$gte = new Date(startDate);
    if (endDate) matchQuery.start_time.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalDuration: { $sum: "$duration" },
        totalAmount: { $sum: "$total_amount" },
        entryCount: { $sum: 1 },
        billableTime: {
          $sum: {
            $cond: [{ $eq: ["$billable", true] }, "$duration", 0],
          },
        },
        uniqueProjects: { $addToSet: "$project_id" },
        uniqueTasks: { $addToSet: "$task_id" },
      },
    },
  ]);
};

// Static method to get project time stats
timeEntrySchema.statics.getProjectStats = function (
  organizationId,
  projectId,
  startDate,
  endDate
) {
  const matchQuery = { organizationId, project_id: projectId };

  if (startDate || endDate) {
    matchQuery.start_time = {};
    if (startDate) matchQuery.start_time.$gte = new Date(startDate);
    if (endDate) matchQuery.start_time.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$user_id",
        totalDuration: { $sum: "$duration" },
        totalAmount: { $sum: "$total_amount" },
        entryCount: { $sum: 1 },
        billableTime: {
          $sum: {
            $cond: [{ $eq: ["$billable", true] }, "$duration", 0],
          },
        },
      },
    },
  ]);
};

// Static method to validate time entry data
timeEntrySchema.statics.validateTimeEntry = function (data) {
  const errors = [];

  if (!data.organizationId) {
    errors.push("Organization ID is required");
  }

  if (!data.user_id) {
    errors.push("User ID is required");
  }

  if (!data.project_id) {
    errors.push("Project ID is required");
  }

  if (!data.start_time) {
    errors.push("Start time is required");
  }

  if (data.end_time && data.start_time) {
    if (new Date(data.end_time) <= new Date(data.start_time)) {
      errors.push("End time must be after start time");
    }
  }

  if (data.hourly_rate && data.hourly_rate < 0) {
    errors.push("Hourly rate cannot be negative");
  }

  if (data.duration && data.duration < 0) {
    errors.push("Duration cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Remove sensitive information from JSON output
timeEntrySchema.methods.toJSON = function () {
  const timeEntry = this.toObject();
  // Remove sensitive metadata
  if (timeEntry.metadata) {
    delete timeEntry.metadata.ip_address;
    delete timeEntry.metadata.location;
  }
  return timeEntry;
};

// Safe info for team members
timeEntrySchema.methods.toTeamJSON = function () {
  return {
    id: this.id,
    user_id: this.user_id,
    project_id: this.project_id,
    task_id: this.task_id,
    description: this.description,
    start_time: this.start_time,
    end_time: this.end_time,
    duration: this.duration,
    formattedDuration: this.formattedDuration,
    hoursDecimal: this.hoursDecimal,
    billable: this.billable,
    is_approved: this.is_approved,
    createdAt: this.createdAt,
  };
};

// Public info for reporting
timeEntrySchema.methods.toReportJSON = function () {
  return {
    id: this.id,
    project_id: this.project_id,
    task_id: this.task_id,
    description: this.description,
    start_time: this.start_time,
    end_time: this.end_time,
    duration: this.duration,
    hoursDecimal: this.hoursDecimal,
    billable: this.billable,
    total_amount: this.total_amount,
    currency: this.currency,
    is_approved: this.is_approved,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("TimeEntry", timeEntrySchema);
