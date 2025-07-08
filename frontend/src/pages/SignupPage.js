// frontend/src/pages/SignupPage.js - Updated for admin-only registration with organization creation
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building,
  AlertCircle,
  Loader2,
  CheckCircle,
  FileText,
  Users,
  ArrowRight,
} from "lucide-react";
import { authAPI } from "../api/client";

export const SignupPage = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("token");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
    organizationDescription: "",
    organizationSize: "",
    industry: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [orgNameAvailable, setOrgNameAvailable] = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingOrgName, setCheckingOrgName] = useState(false);
  const navigate = useNavigate();

  // If there's an invitation token, redirect to accept invitation page
  useEffect(() => {
    if (invitationToken) {
      navigate(`/accept-invitation?token=${invitationToken}`);
    }
  }, [invitationToken, navigate]);

  // Check email availability with debouncing
  useEffect(() => {
    if (formData.email && formData.email.includes("@")) {
      const timeoutId = setTimeout(async () => {
        setCheckingEmail(true);
        try {
          const response = await authAPI.checkEmail(formData.email);
          setEmailAvailable(response.data.available);
        } catch (error) {
          console.error("Email check failed:", error);
        } finally {
          setCheckingEmail(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.email]);

  // Check organization name availability with debouncing
  useEffect(() => {
    if (formData.organizationName && formData.organizationName.length >= 2) {
      const timeoutId = setTimeout(async () => {
        setCheckingOrgName(true);
        try {
          const response = await authAPI.checkOrganization(
            formData.organizationName
          );
          setOrgNameAvailable(response.data.available);
        } catch (error) {
          console.error("Organization name check failed:", error);
        } finally {
          setCheckingOrgName(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.organizationName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.organizationName
    ) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (emailAvailable === false) {
      setError("Email is already registered");
      setLoading(false);
      return;
    }

    if (orgNameAvailable === false) {
      setError("Organization name is already taken");
      setLoading(false);
      return;
    }

    try {
      // Register admin with organization creation
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        organizationDescription: formData.organizationDescription || "",
        organizationSize: formData.organizationSize || "1-5",
        industry: formData.industry || "",
      });

      const { token, user } = response.data;

      // Store authentication data
      localStorage.setItem("hubstaff_token", token);
      localStorage.setItem("authToken", token);
      localStorage.setItem("hubstaff_user", JSON.stringify(user));

      // Call the onLogin callback
      onLogin(user);

      // Navigate to dashboard - admin registration is complete
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);

      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = errors.map((err) => err.msg || err.message).join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: "" };
    if (password.length < 6) return { strength: 1, text: "Too short" };
    if (password.length < 8) return { strength: 2, text: "Weak" };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 4, text: "Strong" };
    }
    return { strength: 3, text: "Good" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Create Your Organization
          </h1>
          <p className="text-blue-200">
            Start your team's productivity journey with TimeTrack Pro
          </p>
        </div>

        {/* Admin Registration Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg flex items-center space-x-3">
                <AlertCircle size={20} className="text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <User className="mr-2" size={20} />
                    Your Information
                  </h3>
                </div>

                {/* Full Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="block w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="block w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                      placeholder="Enter your email address"
                    />
                    {checkingEmail && (
                      <div className="absolute right-3 top-3">
                        <Loader2
                          className="animate-spin text-blue-400"
                          size={20}
                        />
                      </div>
                    )}
                  </div>
                  {emailAvailable === false && (
                    <p className="text-red-300 text-sm mt-1">
                      Email is already registered
                    </p>
                  )}
                  {emailAvailable === true && (
                    <p className="text-green-300 text-sm mt-1">
                      Email is available
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={6}
                      className="block w-full px-4 py-3 pr-12 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                      placeholder="Create a strong password"
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

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength.strength === 1
                                ? "bg-red-500 w-1/4"
                                : passwordStrength.strength === 2
                                ? "bg-yellow-500 w-2/4"
                                : passwordStrength.strength === 3
                                ? "bg-blue-500 w-3/4"
                                : passwordStrength.strength === 4
                                ? "bg-green-500 w-full"
                                : "w-0"
                            }`}
                          ></div>
                        </div>
                        <span
                          className={`text-xs ${
                            passwordStrength.strength <= 2
                              ? "text-red-300"
                              : passwordStrength.strength === 3
                              ? "text-blue-300"
                              : "text-green-300"
                          }`}
                        >
                          {passwordStrength.text}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Organization Information Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Building className="mr-2" size={20} />
                    Organization Details
                  </h3>
                </div>

                {/* Organization Name Field */}
                <div>
                  <label
                    htmlFor="organizationName"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Organization Name *
                  </label>
                  <div className="relative">
                    <input
                      id="organizationName"
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          organizationName: e.target.value,
                        })
                      }
                      required
                      className="block w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                      placeholder="Enter your organization name"
                    />
                    {checkingOrgName && (
                      <div className="absolute right-3 top-3">
                        <Loader2
                          className="animate-spin text-blue-400"
                          size={20}
                        />
                      </div>
                    )}
                  </div>
                  {orgNameAvailable === false && (
                    <p className="text-red-300 text-sm mt-1">
                      Organization name is already taken
                    </p>
                  )}
                  {orgNameAvailable === true && (
                    <p className="text-green-300 text-sm mt-1">
                      Organization name is available
                    </p>
                  )}
                </div>

                {/* Organization Description Field */}
                <div>
                  <label
                    htmlFor="organizationDescription"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="organizationDescription"
                    value={formData.organizationDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organizationDescription: e.target.value,
                      })
                    }
                    rows={3}
                    className="block w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                    placeholder="Brief description of your organization"
                  />
                </div>

                {/* Organization Size Field */}
                <div>
                  <label
                    htmlFor="organizationSize"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Team Size
                  </label>
                  <select
                    id="organizationSize"
                    value={formData.organizationSize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organizationSize: e.target.value,
                      })
                    }
                    className="block w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  >
                    <option value="" className="bg-gray-800">
                      Select team size
                    </option>
                    <option value="1-5" className="bg-gray-800">
                      1-5 people
                    </option>
                    <option value="6-15" className="bg-gray-800">
                      6-15 people
                    </option>
                    <option value="16-50" className="bg-gray-800">
                      16-50 people
                    </option>
                    <option value="51-100" className="bg-gray-800">
                      51-100 people
                    </option>
                    <option value="100+" className="bg-gray-800">
                      100+ people
                    </option>
                  </select>
                </div>

                {/* Industry Field */}
                <div>
                  <label
                    htmlFor="industry"
                    className="block text-sm font-medium text-white mb-2"
                  >
                    Industry
                  </label>
                  <input
                    id="industry"
                    type="text"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    className="block w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                    placeholder="e.g., Software Development, Marketing"
                  />
                </div>
              </div>
            </div>

            {/* Admin Role Notice */}
            <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-200 text-sm">
                    <span className="font-medium">Admin Account:</span> You'll
                    be the administrator of your organization with full
                    management capabilities including:
                  </p>
                  <ul className="text-blue-200 text-sm mt-2 space-y-1 ml-4">
                    <li>• Invite and manage team members</li>
                    <li>• Create and oversee projects</li>
                    <li>• Access all reports and analytics</li>
                    <li>• Configure organization settings</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Create Organization Button */}
            <button
              type="submit"
              disabled={
                loading ||
                emailAvailable === false ||
                orgNameAvailable === false
              }
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Creating your organization...
                </span>
              ) : (
                <span className="flex items-center">
                  Create Organization
                  <ArrowRight className="ml-2" size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-blue-200">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-white font-semibold hover:text-blue-200 transition-colors"
              >
                Sign in
              </Link>
            </p>
            <p className="text-blue-300 text-sm">
              Have an invitation?{" "}
              <Link
                to="/accept-invitation"
                className="text-white font-medium hover:text-blue-200 transition-colors"
              >
                Accept invitation here
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-blue-200 text-sm">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
              <span>Complete workspace setup</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
              <span>Invite unlimited team members</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
              <span>Start free • No credit card required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
