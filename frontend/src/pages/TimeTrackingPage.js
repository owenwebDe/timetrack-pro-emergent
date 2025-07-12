// frontend/src/pages/TimeTrackingPage.js - FIXED with proper error handling and validation
import React, { useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  Clock,
  Calendar,
  FolderOpen,
  CheckSquare,
  Activity,
  TrendingUp,
  Timer as TimerIcon,
  User,
  BarChart3,
  AlertCircle,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Timer } from "../components/Timer";
import { useProjects } from "../contexts/ProjectContext";
import { timeTrackingAPI, projectsAPI } from "../api/client";

export const TimeTrackingPage = ({ user, onLogout }) => {
  const [activeEntry, setActiveEntry] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [timerLoading, setTimerLoading] = useState(false);
  const [timerTime, setTimerTime] = useState(0);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Enhanced project context usage
  const {
    projects,
    tasks,
    users,
    getUserTasks,
    getMyTasks,
    taskStats,
    refreshProjects,
    refreshTasks,
    loading: projectsLoading,
  } = useProjects();

  // Debug data changes
  useEffect(() => {
    console.log("📊 DEBUG: Projects data changed:", {
      count: projects.length,
      projects: projects.map(p => ({ id: p.id, name: p.name, status: p.status }))
    });
  }, [projects]);

  useEffect(() => {
    console.log("📋 DEBUG: Tasks data changed:", {
      count: tasks.length,
      tasks: tasks.map(t => ({ 
        id: t.id, 
        title: t.title, 
        project_id: t.project_id, 
        assignee_id: t.assignee_id,
        status: t.status 
      }))
    });
  }, [tasks]);

  useEffect(() => {
    console.log("👥 DEBUG: Users data changed:", {
      count: users.length,
      users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
    });
  }, [users]);

  // Filter tasks based on selected project and user permissions
  const [availableTasks, setAvailableTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [myProjects, setMyProjects] = useState([]);

  // Clear messages after delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    console.log("🚀 DEBUG: TimeTrackingPage mounted - starting data fetch");
    fetchData();
    // Force refresh projects and tasks to ensure we have latest data
    // This is crucial for users to see newly assigned projects
    setTimeout(() => {
      console.log("🔄 DEBUG: Force refreshing projects and tasks after 1 second");
      refreshProjects(true);
      refreshTasks();
    }, 1000);
  }, []);

  // Also refresh when user changes (role changes, etc.)
  useEffect(() => {
    if (user?.id) {
      setTimeout(() => {
        refreshProjects(true);
        refreshTasks();
      }, 500);
    }
  }, [user?.id, user?.role]);

  // Update user's assigned tasks and projects when tasks/projects change
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("hubstaff_user") || "{}");
    const userId = user?.id || currentUser.id;

    if (userId && tasks.length > 0) {
      // Get all tasks assigned to current user that are not completed/cancelled
      const userAssignedTasks = tasks.filter(
        (task) =>
          task.assignee_id === userId &&
          !["completed", "cancelled"].includes(task.status)
      );
      
      console.log("🎯 User assigned tasks:", userAssignedTasks);
      setMyTasks(userAssignedTasks);

      // Get unique projects from user's assigned tasks
      const userProjectIds = [...new Set(userAssignedTasks.map(task => task.project_id))];
      const userProjects = projects.filter(project => 
        userProjectIds.includes(project.id) && project.status === "active"
      );
      
      console.log("🎯 User projects with assignments:", userProjects);
      setMyProjects(userProjects);

      // Auto-select first project if user has only one assigned project and no current selection
      if (userProjects.length === 1 && !selectedProject && !activeEntry) {
        console.log("🎯 Auto-selecting project:", userProjects[0].name);
        setSelectedProject(userProjects[0].id);
      }
    }
  }, [tasks, projects, user?.id, selectedProject, activeEntry]);

  useEffect(() => {
    if (selectedProject) {
      // Filter tasks for the selected project that the user can work on
      const currentUser = JSON.parse(localStorage.getItem("hubstaff_user") || "{}");
      const userId = user?.id || currentUser.id;
      
      const projectTasks = tasks.filter(
        (task) =>
          task.project_id === selectedProject &&
          task.assignee_id === userId &&
          !["completed", "cancelled"].includes(task.status)
      );
      
      console.log(`Selected project ${selectedProject}: Found ${projectTasks.length} available tasks for user ${userId}`);
      setAvailableTasks(projectTasks);

      // Auto-select first task if user has only one task in this project and no current selection
      if (projectTasks.length === 1 && !selectedTask && !activeEntry) {
        console.log("🎯 Auto-selecting task:", projectTasks[0].title);
        setSelectedTask(projectTasks[0].id);
      }
    } else {
      setAvailableTasks([]);
      setSelectedTask("");
    }
  }, [selectedProject, tasks, user?.id, selectedTask, activeEntry]);

  // Timer effect for active entry
  useEffect(() => {
    let interval;
    if (activeEntry) {
      interval = setInterval(() => {
        const start = new Date(activeEntry.start_time);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        setTimerTime(diff);
      }, 1000);
    } else {
      setTimerTime(0);
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch time tracking data
      const [activeResponse, entriesResponse] = await Promise.all([
        timeTrackingAPI.getActiveEntry().catch((err) => {
          console.warn("Failed to fetch active entry:", err);
          return { data: null, status: err.response?.status || 500 };
        }),
        timeTrackingAPI.getTimeEntries({ limit: 20 }).catch((err) => {
          console.warn("Failed to fetch time entries:", err);
          return { data: { entries: [] }, status: err.response?.status || 500 };
        }),
      ]);

      // Handle throttled responses gracefully
      if (activeResponse.status === 429 || entriesResponse.status === 429) {
        console.warn("API requests are being throttled - using cached data");
        setError(""); // Don't show error for throttling
      } else {
        setActiveEntry(activeResponse.data);
        const entries =
          entriesResponse?.data?.entries || entriesResponse?.data || [];
        setTimeEntries(Array.isArray(entries) ? entries : []);
      }
    } catch (error) {
      console.error("Failed to fetch time tracking data:", error);
      setError("Failed to load time tracking data. Please try again.");
      setTimeEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStart = async () => {
    if (activeEntry) {
      setError(
        "You already have an active timer running. Please stop it first."
      );
      return;
    }

    try {
      setTimerLoading(true);
      setError("");

      // Use first available project if none selected
      let projectId = selectedProject;
      if (!projectId && projects.length > 0) {
        projectId = projects[0].id;
        setSelectedProject(projectId);
        console.log("🎯 Auto-selected first available project:", projects[0].name);
      }

      // Use first available task if none selected
      let taskId = selectedTask;
      if (!taskId && availableTasks.length > 0) {
        taskId = availableTasks[0].id;
        setSelectedTask(taskId);
        console.log("🎯 Auto-selected first available task:", availableTasks[0].title);
      }

      const trackingData = {
        project_id: projectId || null,
        task_id: taskId || null,
        description: description.trim() || "General work time",
      };

      console.log("🚀 Starting time tracking with data:", trackingData);
      console.log("🚀 DEBUG: Available projects:", projects.length);
      console.log("🚀 DEBUG: Available tasks:", availableTasks.length);

      const response = await timeTrackingAPI.startTracking(trackingData);
      console.log("✅ Timer started successfully:", response.data);
      
      if (response.data.auto_selected) {
        console.log("🎯 Project was auto-selected by backend");
        setSuccess(`Timer started successfully! Auto-selected project: ${response.data.project_name}`);
      } else {
        setSuccess("Timer started successfully!");
      }

      setActiveEntry(response.data);

      // Clear description but keep selections
      setDescription("");
    } catch (error) {
      console.error("❌ Failed to start tracking:", error);

      // Enhanced error handling
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(`Failed to start tracking: ${error.message}`);
      } else {
        setError("Failed to start tracking. Please try again.");
      }

      // If there's already an active entry, fetch it
      if (error.response?.data?.activeEntry) {
        setActiveEntry(error.response.data.activeEntry);
      }
    } finally {
      setTimerLoading(false);
    }
  };

  const handleStop = async (entryId) => {
    if (!entryId) {
      setError("No active timer to stop");
      return;
    }

    try {
      setTimerLoading(true);
      setError("");

      console.log("🛑 Stopping timer:", entryId);

      await timeTrackingAPI.stopTracking(entryId);

      console.log("✅ Timer stopped successfully");

      setActiveEntry(null);
      setSuccess("Timer stopped successfully!");
    } catch (error) {
      console.error("❌ Failed to stop tracking:", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.message) {
        setError(`Failed to stop tracking: ${error.message}`);
      } else {
        setError("Failed to stop tracking. Please try again.");
      }
    } finally {
      setTimerLoading(false);
    }
  };

  const handleCompleteProject = async (projectId = null) => {
    const targetProjectId = projectId || selectedProject || activeEntry?.project_id;
    
    if (!targetProjectId) {
      setError("Please select a project first");
      return;
    }

    // If there's an active entry and we're trying to complete its project
    if (activeEntry && activeEntry.project_id === targetProjectId) {
      setError("Please stop the timer before marking this project as completed");
      return;
    }

    try {
      setTimerLoading(true);
      setError("");

      console.log("✅ Marking project as completed:", targetProjectId);

      // Update project status to completed
      const response = await projectsAPI.updateProject(targetProjectId, {
        status: "completed"
      });

      console.log("✅ Project marked as completed successfully");

      setSuccess("Project marked as completed successfully!");
      
      // Refresh projects to reflect the change
      setTimeout(() => {
        refreshProjects(true);
      }, 1000);

      // Clear form only if it was the selected project
      if (targetProjectId === selectedProject) {
        setSelectedProject("");
        setSelectedTask("");
        setDescription("");
      }
    } catch (error) {
      console.error("❌ Failed to mark project as completed:", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.message) {
        setError(`Failed to mark project as completed: ${error.message}`);
      } else {
        setError("Failed to mark project as completed. Please try again.");
      }
    } finally {
      setTimerLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSimpleDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Get project info for display
  const getProjectInfo = (projectId) => {
    return projects.find((p) => p.id === projectId);
  };

  // Get task info for display
  const getTaskInfo = (taskId) => {
    return tasks.find((t) => t.id === taskId);
  };

  // Get available projects for the current user
  const getAvailableProjects = React.useCallback(() => {
    const currentUser = JSON.parse(localStorage.getItem("hubstaff_user") || "{}");
    const userRole = user?.role || currentUser.role;
    
    console.log("🔍 DEBUG: getAvailableProjects called for role:", userRole);
    
    // Always show active projects for admins and managers
    if (userRole === "admin" || userRole === "manager") {
      const availableProjects = projects.filter(project => project.status === "active");
      console.log(`👑 DEBUG: Admin/Manager - showing ${availableProjects.length} active projects`);
      return availableProjects;
    }
    
    // For regular users, use the pre-computed myProjects state
    console.log(`👤 DEBUG: Regular user - showing ${myProjects.length} assigned projects`);
    return myProjects;
  }, [projects, user?.role, myProjects]);

  // Calculate today's stats from time entries
  const todayStats = React.useMemo(() => {
    const today = new Date().toDateString();
    const todayEntries = timeEntries.filter(
      (entry) => new Date(entry.start_time).toDateString() === today
    );

    const totalTime = todayEntries.reduce(
      (sum, entry) => sum + (entry.duration || 0),
      0
    );

    // Add current active time if any
    const currentActiveTime = activeEntry ? timerTime : 0;
    const totalTimeWithActive = totalTime + currentActiveTime;

    const uniqueProjects = new Set(
      todayEntries.map((entry) => entry.project_id)
    ).size;

    const completedTasks = todayEntries.filter(
      (entry) =>
        entry.task_id && getTaskInfo(entry.task_id)?.status === "completed"
    ).length;

    return {
      totalTime: totalTimeWithActive,
      uniqueProjects,
      completedTasks,
      productivity:
        totalTimeWithActive > 0
          ? Math.min(Math.round((totalTimeWithActive / (8 * 3600)) * 100), 100)
          : 0,
    };
  }, [timeEntries, tasks, activeEntry, timerTime]);

  if (loading && !projects.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading time tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600 mt-1">
            Track your time on projects and tasks in real-time
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          {/* Quick Timer Controls */}
          {!activeEntry ? (
            <button
              onClick={handleStart}
              disabled={timerLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:cursor-not-allowed font-semibold"
            >
              {timerLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Quick Start</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => handleStop(activeEntry.id)}
              disabled={timerLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:cursor-not-allowed font-semibold"
            >
              {timerLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Stopping...</span>
                </>
              ) : (
                <>
                  <Square size={16} />
                  <span>Stop Timer</span>
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => {
              fetchData();
              refreshProjects(true);
              refreshTasks();
            }}
            disabled={loading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckSquare size={20} className="text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Enhanced Timer Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200">
        <div className="max-w-3xl mx-auto">
          {activeEntry ? (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Currently Tracking</span>
              </div>

              <div className="text-6xl font-mono font-bold text-gray-900">
                {formatDuration(timerTime)}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {getProjectInfo(activeEntry.project_id)?.name ||
                    "Unknown Project"}
                </h3>
                {activeEntry.task_id && (
                  <p className="text-blue-600 font-medium">
                    Task:{" "}
                    {getTaskInfo(activeEntry.task_id)?.title || "Unknown Task"}
                  </p>
                )}
                <p className="text-gray-600">
                  {activeEntry.description || "No description"}
                </p>
                <p className="text-gray-500 text-sm">
                  Started at{" "}
                  {new Date(activeEntry.start_time).toLocaleTimeString()}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleStop(activeEntry.id)}
                  disabled={timerLoading}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors flex items-center space-x-2 mx-auto shadow-lg disabled:cursor-not-allowed"
                >
                  {timerLoading ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      <span>Stopping...</span>
                    </>
                  ) : (
                    <>
                      <Square size={20} />
                      <span>Stop Timer</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleCompleteProject(activeEntry.project_id)}
                  disabled={timerLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors flex items-center space-x-2 mx-auto shadow-lg disabled:cursor-not-allowed"
                  title="Stop timer first to complete this project"
                >
                  {timerLoading ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare size={20} />
                      <span>Complete Project (After Stop)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-gray-500 mb-4">
                  <TimerIcon size={20} />
                  <span className="text-sm font-medium">
                    Ready to start tracking
                  </span>
                </div>

                <div className="text-6xl font-mono font-bold text-gray-400 mb-6">
                  00:00:00
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  What are you working on?
                </h3>
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                {/* Quick Assignment Info */}
                {myTasks.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckSquare size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        You have {myTasks.length} active task{myTasks.length > 1 ? 's' : ''} assigned
                      </span>
                    </div>
                    <div className="text-xs text-green-700">
                      {myProjects.length > 1 
                        ? `Across ${myProjects.length} projects: ${myProjects.map(p => p.name).join(', ')}`
                        : myProjects.length === 1 
                          ? `In project: ${myProjects[0].name}`
                          : 'Ready to start tracking time!'
                      }
                    </div>
                  </div>
                )}

                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Project (Optional)
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    disabled={timerLoading}
                  >
                    <option value="">Choose a project...</option>
                    {(() => {
                      const availableProjects = getAvailableProjects();
                      console.log("🎯 DEBUG: Final available projects for dropdown:", availableProjects.map(p => ({
                        id: p.id,
                        name: p.name,
                        status: p.status
                      })));
                      return availableProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} - {project.client}
                        </option>
                      ));
                    })()}
                  </select>
                  {getAvailableProjects().length === 0 && !projectsLoading && (
                    <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800 mb-2">
                        {user?.role === "admin" || user?.role === "manager" 
                          ? "No active projects found. Create a project first." 
                          : "No assigned tasks found. You need to be assigned to a task before you can track time."}
                      </p>
                      {user?.role === "user" && (
                        <div className="space-y-2">
                          <p className="text-xs text-orange-600">
                            • Ask your admin/manager to assign you to a project task
                          </p>
                          <p className="text-xs text-orange-600">
                            • Once assigned, the project will appear here for time tracking
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                refreshProjects(true);
                                refreshTasks();
                              }}
                              className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition-colors"
                            >
                              🔄 Refresh Assignments
                            </button>
                            <button
                              onClick={() => window.location.href = '/projects'}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                            >
                              📋 View Projects
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {projectsLoading && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Loading your assigned projects and tasks...
                      </p>
                    </div>
                  )}
                </div>

                {/* Task Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Task (Optional)
                  </label>
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    disabled={!selectedProject || timerLoading}
                  >
                    <option value="">No specific task</option>
                    {availableTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title} ({task.status} - {task.priority})
                      </option>
                    ))}
                  </select>
                  {selectedProject && availableTasks.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No available tasks for this project
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What specifically are you working on?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={timerLoading}
                    maxLength={500}
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleStart}
                    disabled={timerLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:cursor-not-allowed"
                  >
                    {timerLoading ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        <span>Start Timer Now</span>
                      </>
                    )}
                  </button>
                  {!selectedProject && projects.length > 0 && (
                    <p className="text-xs text-center text-gray-500">
                      Will auto-select first available project if none selected
                    </p>
                  )}

                  <button
                    onClick={handleCompleteProject}
                    disabled={!selectedProject || timerLoading || activeEntry}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:cursor-not-allowed"
                  >
                    {timerLoading ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare size={20} />
                        <span>Mark Project Complete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
            <span className="text-green-600 text-sm font-medium">
              {activeEntry ? "Active" : "Today"}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {formatSimpleDuration(todayStats.totalTime)}
          </h3>
          <p className="text-gray-600 text-sm">Today's Hours</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FolderOpen className="text-green-600" size={24} />
            </div>
            <span className="text-blue-600 text-sm font-medium">
              {getAvailableProjects().length} available
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {todayStats.uniqueProjects}
          </h3>
          <p className="text-gray-600 text-sm">Projects Today</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckSquare className="text-purple-600" size={24} />
            </div>
            <span className="text-green-600 text-sm font-medium">
              {taskStats.completed > 0 ? `+${taskStats.completed}` : "0"}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {todayStats.completedTasks}
          </h3>
          <p className="text-gray-600 text-sm">Tasks Completed</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Zap className="text-orange-600" size={24} />
            </div>
            <span
              className={`text-sm font-medium ${
                todayStats.productivity >= 80
                  ? "text-green-600"
                  : todayStats.productivity >= 60
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {todayStats.productivity >= 80
                ? "Excellent"
                : todayStats.productivity >= 60
                ? "Good"
                : "Focus"}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {todayStats.productivity}%
          </h3>
          <p className="text-gray-600 text-sm">Productivity</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Time Entries */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Time Entries
              </h3>
              <button
                onClick={() => (window.location.href = "/reports")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all reports
              </button>
            </div>

            {timeEntries.length > 0 ? (
              <div className="space-y-4">
                {timeEntries.slice(0, 8).map((entry) => {
                  const project = getProjectInfo(entry.project_id);
                  const task = entry.task_id
                    ? getTaskInfo(entry.task_id)
                    : null;

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor:
                              project?.color + "20" || "#3B82F620",
                          }}
                        >
                          <FolderOpen
                            className="text-blue-600"
                            style={{ color: project?.color || "#3B82F6" }}
                            size={20}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {entry.description || "No description"}
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <span>{project?.name || "Unknown Project"}</span>
                            {task && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600">
                                  {task.title}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>
                              {new Date(entry.start_time).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatSimpleDuration(entry.duration || 0)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.end_time ? "Completed" : "Active"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No time entries yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Start tracking to see your time entries here
                </p>
                <button
                  onClick={() => {
                    const availableProjects = getAvailableProjects();
                    if (availableProjects.length > 0) {
                      setSelectedProject(availableProjects[0]?.id || "");
                    }
                  }}
                  disabled={getAvailableProjects().length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {getAvailableProjects().length === 0
                    ? user?.role === "admin" || user?.role === "manager" 
                      ? "No Active Projects"
                      : "No Assigned Projects"
                    : "Start Your First Timer"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Task Dashboard */}
        <div className="space-y-6">
          {/* My Tasks Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              My Assigned Tasks
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    In Progress
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {myTasks.filter(t => t.status === "in_progress").length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    To Do
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {myTasks.filter(t => t.status === "todo").length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    In Review
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {myTasks.filter(t => t.status === "in_review").length}
                </span>
              </div>

              {myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !["completed", "cancelled"].includes(t.status)).length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle size={12} className="text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      Overdue
                    </span>
                  </div>
                  <span className="text-sm font-bold text-red-900">
                    {myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !["completed", "cancelled"].includes(t.status)).length}
                  </span>
                </div>
              )}

              {myTasks.filter(t => t.status === "blocked").length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Blocked
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {myTasks.filter(t => t.status === "blocked").length}
                  </span>
                </div>
              )}

              {myTasks.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No tasks assigned yet</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => (window.location.href = "/projects")}
                className="w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
              >
                View All Tasks
              </button>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Today's Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Total Time</span>
                <span className="font-semibold text-gray-900">
                  {formatSimpleDuration(todayStats.totalTime)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Projects Worked</span>
                <span className="font-semibold text-blue-600">
                  {todayStats.uniqueProjects}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Tasks Completed</span>
                <span className="font-semibold text-green-600">
                  {todayStats.completedTasks}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Productivity Score</span>
                  <span
                    className={`font-semibold ${
                      todayStats.productivity >= 80
                        ? "text-green-600"
                        : todayStats.productivity >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {todayStats.productivity}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      todayStats.productivity >= 80
                        ? "bg-green-500"
                        : todayStats.productivity >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(todayStats.productivity, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => (window.location.href = "/projects")}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <FolderOpen size={16} />
                <span>View Projects</span>
              </button>

              <button
                onClick={() => (window.location.href = "/reports")}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <BarChart3 size={16} />
                <span>View Reports</span>
              </button>

              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <TrendingUp size={16} />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
