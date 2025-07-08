// frontend/src/pages/OrganizationChoicePage.js - NEW: Choose to create or join organization
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  ArrowRight,
  Building,
  CheckCircle,
  Loader2,
} from "lucide-react";

export const OrganizationChoicePage = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!selectedOption) return;

    setLoading(true);

    try {
      if (selectedOption === "create") {
        // Navigate to create organization page
        navigate("/create-organization");
      } else if (selectedOption === "join") {
        // Also navigate to create organization page (as per your requirement)
        navigate("/create-organization");
      }
    } catch (error) {
      console.error("Error:", error);
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
            How would you like to get started with TimeTrack Pro?
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          {/* Options */}
          <div className="space-y-6 mb-8">
            {/* Create Organization */}
            <div
              onClick={() => setSelectedOption("create")}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedOption === "create"
                  ? "border-blue-500 bg-blue-500/20 backdrop-blur-sm"
                  : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    selectedOption === "create"
                      ? "bg-blue-500 shadow-lg"
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
                    Start fresh and invite your team members
                  </p>
                </div>
                {selectedOption === "create" && (
                  <CheckCircle className="text-blue-400" size={24} />
                )}
              </div>

              {selectedOption === "create" && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="space-y-2">
                    <div className="flex items-center text-blue-200 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                      <span>Set up your organization details</span>
                    </div>
                    <div className="flex items-center text-blue-200 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                      <span>Invite team members later</span>
                    </div>
                    <div className="flex items-center text-blue-200 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                      <span>Full admin control</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Join Organization */}
            <div
              onClick={() => setSelectedOption("join")}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedOption === "join"
                  ? "border-purple-500 bg-purple-500/20 backdrop-blur-sm"
                  : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    selectedOption === "join"
                      ? "bg-purple-500 shadow-lg"
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
                    Join a team
                  </h3>
                  <p className="text-blue-200 mt-1">
                    Set up a workspace to collaborate with others
                  </p>
                </div>
                {selectedOption === "join" && (
                  <CheckCircle className="text-purple-400" size={24} />
                )}
              </div>

              {selectedOption === "join" && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="space-y-2">
                    <div className="flex items-center text-blue-200 text-sm">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                      <span>Create a workspace for your team</span>
                    </div>
                    <div className="flex items-center text-blue-200 text-sm">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                      <span>Invite collaborators</span>
                    </div>
                    <div className="flex items-center text-blue-200 text-sm">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-3"></div>
                      <span>Shared project management</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedOption || loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              selectedOption && !loading
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

          {/* Help Text */}
          {!selectedOption && (
            <p className="text-blue-300 text-sm mt-4 text-center">
              Choose an option above to continue setting up your workspace
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-blue-200 text-sm">
            Don't worry, you can always change these settings later in your
            dashboard
          </p>
        </div>
      </div>
    </div>
  );
};
