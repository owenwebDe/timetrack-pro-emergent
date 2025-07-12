// frontend/src/components/team/TeamStats.js
import React from "react";
import { DashboardWidget } from "../DashboardWidget";

export const TeamStats = ({ members, invitations, stats }) => {
  const calculateStats = () => {
    const totalMembers = stats?.totalUsers || members.length;
    const activeMembers =
      stats?.activeUsers || members.filter((m) => m.isActive).length;
    const pendingInvitations = invitations.filter(
      (inv) => inv.status === "pending"
    ).length;
    const adminUsers = members.filter((m) => m.role === "admin").length;

    return {
      totalMembers,
      activeMembers,
      pendingInvitations,
      adminUsers,
    };
  };

  const teamStats = calculateStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <DashboardWidget
        title="Total Members"
        value={teamStats.totalMembers}
        subtitle="In your organization"
        icon="👥"
        color="blue"
      />
      <DashboardWidget
        title="Active Members"
        value={teamStats.activeMembers}
        subtitle="Currently active"
        icon="🟢"
        color="green"
      />
      <DashboardWidget
        title="Pending Invitations"
        value={teamStats.pendingInvitations}
        subtitle="Awaiting response"
        icon="📧"
        color="orange"
      />
      <DashboardWidget
        title="Admin Users"
        value={teamStats.adminUsers}
        subtitle="Organization admins"
        icon="👑"
        color="purple"
      />
    </div>
  );
};
