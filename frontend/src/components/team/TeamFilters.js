// frontend/src/components/team/TeamFilters.js
import React from "react";
import { SearchInput } from "../forms/SearchInput";
import { Select } from "../forms/Select";

export const TeamFilters = ({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  activeTab,
}) => {
  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "user", label: "User" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const getSearchPlaceholder = () => {
    return activeTab === "members"
      ? "Search members..."
      : "Search invitations...";
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
      <div className="flex-1 max-w-md">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={getSearchPlaceholder()}
        />
      </div>

      {activeTab === "members" && (
        <div className="flex space-x-3">
          <Select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            options={roleOptions}
          />
          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            options={statusOptions}
          />
        </div>
      )}
    </div>
  );
};
