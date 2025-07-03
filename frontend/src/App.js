import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { 
  HomePage, 
  DashboardPage, 
  TimeTrackingPage, 
  TeamManagementPage, 
  ProjectsPage, 
  ReportsPage, 
  SettingsPage,
  LoginPage,
  SignupPage 
} from "./components";

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in (mock authentication)
    const savedUser = localStorage.getItem('hubstaff_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('hubstaff_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('hubstaff_user');
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            isAuthenticated ? 
            <DashboardPage user={user} onLogout={handleLogout} /> : 
            <LoginPage onLogin={handleLogin} />
          } />
          <Route path="/time-tracking" element={
            isAuthenticated ? 
            <TimeTrackingPage user={user} onLogout={handleLogout} /> : 
            <LoginPage onLogin={handleLogin} />
          } />
          <Route path="/team" element={
            isAuthenticated ? 
            <TeamManagementPage user={user} onLogout={handleLogout} /> : 
            <LoginPage onLogin={handleLogin} />
          } />
          <Route path="/projects" element={
            isAuthenticated ? 
            <ProjectsPage user={user} onLogout={handleLogout} /> : 
            <LoginPage onLogin={handleLogin} />
          } />
          <Route path="/reports" element={
            isAuthenticated ? 
            <ReportsPage user={user} onLogout={handleLogout} /> : 
            <LoginPage onLogin={handleLogin} />
          } />
          <Route path="/settings" element={
            isAuthenticated ? 
            <SettingsPage user={user} onLogout={handleLogout} /> : 
            <LoginPage onLogin={handleLogin} />
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;