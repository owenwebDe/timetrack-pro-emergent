// backend/routes/auth.js - COMPLETE FIXED VERSION with manual slug generation
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const Organization = require("../models/Organization");
const Invitation = require("../models/Invitation");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Helper function to generate unique slug from organization name
const generateSlug = async (name) => {
  try {
    // Generate base slug from name: "Acme Corp" -> "acme-corp"
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    // Ensure minimum slug length
    if (baseSlug.length < 3) {
      baseSlug += "-" + Math.random().toString(36).substr(2, 6);
    }

    // Check for slug uniqueness and add counter if needed
    let slug = baseSlug;
    let counter = 1;

    while (await Organization.findOne({ slug: slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    console.log(`Generated unique slug: ${slug} from name: ${name}`);
    return slug;
  } catch (error) {
    console.error("Error generating slug:", error);
    // Fallback slug with timestamp
    return `org-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }
};

// Check if email is available (public route)
router.post(
  "/check-email",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          available: false,
          message: "Invalid email format",
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      const existingUser = await User.findOne({ email });

      res.json({
        available: !existingUser,
        message: existingUser
          ? "Email is already registered"
          : "Email is available",
      });
    } catch (error) {
      console.error("Check email error:", error);
      res.status(500).json({
        available: false,
        message: "Failed to check email availability",
      });
    }
  }
);

// Check organization name availability (public route)
router.post(
  "/check-organization",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Organization name must be between 2 and 100 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          available: false,
          message: "Invalid organization name",
          errors: errors.array(),
        });
      }

      const { name } = req.body;

      const existingOrg = await Organization.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        isActive: true,
      });

      res.json({
        available: !existingOrg,
        message: existingOrg
          ? "Organization name is already taken"
          : "Organization name is available",
        suggestedNames: existingOrg
          ? [
              `${name.trim()} Inc`,
              `${name.trim()} LLC`,
              `${name.trim()} Corp`,
              `${name.trim()} Team`,
              `${name.trim()} Group`,
            ]
          : [],
      });
    } catch (error) {
      console.error("Check organization error:", error);
      res.status(500).json({
        available: false,
        message: "Failed to check organization name",
      });
    }
  }
);

// Admin registration with organization creation (ONLY for admins)
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("organizationName")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Organization name must be between 2 and 100 characters"),
    body("organizationDescription")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Organization description must be less than 500 characters"),
    body("organizationSize")
      .optional()
      .isIn(["1-5", "6-15", "16-50", "51-100", "100+"])
      .withMessage("Invalid organization size"),
    body("industry")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Industry must be less than 100 characters"),
    body("invitationToken")
      .optional()
      .isString()
      .withMessage("Invalid invitation token"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        email,
        password,
        organizationName,
        organizationDescription,
        organizationSize,
        industry,
        invitationToken,
      } = req.body;

      console.log("Registration attempt:", { email, organizationName });

      // Check if user already exists globally
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User already exists with this email" });
      }

      let userRole = "admin"; // Default to admin for new organizations
      let organization = null;
      let invitation = null;

      // If invitation token provided, verify it and join existing organization
      if (invitationToken) {
        invitation = await Invitation.findOne({
          token: invitationToken,
          email: email.toLowerCase(),
          status: "pending",
          expiresAt: { $gt: new Date() },
        });

        if (!invitation) {
          return res
            .status(400)
            .json({ error: "Invalid or expired invitation" });
        }

        // Get the organization
        organization = await Organization.findOne({
          id: invitation.organizationId,
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
            error: `Organization has reached maximum user limit of ${organization.billing.maxUsers}`,
          });
        }

        userRole = invitation.role;
      } else {
        // No invitation token = Create new organization (admin registration)

        // Check if organization name already exists
        const existingOrg = await Organization.findOne({
          name: { $regex: new RegExp(`^${organizationName}$`, "i") },
          isActive: true,
        });

        if (existingOrg) {
          return res.status(400).json({
            error:
              "Organization name already exists. Please choose a different name.",
          });
        }

        // FIXED: Generate slug manually before creating organization
        const generatedSlug = await generateSlug(organizationName);
        console.log("Generated slug:", generatedSlug);

        // Create organization with manually generated slug and placeholder adminId
        const orgId = uuidv4();
        organization = new Organization({
          id: orgId,
          name: organizationName.trim(),
          slug: generatedSlug, // MANUALLY SET SLUG
          description: organizationDescription?.trim() || "",
          size: organizationSize || "1-5",
          industry: industry?.trim() || "",
          adminId: "pending", // Temporary placeholder - will be updated after user creation
        });

        // Save organization
        await organization.save();
        console.log(
          `Organization created: ${organization.name} (${organization.id}) with slug: ${organization.slug}`
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user with the organization ID
      const userId = uuidv4();
      const user = new User({
        id: userId,
        organizationId: organization.id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: userRole,
        invitedBy: invitation?.invitedBy || null,
        invitedAt: invitation ? new Date() : null,
        onboardingCompleted: userRole === "admin", // Admins skip onboarding
      });

      await user.save();
      console.log(`User created: ${user.email} with ID: ${user.id}`);

      // FIXED: If this is a new organization, update the adminId with the actual user ID
      if (!invitationToken) {
        organization.adminId = user.id;
        await organization.save();
        console.log(`Organization adminId updated: ${organization.adminId}`);
      }

      // Mark invitation as accepted
      if (invitation) {
        invitation.status = "accepted";
        invitation.acceptedAt = new Date();
        invitation.acceptedBy = user.id;
        await invitation.save();
        console.log(
          `Invitation accepted: ${invitation.email} joined ${organization.name}`
        );
      }

      // Update organization stats
      await organization.updateStats();

      // Generate JWT token - FIXED: Ensure proper token generation
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "7d" }
      );

      const message = invitationToken
        ? `Welcome to ${organization.name}! Your account has been created successfully.`
        : `Organization "${organization.name}" created successfully! You are now the admin.`;

      console.log(
        `Registration completed: ${user.email} as ${user.role} in ${organization.name}`
      );

      res.status(201).json({
        message,
        user: {
          ...user.toJSON(),
          organization: organization.toPublicJSON(),
        },
        token,
        isNewOrganization: !invitationToken,
      });
    } catch (error) {
      console.error("Registration error:", error);

      // Provide more specific error messages
      if (error.code === 11000) {
        if (error.keyValue?.email) {
          return res.status(400).json({ error: "Email is already registered" });
        }
        if (error.keyValue?.slug) {
          return res
            .status(400)
            .json({ error: "Organization name is already taken" });
        }
      }

      // Handle validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          error: "Validation failed",
          details: validationErrors,
        });
      }

      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  }
);

// Login user (organization-aware)
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user with organization info
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(400).json({
          error: "Account is inactive. Please contact your administrator.",
        });
      }

      // Check if organization is active
      const organization = await Organization.findOne({
        id: user.organizationId,
        isActive: true,
      });

      if (!organization) {
        return res.status(400).json({
          error:
            "Your organization account is inactive. Please contact support.",
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Update user login time and organization activity
      user.lastLogin = new Date();
      await user.save();

      organization.stats.lastActivity = new Date();
      await organization.save();

      // Generate JWT token - FIXED: Ensure proper token generation
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "7d" }
      );

      console.log(
        `User login: ${user.email} (${user.role}) in ${organization.name}`
      );

      res.json({
        message: "Login successful",
        user: {
          ...user.toJSON(),
          organization: organization.toPublicJSON(),
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  }
);

// Logout user
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    console.log(`User logout: ${req.user.email}`);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// Get current user with organization info
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // Get organization info
    const organization = await Organization.findOne({
      id: req.user.organizationId,
      isActive: true,
    });

    if (!organization) {
      return res.status(400).json({
        error: "Organization not found. Please contact support.",
      });
    }

    res.json({
      ...req.user.toJSON(),
      organization: organization.toPublicJSON(),
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
});

// Refresh token
router.post("/refresh", authMiddleware, async (req, res) => {
  try {
    // Verify user and organization are still active
    const organization = await Organization.findOne({
      id: req.user.organizationId,
      isActive: true,
    });

    if (!organization) {
      return res.status(401).json({
        error: "Organization is no longer active",
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        error: "User account is inactive",
      });
    }

    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        organizationId: req.user.organizationId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" }
    );

    res.json({
      message: "Token refreshed successfully",
      token,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// Accept invitation (public route)
router.post(
  "/accept-invitation/:token",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
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
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token } = req.params;
      const { name, password, department, jobTitle } = req.body;

      // Find and validate invitation
      const invitation = await Invitation.findOne({
        token: token,
        status: "pending",
        expiresAt: { $gt: new Date() },
      });

      if (!invitation) {
        return res.status(400).json({ error: "Invalid or expired invitation" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: invitation.email });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User already exists with this email" });
      }

      // Get organization and verify it can add users
      const organization = await Organization.findOne({
        id: invitation.organizationId,
        isActive: true,
      });

      if (!organization) {
        return res
          .status(400)
          .json({ error: "Organization not found or inactive" });
      }

      if (!organization.canAddUsers(1)) {
        return res.status(400).json({
          error: `Organization has reached maximum user limit of ${organization.billing.maxUsers}`,
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = new User({
        id: uuidv4(),
        organizationId: organization.id,
        name: name.trim(),
        email: invitation.email,
        password: hashedPassword,
        role: invitation.role,
        department: department?.trim() || "",
        jobTitle: jobTitle?.trim() || "",
        invitedBy: invitation.invitedBy,
        invitedAt: new Date(),
        onboardingCompleted: false,
      });

      // Apply any custom permissions from invitation
      if (invitation.permissions) {
        user.permissions = { ...user.permissions, ...invitation.permissions };
      }

      await user.save();

      // Accept invitation
      invitation.status = "accepted";
      invitation.acceptedAt = new Date();
      invitation.acceptedBy = user.id;
      await invitation.save();

      // Update organization stats
      await organization.updateStats();

      // Generate JWT token
      const jwtToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "7d" }
      );

      console.log(
        `Invitation accepted: ${user.email} joined ${organization.name} as ${user.role}`
      );

      res.status(201).json({
        message: `Welcome to ${organization.name}! Your account has been created successfully.`,
        user: {
          ...user.toJSON(),
          organization: organization.toPublicJSON(),
        },
        token: jwtToken,
        requiresOnboarding: !user.onboardingCompleted,
      });
    } catch (error) {
      console.error("Accept invitation error:", error);
      res
        .status(500)
        .json({ error: "Failed to accept invitation. Please try again." });
    }
  }
);

// Verify invitation token (public route)
router.get("/verify-invitation/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({
      token: token,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return res.status(400).json({ error: "Invalid or expired invitation" });
    }

    // Track the click
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");
    invitation.clickCount += 1;
    invitation.lastClickedAt = new Date();
    await invitation.save();

    res.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        inviterName: invitation.inviterName,
        organizationName: invitation.organizationName,
        message: invitation.message,
        hoursUntilExpiry: Math.ceil(
          (invitation.expiresAt - new Date()) / (1000 * 60 * 60)
        ),
        organizationId: invitation.organizationId,
      },
    });
  } catch (error) {
    console.error("Verify invitation error:", error);
    res.status(500).json({ error: "Failed to verify invitation" });
  }
});

module.exports = router;
