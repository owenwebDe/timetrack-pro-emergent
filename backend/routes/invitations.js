// backend/routes/invitations.js - Updated with organization support
const express = require("express");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const Organization = require("../models/Organization");
const { authMiddleware, requireManager } = require("../middleware/auth");
const { sendInvitationEmail } = require("../services/emailService");

const router = express.Router();

// Send invitation (managers/admins only, organization-scoped)
router.post(
  "/",
  authMiddleware,
  requireManager,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("role").isIn(["admin", "manager", "user"]).withMessage("Invalid role"),
    body("message")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Message must be less than 500 characters"),
    body("department")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Department must be less than 100 characters"),
    body("jobTitle")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Job title must be less than 100 characters"),
    body("hourlyRate")
      .optional()
      .isNumeric({ min: 0 })
      .withMessage("Hourly rate must be a positive number"),
    body("customPermissions")
      .optional()
      .isObject()
      .withMessage("Custom permissions must be an object"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        email,
        role,
        message,
        department,
        jobTitle,
        hourlyRate,
        customPermissions,
      } = req.body;

      // Get user's organization
      const organization = await Organization.findOne({
        id: req.user.organizationId,
        isActive: true,
      });

      if (!organization) {
        return res
          .status(400)
          .json({ error: "Organization not found or inactive" });
      }

      // Check if organization can add more users
      if (!organization.canAddUsers(1)) {
        return res.status(400).json({
          error: `Organization has reached maximum user limit of ${organization.billing.maxUsers}. Please upgrade your plan to invite more users.`,
        });
      }

      // Check role permissions - managers can only invite users, admins can invite anyone
      if (req.user.role === "manager" && ["admin", "manager"].includes(role)) {
        return res.status(403).json({
          error:
            "Managers can only invite users. Contact an admin to invite managers or admins.",
        });
      }

      // Check if user already exists globally
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // Check if they're in the same organization
        if (existingUser.organizationId === req.user.organizationId) {
          return res.status(400).json({
            error: "User is already a member of your organization",
          });
        } else {
          return res.status(400).json({
            error:
              "User already has an account with another organization. They need to contact support to join your organization.",
          });
        }
      }

      // Check if invitation already exists and is pending
      const existingInvitation = await Invitation.findOne({
        organizationId: req.user.organizationId,
        email,
        status: "pending",
        expiresAt: { $gt: new Date() },
      });

      if (existingInvitation) {
        return res.status(400).json({
          error:
            "An active invitation has already been sent to this email address",
          invitationId: existingInvitation.id,
          expiresAt: existingInvitation.expiresAt,
        });
      }

      // Generate invitation token
      const token = crypto.randomBytes(32).toString("hex");

      // Create invitation
      const invitation = new Invitation({
        id: uuidv4(),
        organizationId: req.user.organizationId,
        email,
        role,
        token,
        invitedBy: req.user.id,
        inviterName: req.user.name,
        inviterEmail: req.user.email,
        organizationName: organization.name,
        message: message?.trim() || "",
        permissions: customPermissions || {},
        metadata: {
          department: department?.trim() || "",
          jobTitle: jobTitle?.trim() || "",
          hourlyRate: hourlyRate || 0,
        },
      });

      await invitation.save();

      // Send invitation email
      try {
        await sendInvitationEmail(
          email,
          token,
          req.user.name,
          role,
          organization.name,
          message
        );
        invitation.emailDelivered = true;
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        invitation.emailDelivered = false;
        invitation.emailError = emailError.message;
      }

      await invitation.save();

      console.log(
        `Invitation sent: ${req.user.email} invited ${email} to ${organization.name} as ${role}`
      );

      res.status(201).json({
        message: "Invitation sent successfully",
        invitation: invitation.toManagementJSON(),
        invitationUrl: invitation.invitationUrl,
      });
    } catch (error) {
      console.error("Send invitation error:", error);
      res.status(500).json({ error: "Failed to send invitation" });
    }
  }
);

