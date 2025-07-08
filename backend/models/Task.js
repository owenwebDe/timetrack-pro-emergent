// backend/models/Task.js - Updated with organization support
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  organizationId: {
    type: String,
    required: true,
    // References Organization.id - all tasks must belong to an organization
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  project_id: {
    type: String,
    required: true,
    // Must be a project within the same organization
  },
  assignee_id: {
    type: String,
    required: true,
    // Must be a user within the same organization
  },
  status: {
    type: String,
    enum: [
      "todo",
      "in_progress",
      "in_review",
      "completed",
      "cancelled",
      "blocked",
    ],
    default: "todo",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  tags: [
    {
      type: String,
      trim: true,
      maxlength: 30,
    },
  ],
  estimatedHours: {
    type: Number,
    min: 0,
    default: 0,
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0,
  },
  billableHours: {
    type: Number,
    min: 0,
    default: 0,
  },
  hourlyRate: {
    type: Number,
    min: 0,
    default: 0,
  },
  totalAmount: {
    type: Number,
    min: 0,
    default: 0,
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function (dueDate) {
        return !dueDate || dueDate >= new Date();
      },
      message: "Due date cannot be in the past",
    },
  },
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  blockedReason: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  dependencies: [
    {
      type: String, // Task IDs that must be completed before this task
    },
  ],
  watchers: [
    {
      type: String, // User IDs who want to be notified of changes
    },
  ],
  customFields: {
    // Organization-specific custom fields
    type: Map,
    of: String,
  },
  attachments: [
    {
      filename: String,
      fileUrl: String,
      fileSize: Number,
      uploadedBy: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  comments: [
    {
      id: String,
      userId: String,
      content: String,
      createdAt: { type: Date, default: Date.now },
      editedAt: Date,
    },
  ],
  timeTracking: {
    isActive: { type: Boolean, default: false },
    activeEntryId: String,
    totalTracked: { type: Number, default: 0 }, // in seconds
    lastStarted: Date,
  },
  recurrence: {
    isRecurring: { type: Boolean, default: false },
    pattern: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
    },
    interval: { type: Number, min: 1 }, // Every X days/weeks/months/years
    endDate: Date,
    nextDue: Date,
  },
  createdBy: {
    type: String,
    required: true, // User ID within the same organization
  },
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
taskSchema.index({ organizationId: 1, project_id: 1 });
taskSchema.index({ organizationId: 1, assignee_id: 1 });
taskSchema.index({ organizationId: 1, status: 1 });
taskSchema.index({ organizationId: 1, dueDate: 1 });
taskSchema.index({ organizationId: 1, priority: 1, status: 1 });
taskSchema.index({ organizationId: 1, createdAt: -1 });

// Update the updatedAt field before saving
taskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Auto-set status timestamps
taskSchema.pre("save", function (next) {
  // Set startedAt when status changes to in_progress
  if (this.isModified("status")) {
    if (this.status === "in_progress" && !this.startedAt) {
      this.startedAt = new Date();
    }

    // Set completedAt when status changes to completed
    if (this.status === "completed" && !this.completedAt) {
      this.completedAt = new Date();
      // Stop time tracking if active
      if (this.timeTracking.isActive) {
        this.timeTracking.isActive = false;
        this.timeTracking.activeEntryId = null;
      }
    }

    // Clear completedAt if status changes from completed
    if (this.status !== "completed" && this.completedAt) {
      this.completedAt = null;
    }
  }
  next();
});

// Calculate total amount based on billable hours and hourly rate
taskSchema.pre("save", function (next) {
  if (this.isModified("billableHours") || this.isModified("hourlyRate")) {
    this.totalAmount = (this.billableHours || 0) * (this.hourlyRate || 0);
  }
  next();
});

// Virtual for organization
taskSchema.virtual("organization", {
  ref: "Organization",
  localField: "organizationId",
  foreignField: "id",
  justOne: true,
});

// Virtual for project
taskSchema.virtual("project", {
  ref: "Project",
  localField: "project_id",
  foreignField: "id",
  justOne: true,
});

// Virtual for assignee
taskSchema.virtual("assignee", {
  ref: "User",
  localField: "assignee_id",
  foreignField: "id",
  justOne: true,
});

// Virtual for time entries
taskSchema.virtual("timeEntries", {
  ref: "TimeEntry",
  localField: "id",
  foreignField: "task_id",
});

// Virtual for completion percentage (based on time)
taskSchema.virtual("completionPercentage").get(function () {
  if (this.estimatedHours === 0) return 0;
  const actualHours = this.actualHours || 0;
  return Math.min(Math.round((actualHours / this.estimatedHours) * 100), 100);
});

// Virtual for time efficiency
taskSchema.virtual("timeEfficiency").get(function () {
  if (this.estimatedHours === 0) return 100;
  const actualHours = this.actualHours || 0;
  if (actualHours === 0) return 100;
  return Math.round((this.estimatedHours / actualHours) * 100);
});

// Virtual for days until due
taskSchema.virtual("daysUntilDue").get(function () {
  if (!this.dueDate) return null;
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
taskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate || this.status === "completed") return false;
  return new Date() > this.dueDate;
});

// Instance method to check if user has access to task
taskSchema.methods.hasAccess = function (userId) {
  return (
    this.assignee_id === userId ||
    this.createdBy === userId ||
    this.watchers.includes(userId)
  );
};

// Instance method to check if user can manage task
taskSchema.methods.canManage = function (user) {
  // Same organization check
  if (this.organizationId !== user.organizationId) {
    return false;
  }

  // Task assignee, creator, admin, or manager can manage
  return (
    this.assignee_id === user.id ||
    this.createdBy === user.id ||
    user.role === "admin" ||
    user.role === "manager"
  );
};

// Instance method to add watcher
taskSchema.methods.addWatcher = function (userId) {
  if (!this.watchers.includes(userId)) {
    this.watchers.push(userId);
  }
  return this;
};

// Instance method to remove watcher
taskSchema.methods.removeWatcher = function (userId) {
  this.watchers = this.watchers.filter((id) => id !== userId);
  return this;
};

// Instance method to add comment
taskSchema.methods.addComment = function (userId, content) {
  const comment = {
    id: require("crypto").randomBytes(8).toString("hex"),
    userId,
    content: content.trim(),
    createdAt: new Date(),
  };
  this.comments.push(comment);
  return comment;
};

// Instance method to update time tracking
taskSchema.methods.updateTimeTracking = async function () {
  try {
    const TimeEntry = require("./TimeEntry");

    const timeStats = await TimeEntry.aggregate([
      { $match: { task_id: this.id } },
      {
        $group: {
          _id: null,
          totalTime: { $sum: "$duration" },
          billableTime: {
            $sum: {
              $cond: [{ $eq: ["$billable", true] }, "$duration", 0],
            },
          },
        },
      },
    ]);

    if (timeStats.length > 0) {
      this.actualHours = timeStats[0].totalTime / 3600; // Convert seconds to hours
      this.billableHours = timeStats[0].billableTime / 3600;
      this.timeTracking.totalTracked = timeStats[0].totalTime;
    }

    await this.save();
    return this.timeTracking;
  } catch (error) {
    console.error("Error updating task time tracking:", error);
    throw error;
  }
};

// Static method to find tasks in organization
taskSchema.statics.findInOrganization = function (
  organizationId,
  conditions = {}
) {
  return this.find({ organizationId, ...conditions });
};

// Static method to find user's tasks in organization
taskSchema.statics.findUserTasks = function (organizationId, userId) {
  return this.find({
    organizationId,
    $or: [{ assignee_id: userId }, { createdBy: userId }, { watchers: userId }],
  });
};

// Static method to find overdue tasks in organization
taskSchema.statics.findOverdueTasks = function (organizationId) {
  return this.find({
    organizationId,
    dueDate: { $lt: new Date() },
    status: { $nin: ["completed", "cancelled"] },
  });
};

// Static method to get task stats for organization
taskSchema.statics.getOrgStats = function (organizationId) {
  return this.aggregate([
    { $match: { organizationId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalEstimated: { $sum: "$estimatedHours" },
        totalActual: { $sum: "$actualHours" },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);
};

// Static method to find blocked tasks
taskSchema.statics.findBlockedTasks = function (organizationId) {
  return this.find({
    organizationId,
    status: "blocked",
  });
};

// Remove sensitive information from JSON output
taskSchema.methods.toJSON = function () {
  const task = this.toObject();
  // Remove internal fields if needed
  return task;
};

// Safe info for non-assignees
taskSchema.methods.toPublicJSON = function () {
  return {
    id: this.id,
    title: this.title,
    description: this.description,
    project_id: this.project_id,
    assignee_id: this.assignee_id,
    status: this.status,
    priority: this.priority,
    category: this.category,
    tags: this.tags,
    dueDate: this.dueDate,
    completionPercentage: this.completionPercentage,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Task", taskSchema);
