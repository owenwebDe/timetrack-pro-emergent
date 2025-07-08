// backend/routes/users.js - user management and invitations
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

// Get all users (admin/manager only)
router.get("/", authMiddleware, requireManager, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, company, search } = req.query;

    const query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by company
    if (company) {
      query.company = company;
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

// Get user by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ id });
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

      const user = await User.findOneAndUpdate(
        { id: req.user.id },
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

// Update user by ID (admin only)
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

      const user = await User.findOneAndUpdate({ id }, updateData, {
        new: true,
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
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

      // Verify current password
      const user = await User.findOne({ id: req.user.id });
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
        { id: req.user.id },
        { password: hashedPassword }
      );

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete user (admin only)
router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting own account
    if (req.user.id === id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const user = await User.findOneAndDelete({ id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get team stats
router.get("/team/stats", authMiddleware, requireManager, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("id name email role createdAt");

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