// Get all invitations for current organization (managers/admins only)
router.get("/", authMiddleware, requireManager, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { organizationId: req.user.organizationId };

    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const invitations = await Invitation.find(query)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Invitation.countDocuments(query);

    res.json({
      invitations: invitations.map((inv) => inv.toManagementJSON()),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    console.error("Get invitations error:", error);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

// Get invitation statistics for organization
router.get("/stats", authMiddleware, requireManager, async (req, res) => {
  try {
    const stats = await Invitation.getOrgStats(req.user.organizationId);

    const formattedStats = {
      total: 0,
      pending: 0,
      accepted: 0,
      expired: 0,
      cancelled: 0,
      averageClickCount: 0,
    };

    stats.forEach((stat) => {
      formattedStats.total += stat.count;
      formattedStats[stat._id] = stat.count;
      if (stat._id === "pending") {
        formattedStats.averageClickCount = stat.avgClickCount || 0;
      }
    });

    // Get pending invitations needing attention
    const needingReminders = await Invitation.find({
      organizationId: req.user.organizationId,
      status: "pending",
      expiresAt: { $gt: new Date() },
      remindersSent: { $lt: 3 },
      $or: [
        { lastReminderSent: { $exists: false } },
        { lastReminderSent: null },
        {
          lastReminderSent: {
            $lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      ],
    });

    const expiringSoon = await Invitation.find({
      organizationId: req.user.organizationId,
      status: "pending",
      expiresAt: {
        $gt: new Date(),
        $lt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next 24 hours
      },
    });

    res.json({
      stats: formattedStats,
      needingReminders: needingReminders.length,
      expiringSoon: expiringSoon.length,
    });
  } catch (error) {
    console.error("Get invitation stats error:", error);
    res.status(500).json({ error: "Failed to fetch invitation stats" });
  }
});

// Resend invitation email
router.post("/:id/resend", authMiddleware, requireManager, async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findOne({
      id,
      organizationId: req.user.organizationId,
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (!invitation.canManage(req.user)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        error: `Cannot resend ${invitation.status} invitation`,
      });
    }

    if (invitation.isExpired) {
      return res.status(400).json({
        error: "Invitation has expired. Please create a new invitation.",
      });
    }

    // Check reminder limits
    if (!invitation.canSendReminder) {
      return res.status(400).json({
        error: "Maximum reminders sent or reminder sent too recently",
      });
    }

    try {
      await sendInvitationEmail(
        invitation.email,
        invitation.token,
        req.user.name,
        invitation.role,
        invitation.organizationName,
        invitation.message
      );

      invitation.markReminderSent();
      invitation.emailDelivered = true;
      invitation.emailError = null;
      await invitation.save();

      console.log(
        `Invitation resent: ${req.user.email} resent invitation to ${invitation.email}`
      );

      res.json({
        message: "Invitation reminder sent successfully",
        invitation: invitation.toManagementJSON(),
      });
    } catch (emailError) {
      console.error("Failed to resend invitation:", emailError);
      invitation.emailError = emailError.message;
      await invitation.save();

      res.status(500).json({
        error: "Failed to send reminder email",
        details: emailError.message,
      });
    }
  } catch (error) {
    console.error("Resend invitation error:", error);
    res.status(500).json({ error: "Failed to resend invitation" });
  }
});

// Cancel invitation (managers/admins only)
router.delete("/:id", authMiddleware, requireManager, async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findOne({
      id,
      organizationId: req.user.organizationId,
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (!invitation.canManage(req.user)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({
        error: `Cannot cancel ${invitation.status} invitation`,
      });
    }

    invitation.cancel(req.user.id);
    await invitation.save();

    console.log(
      `Invitation cancelled: ${req.user.email} cancelled invitation to ${invitation.email}`
    );

    res.json({ message: "Invitation cancelled successfully" });
  } catch (error) {
    console.error("Cancel invitation error:", error);
    res.status(500).json({ error: "Failed to cancel invitation" });
  }
});

// Extend invitation expiry
router.patch(
  "/:id/extend",
  authMiddleware,
  requireManager,
  [
    body("days")
      .isInt({ min: 1, max: 30 })
      .withMessage("Days must be between 1 and 30"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { days } = req.body;

      const invitation = await Invitation.findOne({
        id,
        organizationId: req.user.organizationId,
      });

      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (!invitation.canManage(req.user)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      if (invitation.status !== "pending") {
        return res.status(400).json({
          error: `Cannot extend ${invitation.status} invitation`,
        });
      }

      invitation.extend(days);
      await invitation.save();

      console.log(
        `Invitation extended: ${req.user.email} extended invitation to ${invitation.email} by ${days} days`
      );

      res.json({
        message: `Invitation extended by ${days} days`,
        invitation: invitation.toManagementJSON(),
      });
    } catch (error) {
      console.error("Extend invitation error:", error);
      res.status(500).json({ error: "Failed to extend invitation" });
    }
  }
);

// Generate new invitation link (regenerate token)
router.post(
  "/:id/regenerate",
  authMiddleware,
  requireManager,
  async (req, res) => {
    try {
      const { id } = req.params;

      const invitation = await Invitation.findOne({
        id,
        organizationId: req.user.organizationId,
      });

      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (!invitation.canManage(req.user)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      if (invitation.status !== "pending") {
        return res.status(400).json({
          error: `Cannot regenerate link for ${invitation.status} invitation`,
        });
      }

      invitation.regenerateToken();
      invitation.clickCount = 0; // Reset click tracking
      invitation.ipAddresses = [];
      await invitation.save();

      console.log(
        `Invitation link regenerated: ${req.user.email} regenerated link for ${invitation.email}`
      );

      res.json({
        message: "New invitation link generated",
        invitation: invitation.toManagementJSON(),
        invitationUrl: invitation.invitationUrl,
      });
    } catch (error) {
      console.error("Regenerate invitation error:", error);
      res.status(500).json({ error: "Failed to regenerate invitation link" });
    }
  }
);

// Bulk invite users
router.post(
  "/bulk",
  authMiddleware,
  requireManager,
  [
    body("invitations")
      .isArray({ min: 1, max: 50 })
      .withMessage("Must provide 1-50 invitations"),
    body("invitations.*.email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("invitations.*.role")
      .isIn(["admin", "manager", "user"])
      .withMessage("Invalid role"),
    body("defaultMessage")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Default message must be less than 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { invitations: inviteList, defaultMessage } = req.body;

      // Get organization and check limits
      const organization = await Organization.findOne({
        id: req.user.organizationId,
        isActive: true,
      });

      if (!organization) {
        return res
          .status(400)
          .json({ error: "Organization not found or inactive" });
      }

      if (!organization.canAddUsers(inviteList.length)) {
        return res.status(400).json({
          error: `Organization can only add ${
            organization.billing.maxUsers - organization.stats.totalUsers
          } more users. Upgrade your plan to invite more.`,
        });
      }

      const results = {
        sent: [],
        failed: [],
        skipped: [],
      };

      for (const inviteData of inviteList) {
        try {
          const { email, role, message, department, jobTitle } = inviteData;

          // Check role permissions
          if (
            req.user.role === "manager" &&
            ["admin", "manager"].includes(role)
          ) {
            results.failed.push({
              email,
              error: "Managers can only invite users",
            });
            continue;
          }

          // Check if user already exists
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            results.skipped.push({
              email,
              reason: "User already exists",
            });
            continue;
          }

          // Check if invitation already exists
          const existingInvitation = await Invitation.findOne({
            organizationId: req.user.organizationId,
            email,
            status: "pending",
            expiresAt: { $gt: new Date() },
          });

          if (existingInvitation) {
            results.skipped.push({
              email,
              reason: "Active invitation already exists",
            });
            continue;
          }

          // Create invitation
          const invitation = new Invitation({
            id: uuidv4(),
            organizationId: req.user.organizationId,
            email,
            role,
            token: crypto.randomBytes(32).toString("hex"),
            invitedBy: req.user.id,
            inviterName: req.user.name,
            inviterEmail: req.user.email,
            organizationName: organization.name,
            message: message || defaultMessage || "",
            metadata: {
              department: department || "",
              jobTitle: jobTitle || "",
            },
          });

          await invitation.save();

          // Send email
          try {
            await sendInvitationEmail(
              email,
              invitation.token,
              req.user.name,
              role,
              organization.name,
              invitation.message
            );
            invitation.emailDelivered = true;
            await invitation.save();

            results.sent.push({
              email,
              role,
              invitationId: invitation.id,
            });
          } catch (emailError) {
            invitation.emailDelivered = false;
            invitation.emailError = emailError.message;
            await invitation.save();

            results.failed.push({
              email,
              error: "Failed to send email",
            });
          }
        } catch (error) {
          results.failed.push({
            email: inviteData.email,
            error: error.message,
          });
        }
      }

      console.log(
        `Bulk invitation sent: ${req.user.email} sent ${results.sent.length} invitations`
      );

      res.json({
        message: `Bulk invitation completed. ${results.sent.length} sent, ${results.failed.length} failed, ${results.skipped.length} skipped.`,
        results,
      });
    } catch (error) {
      console.error("Bulk invitation error:", error);
      res.status(500).json({ error: "Failed to send bulk invitations" });
    }
  }
);

module.exports = router;
