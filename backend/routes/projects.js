const express = require("express");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const Project = require("../models/Project");
const Task = require("../models/Task");
const TimeEntry = require("../models/TimeEntry");
const { authMiddleware, requireManager } = require("../middleware/auth");

const router = express.Router();

// Get all projects
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query = {};

    // Filter by user role
    if (req.user.role === "user") {
      query.members = req.user.id;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const projects = await Project.find(query)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Project.countDocuments(query);

    res.json({
      projects: projects,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get project by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({ id });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if user has access to this project
    if (req.user.role === "user" && !project.members.includes(req.user.id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(project);
  } catch (error) {
    console.error("Get project by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new project
router.post(
  "/",
  authMiddleware,
  requireManager,
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Project name must be between 2 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("client")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage(
        "Client name is required and must be less than 100 characters"
      ),
    body("startDate")
      .isISO8601()
      .withMessage("Valid start date is required (YYYY-MM-DD format)"),
    body("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid date (YYYY-MM-DD format)"),
    body("members")
      .optional()
      .isArray()
      .withMessage("Members must be an array"),
    body("budget")
      .isNumeric({ min: 0 })
      .withMessage("Budget must be a positive number"),
    body("currency")
      .optional()
      .isIn(["USD", "EUR", "GBP", "CAD", "AUD"])
      .withMessage("Currency must be one of: USD, EUR, GBP, CAD, AUD"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Priority must be one of: low, medium, high, urgent"),
    body("color")
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .withMessage("Color must be a valid hex color code"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
    body("settings")
      .optional()
      .isObject()
      .withMessage("Settings must be an object"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        name,
        description = "",
        client,
        status = "active",
        priority = "medium",
        budget,
        currency = "USD",
        startDate,
        endDate,
        members = [],
        tags = [],
        color = "#3B82F6",
        settings = {},
      } = req.body;

      // Validate dates
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;

      if (isNaN(start.getTime())) {
        return res.status(400).json({
          error: "Invalid start date format",
        });
      }

      if (end && isNaN(end.getTime())) {
        return res.status(400).json({
          error: "Invalid end date format",
        });
      }

      if (end && end <= start) {
        return res.status(400).json({
          error: "End date must be after start date",
        });
      }

      // Ensure budget is a number
      const numericBudget = parseFloat(budget);
      if (isNaN(numericBudget) || numericBudget < 0) {
        return res.status(400).json({
          error: "Budget must be a valid positive number",
        });
      }

      const project = new Project({
        id: uuidv4(),
        name: name.trim(),
        description: description.trim(),
        client: client.trim(),
        status,
        priority,
        budget: numericBudget,
        currency,
        startDate: start,
        endDate: end,
        manager: req.user.id,
        members: [...new Set([...members, req.user.id])], // Add creator to members and remove duplicates
        tags: tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0), // Clean tags
        color,
        settings: {
          trackTime: true,
          trackActivity: true,
          screenshots: true,
          allowManualTime: true,
          ...settings,
        },
        createdBy: req.user.id,
      });

      await project.save();

      console.log(
        `Project created successfully: ${project.name} by user ${req.user.email}`
      );

      res.status(201).json({
        message: "Project created successfully",
        project,
      });
    } catch (error) {
      console.error("Create project error:", error);

      // Handle MongoDB duplicate key errors
      if (error.code === 11000) {
        return res.status(400).json({
          error: "A project with this name already exists",
        });
      }

      // Handle validation errors from Mongoose
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        }));
        return res.status(400).json({
          error: "Validation failed",
          errors: validationErrors,
        });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update project
router.put(
  "/:id",
  authMiddleware,
  requireManager,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Project name must be between 2 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("client")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Client name must be less than 100 characters"),
    body("status")
      .optional()
      .isIn(["active", "completed", "paused", "cancelled"])
      .withMessage("Invalid status"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Invalid priority"),
    body("budget")
      .optional()
      .isNumeric({ min: 0 })
      .withMessage("Budget must be a positive number"),
    body("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    body("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid date"),
    body("members")
      .optional()
      .isArray()
      .withMessage("Members must be an array"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = { ...req.body };

      // Handle date validation if dates are being updated
      if (updateData.startDate || updateData.endDate) {
        const project = await Project.findOne({ id });
        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }

        const startDate = updateData.startDate
          ? new Date(updateData.startDate)
          : project.startDate;
        const endDate = updateData.endDate
          ? new Date(updateData.endDate)
          : project.endDate;

        if (endDate && endDate <= startDate) {
          return res.status(400).json({
            error: "End date must be after start date",
          });
        }
      }

      // Clean and validate budget if provided
      if (updateData.budget !== undefined) {
        const numericBudget = parseFloat(updateData.budget);
        if (isNaN(numericBudget) || numericBudget < 0) {
          return res.status(400).json({
            error: "Budget must be a valid positive number",
          });
        }
        updateData.budget = numericBudget;
      }

      // Clean tags if provided
      if (updateData.tags) {
        updateData.tags = updateData.tags
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      }

      const project = await Project.findOneAndUpdate({ id }, updateData, {
        new: true,
        runValidators: true,
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      console.log(
        `Project updated successfully: ${project.name} by user ${req.user.email}`
      );

      res.json({
        message: "Project updated successfully",
        project,
      });
    } catch (error) {
      console.error("Update project error:", error);

      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        }));
        return res.status(400).json({
          error: "Validation failed",
          errors: validationErrors,
        });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete project
router.delete("/:id", authMiddleware, requireManager, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOneAndDelete({ id });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Delete related tasks and time entries
    const [deletedTasks, deletedTimeEntries] = await Promise.all([
      Task.deleteMany({ project_id: id }),
      TimeEntry.deleteMany({ project_id: id }),
    ]);

    console.log(
      `Project deleted: ${project.name}, Tasks: ${deletedTasks.deletedCount}, Time entries: ${deletedTimeEntries.deletedCount}`
    );

    res.json({
      message: "Project deleted successfully",
      deletedTasks: deletedTasks.deletedCount,
      deletedTimeEntries: deletedTimeEntries.deletedCount,
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get project tasks
router.get("/:id/tasks", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignee, page = 1, limit = 10 } = req.query;

    // Check if project exists and user has access
    const project = await Project.findOne({ id });
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (req.user.role === "user" && !project.members.includes(req.user.id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const query = { project_id: id };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by assignee
    if (assignee) {
      query.assignee_id = assignee;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const tasks = await Task.find(query)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    console.error("Get project tasks error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create task in project
router.post(
  "/:id/tasks",
  authMiddleware,
  requireManager,
  [
    body("title")
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("Task title must be between 2 and 200 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("assignee_id").notEmpty().withMessage("Assignee is required"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Invalid priority"),
    body("estimatedHours")
      .optional()
      .isNumeric({ min: 0 })
      .withMessage("Estimated hours must be a positive number"),
    body("dueDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid due date format"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const {
        title,
        description = "",
        assignee_id,
        priority = "medium",
        category = "",
        tags = [],
        estimatedHours = 0,
        dueDate,
      } = req.body;

      // Check if project exists
      const project = await Project.findOne({ id });
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Validate due date if provided
      if (dueDate) {
        const due = new Date(dueDate);
        if (isNaN(due.getTime())) {
          return res.status(400).json({ error: "Invalid due date format" });
        }
      }

      const task = new Task({
        id: uuidv4(),
        title: title.trim(),
        description: description.trim(),
        project_id: id,
        assignee_id,
        priority,
        category: category.trim(),
        tags: tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
        estimatedHours: parseFloat(estimatedHours) || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: req.user.id,
      });

      await task.save();

      console.log(
        `Task created: ${task.title} in project ${project.name} by user ${req.user.email}`
      );

      res.status(201).json({
        message: "Task created successfully",
        task,
      });
    } catch (error) {
      console.error("Create task error:", error);

      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map((err) => ({
          field: err.path,
          message: err.message,
        }));
        return res.status(400).json({
          error: "Validation failed",
          errors: validationErrors,
        });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get project statistics
router.get(
  "/stats/dashboard",
  authMiddleware,
  requireManager,
  async (req, res) => {
    try {
      const query = {};

      // If user is not admin, only show stats for projects they manage or are members of
      if (req.user.role === "manager") {
        query.$or = [{ manager: req.user.id }, { members: req.user.id }];
      }

      const [
        totalProjects,
        activeProjects,
        completedProjects,
        pausedProjects,
        cancelledProjects,
      ] = await Promise.all([
        Project.countDocuments(query),
        Project.countDocuments({ ...query, status: "active" }),
        Project.countDocuments({ ...query, status: "completed" }),
        Project.countDocuments({ ...query, status: "paused" }),
        Project.countDocuments({ ...query, status: "cancelled" }),
      ]);

      const projectsByStatus = await Project.aggregate([
        { $match: query },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      const recentProjects = await Project.find(query)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("id name status createdAt client");

      const taskStats = await Task.aggregate([
        ...(Object.keys(query).length > 0
          ? [
              {
                $lookup: {
                  from: "projects",
                  localField: "project_id",
                  foreignField: "id",
                  as: "project",
                },
              },
              { $match: { "project.0": { $exists: true } } },
            ]
          : []),
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      res.json({
        project_stats: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          paused: pausedProjects,
          cancelled: cancelledProjects,
        },
        recent_projects: recentProjects,
        task_stats: taskStats.reduce((acc, item) => {
          acc[item._id || "pending"] = item.count;
          return acc;
        }, {}),
        projects_by_status: projectsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      });
    } catch (error) {
      console.error("Get project stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
