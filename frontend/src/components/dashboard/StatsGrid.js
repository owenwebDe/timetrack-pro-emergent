// frontend/src/components/dashboard/StatsGrid.js
import React from "react";
import { ModernWidget } from "./ModernWidget";

export const StatsGrid = ({ widgets = [], loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gray-200 rounded-lg w-12 h-12"></div>
              <div className="bg-gray-200 rounded-full w-12 h-6"></div>
            </div>
            <div className="space-y-2">
              <div className="bg-gray-200 rounded w-24 h-4"></div>
              <div className="bg-gray-200 rounded w-16 h-8"></div>
              <div className="bg-gray-200 rounded w-20 h-3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="col-span-full bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Statistics Available
          </h3>
          <p className="text-gray-500">
            Dashboard statistics will appear here once data is loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {widgets.map((widget, index) => (
        <ModernWidget
          key={`widget-${index}`}
          title={widget.title}
          value={widget.value}
          subtitle={widget.subtitle}
          icon={widget.icon}
          color={widget.color}
          trend={widget.trend}
        />
      ))}
    </div>
  );
};
