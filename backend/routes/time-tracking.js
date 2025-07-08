// backend/routes/time-tracking.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const TimeEntry = require("../models/TimeEntry");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { authMiddleware, requireManager } = require("../middleware/auth");

const router = express.Router();

// Start time tracking
router.post(
  "/start",
  authMiddleware,
  [
    body("project_id").notEmpty().withMessage("Project ID is required"),
    body("task_id").optional(),
    body("description").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { project_id, task_id, description } = req.body;

      // Check if project exists and user has access
      const project = await Project.findOne({ id: project_id });
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (req.user.role === "user" && !project.members.includes(req.user.id)) {
        return res.status(403).json({ error: "Access denied to this project" });
      }

      // Only check task if provided
      if (task_id) {
        const task = await Task.findOne({ id: task_id, project_id });
        if (!task) {
          return res.status(404).json({ error: "Task not found" });
        }
      }

      // Check if user already has an active time entry
      const activeEntry = await TimeEntry.findOne({
        user_id: req.user.id,
        end_time: null,
      });

      if (activeEntry) {
        return res.status(400).json({
          error: "You already have an active time entry. Please stop it first.",
        });
      }

      const timeEntry = new TimeEntry({
        id: uuidv4(),
        user_id: req.user.id,
        project_id,
        task_id: task_id || null,
        description: description || "Working on project",
        start_time: new Date(),
        is_manual: false,
      });

      await timeEntry.save();

      res.status(201).json({
        message: "Time tracking started",
        ...timeEntry.toObject(),
      });
    } catch (error) {
      console.error("Start time tracking error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Stop time tracking
router.post("/stop/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const timeEntry = await TimeEntry.findOne({
      id,
      user_id: req.user.id,
      end_time: null,
    });

    if (!timeEntry) {
      return res.status(404).json({ error: "Active time entry not found" });
    }

    timeEntry.end_time = new Date();
    timeEntry.duration = Math.floor(
      (timeEntry.end_time - timeEntry.start_time) / 1000
    );

    await timeEntry.save();

    res.json({
      message: "Time tracking stopped",
      ...timeEntry.toObject(),
    });
  } catch (error) {
    console.error("Stop time tracking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get active time entry
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const activeEntry = await TimeEntry.findOne({
      user_id: req.user.id,
      end_time: null,
    });

    res.json(activeEntry || null);
  } catch (error) {
    console.error("Get active time entry error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get time entries
router.get("/entries", authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      project_id,
      task_id,
      start_date,
      end_date,
    } = req.query;

    const query = { user_id: req.user.id };

    if (project_id) {
      query.project_id = project_id;
    }

    if (task_id) {
      query.task_id = task_id;
    }

    if (start_date || end_date) {
      query.start_time = {};
      if (start_date) {
        query.start_time.$gte = new Date(start_date);
      }
      if (end_date) {
        query.start_time.$lte = new Date(end_date);
      }
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { start_time: -1 },
    };

    const entries = await TimeEntry.find(query)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await TimeEntry.countDocuments(query);

    res.json({
      entries,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit),
      },
    });
  } catch (error) {
    console.error("Get time entries error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create manual time entry
router.post(
  "/manual",
  authMiddleware,
  [
    body("project_id").notEmpty().withMessage("Project ID is required"),
    body("task_id").optional(),
    body("start_time").isISO8601().withMessage("Invalid start time"),
    body("end_time").isISO8601().withMessage("Invalid end time"),
    body("description").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { project_id, task_id, start_time, end_time, description } =
        req.body;

      // Check if project exists and user has access
      const project = await Project.findOne({ id: project_id });
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (req.user.role === "user" && !project.members.includes(req.user.id)) {
        return res.status(403).json({ error: "Access denied to this project" });
      }

      // Only check task if provided
      if (task_id) {
        const task = await Task.findOne({ id: task_id, project_id });
        if (!task) {
          return res.status(404).json({ error: "Task not found" });
        }
      }

      // Validate time range
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);

      if (startDate >= endDate) {
        return res
          .status(400)
          .json({ error: "End time must be after start time" });
      }

      const duration = Math.floor((endDate - startDate) / 1000);

      const timeEntry = new TimeEntry({
        id: uuidv4(),
        user_id: req.user.id,
        project_id,
        task_id: task_id || null,
        description,
        start_time: startDate,
        end_time: endDate,
        duration,
        is_manual: true,
      });

      await timeEntry.save();

      res.status(201).json({
        message: "Manual time entry created",
        ...timeEntry.toObject(),
      });
    } catch (error) {
      console.error("Create manual time entry error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update time entry
router.put(
  "/:id",
  authMiddleware,
  [
    body("description").optional().trim(),
    body("start_time").optional().isISO8601().withMessage("Invalid start time"),
    body("end_time").optional().isISO8601().withMessage("Invalid end time"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { description, start_time, end_time } = req.body;

      const timeEntry = await TimeEntry.findOne({
        id,
        user_id: req.user.id,
      });

      if (!timeEntry) {
        return res.status(404).json({ error: "Time entry not found" });
      }

      if (description !== undefined) timeEntry.description = description;
      if (start_time) timeEntry.start_time = new Date(start_time);
      if (end_time) timeEntry.end_time = new Date(end_time);

      if (timeEntry.start_time && timeEntry.end_time) {
        timeEntry.duration = Math.floor(
          (timeEntry.end_time - timeEntry.start_time) / 1000
        );
      }

      await timeEntry.save();

      res.json({
        message: "Time entry updated",
        ...timeEntry.toObject(),
      });
    } catch (error) {
      console.error("Update time entry error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete time entry
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const timeEntry = await TimeEntry.findOneAndDelete({
      id,
      user_id: req.user.id,
    });

    if (!timeEntry) {
      return res.status(404).json({ error: "Time entry not found" });
    }

    res.json({ message: "Time entry deleted successfully" });
  } catch (error) {
    console.error("Delete time entry error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get daily report
router.get("/reports/daily", authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await TimeEntry.find({
      user_id: req.user.id,
      start_time: { $gte: startOfDay, $lte: endOfDay },
      end_time: { $ne: null },
    });

    const totalSeconds = entries.reduce(
      (sum, entry) => sum + entry.duration,
      0
    );
    const totalHours = totalSeconds / 3600;

    const projectBreakdown = entries.reduce((acc, entry) => {
      if (!acc[entry.project_id]) {
        acc[entry.project_id] = {
          project_id: entry.project_id,
          duration: 0,
          entries: 0,
        };
      }
      acc[entry.project_id].duration += entry.duration;
      acc[entry.project_id].entries += 1;
      return acc;
    }, {});

    res.json({
      date: targetDate.toISOString().split("T")[0],
      total_hours: Math.round(totalHours * 100) / 100,
      total_seconds: totalSeconds,
      entries_count: entries.length,
      projects: Object.values(projectBreakdown),
    });
  } catch (error) {
    console.error("Get daily report error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get team time report (manager/admin only)
router.get(
  "/reports/team",
  authMiddleware,
  requireManager,
  async (req, res) => {
    try {
      const { start_date, end_date } = req.query;

      const startDate = start_date
        ? new Date(start_date)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();

      const entries = await TimeEntry.find({
        start_time: { $gte: startDate, $lte: endDate },
        end_time: { $ne: null },
      });

      const teamData = entries.reduce((acc, entry) => {
        if (!acc[entry.user_id]) {
          acc[entry.user_id] = {
            user_id: entry.user_id,
            total_duration: 0,
            entries_count: 0,
            projects: {},
          };
        }

        acc[entry.user_id].total_duration += entry.duration;
        acc[entry.user_id].entries_count += 1;

        if (!acc[entry.user_id].projects[entry.project_id]) {
          acc[entry.user_id].projects[entry.project_id] = 0;
        }
        acc[entry.user_id].projects[entry.project_id] += entry.duration;

        return acc;
      }, {});

      res.json({
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        team_data: Object.values(teamData),
      });
    } catch (error) {
      console.error("Get team time report error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
