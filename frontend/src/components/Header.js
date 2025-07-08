// frontend/components/Header.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useWebSocket } from "../hooks/useWebSocket";

export const Header = ({ user, onLogout, currentPage }) => {
  const { notifications, markNotificationAsRead } = useWebSocket(user);
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return { label: "Admin", color: "bg-red-100 text-red-800", icon: "👑" };
      case "manager":
        return {
          label: "Manager",
          color: "bg-blue-100 text-blue-800",
          icon: "👨‍💼",
        };
      case "user":
        return {
          label: "User",
          color: "bg-green-100 text-green-800",
          icon: "👤",
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-800",
          icon: "❓",
        };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Hubworker</span>
            </Link>
          </div>

          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{currentPage}</span>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900"
                >
                  🔔
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-gray-500 text-center">
                          No new notifications
                        </p>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-3 border-b border-gray-100 hover:bg-gray-50"
                          >
                            <p className="text-sm text-gray-900">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(notification.timestamp, "PPp")}
                            </p>
                            <button
                              onClick={() =>
                                markNotificationAsRead(notification.id)
                              }
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              Mark as read
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      user.avatar ||
                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium">
                      {user.name}
                    </span>
                    <div
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge.color}`}
                    >
                      <span className="mr-1">{roleBadge.icon}</span>
                      <span>{roleBadge.label}</span>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="text-gray-500 hover:text-gray-700 ml-2 px-3 py-1 text-sm rounded-md hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-gray-900">
                Sign in
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
