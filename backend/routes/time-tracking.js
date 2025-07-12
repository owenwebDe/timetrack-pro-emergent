// backend/routes/time-tracking.js - FIXED with proper error handling and validation
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const TimeEntry = require("../models/TimeEntry");
const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// DIAGNOSTIC ROUTE - Add this after router.use(authMiddleware);
router.post("/diagnose", async (req, res) => {
  const diagnostics = {
    timestamp: new Date(),
    checks: [],
    errors: [],
    success: false,
    user: req.user
      ? {
          id: req.user.id,
          organizationId: req.user.organizationId,
          role: req.user.role,
        }
      : null,
    requestBody: req.body,
  };

  try {
    // Check 1: Authentication
    if (!req.user) {
      diagnostics.errors.push("No user in request");
      diagnostics.checks.push({
        name: "Authentication",
        status: "❌ FAIL",
        details: "req.user is undefined",
      });
    } else {
      diagnostics.checks.push({
        name: "Authentication",
        status: "✅ PASS",
        details: `User ID: ${req.user.id}, Role: ${req.user.role}`,
      });
    }

    // Check 2: Organization
    if (!req.user?.organizationId) {
      diagnostics.errors.push("No organization ID");
      diagnostics.checks.push({
        name: "Organization",
        status: "❌ FAIL",
        details: "req.user.organizationId is undefined",
      });
    } else {
      diagnostics.checks.push({
        name: "Organization",
        status: "✅ PASS",
        details: `Organization ID: ${req.user.organizationId}`,
      });
    }

    // Check 3: Models
    try {
      const TestTimeEntry = require("../models/TimeEntry");
      const TestProject = require("../models/Project");
      diagnostics.checks.push({
        name: "Models Import",
        status: "✅ PASS",
        details: "TimeEntry and Project models imported successfully",
      });
    } catch (error) {
      diagnostics.errors.push(`Model import error: ${error.message}`);
      diagnostics.checks.push({
        name: "Models Import",
        status: "❌ FAIL",
        details: error.message,
      });
    }

    // Check 4: Database Connection
    if (diagnostics.errors.length === 0 && req.user?.organizationId) {
      try {
        const projectCount = await Project.countDocuments({
          organizationId: req.user.organizationId,
        });
        diagnostics.checks.push({
          name: "Database Connection",
          status: "✅ PASS",
          details: `Found ${projectCount} projects in organization`,
        });
      } catch (error) {
        diagnostics.errors.push(`Database error: ${error.message}`);
        diagnostics.checks.push({
          name: "Database Connection",
          status: "❌ FAIL",
          details: error.message,
        });
      }
    }

    diagnostics.success = diagnostics.errors.length === 0;
    res.json(diagnostics);
  } catch (error) {
    res.status(500).json({
      error: "Diagnostic failed",
      details: error.message,
    });
  }
});

