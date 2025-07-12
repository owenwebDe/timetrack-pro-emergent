// frontend/src/pages/OrganizationSetupPage.js - NEW: Post-registration organization setup
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  ArrowRight,
  Building,
  Key,
  CheckCircle,
  Loader2,
} from "lucide-react";

export const OrganizationSetupPage = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSize, setOrgSize] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    setLoading(true);

    try {
      if (selectedOption === "join") {
        // Handle joining existing organization
        console.log("Joining with invite code:", inviteCode);
        // TODO: API call to join organization with invite code
        // await organizationAPI.joinWithCode(inviteCode);
      } else if (selectedOption === "create") {
        // Handle creating new organization
        console.log("Creating organization:", { orgName, orgSize });
        // TODO: API call to create new organization
        // await organizationAPI.create({ name: orgName, size: orgSize });
      }

      // Navigate to onboarding flow
      navigate("/onboarding");
    } catch (error) {
      console.error("Error setting up organization:", error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  const isValid = () => {
    if (selectedOption === "join") {
      return inviteCode.length >= 6;
    } else if (selectedOption === "create") {
      return orgName.length > 0 && orgSize.length > 0;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building className="text-white" size={28} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Set up your workspace
          </h1>
          <p className="text-blue-200">
            Choose how you'd like to get started with TimeTrack Pro
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          {/* Options */}
          <div className="space-y-6 mb-8">
            {/* Join Organization */}
            <div
              onClick={() => setSelectedOption("join")}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedOption === "join"
                  ? "border-blue-500 bg-blue-500/20 backdrop-blur-sm"
                  : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    selectedOption === "join"
                      ? "bg-blue-500 shadow-lg"
                      : "bg-white/20"
                  }`}
                >
                  <Users
                    className={`${
                      selectedOption === "join" ? "text-white" : "text-blue-200"
                    }`}
                    size={24}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">
                    Join existing workspace
                  </h3>
                  <p className="text-blue-200 mt-1">
                    You have an invite code from your team
                  </p>
                </div>
                {selectedOption === "join" && (
                  <CheckCircle className="text-blue-400" size={24} />
                )}
              </div>

              {selectedOption === "join" && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Enter your invite code"
                      className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                    />
                  </div>
                  <p className="text-blue-200 text-sm mt-2">
                    Ask your team admin for the invite code
                  </p>
                </div>
              )}
            </div>

            {/* Create Organization */}
            <div
              onClick={() => setSelectedOption("create")}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedOption === "create"
                  ? "border-purple-500 bg-purple-500/20 backdrop-blur-sm"
                  : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    selectedOption === "create"
                      ? "bg-purple-500 shadow-lg"
                      : "bg-white/20"
                  }`}
                >
                  <Plus
                    className={`${
                      selectedOption === "create"
                        ? "text-white"
                        : "text-blue-200"
                    }`}
                    size={24}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">
                    Create new workspace
                  </h3>
                  <p className="text-blue-200 mt-1">
                    Start fresh with your own team
                  </p>
                </div>
                {selectedOption === "create" && (
                  <CheckCircle className="text-purple-400" size={24} />
                )}
              </div>

              {selectedOption === "create" && (
                <div className="mt-6 pt-6 border-t border-white/20 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g., Acme Corp"
                      className="block w-full px-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Team Size
                    </label>
                    <select
                      value={orgSize}
                      onChange={(e) => setOrgSize(e.target.value)}
                      className="block w-full px-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
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
                </div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!isValid() || loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              isValid() && !loading
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                : "bg-white/20 text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Setting up...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-blue-200 text-sm">
              By continuing, you agree to our{" "}
              <a href="#" className="text-white hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-white hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
