// backend/routes/projects.js - ENHANCED with task assignment and role-based permissions
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const TimeEntry = require("../models/TimeEntry");
const {
  authMiddleware,
  requireManager,
  requireProjectAccess,
  logOrganizationActivity,
} = require("../middleware/auth");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/projects - Get organization's projects
router.get("/", async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const query = { organizationId: req.user.organizationId };
    if (status) query.status = status;

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// GET /api/projects/stats/dashboard - Get project statistics
router.get("/stats/dashboard", async (req, res) => {
  try {
    const stats = await Project.getOrgStats(req.user.organizationId);

    const summary = {
      total: 0,
      active: 0,
      completed: 0,
      paused: 0,
      cancelled: 0,
      totalBudget: 0,
      totalEarnings: 0,
    };

    stats.forEach((stat) => {
      summary.total += stat.count;
      summary[stat._id] = stat.count;
      summary.totalBudget += stat.totalBudget || 0;
      summary.totalEarnings += stat.totalEarnings || 0;
    });

    res.json(summary);
  } catch (error) {
    console.error("Get project stats error:", error);
    res.status(500).json({ error: "Failed to fetch project statistics" });
  }
});

// POST /api/projects - Create new project (Admin/Manager only)
router.post("/", requireManager, async (req, res) => {
  try {
    const {
      name,
      description,
      client,
      budget,
      startDate,
      endDate,
      estimatedHours,
      priority = "medium",
      color = "#3B82F6",
      settings = {},
    } = req.body;

    // Validation
    if (!name || !client || !startDate) {
      return res.status(400).json({
        error: "Name, client, and start date are required",
      });
    }

    if (budget !== undefined && budget < 0) {
      return res.status(400).json({
        error: "Budget cannot be negative",
      });
    }

    const project = new Project({
      id: uuidv4(),
      organizationId: req.user.organizationId,
      name: name.trim(),
      description: description?.trim() || "",
      client: client.trim(),
      budget: budget || 0,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      estimatedHours: estimatedHours || 0,
      priority,
      color,
      manager: req.user.id,
      members: [req.user.id],
      settings: {
        trackTime: true,
        trackActivity: true,
        screenshots: true,
        allowManualTime: true,
        requireTaskSelection: false,
        allowOvertime: true,
        sendNotifications: true,
        ...settings,
      },
      createdBy: req.user.id,
    });

    await project.save();

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: "Validation failed",
        errors,
      });
    }

    res.status(500).json({ error: "Failed to create project" });
  }
});

