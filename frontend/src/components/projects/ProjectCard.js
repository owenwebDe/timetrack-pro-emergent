// frontend/src/components/projects/ProjectCard.js - Individual project display component
import React from "react";
import { UserPlus } from "lucide-react";

export const ProjectCard = ({ project, taskCount, user, onOpenTaskModal, onViewDetails, onEditProject, children }) => {
  console.log("ProjectCard user prop:", user);
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {project.name}
        </h3>
        <span
          className={`px-2 py-1 text-xs rounded-full font-medium ${
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
          <span className="text-gray-500">Budget:</span>
          <span className="font-medium">${project.budget || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tasks:</span>
          <span className="font-medium">{taskCount}</span>
        </div>
      </div>

      {children && <div className="mt-4">{children}</div>}
      
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button 
            onClick={() => onViewDetails && onViewDetails(project)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            View Details
          </button>
          {(user?.role === "admin" || user?.role === "manager") && (
            <button
              onClick={() => onEditProject && onEditProject(project)}
              className="text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        {(user?.role === "admin" || user?.role === "manager") && (
          <button
            onClick={() => onOpenTaskModal && onOpenTaskModal(project)}
            className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors flex items-center space-x-1"
          >
            <UserPlus size={14} />
            <span>Assign Task</span>
          </button>
        )}
      </div>
    </div>
  );
};
