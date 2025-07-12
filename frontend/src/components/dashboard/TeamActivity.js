// frontend/src/components/dashboard/TeamActivity.js
import React from "react";
import { Users, ChevronRight } from "lucide-react";

export const TeamActivity = ({ teamActivity = [], loading = false }) => {
  const statusColors = {
    active: "bg-green-100 text-green-700",
    away: "bg-yellow-100 text-yellow-700",
    offline: "bg-gray-100 text-gray-700",
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-400";
      case "away":
        return "bg-yellow-400";
      default:
        return "bg-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="bg-gray-200 rounded w-32 h-6 animate-pulse"></div>
          <div className="bg-gray-200 rounded w-16 h-4 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="flex items-center p-4 bg-gray-50 rounded-lg animate-pulse"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="ml-3 flex-1">
                <div className="bg-gray-200 rounded w-24 h-4 mb-2"></div>
                <div className="bg-gray-200 rounded w-16 h-3"></div>
              </div>
              <div className="bg-gray-200 rounded w-12 h-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Team Activity</h3>
        <a
          href="/team"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
        >
          View all
          <ChevronRight size={16} className="ml-1" />
        </a>
      </div>

      <div className="space-y-3">
        {teamActivity.length > 0 ? (
          teamActivity.slice(0, 4).map((teamUser, index) => (
            <div
              key={teamUser.id || `team-user-${index}`}
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200"
            >
              <div className="relative">
                <img
                  src={
                    teamUser.avatar ||
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                  }
                  alt={teamUser.name || "User"}
                  className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(
                    teamUser.status
                  )}`}
                ></div>
              </div>

              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 truncate">
                    {teamUser.name || "Unknown User"}
                  </h4>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-500 truncate">
                    {teamUser.role || "No role"}
                  </p>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      statusColors[teamUser.status] || statusColors.offline
                    }`}
                  >
                    {teamUser.status || "offline"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No team members found</p>
          </div>
        )}
      </div>
    </div>
  );
};
