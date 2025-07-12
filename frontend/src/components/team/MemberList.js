// frontend/src/components/team/MemberList.js
import React from "react";
import { Crown, Shield, User as UserIcon, Users } from "lucide-react";

export const MemberList = ({
  members,
  user,
  organization,
  onEditMember,
  onRemoveMember,
  canPerformAction,
}) => {
  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-red-500" />;
      case "manager":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "user":
        return <UserIcon className="h-4 w-4 text-green-500" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "user":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleEdit = (member) => {
    if (onEditMember) {
      onEditMember(member);
    }
  };

  const handleRemove = (member) => {
    if (
      onRemoveMember &&
      window.confirm(`Are you sure you want to remove ${member.name}?`)
    ) {
      onRemoveMember(member);
    }
  };

  if (members.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p>No team members found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Member
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Login
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <img
                    src={
                      member.avatar ||
                      `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`
                    }
                    alt={member.name || "User"}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center">
                      {member.name || "Unknown User"}
                      {member.id === organization?.adminId && (
                        <Crown
                          className="ml-2 h-4 w-4 text-yellow-500"
                          title="Organization Admin"
                        />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.email || "No email"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getRoleIcon(member.role)}
                  <span
                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                      member.role
                    )}`}
                  >
                    {member.role || "user"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {member.department || "—"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {member.lastLogin
                  ? new Date(member.lastLogin).toLocaleDateString()
                  : "Never"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {canPerformAction("manage_members") &&
                  member.id !== user.id && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      {member.id !== organization?.adminId && (
                        <button
                          onClick={() => handleRemove(member)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
