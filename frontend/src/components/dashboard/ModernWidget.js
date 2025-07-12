// frontend/src/components/dashboard/ModernWidget.js
import React from "react";
import {
  Clock,
  FolderOpen,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

export const ModernWidget = ({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  trend,
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
  };

  const iconMap = {
    "⏰": Clock,
    "📁": FolderOpen,
    "📊": BarChart3,
    "📈": TrendingUp,
  };

  const IconComponent = iconMap[icon] || Clock;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]} shadow-lg`}
        >
          <IconComponent className="text-white" size={24} />
        </div>
        {trend && (
          <div
            className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <ArrowUpRight size={12} className={trend > 0 ? "" : "rotate-90"} />
            <span className="ml-1">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          {value}
        </p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
};
