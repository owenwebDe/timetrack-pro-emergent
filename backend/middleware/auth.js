const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user
    const user = await User.findOne({ id: decoded.id });
    if (!user) {
      return res.status(401).json({ error: "Invalid token - user not found" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "User account is inactive" });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.name, error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token format" });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    } else if (error.name === "NotBeforeError") {
      return res.status(401).json({ error: "Token not active" });
    } else {
      return res.status(500).json({ error: "Authentication error" });
    }
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

// Check if user is admin
const requireAdmin = requireRole(["admin"]);

// Check if user is admin or manager
const requireManager = requireRole(["admin", "manager"]);

module.exports = {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireManager,
};
