// frontend/src/utils/api.js - Complete version with throttling
import globalThrottle from "./globalThrottle";

const API_BASE_URL =
  process.env.REACT_APP_BACKEND_URL || "https://icon-time-tracker.onrender.com";

// Get token from localStorage
const getToken = () => {
  return (
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("hubstaff_token")
  );
};

// Set token in localStorage
const setToken = (token) => {
  localStorage.setItem("authToken", token);
  localStorage.setItem("hubstaff_token", token);
};

// Remove token from localStorage
const removeToken = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  localStorage.removeItem("hubstaff_token");
  localStorage.removeItem("hubstaff_user");
};

// Enhanced API call helper with throttling and retry logic
const apiCall = async (endpoint, options = {}, retryCount = 0) => {
  // THROTTLE CHECK - This stops the API spam
  if (!globalThrottle.canFetch(endpoint)) {
    console.log(`🚫 API call to ${endpoint} blocked by throttle`);
    // Return a mock response instead of making the request
    return new Response(
      JSON.stringify({
        error: "Throttled",
        message: "Request blocked by rate limiter",
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  globalThrottle.startFetch(endpoint);

  const token = getToken();
  const maxRetries = 3;
  const retryDelay = 1000 * (retryCount + 1);

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    console.log(`🚀 Making API call to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle rate limiting (429)
    if (response.status === 429) {
      console.warn(`Rate limited. Retry ${retryCount + 1}/${maxRetries}`);
      globalThrottle.blockEndpoint(endpoint, 60000); // Block for 1 minute

      if (retryCount < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return apiCall(endpoint, options, retryCount + 1);
      }
      throw new Error("Too many requests. Please try again later.");
    }

    // Handle 401 errors by clearing token
    if (response.status === 401) {
      console.warn("Authentication failed. Clearing tokens...");
      removeToken();
      globalThrottle.endFetch(endpoint);
      throw new Error("Authentication failed. Please login again.");
    }

    globalThrottle.endFetch(endpoint);
    return response;
  } catch (error) {
    console.error("API call error:", error);
    globalThrottle.endFetch(endpoint);

    // Retry on network errors (Failed to fetch)
    if (
      error.message.includes("Failed to fetch") ||
      error.name === "TypeError"
    ) {
      if (retryCount < maxRetries) {
        console.log(
          `Network error. Retrying ${retryCount + 1}/${maxRetries}...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return apiCall(endpoint, options, retryCount + 1);
      }
      throw new Error(
        "Network connection failed. Please check your connection and try again."
      );
    }

    throw error;
  }
};

// Enhanced login function with better error handling
const login = async (credentials) => {
  try {
    const response = await apiCall("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let errorMessage = "Login failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Login failed (${response.status})`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.token) {
      setToken(data.token);
      console.log("Token stored successfully");
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Register function
const register = async (userData) => {
  try {
    const response = await apiCall("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      let errorMessage = "Registration failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Registration failed (${response.status})`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.token) {
      setToken(data.token);
    }

    return data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Get users function - THROTTLED
const getUsers = async (limit = 10) => {
  try {
    const response = await apiCall(`/api/users?limit=${limit}`);

    // Handle throttled response
    if (response.status === 429) {
      const data = await response.json();
      console.warn("Users request throttled:", data.message);
      return []; // Return empty array instead of failing
    }

    if (!response.ok) {
      let errorMessage = "Failed to fetch users";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Failed to fetch users (${response.status})`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Get users error:", error);
    return []; // Return empty array on error to prevent crashes
  }
};

// Get projects function - THROTTLED
const getProjects = async (limit = 5) => {
  try {
    const response = await apiCall(`/api/projects?limit=${limit}`);

    // Handle throttled response
    if (response.status === 429) {
      const data = await response.json();
      console.warn("Projects request throttled:", data.message);
      return []; // Return empty array instead of failing
    }

    if (!response.ok) {
      let errorMessage = "Failed to fetch projects";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Failed to fetch projects (${response.status})`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Get projects error:", error);
    return []; // Return empty array on error to prevent crashes
  }
};

// Get analytics dashboard - THROTTLED
const getDashboard = async () => {
  try {
    const response = await apiCall("/api/analytics/dashboard");

    // Handle throttled response
    if (response.status === 429) {
      const data = await response.json();
      console.warn("Dashboard request throttled:", data.message);
      return { user_stats: { total_hours: 0, avg_activity: 0 } }; // Return default data
    }

    if (!response.ok) {
      let errorMessage = "Failed to fetch dashboard";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Failed to fetch dashboard (${response.status})`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Get dashboard error:", error);
    return { user_stats: { total_hours: 0, avg_activity: 0 } }; // Return default data on error
  }
};

// Logout function
const logout = () => {
  removeToken();
  console.log("User logged out, tokens cleared");
};

// Check if user is authenticated
const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

// Export all functions
export {
  login,
  register,
  getUsers,
  getProjects,
  getDashboard,
  logout,
  isAuthenticated,
  getToken,
  setToken,
  removeToken,
  apiCall,
};
