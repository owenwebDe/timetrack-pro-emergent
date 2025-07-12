// frontend/src/components/projects/TaskRow.js - Individual task row component
import React, { useState } from "react";
import { Edit, Trash2, CheckCircle2, Circle, AlertCircle } from "lucide-react";

export const TaskRow = ({
  task,
  projects,
  user,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const [updating, setUpdating] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} className="text-green-600" />;
      case "in_progress":
        return <Circle size={16} className="text-blue-600" />;
      case "blocked":
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      case "in_review":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await onStatusChange(task.id, newStatus);
    } catch (error) {
      console.error("Failed to update task status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const canEdit =
    task.assignee_id === user.id ||
    task.createdBy === user.id ||
    user.role === "admin" ||
    user.role === "manager";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-start space-x-3">
          {getStatusIcon(task.status)}
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-gray-500 truncate mt-1">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <img
            src={
              task.assignee?.avatar ||
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
            }
            alt={task.assignee?.name || "Unknown"}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {task.assignee?.name || "Unassigned"}
            </p>
            <p className="text-xs text-gray-500">{task.assignee?.role || ""}</p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={updating || !canEdit}
          className={`px-2 py-1 text-xs rounded-full font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(
            task.status
          )} ${updating ? "opacity-50" : ""}`}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </td>

      <td className="px-6 py-4">
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${getPriorityColor(
            task.priority
          )}`}
        >
          {task.priority}
        </span>
      </td>

      <td className="px-6 py-4 text-sm text-gray-500">
        {task.dueDate
          ? new Date(task.dueDate).toLocaleDateString()
          : "No due date"}
      </td>

      <td className="px-6 py-4 text-sm text-gray-500">
        {task.estimatedHours}h
      </td>

      <td className="px-6 py-4">
        {canEdit && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(task)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="Edit task"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Delete task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};
