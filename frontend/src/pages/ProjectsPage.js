import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { projectsAPI } from "../api/client";
import { usersAPI } from "../api/client";
import { ProjectCard } from "../components/projects/ProjectCard";
import { Modal } from "../components/common/Modal";
import { TaskAssignmentModal } from "../components/projects/TaskAssignmentModal";

export const ProjectsPage = ({ user: userProp, onLogout }) => {
  // Ensure user has role property, fallback to localStorage if missing
  let user = userProp;
  if (!user || !user.role) {
    const userStr = localStorage.getItem("hubstaff_user");
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        user = null;
      }
    }
  }
  console.log("ProjectsPage user prop:", user);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    budget: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0], // Default to today
    endDate: "",
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignProjectId, setAssignProjectId] = useState(null);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignAssignee, setAssignAssignee] = useState("");
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [viewProject, setViewProject] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, []);

  // Fetch all users for task assignee details (accessible to all team members)
  useEffect(() => {
    async function fetchUsers() {
      try {
        console.log("🔍 Fetching all users for team visibility...");
        const res = await usersAPI.getUsers();
        console.log("✅ Users fetched successfully:", res.data);
        const userData = res.data.users || res.data || [];
        console.log("📊 Setting users state:", userData.length, "users");
        setUsers(userData);
      } catch (err) {
        console.warn("⚠️ Primary user fetch failed:", err);
        // Fallback: try to get user data from different API structure
        try {
          console.log("🔄 Trying fallback: getOrganizationMembers...");
          const res = await usersAPI.getOrganizationMembers();
          const userData = res.data.users || res.data || [];
          console.log("✅ Fallback successful:", userData.length, "users");
          setUsers(userData);
        } catch (fallbackErr) {
          console.warn("❌ All user fetch attempts failed:", fallbackErr);
          setUsers([]);
        }
      }
    }
    
    fetchUsers();
  }, []); // Remove role dependency

  const fetchProjectData = async () => {
    try {
      // Debug: Check authentication
      const token =
        localStorage.getItem("hubstaff_token") ||
        localStorage.getItem("authToken");
      const userStr = localStorage.getItem("hubstaff_user");

      console.log("Debug - Token exists:", !!token);
      console.log("Debug - User exists:", !!userStr);

      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log("Debug - User role:", userData.role);
        console.log("Debug - User data:", userData);
      }

      if (!token) {
        console.error("No authentication token found");
        alert("Please log in to access projects");
        window.location.href = "/login";
        return;
      }

      console.log("Attempting to fetch projects...");
      const [projectsResponse] = await Promise.all([
        projectsAPI.getProjects().catch((error) => {
          console.error("Projects API error:", error.response?.data);
          throw error;
        }),
      ]);

      // Support both array and object response
      let projectsData = [];
      if (
        projectsResponse.data &&
        Array.isArray(projectsResponse.data.projects)
      ) {
        projectsData = projectsResponse.data.projects;
      } else if (Array.isArray(projectsResponse.data)) {
        projectsData = projectsResponse.data;
      } else if (
        projectsResponse.data &&
        Array.isArray(projectsResponse.data)
      ) {
        projectsData = projectsResponse.data;
      }
      console.log("Projects fetched successfully:", projectsData);

      // Try to fetch project stats, but don't fail if it doesn't work
      try {
        const statsResponse = await projectsAPI.getProjectStats();
        console.log("Project stats:", statsResponse.data);
      } catch (statsError) {
        console.warn(
          "Failed to fetch project stats:",
          statsError.response?.data
        );
      }

      // Fetch tasks for all projects first to determine which projects user can see
      let allTasks = [];
      if (projectsData && projectsData.length > 0) {
        try {
          console.log("Fetching tasks for all projects to filter...");
          const tasksPromises = projectsData.map((project) =>
            projectsAPI.getProjectTasks(project.id).catch((error) => {
              console.warn(
                `Failed to fetch tasks for project ${project.id}:`,
                error.response?.data
              );
              return { data: { tasks: [] } };
            })
          );
          const tasksResponses = await Promise.all(tasksPromises);
          
          // Flatten all tasks with project info
          allTasks = tasksResponses.flatMap((response, index) => {
            const projectTasks = response.data?.tasks || response.data || [];
            return Array.isArray(projectTasks) 
              ? projectTasks.map(task => ({
                  ...task,
                  project_id: task.project_id || projectsData[index].id  // Keep existing project_id if available
                }))
              : [];
          });
          
          console.log("All tasks fetched:", allTasks);
          setTasks(allTasks);
          
          // Refresh users to ensure we have latest user data for task assignments
          console.log("🔄 Refreshing user data to match task assignments...");
          try {
            const res = await usersAPI.getUsers();
            const userData = res.data.users || res.data || [];
            console.log("✅ User data refreshed:", userData.length, "users");
            setUsers(userData);
          } catch (userRefreshErr) {
            console.warn("⚠️ Failed to refresh user data:", userRefreshErr);
          }
        } catch (tasksError) {
          console.warn("Failed to fetch tasks:", tasksError);
          setTasks([]);
        }
      }

      // Show all projects to all users
      console.log("Showing all projects to all users:", projectsData.length);
      setProjects(projectsData || []);
    } catch (error) {
      console.error("Failed to fetch project data:", error);

      if (error.response?.status === 403) {
        const errorMsg =
          error.response.data?.error || error.response.data?.message;
        console.error("403 Error details:", error.response.data);
        alert(
          `Access denied: ${
            errorMsg ||
            "You do not have permission to view projects. Please contact your administrator."
          }`
        );
      } else if (error.response?.status === 401) {
        console.error("Authentication failed");
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("hubstaff_token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("hubstaff_user");
        window.location.href = "/login";
      } else {
        alert(
          "Failed to load projects. Please refresh the page or contact support."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      // Debug authentication
      const token =
        localStorage.getItem("hubstaff_token") ||
        localStorage.getItem("authToken");
      const userStr = localStorage.getItem("hubstaff_user");

      console.log("Create Project Debug:");
      console.log("- Token exists:", !!token);
      console.log("- User exists:", !!userStr);

      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log("- User role:", userData.role);
        console.log("- User ID:", userData.id);
      }

      if (!token) {
        alert("Please log in again to create projects");
        window.location.href = "/login";
        return;
      }

      // Validate required fields
      if (
        !newProject.name ||
        !newProject.client ||
        !newProject.budget ||
        !newProject.startDate
      ) {
        alert("Please fill in all required fields");
        return;
      }

      // Prepare project data
      const projectData = {
        name: newProject.name.trim(),
        client: newProject.client.trim(),
        budget: parseFloat(newProject.budget),
        description: newProject.description.trim() || "",
        status: "active",
        startDate: new Date(newProject.startDate).toISOString(),
        endDate: newProject.endDate
          ? new Date(newProject.endDate).toISOString()
          : null,
        members: [], // Empty array for now
        tags: [], // Empty array for now
        priority: "medium", // Default priority
        currency: "USD", // Default currency
        color: "#3B82F6", // Default color
        settings: {
          trackTime: true,
          trackActivity: true,
          screenshots: true,
          allowManualTime: true,
        },
      };

      console.log("Sending project data:", projectData);

      const response = await projectsAPI.createProject(projectData);
      console.log("Project created successfully:", response.data);

      alert(`Project "${newProject.name}" created successfully!`);
      setNewProject({
        name: "",
        client: "",
        budget: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });
      setShowCreateModal(false);
      fetchProjectData(); // Refresh data
    } catch (error) {
      console.error("Failed to create project:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Handle different error types
      if (error.response?.status === 403) {
        const errorMsg =
          error.response.data?.error || error.response.data?.message;
        console.error("403 Forbidden details:", error.response.data);
        alert(
          `Permission denied: ${
            errorMsg ||
            "You do not have permission to create projects. Please contact your administrator."
          }`
        );
      } else if (error.response?.status === 401) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("hubstaff_token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("hubstaff_user");
        window.location.href = "/login";
      } else if (error.response?.status === 422) {
        // Validation errors
        const errors = error.response.data?.errors || [];
        const errorMessage =
          errors.length > 0
            ? errors.map((err) => err.msg || err.message).join(", ")
            : "Validation failed";
        alert(`Validation Error: ${errorMessage}`);
      } else if (error.response?.status === 400) {
        // Bad request with detailed errors
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors
            .map((err) => err.msg || err.message || err.toString())
            .join("\n");
          alert(`Validation Errors:\n${errorMessages}`);
        } else {
          const errorMessage =
            errorData.error || errorData.message || "Invalid project data";
          alert(`Error: ${errorMessage}`);
        }
      } else {
        alert(`Failed to create project: ${error.message}`);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const openAssignModal = async (projectId) => {
    setAssignProjectId(projectId);
    setShowAssignModal(true);
    setAssignTitle("");
    setAssignAssignee("");
    setAssignLoading(true);
    try {
      // Fetch all users for task assignment visibility - all team members can see this
      let assignableUsers = [];
      
      if (user?.role === "admin") {
        // Admin can assign to managers and users
        const [managersRes, usersRes] = await Promise.all([
          usersAPI.getUsers({ role: "manager" }),
          usersAPI.getUsers({ role: "user" }),
        ]);
        assignableUsers = [
          ...(managersRes.data.users || []),
          ...(usersRes.data.users || []),
        ];
      } else if (user?.role === "manager") {
        // Manager can assign to users only
        const usersRes = await usersAPI.getUsers({ role: "user" });
        assignableUsers = usersRes.data.users || [];
      } else {
        // Regular users can see all team members for visibility, but can't assign
        // This ensures they see assignee information in the UI
        try {
          const allUsersRes = await usersAPI.getUsers();
          assignableUsers = allUsersRes.data.users || allUsersRes.data || [];
        } catch (fallbackErr) {
          // Use the already fetched users state as fallback
          assignableUsers = users || [];
        }
      }
      
      setAssignableUsers(assignableUsers);
    } catch (err) {
      console.warn("Failed to fetch assignable users:", err);
      // Fallback to already loaded users
      setAssignableUsers(users || []);
    }
    setAssignLoading(false);
  };
  const closeAssignModal = () => {
    setShowAssignModal(false);
    setAssignProjectId(null);
    setAssignTitle("");
    setAssignAssignee("");
    setAssignableUsers([]);
  };
  const handleAssignTask = async (taskData) => {
    setAssignLoading(true);
    try {
      await projectsAPI.createTask(assignProjectId, taskData);
      alert("Task assigned successfully!");
      closeAssignModal();
      fetchProjectData(); // Refresh tasks
    } catch (err) {
      console.error("Failed to assign task:", err);
      alert("Failed to assign task");
    }
    setAssignLoading(false);
  };

  const handleMarkComplete = async (task, project) => {
    if (
      !confirm(
        `Are you sure you want to mark task "${task.title}" as completed?`
      )
    ) {
      return;
    }
    try {
      await projectsAPI.updateTask(project.id, task.id, {
        status: "completed",
      });
      alert("Task marked as completed!");
      fetchProjectData();
    } catch (err) {
      alert("Failed to mark task as completed.");
    }
  };

  const handleDeleteTask = async (task, project) => {
    if (
      !confirm(
        `Are you sure you want to delete task "${task.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await projectsAPI.deleteTask(project.id, task.id);
      alert("Task deleted!");
      fetchProjectData();
    } catch (err) {
      alert("Failed to delete task.");
    }
  };

  const handleEditProject = async (updatedProject) => {
    setCreateLoading(true);
    try {
      await projectsAPI.updateProject(editProject.id, updatedProject);
      alert("Project updated successfully!");
      setEditProject(null);
      setNewProject({
        name: "",
        client: "",
        budget: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      });
      fetchProjectData(); // Refresh data
    } catch (error) {
      console.error("Failed to update project:", error);
      if (error.response?.status === 403) {
        const errorMsg = error.response.data?.error || error.response.data?.message;
        alert(`Permission denied: ${errorMsg || "You don't have permission to edit projects."}`);
      } else {
        alert(`Failed to update project: ${error.message}`);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        <main className="flex-1 p-3 sm:p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Page Header */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 lg:mb-8">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📁</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Projects</h1>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base mb-3">
                    Collaborate on projects and track progress across your team.
                  </p>
                  
                  {/* Enhanced Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span className="text-gray-600">{projects.length} Projects</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-gray-600">{tasks.length} Tasks</span>
                    </div>
                    {user?.role && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin" 
                          ? "bg-red-100 text-red-800" 
                          : user.role === "manager" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {user.role === "admin" && "👑"}
                        {user.role === "manager" && "👨‍💼"}
                        {user.role === "user" && "👤"}
                        <span className="ml-1 capitalize">{user.role}</span>
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  {user?.role === "admin" || user?.role === "manager" ? (
                    <>
                      <div className="hidden sm:flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="font-medium">Management Access</span>
                      </div>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <span className="mr-2 text-lg">➕</span>
                        <span className="font-medium">New Project</span>
                      </button>
                    </>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-3">
                      <p className="text-blue-800 text-sm">
                        <span className="font-medium">👤 Team Member:</span> Full project visibility enabled
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {projects && projects.length > 0 ? (
                projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    taskCount={
                      tasks.filter((t) => t.project_id === project.id).length
                    }
                    user={user}
                    onOpenTaskModal={() => openAssignModal(project.id)}
                    onViewDetails={() => setViewProject(project)}
                    onEditProject={() => {
                      setEditProject(project);
                      setNewProject({
                        name: project.name,
                        client: project.client,
                        budget: project.budget?.toString() || "",
                        description: project.description || "",
                        startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
                        endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
                      });
                    }}
                  >
                    {/* Enhanced Task List */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                          <span className="mr-2">📋</span>
                          Tasks ({tasks.filter((task) => task.project_id === project.id).length})
                        </h4>
                        {(user?.role === "admin" || user?.role === "manager") && (
                          <button
                            onClick={() => openAssignModal(project.id)}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            + Add Task
                          </button>
                        )}
                      </div>
                      
                      {tasks.filter((task) => task.project_id === project.id).length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <span className="text-2xl mb-2 block">📝</span>
                          <p className="text-gray-500 text-sm mb-2">No tasks yet</p>
                          {(user?.role === "admin" || user?.role === "manager") && (
                            <button
                              onClick={() => openAssignModal(project.id)}
                              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                            >
                              Create the first task
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {tasks
                            .filter((task) => task.project_id === project.id)
                            .map((task, index) => {
                              const assignedUser = users.find((u) => u.id === task.assignee_id);
                              // Debug logging for assignee lookup
                              if (task.assignee_id && !assignedUser) {
                                console.log(`⚠️ Could not find user for assignee_id: ${task.assignee_id}`, {
                                  task: task.title,
                                  assignee_id: task.assignee_id,
                                  availableUsers: users.map(u => ({ id: u.id, name: u.name }))
                                });
                              }
                              return (
                                <div
                                  key={task.id || index}
                                  className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                                >
                                  {/* Task Header */}
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium text-gray-900 text-sm truncate">
                                        {task.title}
                                      </h5>
                                      {task.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                          {task.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Task Meta Info */}
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        task.status === "completed"
                                          ? "bg-green-100 text-green-800"
                                          : task.status === "in_progress"
                                          ? "bg-blue-100 text-blue-800"
                                          : task.status === "todo"
                                          ? "bg-gray-100 text-gray-700"
                                          : "bg-yellow-100 text-yellow-800"
                                      }`}
                                    >
                                      {task.status === "completed" && "✓"}
                                      {task.status === "in_progress" && "⏳"}
                                      {task.status === "todo" && "📝"}
                                      <span className="ml-1">{task.status.replace('_', ' ')}</span>
                                    </span>
                                    
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        task.priority === "high"
                                          ? "bg-red-100 text-red-800"
                                          : task.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {task.priority === "high" && "🔴"}
                                      {task.priority === "medium" && "🟡"}
                                      {task.priority === "low" && "🟢"}
                                      <span className="ml-1">{task.priority}</span>
                                    </span>
                                    
                                    {task.due_date && (
                                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                        📅 {new Date(task.due_date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Assignee & Actions */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      {assignedUser ? (
                                        <div className="flex items-center space-x-2">
                                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-semibold text-blue-600">
                                              {assignedUser.name?.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">
                                              {assignedUser.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                              {assignedUser.role}
                                            </p>
                                          </div>
                                        </div>
                                      ) : task.assignee_id ? (
                                        <div className="flex items-center space-x-2">
                                          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-semibold text-orange-600">
                                              {task.assignee_id.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">
                                              User ID: {task.assignee_id}
                                            </p>
                                            <p className="text-xs text-orange-500 truncate">
                                              Loading user info...
                                            </p>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center space-x-2">
                                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                            <span className="text-xs text-gray-400">?</span>
                                          </div>
                                          <span className="text-xs text-gray-400">Unassigned</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center space-x-1">
                                      {task.status !== "completed" &&
                                        (user?.role === "admin" ||
                                          user?.role === "manager" ||
                                          user?.id === task.assignee_id) && (
                                          <button
                                            className="text-green-600 hover:text-green-700 text-xs px-2 py-1 bg-white rounded hover:bg-green-50 transition-colors"
                                            title="Mark as Complete"
                                            onClick={() => handleMarkComplete(task, project)}
                                          >
                                            ✓
                                          </button>
                                        )}
                                      {(user?.role === "admin" || user?.role === "manager") && (
                                        <button
                                          className="text-red-600 hover:text-red-700 text-xs px-2 py-1 bg-white rounded hover:bg-red-50 transition-colors"
                                          title="Delete Task"
                                          onClick={() => handleDeleteTask(task, project)}
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </ProjectCard>
                ))
              ) : (
                <div className="col-span-full">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 lg:p-12">
                    <div className="text-center max-w-lg mx-auto">
                      <div className="w-24 h-24 lg:w-32 lg:h-32 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <span className="text-4xl lg:text-5xl">📁</span>
                      </div>
                      <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">
                        {user?.role === "user" ? "No Projects Available" : "Ready to Create Projects?"}
                      </h3>
                      <p className="text-gray-600 mb-8 text-sm lg:text-base leading-relaxed">
                        {user?.role === "user"
                          ? "All team projects will appear here. Once you're assigned to tasks, you'll be able to collaborate and track your progress."
                          : "Start organizing your team's work by creating your first project. You can then assign tasks, track time, and monitor progress."}
                      </p>
                      
                      {(user?.role === "admin" || user?.role === "manager") && (
                        <div className="space-y-6">
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1"
                          >
                            🚀 Create Your First Project
                          </button>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-xs text-gray-600 mb-2 font-medium">What you can do with projects:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-500">
                              <span>📋 Organize tasks</span>
                              <span>⏰ Track time</span>
                              <span>👥 Manage teams</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {user?.role === "user" && (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                            <div className="flex items-center justify-center mb-3">
                              <span className="text-2xl">🎯</span>
                            </div>
                            <h4 className="font-semibold text-blue-900 mb-2">Team Member Benefits</h4>
                            <div className="space-y-2 text-sm text-blue-800">
                              <p>• View all project details and team assignments</p>
                              <p>• Track your time on assigned tasks</p>
                              <p>• Collaborate with your team members</p>
                              <p>• Monitor project progress in real-time</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Contact your administrator or manager to get assigned to projects
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Tasks Overview Section */}
            <div className="mt-8 lg:mt-12">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">📋</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                        Team Tasks Overview
                      </h2>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base">
                      All project tasks and assignments across the team
                    </p>
                  </div>
                  
                  {/* Enhanced Stats */}
                  <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                      <span className="text-sm font-medium">Total: {tasks.length}</span>
                    </div>
                    <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                      <span className="text-sm font-medium">
                        Completed: {tasks.filter(t => t.status === "completed").length}
                      </span>
                    </div>
                    <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg">
                      <span className="text-sm font-medium">
                        In Progress: {tasks.filter(t => t.status === "in_progress").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                {/* Mobile Card View */}
                <div className="lg:hidden">
                  {tasks && tasks.length > 0 ? (
                    <div className="p-4 space-y-4">
                      {tasks.slice(0, 10).map((task, index) => {
                        const assignedUser = users.find((u) => u.id === task.assignee_id);
                        const taskProject = projects.find((p) => p.id === task.project_id);
                        
                        // Debug logging for mobile view assignee lookup
                        if (task.assignee_id && !assignedUser) {
                          console.log(`⚠️ Mobile view: Could not find user for assignee_id: ${task.assignee_id}`);
                        }
                        
                        return (
                          <div
                            key={task.id || index}
                            className="bg-gray-50 rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {taskProject && (
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: taskProject.color || "#3B82F6" }}
                                ></span>
                              )}
                              <span className="text-sm text-gray-600 truncate">
                                {taskProject?.name || "Unknown Project"}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {assignedUser ? (
                                  <>
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-semibold text-blue-600">
                                        {assignedUser.name?.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {assignedUser.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {assignedUser.role}
                                      </p>
                                    </div>
                                  </>
                                ) : task.assignee_id ? (
                                  <>
                                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-semibold text-orange-600">
                                        {task.assignee_id.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        User ID: {task.assignee_id}
                                      </p>
                                      <p className="text-xs text-orange-500">
                                        Loading user info...
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-400">Unassigned</span>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    task.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : task.status === "in_progress"
                                      ? "bg-blue-100 text-blue-800"
                                      : task.status === "todo"
                                      ? "bg-gray-100 text-gray-700"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {task.status === "completed" && "✓"}
                                  {task.status === "in_progress" && "⏳"}
                                  {task.status === "todo" && "📝"}
                                  <span className="ml-1">{task.status.replace('_', ' ')}</span>
                                </span>
                                
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    task.priority === "high"
                                      ? "bg-red-100 text-red-800"
                                      : task.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {task.priority === "high" && "🔴"}
                                  {task.priority === "medium" && "🟡"}
                                  {task.priority === "low" && "🟢"}
                                  <span className="ml-1">{task.priority}</span>
                                </span>
                              </div>
                            </div>
                            
                            {task.due_date && (
                              <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                📅 Due: {new Date(task.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-gray-400">📋</span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h4>
                      <p className="text-sm text-gray-500">
                        Tasks will appear here once projects are created and assignments are made
                      </p>
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Task Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Priority
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tasks && tasks.length > 0 ? (
                        tasks.slice(0, 10).map((task, index) => {
                          const assignedUser = users.find((u) => u.id === task.assignee_id);
                          const taskProject = projects.find((p) => p.id === task.project_id);
                          
                          // Debug logging for desktop table view assignee lookup
                          if (task.assignee_id && !assignedUser) {
                            console.log(`⚠️ Desktop table: Could not find user for assignee_id: ${task.assignee_id}`);
                          }
                          
                          return (
                            <tr
                              key={task.id || index}
                              className="hover:bg-blue-50 transition-colors duration-200"
                            >
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <div className="text-sm font-semibold text-gray-900 max-w-xs">
                                    {task.title}
                                  </div>
                                  {task.description && (
                                    <div className="text-xs text-gray-500 mt-1 max-w-xs line-clamp-2">
                                      {task.description}
                                    </div>
                                  )}
                                  {task.due_date && (
                                    <div className="text-xs text-gray-400 mt-2 flex items-center">
                                      <span className="mr-1">📅</span>
                                      Due: {new Date(task.due_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {taskProject && (
                                    <span
                                      className="w-3 h-3 rounded-full mr-3 shadow-sm"
                                      style={{ backgroundColor: taskProject.color || "#3B82F6" }}
                                    ></span>
                                  )}
                                  <span className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                    {taskProject?.name || "Unknown Project"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {assignedUser ? (
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-3 shadow-sm">
                                        <span className="text-sm font-bold text-blue-700">
                                          {assignedUser.name?.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900">
                                          {assignedUser.name}
                                        </span>
                                        <span className="text-xs text-gray-500 capitalize">
                                          {assignedUser.role}
                                        </span>
                                      </div>
                                    </div>
                                  ) : task.assignee_id ? (
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mr-3 shadow-sm">
                                        <span className="text-sm font-bold text-orange-700">
                                          {task.assignee_id.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900">
                                          User ID: {task.assignee_id}
                                        </span>
                                        <span className="text-xs text-orange-500">
                                          Loading user info...
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-sm text-gray-400">?</span>
                                      </div>
                                      <span className="text-sm text-gray-400 italic">Unassigned</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                                    task.status === "completed"
                                      ? "bg-green-100 text-green-800 border border-green-200"
                                      : task.status === "in_progress"
                                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                                      : task.status === "todo"
                                      ? "bg-gray-100 text-gray-800 border border-gray-200"
                                      : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                  }`}
                                >
                                  {task.status === "completed" && "✓ "}
                                  {task.status === "in_progress" && "⏳ "}
                                  {task.status === "todo" && "📝 "}
                                  {task.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                                    task.priority === "high"
                                      ? "bg-red-100 text-red-800 border border-red-200"
                                      : task.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                      : "bg-green-100 text-green-800 border border-green-200"
                                  }`}
                                >
                                  {task.priority === "high" && "🔴 "}
                                  {task.priority === "medium" && "🟡 "}
                                  {task.priority === "low" && "🟢 "}
                                  {task.priority}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <span className="text-3xl text-gray-400">📋</span>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h4>
                              <p className="text-sm text-gray-500 max-w-md">
                                Tasks will appear here once projects are created and team members are assigned to work on them.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Show More Tasks - Admin Feature */}
                {tasks && tasks.length > 10 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      Showing 10 of {tasks.length} total tasks
                    </p>
                    <button
                      onClick={() => {
                        // For demo - in real app, this would show a full tasks page
                        alert(`Total tasks: ${tasks.length}. Consider implementing a dedicated tasks page for full management.`);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All Tasks →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Project"
        >
          <form onSubmit={handleCreateProject}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={newProject.client}
                  onChange={(e) =>
                    setNewProject({ ...newProject, client: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProject.budget}
                  onChange={(e) =>
                    setNewProject({ ...newProject, budget: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={
                    newProject.startDate ||
                    new Date().toISOString().split("T")[0]
                  }
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={newProject.endDate || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createLoading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Task Modal */}
      {showAssignModal && (
        <TaskAssignmentModal
          isOpen={showAssignModal}
          onClose={closeAssignModal}
          project={projects.find(p => p.id === assignProjectId)}
          onTaskCreated={handleAssignTask}
          user={user}
        />
      )}

      {/* View Project Modal */}
      {viewProject && (
        <Modal
          isOpen={!!viewProject}
          onClose={() => setViewProject(null)}
          title={`View Project: ${viewProject.name}`}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Project Details
              </h3>
              <p className="text-gray-700">
                <strong>Name:</strong> {viewProject.name}
              </p>
              <p className="text-gray-700">
                <strong>Client:</strong> {viewProject.client}
              </p>
              <p className="text-gray-700">
                <strong>Budget:</strong> ${viewProject.budget || 0}
              </p>
              <p className="text-gray-700">
                <strong>Start Date:</strong>{" "}
                {new Date(viewProject.startDate).toLocaleDateString()}
              </p>
              <p className="text-gray-700">
                <strong>End Date:</strong>{" "}
                {viewProject.endDate
                  ? new Date(viewProject.endDate).toLocaleDateString()
                  : "N/A"}
              </p>
              <p className="text-gray-700">
                <strong>Description:</strong>{" "}
                {viewProject.description || "No description provided."}
              </p>
              <p className="text-gray-700">
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    viewProject.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {viewProject.status}
                </span>
              </p>
              <p className="text-gray-700">
                <strong>Hours Tracked:</strong> {viewProject.hours_tracked || 0}
                h
              </p>
              <p className="text-gray-700">
                <strong>Spent:</strong> ${viewProject.spent || 0}
              </p>
              <p className="text-gray-700">
                <strong>Priority:</strong>{" "}
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    viewProject.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : viewProject.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {viewProject.priority}
                </span>
              </p>
              <p className="text-gray-700">
                <strong>Currency:</strong> {viewProject.currency || "USD"}
              </p>
              <p className="text-gray-700">
                <strong>Color:</strong>{" "}
                <span
                  className="w-4 h-4 inline-block rounded-full"
                  style={{ backgroundColor: viewProject.color || "#3B82F6" }}
                ></span>{" "}
                {viewProject.color || "Blue"}
              </p>
              <p className="text-gray-700">
                <strong>Settings:</strong>{" "}
                {Object.entries(viewProject.settings || {})
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(", ")}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setViewProject(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Project Modal */}
      {editProject && (
        <Modal
          isOpen={!!editProject}
          onClose={() => setEditProject(null)}
          title={`Edit Project: ${editProject.name}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const updatedProject = {
                ...editProject,
                name: newProject.name.trim(),
                client: newProject.client.trim(),
                budget: parseFloat(newProject.budget),
                description: newProject.description.trim() || "",
                startDate: new Date(newProject.startDate).toISOString(),
                endDate: newProject.endDate
                  ? new Date(newProject.endDate).toISOString()
                  : null,
              };
              handleEditProject(updatedProject);
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  value={newProject.client}
                  onChange={(e) =>
                    setNewProject({ ...newProject, client: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProject.budget}
                  onChange={(e) =>
                    setNewProject({ ...newProject, budget: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={
                    newProject.startDate ||
                    new Date().toISOString().split("T")[0]
                  }
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={newProject.endDate || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setEditProject(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Task Modal */}
      {deleteTask && (
        <Modal
          isOpen={!!deleteTask}
          onClose={() => setDeleteTask(null)}
          title={`Delete Task: ${deleteTask.title}`}
        >
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete task "{deleteTask.title}"? This
            action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setDeleteTask(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                handleDeleteTask(
                  deleteTask,
                  projects.find((p) => p.id === deleteTask.project_id)
                );
                setDeleteTask(null);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Delete Task
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
