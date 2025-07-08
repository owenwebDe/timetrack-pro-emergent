import React, { useState, useEffect } from "react";
import { projectsAPI } from "../api/client";
import { useProjects } from "../contexts/ProjectContext";

export const ProjectsPage = ({ user, onLogout }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { projects, refreshProjects } = useProjects();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    budget: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  useEffect(() => {
    fetchProjectData();
  }, []);

  const fetchProjectData = async () => {
    try {
      const token =
        localStorage.getItem("hubstaff_token") ||
        localStorage.getItem("authToken");

      if (!token) {
        console.error("No authentication token found");
        alert("Please log in to access projects");
        window.location.href = "/login";
        return;
      }

      console.log("Refreshing projects via context...");
      await refreshProjects();

      if (projects && projects.length > 0) {
        try {
          const tasksPromises = projects.slice(0, 3).map((project) =>
            projectsAPI.getProjectTasks(project.id).catch((error) => {
              console.warn(
                `Failed to fetch tasks for project ${project.id}:`,
                error.response?.data
              );
              return { data: { tasks: [] } };
            })
          );
          const tasksResponses = await Promise.all(tasksPromises);
          const allTasks = tasksResponses.flatMap(
            (response) => response.data.tasks || []
          );
          setTasks(allTasks);
        } catch (tasksError) {
          console.warn("Failed to fetch some tasks:", tasksError);
          setTasks([]);
        }
      }

      try {
        const statsResponse = await projectsAPI.getProjectStats();
        console.log("Project stats:", statsResponse.data);
      } catch (statsError) {
        console.warn(
          "Failed to fetch project stats:",
          statsError.response?.data
        );
      }
    } catch (error) {
      console.error("Failed to fetch project data:", error);

      if (error.response?.status === 403) {
        const errorMsg =
          error.response.data?.error || error.response.data?.message;
        alert(
          `Access denied: ${
            errorMsg ||
            "You do not have permission to view projects. Please contact your administrator."
          }`
        );
      } else if (error.response?.status === 401) {
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
      const token =
        localStorage.getItem("hubstaff_token") ||
        localStorage.getItem("authToken");

      if (!token) {
        alert("Please log in again to create projects");
        window.location.href = "/login";
        return;
      }

      if (
        !newProject.name ||
        !newProject.client ||
        !newProject.budget ||
        !newProject.startDate
      ) {
        alert("Please fill in all required fields");
        return;
      }

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
        members: [],
        tags: [],
        priority: "medium",
        currency: "USD",
        color: "#3B82F6",
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

      await refreshProjects();
    } catch (error) {
      console.error("Failed to create project:", error);

      if (error.response?.status === 403) {
        const errorMsg =
          error.response.data?.error || error.response.data?.message;
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
        const errors = error.response.data?.errors || [];
        const errorMessage =
          errors.length > 0
            ? errors.map((err) => err.msg || err.message).join(", ")
            : "Validation failed";
        alert(`Validation Error: ${errorMessage}`);
      } else if (error.response?.status === 400) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-2">
              Manage your projects and track their progress.
            </p>
          </div>
          {user?.role === "admin" || user?.role === "manager" ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <span className="mr-2">➕</span>
              New Project
            </button>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md px-4 py-2">
              <p className="text-yellow-800 text-sm">
                <span className="font-medium">Note:</span> Only administrators
                and managers can create new projects.
              </p>
            </div>
          )}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 feature-card"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      project.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{project.client}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Hours tracked:</span>
                    <span className="font-medium">
                      {project.hours_tracked || 0}h
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Budget:</span>
                    <span className="font-medium">${project.budget || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Spent:</span>
                    <span className="font-medium">${project.spent || 0}</span>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-4 progress-bar">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((project.spent || 0) / (project.budget || 1)) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>

                <div className="flex justify-between">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    View Details
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 text-sm">
                    Edit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl text-gray-400">📁</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No projects found
                </h3>
                <p className="text-gray-500 mb-4">
                  {user?.role === "user"
                    ? "You haven't been assigned to any projects yet."
                    : "Get started by creating your first project."}
                </p>
                {(user?.role === "admin" || user?.role === "manager") && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                  >
                    Create Your First Project
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Tasks
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Assignee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tasks && tasks.length > 0 ? (
                    tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 table-row">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {task.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {projects.find((p) => p.id === task.project_id)
                            ?.name || "Unknown Project"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.assignee_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              task.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : task.status === "in-progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              task.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No tasks found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Project
            </h3>
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
          </div>
        </div>
      )}
    </>
  );
};
