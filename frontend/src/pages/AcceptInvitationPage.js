// frontend/src/pages/AcceptInvitationPage.js - Enhanced invitation acceptance
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle,
  Building,
  Mail,
  UserCheck,
  Calendar,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { authAPI } from "../api/client";

export const AcceptInvitationPage = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    department: "",
    jobTitle: "",
  });
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verify invitation token on component mount
  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. No token provided.");
      setVerifying(false);
      return;
    }

    verifyInvitation();
  }, [token]);

  const verifyInvitation = async () => {
    try {
      setVerifying(true);
      const response = await authAPI.verifyInvitation(token);

      if (response.data.valid) {
        setInvitation(response.data.invitation);
      } else {
        setError("Invalid or expired invitation");
      }
    } catch (error) {
      console.error("Invitation verification error:", error);

      let errorMessage = "Failed to verify invitation";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.name || !formData.password) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.acceptInvitation(token, {
        name: formData.name,
        password: formData.password,
        department: formData.department,
        jobTitle: formData.jobTitle,
      });

      const { token: authToken, user } = response.data;

      // Store authentication data
      localStorage.setItem("hubstaff_token", authToken);
      localStorage.setItem("authToken", authToken);
      localStorage.setItem("hubstaff_user", JSON.stringify(user));

      // Call the onLogin callback
      onLogin(user);

      // Navigate to dashboard or onboarding
      if (user.requiresOnboarding) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Accept invitation error:", error);

      let errorMessage = "Failed to accept invitation. Please try again.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = errors.map((err) => err.msg || err.message).join(", ");
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

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "user":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTimeRemaining = (hoursUntilExpiry) => {
    if (hoursUntilExpiry <= 0) return "Expired";
    if (hoursUntilExpiry < 24) {
      return `${hoursUntilExpiry} hour${
        hoursUntilExpiry !== 1 ? "s" : ""
      } left`;
    }
    const days = Math.ceil(hoursUntilExpiry / 24);
    return `${days} day${days !== 1 ? "s" : ""} left`;
  };

  // Loading state for verification
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2
            className="animate-spin text-blue-400 mx-auto mb-4"
            size={48}
          />
          <h2 className="text-xl font-semibold text-white mb-2">
            Verifying Invitation
          </h2>
          <p className="text-blue-200">
            Please wait while we verify your invitation...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl text-center">
            <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-semibold text-white mb-2">
              Invalid Invitation
            </h2>
            <p className="text-red-200 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/signup")}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Organization
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-white/20 text-white py-2 px-4 rounded-lg hover:bg-white/30 transition-colors"
              >
                Sign In Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <UserCheck className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            You're Invited! 🎉
          </h1>
          <p className="text-blue-200">
            Complete your profile to join {invitation?.organizationName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invitation Details Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Mail className="mr-2" size={20} />
                Invitation Details
              </h3>

              {invitation && (
                <div className="space-y-4">
                  {/* Organization Info */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center mb-2">
                      <Building className="text-blue-400 mr-2" size={16} />
                      <span className="text-blue-200 text-sm font-medium">
                        Organization
                      </span>
                    </div>
                    <p className="text-white font-semibold">
                      {invitation.organizationName}
                    </p>
                  </div>

                  {/* Inviter Info */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center mb-2">
                      <User className="text-blue-400 mr-2" size={16} />
                      <span className="text-blue-200 text-sm font-medium">
                        Invited by
                      </span>
                    </div>
                    <p className="text-white font-semibold">
                      {invitation.inviterName}
                    </p>
                  </div>

                  {/* Role Assignment */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center mb-2">
                      <UserCheck className="text-blue-400 mr-2" size={16} />
                      <span className="text-blue-200 text-sm font-medium">
                        Your Role
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(
                        invitation.role
                      )}`}
                    >
                      {invitation.role.charAt(0).toUpperCase() +
                        invitation.role.slice(1)}
                    </span>
                  </div>

                  {/* Expiry Info */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center mb-2">
                      <Calendar className="text-blue-400 mr-2" size={16} />
                      <span className="text-blue-200 text-sm font-medium">
                        Expires
                      </span>
                    </div>
                    <p
                      className={`font-semibold ${
                        invitation.hoursUntilExpiry <= 24
                          ? "text-yellow-300"
                          : "text-white"
                      }`}
                    >
                      {getTimeRemaining(invitation.hoursUntilExpiry)}
                    </p>
                  </div>

                  {/* Personal Message */}
                  {invitation.message && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center mb-2">
                        <Mail className="text-blue-400 mr-2" size={16} />
                        <span className="text-blue-200 text-sm font-medium">
                          Message
                        </span>
                      </div>
                      <p className="text-white italic">
                        "{invitation.message}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
              <h3 className="text-xl font-semibold text-white mb-6">
                Create Your Account
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg flex items-center space-x-3">
                    <AlertCircle size={20} className="text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name Field */}
                  <div className="md:col-span-2">
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

                  {/* Email Field (Read-only) */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={invitation?.email || ""}
                      readOnly
                      className="block w-full px-4 py-3 border border-white/20 rounded-lg bg-white/5 backdrop-blur-sm text-gray-300 cursor-not-allowed"
                    />
                    <p className="text-blue-200 text-sm mt-1">
                      This email was specified in your invitation
                    </p>
                  </div>

                  {/* Job Title Field */}
                  <div>
                    <label
                      htmlFor="jobTitle"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Job Title
                    </label>
                    <input
                      id="jobTitle"
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, jobTitle: e.target.value })
                      }
                      className="block w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                      placeholder="e.g., Software Developer"
                    />
                  </div>

                  {/* Department Field */}
                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Department
                    </label>
                    <input
                      id="department"
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="block w-full px-4 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                      placeholder="e.g., Engineering"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="md:col-span-2">
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
                        placeholder="Create a secure password"
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

                {/* Role Information */}
                <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-200 text-sm">
                        <span className="font-medium">
                          You're joining as a {invitation?.role}:
                        </span>
                      </p>
                      <ul className="text-blue-200 text-sm mt-2 space-y-1 ml-4">
                        {invitation?.role === "admin" && (
                          <>
                            <li>• Full administrative access</li>
                            <li>• Manage team members and projects</li>
                            <li>• Access all reports and settings</li>
                          </>
                        )}
                        {invitation?.role === "manager" && (
                          <>
                            <li>• Create and manage projects</li>
                            <li>• Oversee team members</li>
                            <li>• Access detailed reports</li>
                          </>
                        )}
                        {invitation?.role === "user" && (
                          <>
                            <li>• Track time and manage tasks</li>
                            <li>• Work on assigned projects</li>
                            <li>• Collaborate with team members</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Accept Invitation Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Creating your account...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Accept Invitation & Join Team
                      <ArrowRight className="ml-2" size={16} />
                    </span>
                  )}
                </button>
              </form>

              {/* Alternative Actions */}
              <div className="mt-6 text-center space-y-3">
                <p className="text-blue-200 text-sm">
                  Not the right invitation?{" "}
                  <button
                    onClick={() => navigate("/signup")}
                    className="text-white font-medium hover:text-blue-200 transition-colors inline-flex items-center"
                  >
                    Create your own organization
                    <ExternalLink className="ml-1" size={12} />
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <p className="text-blue-200 text-sm">
              🔒 <span className="font-medium">Secure Invitation:</span> This
              invitation is specifically for {invitation?.email} and expires in{" "}
              {getTimeRemaining(invitation?.hoursUntilExpiry)}. Your data will
              be kept secure and private within your organization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
