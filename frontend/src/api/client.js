// frontend/src/api/client.js - FIXED: Proper token handling and error management
import axios from "axios";
import globalThrottle from "../utils/globalThrottle";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor with throttling
apiClient.interceptors.request.use(
  (config) => {
    const endpoint = config.url;

    // THROTTLE CHECK - This stops the API spam
    if (!globalThrottle.canFetch(endpoint)) {
      console.log(`🚫 Axios request to ${endpoint} blocked by throttle`);
      const error = new Error("Request throttled");
      error.isThrottled = true;
      return Promise.reject(error);
    }

    globalThrottle.startFetch(endpoint);

    // FIXED: Better token retrieval
    const token =
      localStorage.getItem("hubstaff_token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token");

    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with throttling
apiClient.interceptors.response.use(
  (response) => {
    globalThrottle.endFetch(response.config.url);
    return response;
  },
  (error) => {
    if (error.config?.url) {
      globalThrottle.endFetch(error.config.url);
    }

    // Handle throttled requests gracefully
    if (error.isThrottled) {
      console.warn("Request was throttled");
      return Promise.resolve({
        data: [], // Return empty data instead of crashing
        status: 429,
        statusText: "Throttled",
      });
    }

    if (error.response?.status === 401) {
      console.warn("Authentication failed - clearing tokens");
      localStorage.removeItem("hubstaff_token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem("hubstaff_user");

      // Only redirect if not already on login/signup page
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/signup") &&
        !window.location.pathname.includes("/accept-invitation")
      ) {
        window.location.href = "/login";
      }
    }

    if (error.response?.status === 429) {
      console.warn("Rate limited by server");
      globalThrottle.blockEndpoint(error.config.url, 60000); // Block for 1 minute
      return Promise.resolve({
        data: [], // Return empty data instead of crashing
        status: 429,
        statusText: "Rate Limited",
      });
    }

    return Promise.reject(error);
  }
);

// Enhanced Auth API with organization support
export const authAPI = {
  // FIXED: Proper login implementation
  login: async (credentials) => {
    try {
      const response = await apiClient.post("/auth/login", credentials);

      // Store token immediately
      if (response.data.token) {
        localStorage.setItem("hubstaff_token", response.data.token);
        localStorage.setItem("authToken", response.data.token);
        console.log("✅ Token stored successfully");
      }

      return response;
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    }
  },

  // FIXED: Updated register for admin-only registration with organization creation
  register: async (userData) => {
    try {
      const response = await apiClient.post("/auth/register", userData);

      // Store token immediately
      if (response.data.token) {
        localStorage.setItem("hubstaff_token", response.data.token);
        localStorage.setItem("authToken", response.data.token);
        console.log("✅ Registration token stored successfully");
      }

      return response;
    } catch (error) {
      console.error("Register API error:", error);
      throw error;
    }
  },

  logout: () => apiClient.post("/auth/logout"),

  refreshToken: (refreshToken) =>
    apiClient.post("/auth/refresh", { refresh_token: refreshToken }),

  getCurrentUser: () => apiClient.get("/auth/me"),

  // NEW: Accept invitation
  acceptInvitation: async (token, userData) => {
    try {
      const response = await apiClient.post(
        `/auth/accept-invitation/${token}`,
        userData
      );

      // Store token immediately
      if (response.data.token) {
        localStorage.setItem("hubstaff_token", response.data.token);
        localStorage.setItem("authToken", response.data.token);
        console.log("✅ Invitation acceptance token stored successfully");
      }

      return response;
    } catch (error) {
      console.error("Accept invitation API error:", error);
      throw error;
    }
  },

  // NEW: Verify invitation token
  verifyInvitation: (token) =>
    apiClient.get(`/auth/verify-invitation/${token}`),

  // NEW: Check email availability
  checkEmail: (email) => apiClient.post("/auth/check-email", { email }),

  // NEW: Check organization name availability
  checkOrganization: (name) =>
    apiClient.post("/auth/check-organization", { name }),
};

// Enhanced Users API - organization-scoped
export const usersAPI = {
  getUsers: async (params = {}) => {
    try {
      const response = await apiClient.get("/users", { params });
      return response;
    } catch (error) {
      console.warn("Failed to fetch users:", error.message);
      return { data: { users: [], pagination: {} } }; // Return empty data on error
    }
  },

  getUser: (userId) => apiClient.get(`/users/${userId}`),

  updateUser: (userId, userData) => apiClient.put(`/users/${userId}`, userData),

  updateCurrentUser: (userData) => apiClient.put("/users/me", userData),

  deleteUser: (userId) => apiClient.delete(`/users/${userId}`),

  getTeamStats: async () => {
    try {
      const response = await apiClient.get("/users/team/stats");
      return response;
    } catch (error) {
      console.warn("Failed to fetch team stats:", error.message);
      return { data: {} };
    }
  },

  // NEW: Change password
  changePassword: (currentPassword, newPassword) =>
    apiClient.put("/users/me/password", { currentPassword, newPassword }),

  // NEW: Get organization members (same as getUsers but more explicit)
  getOrganizationMembers: async (params = {}) => {
    try {
      const response = await apiClient.get("/users", { params });
      return response;
    } catch (error) {
      console.warn("Failed to fetch organization members:", error.message);
      return { data: { users: [], pagination: {} } };
    }
  },
};

// Enhanced Projects API - organization-scoped
export const projectsAPI = {
  getProjects: async (params = {}) => {
    try {
      const response = await apiClient.get("/projects", { params });
      return response;
    } catch (error) {
      console.warn("Failed to fetch projects:", error.message);
      return { data: { projects: [], pagination: {} } }; // Return empty data on error
    }
  },

  getProject: (projectId) => apiClient.get(`/projects/${projectId}`),

  createProject: (projectData) => apiClient.post("/projects", projectData),

  updateProject: (projectId, projectData) =>
    apiClient.put(`/projects/${projectId}`, projectData),

  deleteProject: (projectId) => apiClient.delete(`/projects/${projectId}`),

  getProjectTasks: async (projectId) => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/tasks`);
      return response;
    } catch (error) {
      console.warn(
        `Failed to fetch tasks for project ${projectId}:`,
        error.message
      );
      return { data: { tasks: [], pagination: {} } }; // Return empty data on error
    }
  },

  createTask: (projectId, taskData) =>
    apiClient.post(`/projects/${projectId}/tasks`, taskData),

  getProjectStats: async () => {
    try {
      const response = await apiClient.get("/projects/stats/dashboard");
      return response;
    } catch (error) {
      console.warn("Failed to fetch project stats:", error.message);
      return { data: {} };
    }
  },

  // NEW: Add member to project
  addProjectMember: (projectId, userId) =>
    apiClient.post(`/projects/${projectId}/members`, { userId }),

  // NEW: Remove member from project
  removeProjectMember: (projectId, userId) =>
    apiClient.delete(`/projects/${projectId}/members/${userId}`),
};

// Enhanced Time Tracking API - organization-scoped
export const timeTrackingAPI = {
  startTracking: (data) => apiClient.post("/time-tracking/start", data),

  stopTracking: (entryId) => apiClient.post(`/time-tracking/stop/${entryId}`),

  getActiveEntry: () => apiClient.get("/time-tracking/active"),

  getTimeEntries: (params = {}) =>
    apiClient.get("/time-tracking/entries", { params }),

  createManualEntry: (data) => apiClient.post("/time-tracking/manual", data),

  updateTimeEntry: (entryId, data) =>
    apiClient.put(`/time-tracking/entries/${entryId}`, data),

  deleteTimeEntry: (entryId) =>
    apiClient.delete(`/time-tracking/entries/${entryId}`),

  recordActivity: (data) => apiClient.post("/time-tracking/activity", data),

  uploadScreenshot: (entryId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post(
      `/time-tracking/screenshot?time_entry_id=${entryId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },

  getDailyReport: (date) =>
    apiClient.get("/time-tracking/reports/daily", { params: { date } }),

  getTeamTimeReport: (startDate, endDate) =>
    apiClient.get("/time-tracking/reports/team", {
      params: { start_date: startDate, end_date: endDate },
    }),

  // NEW: Approve time entry
  approveTimeEntry: (entryId) =>
    apiClient.post(`/time-tracking/entries/${entryId}/approve`),

  // NEW: Get entries needing approval
  getEntriesNeedingApproval: () =>
    apiClient.get("/time-tracking/entries/pending-approval"),
};

// Enhanced Analytics API - organization-scoped
export const analyticsAPI = {
  getDashboardAnalytics: async () => {
    try {
      const response = await apiClient.get("/analytics/dashboard");
      return response;
    } catch (error) {
      console.warn("Failed to fetch dashboard analytics:", error.message);
      return { data: { user_stats: { total_hours: 0, avg_activity: 0 } } }; // Return default data
    }
  },

  getTeamAnalytics: (startDate, endDate) =>
    apiClient.get("/analytics/team", {
      params: { start_date: startDate, end_date: endDate },
    }),

  getProductivityAnalytics: (period = "week") =>
    apiClient.get("/analytics/productivity", {
      params: { period },
    }),

  generateCustomReport: (params) =>
    apiClient.get("/analytics/reports/custom", { params }),

  // NEW: Get organization analytics
  getOrganizationAnalytics: (params = {}) =>
    apiClient.get("/analytics/organization", { params }),

  // NEW: Export analytics data
  exportAnalytics: (format, params = {}) =>
    apiClient.get("/analytics/export", {
      params: { format, ...params },
      responseType: "blob",
    }),
};

// Enhanced Integrations API - organization-scoped
export const integrationsAPI = {
  getIntegrations: () => apiClient.get("/integrations"),

  connectSlack: (webhookUrl) =>
    apiClient.post("/integrations/slack/connect", { webhook_url: webhookUrl }),

  connectTrello: (apiKey, token) =>
    apiClient.post("/integrations/trello/connect", { api_key: apiKey, token }),

  connectGitHub: (token) =>
    apiClient.post("/integrations/github/connect", { token }),

  sendSlackNotification: (message, channel) =>
    apiClient.post("/integrations/slack/notify", { message, channel }),

  createTrelloCard: (listId, name, description) =>
    apiClient.post("/integrations/trello/create-card", {
      list_id: listId,
      name,
      description,
    }),

  createGitHubIssue: (repo, title, body, labels) =>
    apiClient.post("/integrations/github/create-issue", {
      repo,
      title,
      body,
      labels,
    }),

  disconnectIntegration: (integrationId) =>
    apiClient.delete(`/integrations/${integrationId}`),

  // NEW: Test integration connection
  testIntegration: (integrationId) =>
    apiClient.post(`/integrations/${integrationId}/test`),
};

// Enhanced Invitations API - organization-scoped
export const invitationsAPI = {
  sendInvitation: (data) => apiClient.post("/invitations", data),

  getInvitations: (params = {}) => apiClient.get("/invitations", { params }),

  getInvitationStats: () => apiClient.get("/invitations/stats"),

  verifyInvitation: (token) => apiClient.get(`/invitations/verify/${token}`),

  cancelInvitation: (invitationId) =>
    apiClient.delete(`/invitations/${invitationId}`),

  // NEW: Resend invitation
  resendInvitation: (invitationId) =>
    apiClient.post(`/invitations/${invitationId}/resend`),

  // NEW: Extend invitation expiry
  extendInvitation: (invitationId, days) =>
    apiClient.patch(`/invitations/${invitationId}/extend`, { days }),

  // NEW: Regenerate invitation link
  regenerateInvitation: (invitationId) =>
    apiClient.post(`/invitations/${invitationId}/regenerate`),

  // NEW: Bulk send invitations
  bulkSendInvitations: (invitations, defaultMessage = "") =>
    apiClient.post("/invitations/bulk", { invitations, defaultMessage }),
};

// NEW: Organization API - organization management
export const organizationAPI = {
  // Get current organization info
  getOrganization: () => apiClient.get("/organizations/current"),

  // Update organization info
  updateOrganization: (data) => apiClient.put("/organizations/current", data),

  // Get organization settings
  getSettings: () => apiClient.get("/organizations/settings"),

  // Update organization settings
  updateSettings: (settings) =>
    apiClient.put("/organizations/settings", settings),

  // Get organization statistics
  getStats: () => apiClient.get("/organizations/stats"),

  // Get organization members (alias to usersAPI.getUsers)
  getMembers: (params = {}) => usersAPI.getUsers(params),

  // Update member role/permissions
  updateMember: (memberId, data) => usersAPI.updateUser(memberId, data),

  // Remove member from organization
  removeMember: (memberId) => usersAPI.deleteUser(memberId),

  // Get organization invitations
  getInvitations: (params = {}) => invitationsAPI.getInvitations(params),

  // Send organization invitation
  sendInvitation: (data) => invitationsAPI.sendInvitation(data),

  // Cancel organization invitation
  cancelInvitation: (invitationId) =>
    invitationsAPI.cancelInvitation(invitationId),

  // Resend organization invitation
  resendInvitation: (invitationId) =>
    invitationsAPI.resendInvitation(invitationId),

  // Get organization billing info
  getBilling: () => apiClient.get("/organizations/billing"),

  // Update billing information
  updateBilling: (billingData) =>
    apiClient.put("/organizations/billing", billingData),

  // Upgrade/downgrade plan
  changePlan: (planId) =>
    apiClient.post("/organizations/billing/change-plan", { planId }),
};

// WebSocket API - organization-scoped
export const websocketAPI = {
  getOnlineUsers: () => apiClient.get("/websocket/online-users"),

  // NEW: Get organization online users
  getOrganizationOnlineUsers: () =>
    apiClient.get("/websocket/organization-online"),

  // NEW: Send organization-wide notification
  sendOrganizationNotification: (message, type = "info") =>
    apiClient.post("/websocket/organization-notify", { message, type }),
};

// NEW: Tasks API - organization-scoped task management
export const tasksAPI = {
  getTasks: (params = {}) => apiClient.get("/tasks", { params }),

  getTask: (taskId) => apiClient.get(`/tasks/${taskId}`),

  createTask: (taskData) => apiClient.post("/tasks", taskData),

  updateTask: (taskId, taskData) => apiClient.put(`/tasks/${taskId}`, taskData),

  deleteTask: (taskId) => apiClient.delete(`/tasks/${taskId}`),

  // Assign task to user
  assignTask: (taskId, userId) =>
    apiClient.post(`/tasks/${taskId}/assign`, { userId }),

  // Update task status
  updateTaskStatus: (taskId, status) =>
    apiClient.patch(`/tasks/${taskId}/status`, { status }),

  // Add comment to task
  addTaskComment: (taskId, comment) =>
    apiClient.post(`/tasks/${taskId}/comments`, { comment }),

  // Get task comments
  getTaskComments: (taskId) => apiClient.get(`/tasks/${taskId}/comments`),

  // Add task watcher
  addTaskWatcher: (taskId, userId) =>
    apiClient.post(`/tasks/${taskId}/watchers`, { userId }),

  // Remove task watcher
  removeTaskWatcher: (taskId, userId) =>
    apiClient.delete(`/tasks/${taskId}/watchers/${userId}`),

  // Get user's tasks
  getUserTasks: (userId, params = {}) =>
    apiClient.get(`/tasks/user/${userId}`, { params }),

  // Get overdue tasks
  getOverdueTasks: () => apiClient.get("/tasks/overdue"),
};

// Export the default axios instance for custom requests
export default apiClient;
