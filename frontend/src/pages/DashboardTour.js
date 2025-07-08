// frontend/src/components/DashboardTour.js - FIXED version
import React, { useState, useEffect } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Timer,
  Users,
  BarChart3,
  FolderOpen,
} from "lucide-react";

export const DashboardTour = ({ onComplete, show = true }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Show tour after a small delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const tourSteps = [
    {
      title: "Welcome to TimeTrack Pro! 🎉",
      description:
        "You've successfully created your workspace! Let's take a quick tour to get you started.",
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      position: "center",
    },
    {
      title: "Start Tracking Time",
      description:
        "Click the 'Start Timer' button in the header or dashboard to begin tracking time on your projects.",
      icon: Timer,
      color: "from-blue-500 to-blue-600",
      position: "center",
    },
    {
      title: "Monitor Your Stats",
      description:
        "These widgets show your hours worked, active projects, and productivity metrics at a glance.",
      icon: BarChart3,
      color: "from-purple-500 to-purple-600",
      position: "center",
    },
    {
      title: "Manage Team & Projects",
      description:
        "Use the sidebar to navigate to Projects, Team management, and Reports to organize your work.",
      icon: FolderOpen,
      color: "from-orange-500 to-orange-600",
      position: "center",
    },
    {
      title: "You're All Set!",
      description:
        "You're ready to start tracking time and managing projects. Explore the features and invite your team when ready!",
      icon: CheckCircle,
      color: "from-indigo-500 to-indigo-600",
      position: "center",
    },
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete && onComplete();
    }, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!show || !isVisible) return null;

  const currentTour = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9999] transition-opacity duration-300">
        {/* Tour Card */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 w-96 max-w-[90vw]">
          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="mb-8">
            {/* Icon */}
            <div
              className={`w-16 h-16 bg-gradient-to-r ${currentTour.color} rounded-2xl flex items-center justify-center mb-6 mx-auto`}
            >
              <currentTour.icon className="text-white" size={32} />
            </div>

            {/* Title and Description */}
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              {currentTour.title}
            </h3>
            <p className="text-gray-600 leading-relaxed text-center">
              {currentTour.description}
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStep + 1) / tourSteps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${((currentStep + 1) / tourSteps.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div>
              {!isFirstStep && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Skip tour
              </button>
              <button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <span>{isLastStep ? "Start Using App" : "Next"}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
