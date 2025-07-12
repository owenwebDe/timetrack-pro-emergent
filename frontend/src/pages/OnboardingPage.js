// frontend/src/pages/OnboardingPage.js - NEW: Use case selection after organization setup
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  DollarSign,
  Clock,
  Users,
  FileText,
  ArrowRight,
  CheckCircle,
  Target,
  Loader2,
} from "lucide-react";

export const OnboardingPage = () => {
  const [selectedUseCases, setSelectedUseCases] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const useCases = [
    {
      id: "productivity",
      title: "Monitor Team Productivity",
      description:
        "Track how your team spends time and identify productivity patterns",
      icon: BarChart3,
      color: "from-blue-500 to-blue-600",
      hoverColor: "from-blue-600 to-blue-700",
      features: [
        "Time tracking",
        "Activity monitoring",
        "Productivity reports",
        "Team insights",
      ],
    },
    {
      id: "payroll",
      title: "Manage Salary Payments",
      description:
        "Calculate accurate payroll based on tracked hours and rates",
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      hoverColor: "from-green-600 to-green-700",
      features: [
        "Hourly rate tracking",
        "Payroll reports",
        "Overtime calculation",
        "Payment summaries",
      ],
    },
    {
      id: "projects",
      title: "Track Project Time",
      description: "Monitor time spent on different projects and tasks",
      icon: Target,
      color: "from-purple-500 to-purple-600",
      hoverColor: "from-purple-600 to-purple-700",
      features: [
        "Project categorization",
        "Task breakdown",
        "Time allocation",
        "Progress tracking",
      ],
    },
    {
      id: "billing",
      title: "Client Billing",
      description: "Generate accurate invoices based on billable hours",
      icon: FileText,
      color: "from-orange-500 to-orange-600",
      hoverColor: "from-orange-600 to-orange-700",
      features: [
        "Billable hour tracking",
        "Invoice generation",
        "Client reports",
        "Rate management",
      ],
    },
    {
      id: "remote",
      title: "Remote Team Management",
      description: "Coordinate and manage distributed teams effectively",
      icon: Users,
      color: "from-indigo-500 to-indigo-600",
      hoverColor: "from-indigo-600 to-indigo-700",
      features: [
        "Remote monitoring",
        "Team collaboration",
        "Schedule coordination",
        "Communication tools",
      ],
    },
  ];

  const handleUseCaseToggle = (useCaseId) => {
    setSelectedUseCases((prev) =>
      prev.includes(useCaseId)
        ? prev.filter((id) => id !== useCaseId)
        : [...prev, useCaseId]
    );
  };

  const handleContinue = async () => {
    if (selectedUseCases.length > 0) {
      setLoading(true);

      try {
        // TODO: Save selected use cases to user preferences
        // await userAPI.updatePreferences({ useCases: selectedUseCases });
        console.log("Selected use cases:", selectedUseCases);

        // Move to success step
        setCurrentStep(1);
      } catch (error) {
        console.error("Error saving preferences:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGetStarted = () => {
    // Navigate to dashboard with selected use cases
    navigate("/dashboard");
  };

  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              You're all set!
            </h1>
            <p className="text-blue-200 text-lg mb-8">
              We've customized your dashboard based on your selected use cases
            </p>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-6">
                Your selected features:
              </h2>
              <div className="grid gap-4">
                {useCases
                  .filter((useCase) => selectedUseCases.includes(useCase.id))
                  .map((useCase) => (
                    <div
                      key={useCase.id}
                      className="flex items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm"
                    >
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${useCase.color} rounded-lg flex items-center justify-center mr-4 shadow-lg`}
                      >
                        <useCase.icon className="text-white" size={24} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-white">
                          {useCase.title}
                        </h3>
                        <p className="text-blue-200 text-sm">
                          {useCase.description}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-200 mb-4">
                Quick Start Tips:
              </h3>
              <ul className="text-blue-200 text-sm space-y-2 text-left">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Start your first timer to begin tracking time
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Invite team members to collaborate
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Set up projects and tasks for better organization
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  Check your dashboard for insights and reports
                </li>
              </ul>
            </div>

            <button
              onClick={handleGetStarted}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={20} />
            </button>
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

      <div className="relative z-10 w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Target className="text-white" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What's your primary goal?
          </h1>
          <p className="text-blue-200 text-lg">
            Select all that apply. We'll customize your experience accordingly.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-200 text-sm">Step 2 of 2</span>
            <span className="text-blue-200 text-sm">
              {selectedUseCases.length} selected
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {useCases.map((useCase) => {
            const isSelected = selectedUseCases.includes(useCase.id);

            return (
              <div
                key={useCase.id}
                onClick={() => handleUseCaseToggle(useCase.id)}
                className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  isSelected
                    ? "border-white bg-white/20 backdrop-blur-lg shadow-2xl"
                    : "border-white/20 bg-white/10 backdrop-blur-sm hover:border-white/40 hover:bg-white/15"
                }`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="text-green-400" size={24} />
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${
                    isSelected ? useCase.hoverColor : useCase.color
                  } rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-all duration-300`}
                >
                  <useCase.icon className="text-white" size={32} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3">
                  {useCase.title}
                </h3>
                <p className="text-blue-200 mb-6 leading-relaxed">
                  {useCase.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  {useCase.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                      <span className="text-blue-200">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={selectedUseCases.length === 0 || loading}
            className={`px-8 py-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 mx-auto ${
              selectedUseCases.length > 0 && !loading
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                : "bg-white/20 text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Setting up...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>

          {selectedUseCases.length === 0 && (
            <p className="text-blue-300 text-sm mt-4">
              Please select at least one use case to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
