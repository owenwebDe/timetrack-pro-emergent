// frontend/src/components/projects/TaskAssignmentModal.js - ENHANCED with role-based task assignment
import React, { useState, useEffect } from "react";
import { projectsAPI } from "../../api/client";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { FormField } from "../forms/FormField";
import { Input } from "../forms/Input";
import { TextArea } from "../forms/TextArea";
import { Select } from "../forms/Select";

export const TaskAssignmentModal = ({
  isOpen,
  onClose,
  project,
  task = null, // null for new task, object for editing
  onTaskCreated,
  onTaskUpdated,
  user,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee_id: "",
    priority: "medium",
    dueDate: "",
    estimatedHours: "",
    tags: "",
  });

  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [errors, setErrors] = useState({});

  // Check if user has permission to create/assign tasks
  const canCreateTasks = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  // Initialize form data when modal opens or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Editing existing task
        setFormData({
          title: task.title || "",
          description: task.description || "",
          assignee_id: task.assignee_id || "",
          priority: task.priority || "medium",
          dueDate: task.dueDate
            ? new Date(task.dueDate).toISOString().split("T")[0]
            : "",
          estimatedHours: task.estimatedHours?.toString() || "",
          tags: task.tags?.join(", ") || "",
        });
      } else {
        // Creating new task
        setFormData({
          title: "",
          description: "",
          assignee_id: "",
          priority: "medium",
          dueDate: "",
          estimatedHours: "",
          tags: "",
        });
      }
      setErrors({});

      // Fetch assignable users when modal opens
      if (project) {
        fetchAssignableUsers();
      }
    }
  }, [isOpen, task, project]);

  // Fetch users that can be assigned tasks based on current user's role
  const fetchAssignableUsers = async () => {
    if (!project?.id) return;

    try {
      setFetchingUsers(true);
      const response = await projectsAPI.getAssignableUsers(project.id);

      let users = response.data.users || [];

      // Apply role-based filtering on frontend as well for security
      if (isManager && !isAdmin) {
        // Managers can only assign to regular users
        users = users.filter((u) => u.role === "user");
      }

      setAssignableUsers(users);
    } catch (error) {
      console.error("Failed to fetch assignable users:", error);
      setAssignableUsers([]);

      if (error.response?.status === 403) {
        setErrors({
          general: "You don't have permission to view assignable users",
        });
      }
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    } else if (formData.title.trim().length < 2) {
      newErrors.title = "Task title must be at least 2 characters";
    }

    if (!formData.assignee_id) {
      newErrors.assignee_id = "Please select an assignee";
    }

    if (
      formData.estimatedHours &&
      (isNaN(formData.estimatedHours) ||
        parseFloat(formData.estimatedHours) < 0)
    ) {
      newErrors.estimatedHours = "Estimated hours must be a positive number";
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.dueDate = "Due date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canCreateTasks) {
      setErrors({
        general: "You don't have permission to create or assign tasks",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignee_id: formData.assignee_id,
        priority: formData.priority,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate).toISOString()
          : null,
        estimatedHours: formData.estimatedHours
          ? parseFloat(formData.estimatedHours)
          : 0,
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      };

      let response;

      if (task) {
        // Update existing task
        response = await projectsAPI.updateTask(project.id, task.id, taskData);
        onTaskUpdated(response.data.task);
        alert("Task updated successfully!");
      } else {
        // Create new task
        response = await projectsAPI.createTask(project.id, taskData);
        onTaskCreated(response.data.task);
        alert("Task created successfully!");
      }

      handleClose();
    } catch (error) {
      console.error("Failed to save task:", error);

      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors
            .map((err) => err.msg || err.message || err.toString())
            .join("\n");
          setErrors({ general: `Validation Errors:\n${errorMessages}` });
        } else {
          const errorMessage =
            errorData.error || errorData.message || "Invalid task data";
          setErrors({ general: errorMessage });
        }
      } else if (error.response?.status === 403) {
        const errorMsg =
          error.response.data?.error || error.response.data?.message;
        setErrors({
          general: `Access denied: ${
            errorMsg || "You don't have permission to perform this action"
          }`,
        });
      } else {
        setErrors({
          general: `Failed to ${task ? "update" : "create"} task: ${
            error.message
          }`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      assignee_id: "",
      priority: "medium",
      dueDate: "",
      estimatedHours: "",
      tags: "",
    });
    setErrors({});
    setAssignableUsers([]);
    onClose();
  };

  // Priority options
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  // Don't render modal if user doesn't have permission
  if (!canCreateTasks) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={task ? "Edit Task" : "Create New Task"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm whitespace-pre-line">
              {errors.general}
            </p>
          </div>
        )}

        {/* Project Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900">
            Project: {project?.name}
          </h3>
          <p className="text-sm text-blue-700">Client: {project?.client}</p>
        </div>

        {/* Task Title */}
        <FormField label="Task Title" required error={errors.title}>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Enter task title"
            error={!!errors.title}
            maxLength={200}
          />
        </FormField>

        {/* Task Description */}
        <FormField label="Description">
          <TextArea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Enter task description (optional)"
            rows={3}
            maxLength={2000}
          />
        </FormField>

        {/* Assignee Selection */}
        <FormField
          label={`Assign to ${isManager ? "User" : "Team Member"}`}
          required
          error={errors.assignee_id}
        >
          {fetchingUsers ? (
            <div className="flex items-center space-x-2 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading users...</span>
            </div>
          ) : (
            <Select
              value={formData.assignee_id}
              onChange={(e) => handleInputChange("assignee_id", e.target.value)}
              options={[
                { value: "", label: "Select assignee..." },
                ...assignableUsers.map((user) => ({
                  value: user.id,
                  label: `${user.name} (${user.role}) - ${user.department || "No department"}`
                }))
              ]}
              error={!!errors.assignee_id}
            />
          )}
          {isManager && (
            <p className="text-xs text-gray-500 mt-1">
              As a manager, you can only assign tasks to regular users.
            </p>
          )}
          {isAdmin && (
            <p className="text-xs text-gray-500 mt-1">
              As an admin, you can assign tasks to any team member.
            </p>
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          {/* Priority */}
          <FormField label="Priority">
            <Select
              value={formData.priority}
              onChange={(e) => handleInputChange("priority", e.target.value)}
              options={priorityOptions}
            />
          </FormField>

          {/* Estimated Hours */}
          <FormField label="Estimated Hours" error={errors.estimatedHours}>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedHours}
              onChange={(e) =>
                handleInputChange("estimatedHours", e.target.value)
              }
              placeholder="0"
              error={!!errors.estimatedHours}
            />
          </FormField>
        </div>

        {/* Due Date */}
        <FormField label="Due Date (Optional)" error={errors.dueDate}>
          <Input
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange("dueDate", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            error={!!errors.dueDate}
          />
        </FormField>

        {/* Tags */}
        <FormField label="Tags (Optional)">
          <Input
            type="text"
            value={formData.tags}
            onChange={(e) => handleInputChange("tags", e.target.value)}
            placeholder="Enter tags separated by commas (e.g., frontend, urgent, bug-fix)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple tags with commas
          </p>
        </FormField>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading || fetchingUsers}
          >
            {loading
              ? task
                ? "Updating..."
                : "Creating..."
              : task
              ? "Update Task"
              : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
