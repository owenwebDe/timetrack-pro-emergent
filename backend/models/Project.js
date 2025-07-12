// backend/models/Project.js - Updated with organization support
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  organizationId: {
    type: String,
    required: true,
    // References Organization.id - all projects must belong to an organization
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  client: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  status: {
    type: String,
    enum: ["active", "completed", "paused", "cancelled", "archived"],
    default: "active",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  visibility: {
    type: String,
    enum: ["public", "private"], // Within the organization
    default: "public",
  },
  budget: {
    type: Number,
    min: 0,
    default: 0,
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP", "CAD", "AUD"],
  },
  billingType: {
    type: String,
    enum: ["hourly", "fixed", "retainer"],
    default: "hourly",
  },
  hourlyRate: {
    type: Number,
    min: 0,
    default: 0,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    validate: {
      validator: function (endDate) {
        return !endDate || endDate > this.startDate;
      },
      message: "End date must be after start date",
    },
  },
  estimatedHours: {
    type: Number,
    min: 0,
    default: 0,
  },
  manager: {
    type: String, // User ID within the same organization
    required: true,
  },
  members: [
    {
      type: String, // User IDs within the same organization
    },
  ],
  tags: [
    {
      type: String,
      trim: true,
      maxlength: 50,
    },
  ],
  color: {
    type: String,
    default: "#3B82F6",
    validate: {
      validator: function (color) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
      },
      message: "Color must be a valid hex color code",
    },
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  settings: {
    trackTime: { type: Boolean, default: true },
    trackActivity: { type: Boolean, default: true },
    screenshots: { type: Boolean, default: true },
    allowManualTime: { type: Boolean, default: true },
    requireTaskSelection: { type: Boolean, default: false },
    allowOvertime: { type: Boolean, default: true },
    sendNotifications: { type: Boolean, default: true },
  },
  customFields: {
    // Organization-specific custom fields
    type: Map,
    of: String,
  },
  integrations: {
    // Third-party integrations data
    github: {
      repository: String,
      enabled: { type: Boolean, default: false },
    },
    slack: {
      channel: String,
      enabled: { type: Boolean, default: false },
    },
    trello: {
      boardId: String,
      enabled: { type: Boolean, default: false },
    },
  },
  stats: {
    totalTimeTracked: { type: Number, default: 0 }, // in seconds
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    efficiency: { type: Number, default: 0 }, // percentage
    lastActivity: { type: Date, default: Date.now },
  },
  createdBy: {
    type: String, // User ID within the same organization
    required: true,
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
projectSchema.index({ organizationId: 1, status: 1 });
projectSchema.index({ organizationId: 1, manager: 1 });
projectSchema.index({ organizationId: 1, members: 1 });
projectSchema.index({ organizationId: 1, createdAt: -1 });
projectSchema.index({ organizationId: 1, isArchived: 1, status: 1 });

// Update the updatedAt field before saving
projectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure manager is in members array
projectSchema.pre("save", function (next) {
  if (!this.members.includes(this.manager)) {
    this.members.push(this.manager);
  }
  // Remove duplicates
  this.members = [...new Set(this.members)];
  next();
});

// Virtual for organization
projectSchema.virtual("organization", {
  ref: "Organization",
  localField: "organizationId",
  foreignField: "id",
  justOne: true,
});

// Virtual for task count
projectSchema.virtual("taskCount", {
  ref: "Task",
  localField: "id",
  foreignField: "project_id",
  count: true,
});

// Virtual for total time tracked
projectSchema.virtual("totalTimeTracked", {
  ref: "TimeEntry",
  localField: "id",
  foreignField: "project_id",
  count: true,
});

// Virtual for progress percentage
projectSchema.virtual("progress").get(function () {
  if (this.stats.totalTasks === 0) return 0;
  return Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100);
});

// Virtual for budget utilization
projectSchema.virtual("budgetUtilization").get(function () {
  if (this.budget === 0) return 0;
  return Math.round((this.stats.totalEarnings / this.budget) * 100);
});

// Virtual for time utilization (actual vs estimated)
projectSchema.virtual("timeUtilization").get(function () {
  if (this.estimatedHours === 0) return 0;
  const actualHours = this.stats.totalTimeTracked / 3600; // Convert seconds to hours
  return Math.round((actualHours / this.estimatedHours) * 100);
});

// Instance method to check if user has access to project
projectSchema.methods.hasAccess = function (userId) {
  return this.members.includes(userId) || this.manager === userId;
};

// Instance method to check if user can manage project
projectSchema.methods.canManage = function (user) {
  // Same organization check
  if (this.organizationId !== user.organizationId) {
    return false;
  }

  // Project manager or admin can manage
  return this.manager === user.id || user.role === "admin";
};

// Instance method to add member
projectSchema.methods.addMember = function (userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
  }
  return this;
};

// Instance method to remove member
projectSchema.methods.removeMember = function (userId) {
  // Can't remove the manager
  if (userId === this.manager) {
    throw new Error("Cannot remove project manager from members");
  }
  this.members = this.members.filter((id) => id !== userId);
  return this;
};

// Instance method to update stats
projectSchema.methods.updateStats = async function () {
  try {
    const Task = require("./Task");
    const TimeEntry = require("./TimeEntry");

    const [taskStats, timeStats] = await Promise.all([
      Task.aggregate([
        { $match: { project_id: this.id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
          },
        },
      ]),
      TimeEntry.aggregate([
        { $match: { project_id: this.id } },
        {
          $group: {
            _id: null,
            totalTime: { $sum: "$duration" },
            totalEarnings: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    this.stats.totalTasks = taskStats[0]?.total || 0;
    this.stats.completedTasks = taskStats[0]?.completed || 0;
    this.stats.totalTimeTracked = timeStats[0]?.totalTime || 0;
    this.stats.totalEarnings = timeStats[0]?.totalEarnings || 0;
    this.stats.lastActivity = new Date();

    // Calculate efficiency (completed tasks / total time ratio)
    if (this.stats.totalTimeTracked > 0 && this.stats.completedTasks > 0) {
      const hoursTracked = this.stats.totalTimeTracked / 3600;
      this.stats.efficiency = Math.round(
        (this.stats.completedTasks / hoursTracked) * 100
      );
    }

    await this.save();
    return this.stats;
  } catch (error) {
    console.error("Error updating project stats:", error);
    throw error;
  }
};

// Static method to find projects in organization
projectSchema.statics.findInOrganization = function (
  organizationId,
  conditions = {}
) {
  return this.find({ organizationId, isArchived: false, ...conditions });
};

// Static method to find user's projects in organization
projectSchema.statics.findUserProjects = function (organizationId, userId) {
  return this.find({
    organizationId,
    isArchived: false,
    $or: [{ manager: userId }, { members: userId }],
  });
};

// Static method to get project stats for organization
projectSchema.statics.getOrgStats = function (organizationId) {
  return this.aggregate([
    { $match: { organizationId, isArchived: false } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalBudget: { $sum: "$budget" },
        totalEarnings: { $sum: "$stats.totalEarnings" },
      },
    },
  ]);
};

// Remove sensitive information from JSON output
projectSchema.methods.toJSON = function () {
  const project = this.toObject();
  // Remove internal fields if needed
  return project;
};

// Safe info for non-members
projectSchema.methods.toPublicJSON = function () {
  return {
    id: this.id,
    name: this.name,
    description: this.description,
    client: this.client,
    status: this.status,
    priority: this.priority,
    color: this.color,
    startDate: this.startDate,
    endDate: this.endDate,
    manager: this.manager,
    progress: this.progress,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Project", projectSchema);
