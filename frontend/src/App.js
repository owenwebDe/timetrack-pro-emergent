// frontend/src/App.js - FIXED: Added OrganizationProvider wrapper
import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProjectProvider } from "./contexts";
import { OrganizationProvider } from "./contexts/OrganizationContext"; // ADD THIS IMPORT
import { Layout } from "./components/Layout";
import {
  HomePage,
  DashboardPage,
  TimeTrackingPage,
  TeamManagementPage,
  ProjectsPage,
  ReportsPage,
  SettingsPage,
  LoginPage,
  SignupPage,
  IntegrationsPage,
  AcceptInvitationPage,
} from "./pages";

// Import the NEW pages for updated registration flow
import { OrganizationChoicePage } from "./pages/OrganizationChoicePage";
import { CreateOrganizationPage } from "./pages/CreateOrganizationPage";

// Keep existing pages if still needed
import { OrganizationSetupPage } from "./pages/OrganizationSetupPage";
import { OnboardingPage } from "./pages/OnboardingPage";

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in (mock authentication)
    const savedUser = localStorage.getItem("hubstaff_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("hubstaff_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("hubstaff_user");
    localStorage.removeItem("hubstaff_token");
    localStorage.removeItem("authToken");
  };

  return (
    <div className="App">
      <BrowserRouter>
        <ProjectProvider>
          {/* FIXED: Wrap authenticated routes with OrganizationProvider */}
          <Routes>
            {/* Public Routes - No Layout and No OrganizationProvider */}
            <Route path="/" element={<HomePage />} />
            <Route
              path="/login"
              element={<LoginPage onLogin={handleLogin} />}
            />
            <Route
              path="/signup"
              element={<SignupPage onLogin={handleLogin} />}
            />
            <Route
              path="/accept-invitation"
              element={<AcceptInvitationPage onLogin={handleLogin} />}
            />

            {/* NEW: Updated registration flow - No Layout */}
            <Route
              path="/organization-choice"
              element={<OrganizationChoicePage />}
            />
            <Route
              path="/create-organization"
              element={<CreateOrganizationPage />}
            />

            {/* EXISTING: Keep these for backward compatibility if needed */}
            <Route
              path="/organization-setup"
              element={<OrganizationSetupPage />}
            />
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* FIXED: Protected Routes with Layout AND OrganizationProvider */}
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  <OrganizationProvider>
                    <Layout
                      user={user}
                      onLogout={handleLogout}
                      currentPage="Dashboard"
                      showSidebar={true}
                    >
                      <DashboardPage user={user} onLogout={handleLogout} />
                    </Layout>
                  </OrganizationProvider>
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/time-tracking"
              element={
                isAuthenticated ? (
                  <OrganizationProvider>
                    <Layout
                      user={user}
                      onLogout={handleLogout}
                      currentPage="Time Tracking"
                      showSidebar={true}
                    >
                      <TimeTrackingPage user={user} onLogout={handleLogout} />
                    </Layout>
                  </OrganizationProvider>
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/team"
              element={
                isAuthenticated ? (
                  <OrganizationProvider>
                    <Layout
                      user={user}
                      onLogout={handleLogout}
                      currentPage="Team"
                      showSidebar={true}
                    >
                      <TeamManagementPage user={user} onLogout={handleLogout} />
                    </Layout>
                  </OrganizationProvider>
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/projects"
              element={
                isAuthenticated ? (
                  <OrganizationProvider>
                    <Layout
                      user={user}
                      onLogout={handleLogout}
                      currentPage="Projects"
                      showSidebar={true}
                    >
                      <ProjectsPage user={user} onLogout={handleLogout} />
                    </Layout>
                  </OrganizationProvider>
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/reports"
              element={
                isAuthenticated ? (
                  <OrganizationProvider>
                    <Layout
                      user={user}
                      onLogout={handleLogout}
                      currentPage="Reports"
                      showSidebar={true}
                    >
                      <ReportsPage user={user} onLogout={handleLogout} />
                    </Layout>
                  </OrganizationProvider>
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/integrations"
              element={
                isAuthenticated ? (
                  <OrganizationProvider>
                    <Layout
                      user={user}
                      onLogout={handleLogout}
                      currentPage="Integrations"
                      showSidebar={true}
                    >
                      <IntegrationsPage user={user} onLogout={handleLogout} />
                    </Layout>
                  </OrganizationProvider>
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/settings"
              element={
                isAuthenticated ? (
                  <OrganizationProvider>
                    <Layout
                      user={user}
                      onLogout={handleLogout}
                      currentPage="Settings"
                      showSidebar={true}
                    >
                      <SettingsPage user={user} onLogout={handleLogout} />
                    </Layout>
                  </OrganizationProvider>
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              }
            />
          </Routes>
        </ProjectProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
