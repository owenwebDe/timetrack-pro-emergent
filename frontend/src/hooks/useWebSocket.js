// frontend/src/hooks/useWebSocket.js - OPTIMIZED VERSION
import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

export const useWebSocket = (user) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectionTime, setLastConnectionTime] = useState(0);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Connection configuration
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 5000; // 5 seconds
  const MIN_RECONNECT_INTERVAL = 10000; // 10 seconds minimum between attempts

  // Check if we should attempt reconnection
  const shouldReconnect = useCallback(() => {
    const now = Date.now();
    return (
      connectionAttempts < MAX_RECONNECT_ATTEMPTS &&
      now - lastConnectionTime > MIN_RECONNECT_INTERVAL
    );
  }, [connectionAttempts, lastConnectionTime]);

  // Clean up existing connection
  const cleanupConnection = useCallback(() => {
    if (socketRef.current) {
      console.log("Cleaning up WebSocket connection");
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Initialize WebSocket connection
  const initializeConnection = useCallback(() => {
    if (!user || !mountedRef.current) return;

    const token =
      localStorage.getItem("hubstaff_token") ||
      localStorage.getItem("authToken");
    if (!token) {
      console.warn("No auth token found for WebSocket connection");
      return;
    }

    // Check if we should attempt connection
    if (!shouldReconnect()) {
      console.warn(
        "WebSocket connection blocked - too many attempts or too recent"
      );
      return;
    }

    // Clean up existing connection
    cleanupConnection();

    console.log(`Attempting WebSocket connection to: ${BACKEND_URL}`);
    setLastConnectionTime(Date.now());

    try {
      socketRef.current = io(BACKEND_URL, {
        transports: ["websocket", "polling"],
        timeout: 10000,
        reconnection: false, // We'll handle reconnection manually
        forceNew: true,
        auth: {
          token: token,
        },
      });

      // Connection successful
      socketRef.current.on("connect", () => {
        if (!mountedRef.current) return;

        setIsConnected(true);
        setConnectionAttempts(0);
        console.log("WebSocket connected successfully");

        // Join user's team if they have one
        if (user.organizationId) {
          socketRef.current.emit("join-organization", user.organizationId);
        }

        if (user.teamId) {
          socketRef.current.emit("join-team", user.teamId);
        }
      });

      // Handle disconnection
      socketRef.current.on("disconnect", (reason) => {
        if (!mountedRef.current) return;

        setIsConnected(false);
        console.log("WebSocket disconnected:", reason);

        // Schedule reconnection for certain disconnect reasons
        if (reason === "io server disconnect" || reason === "transport close") {
          scheduleReconnection();
        }
      });

      // Handle connection errors
      socketRef.current.on("connect_error", (error) => {
        if (!mountedRef.current) return;

        console.error("WebSocket connection error:", error.message);
        setConnectionAttempts((prev) => prev + 1);
        setIsConnected(false);

        // Don't retry if it's an auth error
        if (
          error.message.includes("unauthorized") ||
          error.message.includes("401")
        ) {
          console.error("WebSocket authentication failed - clearing tokens");
          localStorage.removeItem("hubstaff_token");
          localStorage.removeItem("authToken");
          return;
        }

        // Schedule reconnection
        scheduleReconnection();
      });

      // Handle successful connection establishment
      socketRef.current.on("connection_established", (data) => {
        if (!mountedRef.current) return;

        console.log("WebSocket connection established:", data);
        setOnlineUsers(data.online_users || []);
      });

      // Handle user status updates
      socketRef.current.on("user_status_update", (data) => {
        if (!mountedRef.current) return;

        setOnlineUsers((prev) => {
          if (data.status === "online") {
            return [...prev.filter((id) => id !== data.user_id), data.user_id];
          } else {
            return prev.filter((id) => id !== data.user_id);
          }
        });
      });

      // Handle time entry updates
      socketRef.current.on("time_entry_update", (data) => {
        if (!mountedRef.current) return;

        setNotifications((prev) => [
          ...prev.slice(-19), // Keep only last 19 notifications
          {
            id: Date.now(),
            type: "time_entry",
            message: `Time tracking updated`,
            timestamp: new Date(),
            data: data.time_entry,
          },
        ]);
      });

      // Handle project updates
      socketRef.current.on("project_update", (data) => {
        if (!mountedRef.current) return;

        setNotifications((prev) => [
          ...prev.slice(-19), // Keep only last 19 notifications
          {
            id: Date.now(),
            type: "project",
            message: `Project "${data.project.name}" was updated`,
            timestamp: new Date(),
            data: data.project,
          },
        ]);
      });

      // Handle team activity
      socketRef.current.on("team_activity", (data) => {
        if (!mountedRef.current) return;

        console.log("Team activity update:", data);
        // Handle team activity updates here
      });

      // Handle task updates
      socketRef.current.on("task_update", (data) => {
        if (!mountedRef.current) return;

        setNotifications((prev) => [
          ...prev.slice(-19), // Keep only last 19 notifications
          {
            id: Date.now(),
            type: "task",
            message: `Task "${data.task.title}" was updated`,
            timestamp: new Date(),
            data: data.task,
          },
        ]);
      });

      // Handle organization notifications
      socketRef.current.on("organization_notification", (data) => {
        if (!mountedRef.current) return;

        setNotifications((prev) => [
          ...prev.slice(-19), // Keep only last 19 notifications
          {
            id: Date.now(),
            type: "organization",
            message: data.message,
            timestamp: new Date(),
            data: data.data || {},
          },
        ]);
      });
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      setConnectionAttempts((prev) => prev + 1);
      scheduleReconnection();
    }
  }, [user, shouldReconnect, cleanupConnection]);

  // Schedule reconnection
  const scheduleReconnection = useCallback(() => {
    if (reconnectTimeoutRef.current || !mountedRef.current) return;

    if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn("Max WebSocket reconnection attempts reached");
      return;
    }

    const delay = RECONNECT_DELAY * Math.pow(2, connectionAttempts); // Exponential backoff
    console.log(`Scheduling WebSocket reconnection in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      if (mountedRef.current) {
        initializeConnection();
      }
    }, delay);
  }, [connectionAttempts, initializeConnection]);

  // Send message through WebSocket
  const sendMessage = useCallback(
    (type, data) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("message", { type, data });
      } else {
        console.warn("WebSocket not connected, cannot send message");
      }
    },
    [isConnected]
  );

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
      setConnectionAttempts(0); // Reset attempts
      initializeConnection();
    }
  }, [connectionAttempts, initializeConnection]);

  // Reset connection state
  const resetConnection = useCallback(() => {
    setConnectionAttempts(0);
    setIsConnected(false);
    cleanupConnection();
  }, [cleanupConnection]);

  // Initialize connection on mount and user change
  useEffect(() => {
    if (user && user.id) {
      initializeConnection();
    }
  }, [user?.id, initializeConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanupConnection();
    };
  }, [cleanupConnection]);

  // Auto-cleanup old notifications
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (!mountedRef.current) return;

      const now = Date.now();
      const FIVE_MINUTES = 5 * 60 * 1000;

      setNotifications((prev) =>
        prev.filter(
          (notification) =>
            now - new Date(notification.timestamp).getTime() < FIVE_MINUTES
        )
      );
    }, 60000); // Check every minute

    return () => clearInterval(cleanup);
  }, []);

  return {
    isConnected,
    onlineUsers,
    notifications,
    sendMessage,
    markNotificationAsRead,
    clearAllNotifications,
    reconnect,
    resetConnection,
    connectionAttempts,
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
    canReconnect: connectionAttempts < MAX_RECONNECT_ATTEMPTS,
  };
};
