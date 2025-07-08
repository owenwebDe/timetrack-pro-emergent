// backend/models/Organization.js - SIMPLIFIED VERSION without problematic pre-save middleware
const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
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
    maxlength: 500,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    // Will be set manually in the auth route
  },
  adminId: {
    type: String,
    required: true,
    // User ID of the organization admin (creator)
  },
  industry: {
    type: String,
    trim: true,
  },
  size: {
    type: String,
    enum: ["1-5", "6-15", "16-50", "51-100", "100+"],
    default: "1-5",
  },
  timezone: {
    type: String,
    default: "UTC",
  },
  currency: {
    type: String,
    default: "USD",
    enum: ["USD", "EUR", "GBP", "CAD", "AUD"],
  },
  logo: {
    type: String, // Base64 encoded image or URL
    default: null,
  },
  settings: {
    // Workspace-wide settings
    general: {
      allowPublicSignup: { type: Boolean, default: false },
      requireEmailVerification: { type: Boolean, default: true },
      allowSSOLogin: { type: Boolean, default: false },
    },
    timeTracking: {
      automaticTimeTracking: { type: Boolean, default: true },
      screenshotsEnabled: { type: Boolean, default: true },
      screenshotFrequency: { type: Number, default: 10 }, // minutes
      activityLevelTracking: { type: Boolean, default: true },
      manualTimeEntry: { type: Boolean, default: true },
      idleTimeDetection: { type: Boolean, default: true },
      idleTimeLimit: { type: Number, default: 15 }, // minutes
    },
    projects: {
      allowMembersToCreateProjects: { type: Boolean, default: false },
      requireProjectApproval: { type: Boolean, default: false },
      defaultProjectVisibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
      },
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      slackIntegration: { type: Boolean, default: false },
      webhookNotifications: { type: Boolean, default: false },
    },
    security: {
      passwordPolicy: {
        minLength: { type: Number, default: 6 },
        requireUppercase: { type: Boolean, default: false },
        requireNumbers: { type: Boolean, default: false },
        requireSymbols: { type: Boolean, default: false },
      },
      sessionTimeout: { type: Number, default: 24 }, // hours
      twoFactorRequired: { type: Boolean, default: false },
    },
  },
  billing: {
    plan: {
      type: String,
      enum: ["free", "starter", "professional", "enterprise"],
      default: "free",
    },
    maxUsers: {
      type: Number,
      default: 5, // Free plan limit
    },
    maxProjects: {
      type: Number,
      default: 3, // Free plan limit
    },
    features: {
      advancedReporting: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      integrations: { type: Boolean, default: false },
      customBranding: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    billingEmail: {
      type: String,
      default: null,
    },
  },
  stats: {
    totalUsers: { type: Number, default: 1 }, // Starts with admin
    activeUsers: { type: Number, default: 1 },
    totalProjects: { type: Number, default: 0 },
    totalTimeTracked: { type: Number, default: 0 }, // in seconds
    lastActivity: { type: Date, default: Date.now },
  },
  isActive: {
    type: Boolean,
    default: true,
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

// Simple pre-save hook to update the updatedAt field only
organizationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for full organization info
organizationSchema.virtual("fullInfo").get(function () {
  return {
    id: this.id,
    name: this.name,
    slug: this.slug,
    description: this.description,
    size: this.size,
    industry: this.industry,
    plan: this.billing.plan,
    userCount: this.stats.totalUsers,
    projectCount: this.stats.totalProjects,
  };
});

// Instance method to check if organization can add more users
organizationSchema.methods.canAddUsers = function (additionalUsers = 1) {
  return this.stats.totalUsers + additionalUsers <= this.billing.maxUsers;
};

// Instance method to check if organization can add more projects
organizationSchema.methods.canAddProjects = function (additionalProjects = 1) {
  return (
    this.stats.totalProjects + additionalProjects <= this.billing.maxProjects
  );
};

// Instance method to update stats
organizationSchema.methods.updateStats = async function () {
  try {
    const User = require("./User");
    const Project = require("./Project");
    const TimeEntry = require("./TimeEntry");

    const [userCount, activeUserCount, projectCount, totalTime] =
      await Promise.all([
        User.countDocuments({ organizationId: this.id }),
        User.countDocuments({ organizationId: this.id, isActive: true }),
        Project.countDocuments({ organizationId: this.id }),
        TimeEntry.aggregate([
          { $match: { organizationId: this.id } },
          { $group: { _id: null, total: { $sum: "$duration" } } },
        ]),
      ]);

    this.stats.totalUsers = userCount;
    this.stats.activeUsers = activeUserCount;
    this.stats.totalProjects = projectCount;
    this.stats.totalTimeTracked = totalTime[0]?.total || 0;
    this.stats.lastActivity = new Date();

    await this.save();
    return this.stats;
  } catch (error) {
    console.error("Error updating organization stats:", error);
    throw error;
  }
};

// Static method to get organization by slug
organizationSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

// Static method to get organization with user count check
organizationSchema.statics.findWithUserLimit = function (orgId) {
  return this.findOne({ id: orgId, isActive: true });
};

// Remove sensitive information from JSON output
organizationSchema.methods.toJSON = function () {
  const org = this.toObject();
  delete org.billing.subscriptionId;
  delete org.settings.security;
  return org;
};

// Safe public info for non-members
organizationSchema.methods.toPublicJSON = function () {
  return {
    id: this.id,
    name: this.name,
    slug: this.slug,
    description: this.description,
    logo: this.logo,
    industry: this.industry,
    size: this.size,
    plan: this.billing.plan,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Organization", organizationSchema);
