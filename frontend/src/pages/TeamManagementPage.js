import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { DashboardWidget } from "../components/DashboardWidget";
import { usersAPI, invitationsAPI } from "../api/client";

export const TeamManagementPage = ({ user, onLogout }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [teamData, setTeamData] = useState({
    members: [],
    stats: {
      total_users: 0,
      active_users: 0,
      users_by_role: {},
    },
  });
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [showBulkInviteModal, setShowBulkInviteModal] = useState(false);
  const [bulkInviteList, setBulkInviteList] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Only admins and managers can access team management data
      if (user?.role !== "admin" && user?.role !== "manager") {
        console.log("👤 Regular user - access denied to team management");
        setTeamData({
          members: [],
          stats: {
            total_users: 0,
            active_users: 0,
            users_by_role: {},
          },
        });
        setPendingInvitations([]);
        return;
      }

      const [usersResponse, statsResponse, invitationsResponse] =
        await Promise.all([
          usersAPI.getUsers(),
          usersAPI.getTeamStats(),
          invitationsAPI.getInvitations({ status: "pending" }),
        ]);
      setTeamData({
        members: usersResponse.data.users || usersResponse.data, // fallback for old API
        stats: statsResponse.data,
      });
      setPendingInvitations(invitationsResponse.data.invitations || []);
    } catch (error) {
      console.error("Failed to fetch team data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Merge users and pending invitations for display
  const mergedMembers = [
    ...teamData.members.map((member) => ({ ...member, isInvitation: false })),
    ...pendingInvitations.map((invite) => ({
      id: invite.id,
      name: invite.metadata?.name || invite.email,
      email: invite.email,
      role: invite.role,
      status: "Invited",
      jobTitle: invite.metadata?.jobTitle || "",
      department: invite.metadata?.department || "",
      isInvitation: true,
    })),
  ];

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      await invitationsAPI.sendInvitation({ email: inviteEmail, role: "user" });
      alert(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setShowInviteModal(false);
      fetchTeamData(); // Refresh data
    } catch (error) {
      console.error("Failed to send invitation:", error);
    }
  };

  const handleBulkInvite = async (e) => {
    e.preventDefault();
    // Parse emails (comma or newline separated)
    const emails = bulkInviteList
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
    if (emails.length === 0) {
      alert("Please enter at least one email address.");
      return;
    }
    try {
      await invitationsAPI.bulkSendInvitations(
        emails.map((email) => ({ email, role: "user" }))
      );
      alert("Bulk invitations sent!");
      setBulkInviteList("");
      setShowBulkInviteModal(false);
      fetchTeamData();
    } catch (error) {
      console.error("Failed to send bulk invitations:", error);
      alert("Failed to send bulk invitations.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Header user={user} onLogout={onLogout} currentPage="Team" /> */}
      <div className="flex">
        {/* <Sidebar currentPage="Team" /> */}
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Team Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage your team members and their roles.
                </p>
              </div>
              {user?.role === "admin" && (
                <>
                  <button
                    onClick={() => setShowBulkInviteModal(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center mr-2"
                  >
                    <span className="mr-2">📧</span>
                    Bulk Invite
                  </button>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <span className="mr-2">➕</span>
                    Invite Member
                  </button>
                </>
              )}
              {user?.role !== "admin" && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <span className="mr-2">➕</span>
                  Invite Member
                </button>
              )}
            </div>
            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <DashboardWidget
                title="Team Members"
                value={teamData.stats.total_users}
                subtitle="Active users"
                icon="👥"
                color="blue"
              />
              <DashboardWidget
                title="Online Now"
                value={teamData.stats.active_users}
                subtitle="Currently active"
                icon="🟢"
                color="green"
              />
              <DashboardWidget
                title="Total Hours"
                value="342"
                subtitle="This week"
                icon="⏰"
                color="purple"
              />
            </div>
            {/* Team Members List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Members
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mergedMembers.map((member) => (
                      <tr
                        key={member.id || member.email}
                        className="hover:bg-gray-50 table-row"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={
                                member.avatar ||
                                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                              }
                              alt={member.name}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {member.name || member.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              member.role === "admin"
                                ? "bg-red-100 text-red-800"
                                : member.role === "manager"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              member.status === "active"
                                ? "bg-green-100 text-green-800"
                                : member.status === "Invited"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {member.status ||
                              (member.isInvitation ? "Invited" : "")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.jobTitle || member.metadata?.jobTitle || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {member.department ||
                            member.metadata?.department ||
                            "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {/* Only admin can remove members, and not for invitations */}
                          {user?.role === "admin" && !member.isInvitation && (
                            <button className="text-red-600 hover:text-red-900">
                              Remove
                            </button>
                          )}
                          {/* Optionally, show cancel invitation for pending invites */}
                          {user?.role === "admin" && member.isInvitation && (
                            <button className="text-yellow-600 hover:text-yellow-900">
                              Cancel Invite
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invite Team Member
            </h3>
            <form onSubmit={handleInviteUser}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Invite Modal */}
      {showBulkInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bulk Invite Team Members
            </h3>
            <form onSubmit={handleBulkInvite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter emails (comma or newline separated)
                </label>
                <textarea
                  value={bulkInviteList}
                  onChange={(e) => setBulkInviteList(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user1@email.com, user2@email.com"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBulkInviteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Send Bulk Invitations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
