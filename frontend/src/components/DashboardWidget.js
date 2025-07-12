// frontend/src/components/DashboardWidget.js
import React from "react";

export const DashboardWidget = ({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 card-hover">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
