// frontend/src/pages/DashboardPage.js - Refactored into focused components
import React, { useState, useEffect, useRef } from "react";
import { useProjects } from "../contexts/ProjectContext";
import { analyticsAPI, usersAPI } from "../api/client";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import {
  DashboardHeader,
  StatsGrid,
  TeamActivity,
  ProjectOverview,
  QuickActions,
  DashboardDebug,
} from "../components/dashboard";

export const DashboardPage = ({ user }) => {
  // State management
  const [dashboardData, setDashboardData] = useState({
    widgets: [],
    teamActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(0);
  const fetchingRef = useRef(false);

  // Project context
  const { projects, getProjectStats, refreshProjects } = useProjects();

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      if (fetchingRef.current) return;

      fetchingRef.current = true;
      console.log("🔄 Initializing dashboard data...");

      try {
        await fetchDashboardData();
        if (projects.length === 0) {
          console.log("📁 No projects found, refreshing...");
          await refreshProjects();
        }
      } catch (error) {
        console.error("Failed to initialize dashboard:", error);
      } finally {
        fetchingRef.current = false;
      }
    };

    initializeDashboard();
  }, [projects.length, refreshProjects]);

  // Update widgets when projects change
  useEffect(() => {
    const now = Date.now();

    if (now - lastUpdate < 10000) {
      console.log("⏱️ Widget update throttled");
      return;
    }

    if (projects.length >= 0) {
      console.log("📊 Updating widgets with project data...");
      updateWidgets();
      setLastUpdate(now);
    }
  }, [projects.length, lastUpdate]);

  const updateWidgets = async () => {
    try {
      const projectStats = getProjectStats();

      let analyticsData = { user_stats: { total_hours: 0, avg_activity: 0 } };
      try {
        console.log("📈 Fetching analytics data...");
        const analyticsResponse = await analyticsAPI.getDashboardAnalytics();
        if (analyticsResponse && analyticsResponse.data) {
          analyticsData = analyticsResponse.data;
        }
      } catch (error) {
        console.warn("Failed to fetch analytics:", error.message);
      }

      const widgets = [
        {
          title: "Hours Worked",
          value: `${analyticsData.user_stats?.total_hours || 0}h`,
          subtitle: "This month",
          icon: "⏰",
          color: "blue",
          trend: 12,
        },
        {
          title: "Active Projects",
          value: projectStats.active,
          subtitle: "Currently running",
          icon: "📁",
          color: "green",
          trend: 5,
        },
        {
          title: "Total Projects",
          value: projectStats.total,
          subtitle: "All projects",
          icon: "📊",
          color: "purple",
          trend: -2,
        },
        {
          title: "Activity Level",
          value: `${Math.round(analyticsData.user_stats?.avg_activity || 0)}%`,
          subtitle: "This week",
          icon: "📈",
          color: "orange",
          trend: 8,
        },
      ];

      setDashboardData((prev) => ({
        ...prev,
        widgets,
      }));
    } catch (error) {
      console.error("Failed to update widgets:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Only fetch team activity for admins and managers
      if (user?.role === "admin" || user?.role === "manager") {
        console.log("👥 Fetching team activity...");
        const usersResponse = await usersAPI.getUsers({ limit: 10 });
        const users = usersResponse?.data || [];

        setDashboardData((prev) => ({
          ...prev,
          teamActivity: Array.isArray(users) ? users : [],
        }));
      } else {
        console.log("👤 Regular user - skipping team activity fetch");
        setDashboardData((prev) => ({
          ...prev,
          teamActivity: [],
        }));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setDashboardData((prev) => ({
        ...prev,
        teamActivity: [],
      }));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <DashboardHeader user={user} />

          {/* Stats Grid */}
          <StatsGrid widgets={dashboardData.widgets} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Team Activity */}
            <div className="xl:col-span-1">
              <TeamActivity teamActivity={dashboardData.teamActivity} />
            </div>

            {/* Recent Projects */}
            <div className="xl:col-span-2">
              <ProjectOverview projects={projects} user={user} />
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions user={user} />

          {/* Debug Info */}
          <DashboardDebug
            projects={projects}
            teamActivity={dashboardData.teamActivity}
            lastUpdate={lastUpdate}
          />
        </div>
      </div>
    </div>
  );
};
