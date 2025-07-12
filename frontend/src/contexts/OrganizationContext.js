// frontend/src/contexts/OrganizationContext.js - OPTIMIZED VERSION
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
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

// Organization Provider component - OPTIMIZED
export const OrganizationProvider = ({ children }) => {
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Debug: Log loading state changes
  useEffect(() => {
    console.log("🔄 OrganizationContext loading state changed:", {
      loading,
      initialized,
      hasOrganization: !!organization,
      membersCount: members.length,
      invitationsCount: invitations.length
    });
  }, [loading, initialized, organization, members.length, invitations.length]);

  // Refs to prevent unnecessary re-renders and API calls
  const lastFetchTime = useRef(0);
  const initializationInProgress = useRef(false);
  const mountedRef = useRef(true);

  // Minimum time between data fetches (5 minutes)
  const FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Check if we should fetch data
  const shouldFetch = useCallback(() => {
    const now = Date.now();
    return now - lastFetchTime.current > FETCH_INTERVAL;
  }, []);

  // Optimized initialization - only fetch when needed
  const initializeOrganization = useCallback(async () => {
    console.log("🔄 OrganizationContext: initializeOrganization called");
    console.log("🔄 Current state:", {
      initialized,
      initializationInProgress: initializationInProgress.current,
      loading,
      hasOrganization: !!organization,
      membersCount: members.length
    });

    // Prevent multiple simultaneous initializations
    if (initialized || initializationInProgress.current) {
      console.log(
        "🚫 Organization initialization skipped - already initialized or in progress"
      );
      return;
    }

    // Check if we have user data
    const user = JSON.parse(localStorage.getItem("hubstaff_user") || "{}");
    console.log("🔄 User data check:", {
      hasUser: !!user,
      organizationId: user.organizationId,
      userRole: user.role,
      userName: user.name
    });
    
    if (!user.organizationId) {
      console.warn("🚫 No organization ID found for user - cannot initialize");
      setLoading(false);
      return;
    }

    // Check if we should fetch (rate limiting)
    if (!shouldFetch()) {
      console.log("🚫 Organization data fetch skipped - too recent");
      console.log("🔄 Time since last fetch:", Date.now() - lastFetchTime.current, "ms");
      setLoading(false);
      return;
    }

    try {
      console.log("🚀 Starting organization initialization...");
      initializationInProgress.current = true;
      setLoading(true);
      setError(null);

      // Fetch only essential data initially
      console.log("🔄 Fetching organization data and stats...");
      const [orgResponse, statsResponse] = await Promise.allSettled([
        organizationAPI.getOrganization(),
        organizationAPI.getStats(),
      ]);

      console.log("📊 API responses received:", {
        orgStatus: orgResponse.status,
        statsStatus: statsResponse.status,
        orgData: orgResponse.status === 'fulfilled' ? !!orgResponse.value?.data : null,
        statsData: statsResponse.status === 'fulfilled' ? !!statsResponse.value?.data : null,
        orgResponseData: orgResponse.status === 'fulfilled' ? orgResponse.value?.data : null,
        statsResponseData: statsResponse.status === 'fulfilled' ? statsResponse.value?.data : null
      });

      // Process organization data
      console.log("🔍 Organization data check:", {
        orgResponseStatus: orgResponse.status,
        hasOrgResponseValue: !!orgResponse.value,
        hasOrgResponseData: !!orgResponse.value?.data,
        orgResponseDataType: typeof orgResponse.value?.data,
        orgResponseDataLength: Array.isArray(orgResponse.value?.data) ? orgResponse.value.data.length : 'not array',
        mountedRefCurrent: mountedRef.current,
        orgResponseValue: orgResponse.value,
        willSetOrganization: orgResponse.status === "fulfilled" && orgResponse.value?.data && mountedRef.current
      });

      // Handle the case where auth/me returns empty array or is rate limited
      if (
        orgResponse.status === "fulfilled" &&
        orgResponse.value?.data &&
        !Array.isArray(orgResponse.value.data) &&
        Object.keys(orgResponse.value.data).length > 0
      ) {
        console.log("✅ Setting organization data:", {
          orgId: orgResponse.value.data.id,
          orgName: orgResponse.value.data.name,
          hasSettings: !!orgResponse.value.data.settings
        });
        setOrganization(orgResponse.value.data);
        setSettings(orgResponse.value.data.settings || {});
      } else if (orgResponse.status === "rejected") {
        console.error("❌ Failed to fetch organization info:", orgResponse.reason);
      } else {
        console.log("⚠️ Organization data not set - creating fallback organization");
        // Create a fallback organization from user data
        const user = JSON.parse(localStorage.getItem("hubstaff_user") || "{}");
        const fallbackOrg = {
          id: user.organizationId || user.organization_id || "default-org",
          name: user.organizationName || user.organization_name || user.companyName || "Default Organization",
          settings: {}
        };
        console.log("🔧 Setting fallback organization:", fallbackOrg);
        console.log("🔧 User data for fallback:", {
          organizationId: user.organizationId,
          organization_id: user.organization_id,
          organizationName: user.organizationName,
          organization_name: user.organization_name,
          companyName: user.companyName
        });
        setOrganization(fallbackOrg);
        setSettings({});
      }

      // Process stats data
      if (
        statsResponse.status === "fulfilled" &&
        statsResponse.value.data &&
        mountedRef.current
      ) {
        setStats(statsResponse.value.data);
      } else if (statsResponse.status === "rejected") {
        console.error(
          "Failed to fetch organization stats:",
          statsResponse.reason
        );
      }

      // Fetch members and invitations immediately after organization is set
      console.log("🔄 Calling fetchMembersAndInvitations immediately...");
      // Force fetch regardless of mount status since we need the data
      setTimeout(() => {
        console.log("🔄 Timeout reached - calling fetchMembersAndInvitations");
        fetchMembersAndInvitations();
      }, 500);

      lastFetchTime.current = Date.now();
      setInitialized(true);
      console.log("✅ Organization initialization completed successfully");
      console.log("🔄 Final state check:", {
        hasOrganization: !!organization,
        loading,
        initialized: true
      });
    } catch (error) {
      console.error("❌ Failed to initialize organization:", error);
      if (mountedRef.current) {
        setError("Failed to load organization data");
      }
    } finally {
      initializationInProgress.current = false;
      console.log("🔄 Setting loading to false (forced)");
      setLoading(false);
    }
  }, [initialized, shouldFetch]);

  // Separate function to fetch members and invitations (non-critical data)
  const fetchMembersAndInvitations = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("hubstaff_user") || "{}");
      
      // Only admins and managers can fetch members and invitations
      if (user.role !== "admin" && user.role !== "manager") {
        console.log("👤 Regular user - skipping members and invitations fetch");
        return;
      }
      
      console.log("🔄 Fetching members and invitations...");
      const [membersResponse, invitationsResponse] = await Promise.allSettled([
        organizationAPI.getMembers(),
        organizationAPI.getInvitations(),
      ]);

      console.log("👥 Members response:", {
        status: membersResponse.status,
        hasData: membersResponse.status === 'fulfilled' ? !!membersResponse.value?.data : false,
        data: membersResponse.status === 'fulfilled' ? membersResponse.value?.data : null
      });

      console.log("📧 Invitations response:", {
        status: invitationsResponse.status,
        hasData: invitationsResponse.status === 'fulfilled' ? !!invitationsResponse.value?.data : false,
        data: invitationsResponse.status === 'fulfilled' ? invitationsResponse.value?.data : null
      });

      if (
        membersResponse.status === "fulfilled" &&
        membersResponse.value.data &&
        mountedRef.current
      ) {
        const members = membersResponse.value.data.users || membersResponse.value.data || [];
        console.log("✅ Setting members:", members.length, "members");
        setMembers(members);
      } else {
        console.log("⚠️ No members data to set");
      }

      if (
        invitationsResponse.status === "fulfilled" &&
        invitationsResponse.value.data &&
        mountedRef.current
      ) {
        const invitations = invitationsResponse.value.data.invitations || invitationsResponse.value.data || [];
        console.log("✅ Setting invitations:", invitations.length, "invitations");
        setInvitations(invitations);
      } else {
        console.log("⚠️ No invitations data to set");
      }
    } catch (error) {
      console.error("❌ Failed to fetch members and invitations:", error);
      // Don't set error state for non-critical data
    }
  }, []);

  // Optimized refresh function - only refresh when needed
  const refreshOrganization = useCallback(async () => {
    if (!shouldFetch()) {
      console.log("Organization refresh skipped - too recent");
      return;
    }

    try {
      setLoading(true);
      await initializeOrganization();
    } catch (error) {
      console.error("Failed to refresh organization:", error);
      if (mountedRef.current) {
        setError("Failed to refresh organization data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [initializeOrganization, shouldFetch]);

  // Optimized settings update
  const updateOrganizationSettings = useCallback(async (newSettings) => {
    try {
      const response = await organizationAPI.updateSettings(newSettings);
      if (mountedRef.current) {
        setSettings(response.data.settings);
        setOrganization((prev) => ({
          ...prev,
          settings: response.data.settings,
        }));
      }
      return response.data;
    } catch (error) {
      console.error("Failed to update organization settings:", error);
      throw error;
    }
  }, []);

  // Optimized invitation management
  const sendInvitation = useCallback(async (invitationData) => {
    try {
      const response = await organizationAPI.sendInvitation(invitationData);

      if (mountedRef.current) {
        // Add the new invitation to the list
        setInvitations((prev) => [response.data.invitation, ...prev]);

        // Update stats optimistically
        setStats((prev) => ({
          ...prev,
          pendingInvitations: (prev.pendingInvitations || 0) + 1,
        }));
      }

      return response.data;
    } catch (error) {
      console.error("Failed to send invitation:", error);
      throw error;
    }
  }, []);

  // Optimized invitation cancellation
  const cancelInvitation = useCallback(async (invitationId) => {
    try {
      await organizationAPI.cancelInvitation(invitationId);

      if (mountedRef.current) {
        // Remove the invitation from the list
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

        // Update stats optimistically
        setStats((prev) => ({
          ...prev,
          pendingInvitations: Math.max((prev.pendingInvitations || 1) - 1, 0),
        }));
      }
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
      throw error;
    }
  }, []);

  // Optimized invitation resend
  const resendInvitation = useCallback(async (invitationId) => {
    try {
      const response = await organizationAPI.resendInvitation(invitationId);

      if (mountedRef.current) {
        // Update the invitation in the list
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === invitationId
              ? { ...inv, ...response.data.invitation }
              : inv
          )
        );
      }

      return response.data;
    } catch (error) {
      console.error("Failed to resend invitation:", error);
      throw error;
    }
  }, []);

  // Optimized member management
  const addMember = useCallback((newMember) => {
    if (mountedRef.current) {
      setMembers((prev) => [...prev, newMember]);
      setStats((prev) => ({
        ...prev,
        totalUsers: (prev.totalUsers || 0) + 1,
        activeUsers: (prev.activeUsers || 0) + 1,
      }));
    }
  }, []);

  const updateMember = useCallback(async (memberId, updateData) => {
    try {
      const response = await organizationAPI.updateMember(memberId, updateData);

      if (mountedRef.current) {
        // Update the member in the list
        setMembers((prev) =>
          prev.map((member) =>
            member.id === memberId
              ? { ...member, ...response.data.user }
              : member
          )
        );
      }

      return response.data;
    } catch (error) {
      console.error("Failed to update member:", error);
      throw error;
    }
  }, []);

  const removeMember = useCallback(async (memberId) => {
    try {
      await organizationAPI.removeMember(memberId);

      if (mountedRef.current) {
        // Remove the member from the list
        setMembers((prev) => prev.filter((member) => member.id !== memberId));

        // Update stats optimistically
        setStats((prev) => ({
          ...prev,
          totalUsers: Math.max((prev.totalUsers || 1) - 1, 0),
          activeUsers: Math.max((prev.activeUsers || 1) - 1, 0),
        }));
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
      throw error;
    }
  }, []);

  // Memoized utility functions
  const getMember = useCallback(
    (memberId) => {
      return members.find((member) => member.id === memberId);
    },
    [members]
  );

  const getMembersByRole = useCallback(
    (role) => {
      return members.filter((member) => member.role === role);
    },
    [members]
  );

  const getPendingInvitations = useCallback(() => {
    return invitations.filter((invitation) => invitation.status === "pending");
  }, [invitations]);

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

  const getPlanFeatures = useCallback(() => {
    if (!organization) return {};
    return organization.billing?.features || {};
  }, [organization]);

  // Memoized value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
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
    }),
    [
      organization,
      members,
      invitations,
      settings,
      stats,
      loading,
      error,
      initialized,
      initializeOrganization,
      refreshOrganization,
      updateOrganizationSettings,
      sendInvitation,
      cancelInvitation,
      resendInvitation,
      getPendingInvitations,
      addMember,
      updateMember,
      removeMember,
      getMember,
      getMembersByRole,
      canPerformAction,
      hasReachedLimit,
      getPlanFeatures,
    ]
  );

  // Initialize on mount - only once
  useEffect(() => {
    console.log("🔄 OrganizationContext: useEffect initialization triggered");
    const user = localStorage.getItem("hubstaff_user");
    console.log("🔄 Initialization check:", {
      hasUser: !!user,
      initialized,
      initializationInProgress: initializationInProgress.current,
      shouldInitialize: user && !initialized && !initializationInProgress.current
    });
    
    if (user && !initialized && !initializationInProgress.current) {
      console.log("🚀 Calling initializeOrganization...");
      initializeOrganization();
    } else {
      console.log("🚫 Skipping initialization");
    }
  }, []); // Empty dependency array - only run once

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
};
