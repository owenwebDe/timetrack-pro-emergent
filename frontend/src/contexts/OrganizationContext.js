// frontend/src/contexts/OrganizationContext.js - Organization state management
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { organizationAPI } from "../api/client";

// Create the context
const OrganizationContext = createContext();

// Custom hook to use the organization context
export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
};

// Organization Provider component
export const OrganizationProvider = ({ children }) => {
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize organization data
  const initializeOrganization = useCallback(async () => {
    if (initialized) return;

    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem("hubstaff_user") || "{}");

      if (!user.organizationId) {
        console.warn("No organization ID found for user");
        setLoading(false);
        return;
      }

      // Fetch organization data
      await Promise.all([
        fetchOrganizationInfo(),
        fetchOrganizationMembers(),
        fetchOrganizationInvitations(),
        fetchOrganizationStats(),
      ]);

      setInitialized(true);
    } catch (error) {
      console.error("Failed to initialize organization:", error);
      setError("Failed to load organization data");
    } finally {
      setLoading(false);
    }
  }, [initialized]);

  // Fetch organization information
  const fetchOrganizationInfo = useCallback(async () => {
    try {
      const response = await organizationAPI.getOrganization();
      setOrganization(response.data);
      setSettings(response.data.settings || {});
    } catch (error) {
      console.error("Failed to fetch organization info:", error);
      throw error;
    }
  }, []);

  // Fetch organization members
  const fetchOrganizationMembers = useCallback(async () => {
    try {
      const response = await organizationAPI.getMembers();
      setMembers(response.data.users || []);
    } catch (error) {
      console.error("Failed to fetch organization members:", error);
      // Don't throw error for members as it's not critical for basic functionality
      setMembers([]);
    }
  }, []);

  // Fetch organization invitations
  const fetchOrganizationInvitations = useCallback(async () => {
    try {
      const response = await organizationAPI.getInvitations();
      setInvitations(response.data.invitations || []);
    } catch (error) {
      console.error("Failed to fetch organization invitations:", error);
      // Don't throw error for invitations as it's not critical for basic functionality
      setInvitations([]);
    }
  }, []);

  // Fetch organization statistics
  const fetchOrganizationStats = useCallback(async () => {
    try {
      const response = await organizationAPI.getStats();
      setStats(response.data || {});
    } catch (error) {
      console.error("Failed to fetch organization stats:", error);
      // Don't throw error for stats as it's not critical for basic functionality
      setStats({});
    }
  }, []);

  // Refresh all organization data
  const refreshOrganization = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchOrganizationInfo(),
        fetchOrganizationMembers(),
        fetchOrganizationInvitations(),
        fetchOrganizationStats(),
      ]);
    } catch (error) {
      console.error("Failed to refresh organization:", error);
      setError("Failed to refresh organization data");
    } finally {
      setLoading(false);
    }
  }, [
    fetchOrganizationInfo,
    fetchOrganizationMembers,
    fetchOrganizationInvitations,
    fetchOrganizationStats,
  ]);

  // Update organization settings
  const updateOrganizationSettings = useCallback(async (newSettings) => {
    try {
      const response = await organizationAPI.updateSettings(newSettings);
      setSettings(response.data.settings);
      setOrganization((prev) => ({
        ...prev,
        settings: response.data.settings,
      }));
      return response.data;
    } catch (error) {
      console.error("Failed to update organization settings:", error);
      throw error;
    }
  }, []);

  // Send invitation
  const sendInvitation = useCallback(async (invitationData) => {
    try {
      const response = await organizationAPI.sendInvitation(invitationData);

      // Add the new invitation to the list
      setInvitations((prev) => [response.data.invitation, ...prev]);

      // Update stats
      setStats((prev) => ({
        ...prev,
        pendingInvitations: (prev.pendingInvitations || 0) + 1,
      }));

      return response.data;
    } catch (error) {
      console.error("Failed to send invitation:", error);
      throw error;
    }
  }, []);

  // Cancel invitation
  const cancelInvitation = useCallback(async (invitationId) => {
    try {
      await organizationAPI.cancelInvitation(invitationId);

      // Remove the invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

      // Update stats
      setStats((prev) => ({
        ...prev,
        pendingInvitations: Math.max((prev.pendingInvitations || 1) - 1, 0),
      }));
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
      throw error;
    }
  }, []);

  // Resend invitation
  const resendInvitation = useCallback(async (invitationId) => {
    try {
      const response = await organizationAPI.resendInvitation(invitationId);

      // Update the invitation in the list
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId
            ? { ...inv, ...response.data.invitation }
            : inv
        )
      );

      return response.data;
    } catch (error) {
      console.error("Failed to resend invitation:", error);
      throw error;
    }
  }, []);

  // Add member (when invitation is accepted)
  const addMember = useCallback((newMember) => {
    setMembers((prev) => [...prev, newMember]);
    setStats((prev) => ({
      ...prev,
      totalUsers: (prev.totalUsers || 0) + 1,
      activeUsers: (prev.activeUsers || 0) + 1,
    }));
  }, []);

  // Update member
  const updateMember = useCallback(async (memberId, updateData) => {
    try {
      const response = await organizationAPI.updateMember(memberId, updateData);

      // Update the member in the list
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, ...response.data.user } : member
        )
      );

      return response.data;
    } catch (error) {
      console.error("Failed to update member:", error);
      throw error;
    }
  }, []);

  // Remove member
  const removeMember = useCallback(async (memberId) => {
    try {
      await organizationAPI.removeMember(memberId);

      // Remove the member from the list
      setMembers((prev) => prev.filter((member) => member.id !== memberId));

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalUsers: Math.max((prev.totalUsers || 1) - 1, 0),
        activeUsers: Math.max((prev.activeUsers || 1) - 1, 0),
      }));
    } catch (error) {
      console.error("Failed to remove member:", error);
      throw error;
    }
  }, []);

  // Get member by ID
  const getMember = useCallback(
    (memberId) => {
      return members.find((member) => member.id === memberId);
    },
    [members]
  );

  // Get members by role
  const getMembersByRole = useCallback(
    (role) => {
      return members.filter((member) => member.role === role);
    },
    [members]
  );

  // Get pending invitations
  const getPendingInvitations = useCallback(() => {
    return invitations.filter((invitation) => invitation.status === "pending");
  }, [invitations]);

  // Check if user can perform action based on role
  const canPerformAction = useCallback((action) => {
    const user = JSON.parse(localStorage.getItem("hubstaff_user") || "{}");

    switch (action) {
      case "invite_users":
        return ["admin", "manager"].includes(user.role);
      case "manage_settings":
        return user.role === "admin";
      case "manage_members":
        return ["admin", "manager"].includes(user.role);
      case "view_analytics":
        return ["admin", "manager"].includes(user.role);
      case "manage_billing":
        return user.role === "admin";
      default:
        return false;
    }
  }, []);

  // Check if organization has reached limits
  const hasReachedLimit = useCallback(
    (limitType) => {
      if (!organization) return false;

      switch (limitType) {
        case "users":
          return stats.totalUsers >= organization.billing?.maxUsers;
        case "projects":
          return stats.totalProjects >= organization.billing?.maxProjects;
        default:
          return false;
      }
    },
    [organization, stats]
  );

  // Get organization plan features
  const getPlanFeatures = useCallback(() => {
    if (!organization) return {};
    return organization.billing?.features || {};
  }, [organization]);

  // Initialize on mount
  useEffect(() => {
    const user = localStorage.getItem("hubstaff_user");
    if (user && !initialized) {
      initializeOrganization();
    }
  }, [initializeOrganization, initialized]);

  const value = {
    // State
    organization,
    members,
    invitations,
    settings,
    stats,
    loading,
    error,
    initialized,

    // Actions
    initializeOrganization,
    refreshOrganization,
    updateOrganizationSettings,

    // Invitation management
    sendInvitation,
    cancelInvitation,
    resendInvitation,
    getPendingInvitations,

    // Member management
    addMember,
    updateMember,
    removeMember,
    getMember,
    getMembersByRole,

    // Utilities
    canPerformAction,
    hasReachedLimit,
    getPlanFeatures,

    // Data fetchers
    fetchOrganizationInfo,
    fetchOrganizationMembers,
    fetchOrganizationInvitations,
    fetchOrganizationStats,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
