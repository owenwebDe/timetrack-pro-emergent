// frontend/src/pages/CreateOrganizationPage.js - NEW: Create organization and go to dashboard with tour
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building,
  Users,
  ArrowRight,
  CheckCircle,
  Loader2,
  Globe,
  MapPin,
} from "lucide-react";

export const CreateOrganizationPage = () => {
  const [formData, setFormData] = useState({
    organizationName: "",
    teamSize: "",
    industry: "",
    timezone: "UTC-5",
    country: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: API call to create organization
      console.log("Creating organization:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Navigate to dashboard with tour parameter
      navigate("/dashboard?tour=true");
    } catch (error) {
      console.error("Error creating organization:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.organizationName.length > 0 &&
      formData.teamSize.length > 0 &&
      formData.industry.length > 0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building className="text-white" size={28} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Create your workspace
          </h1>
          <p className="text-blue-200">
            Tell us about your organization to get started
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name */}
            <div>
              <label
                htmlFor="organizationName"
                className="block text-sm font-medium text-white mb-2"
              >
                Organization name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
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
                  className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                  placeholder="e.g., Acme Corp, Marketing Agency"
                />
              </div>
            </div>

            {/* Team Size */}
            <div>
              <label
                htmlFor="teamSize"
                className="block text-sm font-medium text-white mb-2"
              >
                Team size *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="teamSize"
                  value={formData.teamSize}
                  onChange={(e) =>
                    setFormData({ ...formData, teamSize: e.target.value })
                  }
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="" className="bg-gray-800">
                    Select team size
                  </option>
                  <option value="just-me" className="bg-gray-800">
                    Just me
                  </option>
                  <option value="2-5" className="bg-gray-800">
                    2-5 people
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

            {/* Industry */}
            <div>
              <label
                htmlFor="industry"
                className="block text-sm font-medium text-white mb-2"
              >
                Industry *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="" className="bg-gray-800">
                    Select industry
                  </option>
                  <option value="technology" className="bg-gray-800">
                    Technology
                  </option>
                  <option value="marketing" className="bg-gray-800">
                    Marketing & Advertising
                  </option>
                  <option value="consulting" className="bg-gray-800">
                    Consulting
                  </option>
                  <option value="design" className="bg-gray-800">
                    Design & Creative
                  </option>
                  <option value="finance" className="bg-gray-800">
                    Finance
                  </option>
                  <option value="healthcare" className="bg-gray-800">
                    Healthcare
                  </option>
                  <option value="education" className="bg-gray-800">
                    Education
                  </option>
                  <option value="retail" className="bg-gray-800">
                    Retail
                  </option>
                  <option value="manufacturing" className="bg-gray-800">
                    Manufacturing
                  </option>
                  <option value="other" className="bg-gray-800">
                    Other
                  </option>
                </select>
              </div>
            </div>

            {/* Country */}
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-white mb-2"
              >
                Country
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-300"
                  placeholder="e.g., United States, Nigeria, United Kingdom"
                />
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-medium text-white mb-2"
              >
                Timezone
              </label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                className="block w-full px-3 py-3 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              >
                <option value="UTC-12" className="bg-gray-800">
                  UTC-12 (Baker Island)
                </option>
                <option value="UTC-11" className="bg-gray-800">
                  UTC-11 (Hawaii)
                </option>
                <option value="UTC-10" className="bg-gray-800">
                  UTC-10 (Alaska)
                </option>
                <option value="UTC-9" className="bg-gray-800">
                  UTC-9 (Pacific)
                </option>
                <option value="UTC-8" className="bg-gray-800">
                  UTC-8 (Pacific Standard)
                </option>
                <option value="UTC-7" className="bg-gray-800">
                  UTC-7 (Mountain)
                </option>
                <option value="UTC-6" className="bg-gray-800">
                  UTC-6 (Central)
                </option>
                <option value="UTC-5" className="bg-gray-800">
                  UTC-5 (Eastern)
                </option>
                <option value="UTC-4" className="bg-gray-800">
                  UTC-4 (Atlantic)
                </option>
                <option value="UTC-3" className="bg-gray-800">
                  UTC-3 (Brazil)
                </option>
                <option value="UTC-2" className="bg-gray-800">
                  UTC-2 (Mid-Atlantic)
                </option>
                <option value="UTC-1" className="bg-gray-800">
                  UTC-1 (Azores)
                </option>
                <option value="UTC+0" className="bg-gray-800">
                  UTC+0 (London, Dublin)
                </option>
                <option value="UTC+1" className="bg-gray-800">
                  UTC+1 (Paris, Berlin)
                </option>
                <option value="UTC+2" className="bg-gray-800">
                  UTC+2 (Cairo, Athens)
                </option>
                <option value="UTC+3" className="bg-gray-800">
                  UTC+3 (Moscow, Nairobi)
                </option>
                <option value="UTC+4" className="bg-gray-800">
                  UTC+4 (Dubai, Baku)
                </option>
                <option value="UTC+5" className="bg-gray-800">
                  UTC+5 (Karachi, Tashkent)
                </option>
                <option value="UTC+6" className="bg-gray-800">
                  UTC+6 (Dhaka, Almaty)
                </option>
                <option value="UTC+7" className="bg-gray-800">
                  UTC+7 (Bangkok, Jakarta)
                </option>
                <option value="UTC+8" className="bg-gray-800">
                  UTC+8 (Beijing, Singapore)
                </option>
                <option value="UTC+9" className="bg-gray-800">
                  UTC+9 (Tokyo, Seoul)
                </option>
                <option value="UTC+10" className="bg-gray-800">
                  UTC+10 (Sydney, Melbourne)
                </option>
                <option value="UTC+11" className="bg-gray-800">
                  UTC+11 (Solomon Islands)
                </option>
                <option value="UTC+12" className="bg-gray-800">
                  UTC+12 (New Zealand)
                </option>
              </select>
            </div>

            {/* What you'll get */}
            <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-4">
              <h4 className="font-semibold text-blue-200 mb-3">
                What you'll get:
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-blue-200 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  <span>Professional time tracking dashboard</span>
                </div>
                <div className="flex items-center text-blue-200 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  <span>Team management and project organization</span>
                </div>
                <div className="flex items-center text-blue-200 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  <span>Quick tour to get you started</span>
                </div>
              </div>
            </div>

            {/* Create Button */}
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                isFormValid() && !loading
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  : "bg-white/20 text-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Creating workspace...</span>
                </>
              ) : (
                <>
                  <span>Create workspace</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-blue-200 text-sm">
            You can invite team members and customize settings after setup
          </p>
        </div>
      </div>
    </div>
  );
};
