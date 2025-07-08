// frontend/src/components/Sidebar.js - FIXED VERSION
import React from "react";
import { Link, useLocation } from "react-router-dom";

export const Sidebar = ({ currentPage }) => {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", icon: "📊", path: "/dashboard" },
    { name: "Time Tracking", icon: "⏰", path: "/time-tracking" },
    { name: "Team", icon: "👥", path: "/team" },
    { name: "Projects", icon: "📁", path: "/projects" },
    { name: "Reports", icon: "📈", path: "/reports" },
    { name: "Integrations", icon: "🔗", path: "/integrations" },
    { name: "Settings", icon: "⚙️", path: "/settings" },
  ];

  return (
    // 🔧 FIXED: Removed fixed positioning, made it part of normal layout flow
    <div className="w-64 bg-white shadow-sm h-screen border-r border-gray-200 hidden lg:block flex-shrink-0">
      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                location.pathname === item.path
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="mr-3 text-base">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};
