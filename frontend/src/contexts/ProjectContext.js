// frontend/src/contexts/ProjectContext.js - OPTIMIZED VERSION
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { projectsAPI, usersAPI } from "../api/client";

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

// OPTIMIZED Project Provider component
export const ProjectProvider = ({ children }) => {
  console.log("[CONTEXT DEBUG] ProjectProvider mounted");
  // Core state
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]); // Add users state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Task-specific state
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    blocked: 0,
    overdue: 0,
  });

  // Optimized sync state
  const [autoSync, setAutoSync] = useState(false); // Disabled by default
  const [syncInterval, setSyncInterval] = useState(60000); // 1 minute

  // Refs for optimization
  const syncTimeoutRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const lastFetchTime = useRef(0);
  const initializationInProgress = useRef(false);
  const mountedRef = useRef(true);

  // Minimum time between fetches (10 seconds - reduced from 30s for better UX)
  const FETCH_INTERVAL = 10000;

  // User permissions state
  const [userPermissions, setUserPermissions] = useState({
    canCreateProjects: false,
    canAssignTasks: false,
    canManageTeam: false,
    canViewAllTasks: false,
    role: "user",
  });

  // Check if we should fetch data
  const shouldFetch = useCallback(() => {
    const now = Date.now();
    return now - lastFetchTime.current > FETCH_INTERVAL;
  }, []);

  // Initialize user permissions based on role
  const initializeUserPermissions = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("hubstaff_user") || "{}");
    const role = user.role || "user";

    setUserPermissions({
      canCreateProjects: ["admin", "manager"].includes(role),
      canAssignTasks: ["admin", "manager"].includes(role),
      canManageTeam: ["admin", "manager"].includes(role),
      canViewAllTasks: role === "admin",
      canReassignTasks: role === "admin",
      canDeleteTasks: ["admin", "manager"].includes(role),
      role: role,
    });
  }, []);

  // Fetch users function
  const fetchUsers = useCallback(async () => {
    try {
      console.log("🔍 [CONTEXT] Fetching all users for team visibility...");
      const res = await usersAPI.getUsers();
      console.log("✅ [CONTEXT] Users fetched successfully:", res.data);
      const userData = res.data.users || res.data || [];
      console.log("📊 [CONTEXT] Setting users state:", userData.length, "users");
      setUsers(userData);
      return userData;
    } catch (err) {
      console.warn("⚠️ [CONTEXT] Primary user fetch failed:", err);
      // Fallback: try to get user data from different API structure
      try {
        console.log("🔄 [CONTEXT] Trying fallback: getOrganizationMembers...");
        const res = await usersAPI.getOrganizationMembers();
        const userData = res.data.users || res.data || [];
        console.log("✅ [CONTEXT] Fallback successful:", userData.length, "users");
        setUsers(userData);
        return userData;
      } catch (fallbackErr) {
        console.warn("❌ [CONTEXT] All user fetch attempts failed:", fallbackErr);
        setUsers([]);
        return [];
      }
    }
  }, []);

  // Optimized fetch projects function
  const fetchProjects = useCallback(
    async (showLoading = true, force = false) => {
      console.log(
        "[CONTEXT DEBUG] fetchProjects called with showLoading:",
        showLoading,
        "force:",
        force
      );
      // Prevent multiple simultaneous fetches
      if (initializationInProgress.current) {
        console.log("[CONTEXT DEBUG] Early return: already in progress");
        return;
      }

      // Rate limiting
      if (!force && !shouldFetch()) {
        console.log("[CONTEXT DEBUG] Early return: too recent");
        return;
      }

      try {
        initializationInProgress.current = true;
        if (showLoading) setLoading(true);
        setError(null);

        const token =
          localStorage.getItem("hubstaff_token") ||
          localStorage.getItem("authToken");
        if (!token) {
          console.warn(
            "[CONTEXT DEBUG] Early return: No authentication token found"
          );
          return;
        }

        console.log("[CONTEXT DEBUG] Fetching projects from API...");
        const response = await projectsAPI.getProjects();

        if (!mountedRef.current) {
          console.log("[CONTEXT DEBUG] Early return: not mounted");
          return;
        }

        let projectsData = [];
        if (response.data && Array.isArray(response.data.projects)) {
          projectsData = response.data.projects;
        } else if (response.data && Array.isArray(response.data)) {
          projectsData = response.data;
        }
        console.log("[CONTEXT DEBUG] setProjects called with:", projectsData);
        setProjects(projectsData);
        lastFetchTime.current = Date.now();

        // Fetch users data to ensure latest user assignments are available
        fetchUsers();

        // Fetch tasks for projects (with debouncing)
        if (projectsData.length > 0) {
          setTimeout(() => {
            if (mountedRef.current) {
              fetchAllTasks(projectsData, false);
            }
          }, 500);
        } else {
          setTasks([]);
          updateTaskStats([]);
        }
      } catch (error) {
        console.error("[CONTEXT DEBUG] Failed to fetch projects:", error);
        if (mountedRef.current) {
          handleFetchError(error);
        }
      } finally {
        initializationInProgress.current = false;
        if (mountedRef.current && showLoading) {
          setLoading(false);
        }
      }
    },
    [shouldFetch, fetchUsers]
  );

  // Optimized task fetching
  const fetchAllTasks = useCallback(
    async (projectList = null, showLoading = true) => {
      try {
        if (showLoading) setTaskLoading(true);

        const currentProjects = projectList || projects;
        if (currentProjects.length === 0) {
          setTasks([]);
          updateTaskStats([]);
          return;
        }

        console.log("🔄 Fetching all tasks...");

        // Limit concurrent requests to prevent API spam
        const MAX_CONCURRENT = 3;
        const chunks = [];
        for (let i = 0; i < currentProjects.length; i += MAX_CONCURRENT) {
          chunks.push(currentProjects.slice(i, i + MAX_CONCURRENT));
        }

        const allTasks = [];

        // Process chunks sequentially to avoid overwhelming the API
        for (const chunk of chunks) {
          const tasksPromises = chunk.map(async (project) => {
            try {
              const response = await projectsAPI.getProjectTasks(project.id);
              const projectTasks = response.data.tasks || response.data || [];
              return projectTasks.map((task) => ({
                ...task,
                projectName: project.name || "Unknown Project",
                projectClient: project.client || "",
                projectColor: project.color || "#3B82F6",
              }));
            } catch (error) {
              console.warn(
                `Failed to fetch tasks for project ${project.id}:`,
                error
              );
              return [];
            }
          });

          const chunkResults = await Promise.all(tasksPromises);
          allTasks.push(...chunkResults.flat());

          // Small delay between chunks to prevent API overload
          if (chunks.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        if (mountedRef.current) {
          setTasks(allTasks);
          updateTaskStats(allTasks);
          console.log(
            `✅ Loaded ${allTasks.length} tasks from ${currentProjects.length} projects`
          );
          
          // All projects are shown to all users - no filtering applied
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        if (mountedRef.current) {
          setTasks([]);
          updateTaskStats([]);
        }
      } finally {
        if (mountedRef.current && showLoading) {
          setTaskLoading(false);
        }
      }
    },
    [projects]
  );

  // Note: Project filtering removed - all users see all projects

  // Memoized task stats calculation
  const updateTaskStats = useCallback((taskList) => {
    if (!Array.isArray(taskList)) return;

    const stats = {
      total: taskList.length,
      completed: taskList.filter((t) => t.status === "completed").length,
      inProgress: taskList.filter((t) => t.status === "in_progress").length,
      todo: taskList.filter((t) => t.status === "todo").length,
      blocked: taskList.filter((t) => t.status === "blocked").length,
      inReview: taskList.filter((t) => t.status === "in_review").length,
      cancelled: taskList.filter((t) => t.status === "cancelled").length,
      overdue: taskList.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < new Date() &&
          !["completed", "cancelled"].includes(t.status)
      ).length,
    };

    setTaskStats(stats);
  }, []);

  // Enhanced error handling
  const handleFetchError = useCallback((error) => {
    if (error.code === "ERR_NETWORK") {
      setError("Network connection failed. Please check your connection.");
    } else if (error.response?.status === 429) {
      setError("Too many requests. Please wait a moment.");
    } else if (error.response?.status === 401) {
      setError("Authentication failed. Please login again.");
      localStorage.removeItem("hubstaff_token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("hubstaff_user");
    } else {
      setError(error.message || "Failed to fetch data");
    }
  }, []);

  // Optimized project management functions
  const addProject = useCallback((newProject) => {
    if (mountedRef.current) {
      setProjects((prev) => [newProject, ...prev]);
    }
  }, []);

  const updateProject = useCallback((projectId, updatedProject) => {
    if (mountedRef.current) {
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId ? { ...project, ...updatedProject } : project
        )
      );
    }
  }, []);

  const removeProject = useCallback((projectId) => {
    if (mountedRef.current) {
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setTasks((prev) => prev.filter((task) => task.project_id !== projectId));
    }
  }, []);

  // Optimized task management functions
  const addTask = useCallback(
    (newTask) => {
      if (mountedRef.current) {
        setTasks((prev) => {
          const updatedTasks = [newTask, ...prev];
          updateTaskStats(updatedTasks);
          return updatedTasks;
        });
      }
    },
    [updateTaskStats]
  );

  const updateTask = useCallback(
    (taskId, updatedTask) => {
      if (mountedRef.current) {
        setTasks((prev) => {
          const updatedTasks = prev.map((task) =>
            task.id === taskId ? { ...task, ...updatedTask } : task
          );
          updateTaskStats(updatedTasks);
          return updatedTasks;
        });
      }
    },
    [updateTaskStats]
  );

  const removeTask = useCallback(
    (taskId) => {
      if (mountedRef.current) {
        setTasks((prev) => {
          const updatedTasks = prev.filter((task) => task.id !== taskId);
          updateTaskStats(updatedTasks);
          return updatedTasks;
        });
      }
    },
    [updateTaskStats]
  );

  // Optimized task assignment
  const assignTask = useCallback(
    async (taskId, userId, assignedBy = null) => {
      try {
        if (!userPermissions.canAssignTasks) {
          throw new Error("You don't have permission to assign tasks");
        }

        const task = tasks.find((t) => t.id === taskId);
        if (!task) {
          throw new Error("Task not found");
        }

        const response = await projectsAPI.assignTask(
          task.project_id,
          taskId,
          userId
        );

        if (mountedRef.current) {
          updateTask(taskId, response.data.task);
        }

        return response.data.task;
      } catch (error) {
        console.error("Failed to assign task:", error);
        throw error;
      }
    },
    [tasks, userPermissions.canAssignTasks, updateTask]
  );

  // Optimized bulk operations
  const bulkUpdateTasks = useCallback(
    async (taskIds, updates) => {
      try {
        isUpdatingRef.current = true;

        const tasksByProject = {};
        taskIds.forEach((taskId) => {
          const task = tasks.find((t) => t.id === taskId);
          if (task) {
            if (!tasksByProject[task.project_id]) {
              tasksByProject[task.project_id] = [];
            }
            tasksByProject[task.project_id].push(taskId);
          }
        });

        const updatePromises = Object.entries(tasksByProject).map(
          ([projectId, projectTaskIds]) =>
            projectsAPI.bulkUpdateTasks(projectId, projectTaskIds, updates)
        );

        await Promise.all(updatePromises);

        if (mountedRef.current) {
          setTasks((prev) => {
            const updatedTasks = prev.map((task) =>
              taskIds.includes(task.id) ? { ...task, ...updates } : task
            );
            updateTaskStats(updatedTasks);
            return updatedTasks;
          });
        }
      } catch (error) {
        console.error("Failed to bulk update tasks:", error);
        throw error;
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [tasks, updateTaskStats]
  );

  // Memoized filter functions
  const filterTasks = useCallback(
    (filters) => {
      return tasks.filter((task) => {
        if (filters.status && task.status !== filters.status) return false;
        if (filters.priority && task.priority !== filters.priority)
          return false;
        if (filters.assignee && task.assignee_id !== filters.assignee)
          return false;
        if (filters.project && task.project_id !== filters.project)
          return false;
        if (
          filters.overdue &&
          (!task.dueDate || new Date(task.dueDate) >= new Date())
        )
          return false;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          if (
            !task.title.toLowerCase().includes(searchLower) &&
            !task.description?.toLowerCase().includes(searchLower)
          ) {
            return false;
          }
        }
        return true;
      });
    },
    [tasks]
  );

  // Optimized user-specific task functions
  const getUserTasks = useCallback(
    (userId = null) => {
      const user = JSON.parse(localStorage.getItem("hubstaff_user") || "{}");
      const targetUserId = userId || user.id;

      if (userPermissions.canViewAllTasks) {
        return tasks;
      } else if (userPermissions.role === "manager") {
        return tasks.filter(
          (task) =>
            task.createdBy === user.id ||
            task.assignee_id === targetUserId ||
            (task.assignee && task.assignee.role === "user")
        );
      } else {
        return tasks.filter(
          (task) =>
            task.assignee_id === targetUserId ||
            task.createdBy === targetUserId ||
            task.watchers?.includes(targetUserId)
        );
      }
    },
    [tasks, userPermissions]
  );

  const getMyTasks = useCallback(() => {
    const user = JSON.parse(localStorage.getItem("hubstaff_user") || "{}");
    return getUserTasks(user.id);
  }, [getUserTasks]);

  // Optimized refresh functions
  const refreshProjects = useCallback(
    (force = false) => {
      fetchProjects(true, force);
    },
    [fetchProjects]
  );

  const refreshTasks = useCallback(() => {
    fetchAllTasks(null, true);
  }, [fetchAllTasks]);

  // Smart auto-sync with better controls
  const startAutoSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    if (autoSync && !isUpdatingRef.current) {
      syncTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log("🔄 Auto-syncing data...");
          fetchProjects(false, true);
        }
      }, syncInterval);
    }
  }, [autoSync, syncInterval, fetchProjects]);

  const stopAutoSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, []);

  // Memoized utility functions
  const getProjectsByStatus = useCallback(
    (status) => {
      return projects.filter((project) => project.status === status);
    },
    [projects]
  );

  const getProjectStats = useCallback(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "active").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const paused = projects.filter((p) => p.status === "paused").length;
    const cancelled = projects.filter((p) => p.status === "cancelled").length;

    return { total, active, completed, paused, cancelled };
  }, [projects]);

  const getTaskStatsByProject = useCallback(
    (projectId) => {
      const projectTasks = tasks.filter(
        (task) => task.project_id === projectId
      );
      return {
        total: projectTasks.length,
        completed: projectTasks.filter((t) => t.status === "completed").length,
        inProgress: projectTasks.filter((t) => t.status === "in_progress")
          .length,
        todo: projectTasks.filter((t) => t.status === "todo").length,
        blocked: projectTasks.filter((t) => t.status === "blocked").length,
        overdue: projectTasks.filter(
          (t) =>
            t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            !["completed", "cancelled"].includes(t.status)
        ).length,
      };
    },
    [tasks]
  );

  const getOverdueTasks = useCallback(() => {
    return tasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        !["completed", "cancelled"].includes(task.status)
    );
  }, [tasks]);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      // Core State
      projects,
      tasks,
      users,
      loading,
      taskLoading,
      error,
      taskStats,
      userPermissions,
      initialized,

      // Core Actions
      fetchProjects,
      fetchUsers,
      addProject,
      updateProject,
      removeProject,
      refreshProjects,

      // Task Management
      addTask,
      updateTask,
      removeTask,
      assignTask,
      bulkUpdateTasks,
      fetchAllTasks,
      refreshTasks,

      // Task Utilities
      filterTasks,
      getUserTasks,
      getMyTasks,
      getOverdueTasks,
      getTaskStatsByProject,

      // Project Utilities
      getProjectsByStatus,
      getProjectStats,

      // Sync Controls
      autoSync,
      setAutoSync,
      syncInterval,
      setSyncInterval,
      startAutoSync,
      stopAutoSync,

      // Utility Functions
      updateTaskStats,
      handleFetchError,
    }),
    [
      projects,
      tasks,
      users,
      loading,
      taskLoading,
      error,
      taskStats,
      userPermissions,
      initialized,
      fetchProjects,
      fetchUsers,
      addProject,
      updateProject,
      removeProject,
      refreshProjects,
      addTask,
      updateTask,
      removeTask,
      assignTask,
      bulkUpdateTasks,
      fetchAllTasks,
      refreshTasks,
      filterTasks,
      getUserTasks,
      getMyTasks,
      getOverdueTasks,
      getTaskStatsByProject,
      getProjectsByStatus,
      getProjectStats,
      autoSync,
      setAutoSync,
      syncInterval,
      setSyncInterval,
      startAutoSync,
      stopAutoSync,
      updateTaskStats,
      handleFetchError,
    ]
  );

  // Initialize permissions and data on mount
  useEffect(() => {
    initializeUserPermissions();
    const user = localStorage.getItem("hubstaff_user");
    if (user && !initialized && !initializationInProgress.current) {
      setInitialized(true);
      fetchProjects(true, true);
    }
  }, []); // Empty dependency array - only run once

  // Set up auto-sync only when explicitly enabled
  useEffect(() => {
    if (initialized && autoSync) {
      startAutoSync();
    }
    return () => stopAutoSync();
  }, [initialized, autoSync, startAutoSync, stopAutoSync]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[CONTEXT DEBUG] ProjectProvider unmounted");
      mountedRef.current = false;
      stopAutoSync();
    };
  }, [stopAutoSync]);

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};
