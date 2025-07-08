// frontend/src/pages/LoginPage.js - Modern Professional Design
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { login, isAuthenticated } from "../utils/api";

export const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error && (formData.email || formData.password)) {
      setError("");
    }
  }, [formData.email, formData.password, error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    // Prevent too many rapid attempts
    if (retryCount >= 3) {
      setError(
        "Too many failed attempts. Please wait a moment before trying again."
      );
      setLoading(false);
      setTimeout(() => setRetryCount(0), 30000); // Reset after 30 seconds
      return;
    }

    try {
      console.log("Attempting login...");

      // Use the enhanced login function from our API utility
      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      console.log("Login successful:", response);

      // The response structure from your backend is: { message, user, token }
      const { token, user } = response;

      // Store user data
      if (user) {
        localStorage.setItem("hubstaff_user", JSON.stringify(user));
      }

      // Call the onLogin callback if provided
      if (onLogin && user) {
        onLogin(user);
      }

      // Reset retry count on success
      setRetryCount(0);

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setRetryCount((prev) => prev + 1);

      // Handle different types of errors with user-friendly messages
      let errorMessage = "Login failed. Please try again.";

      if (error.message.includes("Network connection failed")) {
        errorMessage =
          "Connection failed. Please check your internet connection.";
      } else if (error.message.includes("Authentication failed")) {
        errorMessage =
          "Invalid email or password. Please check your credentials.";
      } else if (error.message.includes("Too many requests")) {
        errorMessage =
          "Too many login attempts. Please wait a moment and try again.";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Server connection failed. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">T</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-blue-200">Sign in to your TimeTrack Pro account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg flex items-center space-x-3">
                <AlertCircle size={20} className="text-red-400" />
                <div>
                  <span className="block">{error}</span>
                  {retryCount > 0 && (
                    <span className="block text-sm mt-1 text-red-300">
                      Attempt {retryCount}/3
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white mb-2"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-gray-300"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={loading}
                  className="block w-full pl-10 pr-12 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-gray-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-blue-200">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || retryCount >= 3}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-blue-200">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-white font-semibold hover:text-blue-200 transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-8 text-blue-200 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span>No credit card required</span>
            </div>
          </div>
        </div>

        {/* Development debug info */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/10">
            <p className="text-blue-200 text-xs">
              API:{" "}
              {process.env.REACT_APP_BACKEND_URL || "http://localhost:8001"}
            </p>
            <p className="text-blue-200 text-xs">Retries: {retryCount}/3</p>
          </div>
        )}
      </div>
    </div>
  );
};
