// frontend/src/components/dashboard/ProjectOverview.js
import React from "react";
import {
  FolderOpen,
  ChevronRight,
  Plus,
  DollarSign,
  Calendar,
} from "lucide-react";

export const ProjectOverview = ({ projects = [], loading = false, user }) => {
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="bg-gray-200 rounded w-32 h-6 animate-pulse"></div>
          <div className="bg-gray-200 rounded w-20 h-4 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="bg-gray-200 rounded w-32 h-4 mb-2"></div>
                  <div className="bg-gray-200 rounded w-24 h-3"></div>
                </div>
                <div className="bg-gray-200 rounded-full w-16 h-5"></div>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-200 rounded w-full h-2"></div>
                <div className="flex justify-between">
                  <div className="bg-gray-200 rounded w-12 h-3"></div>
                  <div className="bg-gray-200 rounded w-16 h-3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
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
  );
};
