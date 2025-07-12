// frontend/src/components/common/LoadingSpinner.js
import React from "react";

export const LoadingSpinner = ({
  size = "md",
  message = "Loading...",
  color = "blue",
  centered = true,
  showMessage = true,
}) => {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const colorClasses = {
    blue: "border-blue-600",
    gray: "border-gray-600",
    green: "border-green-600",
    red: "border-red-600",
    yellow: "border-yellow-600",
    purple: "border-purple-600",
  };

  const containerClasses = centered
    ? "flex items-center justify-center py-8"
    : "flex items-center";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-3">
        <div
          className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
        />
        {showMessage && message && (
          <p className="text-gray-600 text-sm">{message}</p>
        )}
      </div>
    </div>
  );
};