// POST /api/time-tracking/start - Start time tracking
router.post("/start", async (req, res) => {
  try {
    const { project_id, task_id, description } = req.body;

    console.log("🚀 Starting time tracking:", {
      user: req.user.id,
      project_id,
      task_id,
      description,
      organizationId: req.user.organizationId,
    });

    // Get default project if none provided
    let actualProjectId = project_id;
    if (!actualProjectId) {
      console.log("🔍 No project provided, finding default project...");
      const defaultProject = await Project.findOne({
        organizationId: req.user.organizationId,
        status: "active"
      }).sort({ createdAt: 1 }); // Get oldest active project as default
      
      if (defaultProject) {
        actualProjectId = defaultProject.id;
        console.log(`🎯 Using default project: ${defaultProject.name} (${actualProjectId})`);
      } else {
        return res.status(400).json({
          error: "No active projects found. Please create a project first.",
        });
      }
    }

    // Verify project exists and user has access
    const project = await Project.findOne({
      id: actualProjectId,
      organizationId: req.user.organizationId,
    });

    if (!project) {
      return res.status(404).json({
        error: "Project not found or you don't have access to it",
      });
    }

    // Check if user has access to this project
    const hasProjectAccess =
      req.user.role === "admin" ||
      req.user.role === "manager" ||
      project.members.includes(req.user.id) ||
      project.manager === req.user.id;

    if (!hasProjectAccess) {
      return res.status(403).json({
        error: "You don't have access to track time on this project",
      });
    }

    // Verify task if provided
    let task = null;
    if (task_id) {
      task = await Task.findOne({
        id: task_id,
        organizationId: req.user.organizationId,
        project_id: actualProjectId,
      });

      if (!task) {
        return res.status(404).json({
          error: "Task not found or doesn't belong to the selected project",
        });
      }

      // Check if user can track time on this task
      const hasTaskAccess =
        req.user.role === "admin" ||
        req.user.role === "manager" ||
        task.assignee_id === req.user.id ||
        task.createdBy === req.user.id ||
        task.watchers.includes(req.user.id);

      if (!hasTaskAccess) {
        return res.status(403).json({
          error: "You don't have permission to track time on this task",
        });
      }
    }

    // Check if user already has an active entry
    const activeEntry = await TimeEntry.findOne({
      organizationId: req.user.organizationId,
      user_id: req.user.id,
      end_time: null,
    });

    if (activeEntry) {
      return res.status(400).json({
        error: "You already have an active time entry. Please stop it first.",
        activeEntry: {
          id: activeEntry.id,
          project_id: activeEntry.project_id,
          start_time: activeEntry.start_time,
          description: activeEntry.description,
        },
      });
    }

    // Create new time entry
    const timeEntry = new TimeEntry({
      id: uuidv4(),
      organizationId: req.user.organizationId,
      user_id: req.user.id,
      project_id: actualProjectId,
      task_id: task_id || null,
      description: description?.trim() || "General work time",
      start_time: new Date(),
      billable: true, // Default to billable
      hourly_rate: req.user.billing?.hourlyRate || 0,
    });

    await timeEntry.save();

    // Update task status to in_progress if task is provided and currently todo
    if (task && task.status === "todo") {
      task.status = "in_progress";
      task.startedAt = new Date();
      await task.save();
      console.log(`📝 Task status updated to in_progress: ${task.title}`);
    }

    // Update task time tracking info
    if (task) {
      task.timeTracking.isActive = true;
      task.timeTracking.activeEntryId = timeEntry.id;
      task.timeTracking.lastStarted = new Date();
      await task.save();
    }

    console.log("✅ Time tracking started successfully:", {
      entryId: timeEntry.id,
      project: project.name,
      task: task?.title,
      user: req.user.name,
    });

    res.status(201).json({
      message: "Time tracking started successfully",
      id: timeEntry.id,
      project_id: timeEntry.project_id,
      task_id: timeEntry.task_id,
      description: timeEntry.description,
      start_time: timeEntry.start_time,
      project_name: project.name,
      task_title: task?.title,
      auto_selected: !project_id, // Indicate if project was auto-selected
    });
  } catch (error) {
    console.error("❌ Start tracking error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      error: "Failed to start time tracking",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// POST /api/time-tracking/stop/:entryId - Stop time tracking
router.post("/stop/:entryId", async (req, res) => {
  try {
    const { entryId } = req.params;

    console.log("🛑 Stopping time tracking:", {
      entryId,
      user: req.user.id,
      organizationId: req.user.organizationId,
    });

    // Find the active time entry
    const timeEntry = await TimeEntry.findOne({
      id: entryId,
      organizationId: req.user.organizationId,
      user_id: req.user.id,
      end_time: null,
    });

    if (!timeEntry) {
      return res.status(404).json({
        error: "Active time entry not found",
      });
    }

    // Calculate duration and stop the entry
    const endTime = new Date();
    const duration = Math.round((endTime - timeEntry.start_time) / 1000); // in seconds
    const totalAmount = (duration / 3600) * (timeEntry.hourly_rate || 0);

    timeEntry.end_time = endTime;
    timeEntry.duration = duration;
    timeEntry.total_amount = totalAmount;

    await timeEntry.save();

    // Update task time tracking info if applicable
    if (timeEntry.task_id) {
      const task = await Task.findOne({
        id: timeEntry.task_id,
        organizationId: req.user.organizationId,
      });

      if (task) {
        task.timeTracking.isActive = false;
        task.timeTracking.activeEntryId = null;
        task.timeTracking.totalTracked += duration;

        // Update actual hours if task has updateTimeTracking method
        if (task.updateTimeTracking) {
          await task.updateTimeTracking();
        }

        await task.save();

        console.log(
          `📝 Task time tracking updated: ${task.title} (+${Math.round(
            duration / 60
          )} minutes)`
        );
      }
    }

    // Update project stats if project has updateStats method
    try {
      const project = await Project.findOne({
        id: timeEntry.project_id,
        organizationId: req.user.organizationId,
      });
      if (project && project.updateStats) {
        await project.updateStats();
      }
    } catch (projectError) {
      console.warn("Failed to update project stats:", projectError);
    }

    console.log("✅ Time tracking stopped successfully:", {
      entryId: timeEntry.id,
      duration: `${Math.round(duration / 60)} minutes`,
      totalAmount: `$${totalAmount.toFixed(2)}`,
    });

    res.json({
      message: "Time tracking stopped successfully",
      id: timeEntry.id,
      duration: duration,
      total_amount: totalAmount,
      start_time: timeEntry.start_time,
      end_time: timeEntry.end_time,
    });
  } catch (error) {
    console.error("❌ Stop tracking error:", error);
    res.status(500).json({
      error: "Failed to stop time tracking",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// GET /api/time-tracking/active - Get active time entry
router.get("/active", async (req, res) => {
  try {
    const activeEntry = await TimeEntry.findOne({
      organizationId: req.user.organizationId,
      user_id: req.user.id,
      end_time: null,
    }).sort({ start_time: -1 });

    if (!activeEntry) {
      return res.json(null);
    }

    // Get project and task info
    const [project, task] = await Promise.all([
      Project.findOne({
        id: activeEntry.project_id,
        organizationId: req.user.organizationId,
      }),
      activeEntry.task_id
        ? Task.findOne({
            id: activeEntry.task_id,
            organizationId: req.user.organizationId,
          })
        : null,
    ]);

    res.json({
      id: activeEntry.id,
      project_id: activeEntry.project_id,
      task_id: activeEntry.task_id,
      description: activeEntry.description,
      start_time: activeEntry.start_time,
      project_name: project?.name,
      task_title: task?.title,
    });
  } catch (error) {
    console.error("❌ Get active entry error:", error);
    res.status(500).json({
      error: "Failed to fetch active time entry",
    });
  }
});

// GET /api/time-tracking/entries - Get time entries
router.get("/entries", async (req, res) => {
  try {
    const {
      limit = 20,
      page = 1,
      project_id,
      task_id,
      start_date,
      end_date,
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {
      organizationId: req.user.organizationId,
      user_id: req.user.id,
    };

    // Apply filters
    if (project_id) query.project_id = project_id;
    if (task_id) query.task_id = task_id;
    if (start_date) {
      query.start_time = { $gte: new Date(start_date) };
    }
    if (end_date) {
      query.start_time = {
        ...query.start_time,
        $lte: new Date(end_date),
      };
    }

    const [entries, total] = await Promise.all([
      TimeEntry.find(query)
        .sort({ start_time: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      TimeEntry.countDocuments(query),
    ]);

    // Get project and task details for each entry
    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        const [project, task] = await Promise.all([
          Project.findOne({
            id: entry.project_id,
            organizationId: req.user.organizationId,
          }),
          entry.task_id
            ? Task.findOne({
                id: entry.task_id,
                organizationId: req.user.organizationId,
              })
            : null,
        ]);

        return {
          ...entry.toJSON(),
          project_name: project?.name,
          project_client: project?.client,
          task_title: task?.title,
        };
      })
    );

    res.json({
      entries: enrichedEntries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Get entries error:", error);
    res.status(500).json({
      error: "Failed to fetch time entries",
    });
  }
});

// POST /api/time-tracking/manual - Create manual time entry
router.post("/manual", async (req, res) => {
  try {
    const {
      project_id,
      task_id,
      description,
      start_time,
      end_time,
      billable = true,
    } = req.body;

    // Validation
    if (!project_id || !start_time || !end_time) {
      return res.status(400).json({
        error: "Project ID, start time, and end time are required",
      });
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (endDate <= startDate) {
      return res.status(400).json({
        error: "End time must be after start time",
      });
    }

    // Verify project access
    const project = await Project.findOne({
      id: project_id,
      organizationId: req.user.organizationId,
    });

    if (!project) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    // Verify task if provided
    if (task_id) {
      const task = await Task.findOne({
        id: task_id,
        organizationId: req.user.organizationId,
        project_id: project_id,
      });

      if (!task) {
        return res.status(404).json({
          error: "Task not found",
        });
      }
    }

    // Calculate duration
    const duration = Math.round((endDate - startDate) / 1000);
    const totalAmount = (duration / 3600) * (req.user.billing?.hourlyRate || 0);

    // Create manual time entry
    const timeEntry = new TimeEntry({
      id: uuidv4(),
      organizationId: req.user.organizationId,
      user_id: req.user.id,
      project_id,
      task_id: task_id || null,
      description: description?.trim() || "Manual time entry",
      start_time: startDate,
      end_time: endDate,
      duration,
      total_amount: totalAmount,
      billable,
      is_manual: true,
      hourly_rate: req.user.billing?.hourlyRate || 0,
    });

    await timeEntry.save();

    res.status(201).json({
      message: "Manual time entry created successfully",
      entry: timeEntry,
    });
  } catch (error) {
    console.error("❌ Create manual entry error:", error);
    res.status(500).json({
      error: "Failed to create manual time entry",
    });
  }
});

// PUT /api/time-tracking/entries/:entryId - Update time entry
router.put("/entries/:entryId", async (req, res) => {
  try {
    const { entryId } = req.params;
    const { description, billable, start_time, end_time } = req.body;

    const timeEntry = await TimeEntry.findOne({
      id: entryId,
      organizationId: req.user.organizationId,
      user_id: req.user.id,
    });

    if (!timeEntry) {
      return res.status(404).json({
        error: "Time entry not found",
      });
    }

    // Update allowed fields
    if (description !== undefined) timeEntry.description = description;
    if (billable !== undefined) timeEntry.billable = billable;

    // Handle time changes for completed entries
    if (timeEntry.end_time && start_time && end_time) {
      const newStart = new Date(start_time);
      const newEnd = new Date(end_time);

      if (newEnd <= newStart) {
        return res.status(400).json({
          error: "End time must be after start time",
        });
      }

      timeEntry.start_time = newStart;
      timeEntry.end_time = newEnd;
      timeEntry.duration = Math.round((newEnd - newStart) / 1000);
      timeEntry.total_amount =
        (timeEntry.duration / 3600) * (timeEntry.hourly_rate || 0);
    }

    await timeEntry.save();

    res.json({
      message: "Time entry updated successfully",
      entry: timeEntry,
    });
  } catch (error) {
    console.error("❌ Update entry error:", error);
    res.status(500).json({
      error: "Failed to update time entry",
    });
  }
});

// DELETE /api/time-tracking/entries/:entryId - Delete time entry
router.delete("/entries/:entryId", async (req, res) => {
  try {
    const { entryId } = req.params;

    const timeEntry = await TimeEntry.findOne({
      id: entryId,
      organizationId: req.user.organizationId,
      user_id: req.user.id,
    });

    if (!timeEntry) {
      return res.status(404).json({
        error: "Time entry not found",
      });
    }

    // Cannot delete active entries
    if (!timeEntry.end_time) {
      return res.status(400).json({
        error: "Cannot delete active time entry. Stop it first.",
      });
    }

    await TimeEntry.deleteOne({ id: entryId });

    res.json({
      message: "Time entry deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete entry error:", error);
    res.status(500).json({
      error: "Failed to delete time entry",
    });
  }
});

// GET /api/time-tracking/stats - Get time tracking statistics
router.get("/stats", async (req, res) => {
  try {
    const { period = "week" } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const stats = await TimeEntry.aggregate([
      {
        $match: {
          organizationId: req.user.organizationId,
          user_id: req.user.id,
          start_time: { $gte: startDate },
          end_time: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: "$duration" },
          totalAmount: { $sum: "$total_amount" },
          entryCount: { $sum: 1 },
          avgDuration: { $avg: "$duration" },
        },
      },
    ]);

    const result = stats[0] || {
      totalDuration: 0,
      totalAmount: 0,
      entryCount: 0,
      avgDuration: 0,
    };

    res.json({
      period,
      stats: {
        totalHours: Math.round((result.totalDuration / 3600) * 100) / 100,
        totalAmount: Math.round(result.totalAmount * 100) / 100,
        entryCount: result.entryCount,
        avgHours: Math.round((result.avgDuration / 3600) * 100) / 100,
      },
    });
  } catch (error) {
    console.error("❌ Get stats error:", error);
    res.status(500).json({
      error: "Failed to fetch time tracking statistics",
    });
  }
});

module.exports = router;