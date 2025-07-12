// frontend/src/components/dashboard/DashboardHeader.js
import React from "react";
import { Calendar, Timer as TimerIcon } from "lucide-react";
import { Button } from "../common/Button";

export const DashboardHeader = ({ user }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div className="mb-4 sm:mb-0">
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.name || "User"}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your team today.
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <Button variant="secondary" icon={Calendar}>
          Today
        </Button>
        <Button variant="primary" icon={TimerIcon} href="/time-tracking">
          Start Timer
        </Button>
      </div>
    </div>
  );
};
