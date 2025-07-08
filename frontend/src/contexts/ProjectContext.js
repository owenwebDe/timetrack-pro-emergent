import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { projectsAPI } from "../api/client";

// Create the context
const ProjectContext = createContext();

// Custom hook to use the project context
export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
};

// Project Provider component
export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [initialized, setInitialized] = useState(false); // Add this flag

  // Throttle API calls - only fetch if last fetch was more than 30 seconds ago
  const shouldFetch = useCallback(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    return timeSinceLastFetch > 30000; // 30 seconds
  }, [lastFetchTime]);

  // Enhanced fetch projects function with throttling
  const fetchProjects = useCallback(
    async (showLoading = true, force = false) => {
      try {
        // Don't fetch if we recently fetched and it's not forced
        if (!force && !shouldFetch()) {
          console.log("Skipping fetch - too recent");
          return;
        }

        if (showLoading) setLoading(true);
        setError(null);

        const token =
          localStorage.getItem("hubstaff_token") ||
          localStorage.getItem("authToken");
        if (!token) {
          console.warn("No authentication token found");
          return;
        }

        console.log("Fetching projects...");
        const response = await projectsAPI.getProjects();

        // Handle different response structures
        let projectsData = [];
        if (response.data && Array.isArray(response.data)) {
          projectsData = response.data;
        } else if (
          response.data &&
          response.data.projects &&
          Array.isArray(response.data.projects)
        ) {
          projectsData = response.data.projects;
        }

        setProjects(projectsData);
        setLastFetchTime(Date.now());

        // Only fetch tasks for the first 3 projects to reduce API calls
        if (projectsData.length > 0) {
          try {
            const tasksPromises = projectsData
              .slice(0, 3)
              .map((project) =>
                projectsAPI
                  .getProjectTasks(project.id)
                  .catch(() => ({ data: [] }))
              );
            const tasksResponses = await Promise.all(tasksPromises);
            const allTasks = tasksResponses.flatMap(
              (response) => response.data || []
            );
            setTasks(allTasks);
          } catch (tasksError) {
            console.warn("Failed to fetch some tasks:", tasksError);
          }
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);

        // More specific error handling
        if (error.code === "ERR_NETWORK") {
          setError("Network connection failed. Please check your connection.");
        } else if (error.response?.status === 429) {
          setError("Too many requests. Please wait a moment.");
        } else if (error.response?.status === 401) {
          setError("Authentication failed. Please login again.");
          // Clear tokens on auth failure
          localStorage.removeItem("hubstaff_token");
          localStorage.removeItem("authToken");
          localStorage.removeItem("hubstaff_user");
        } else {
          setError(error.message || "Failed to fetch projects");
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [shouldFetch]
  );

  // Add a new project to the state
  const addProject = useCallback((newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  }, []);

  // Update a project in the state
  const updateProject = useCallback((projectId, updatedProject) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, ...updatedProject } : project
      )
    );
  }, []);

  // Remove a project from the state
  const removeProject = useCallback((projectId) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setTasks((prev) => prev.filter((task) => task.project_id !== projectId));
  }, []);

  // Add a new task to the state
  const addTask = useCallback((newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  // Update a task in the state
  const updateTask = useCallback((taskId, updatedTask) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updatedTask } : task
      )
    );
  }, []);

  // Remove a task from the state
  const removeTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  // Refresh projects (useful for manual refresh)
  const refreshProjects = useCallback(() => {
    fetchProjects(true, true); // Force refresh
  }, [fetchProjects]);

  // Get projects by status
  const getProjectsByStatus = useCallback(
    (status) => {
      return projects.filter((project) => project.status === status);
    },
    [projects]
  );

  // Get user's projects (for regular users)
  const getUserProjects = useCallback(
    (userId) => {
      return projects.filter(
        (project) =>
          project.members.includes(userId) || project.manager === userId
      );
    },
    [projects]
  );

  // Get project statistics
  const getProjectStats = useCallback(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "active").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const paused = projects.filter((p) => p.status === "paused").length;
    const cancelled = projects.filter((p) => p.status === "cancelled").length;

    return {
      total,
      active,
      completed,
      paused,
      cancelled,
    };
  }, [projects]);

  // Initial load - only once on mount
  useEffect(() => {
    const user = localStorage.getItem("hubstaff_user");
    if (user && !initialized) {
      setInitialized(true);
      fetchProjects(true, true);
    }
  }, [initialized]); // Remove fetchProjects from dependencies

  const value = {
    // State
    projects,
    tasks,
    loading,
    error,

    // Actions
    fetchProjects,
    addProject,
    updateProject,
    removeProject,
    addTask,
    updateTask,
    removeTask,
    refreshProjects,

    // Utilities
    getProjectsByStatus,
    getUserProjects,
    getProjectStats,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
