// frontend/src/pages/DashboardPage.js - Fixed spacing issues
import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  FolderOpen,
  Users,
  TrendingUp,
  Play,
  Pause,
  Plus,
  ArrowUpRight,
  Calendar,
  Target,
  DollarSign,
  Activity,
  ChevronRight,
  Timer as TimerIcon,
  BarChart3,
  UserPlus,
  PlusCircle,
} from "lucide-react";
import { DashboardWidget } from "../components/DashboardWidget";
import { useProjects } from "../contexts/ProjectContext";
import { analyticsAPI, usersAPI } from "../api/client";

// Modern Widget Component with Lucide icons
const ModernWidget = ({ title, value, subtitle, icon, color, trend }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
  };

  const iconMap = {
    "⏰": Clock,
    "📁": FolderOpen,
    "📊": BarChart3,
    "📈": TrendingUp,
  };

  const IconComponent = iconMap[icon] || Clock;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]} shadow-lg`}
        >
          <IconComponent className="text-white" size={24} />
        </div>
        {trend && (
          <div
            className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <ArrowUpRight size={12} className={trend > 0 ? "" : "rotate-90"} />
            <span className="ml-1">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          {value}
        </p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
};

// Team Activity Card Component
const TeamActivityCard = ({ teamUser, index }) => {
  const statusColors = {
    active: "bg-green-100 text-green-700",
    away: "bg-yellow-100 text-yellow-700",
    offline: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200">
      <div className="relative">
        <img
          src={
            teamUser.avatar ||
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
          }
          alt={teamUser.name || "User"}
          className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm"
        />
        <div
          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
            teamUser.status === "active"
              ? "bg-green-400"
              : teamUser.status === "away"
              ? "bg-yellow-400"
              : "bg-gray-400"
          }`}
        ></div>
      </div>

      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 truncate">
            {teamUser.name || "Unknown User"}
          </h4>
          <span className="text-xs text-gray-500">2h ago</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-500 truncate">
            {teamUser.role || "No role"}
          </p>
          <span
            className={`px-2 py-0.5 text-xs rounded-full font-medium ${
              statusColors[teamUser.status] || statusColors.offline
            }`}
          >
            {teamUser.status || "offline"}
          </span>
        </div>
      </div>
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project, index }) => {
  const progress = Math.floor(Math.random() * 100);

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {project.name || "Untitled Project"}
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            {project.client || "No client"}
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
            project.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {project.status || "inactive"}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign size={14} className="mr-1" />
            <span>${project.budget || 0}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar size={14} className="mr-1" />
            <span>2 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Action Button
const QuickActionButton = ({ icon: Icon, label, color, onClick, href }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    green:
      "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    purple:
      "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
    orange:
      "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
  };

  const Component = href ? "a" : "button";
  const props = href ? { href } : { onClick };

  return (
    <Component
      {...props}
      className={`flex flex-col items-center p-4 bg-gradient-to-r ${colorClasses[color]} text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 group`}
    >
      <Icon
        size={24}
        className="mb-2 group-hover:scale-110 transition-transform"
      />
      <span className="text-sm font-medium">{label}</span>
    </Component>
  );
};

export const DashboardPage = ({ user }) => {
  // ✅ KEEPING ALL YOUR EXISTING STATE AND LOGIC
  const [dashboardData, setDashboardData] = useState({
    widgets: [],
    teamActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(0);
  const fetchingRef = useRef(false);

  const { projects, getProjectStats, refreshProjects } = useProjects();

  // ✅ KEEPING ALL YOUR EXISTING useEffect HOOKS
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
  }, []);

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
  }, [projects.length]);

  // ✅ KEEPING ALL YOUR EXISTING FUNCTIONS
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
      console.log("👥 Fetching team activity...");
      const usersResponse = await usersAPI.getUsers({ limit: 10 });
      const users = usersResponse?.data || [];

      setDashboardData((prev) => ({
        ...prev,
        teamActivity: Array.isArray(users) ? users : [],
      }));
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

  // ✅ KEEPING YOUR EXISTING LOADING STATE
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    // 🔧 FIXED: Added proper container with full width and no margins
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* ✨ MODERN HEADER - Enhanced */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">
                Greetings, {user?.name || "User"}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                Here's what's happening with your team today.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                <Calendar size={16} />
                <span>Today</span>
              </button>
              <a
                href="/time-tracking"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <TimerIcon size={16} />
                <span>Start Timer</span>
              </a>
            </div>
          </div>

          {/* ✨ MODERN STATS GRID - Using your existing widget data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardData.widgets.map((widget, index) => (
              <ModernWidget key={`widget-${index}`} {...widget} />
            ))}
          </div>

          {/* ✨ MODERN MAIN CONTENT GRID - Enhanced layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Team Activity - Enhanced */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Team Activity
                  </h3>
                  <a
                    href="/team"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    View all
                    <ChevronRight size={16} className="ml-1" />
                  </a>
                </div>

                <div className="space-y-3">
                  {dashboardData.teamActivity.length > 0 ? (
                    dashboardData.teamActivity
                      .slice(0, 4)
                      .map((teamUser, index) => (
                        <TeamActivityCard
                          key={teamUser.id || `team-user-${index}`}
                          teamUser={teamUser}
                          index={index}
                        />
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500">No team members found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Projects - Enhanced */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Projects
                  </h3>
                  <a
                    href="/projects"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    View all projects
                    <ChevronRight size={16} className="ml-1" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.length > 0 ? (
                    projects
                      .slice(0, 4)
                      .map((project, index) => (
                        <ProjectCard
                          key={project.id || `project-${index}`}
                          project={project}
                          index={index}
                        />
                      ))
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No projects yet
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {user?.role === "admin" || user?.role === "manager"
                          ? "Create your first project to get started"
                          : "You haven't been assigned to any projects yet"}
                      </p>
                      {(user?.role === "admin" || user?.role === "manager") && (
                        <a
                          href="/projects"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus size={16} className="mr-2" />
                          Create Project
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ✨ MODERN QUICK ACTIONS - Enhanced with proper navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <QuickActionButton
                icon={PlusCircle}
                label="New Project"
                color="blue"
                href="/projects"
              />
              <QuickActionButton
                icon={TimerIcon}
                label="Start Timer"
                color="green"
                href="/time-tracking"
              />
              <QuickActionButton
                icon={BarChart3}
                label="View Reports"
                color="purple"
                href="/reports"
              />
              <QuickActionButton
                icon={UserPlus}
                label="Invite Team"
                color="orange"
                href="/team"
              />
            </div>
          </div>

          {/* ✅ KEEPING YOUR EXISTING DEBUG INFO */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Debug Info:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <p>Projects loaded: {projects.length}</p>
                <p>Team members: {dashboardData.teamActivity.length}</p>
                <p>Last update: {new Date(lastUpdate).toLocaleTimeString()}</p>
                <p>
                  Screen: <span className="sm:hidden">Mobile</span>
                  <span className="hidden sm:inline lg:hidden">Tablet</span>
                  <span className="hidden lg:inline">Desktop</span>
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.globalThrottle) {
                    console.log(
                      "Throttle status:",
                      window.globalThrottle.getStatus()
                    );
                  }
                }}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                Check Throttle Status
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
