// frontend/src/components/projects/ProjectGrid.js - Project grid layout component
import React from "react";
import { ProjectCard } from "./ProjectCard";
import { EmptyState } from "../common/EmptyState";

export const ProjectGrid = ({
  projects,
  tasks,
  user,
  onOpenTaskModal,
  onCreateProject,
}) => {
  // Debug what projects data we're receiving
  console.log("🔍 ProjectGrid received projects:", projects);
  console.log("🔍 ProjectGrid projects type:", typeof projects);
  console.log("🔍 ProjectGrid projects length:", projects?.length);
  console.log("🔍 ProjectGrid projects isArray:", Array.isArray(projects));

  const getTaskCount = (projectId) => {
    return tasks.filter((task) => task.project_id === projectId).length;
  };

  if (!projects || projects.length === 0) {
    console.log("⚠️ ProjectGrid showing empty state - no projects");
    console.log("⚠️ Projects data:", projects);
    return (
      <EmptyState
        icon="📁"
        title="No projects found"
        description={
          user?.role === "user"
            ? "You haven't been assigned to any projects yet."
            : "Get started by creating your first project."
        }
        action={
          (user?.role === "admin" || user?.role === "manager") && (
            <button
              onClick={onCreateProject}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Project
            </button>
          )
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          taskCount={getTaskCount(project.id)}
          user={user}
          onOpenTaskModal={onOpenTaskModal}
        />
      ))}
    </div>
  );
};