// GET /api/projects/:id - Get specific project
router.get("/:id", requireProjectAccess, async (req, res) => {
  try {
    res.json(req.project);
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// PUT /api/projects/:id - Update project (Manager/Admin only)
router.put("/:id", requireProjectAccess, async (req, res) => {
  try {
    const project = req.project;

    // Check if user can manage this project
    if (!project.canManage(req.user)) {
      return res.status(403).json({
        error: "You don't have permission to manage this project",
      });
    }

    const allowedUpdates = [
      "name",
      "description",
      "client",
      "budget",
      "status",
      "priority",
      "endDate",
      "estimatedHours",
      "color",
      "settings",
      "tags",
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(project, updates);
    await project.save();

    res.json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// GET /api/projects/:id/tasks - Get project tasks (accessible to all organization members for time tracking)
router.get("/:id/tasks", async (req, res) => {
  try {
    const { status, assignee, priority, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Verify project exists in the organization
    const project = await Project.findOne({
      id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!project) {
      return res.status(404).json({
        error: "Project not found in your organization",
      });
    }

    const query = {
      organizationId: req.user.organizationId,
      project_id: req.params.id,
    };

    // Apply filters
    if (status) query.status = status;
    if (assignee) query.assignee_id = assignee;
    if (priority) query.priority = priority;

    // All organization members can see all tasks for time tracking purposes
    // No role-based filtering applied

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Task.countDocuments(query);

    // Get assignee details for tasks
    const assigneeIds = [...new Set(tasks.map((task) => task.assignee_id))];
    const assignees = await User.findInOrganization(req.user.organizationId, {
      id: { $in: assigneeIds },
    }).select("id name email role avatar");

    const tasksWithAssignees = tasks.map((task) => {
      const assignee = assignees.find((user) => user.id === task.assignee_id);
      return {
        ...task.toJSON(),
        assignee: assignee ? assignee.toTeamJSON() : null,
      };
    });

    res.json({
      tasks: tasksWithAssignees,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get project tasks error:", error);
    res.status(500).json({ error: "Failed to fetch project tasks" });
  }
});

// POST /api/projects/:id/tasks - Create task with role-based assignment
router.post("/:id/tasks", requireProjectAccess, async (req, res) => {
  try {
    const {
      title,
      description,
      assignee_id,
      priority = "medium",
      dueDate,
      estimatedHours = 0,
      tags = [],
    } = req.body;

    // Validation
    if (!title || !assignee_id) {
      return res.status(400).json({
        error: "Title and assignee are required",
      });
    }

    // Verify assignee exists and is in the same organization
    const assignee = await User.findOne({
      id: assignee_id,
      organizationId: req.user.organizationId,
      isActive: true,
    });

    if (!assignee) {
      return res.status(400).json({
        error: "Assignee not found in your organization",
      });
    }

    // Role-based assignment rules
    if (req.user.role === "user") {
      return res.status(403).json({
        error: "Only managers and admins can create tasks",
      });
    }

    if (req.user.role === "manager") {
      // Managers can only assign to users, not to other managers or admins
      if (assignee.role !== "user") {
        return res.status(403).json({
          error: "Managers can only assign tasks to regular users",
        });
      }
    }

    // Admins can assign to anyone in the organization

    const task = new Task({
      id: uuidv4(),
      organizationId: req.user.organizationId,
      title: title.trim(),
      description: description?.trim() || "",
      project_id: req.params.id,
      assignee_id,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours,
      tags,
      createdBy: req.user.id,
    });

    await task.save();

    // Update project stats
    await req.project.updateStats();

    // Get assignee details for response
    const taskWithAssignee = {
      ...task.toJSON(),
      assignee: assignee.toTeamJSON(),
    };

    res.status(201).json({
      message: "Task created successfully",
      task: taskWithAssignee,
    });
  } catch (error) {
    console.error("Create task error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: "Validation failed",
        errors,
      });
    }

    res.status(500).json({ error: "Failed to create task" });
  }
});

// PUT /api/projects/:projectId/tasks/:taskId - Update task with role-based permissions
router.put(
  "/:projectId/tasks/:taskId",
  requireProjectAccess,
  async (req, res) => {
    try {
      const task = await Task.findOne({
        id: req.params.taskId,
        organizationId: req.user.organizationId,
        project_id: req.params.projectId,
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check if user can manage this task
      if (!task.canManage(req.user)) {
        return res.status(403).json({
          error: "You don't have permission to modify this task",
        });
      }

      const allowedUpdates = [
        "title",
        "description",
        "status",
        "priority",
        "dueDate",
        "estimatedHours",
        "tags",
        "assignee_id",
      ];

      const updates = {};
      Object.keys(req.body).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      // Special handling for assignee change
      if (updates.assignee_id && updates.assignee_id !== task.assignee_id) {
        // Role-based assignment rules for updates
        if (req.user.role === "user") {
          return res.status(403).json({
            error: "Only managers and admins can reassign tasks",
          });
        }

        const newAssignee = await User.findOne({
          id: updates.assignee_id,
          organizationId: req.user.organizationId,
          isActive: true,
        });

        if (!newAssignee) {
          return res.status(400).json({
            error: "New assignee not found in your organization",
          });
        }

        if (req.user.role === "manager" && newAssignee.role !== "user") {
          return res.status(403).json({
            error: "Managers can only assign tasks to regular users",
          });
        }
      }

      Object.assign(task, updates);
      await task.save();

      // Update project stats
      await req.project.updateStats();

      // Get updated assignee details
      const assignee = await User.findOne({
        id: task.assignee_id,
        organizationId: req.user.organizationId,
      });

      const taskWithAssignee = {
        ...task.toJSON(),
        assignee: assignee ? assignee.toTeamJSON() : null,
      };

      res.json({
        message: "Task updated successfully",
        task: taskWithAssignee,
      });
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  }
);

// DELETE /api/projects/:projectId/tasks/:taskId - Delete task
router.delete(
  "/:projectId/tasks/:taskId",
  requireProjectAccess,
  async (req, res) => {
    try {
      const task = await Task.findOne({
        id: req.params.taskId,
        organizationId: req.user.organizationId,
        project_id: req.params.projectId,
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check if user can manage this task
      if (!task.canManage(req.user)) {
        return res.status(403).json({
          error: "You don't have permission to delete this task",
        });
      }

      await Task.deleteOne({ id: req.params.taskId });

      // Update project stats
      await req.project.updateStats();

      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  }
);

// GET /api/projects/:id/members - Get project members
router.get("/:id/members", requireProjectAccess, async (req, res) => {
  try {
    const project = req.project;

    const members = await User.findInOrganization(req.user.organizationId, {
      id: { $in: project.members },
    }).select("id name email role avatar department jobTitle");

    const membersWithRoles = members.map((member) => ({
      ...member.toTeamJSON(),
      isManager: member.id === project.manager,
      canAssignTasks:
        member.role === "admin" ||
        (member.role === "manager" && member.id === project.manager),
    }));

    res.json({ members: membersWithRoles });
  } catch (error) {
    console.error("Get project members error:", error);
    res.status(500).json({ error: "Failed to fetch project members" });
  }
});

// POST /api/projects/:id/members - Add member to project
router.post("/:id/members", requireProjectAccess, async (req, res) => {
  try {
    const { userId } = req.body;
    const project = req.project;

    // Check if user can manage this project
    if (!project.canManage(req.user)) {
      return res.status(403).json({
        error: "You don't have permission to manage project members",
      });
    }

    // Verify user exists and is in the same organization
    const user = await User.findOne({
      id: userId,
      organizationId: req.user.organizationId,
      isActive: true,
    });

    if (!user) {
      return res.status(400).json({
        error: "User not found in your organization",
      });
    }

    // Add member to project
    project.addMember(userId);
    await project.save();

    res.json({
      message: "Member added to project successfully",
      member: user.toTeamJSON(),
    });
  } catch (error) {
    console.error("Add project member error:", error);
    res.status(500).json({ error: "Failed to add member to project" });
  }
});

// DELETE /api/projects/:id/members/:userId - Remove member from project
router.delete(
  "/:id/members/:userId",
  requireProjectAccess,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const project = req.project;

      // Check if user can manage this project
      if (!project.canManage(req.user)) {
        return res.status(403).json({
          error: "You don't have permission to manage project members",
        });
      }

      try {
        project.removeMember(userId);
        await project.save();

        res.json({ message: "Member removed from project successfully" });
      } catch (error) {
        if (error.message.includes("Cannot remove project manager")) {
          return res.status(400).json({
            error: "Cannot remove project manager from members",
          });
        }
        throw error;
      }
    } catch (error) {
      console.error("Remove project member error:", error);
      res.status(500).json({ error: "Failed to remove member from project" });
    }
  }
);

// GET /api/projects/:id/assignable-users - Get users that can be assigned tasks
router.get("/:id/assignable-users", requireProjectAccess, async (req, res) => {
  try {
    let query = { organizationId: req.user.organizationId, isActive: true };

    // Role-based filtering for assignable users
    if (req.user.role === "manager") {
      // Managers can only assign to regular users
      query.role = "user";
    }
    // Admins can assign to anyone (no additional filter needed)

    const users = await User.find(query)
      .select("id name email role avatar department jobTitle")
      .sort({ name: 1 });

    const assignableUsers = users.map((user) => ({
      ...user.toTeamJSON(),
      canBeAssignedBy:
        req.user.role === "admin" ||
        (req.user.role === "manager" && user.role === "user"),
    }));

    res.json({ users: assignableUsers });
  } catch (error) {
    console.error("Get assignable users error:", error);
    res.status(500).json({ error: "Failed to fetch assignable users" });
  }
});

// backend/routes/projects.js - ADDITIONAL ROUTE for enhanced task assignment validation
// Add this route to your existing projects.js file

// Enhanced task assignment validation function
const validateTaskAssignment = (assignerRole, assigneeRole) => {
  // Admin can assign to anyone
  if (assignerRole === "admin") {
    return { valid: true };
  }

  // Manager can only assign to users
  if (assignerRole === "manager") {
    if (assigneeRole === "user") {
      return { valid: true };
    } else {
      return {
        valid: false,
        message:
          "Managers can only assign tasks to regular users, not to other managers or admins",
      };
    }
  }

  // Users cannot assign tasks
  if (assignerRole === "user") {
    return {
      valid: false,
      message:
        "Regular users cannot create or assign tasks. Contact your manager or admin.",
    };
  }

  return {
    valid: false,
    message: "Invalid role configuration",
  };
};

// Enhanced middleware for task assignment validation
const validateTaskAssignmentMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // For task creation or assignment changes
    if (req.body.assignee_id) {
      const assigneeId = req.body.assignee_id;

      // Find the assignee in the same organization
      const assignee = await User.findOne({
        id: assigneeId,
        organizationId: req.user.organizationId,
        isActive: true,
      });

      if (!assignee) {
        return res.status(400).json({
          error: "Assignee not found in your organization or is inactive",
        });
      }

      // Validate the assignment based on roles
      const validation = validateTaskAssignment(req.user.role, assignee.role);

      if (!validation.valid) {
        return res.status(403).json({
          error: validation.message,
          assignerRole: req.user.role,
          assigneeRole: assignee.role,
        });
      }

      // Add assignee info to request for later use
      req.assignee = assignee;
    }

    next();
  } catch (error) {
    console.error("Task assignment validation error:", error);
    res.status(500).json({ error: "Task assignment validation failed" });
  }
};

// Replace the existing POST /api/projects/:id/tasks route with this enhanced version
router.post(
  "/:id/tasks",
  requireProjectAccess,
  validateTaskAssignmentMiddleware,
  async (req, res) => {
    try {
      const {
        title,
        description,
        assignee_id,
        priority = "medium",
        dueDate,
        estimatedHours = 0,
        tags = [],
      } = req.body;

      // Enhanced validation
      if (!title || title.trim().length < 2) {
        return res.status(400).json({
          error:
            "Task title is required and must be at least 2 characters long",
        });
      }

      if (!assignee_id) {
        return res.status(400).json({
          error: "Assignee is required for task creation",
        });
      }

      // Validate priority
      const validPriorities = ["low", "medium", "high", "urgent"];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          error: `Priority must be one of: ${validPriorities.join(", ")}`,
        });
      }

      // Validate estimated hours
      if (estimatedHours < 0 || estimatedHours > 1000) {
        return res.status(400).json({
          error: "Estimated hours must be between 0 and 1000",
        });
      }

      // Validate due date
      if (dueDate) {
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (due < today) {
          return res.status(400).json({
            error: "Due date cannot be in the past",
          });
        }
      }

      // Validate and process tags
      let processedTags = [];
      if (Array.isArray(tags)) {
        processedTags = tags
          .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
          .filter((tag) => tag.length > 0)
          .slice(0, 10); // Limit to 10 tags
      }

      // Create the task
      const task = new Task({
        id: uuidv4(),
        organizationId: req.user.organizationId,
        title: title.trim(),
        description: description?.trim() || "",
        project_id: req.params.id,
        assignee_id,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: parseFloat(estimatedHours) || 0,
        tags: processedTags,
        createdBy: req.user.id,
        status: "todo", // Default status
      });

      await task.save();

      // Update project stats
      await req.project.updateStats();

      // Get assignee details for response (already validated in middleware)
      const assignee = req.assignee;

      // Prepare response with full task details
      const taskWithAssignee = {
        ...task.toJSON(),
        assignee: assignee.toTeamJSON(),
        projectName: req.project.name,
        projectClient: req.project.client,
      };

      // Log the successful task creation
      console.log(
        `✅ Task created: "${title}" assigned to ${assignee.name} (${assignee.role}) by ${req.user.name} (${req.user.role})`
      );

      res.status(201).json({
        message: "Task created and assigned successfully",
        task: taskWithAssignee,
        assignment: {
          assignedTo: assignee.name,
          assignedToRole: assignee.role,
          assignedBy: req.user.name,
          assignedByRole: req.user.role,
        },
      });
    } catch (error) {
      console.error("Create task error:", error);

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          error: "Task validation failed",
          errors,
        });
      }

      if (error.code === 11000) {
        return res.status(400).json({
          error: "Task with this title already exists in the project",
        });
      }

      res.status(500).json({
        error: "Failed to create task. Please try again.",
      });
    }
  }
);

// Enhanced PUT route for task updates with assignment validation
router.put(
  "/:projectId/tasks/:taskId",
  requireProjectAccess,
  validateTaskAssignmentMiddleware,
  async (req, res) => {
    try {
      const task = await Task.findOne({
        id: req.params.taskId,
        organizationId: req.user.organizationId,
        project_id: req.params.projectId,
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Enhanced permission check
      const canManageTask =
        task.assignee_id === req.user.id ||
        task.createdBy === req.user.id ||
        req.user.role === "admin" ||
        req.user.role === "manager";

      if (!canManageTask) {
        return res.status(403).json({
          error: "You don't have permission to modify this task",
          details:
            "Only the task assignee, creator, managers, or admins can modify tasks",
        });
      }

      // Define allowed updates based on user role
      let allowedUpdates = [
        "title",
        "description",
        "status",
        "priority",
        "dueDate",
        "estimatedHours",
        "tags",
      ];

      // Only certain roles can reassign tasks
      if (
        req.user.role === "user" &&
        req.body.assignee_id &&
        req.body.assignee_id !== task.assignee_id
      ) {
        return res.status(403).json({
          error: "Regular users cannot reassign tasks to other people",
        });
      }

      const updates = {};
      Object.keys(req.body).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      // Special validation for status changes
      if (updates.status) {
        const validStatuses = [
          "todo",
          "in_progress",
          "in_review",
          "completed",
          "cancelled",
          "blocked",
        ];
        if (!validStatuses.includes(updates.status)) {
          return res.status(400).json({
            error: `Status must be one of: ${validStatuses.join(", ")}`,
          });
        }

        // Log status changes for audit
        if (updates.status !== task.status) {
          console.log(
            `📝 Task status changed: "${task.title}" from ${task.status} to ${updates.status} by ${req.user.name}`
          );
        }
      }

      // Apply updates
      Object.assign(task, updates);
      await task.save();

      // Update project stats
      await req.project.updateStats();

      // Get updated assignee details
      const assignee =
        req.assignee ||
        (await User.findOne({
          id: task.assignee_id,
          organizationId: req.user.organizationId,
        }));

      const taskWithAssignee = {
        ...task.toJSON(),
        assignee: assignee ? assignee.toTeamJSON() : null,
        projectName: req.project.name,
      };

      res.json({
        message: "Task updated successfully",
        task: taskWithAssignee,
        updatedBy: {
          name: req.user.name,
          role: req.user.role,
        },
      });
    } catch (error) {
      console.error("Update task error:", error);

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          error: "Task validation failed",
          errors,
        });
      }

      res.status(500).json({ error: "Failed to update task" });
    }
  }
);

// New route: Get task assignment rules for frontend
router.get("/assignment-rules", authMiddleware, (req, res) => {
  const userRole = req.user.role;

  const rules = {
    canCreateTasks: ["admin", "manager"].includes(userRole),
    canAssignToRoles: [],
    restrictions: [],
  };

  switch (userRole) {
    case "admin":
      rules.canAssignToRoles = ["admin", "manager", "user"];
      rules.restrictions = ["Can assign tasks to anyone in the organization"];
      break;
    case "manager":
      rules.canAssignToRoles = ["user"];
      rules.restrictions = [
        "Can only assign tasks to regular users, not to managers or admins",
      ];
      break;
    case "user":
      rules.canAssignToRoles = [];
      rules.restrictions = [
        "Cannot create or assign tasks. Contact your manager or admin.",
      ];
      break;
    default:
      rules.restrictions = ["Invalid role"];
  }

  res.json({
    role: userRole,
    rules,
    organizationId: req.user.organizationId,
  });
});

module.exports = router;
