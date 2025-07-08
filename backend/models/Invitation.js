// backend/models/Invitation.js - Updated with organization support
const mongoose = require("mongoose");
const crypto = require("crypto");

const invitationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  organizationId: {
    type: String,
    required: true,
    // References Organization.id - all invitations are organization-specific
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: "Please enter a valid email address",
    },
  },
  role: {
    type: String,
    enum: ["admin", "manager", "user"],
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(32).toString("hex"),
  },
  invitedBy: {
    type: String,
    required: true, // User ID who sent the invitation (within same org)
  },
  inviterName: {
    type: String,
    required: true,
  },
  inviterEmail: {
    type: String,
    required: true,
  },
  organizationName: {
    type: String,
    required: true, // Name of the organization for email context
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "expired", "cancelled"],
    default: "pending",
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500, // Optional custom message from inviter
  },
  permissions: {
    // Specific permissions for this invitation (optional override)
    canCreateProjects: Boolean,
    canManageTeam: Boolean,
    canViewReports: Boolean,
    canManageIntegrations: Boolean,
    canExportData: Boolean,
  },
  metadata: {
    // Additional invitation context
    department: String,
    jobTitle: String,
    expectedStartDate: Date,
    hourlyRate: Number,
    customFields: { type: Map, of: String },
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  acceptedAt: {
    type: Date,
    default: null,
  },
  acceptedBy: {
    type: String, // User ID created after accepting invitation
    default: null,
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
  cancelledBy: {
    type: String, // User ID who cancelled the invitation
    default: null,
  },
  remindersSent: {
    type: Number,
    default: 0,
    max: 3, // Maximum 3 reminders
  },
  lastReminderSent: {
    type: Date,
    default: null,
  },
  emailDelivered: {
    type: Boolean,
    default: false,
  },
  emailError: {
    type: String,
    default: null,
  },
  clickCount: {
    type: Number,
    default: 0, // Track how many times the invitation link was clicked
  },
  lastClickedAt: {
    type: Date,
    default: null,
  },
  ipAddresses: [
    {
      ip: String,
      clickedAt: { type: Date, default: Date.now },
      userAgent: String,
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
invitationSchema.index({ organizationId: 1, status: 1 });
invitationSchema.index({ organizationId: 1, email: 1 });
invitationSchema.index({ organizationId: 1, invitedBy: 1 });
invitationSchema.index({ organizationId: 1, createdAt: -1 });
invitationSchema.index({ token: 1 }, { unique: true });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-cleanup expired invitations

// Update the updatedAt field before saving
invitationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Auto-expire invitations that are past their expiry date
invitationSchema.pre("save", function (next) {
  if (this.status === "pending" && new Date() > this.expiresAt) {
    this.status = "expired";
  }
  next();
});

// Virtual for organization
invitationSchema.virtual("organization", {
  ref: "Organization",
  localField: "organizationId",
  foreignField: "id",
  justOne: true,
});

// Virtual for inviter
invitationSchema.virtual("inviter", {
  ref: "User",
  localField: "invitedBy",
  foreignField: "id",
  justOne: true,
});

// Virtual for days until expiry
invitationSchema.virtual("daysUntilExpiry").get(function () {
  if (this.status !== "pending") return null;
  const now = new Date();
  const expiry = new Date(this.expiresAt);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for hours until expiry
invitationSchema.virtual("hoursUntilExpiry").get(function () {
  if (this.status !== "pending") return null;
  const now = new Date();
  const expiry = new Date(this.expiresAt);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60));
});

// Virtual for invitation URL
invitationSchema.virtual("invitationUrl").get(function () {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${baseUrl}/accept-invitation?token=${this.token}`;
});

// Virtual for expiry status
invitationSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiresAt;
});

// Virtual for can send reminder
invitationSchema.virtual("canSendReminder").get(function () {
  if (this.status !== "pending" || this.isExpired) return false;
  if (this.remindersSent >= 3) return false;

  // Can send reminder if no reminder sent yet, or last reminder was >24 hours ago
  if (!this.lastReminderSent) return true;
  const hoursSinceLastReminder =
    (Date.now() - this.lastReminderSent) / (1000 * 60 * 60);
  return hoursSinceLastReminder >= 24;
});

// Instance method to check if invitation is valid
invitationSchema.methods.isValid = function () {
  return this.status === "pending" && new Date() <= this.expiresAt;
};

// Instance method to check if user can manage this invitation
invitationSchema.methods.canManage = function (user) {
  // Same organization check
  if (this.organizationId !== user.organizationId) {
    return false;
  }

  // Inviter, admin, or manager can manage
  return (
    this.invitedBy === user.id ||
    user.role === "admin" ||
    user.role === "manager"
  );
};

// Instance method to track click
invitationSchema.methods.trackClick = function (ipAddress, userAgent) {
  this.clickCount += 1;
  this.lastClickedAt = new Date();

  // Store IP and user agent for security tracking
  this.ipAddresses.push({
    ip: ipAddress,
    userAgent: userAgent,
    clickedAt: new Date(),
  });

  // Keep only last 10 clicks to avoid document bloat
  if (this.ipAddresses.length > 10) {
    this.ipAddresses = this.ipAddresses.slice(-10);
  }

  return this;
};

// Instance method to accept invitation
invitationSchema.methods.accept = function (userId) {
  this.status = "accepted";
  this.acceptedAt = new Date();
  this.acceptedBy = userId;
  return this;
};

// Instance method to cancel invitation
invitationSchema.methods.cancel = function (userId) {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  this.cancelledBy = userId;
  return this;
};

// Instance method to mark reminder sent
invitationSchema.methods.markReminderSent = function () {
  this.remindersSent += 1;
  this.lastReminderSent = new Date();
  return this;
};

// Instance method to extend expiry
invitationSchema.methods.extend = function (additionalDays = 7) {
  if (this.status === "pending") {
    const newExpiry = new Date(this.expiresAt);
    newExpiry.setDate(newExpiry.getDate() + additionalDays);
    this.expiresAt = newExpiry;
  }
  return this;
};

// Instance method to regenerate token
invitationSchema.methods.regenerateToken = function () {
  this.token = crypto.randomBytes(32).toString("hex");
  return this;
};

// Static method to find invitations in organization
invitationSchema.statics.findInOrganization = function (
  organizationId,
  conditions = {}
) {
  return this.find({ organizationId, ...conditions });
};

// Static method to find pending invitations in organization
invitationSchema.statics.findPendingInOrg = function (organizationId) {
  return this.find({
    organizationId,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });
};

// Static method to find expired invitations for cleanup
invitationSchema.statics.findExpired = function () {
  return this.find({
    status: "pending",
    expiresAt: { $lt: new Date() },
  });
};

// Static method to find invitations needing reminders
invitationSchema.statics.findNeedingReminders = function () {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return this.find({
    status: "pending",
    expiresAt: { $gt: new Date() },
    remindersSent: { $lt: 3 },
    $or: [
      { lastReminderSent: { $exists: false } },
      { lastReminderSent: null },
      { lastReminderSent: { $lt: twentyFourHoursAgo } },
    ],
  });
};

// Static method to find invitation by token
invitationSchema.statics.findByToken = function (token) {
  return this.findOne({
    token,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });
};

// Static method to check if email already invited to organization
invitationSchema.statics.isEmailInvited = function (organizationId, email) {
  return this.findOne({
    organizationId,
    email: email.toLowerCase(),
    status: "pending",
    expiresAt: { $gt: new Date() },
  });
};

// Static method to get invitation stats for organization
invitationSchema.statics.getOrgStats = function (organizationId) {
  return this.aggregate([
    { $match: { organizationId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgClickCount: { $avg: "$clickCount" },
      },
    },
  ]);
};

// Remove sensitive information from JSON output
invitationSchema.methods.toJSON = function () {
  const invitation = this.toObject();
  delete invitation.token; // Never expose tokens in JSON
  delete invitation.ipAddresses; // Keep IP tracking private
  return invitation;
};

// Safe info for invitation management
invitationSchema.methods.toManagementJSON = function () {
  return {
    id: this.id,
    email: this.email,
    role: this.role,
    status: this.status,
    inviterName: this.inviterName,
    organizationName: this.organizationName,
    message: this.message,
    daysUntilExpiry: this.daysUntilExpiry,
    clickCount: this.clickCount,
    remindersSent: this.remindersSent,
    canSendReminder: this.canSendReminder,
    emailDelivered: this.emailDelivered,
    createdAt: this.createdAt,
    lastClickedAt: this.lastClickedAt,
  };
};

// Public info for invitation verification
invitationSchema.methods.toVerificationJSON = function () {
  return {
    email: this.email,
    role: this.role,
    inviterName: this.inviterName,
    organizationName: this.organizationName,
    message: this.message,
    hoursUntilExpiry: this.hoursUntilExpiry,
    organizationId: this.organizationId,
  };
};

module.exports = mongoose.model("Invitation", invitationSchema);
