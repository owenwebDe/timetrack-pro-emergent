// frontend/src/components/dashboard/QuickActions.js
import React from "react";
import {
  PlusCircle,
  Timer as TimerIcon,
  BarChart3,
  UserPlus,
} from "lucide-react";

export const QuickActions = ({ user }) => {
  const QuickActionButton = ({ icon: Icon, label, color, onClick, href }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      green:
        "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
      purple:
        "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
      orange:
        "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
    };

    const Component = href ? "a" : "button";
    const props = href ? { href } : { onClick };

    return (
      <Component
        {...props}
        className={`flex flex-col items-center p-4 bg-gradient-to-r ${colorClasses[color]} text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 group`}
      >
        <Icon
          size={24}
          className="mb-2 group-hover:scale-110 transition-transform"
        />
        <span className="text-sm font-medium">{label}</span>
      </Component>
    );
  };

  const actions = [
    {
      icon: PlusCircle,
      label: "New Project",
      color: "blue",
      href: "/projects",
      show: user?.role === "admin" || user?.role === "manager",
    },
    {
      icon: TimerIcon,
      label: "Start Timer",
      color: "green",
      href: "/time-tracking",
      show: true,
    },
    {
      icon: BarChart3,
      label: "View Reports",
      color: "purple",
      href: "/reports",
      show: true,
    },
    {
      icon: UserPlus,
      label: "Invite Team",
      color: "orange",
      href: "/team",
      show: user?.role === "admin" || user?.role === "manager",
    },
  ];

  const visibleActions = actions.filter((action) => action.show);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {visibleActions.map((action, index) => (
          <QuickActionButton
            key={index}
            icon={action.icon}
            label={action.label}
            color={action.color}
            href={action.href}
          />
        ))}
      </div>
    </div>
  );
};
