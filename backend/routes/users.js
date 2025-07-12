// backend/routes/users.js - FIXED: Organization isolation
const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
  authMiddleware,
  requireAdmin,
  requireManager,
} = require("../middleware/auth");

const router = express.Router();

// Get all users (admin/manager only) - FIXED: Organization-scoped
router.get("/", authMiddleware, requireManager, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    // FIXED: Always filter by organization
    const query = { organizationId: req.user.organizationId };

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const users = await User.find(query)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await User.countDocuments(query);

    console.log(
      `Users fetched for organization ${req.user.organizationId}: ${users.length}`
    );

    res.json({
      users: users.map((user) => user.toJSON()),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json(req.user.toJSON());
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user by ID - FIXED: Organization-scoped
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // FIXED: Filter by organization
    const user = await User.findOne({
      id,
      organizationId: req.user.organizationId,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only admin/manager can view other users' profiles
    if (req.user.id !== id && !["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    res.json(user.toJSON());
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile
router.put(
  "/me",
  authMiddleware,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("department").optional().trim(),
    body("timezone").optional().trim(),
    body("avatar").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, department, timezone, avatar, settings } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (department) updateData.department = department;
      if (timezone) updateData.timezone = timezone;
      if (avatar) updateData.avatar = avatar;
      if (settings) updateData.settings = { ...req.user.settings, ...settings };

      // FIXED: Update with organization filter (extra safety)
      const user = await User.findOneAndUpdate(
        {
          id: req.user.id,
          organizationId: req.user.organizationId,
        },
        updateData,
        { new: true }
      );

      res.json({
        message: "Profile updated successfully",
        user: user.toJSON(),
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update user by ID (admin only) - FIXED: Organization-scoped
router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("role")
      .optional()
      .isIn(["admin", "manager", "user"])
      .withMessage("Invalid role"),
    body("department").optional().trim(),
    body("isActive").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, role, department, isActive } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (role) updateData.role = role;
      if (department) updateData.department = department;
      if (typeof isActive === "boolean") updateData.isActive = isActive;

      // FIXED: Update with organization filter
      const user = await User.findOneAndUpdate(
        {
          id,
          organizationId: req.user.organizationId,
        },
        updateData,
        {
          new: true,
        }
      );

      if (!user) {
        return res
          .status(404)
          .json({ error: "User not found in your organization" });
      }

      res.json({
        message: "User updated successfully",
        user: user.toJSON(),
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Change password
router.put(
  "/me/password",
  authMiddleware,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      // FIXED: Find user with organization filter (extra safety)
      const user = await User.findOne({
        id: req.user.id,
        organizationId: req.user.organizationId,
      });

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        newPassword,
        parseInt(process.env.BCRYPT_ROUNDS) || 12
      );

      await User.findOneAndUpdate(
        {
          id: req.user.id,
          organizationId: req.user.organizationId,
        },
        { password: hashedPassword }
      );

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete user (admin only) - FIXED: Organization-scoped
router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting own account
    if (req.user.id === id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // FIXED: Delete with organization filter
    const user = await User.findOneAndDelete({
      id,
      organizationId: req.user.organizationId,
    });

    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found in your organization" });
    }

    console.log(
      `User deleted: ${user.email} from organization ${req.user.organizationId}`
    );

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get team stats - FIXED: Organization-scoped
router.get("/team/stats", authMiddleware, requireManager, async (req, res) => {
  try {
    // FIXED: Filter by organization
    const orgQuery = { organizationId: req.user.organizationId };

    const totalUsers = await User.countDocuments(orgQuery);
    const activeUsers = await User.countDocuments({
      ...orgQuery,
      isActive: true,
    });

    const usersByRole = await User.aggregate([
      { $match: orgQuery },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const recentUsers = await User.find(orgQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("id name email role createdAt");

    console.log(
      `Team stats for organization ${req.user.organizationId}: ${totalUsers} total users`
    );

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentUsers: recentUsers.map((user) => user.toJSON()),
    });
  } catch (error) {
    console.error("Get team stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
