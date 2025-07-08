// frontend/src/pages/TeamManagementPage.js - Updated for organization-scoped team management
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Calendar,
  Clock,
  Users,
  UserPlus,
  Copy,
  Send,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  UserCheck,
  Crown,
  Shield,
  User as UserIcon,
  ExternalLink,
  Download,
} from "lucide-react";
import { DashboardWidget } from "../components/DashboardWidget";
import { usersAPI, invitationsAPI } from "../api/client";
import { useOrganization } from "../contexts/OrganizationContext";

export const TeamManagementPage = ({ user }) => {
  const {
    organization,
    members,
    invitations,
    stats,
    loading: orgLoading,
    sendInvitation,
    cancelInvitation,
    resendInvitation,
    canPerformAction,
    hasReachedLimit,
  } = useOrganization();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "user",
    message: "",
    department: "",
    jobTitle: "",
  });
  const [bulkInviteData, setBulkInviteData] = useState({
    invitations: [{ email: "", role: "user" }],
    defaultMessage: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState("members");

  // Filter members based on search and filters
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && member.isActive) ||
      (statusFilter === "inactive" && !member.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filter invitations based on search
  const filteredInvitations = invitations.filter((invitation) => {
    const matchesSearch =
      invitation.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.inviterName?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleSendInvitation = async (e) => {
    e.preventDefault();

    if (!canPerformAction("invite_users")) {
      setError("You don't have permission to invite users");
      return;
    }

    if (hasReachedLimit("users")) {
      setError(
        "Your organization has reached the maximum user limit. Please upgrade your plan."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendInvitation({
        email: inviteData.email,
        role: inviteData.role,
        message: inviteData.message,
        department: inviteData.department,
        jobTitle: inviteData.jobTitle,
      });

      // Reset form and close modal
      setInviteData({
        email: "",
        role: "user",
        message: "",
        department: "",
        jobTitle: "",
      });
      setShowInviteModal(false);

      // Show success message
      alert(`Invitation sent to ${inviteData.email} successfully!`);
    } catch (error) {
      console.error("Failed to send invitation:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to send invitation";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkInvite = async (e) => {
    e.preventDefault();

    if (!canPerformAction("invite_users")) {
      setError("You don't have permission to invite users");
      return;
    }

    const validInvitations = bulkInviteData.invitations.filter((inv) =>
      inv.email.trim()
    );

    if (validInvitations.length === 0) {
      setError("Please add at least one valid email address");
      return;
    }

    if (hasReachedLimit("users")) {
      setError(
        "Your organization has reached the maximum user limit. Please upgrade your plan."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await invitationsAPI.bulkSendInvitations(
        validInvitations,
        bulkInviteData.defaultMessage
      );

      // Reset form and close modal
      setBulkInviteData({
        invitations: [{ email: "", role: "user" }],
        defaultMessage: "",
      });
      setShowBulkInviteModal(false);

      // Show results
      const { sent, failed, skipped } = response.data.results;
      alert(
        `Bulk invitation completed!\n${sent.length} sent, ${failed.length} failed, ${skipped.length} skipped.`
      );
    } catch (error) {
      console.error("Failed to send bulk invitations:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to send bulk invitations";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;

    try {
      await cancelInvitation(invitationId);
      alert("Invitation cancelled successfully");
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
      alert("Failed to cancel invitation");
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      await resendInvitation(invitationId);
      alert("Invitation reminder sent successfully");
    } catch (error) {
      console.error("Failed to resend invitation:", error);
      alert("Failed to send reminder");
    }
  };

  const copyInvitationLink = (invitation) => {
    const inviteUrl = `${window.location.origin}/accept-invitation?token=${invitation.token}`;
    navigator.clipboard.writeText(inviteUrl);
    alert("Invitation link copied to clipboard!");
  };

  const addBulkInviteRow = () => {
    setBulkInviteData((prev) => ({
      ...prev,
      invitations: [...prev.invitations, { email: "", role: "user" }],
    }));
  };

  const removeBulkInviteRow = (index) => {
    setBulkInviteData((prev) => ({
      ...prev,
      invitations: prev.invitations.filter((_, i) => i !== index),
    }));
  };

  const updateBulkInviteRow = (index, field, value) => {
    setBulkInviteData((prev) => ({
      ...prev,
      invitations: prev.invitations.map((inv, i) =>
        i === index ? { ...inv, [field]: value } : inv
      ),
    }));
  };

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

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">
                Team Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your {organization?.name} team members and invitations.
              </p>
            </div>

            {canPerformAction("invite_users") && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBulkInviteModal(true)}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Users size={16} />
                  <span>Bulk Invite</span>
                </button>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <UserPlus size={16} />
                  <span>Invite Member</span>
                </button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <DashboardWidget
              title="Total Members"
              value={stats.totalUsers || members.length}
              subtitle="In your organization"
              icon="👥"
              color="blue"
            />
            <DashboardWidget
              title="Active Members"
              value={
                stats.activeUsers || members.filter((m) => m.isActive).length
              }
              subtitle="Currently active"
              icon="🟢"
              color="green"
            />
            <DashboardWidget
              title="Pending Invitations"
              value={
                invitations.filter((inv) => inv.status === "pending").length
              }
              subtitle="Awaiting response"
              icon="📧"
              color="orange"
            />
            <DashboardWidget
              title="Admin Users"
              value={members.filter((m) => m.role === "admin").length}
              subtitle="Organization admins"
              icon="👑"
              color="purple"
            />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab("members")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === "members"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Team Members ({filteredMembers.length})
              </button>
              <button
                onClick={() => setSelectedTab("invitations")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === "invitations"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Invitations ({filteredInvitations.length})
              </button>
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    selectedTab === "members"
                      ? "Search members..."
                      : "Search invitations..."
                  }
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              {selectedTab === "members" && (
                <>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Members Tab */}
          {selectedTab === "members" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Members
                </h3>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No team members found matching your criteria.</p>
                  {canPerformAction("invite_users") && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Invite your first team member
                    </button>
                  )}
                </div>
              ) : (
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
                      {filteredMembers.map((member) => (
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
                                  <button className="text-blue-600 hover:text-blue-900">
                                    Edit
                                  </button>
                                  {member.id !== organization?.adminId && (
                                    <button className="text-red-600 hover:text-red-900">
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
              )}
            </div>
          )}

          {/* Invitations Tab */}
          {selectedTab === "invitations" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pending Invitations
                </h3>
              </div>

              {filteredInvitations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No invitations found.</p>
                  {canPerformAction("invite_users") && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      Send your first invitation
                    </button>
                  )}
                </div>
              ) : (
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
                      {filteredInvitations.map((invitation) => (
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
                                    onClick={() =>
                                      copyInvitationLink(invitation)
                                    }
                                    className="text-blue-600 hover:text-blue-900 flex items-center"
                                    title="Copy invitation link"
                                  >
                                    <Copy size={14} />
                                  </button>
                                  {invitation.canSendReminder && (
                                    <button
                                      onClick={() =>
                                        handleResendInvitation(invitation.id)
                                      }
                                      className="text-green-600 hover:text-green-900 flex items-center"
                                      title="Send reminder"
                                    >
                                      <RefreshCw size={14} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleCancelInvitation(invitation.id)
                                    }
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Single Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Invite Team Member
              </h3>
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, email: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={inviteData.role}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    {user?.role === "admin" && (
                      <option value="admin">Admin</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={inviteData.jobTitle}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, jobTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Software Developer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={inviteData.department}
                    onChange={(e) =>
                      setInviteData({
                        ...inviteData,
                        department: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Engineering"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Message
                  </label>
                  <textarea
                    value={inviteData.message}
                    onChange={(e) =>
                      setInviteData({ ...inviteData, message: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional personal message to include in the invitation"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 text-sm">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Invitation will expire in 7 days
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Invitation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Invite Modal */}
      {showBulkInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bulk Invite Team Members
              </h3>
              <form onSubmit={handleBulkInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Message
                  </label>
                  <textarea
                    value={bulkInviteData.defaultMessage}
                    onChange={(e) =>
                      setBulkInviteData({
                        ...bulkInviteData,
                        defaultMessage: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional message for all invitations"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Team Members
                    </label>
                    <button
                      type="button"
                      onClick={addBulkInviteRow}
                      className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Plus size={16} />
                      <span>Add Row</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {bulkInviteData.invitations.map((invitation, index) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="email"
                          value={invitation.email}
                          onChange={(e) =>
                            updateBulkInviteRow(index, "email", e.target.value)
                          }
                          placeholder="Email address"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={invitation.role}
                          onChange={(e) =>
                            updateBulkInviteRow(index, "role", e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="user">User</option>
                          <option value="manager">Manager</option>
                          {user?.role === "admin" && (
                            <option value="admin">Admin</option>
                          )}
                        </select>
                        {bulkInviteData.invitations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBulkInviteRow(index)}
                            className="text-red-600 hover:text-red-800 px-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-sm">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    All invitations will expire in 7 days. Only valid email
                    addresses will be processed.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBulkInviteModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Invitations</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
