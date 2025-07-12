// frontend/src/components/dashboard/DashboardDebug.js
import React from "react";

export const DashboardDebug = ({
  projects = [],
  teamActivity = [],
  lastUpdate = 0,
}) => {
  const handleThrottleCheck = () => {
    if (window.globalThrottle) {
      console.log("Throttle status:", window.globalThrottle.getStatus());
    }
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
      <h4 className="font-semibold mb-2">Debug Info:</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <p>Projects loaded: {projects.length}</p>
        <p>Team members: {teamActivity.length}</p>
        <p>Last update: {new Date(lastUpdate).toLocaleTimeString()}</p>
        <p>
          Screen: <span className="sm:hidden">Mobile</span>
          <span className="hidden sm:inline lg:hidden">Tablet</span>
          <span className="hidden lg:inline">Desktop</span>
        </p>
      </div>
      <button
        onClick={handleThrottleCheck}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
      >
        Check Throttle Status
      </button>
    </div>
  );
};
