// frontend/src/components/common/EmptyState.js
import React from "react";

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          {typeof icon === "string" ? (
            <span className="text-3xl text-gray-400">{icon}</span>
          ) : (
            <div className="text-gray-400">{icon}</div>
          )}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};
