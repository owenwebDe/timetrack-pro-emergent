import React from "react";

export const RoleIndicator = ({ user }) => {
  const getRoleInfo = (role) => {
    switch (role) {
      case "admin":
        return {
          label: "Administrator",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: "👑",
          description: "Full system access",
        };
      case "manager":
        return {
          label: "Project Manager",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: "👨‍💼",
          description: "Can create and manage projects",
        };
      case "user":
        return {
          label: "Team Member",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: "👤",
          description: "Track time and view assigned projects",
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "❓",
          description: "Unknown role",
        };
    }
  };

  const roleInfo = getRoleInfo(user?.role);

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${roleInfo.color}`}
    >
      <span className="mr-2">{roleInfo.icon}</span>
      <span>{roleInfo.label}</span>
    </div>
  );
};

export const RolePermissions = ({ user }) => {
  const getPermissions = (role) => {
    switch (role) {
      case "admin":
        return [
          "Create and manage projects",
          "Manage team members",
          "View all analytics and reports",
          "Configure system settings",
          "Access user management",
        ];
      case "manager":
        return [
          "Create and manage projects",
          "Assign tasks to team members",
          "View team analytics",
          "Manage project settings",
        ];
      case "user":
        return [
          "Track time on assigned projects",
          "View personal analytics",
          "Update profile settings",
          "View assigned tasks",
        ];
      default:
        return ["Limited access"];
    }
  };

  const permissions = getPermissions(user?.role);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Your Permissions
      </h3>
      <div className="space-y-2">
        {permissions.map((permission, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">{permission}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
