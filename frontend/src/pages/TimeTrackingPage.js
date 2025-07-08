// frontend/src/pages/TimeTrackingPage.js - Modern Professional Design
import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Square,
  Clock,
  Calendar,
  FolderOpen,
  CheckSquare,
  Activity,
  Mouse,
  Keyboard,
  Camera,
  TrendingUp,
  Timer as TimerIcon,
} from "lucide-react";
import { Timer } from "../components/Timer";
import { useProjects } from "../contexts/ProjectContext";
import { timeTrackingAPI, projectsAPI } from "../api/client";

export const TimeTrackingPage = ({ user, onLogout }) => {
  const [activeEntry, setActiveEntry] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [timerTime, setTimerTime] = useState(0);

  const { projects } = useProjects();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    } else {
      setTasks([]);
      setSelectedTask("");
    }
  }, [selectedProject]);

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

  const fetchData = async () => {
    try {
      const [activeResponse, entriesResponse] = await Promise.all([
        timeTrackingAPI.getActiveEntry().catch(() => ({ data: null })),
        timeTrackingAPI
          .getTimeEntries({ limit: 10 })
          .catch(() => ({ data: { entries: [] } })),
      ]);

      setActiveEntry(activeResponse.data);
      const entries =
        entriesResponse?.data?.entries || entriesResponse?.data || [];
      setTimeEntries(Array.isArray(entries) ? entries : []);
    } catch (error) {
      console.error("Failed to fetch time tracking data:", error);
      setTimeEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      const response = await projectsAPI.getProjectTasks(projectId);
      const tasksData = response?.data?.tasks || response?.data || [];
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.warn("Failed to fetch tasks:", error);
      setTasks([]);
    }
  };

  const handleStart = async () => {
    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }

    try {
      const response = await timeTrackingAPI.startTracking({
        project_id: selectedProject,
        task_id: selectedTask || null,
        description: "Working on project",
      });
      setActiveEntry(response.data);

      try {
        await fetchData();
      } catch (fetchError) {
        console.warn("Failed to refresh data:", fetchError);
      }
    } catch (error) {
      console.error("Failed to start tracking:", error);
      alert(error.response?.data?.error || "Failed to start tracking");
    }
  };

  const handleStop = async (entryId) => {
    try {
      await timeTrackingAPI.stopTracking(entryId);
      setActiveEntry(null);

      try {
        await fetchData();
      } catch (fetchError) {
        console.warn("Failed to refresh data:", fetchError);
      }
    } catch (error) {
      console.error("Failed to stop tracking:", error);
      alert("Failed to stop tracking");
    }
  };

  const handleReset = () => {
    setSelectedProject("");
    setSelectedTask("");
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

  if (loading) {
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
            Track your time and manage your tasks efficiently
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <Calendar size={16} />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* Timer Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-blue-200">
        <div className="max-w-2xl mx-auto text-center">
          {activeEntry ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Currently Tracking</span>
              </div>

              <div className="text-6xl font-mono font-bold text-gray-900">
                {formatDuration(timerTime)}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {projects.find((p) => p.id === activeEntry.project_id)
                    ?.name || "Unknown Project"}
                </h3>
                <p className="text-gray-600">
                  Started at{" "}
                  {new Date(activeEntry.start_time).toLocaleTimeString()}
                </p>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => handleStop(activeEntry.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 shadow-lg"
                >
                  <Square size={20} />
                  <span>Stop Timer</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <TimerIcon size={20} />
                <span className="text-sm font-medium">
                  Ready to start tracking
                </span>
              </div>

              <div className="text-6xl font-mono font-bold text-gray-400">
                00:00:00
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  What are you working on?
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <div>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={selectedTask}
                      onChange={(e) => setSelectedTask(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      disabled={!selectedProject}
                    >
                      <option value="">Select a task (optional)</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleStart}
                  disabled={!selectedProject}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold transition-colors flex items-center space-x-2 mx-auto shadow-lg"
                >
                  <Play size={20} />
                  <span>Start Timer</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
            <span className="text-green-600 text-sm font-medium">+12%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">8.5h</h3>
          <p className="text-gray-600 text-sm">Today's Hours</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <span className="text-green-600 text-sm font-medium">+5%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">42.5h</h3>
          <p className="text-gray-600 text-sm">This Week</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FolderOpen className="text-purple-600" size={24} />
            </div>
            <span className="text-blue-600 text-sm font-medium">3 active</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">12</h3>
          <p className="text-gray-600 text-sm">Projects</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Activity className="text-orange-600" size={24} />
            </div>
            <span className="text-green-600 text-sm font-medium">
              Excellent
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">87%</h3>
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
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all
              </button>
            </div>

            {timeEntries.length > 0 ? (
              <div className="space-y-4">
                {timeEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FolderOpen className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {entry.description}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            {new Date(entry.start_time).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>
                            {projects.find((p) => p.id === entry.project_id)
                              ?.name || "Unknown"}
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
                ))}
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
                  onClick={handleStart}
                  disabled={!selectedProject}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Start Your First Timer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Activity Monitor */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Activity Monitor
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Camera className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Screenshots</h4>
                    <p className="text-sm text-gray-500">Every 10 minutes</p>
                  </div>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mouse className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Mouse Activity
                    </h4>
                    <p className="text-sm text-gray-500">85% active</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-4 bg-blue-500 rounded-sm"></div>
                  <div className="w-2 h-6 bg-blue-500 rounded-sm"></div>
                  <div className="w-2 h-5 bg-blue-500 rounded-sm"></div>
                  <div className="w-2 h-7 bg-blue-500 rounded-sm"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Keyboard className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Keyboard Activity
                    </h4>
                    <p className="text-sm text-gray-500">78% active</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-5 bg-purple-500 rounded-sm"></div>
                  <div className="w-2 h-4 bg-purple-500 rounded-sm"></div>
                  <div className="w-2 h-6 bg-purple-500 rounded-sm"></div>
                  <div className="w-2 h-3 bg-purple-500 rounded-sm"></div>
                </div>
              </div>
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
                <span className="font-semibold text-gray-900">8h 32m</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Productive Time</span>
                <span className="font-semibold text-green-600">7h 24m</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Break Time</span>
                <span className="font-semibold text-yellow-600">1h 8m</span>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Productivity Score</span>
                  <span className="font-semibold text-blue-600">87%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: "87%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
