// frontend/src/pages/HomePage.js
import React from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-white rounded-full opacity-30 animate-float animation-delay-${
              i * 1000
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <Header />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="animate-fadeInUp">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Time tracking software for the{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                  global workforce
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto leading-relaxed">
                Integrated time tracking, productivity metrics, and payroll for
                your distributed team. Start tracking time efficiently today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12 animate-fadeInUp animation-delay-500">
              <input
                type="email"
                placeholder="Enter your work email"
                className="px-6 py-4 w-full sm:w-96 rounded-xl border-2 border-blue-300 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400 text-gray-800 placeholder-gray-500 text-lg transition-all duration-300 shadow-lg"
              />
              <Link
                to="/signup"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 min-w-[200px]"
              >
                Create account
              </Link>
            </div>

            <div className="text-blue-200 text-lg space-x-6 animate-fadeInUp animation-delay-1000">
              <span className="inline-flex items-center">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Free 14-day trial
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                No credit card required
              </span>
              <span>•</span>
              <span className="inline-flex items-center">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Cancel anytime
              </span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center gap-8 mb-20">
              {[
                {
                  icon: "⏰",
                  text: "Global time tracking",
                  color: "from-blue-400 to-cyan-400",
                },
                {
                  icon: "📊",
                  text: "Productivity data",
                  color: "from-indigo-400 to-purple-400",
                },
                {
                  icon: "💰",
                  text: "Flexible payroll",
                  color: "from-green-400 to-emerald-400",
                },
                {
                  icon: "👥",
                  text: "Attendance management",
                  color: "from-pink-400 to-rose-400",
                },
                {
                  icon: "💡",
                  text: "Project cost and budgeting",
                  color: "from-yellow-400 to-orange-400",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 text-white bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 animate-slideInUp`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <span
                    className={`text-2xl p-2 rounded-full bg-gradient-to-r ${feature.color}`}
                  >
                    {feature.icon}
                  </span>
                  <span className="font-medium text-lg">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Dashboard Preview */}
            <div className="relative animate-fadeInUp animation-delay-1500">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl transform rotate-2 scale-105 opacity-20"></div>
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
                <img
                  src="https://images.unsplash.com/photo-1587401511935-a7f87afadf2f?w=1200&h=600&fit=crop"
                  alt="Dashboard Preview"
                  className="w-full rounded-xl shadow-2xl"
                />
                <div className="absolute top-6 right-6 animate-bounce">
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 border border-white/30">
                    <img
                      src="https://images.unsplash.com/photo-1545063328-c8e3faffa16f?w=200&h=400&fit=crop"
                      alt="Mobile App"
                      className="w-24 h-48 rounded-lg shadow-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-device Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fadeInUp">
              Multi-device time clock software
            </h2>
            <p className="text-xl text-blue-100 mb-16 max-w-3xl mx-auto leading-relaxed animate-fadeInUp animation-delay-300">
              Save hours each week with our easy-to-use employee time tracking.
              Then, convert desktop, web, mobile, or GPS time tracking data to
              automated timesheets.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Desktop",
                  description:
                    "Track time automatically with desktop apps for Windows, Mac, and Linux.",
                  image:
                    "https://images.unsplash.com/photo-1616175304583-ed54838016f3?w=400&h=300&fit=crop",
                  gradient: "from-blue-500 to-indigo-600",
                },
                {
                  title: "Web",
                  description:
                    "Access time tracking from any browser with our web-based platform.",
                  image:
                    "https://images.unsplash.com/photo-1555212697-194d092e3b8f?w=400&h=300&fit=crop",
                  gradient: "from-indigo-500 to-purple-600",
                },
                {
                  title: "Mobile",
                  description:
                    "Track time on the go with iOS and Android mobile apps.",
                  image:
                    "https://images.unsplash.com/photo-1655388333786-6b8270e2e154?w=400&h=300&fit=crop",
                  gradient: "from-purple-500 to-pink-600",
                },
              ].map((device, index) => (
                <div
                  key={index}
                  className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 animate-slideInUp`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="relative mb-6 group">
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${device.gradient} rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300`}
                    ></div>
                    <img
                      src={device.image}
                      alt={`${device.title} tracking`}
                      className="w-full h-48 object-cover rounded-xl relative z-10"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {device.title}
                  </h3>
                  <p className="text-blue-100 leading-relaxed">
                    {device.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-16 animate-fadeInUp">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                112,000+
              </span>{" "}
              businesses worldwide
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  number: "500k+",
                  label: "Active users",
                  color: "from-blue-400 to-cyan-400",
                },
                {
                  number: "21M+",
                  label: "Total hours tracked",
                  color: "from-indigo-400 to-purple-400",
                },
                {
                  number: "4M+",
                  label: "Tasks completed",
                  color: "from-green-400 to-emerald-400",
                },
                {
                  number: "300k+",
                  label: "Payments processed",
                  color: "from-pink-400 to-rose-400",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`text-center animate-countUp`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div
                    className={`text-4xl md:text-6xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 transform hover:scale-110 transition-transform duration-300`}
                  >
                    {stat.number}
                  </div>
                  <div className="text-blue-200 text-lg font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fadeInUp">
                Powerful{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  features
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              {[
                {
                  icon: "⏰",
                  title: "Time Tracking",
                  description:
                    "Automatic time tracking with detailed reports and analytics.",
                  gradient: "from-blue-500 to-indigo-600",
                },
                {
                  icon: "📊",
                  title: "Employee productivity",
                  description:
                    "Monitor activity levels and productivity metrics.",
                  gradient: "from-indigo-500 to-purple-600",
                },
                {
                  icon: "👥",
                  title: "Workforce management",
                  description: "Manage teams, projects, and tasks efficiently.",
                  gradient: "from-purple-500 to-pink-600",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 animate-slideInUp`}
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div
                    className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:rotate-12 transition-transform duration-300`}
                  >
                    <span className="text-3xl">{feature.icon}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-blue-100 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="animate-slideInLeft">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl transform -rotate-3 opacity-20"></div>
                  <img
                    src="https://images.unsplash.com/photo-1572205796404-7d40a79a98d6?w=600&h=500&fit=crop"
                    alt="Time tracking feature"
                    className="w-full rounded-2xl shadow-2xl relative z-10"
                  />
                </div>
              </div>
              <div className="animate-slideInRight">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    ⏰
                  </span>{" "}
                  Advanced Time Tracking
                </h3>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Smarter, streamlined employee time tracking for any type of
                  business. Track work hours, set limits, and get detailed
                  timesheets to review and approve with one simple tool.
                </p>
                <div className="space-y-4">
                  {[
                    "Automatic time tracking",
                    "Manual time entry",
                    "Detailed time tracking reports",
                    "Real-time productivity insights",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-blue-100 text-lg">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black/30 backdrop-blur-md text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center mb-8 animate-fadeInUp">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 transform hover:rotate-12 transition-transform duration-300">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="text-2xl font-bold">Hubworker</span>
            </div>
            <p className="text-blue-200 mb-8 text-lg">
              Time tracking software for the global workforce
            </p>
            <div className="flex justify-center space-x-8 animate-fadeInUp animation-delay-300">
              {[
                { to: "/login", text: "Login" },
                { to: "/signup", text: "Sign Up" },
                { href: "#", text: "Features" },
                { href: "#", text: "Pricing" },
              ].map((link, index) => (
                <div key={index}>
                  {link.to ? (
                    <Link
                      to={link.to}
                      className="text-blue-200 hover:text-white transition-colors duration-300 text-lg font-medium hover:underline"
                    >
                      {link.text}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-blue-200 hover:text-white transition-colors duration-300 text-lg font-medium hover:underline"
                    >
                      {link.text}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes countUp {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-slideInUp {
          animation: slideInUp 0.8s ease-out forwards;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out forwards;
        }

        .animate-slideInRight {
          animation: slideInRight 0.8s ease-out forwards;
        }

        .animate-countUp {
          animation: countUp 0.8s ease-out forwards;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }

        .animation-delay-500 {
          animation-delay: 500ms;
        }

        .animation-delay-1000 {
          animation-delay: 1000ms;
        }

        .animation-delay-1500 {
          animation-delay: 1500ms;
        }

        .animation-delay-2000 {
          animation-delay: 2000ms;
        }

        .animation-delay-4000 {
          animation-delay: 4000ms;
        }
      `}</style>
    </div>
  );
};
