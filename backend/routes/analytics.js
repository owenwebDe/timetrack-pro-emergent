const express = require("express");
const TimeEntry = require("../models/TimeEntry");
const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const { authMiddleware, requireManager } = require("../middleware/auth");

const router = express.Router();

// Get dashboard analytics - FIXED: Organization-scoped
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const { period = "week" } = req.query;

    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "day":
        startDate.setDate(endDate.getDate() - 1);
        break;
      case "week":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // FIXED: Get time entries for the period filtered by organization
    const entries = await TimeEntry.find({
      user_id: req.user.id,
      organizationId: req.user.organizationId, // CRITICAL FIX
      start_time: { $gte: startDate, $lte: endDate },
      end_time: { $ne: null },
    });

    // Calculate user stats
    const totalHours =
      entries.reduce((sum, entry) => sum + entry.duration, 0) / 3600;
    const totalEntries = entries.length;
    const avgActivity =
      entries.length > 0
        ? entries.reduce((sum, entry) => sum + entry.activity_level, 0) /
          entries.length
        : 0;

    // Project breakdown
    const projectBreakdown = entries.reduce((acc, entry) => {
      if (!acc[entry.project_id]) {
        acc[entry.project_id] = {
          project_id: entry.project_id,
          hours: 0,
          entries: 0,
        };
      }
      acc[entry.project_id].hours += entry.duration / 3600;
      acc[entry.project_id].entries += 1;
      return acc;
    }, {});

    // Productivity trend (daily aggregation)
    const dailyTrend = {};
    entries.forEach((entry) => {
      const date = entry.start_time.toISOString().split("T")[0];
      if (!dailyTrend[date]) {
        dailyTrend[date] = {
          date,
          hours: 0,
          activity: 0,
          entries: 0,
        };
      }
      dailyTrend[date].hours += entry.duration / 3600;
      dailyTrend[date].activity += entry.activity_level;
      dailyTrend[date].entries += 1;
    });

    // Calculate average activity per day
    Object.values(dailyTrend).forEach((day) => {
      if (day.entries > 0) {
        day.activity = day.activity / day.entries;
      }
    });

    console.log(
      `Dashboard analytics for user ${req.user.email} in organization ${req.user.organizationId}`
    );

    res.json({
      user_stats: {
        total_hours: Math.round(totalHours * 100) / 100,
        total_entries: totalEntries,
        avg_activity: Math.round(avgActivity * 100) / 100,
        productive_days: Object.keys(dailyTrend).length,
      },
      productivity_trend: Object.values(dailyTrend).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      ),
      project_breakdown: Object.values(projectBreakdown),
      period,
    });
  } catch (error) {
    console.error("Get dashboard analytics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get team analytics (manager/admin only) - FIXED: Organization-scoped
router.get("/team", authMiddleware, requireManager, async (req, res) => {
  try {
    const { period = "week" } = req.query;

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "day":
        startDate.setDate(endDate.getDate() - 1);
        break;
      case "week":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // FIXED: Get all time entries for the period filtered by organization
    const entries = await TimeEntry.find({
      organizationId: req.user.organizationId, // CRITICAL FIX
      start_time: { $gte: startDate, $lte: endDate },
      end_time: { $ne: null },
    });

    // Team statistics
    const teamStats = entries.reduce((acc, entry) => {
      if (!acc[entry.user_id]) {
        acc[entry.user_id] = {
          user_id: entry.user_id,
          total_hours: 0,
          total_entries: 0,
          avg_activity: 0,
          projects: new Set(),
        };
      }

      acc[entry.user_id].total_hours += entry.duration / 3600;
      acc[entry.user_id].total_entries += 1;
      acc[entry.user_id].avg_activity += entry.activity_level;
      acc[entry.user_id].projects.add(entry.project_id);

      return acc;
    }, {});

    // Calculate averages
    Object.values(teamStats).forEach((user) => {
      user.avg_activity =
        user.total_entries > 0 ? user.avg_activity / user.total_entries : 0;
      user.projects_count = user.projects.size;
      user.projects = Array.from(user.projects);
    });

    // Daily productivity
    const dailyProductivity = {};
    entries.forEach((entry) => {
      const date = entry.start_time.toISOString().split("T")[0];
      if (!dailyProductivity[date]) {
        dailyProductivity[date] = {
          date,
          total_hours: 0,
          avg_activity: 0,
          active_users: new Set(),
        };
      }
      dailyProductivity[date].total_hours += entry.duration / 3600;
      dailyProductivity[date].avg_activity += entry.activity_level;
      dailyProductivity[date].active_users.add(entry.user_id);
    });

    // Calculate daily averages
    Object.values(dailyProductivity).forEach((day) => {
      const entriesCount = entries.filter(
        (e) => e.start_time.toISOString().split("T")[0] === day.date
      ).length;
      day.avg_activity = entriesCount > 0 ? day.avg_activity / entriesCount : 0;
      day.active_users = day.active_users.size;
    });

    // Project statistics - FIXED: Organization-scoped
    const projectStats = entries.reduce((acc, entry) => {
      if (!acc[entry.project_id]) {
        acc[entry.project_id] = {
          project_id: entry.project_id,
          total_hours: 0,
          contributors: new Set(),
        };
      }
      acc[entry.project_id].total_hours += entry.duration / 3600;
      acc[entry.project_id].contributors.add(entry.user_id);
      return acc;
    }, {});

    Object.values(projectStats).forEach((project) => {
      project.contributors = project.contributors.size;
    });

    // Summary statistics
    const summary = {
      total_hours:
        entries.reduce((sum, entry) => sum + entry.duration, 0) / 3600,
      total_entries: entries.length,
      active_users: Object.keys(teamStats).length,
      active_projects: Object.keys(projectStats).length,
      avg_activity:
        entries.length > 0
          ? entries.reduce((sum, entry) => sum + entry.activity_level, 0) /
            entries.length
          : 0,
    };

    console.log(
      `Team analytics for organization ${req.user.organizationId}: ${summary.active_users} users, ${summary.active_projects} projects`
    );

    res.json({
      team_stats: Object.values(teamStats),
      daily_productivity: Object.values(dailyProductivity).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      ),
      project_stats: Object.values(projectStats),
      summary,
      period,
    });
  } catch (error) {
    console.error("Get team analytics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get productivity analytics - FIXED: Organization-scoped
router.get("/productivity", authMiddleware, async (req, res) => {
  try {
    const { period = "week", user_id } = req.query;

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case "day":
        startDate.setDate(endDate.getDate() - 1);
        break;
      case "week":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Query filter - FIXED: Always include organization filter
    const query = {
      organizationId: req.user.organizationId, // CRITICAL FIX
      start_time: { $gte: startDate, $lte: endDate },
      end_time: { $ne: null },
    };

    // If user_id is provided and user is manager/admin, filter by user
    if (user_id && ["admin", "manager"].includes(req.user.role)) {
      // FIXED: Ensure user_id belongs to same organization
      const targetUser = await User.findOne({
        id: user_id,
        organizationId: req.user.organizationId,
      });

      if (!targetUser) {
        return res
          .status(404)
          .json({ error: "User not found in your organization" });
      }

      query.user_id = user_id;
    } else {
      query.user_id = req.user.id;
    }

    const entries = await TimeEntry.find(query);

    // Productivity chart data (hourly breakdown)
    const hourlyData = {};
    entries.forEach((entry) => {
      const hour = entry.start_time.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = {
          hour,
          total_duration: 0,
          avg_activity: 0,
          entries_count: 0,
        };
      }
      hourlyData[hour].total_duration += entry.duration;
      hourlyData[hour].avg_activity += entry.activity_level;
      hourlyData[hour].entries_count += 1;
    });

    // Calculate averages
    Object.values(hourlyData).forEach((hour) => {
      hour.avg_activity =
        hour.entries_count > 0 ? hour.avg_activity / hour.entries_count : 0;
    });

    // Overall productivity metrics
    const totalHours =
      entries.reduce((sum, entry) => sum + entry.duration, 0) / 3600;
    const avgActivity =
      entries.length > 0
        ? entries.reduce((sum, entry) => sum + entry.activity_level, 0) /
          entries.length
        : 0;

    // Productivity score calculation (based on activity level and hours worked)
    const targetHours =
      period === "day"
        ? 8
        : period === "week"
        ? 40
        : period === "month"
        ? 160
        : 1920;
    const hoursScore = Math.min(totalHours / targetHours, 1) * 50;
    const activityScore = (avgActivity / 100) * 50;
    const productivityScore = hoursScore + activityScore;

    res.json({
      productivity_chart: Object.values(hourlyData).sort(
        (a, b) => a.hour - b.hour
      ),
      productivity_score: Math.round(productivityScore * 100) / 100,
      total_hours: Math.round(totalHours * 100) / 100,
      avg_activity: Math.round(avgActivity * 100) / 100,
      period,
    });
  } catch (error) {
    console.error("Get productivity analytics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate custom report - FIXED: Organization-scoped
router.post(
  "/reports/custom",
  authMiddleware,
  requireManager,
  async (req, res) => {
    try {
      const {
        start_date,
        end_date,
        user_ids = [],
        project_ids = [],
        metrics = ["hours", "activity", "projects"],
      } = req.body;

      if (!start_date || !end_date) {
        return res
          .status(400)
          .json({ error: "Start date and end date are required" });
      }

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      // FIXED: Always filter by organization
      const query = {
        organizationId: req.user.organizationId, // CRITICAL FIX
        start_time: { $gte: startDate, $lte: endDate },
        end_time: { $ne: null },
      };

      // Filter by users - FIXED: Ensure users belong to same organization
      if (user_ids.length > 0) {
        const orgUsers = await User.find({
          id: { $in: user_ids },
          organizationId: req.user.organizationId,
        }).select("id");

        const validUserIds = orgUsers.map((u) => u.id);
        query.user_id = { $in: validUserIds };
      }

      // Filter by projects - FIXED: Ensure projects belong to same organization
      if (project_ids.length > 0) {
        const orgProjects = await Project.find({
          id: { $in: project_ids },
          organizationId: req.user.organizationId,
        }).select("id");

        const validProjectIds = orgProjects.map((p) => p.id);
        query.project_id = { $in: validProjectIds };
      }

      const entries = await TimeEntry.find(query);

      const report = {
        date_range: {
          start: start_date,
          end: end_date,
        },
        filters: {
          users: user_ids,
          projects: project_ids,
          organization: req.user.organizationId,
        },
        metrics: {},
      };

      // Calculate requested metrics
      if (metrics.includes("hours")) {
        report.metrics.total_hours =
          entries.reduce((sum, entry) => sum + entry.duration, 0) / 3600;
        report.metrics.avg_daily_hours =
          report.metrics.total_hours /
          Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      }

      if (metrics.includes("activity")) {
        report.metrics.avg_activity =
          entries.length > 0
            ? entries.reduce((sum, entry) => sum + entry.activity_level, 0) /
              entries.length
            : 0;
      }

      if (metrics.includes("projects")) {
        const projectsWorked = new Set(
          entries.map((entry) => entry.project_id)
        );
        report.metrics.projects_worked = projectsWorked.size;
        report.metrics.project_distribution = {};

        entries.forEach((entry) => {
          if (!report.metrics.project_distribution[entry.project_id]) {
            report.metrics.project_distribution[entry.project_id] = 0;
          }
          report.metrics.project_distribution[entry.project_id] +=
            entry.duration / 3600;
        });
      }

      console.log(
        `Custom report generated for organization ${req.user.organizationId}`
      );

      res.json(report);
    } catch (error) {
      console.error("Generate custom report error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
