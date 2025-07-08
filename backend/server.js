// backend/server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const http = require("http");
const socketIo = require("socket.io");

// Load environment variables
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const projectRoutes = require("./routes/projects");
const timeTrackingRoutes = require("./routes/time-tracking");
const analyticsRoutes = require("./routes/analytics");
const integrationRoutes = require("./routes/integrations");
const websocketRoutes = require("./routes/websocket");
const invitationRoutes = require("./routes/invitations");

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://172.20.10.7:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Initialize Socket.IO with proper CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Configure logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Enhanced rate limiting with different rules for different endpoints
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// Different rate limits for different endpoint types
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 auth attempts per 15 minutes
  "Too many authentication attempts, please try again later"
);

const generalLimiter = createRateLimit(
  1 * 60 * 1000, // 1 minute
  100, // 100 requests per minute (increased from 100)
  "Too many requests, please try again later"
);

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(morgan("combined"));

// CORS configuration - APPLY BEFORE RATE LIMITING
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Handle preflight requests BEFORE rate limiting
app.options("*", (req, res) => {
  const origin = req.get("origin");
  if (allowedOrigins.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin || "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});

// Apply rate limiting AFTER CORS
app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Debug middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    origin: req.get("origin"),
    userAgent: req.get("user-agent"),
    timestamp: new Date().toISOString(),
  });
  next();
});

// Enhanced database connection for MongoDB Atlas
const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGO_URL;

    if (!mongoURL) {
      throw new Error("MONGO_URL environment variable is not defined");
    }

    // Log connection attempt (hide credentials)
    const sanitizedURL = mongoURL.replace(/\/\/[^:]*:[^@]*@/, "//***:***@");
    logger.info(`Attempting to connect to MongoDB Atlas: ${sanitizedURL}`);

    // MongoDB Atlas connection options
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 5, // Maintain at least 5 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    await mongoose.connect(mongoURL, options);
    logger.info("MongoDB Atlas connected successfully");
  } catch (error) {
    logger.error("MongoDB Atlas connection error:", {
      message: error.message,
      code: error.code,
      codeName: error.codeName,
      name: error.name,
    });

    // Provide specific error messages for common Atlas issues
    if (error.message.includes("ENOTFOUND")) {
      logger.error(
        "DNS resolution failed. Check your internet connection and MongoDB Atlas URL."
      );
    } else if (error.message.includes("authentication failed")) {
      logger.error(
        "Authentication failed. Check your MongoDB Atlas username and password."
      );
    } else if (error.message.includes("not authorized")) {
      logger.error(
        "Authorization failed. Check your MongoDB Atlas user permissions."
      );
    } else if (error.message.includes("network")) {
      logger.error(
        "Network error. Check your internet connection and MongoDB Atlas network access settings."
      );
    }

    // For development, you might want to continue without database
    // Comment out the process.exit(1) line if you want to run without database
    process.exit(1);
  }
};

// Add connection event listeners
mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to MongoDB Atlas");
});

mongoose.connection.on("error", (err) => {
  logger.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose disconnected from MongoDB Atlas");
});

mongoose.connection.on("reconnected", () => {
  logger.info("Mongoose reconnected to MongoDB Atlas");
});

// Handle MongoDB connection errors after initial connection
mongoose.connection.on("error", (err) => {
  logger.error("MongoDB Atlas error after initial connection:", err);
});

// Connect to database
connectDB();

// Socket.IO middleware and connection handling
io.use((socket, next) => {
  logger.info("Socket.IO connection attempt:", {
    id: socket.id,
    origin: socket.handshake.headers.origin,
  });
  next();
});

io.on("connection", (socket) => {
  logger.info("New client connected:", socket.id);

  socket.on("join-team", (teamId) => {
    socket.join(`team-${teamId}`);
    logger.info(`Socket ${socket.id} joined team ${teamId}`);
  });

  socket.on("disconnect", () => {
    logger.info("Client disconnected:", socket.id);
  });

  socket.on("error", (error) => {
    logger.error("Socket error:", error);
  });
});

// Make io available to routes
app.set("io", io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/time-tracking", timeTrackingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/websocket", websocketRoutes);
app.use("/api/invitations", invitationRoutes);
// Add after app.use("/api/invitations", invitationRoutes);
console.log("Invitation routes loaded successfully");
// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Hubstaff Clone API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      projects: "/api/projects",
      timeTracking: "/api/time-tracking",
      analytics: "/api/analytics",
      integrations: "/api/integrations",
      websocket: "/api/websocket",
      invitations: "/api/invitations",
      health: "/api/health",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  res.status(err.status || 500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info("HTTP server closed");
    mongoose.connection.close(() => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 8001;
server.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`Allowed origins: ${allowedOrigins.join(", ")}`);
});

module.exports = app;
