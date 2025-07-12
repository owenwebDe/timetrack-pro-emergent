// frontend/src/components/debug/PerformanceMonitor.js
import React, { useState, useEffect } from "react";
import globalThrottle from "../../utils/globalThrottle";

const PerformanceMonitor = ({ enabled = false }) => {
  const [metrics, setMetrics] = useState({});
  const [status, setStatus] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const updateMetrics = () => {
      setMetrics(globalThrottle.getPerformanceMetrics());
      setStatus(globalThrottle.getStatus());
    };

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const handleEmergencyStop = () => {
    globalThrottle.emergencyStop();
    alert("Emergency stop activated! All API calls blocked for 30 seconds.");
  };

  const handleClearCache = () => {
    globalThrottle.clearAllCache();
    alert("Cache cleared successfully!");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700">
        <div
          className="p-3 cursor-pointer flex items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                metrics.activeRequests > 0 ? "bg-yellow-500" : "bg-green-500"
              }`}
            ></div>
            <span className="text-sm font-medium">API Monitor</span>
          </div>
          <span className="text-xs">{isExpanded ? "▼" : "▲"}</span>
        </div>

        {isExpanded && (
          <div className="px-3 pb-3 space-y-3">
            {/* Current Metrics */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-300">
                Current Status
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Active:</span>
                  <span className="ml-1 text-white">
                    {metrics.activeRequests || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Blocked:</span>
                  <span className="ml-1 text-white">
                    {metrics.blockedRequests || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Cache:</span>
                  <span className="ml-1 text-white">
                    {metrics.cacheHits || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Total:</span>
                  <span className="ml-1 text-white">
                    {metrics.totalRequests || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Requests */}
            {status.activeRequests && status.activeRequests.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-300">
                  Active Requests
                </h4>
                <div className="max-h-20 overflow-y-auto">
                  {status.activeRequests.map((endpoint, index) => (
                    <div
                      key={index}
                      className="text-xs text-yellow-400 truncate"
                    >
                      {endpoint}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blocked Endpoints */}
            {status.blockedEndpoints && status.blockedEndpoints.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-300">
                  Blocked Endpoints
                </h4>
                <div className="max-h-20 overflow-y-auto">
                  {status.blockedEndpoints.map((item, index) => (
                    <div key={index} className="text-xs text-red-400 truncate">
                      {item.endpoint} ({item.blockedFor})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Requests */}
            {status.lastFetchTimes && status.lastFetchTimes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-300">
                  Recent Requests
                </h4>
                <div className="max-h-20 overflow-y-auto">
                  {status.lastFetchTimes.slice(0, 5).map((item, index) => (
                    <div key={index} className="text-xs text-blue-400 truncate">
                      {item.endpoint} ({item.secondsAgo}s ago)
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex space-x-2">
              <button
                onClick={handleEmergencyStop}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
              >
                Emergency Stop
              </button>
              <button
                onClick={handleClearCache}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
              >
                Clear Cache
              </button>
            </div>

            {/* Performance Indicators */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Avg Interval:</span>
                <span className="text-white">
                  {metrics.averageRequestInterval
                    ? Math.round(metrics.averageRequestInterval / 1000) + "s"
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Cache Hit Rate:</span>
                <span className="text-white">
                  {metrics.totalRequests > 0
                    ? Math.round(
                        (metrics.cacheHits / metrics.totalRequests) * 100
                      ) + "%"
                    : "0%"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;
