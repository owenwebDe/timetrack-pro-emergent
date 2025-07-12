// backend/models/User.js - Updated with organization support
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  organizationId: {
    type: String,
    required: true,
    // References Organization.id - all users must belong to an organization
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Global uniqueness across all organizations
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["admin", "manager", "user"],
    default: "user",
    // Roles are scoped within the organization
  },
  department: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  jobTitle: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  avatar: {
    type: String, // Base64 encoded image or URL
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  timezone: {
    type: String,
    default: "UTC",
  },
  language: {
    type: String,
    default: "en",
    enum: ["en", "es", "fr", "de", "pt", "it"],
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      desktop: { type: Boolean, default: true },
      mobile: { type: Boolean, default: true },
      projectUpdates: { type: Boolean, default: true },
      teamActivity: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
    },
    privacy: {
      showActivity: { type: Boolean, default: true },
      showProjects: { type: Boolean, default: true },
      showTimeTracking: { type: Boolean, default: true },
    },
    tracking: {
      autostart: { type: Boolean, default: false },
      screenshot: { type: Boolean, default: true },
      keyboardActivity: { type: Boolean, default: true },
      mouseActivity: { type: Boolean, default: true },
      idleDetection: { type: Boolean, default: true },
      activityTracking: { type: Boolean, default: true },
    },
    dashboard: {
      defaultView: {
        type: String,
        enum: ["overview", "projects", "timetracking"],
        default: "overview",
      },
      showWidgets: { type: Boolean, default: true },
      compactMode: { type: Boolean, default: false },
    },
  },
  permissions: {
    // Organization-specific permissions
    canCreateProjects: { type: Boolean, default: false },
    canManageTeam: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true },
    canManageIntegrations: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },
    canManageBilling: { type: Boolean, default: false },
  },
  workSchedule: {
    hoursPerWeek: { type: Number, default: 40 },
    workDays: {
      type: [String],
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      default: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },
    startTime: { type: String, default: "09:00" }, // HH:MM format
    endTime: { type: String, default: "17:00" }, // HH:MM format
    breakDuration: { type: Number, default: 60 }, // minutes
  },
  billing: {
    hourlyRate: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "USD" },
    isContractor: { type: Boolean, default: false },
  },
  metadata: {
    // Additional data for integrations and customization
    customFields: { type: Map, of: String },
    tags: [{ type: String, trim: true }],
    notes: { type: String, maxlength: 1000 },
  },
  invitedBy: {
    type: String, // User ID who invited this user
    default: null,
  },
  invitedAt: {
    type: Date,
    default: null,
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
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

// Compound index for organization-scoped queries
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, isActive: 1 });
userSchema.index({ organizationId: 1, email: 1 });

// Update the updatedAt field before saving
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Set permissions based on role before saving
userSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    // Set default permissions based on role
    switch (this.role) {
      case "admin":
        this.permissions = {
          canCreateProjects: true,
          canManageTeam: true,
          canViewReports: true,
          canManageIntegrations: true,
          canExportData: true,
          canManageBilling: true,
        };
        break;
      case "manager":
        this.permissions = {
          canCreateProjects: true,
          canManageTeam: true,
          canViewReports: true,
          canManageIntegrations: false,
          canExportData: true,
          canManageBilling: false,
        };
        break;
      case "user":
      default:
        this.permissions = {
          canCreateProjects: false,
          canManageTeam: false,
          canViewReports: true,
          canManageIntegrations: false,
          canExportData: false,
          canManageBilling: false,
        };
        break;
    }
  }
  next();
});

// Virtual for user's organization
userSchema.virtual("organization", {
  ref: "Organization",
  localField: "organizationId",
  foreignField: "id",
  justOne: true,
});

// Virtual for full user info with organization
userSchema.virtual("fullInfo").get(function () {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    jobTitle: this.jobTitle,
    isActive: this.isActive,
    organizationId: this.organizationId,
    permissions: this.permissions,
  };
});

// Instance method to check if user has permission
userSchema.methods.hasPermission = function (permission) {
  return this.permissions[permission] === true;
};

// Instance method to check if user is admin or manager
userSchema.methods.isManagerOrAdmin = function () {
  return ["admin", "manager"].includes(this.role);
};

// Instance method to check if user is admin
userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

// Instance method to check if user can manage another user
userSchema.methods.canManageUser = function (targetUser) {
  // Same organization check
  if (this.organizationId !== targetUser.organizationId) {
    return false;
  }

  // Admin can manage everyone except themselves
  if (this.role === "admin" && this.id !== targetUser.id) {
    return true;
  }

  // Manager can manage users but not admins or other managers
  if (this.role === "manager" && targetUser.role === "user") {
    return true;
  }

  return false;
};

// Static method to find users in same organization
userSchema.statics.findInOrganization = function (
  organizationId,
  conditions = {}
) {
  return this.find({ organizationId, ...conditions });
};

// Static method to count users by role in organization
userSchema.statics.countByRoleInOrg = function (organizationId) {
  return this.aggregate([
    { $match: { organizationId, isActive: true } },
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);
};

// Static method to find organization admins
userSchema.statics.findOrgAdmins = function (organizationId) {
  return this.find({ organizationId, role: "admin", isActive: true });
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.metadata.customFields; // Keep sensitive custom fields private
  return user;
};

// Safe public info for team members
userSchema.methods.toTeamJSON = function () {
  return {
    id: this.id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    jobTitle: this.jobTitle,
    avatar: this.avatar,
    isActive: this.isActive,
    timezone: this.timezone,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

// Minimal public info
userSchema.methods.toPublicJSON = function () {
  return {
    id: this.id,
    name: this.name,
    avatar: this.avatar,
    role: this.role,
    department: this.department,
  };
};

module.exports = mongoose.model("User", userSchema);
