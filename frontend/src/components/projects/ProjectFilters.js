// frontend/src/components/projects/ProjectFilters.js - Task filtering component
import React from "react";
import { SearchInput } from "../forms/SearchInput";
import { FilterDropdown } from "../forms/FilterDropdown";

export const ProjectFilters = ({
  taskFilter,
  setTaskFilter,
  uniqueAssignees,
}) => {
  const handleFilterChange = (field, value) => {
    setTaskFilter((prev) => ({ ...prev, [field]: value }));
  };

  const statusOptions = [
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "in_review", label: "In Review" },
    { value: "completed", label: "Completed" },
    { value: "blocked", label: "Blocked" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const assigneeOptions = uniqueAssignees.map((assignee) => ({
    value: assignee.id,
    label: assignee.name,
  }));

  return (
    <div className="flex flex-wrap gap-3">
      <SearchInput
        value={taskFilter.search}
        onChange={(value) => handleFilterChange("search", value)}
        placeholder="Search tasks..."
        className="w-64"
      />

      <FilterDropdown
        value={taskFilter.status}
        onChange={(value) => handleFilterChange("status", value)}
        options={statusOptions}
        placeholder="All Status"
      />

      <FilterDropdown
        value={taskFilter.priority}
        onChange={(value) => handleFilterChange("priority", value)}
        options={priorityOptions}
        placeholder="All Priority"
      />

      <FilterDropdown
        value={taskFilter.assignee}
        onChange={(value) => handleFilterChange("assignee", value)}
        options={assigneeOptions}
        placeholder="All Assignees"
      />
    </div>
  );
};
