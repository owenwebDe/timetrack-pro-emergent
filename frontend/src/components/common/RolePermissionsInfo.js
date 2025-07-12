// frontend/src/components/common/RolePermissionsInfo.js - Role-based permissions display component
import React from "react";
import { Shield, Users, UserCheck, AlertCircle } from "lucide-react";

export const RolePermissionsInfo = ({ user, context = "tasks" }) => {
  if (!user || !user.role) return null;

  const getRoleInfo = () => {
    switch (user.role) {
      case "admin":
        return {
          icon: <Shield className="w-5 h-5 text-purple-600" />,
          title: "Administrator",
          color: "purple",
          permissions: {
            projects: [
              "Create and manage all projects",
              "Delete projects",
              "Manage project settings and members",
              "View all project analytics",
            ],
            tasks: [
              "Create and assign tasks to anyone",
              "Assign tasks to admins, managers, and users",
              "Edit and delete any task",
              "Change task assignments",
              "View all tasks in organization",
            ],
            team: [
              "Invite and manage all team members",
              "Change user roles and permissions",
              "Remove team members",
              "View all team analytics",
            ],
          },
        };

      case "manager":
        return {
          icon: <UserCheck className="w-5 h-5 text-blue-600" />,
          title: "Manager",
          color: "blue",
          permissions: {
            projects: [
              "Create and manage projects",
              "Manage project members",
              "View project analytics for managed projects",
            ],
            tasks: [
              "Create and assign tasks",
              "Assign tasks only to regular users",
              "Cannot assign tasks to other managers or admins",
              "Edit tasks in managed projects",
              "View tasks in accessible projects",
            ],
            team: [
              "Invite regular users to organization",
              "View team member information",
              "Cannot manage other managers or admins",
            ],
          },
          restrictions: [
            "Cannot assign tasks to managers or admins",
            "Cannot delete projects created by others",
            "Cannot change roles of other users",
          ],
        };

      case "user":
        return {
          icon: <Users className="w-5 h-5 text-green-600" />,
          title: "Team Member",
          color: "green",
          permissions: {
            projects: [
              "View projects you're assigned to",
              "Update your own task progress",
            ],
            tasks: [
              "View tasks assigned to you",
              "Update status of your assigned tasks",
              "Add comments to your tasks",
              "Track time on your tasks",
            ],
            team: [
              "View team member profiles",
              "Collaborate on shared projects",
            ],
          },
          restrictions: [
            "Cannot create or delete projects",
            "Cannot create or assign tasks to others",
            "Cannot manage team members",
            "Cannot view tasks not assigned to you",
          ],
        };

      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-gray-600" />,
          title: "Unknown Role",
          color: "gray",
          permissions: { projects: [], tasks: [], team: [] },
          restrictions: ["Role not recognized"],
        };
    }
  };

  const roleInfo = getRoleInfo();
  const currentPermissions = roleInfo.permissions[context] || [];

  return (
    <div
      className={`bg-${roleInfo.color}-50 border border-${roleInfo.color}-200 rounded-lg p-4`}
    >
      <div className="flex items-center space-x-2 mb-3">
        {roleInfo.icon}
        <h3 className={`font-semibold text-${roleInfo.color}-900`}>
          {roleInfo.title} Permissions
        </h3>
      </div>

      <div className="space-y-3">
        {/* Current Context Permissions */}
        <div>
          <h4 className={`text-sm font-medium text-${roleInfo.color}-800 mb-2`}>
            What you can do with {context}:
          </h4>
          <ul className={`text-sm text-${roleInfo.color}-700 space-y-1`}>
            {currentPermissions.map((permission, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{permission}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Restrictions */}
        {roleInfo.restrictions && roleInfo.restrictions.length > 0 && (
          <div>
            <h4
              className={`text-sm font-medium text-${roleInfo.color}-800 mb-2`}
            >
              Restrictions:
            </h4>
            <ul className={`text-sm text-${roleInfo.color}-600 space-y-1`}>
              {roleInfo.restrictions.map((restriction, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-orange-500 mt-0.5">⚠</span>
                  <span>{restriction}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Compact version for tooltips or small spaces
export const RolePermissionsBadge = ({ user, showTooltip = true }) => {
  if (!user || !user.role) return null;

  const getRoleConfig = () => {
    switch (user.role) {
      case "admin":
        return {
          label: "Admin",
          color: "bg-purple-100 text-purple-800",
          description: "Full access to all features",
        };
      case "manager":
        return {
          label: "Manager",
          color: "bg-blue-100 text-blue-800",
          description: "Can create projects and assign tasks to users",
        };
      case "user":
        return {
          label: "User",
          color: "bg-green-100 text-green-800",
          description: "Can work on assigned tasks",
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-800",
          description: "Role not recognized",
        };
    }
  };

  const config = getRoleConfig();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      title={showTooltip ? config.description : undefined}
    >
      {config.label}
    </span>
  );
};

// Task assignment helper component
export const TaskAssignmentHelper = ({ user, availableUsers = [] }) => {
  if (!user || !["admin", "manager"].includes(user.role)) {
    return null;
  }

  const assignableUsers = availableUsers.filter((u) => {
    if (user.role === "admin") {
      return true; // Admins can assign to anyone
    }
    if (user.role === "manager") {
      return u.role === "user"; // Managers can only assign to users
    }
    return false;
  });

  const restrictedUsers = availableUsers.filter(
    (u) => !assignableUsers.includes(u)
  );

  return (
    <div className="space-y-3">
      {/* Assignable Users */}
      {assignableUsers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-green-800 mb-2">
            ✓ You can assign tasks to ({assignableUsers.length}):
          </h4>
          <div className="flex flex-wrap gap-1">
            {assignableUsers.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800"
              >
                {u.name} ({u.role})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Restricted Users */}
      {restrictedUsers.length > 0 && user.role === "manager" && (
        <div>
          <h4 className="text-sm font-medium text-orange-800 mb-2">
            ⚠ Cannot assign tasks to ({restrictedUsers.length}):
          </h4>
          <div className="flex flex-wrap gap-1">
            {restrictedUsers.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800"
              >
                {u.name} ({u.role})
              </span>
            ))}
          </div>
          <p className="text-xs text-orange-600 mt-1">
            As a manager, you can only assign tasks to regular users.
          </p>
        </div>
      )}
    </div>
  );
};
