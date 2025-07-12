// frontend/src/api/client.js - OPTIMIZED VERSION
import axios from "axios";
import globalThrottle from "../utils/globalThrottle";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with optimized settings
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // Reduced timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor with enhanced throttling and caching
apiClient.interceptors.request.use(
  (config) => {
    const endpoint = config.url;

    // Bypass throttle if force is true
    if (config.force) {
      // Optionally log: console.log(`Bypassing throttle for ${endpoint} due to force param`);
    } else if (!globalThrottle.canFetch(endpoint)) {
      console.log(`🚫 Axios request to ${endpoint} blocked by throttle`);
      const error = new Error("Request throttled");
      error.isThrottled = true;
      error.cachedData = globalThrottle.getCachedData(endpoint);
      return Promise.reject(error);
    }

    if (!config.force) {
      globalThrottle.startFetch(endpoint);
    }

    // Enhanced token retrieval
    if (!config.headers) config.headers = {};
    const token =
      localStorage.getItem("hubstaff_token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token");

    console.log(
      `🔐 Token check for ${endpoint}:`,
      token ? "Present" : "Missing"
    );

    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(`⚠️ No valid token found for ${endpoint}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced caching
apiClient.interceptors.response.use(
  (response) => {
    // Don't process cached responses
    if (response.fromCache) {
      return response;
    }

    const endpoint = response.config.url;
    globalThrottle.endFetch(endpoint, response.data);

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
        data: [],
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
      globalThrottle.blockEndpoint(error.config.url, 60000);
      return Promise.resolve({
        data: [],
        status: 429,
        statusText: "Rate Limited",
      });
    }

    return Promise.reject(error);
  }
);

// Create a smart request wrapper that handles caching and batching
const smartRequest = async (method, url, data = null, config = {}) => {
  const force = config.force || false;
  try {
    // Ensure method is a valid string
    const httpMethod =
      typeof method === "string" ? method.toLowerCase() : "get";

    console.log(`🚀 smartRequest: ${httpMethod.toUpperCase()} ${url}`, {
      data,
      config,
    });

    // Bypass throttle if force is true
    if (!force && !globalThrottle.canFetch(url)) {
      console.log(`🚫 Axios request to ${url} blocked by throttle`);
      const error = new Error("Request throttled");
      error.isThrottled = true;
      error.cachedData = globalThrottle.getCachedData(url);
      throw error;
    }
    if (!force) {
      globalThrottle.startFetch(url);
    }

    // Enhanced token retrieval
    if (!config.headers) config.headers = {};
    const token =
      localStorage.getItem("hubstaff_token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token");

    console.log(`🔐 Token check for ${url}:`, token ? "Present" : "Missing");

    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(`⚠️ No valid token found for ${url}`);
    }

    const response = await apiClient.request({
      method: httpMethod,
      url,
      data,
      ...config,
    });

    console.log(`✅ smartRequest response for ${url}:`, response);

    // Ensure response has proper structure
    if (response && typeof response === "object") {
      return response;
    }

    // Return fallback structure if response is malformed
    console.warn(`⚠️ Malformed response for ${url}:`, response);
    return {
      data: response || {},
      status: 200,
      statusText: "OK",
    };
  } catch (error) {
    console.error(`❌ smartRequest error for ${url}:`, error);

    if (error.isThrottled) {
      // Try to return cached data for throttled requests
      const cachedData = error.cachedData || globalThrottle.getCachedData(url);
      if (cachedData && typeof cachedData === "object") {
        console.log(`📦 Returning cached data for ${url}`);
        return {
          data: cachedData,
          status: 200,
          statusText: "OK (Cached)",
          fromCache: true,
        };
      }

      // Return safe fallback for throttled requests without cache
      console.log(`⚠️ No cache available for throttled request ${url}`);
      return {
        data: {},
        status: 429,
        statusText: "Throttled",
        fromCache: false,
      };
    }
    throw error;
  }
};

// Enhanced Auth API with better error handling
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await smartRequest("post", "/auth/login", credentials);
      if (response.data.token) {
        localStorage.setItem("hubstaff_token", response.data.token);
        localStorage.setItem("authToken", response.data.token);
        // Clear cache on login
        globalThrottle.clearAllCache();
        console.log("✅ Token stored successfully");
      }
      return response;
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await smartRequest("post", "/auth/register", userData);
      if (response.data.token) {
        localStorage.setItem("hubstaff_token", response.data.token);
        localStorage.setItem("authToken", response.data.token);
        // Clear cache on register
        globalThrottle.clearAllCache();
        console.log("✅ Registration token stored successfully");
      }
      return response;
    } catch (error) {
      console.error("Register API error:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await smartRequest("post", "/auth/logout");
      // Clear cache on logout
      globalThrottle.clearAllCache();
    } catch (error) {
      console.error("Logout error:", error);
    }
  },

  getCurrentUser: () => smartRequest("get", "/auth/me"),
  acceptInvitation: async (token, userData) => {
    try {
      const response = await smartRequest(
        "post",
        `/auth/accept-invitation/${token}`,
        userData
      );
      if (response.data.token) {
        localStorage.setItem("hubstaff_token", response.data.token);
        localStorage.setItem("authToken", response.data.token);
        globalThrottle.clearAllCache();
        console.log("✅ Invitation acceptance token stored successfully");
      }
      return response;
    } catch (error) {
      console.error("Accept invitation API error:", error);
      throw error;
    }
  },

  verifyInvitation: (token) =>
    smartRequest("get", `/auth/verify-invitation/${token}`),
  checkEmail: (email) => smartRequest("post", "/auth/check-email", { email }),
  checkOrganization: (name) =>
    smartRequest("post", "/auth/check-organization", { name }),
};

// Enhanced Users API with intelligent caching
export const usersAPI = {
  getUsers: async (params = {}) => {
    try {
      const response = await smartRequest("get", "/users", null, { params });
      return response;
    } catch (error) {
      console.warn("Failed to fetch users:", error.message);
      return { data: { users: [], pagination: {} } };
    }
  },

  getUser: (userId) => smartRequest("get", `/users/${userId}`),
  updateUser: (userId, userData) => {
    // Clear cache when updating
    globalThrottle.clearCache("/users");
    return smartRequest("put", `/users/${userId}`, userData);
  },
  updateCurrentUser: (userData) => {
    globalThrottle.clearCache("/users/me");
    return smartRequest("put", "/users/me", userData);
  },
  deleteUser: (userId) => {
    globalThrottle.clearCache("/users");
    return smartRequest("delete", `/users/${userId}`);
  },

  getTeamStats: async () => {
    try {
      const response = await smartRequest("get", "/users/team/stats");
      return response;
    } catch (error) {
      console.warn("Failed to fetch team stats:", error.message);
      return { data: {} };
    }
  },

  changePassword: (currentPassword, newPassword) =>
    smartRequest("put", "/users/me/password", { currentPassword, newPassword }),

  getOrganizationMembers: async (params = {}) => {
    try {
      const response = await smartRequest("get", "/users", null, { params });
      return response;
    } catch (error) {
      console.warn("Failed to fetch organization members:", error.message);
      return { data: { users: [], pagination: {} } };
    }
  },
};

// Enhanced Projects API with optimized caching
export const projectsAPI = {
  getProjects: async (params = {}, force = false) => {
    try {
      console.log("🔍 Getting projects with params:", params);
      const response = await smartRequest("get", "/projects", null, {
        params,
        force,
      });
      console.log("📦 Projects response:", response);
      console.log("📦 Projects response data:", response.data);
      console.log(
        "📦 Projects array:",
        response.data?.projects || response.data
      );
      console.log(
        "📦 Projects count:",
        Array.isArray(response.data?.projects)
          ? response.data.projects.length
          : Array.isArray(response.data)
          ? response.data.length
          : "not array"
      );

      // Ensure response has proper structure
      if (!response || !response.data) {
        console.warn("⚠️ Projects response missing data structure");
        return { data: { projects: [], pagination: {} } };
      }
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch projects:", error);
      return { data: { projects: [], pagination: {} } };
    }
  },

  getProject: (projectId) => smartRequest("get", `/projects/${projectId}`),

  createProject: async (projectData) => {
    try {
      // Clear projects cache when creating
      globalThrottle.clearCache("/projects");
      console.log("🚀 Creating project with data:", projectData);

      const response = await smartRequest("post", "/projects", projectData);
      console.log("✅ Project creation response:", response);

      // Clear cache again after creation to ensure fresh data on next fetch
      globalThrottle.clearCache("/projects");

      return response;
    } catch (error) {
      console.error("❌ Project creation failed:", error);
      throw error;
    }
  },

  updateProject: (projectId, projectData) => {
    // Clear related caches
    globalThrottle.clearCache("/projects");
    globalThrottle.clearCache(`/projects/${projectId}`);
    return smartRequest("put", `/projects/${projectId}`, projectData);
  },

  deleteProject: (projectId) => {
    // Clear related caches
    globalThrottle.clearCache("/projects");
    globalThrottle.clearCache(`/projects/${projectId}`);
    return smartRequest("delete", `/projects/${projectId}`);
  },

  getProjectStats: async () => {
    try {
      const response = await smartRequest("get", "/projects/stats/dashboard");
      return response;
    } catch (error) {
      console.warn("Failed to fetch project stats:", error.message);
      return { data: {} };
    }
  },

  // Enhanced Task Management with smart caching
  getProjectTasks: async (projectId, params = {}) => {
    try {
      const response = await smartRequest(
        "get",
        `/projects/${projectId}/tasks`,
        null,
        { params }
      );
      return response;
    } catch (error) {
      console.warn(
        `Failed to fetch tasks for project ${projectId}:`,
        error.message
      );
      return { data: { tasks: [], pagination: {} } };
    }
  },

  createTask: async (projectId, taskData) => {
    try {
      // Clear related caches
      globalThrottle.clearCache(`/projects/${projectId}/tasks`);
      globalThrottle.clearCache("/projects/stats/dashboard");

      const response = await smartRequest(
        "post",
        `/projects/${projectId}/tasks`,
        taskData
      );
      return response;
    } catch (error) {
      console.error("Failed to create task:", error);
      throw error;
    }
  },

  updateTask: async (projectId, taskId, taskData) => {
    try {
      // Clear related caches
      globalThrottle.clearCache(`/projects/${projectId}/tasks`);
      globalThrottle.clearCache(`/projects/${projectId}/tasks/${taskId}`);

      const response = await smartRequest(
        "put",
        `/projects/${projectId}/tasks/${taskId}`,
        taskData
      );
      return response;
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error;
    }
  },

  deleteTask: async (projectId, taskId) => {
    try {
      // Clear related caches
      globalThrottle.clearCache(`/projects/${projectId}/tasks`);

      const response = await smartRequest(
        "delete",
        `/projects/${projectId}/tasks/${taskId}`
      );
      return response;
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error;
    }
  },

  assignTask: async (projectId, taskId, userId) => {
    try {
      // Clear related caches
      globalThrottle.clearCache(`/projects/${projectId}/tasks`);

      const response = await smartRequest(
        "post",
        `/projects/${projectId}/tasks/${taskId}/assign`,
        { userId }
      );
      return response;
    } catch (error) {
      console.error("Failed to assign task:", error);
      throw error;
    }
  },

  updateTaskStatus: async (projectId, taskId, status) => {
    try {
      // Clear related caches
      globalThrottle.clearCache(`/projects/${projectId}/tasks`);

      const response = await smartRequest(
        "patch",
        `/projects/${projectId}/tasks/${taskId}/status`,
        { status }
      );
      return response;
    } catch (error) {
      console.error("Failed to update task status:", error);
      throw error;
    }
  },

  getAssignableUsers: async (projectId) => {
    try {
      const response = await smartRequest(
        "get",
        `/projects/${projectId}/assignable-users`
      );
      return response;
    } catch (error) {
      console.warn("Failed to fetch assignable users:", error.message);
      return { data: { users: [] } };
    }
  },

  getProjectMembers: async (projectId) => {
    try {
      const response = await smartRequest(
        "get",
        `/projects/${projectId}/members`
      );
      return response;
    } catch (error) {
      console.warn("Failed to fetch project members:", error.message);
      return { data: { members: [] } };
    }
  },

  addProjectMember: (projectId, userId) => {
    globalThrottle.clearCache(`/projects/${projectId}/members`);
    return smartRequest("post", `/projects/${projectId}/members`, { userId });
  },

  removeProjectMember: (projectId, userId) => {
    globalThrottle.clearCache(`/projects/${projectId}/members`);
    return smartRequest("delete", `/projects/${projectId}/members/${userId}`);
  },

  bulkUpdateTasks: async (projectId, taskIds, updates) => {
    try {
      globalThrottle.clearCache(`/projects/${projectId}/tasks`);
      const response = await smartRequest(
        "patch",
        `/projects/${projectId}/tasks/bulk`,
        { taskIds, updates }
      );
      return response;
    } catch (error) {
      console.error("Failed to bulk update tasks:", error);
      throw error;
    }
  },

  bulkAssignTasks: async (projectId, taskIds, userId) => {
    try {
      globalThrottle.clearCache(`/projects/${projectId}/tasks`);
      const response = await smartRequest(
        "post",
        `/projects/${projectId}/tasks/bulk-assign`,
        { taskIds, userId }
      );
      return response;
    } catch (error) {
      console.error("Failed to bulk assign tasks:", error);
      throw error;
    }
  },
};

// Organization API with smart caching (using users endpoint as fallback)
export const organizationAPI = {
  getOrganization: async () => {
    try {
      // First try to get data from localStorage to avoid rate limiting
      const cachedUser = localStorage.getItem("hubstaff_user");
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          console.log("🔍 Using cached user data for organization:", userData);

          if (userData.organizationId || userData.organization_id) {
            return {
              data: {
                id:
                  userData.organizationId ||
                  userData.organization_id ||
                  "default",
                name:
                  userData.organizationName ||
                  userData.organization_name ||
                  userData.companyName ||
                  "Default Organization",
                settings:
                  userData.organizationSettings ||
                  userData.organization_settings ||
                  {},
                role: userData.role,
                plan: userData.plan,
                features: userData.features,
              },
            };
          }
        } catch (parseError) {
          console.warn("Failed to parse cached user data:", parseError);
        }
      }

      // Fallback to API call if no cached data
      const response = await smartRequest("get", "/auth/me");
      console.log("🔍 Auth/me response for organization:", response.data);

      // Check if we have organization data in the response
      if (
        response.data &&
        !Array.isArray(response.data) &&
        Object.keys(response.data).length > 0
      ) {
        return {
          data: {
            id:
              response.data.organizationId ||
              response.data.organization_id ||
              "default",
            name:
              response.data.organizationName ||
              response.data.organization_name ||
              "Default Organization",
            settings:
              response.data.organizationSettings ||
              response.data.organization_settings ||
              {},
            role: response.data.role,
            plan: response.data.plan,
            features: response.data.features,
          },
        };
      }

      throw new Error("No valid data in auth response");
    } catch (error) {
      console.warn("Failed to fetch organization info:", error.message);

      // Try one more time with cached data
      const cachedUser = localStorage.getItem("hubstaff_user");
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          return {
            data: {
              id:
                userData.organizationId ||
                userData.organization_id ||
                "default",
              name:
                userData.organizationName ||
                userData.organization_name ||
                userData.companyName ||
                "Default Organization",
              settings: {},
            },
          };
        } catch (parseError) {
          // Fall through to default
        }
      }

      return {
        data: {
          id: "default",
          name: "Default Organization",
          settings: {},
        },
      };
    }
  },
  updateOrganization: (data) => {
    globalThrottle.clearCache("/auth/me");
    return smartRequest("put", "/auth/me", data);
  },
  getSettings: async () => {
    try {
      const response = await smartRequest("get", "/auth/me");
      return { data: response.data?.organizationSettings || {} };
    } catch (error) {
      console.warn("Failed to fetch organization settings:", error.message);
      return { data: {} };
    }
  },
  updateSettings: (settings) => {
    globalThrottle.clearCache("/auth/me");
    return smartRequest("put", "/auth/me", { organizationSettings: settings });
  },
  getStats: async () => {
    try {
      // Use analytics endpoint as fallback for organization stats
      const response = await smartRequest("get", "/analytics/dashboard");
      return { data: response.data || {} };
    } catch (error) {
      console.warn("Failed to fetch organization stats:", error.message);
      return { data: {} };
    }
  },
  getMembers: (params = {}) => usersAPI.getUsers(params),
  updateMember: (memberId, data) => usersAPI.updateUser(memberId, data),
  removeMember: (memberId) => usersAPI.deleteUser(memberId),
  getInvitations: (params = {}) => invitationsAPI.getInvitations(params),
  sendInvitation: (data) => invitationsAPI.sendInvitation(data),
  cancelInvitation: (invitationId) =>
    invitationsAPI.cancelInvitation(invitationId),
  resendInvitation: (invitationId) =>
    invitationsAPI.resendInvitation(invitationId),
  getBilling: () => smartRequest("get", "/organizations/billing"),
  updateBilling: (billingData) => {
    globalThrottle.clearCache("/organizations/billing");
    return smartRequest("put", "/organizations/billing", billingData);
  },
  changePlan: (planId) =>
    smartRequest("post", "/organizations/billing/change-plan", { planId }),
};

// Enhanced Time Tracking API with smart caching
export const timeTrackingAPI = {
  startTracking: (data) => {
    globalThrottle.clearCache("/time-tracking/active");
    return smartRequest("post", "/time-tracking/start", data);
  },

  stopTracking: (entryId) => {
    globalThrottle.clearCache("/time-tracking/active");
    return smartRequest("post", `/time-tracking/stop/${entryId}`);
  },

  getActiveEntry: async () => {
    try {
      const response = await smartRequest("get", "/time-tracking/active");
      return response;
    } catch (error) {
      console.warn("Failed to fetch active entry:", error.message);
      return { data: null };
    }
  },

  getTimeEntries: async (params = {}) => {
    try {
      const response = await smartRequest(
        "get",
        "/time-tracking/entries",
        null,
        { params }
      );
      // Ensure response has proper structure
      if (!response || !response.data) {
        return { data: { entries: [], pagination: {} } };
      }
      return response;
    } catch (error) {
      console.warn("Failed to fetch time entries:", error);
      return { data: { entries: [], pagination: {} } };
    }
  },

  createManualEntry: (data) => {
    globalThrottle.clearCache("/time-tracking/entries");
    globalThrottle.clearCache("/time-tracking/active");
    return smartRequest("post", "/time-tracking/manual", data);
  },

  updateTimeEntry: (entryId, data) => {
    globalThrottle.clearCache("/time-tracking/entries");
    return smartRequest("put", `/time-tracking/entries/${entryId}`, data);
  },

  deleteTimeEntry: (entryId) => {
    globalThrottle.clearCache("/time-tracking/entries");
    return smartRequest("delete", `/time-tracking/entries/${entryId}`);
  },

  recordActivity: (data) =>
    smartRequest("post", "/time-tracking/activity", data),

  uploadScreenshot: (entryId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return smartRequest(
      "post",
      `/time-tracking/screenshot?time_entry_id=${entryId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },

  getDailyReport: (date) =>
    smartRequest("get", "/time-tracking/reports/daily", null, {
      params: { date },
    }),

  getTeamTimeReport: (startDate, endDate) =>
    smartRequest("get", "/time-tracking/reports/team", null, {
      params: { start_date: startDate, end_date: endDate },
    }),

  approveTimeEntry: (entryId) =>
    smartRequest("post", `/time-tracking/entries/${entryId}/approve`),

  getEntriesNeedingApproval: () =>
    smartRequest("get", "/time-tracking/entries/pending-approval"),

  getTaskTimeEntries: async (taskId, params = {}) => {
    try {
      const response = await smartRequest(
        "get",
        `/time-tracking/tasks/${taskId}/entries`,
        null,
        { params }
      );
      return response;
    } catch (error) {
      console.warn("Failed to fetch task time entries:", error.message);
      return { data: { entries: [] } };
    }
  },

  getProjectTimeReport: async (projectId, params = {}) => {
    try {
      const response = await smartRequest(
        "get",
        `/time-tracking/projects/${projectId}/report`,
        null,
        { params }
      );
      return response;
    } catch (error) {
      console.warn("Failed to fetch project time report:", error.message);
      return { data: {} };
    }
  },
};

// Enhanced Analytics API with smart caching
export const analyticsAPI = {
  getDashboardAnalytics: async () => {
    try {
      const response = await smartRequest("get", "/analytics/dashboard");
      return response;
    } catch (error) {
      console.warn("Failed to fetch dashboard analytics:", error.message);
      return { data: { user_stats: { total_hours: 0, avg_activity: 0 } } };
    }
  },

  getTeamAnalytics: async (startDate, endDate) => {
    try {
      const response = await smartRequest("get", "/analytics/team", null, {
        params: { start_date: startDate, end_date: endDate },
      });
      return response;
    } catch (error) {
      console.warn("Failed to fetch team analytics:", error.message);
      return { data: { team_stats: [] } };
    }
  },

  getProductivityAnalytics: async (period = "week") => {
    try {
      const response = await smartRequest(
        "get",
        "/analytics/productivity",
        null,
        {
          params: { period },
        }
      );
      return response;
    } catch (error) {
      console.warn("Failed to fetch productivity analytics:", error.message);
      return { data: { productivity_score: 0 } };
    }
  },

  generateCustomReport: (params) =>
    smartRequest("get", "/analytics/reports/custom", null, { params }),

  getOrganizationAnalytics: (params = {}) =>
    smartRequest("get", "/analytics/organization", null, { params }),

  exportAnalytics: (format, params = {}) =>
    smartRequest("get", "/analytics/export", null, {
      params: { format, ...params },
      responseType: "blob",
    }),

  getTaskAnalytics: async (params = {}) => {
    try {
      const response = await smartRequest("get", "/analytics/tasks", null, {
        params,
      });
      return response;
    } catch (error) {
      console.warn("Failed to fetch task analytics:", error.message);
      return { data: {} };
    }
  },

  getProjectAnalytics: async (projectId, params = {}) => {
    try {
      const response = await smartRequest(
        "get",
        `/analytics/projects/${projectId}`,
        null,
        { params }
      );
      return response;
    } catch (error) {
      console.warn("Failed to fetch project analytics:", error.message);
      return { data: {} };
    }
  },

  getUserProductivity: async (userId, params = {}) => {
    try {
      const response = await smartRequest(
        "get",
        `/analytics/users/${userId}/productivity`,
        null,
        { params }
      );
      return response;
    } catch (error) {
      console.warn("Failed to fetch user productivity:", error.message);
      return { data: {} };
    }
  },
};

// Enhanced Integrations API
export const integrationsAPI = {
  getIntegrations: () => smartRequest("get", "/integrations"),

  connectSlack: (webhookUrl) =>
    smartRequest("post", "/integrations/slack/connect", {
      webhook_url: webhookUrl,
    }),

  connectTrello: (apiKey, token) =>
    smartRequest("post", "/integrations/trello/connect", {
      api_key: apiKey,
      token,
    }),

  connectGitHub: (token) =>
    smartRequest("post", "/integrations/github/connect", { token }),

  sendSlackNotification: (message, channel) =>
    smartRequest("post", "/integrations/slack/notify", { message, channel }),

  createTrelloCard: (listId, name, description) =>
    smartRequest("post", "/integrations/trello/create-card", {
      list_id: listId,
      name,
      description,
    }),

  createGitHubIssue: (repo, title, body, labels) =>
    smartRequest("post", "/integrations/github/create-issue", {
      repo,
      title,
      body,
      labels,
    }),

  disconnectIntegration: (integrationId) => {
    globalThrottle.clearCache("/integrations");
    return smartRequest("delete", `/integrations/${integrationId}`);
  },

  testIntegration: (integrationId) =>
    smartRequest("post", `/integrations/${integrationId}/test`),
};

// WebSocket API
export const websocketAPI = {
  getOnlineUsers: () => smartRequest("get", "/websocket/online-users"),
  getOrganizationOnlineUsers: () =>
    smartRequest("get", "/websocket/organization-online"),
  sendOrganizationNotification: (message, type = "info") =>
    smartRequest("post", "/websocket/organization-notify", { message, type }),
};

// Enhanced Invitations API
export const invitationsAPI = {
  sendInvitation: (data) => {
    globalThrottle.clearCache("/invitations");
    return smartRequest("post", "/invitations", data);
  },
  getInvitations: (params = {}) =>
    smartRequest("get", "/invitations", null, { params }),
  getInvitationStats: () => smartRequest("get", "/invitations/stats"),
  verifyInvitation: (token) =>
    smartRequest("get", `/invitations/verify/${token}`),
  cancelInvitation: (invitationId) => {
    globalThrottle.clearCache("/invitations");
    return smartRequest("delete", `/invitations/${invitationId}`);
  },
  resendInvitation: (invitationId) =>
    smartRequest("post", `/invitations/${invitationId}/resend`),
  extendInvitation: (invitationId, days) =>
    smartRequest("patch", `/invitations/${invitationId}/extend`, { days }),
  regenerateInvitation: (invitationId) =>
    smartRequest("post", `/invitations/${invitationId}/regenerate`),
  bulkSendInvitations: (invitations, defaultMessage = "") => {
    globalThrottle.clearCache("/invitations");
    return smartRequest("post", "/invitations/bulk", {
      invitations,
      defaultMessage,
    });
  },
};

// Enhanced Tasks API for advanced task management
export const tasksAPI = {
  // Task CRUD operations
  getTasks: (params = {}) => smartRequest("get", "/tasks", null, { params }),
  getTask: (taskId) => smartRequest("get", `/tasks/${taskId}`),
  createTask: (taskData) => {
    globalThrottle.clearCache("/tasks");
    return smartRequest("post", "/tasks", taskData);
  },
  updateTask: (taskId, taskData) => {
    globalThrottle.clearCache("/tasks");
    globalThrottle.clearCache(`/tasks/${taskId}`);
    return smartRequest("put", `/tasks/${taskId}`, taskData);
  },
  deleteTask: (taskId) => {
    globalThrottle.clearCache("/tasks");
    return smartRequest("delete", `/tasks/${taskId}`);
  },

  // Task assignment with role-based permissions
  assignTask: (taskId, userId) => {
    globalThrottle.clearCache("/tasks");
    return smartRequest("post", `/tasks/${taskId}/assign`, { userId });
  },

  reassignTask: (taskId, fromUserId, toUserId) => {
    globalThrottle.clearCache("/tasks");
    return smartRequest("post", `/tasks/${taskId}/reassign`, {
      fromUserId,
      toUserId,
    });
  },

  // Task status management
  updateTaskStatus: (taskId, status) => {
    globalThrottle.clearCache("/tasks");
    return smartRequest("patch", `/tasks/${taskId}/status`, { status });
  },

  // Task collaboration
  addTaskComment: (taskId, comment) =>
    smartRequest("post", `/tasks/${taskId}/comments`, { comment }),

  getTaskComments: (taskId) => smartRequest("get", `/tasks/${taskId}/comments`),

  addTaskWatcher: (taskId, userId) =>
    smartRequest("post", `/tasks/${taskId}/watchers`, { userId }),

  removeTaskWatcher: (taskId, userId) =>
    smartRequest("delete", `/tasks/${taskId}/watchers/${userId}`),

  // User-specific task queries
  getUserTasks: (userId, params = {}) =>
    smartRequest("get", `/tasks/user/${userId}`, null, { params }),

  getMyTasks: (params = {}) =>
    smartRequest("get", "/tasks/my", null, { params }),

  getAssignedTasks: (params = {}) =>
    smartRequest("get", "/tasks/assigned", null, { params }),

  getCreatedTasks: (params = {}) =>
    smartRequest("get", "/tasks/created", null, { params }),

  // Task filtering and search
  getOverdueTasks: () => smartRequest("get", "/tasks/overdue"),

  getTasksByPriority: (priority) =>
    smartRequest("get", "/tasks/priority", null, { params: { priority } }),

  getTasksByStatus: (status) =>
    smartRequest("get", "/tasks/status", null, { params: { status } }),

  searchTasks: (query, params = {}) =>
    smartRequest("get", "/tasks/search", null, {
      params: { q: query, ...params },
    }),

  // Task dependencies
  addTaskDependency: (taskId, dependencyTaskId) =>
    smartRequest("post", `/tasks/${taskId}/dependencies`, { dependencyTaskId }),

  removeTaskDependency: (taskId, dependencyTaskId) =>
    smartRequest("delete", `/tasks/${taskId}/dependencies/${dependencyTaskId}`),

  // Task time tracking
  startTaskTimer: (taskId) =>
    smartRequest("post", `/tasks/${taskId}/timer/start`),

  stopTaskTimer: (taskId) =>
    smartRequest("post", `/tasks/${taskId}/timer/stop`),

  getTaskTimeTracking: (taskId) =>
    smartRequest("get", `/tasks/${taskId}/time-tracking`),

  // Task analytics and reports
  getTaskStats: () => smartRequest("get", "/tasks/stats"),

  getTaskCompletionRate: (params = {}) =>
    smartRequest("get", "/tasks/completion-rate", null, { params }),

  exportTasks: (format, params = {}) =>
    smartRequest("get", "/tasks/export", null, {
      params: { format, ...params },
      responseType: "blob",
    }),
};

// Export the default axios instance for custom requests
export default apiClient;
