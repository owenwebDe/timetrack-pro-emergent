// frontend/src/components/team/InvitationList.js
import React from "react";
import {
  Mail,
  Crown,
  Shield,
  User as UserIcon,
  Copy,
  RefreshCw,
  Trash2,
} from "lucide-react";

export const InvitationList = ({
  invitations,
  canPerformAction,
  onCopyLink,
  onResendInvitation,
  onCancelInvitation,
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

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleCopyLink = (invitation) => {
    if (onCopyLink) {
      onCopyLink(invitation);
    }
  };

  const handleResend = (invitationId) => {
    if (onResendInvitation) {
      onResendInvitation(invitationId);
    }
  };

  const handleCancel = (invitationId) => {
    if (onCancelInvitation) {
      onCancelInvitation(invitationId);
    }
  };

  if (invitations.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p>No invitations found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invited By
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expires
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invitations.map((invitation) => (
            <tr key={invitation.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {invitation.email}
                    </div>
                    {invitation.message && (
                      <div className="text-sm text-gray-500 italic">
                        "{invitation.message.substring(0, 50)}..."
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {getRoleIcon(invitation.role)}
                  <span
                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                      invitation.role
                    )}`}
                  >
                    {invitation.role}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                    invitation.status
                  )}`}
                >
                  {invitation.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {invitation.inviterName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invitation.daysUntilExpiry > 0
                  ? `${invitation.daysUntilExpiry} days left`
                  : "Expired"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invitation.status === "pending" &&
                  canPerformAction("invite_users") && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyLink(invitation)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="Copy invitation link"
                      >
                        <Copy size={14} />
                      </button>
                      {invitation.canSendReminder && (
                        <button
                          onClick={() => handleResend(invitation.id)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Send reminder"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(invitation.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                        title="Cancel invitation"
                      >
                        <Trash2 size={14} />
                      </button>
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
