// frontend/src/components/Layout.js - FIXED spacing between sidebar and content
import React, { useState } from "react";
import {
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import {
  Home,
  Clock,
  Users,
  FolderOpen,
  BarChart3,
  Settings as SettingsIcon,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Target,
  DollarSign,
  Link as LinkIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

// Modern Header Component
const ModernHeader = ({ user, onLogout, currentPage }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications] = useState(2);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and mobile menu */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-semibold text-gray-900 hidden sm:block">
              TimeTrack Pro
            </span>
          </Link>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-lg mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search projects, tasks, or team members..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Right side - Actions and Profile */}
        <div className="flex items-center space-x-3">
          {/* Mobile search button */}
          <button className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors">
            <Search size={20} className="text-gray-500" />
          </button>

          {/* Quick Actions */}
          <div className="hidden sm:flex items-center space-x-2">
            <Link
              to="/time-tracking"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Start Timer
            </Link>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-md hover:bg-gray-100 transition-colors relative">
              <Bell size={20} className="text-gray-500" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>

          {/* Settings */}
          <Link
            to="/settings"
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Settings size={20} className="text-gray-500" />
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user?.name || "User"}
              </span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || "user@company.com"}
                  </p>
                </div>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Your Profile
                </Link>
                <Link
                  to="/team"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Organization
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Settings
                </Link>
                <div className="border-t border-gray-100">
                  <button
                    onClick={onLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
          <div className="mt-4 space-y-2">
            <Link
              to="/time-tracking"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors block text-center"
            >
              Start Timer
            </Link>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// Modern Sidebar Component
const ModernSidebar = ({ currentPage, isCollapsed, setIsCollapsed }) => {
  const location = useLocation();

  const mainMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
    {
      id: "time-tracking",
      label: "Time Tracking",
      icon: Clock,
      path: "/time-tracking",
    },
    { id: "projects", label: "Projects", icon: FolderOpen, path: "/projects" },
    { id: "team", label: "Team", icon: Users, path: "/team" },
    { id: "reports", label: "Reports", icon: BarChart3, path: "/reports" },
    {
      id: "integrations",
      label: "Integrations",
      icon: LinkIcon,
      path: "/integrations",
    },
  ];

  const bottomItems = [
    {
      id: "settings",
      label: "Settings",
      icon: SettingsIcon,
      path: "/settings",
    },
    { id: "help", label: "Help & Support", icon: HelpCircle, path: "#" },
  ];

  return (
    <div
      className={`bg-gray-900 text-white h-screen sticky top-0 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } flex flex-col hidden lg:flex flex-shrink-0`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-semibold">TimeTrack Pro</span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Organization Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-800">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  Your Organization
                </p>
                <p className="text-xs text-gray-400">Pro Plan</p>
              </div>
              <button className="p-1 rounded-md hover:bg-gray-700 transition-colors">
                <Plus size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {mainMenuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon size={20} />
              {!isCollapsed && (
                <span className="text-sm font-medium flex-1 text-left">
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Current Timer Status */}
        {!isCollapsed && (
          <div className="pt-6">
            <div className="bg-green-900 border border-green-700 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-100">
                  Currently Tracking
                </span>
              </div>
              <p className="text-xs text-green-200">Website Redesign</p>
              <p className="text-lg font-mono text-green-100 mt-1">02:34:12</p>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-gray-800 space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === item.path
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <item.icon size={20} />
            {!isCollapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

// FIXED Layout Component - Proper spacing with flexbox
export const Layout = ({
  user,
  onLogout,
  currentPage,
  children,
  loading = false,
  showSidebar = true,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernHeader
          user={user}
          onLogout={onLogout}
          currentPage={currentPage}
        />
        <div className="flex">
          {showSidebar && (
            <ModernSidebar
              currentPage={currentPage}
              isCollapsed={sidebarCollapsed}
              setIsCollapsed={setSidebarCollapsed}
            />
          )}
          <main className="flex-1 min-w-0">
            <div className="p-6">
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader user={user} onLogout={onLogout} currentPage={currentPage} />
      {/* 🔧 FIXED: Using proper flexbox layout without margins */}
      <div className="flex">
        {showSidebar && (
          <ModernSidebar
            currentPage={currentPage}
            isCollapsed={sidebarCollapsed}
            setIsCollapsed={setSidebarCollapsed}
          />
        )}
        {/* 🔧 FIXED: Removed problematic margin-left, using flexbox instead */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <div className="p-6 h-full">{children}</div>
        </main>
      </div>
    </div>
  );
};
