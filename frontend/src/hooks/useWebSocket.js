import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

export const useWebSocket = (user) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    if (!user) return;

    const token =
      localStorage.getItem("hubstaff_token") ||
      localStorage.getItem("authToken");
    if (!token) return;

    // Prevent too many connection attempts
    if (connectionAttempts >= 3) {
      console.warn("Too many WebSocket connection attempts, stopping");
      return;
    }

    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Connect to WebSocket with correct URL
    console.log(`Attempting WebSocket connection to: ${BACKEND_URL}`);

    socketRef.current = io(BACKEND_URL, {
      transports: ["websocket", "polling"], // Allow fallback to polling
      timeout: 10000, // 10 second timeout
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      auth: {
        token: token,
      },
      forceNew: true, // Force new connection
    });

    socketRef.current.on("connect", () => {
      setIsConnected(true);
      setConnectionAttempts(0); // Reset on successful connection
      console.log("WebSocket connected successfully");

      // Join user's team if they have one
      if (user.teamId) {
        socketRef.current.emit("join-team", user.teamId);
      }
    });

    socketRef.current.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("WebSocket disconnected:", reason);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error.message);
      setConnectionAttempts((prev) => prev + 1);
      setIsConnected(false);

      // Don't retry if it's an auth error
      if (
        error.message.includes("unauthorized") ||
        error.message.includes("401")
      ) {
        console.error("WebSocket authentication failed");
        return;
      }
    });

    socketRef.current.on("connection_established", (data) => {
      console.log("WebSocket connection established:", data);
      setOnlineUsers(data.online_users || []);
    });

    socketRef.current.on("user_status_update", (data) => {
      setOnlineUsers((prev) => {
        if (data.status === "online") {
          return [...prev.filter((id) => id !== data.user_id), data.user_id];
        } else {
          return prev.filter((id) => id !== data.user_id);
        }
      });
    });

    socketRef.current.on("time_entry_update", (data) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "time_entry",
          message: `${data.user_id} updated time tracking`,
          timestamp: new Date(),
          data: data.time_entry,
        },
      ]);
    });

    socketRef.current.on("project_update", (data) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "project",
          message: `Project "${data.project.name}" was updated`,
          timestamp: new Date(),
          data: data.project,
        },
      ]);
    });

    socketRef.current.on("team_activity", (data) => {
      console.log("Team activity update:", data);
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log("Cleaning up WebSocket connection");
        socketRef.current.off(); // Remove all listeners
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, connectionAttempts]);

  const sendMessage = (type, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("message", { type, data });
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  // Manual reconnect function
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  return {
    isConnected,
    onlineUsers,
    notifications,
    sendMessage,
    markNotificationAsRead,
    reconnect,
    connectionAttempts,
  };
};
