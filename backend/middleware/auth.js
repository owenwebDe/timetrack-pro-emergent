// backend/middleware/auth.js - COMPLETE FIXED VERSION with organization isolation
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Organization = require("../models/Organization");

// FIXED: Enhanced authentication middleware with organization validation
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res
        .status(401)
        .json({ error: "No authorization header provided" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Invalid authorization format. Use Bearer token" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token || token.trim() === "") {
      return res.status(401).json({ error: "No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // FIXED: Ensure token has organization context
      if (!decoded.organizationId) {
        return res.status(401).json({
          error: "Invalid token: missing organization context",
        });
      }

      // FIXED: Find user with organization validation
      const user = await User.findOne({
        id: decoded.id,
        organizationId: decoded.organizationId, // Ensure user belongs to token's organization
        isActive: true,
      });

      if (!user) {
        return res.status(401).json({
          error: "Invalid token - user not found or inactive",
        });
      }

      // FIXED: Verify organization is still active
      const organization = await Organization.findOne({
        id: decoded.organizationId,
        isActive: true,
      });

      if (!organization) {
        return res.status(401).json({
          error: "Organization is inactive or not found",
        });
      }

      // FIXED: Double-check user belongs to the organization
      if (user.organizationId !== decoded.organizationId) {
        return res.status(401).json({
          error: "User does not belong to token organization",
        });
      }

      // Add user and organization to request object
      req.user = user;
      req.organization = organization;

      console.log(
        `Auth success: ${user.email} (${user.role}) in org ${organization.name}`
      );
      next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError.name, jwtError.message);

      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Invalid token format" });
      } else if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      } else if (jwtError.name === "NotBeforeError") {
        return res.status(401).json({ error: "Token not active" });
      } else {
        return res.status(401).json({ error: "Invalid token" });
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
};

// FIXED: Enhanced role-based access control with organization context
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: roles,
        current: userRole,
        organizationId: req.user.organizationId,
      });
    }

    next();
  };
};

// FIXED: Admin role middleware with organization context
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Admin access required",
      currentRole: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  next();
};

// FIXED: Manager role middleware with organization context
const requireManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      error: "Manager or Admin access required",
      currentRole: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  next();
};

// NEW: Organization admin middleware (admin of the specific organization)
const requireOrganizationAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!req.organization) {
    return res.status(500).json({ error: "Organization context missing" });
  }

  // Check if user is the organization admin
  if (req.user.id !== req.organization.adminId) {
    return res.status(403).json({
      error: "Organization admin access required",
      currentRole: req.user.role,
      organizationId: req.user.organizationId,
    });
  }

  next();
};

// NEW: Organization membership validation middleware
const requireOrganizationMember = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!req.user.organizationId) {
    return res.status(403).json({
      error: "User not associated with any organization",
    });
  }

  next();
};

// NEW: Resource ownership middleware factory
const requireResourceOwnership = (resourceModel, resourceIdParam = "id") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const resourceId = req.params[resourceIdParam];

      // Find resource with organization filter
      const resource = await resourceModel.findOne({
        id: resourceId,
        organizationId: req.user.organizationId,
      });

      if (!resource) {
        return res.status(404).json({
          error: "Resource not found in your organization",
        });
      }

      // Attach resource to request for further use
      req.resource = resource;
      next();
    } catch (error) {
      console.error("Resource ownership check error:", error);
      res.status(500).json({ error: "Authorization check failed" });
    }
  };
};

// NEW: Project access middleware
const requireProjectAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const projectId =
      req.params.id || req.params.project_id || req.body.project_id;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID required" });
    }

    const Project = require("../models/Project");
    const project = await Project.findOne({
      id: projectId,
      organizationId: req.user.organizationId,
    });

    if (!project) {
      return res.status(404).json({
        error: "Project not found in your organization",
      });
    }

    // Check if user has access to this project
    const hasAccess =
      req.user.role === "admin" ||
      req.user.role === "manager" ||
      project.members.includes(req.user.id) ||
      project.manager === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this project" });
    }

    req.project = project;
    next();
  } catch (error) {
    console.error("Project access check error:", error);
    res.status(500).json({ error: "Project access check failed" });
  }
};

// NEW: Rate limiting middleware with organization context
const createRateLimit = (windowMs, maxRequests, message) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = `${req.ip}-${req.user?.organizationId || "anonymous"}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(key)) {
      const userRequests = requests
        .get(key)
        .filter((time) => time > windowStart);
      requests.set(key, userRequests);
    } else {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: message,
        organizationId: req.user?.organizationId,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    userRequests.push(now);
    requests.set(key, userRequests);
    next();
  };
};

// Enhanced rate limiters with organization context
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 attempts per organization
  "Too many authentication attempts from this organization"
);

const generalLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  200, // 200 requests per organization
  "Too many requests from this organization"
);

// NEW: Organization-scoped API limiter
const organizationApiLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  500, // 500 requests per organization per minute
  "Organization API rate limit exceeded"
);

// NEW: Logging middleware with organization context
const logOrganizationActivity = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      // Log organization activity
      console.log(
        `[ORG:${req.user?.organizationId}] ${action} by ${req.user?.email} - ${res.statusCode}`
      );

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

// NEW: Organization stats update middleware
const updateOrganizationActivity = async (req, res, next) => {
  // Only run after successful responses
  const originalSend = res.send;

  res.send = function (data) {
    // Update organization last activity on successful requests
    if (req.organization && res.statusCode < 400) {
      req.organization.stats.lastActivity = new Date();
      req.organization
        .save()
        .catch((err) =>
          console.warn("Failed to update organization activity:", err)
        );
    }

    // Call original send
    originalSend.call(this, data);
  };

  next();
};

// NEW: Invitation validation middleware
const requireValidInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: "Invitation token required" });
    }

    const Invitation = require("../models/Invitation");
    const invitation = await Invitation.findOne({
      token: token,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return res.status(400).json({ error: "Invalid or expired invitation" });
    }

    req.invitation = invitation;
    next();
  } catch (error) {
    console.error("Invitation validation error:", error);
    res.status(500).json({ error: "Invitation validation failed" });
  }
};

module.exports = {
  // Core authentication
  authMiddleware,
  requireRole,
  requireAdmin,
  requireManager,

  // Organization-specific
  requireOrganizationAdmin,
  requireOrganizationMember,
  requireResourceOwnership,
  requireProjectAccess,

  // Rate limiting
  authLimiter,
  generalLimiter,
  organizationApiLimiter,
  createRateLimit,

  // Utility middleware
  logOrganizationActivity,
  updateOrganizationActivity,
  requireValidInvitation,
};
