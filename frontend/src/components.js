// import React, { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { format } from "date-fns";
// import {
//   authAPI,
//   usersAPI,
//   projectsAPI,
//   timeTrackingAPI,
//   analyticsAPI,
//   integrationsAPI,
// } from "./api/client";
// import { useWebSocket } from "./hooks/useWebSocket";
// import {
//   ProductivityChart,
//   TimeTrackingChart,
//   ProjectBreakdownChart,
//   TeamPerformanceChart,
// } from "./components/Charts";
// import { login } from "../src/utils/api";
// import { register } from "../src/utils/api";

// // Header Component
// const Header = ({ user, onLogout, currentPage }) => {
//   const { notifications, markNotificationAsRead } = useWebSocket(user);
//   const [showNotifications, setShowNotifications] = useState(false);

//   return (
//     <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           <div className="flex items-center">
//             <Link to="/" className="flex items-center">
//               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
//                 <span className="text-white font-bold text-lg">H</span>
//               </div>
//               <span className="text-xl font-bold text-gray-900">Hubworker</span>
//             </Link>
//           </div>

//           {user ? (
//             <div className="flex items-center space-x-4">
//               <span className="text-gray-700">{currentPage}</span>

//               {/* Notifications */}
//               <div className="relative">
//                 <button
//                   onClick={() => setShowNotifications(!showNotifications)}
//                   className="relative p-2 text-gray-600 hover:text-gray-900"
//                 >
//                   🔔
//                   {notifications.length > 0 && (
//                     <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                       {notifications.length}
//                     </span>
//                   )}
//                 </button>

//                 {showNotifications && (
//                   <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
//                     <div className="p-4 border-b border-gray-200">
//                       <h3 className="font-semibold text-gray-900">
//                         Notifications
//                       </h3>
//                     </div>
//                     <div className="max-h-64 overflow-y-auto">
//                       {notifications.length === 0 ? (
//                         <p className="p-4 text-gray-500 text-center">
//                           No new notifications
//                         </p>
//                       ) : (
//                         notifications.map((notification) => (
//                           <div
//                             key={notification.id}
//                             className="p-3 border-b border-gray-100 hover:bg-gray-50"
//                           >
//                             <p className="text-sm text-gray-900">
//                               {notification.message}
//                             </p>
//                             <p className="text-xs text-gray-500">
//                               {format(notification.timestamp, "PPp")}
//                             </p>
//                             <button
//                               onClick={() =>
//                                 markNotificationAsRead(notification.id)
//                               }
//                               className="text-xs text-blue-600 hover:text-blue-800 mt-1"
//                             >
//                               Mark as read
//                             </button>
//                           </div>
//                         ))
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <div className="relative">
//                 <div className="flex items-center space-x-2">
//                   <img
//                     src={
//                       user.avatar ||
//                       "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
//                     }
//                     alt={user.name}
//                     className="w-8 h-8 rounded-full"
//                   />
//                   <span className="text-gray-700">{user.name}</span>
//                   <button
//                     onClick={onLogout}
//                     className="text-gray-500 hover:text-gray-700 ml-2"
//                   >
//                     Logout
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="flex items-center space-x-4">
//               <Link to="/login" className="text-gray-700 hover:text-gray-900">
//                 Sign in
//               </Link>
//               <Link
//                 to="/signup"
//                 className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
//               >
//                 Register
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// };

// // Sidebar Component
// const Sidebar = ({ currentPage }) => {
//   const menuItems = [
//     { name: "Dashboard", icon: "📊", path: "/dashboard" },
//     { name: "Time Tracking", icon: "⏰", path: "/time-tracking" },
//     { name: "Team", icon: "👥", path: "/team" },
//     { name: "Projects", icon: "📁", path: "/projects" },
//     { name: "Reports", icon: "📈", path: "/reports" },
//     { name: "Integrations", icon: "🔗", path: "/integrations" },
//     { name: "Settings", icon: "⚙️", path: "/settings" },
//   ];

//   return (
//     <div className="w-64 bg-white shadow-sm h-screen fixed left-0 top-16 border-r border-gray-200">
//       <nav className="mt-8">
//         <div className="px-4 space-y-2">
//           {menuItems.map((item) => (
//             <Link
//               key={item.name}
//               to={item.path}
//               className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
//                 currentPage === item.name
//                   ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
//                   : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
//               }`}
//             >
//               <span className="mr-3">{item.icon}</span>
//               {item.name}
//             </Link>
//           ))}
//         </div>
//       </nav>
//     </div>
//   );
// };

// // Enhanced Timer Component
// const Timer = ({ activeEntry, onStart, onStop, onReset }) => {
//   const [time, setTime] = useState(0);
//   const [isRunning, setIsRunning] = useState(false);

//   useEffect(() => {
//     if (activeEntry) {
//       const startTime = new Date(activeEntry.start_time);
//       const now = new Date();
//       const elapsed = Math.floor((now - startTime) / 1000);
//       setTime(elapsed);
//       setIsRunning(true);
//     } else {
//       setTime(0);
//       setIsRunning(false);
//     }
//   }, [activeEntry]);

//   useEffect(() => {
//     let interval;
//     if (isRunning) {
//       interval = setInterval(() => {
//         setTime((time) => time + 1);
//       }, 1000);
//     }
//     return () => clearInterval(interval);
//   }, [isRunning]);

//   const formatTime = (seconds) => {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const remainingSeconds = seconds % 60;
//     return `${hours.toString().padStart(2, "0")}:${minutes
//       .toString()
//       .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
//   };

//   const handleStart = async () => {
//     try {
//       await onStart();
//       setIsRunning(true);
//     } catch (error) {
//       console.error("Failed to start timer:", error);
//     }
//   };

//   const handleStop = async () => {
//     try {
//       if (activeEntry) {
//         await onStop(activeEntry.id);
//         setIsRunning(false);
//         setTime(0);
//       }
//     } catch (error) {
//       console.error("Failed to stop timer:", error);
//     }
//   };

//   const handleReset = () => {
//     setTime(0);
//     setIsRunning(false);
//     onReset();
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//       <div className="text-center">
//         <div className="text-4xl font-mono font-bold text-gray-900 mb-4 timer-display">
//           {formatTime(time)}
//         </div>
//         <div className="flex justify-center space-x-4">
//           {!isRunning ? (
//             <button
//               onClick={handleStart}
//               className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 flex items-center btn-primary"
//             >
//               <span className="mr-2">▶️</span>
//               Start
//             </button>
//           ) : (
//             <button
//               onClick={handleStop}
//               className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 flex items-center"
//             >
//               <span className="mr-2">⏸️</span>
//               Stop
//             </button>
//           )}
//           <button
//             onClick={handleReset}
//             className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 flex items-center"
//           >
//             <span className="mr-2">🔄</span>
//             Reset
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Dashboard Widget Component
// const DashboardWidget = ({ title, value, subtitle, icon, color = "blue" }) => {
//   return (
//     <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 card-hover">
//       <div className="flex items-center">
//         <div className={`p-3 rounded-lg bg-${color}-100`}>
//           <span className="text-2xl">{icon}</span>
//         </div>
//         <div className="ml-4">
//           <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
//           <p className="text-2xl font-bold text-gray-900">{value}</p>
//           <p className="text-sm text-gray-500">{subtitle}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// // HomePage Component
// export const HomePage = () => {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 bg-pattern">
//       <Header />

//       {/* Hero Section */}
//       <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto text-center">
//           <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 hero-text">
//             Time tracking software for the{" "}
//             <span className="text-gradient">global workforce</span>
//           </h1>
//           <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
//             Integrated time tracking, productivity metrics, and payroll for your
//             distributed team.
//           </p>

//           <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
//             <input
//               type="email"
//               placeholder="Enter your work email"
//               className="px-4 py-3 w-full sm:w-80 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 input-focus"
//             />
//             <Link
//               to="/signup"
//               className="bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors btn-primary"
//             >
//               Create account
//             </Link>
//           </div>

//           <div className="text-blue-100 text-sm space-x-4">
//             <span>Free 14-day trial</span>
//             <span>•</span>
//             <span>No credit card required</span>
//             <span>•</span>
//             <span>Cancel anytime</span>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-16 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex flex-wrap justify-center gap-8 mb-16">
//             <div className="flex items-center space-x-2 text-white">
//               <span className="text-blue-300">⏰</span>
//               <span>Global time tracking</span>
//             </div>
//             <div className="flex items-center space-x-2 text-white">
//               <span className="text-blue-300">📊</span>
//               <span>Productivity data</span>
//             </div>
//             <div className="flex items-center space-x-2 text-white">
//               <span className="text-blue-300">💰</span>
//               <span>Flexible payroll</span>
//             </div>
//             <div className="flex items-center space-x-2 text-white">
//               <span className="text-blue-300">👥</span>
//               <span>Attendance management</span>
//             </div>
//             <div className="flex items-center space-x-2 text-white">
//               <span className="text-blue-300">💡</span>
//               <span>Project cost and budgeting</span>
//             </div>
//           </div>

//           {/* Dashboard Preview */}
//           <div className="relative">
//             <img
//               src="https://images.unsplash.com/photo-1587401511935-a7f87afadf2f?w=1200&h=600&fit=crop"
//               alt="Dashboard Preview"
//               className="w-full rounded-lg shadow-2xl shadow-custom-lg"
//             />
//             <div className="absolute top-4 right-4">
//               <img
//                 src="https://images.unsplash.com/photo-1545063328-c8e3faffa16f?w=300&h=600&fit=crop"
//                 alt="Mobile App"
//                 className="w-32 h-64 rounded-lg shadow-xl"
//               />
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Multi-device Section */}
//       <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black bg-opacity-20">
//         <div className="max-w-7xl mx-auto text-center">
//           <h2 className="text-3xl font-bold text-white mb-4">
//             Multi-device time clock software
//           </h2>
//           <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
//             Save hours each week with our easy-to-use employee time tracking.
//             Then, convert desktop, web, mobile, or GPS time tracking data to
//             automated timesheets.
//           </p>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             <div className="text-center feature-card p-6 rounded-lg">
//               <img
//                 src="https://images.unsplash.com/photo-1616175304583-ed54838016f3?w=300&h=200&fit=crop"
//                 alt="Desktop tracking"
//                 className="w-full h-48 object-cover rounded-lg mb-4"
//               />
//               <h3 className="text-xl font-semibold text-white mb-2">Desktop</h3>
//               <p className="text-blue-100">
//                 Track time automatically with desktop apps for Windows, Mac, and
//                 Linux.
//               </p>
//             </div>

//             <div className="text-center feature-card p-6 rounded-lg">
//               <img
//                 src="https://images.unsplash.com/photo-1555212697-194d092e3b8f?w=300&h=200&fit=crop"
//                 alt="Web tracking"
//                 className="w-full h-48 object-cover rounded-lg mb-4"
//               />
//               <h3 className="text-xl font-semibold text-white mb-2">Web</h3>
//               <p className="text-blue-100">
//                 Access time tracking from any browser with our web-based
//                 platform.
//               </p>
//             </div>

//             <div className="text-center feature-card p-6 rounded-lg">
//               <img
//                 src="https://images.unsplash.com/photo-1655388333786-6b8270e2e154?w=300&h=200&fit=crop"
//                 alt="Mobile tracking"
//                 className="w-full h-48 object-cover rounded-lg mb-4"
//               />
//               <h3 className="text-xl font-semibold text-white mb-2">Mobile</h3>
//               <p className="text-blue-100">
//                 Track time on the go with iOS and Android mobile apps.
//               </p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Stats Section */}
//       <section className="py-16 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto text-center">
//           <h2 className="text-3xl font-bold text-white mb-12">
//             Time tracking & productivity metrics trusted by 112,000+ businesses
//           </h2>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
//             <div className="text-center">
//               <div className="text-4xl font-bold text-white mb-2">500k+</div>
//               <div className="text-blue-100">Active users</div>
//             </div>
//             <div className="text-center">
//               <div className="text-4xl font-bold text-white mb-2">21M+</div>
//               <div className="text-blue-100">Total hours tracked</div>
//             </div>
//             <div className="text-center">
//               <div className="text-4xl font-bold text-white mb-2">4M+</div>
//               <div className="text-blue-100">Tasks completed</div>
//             </div>
//             <div className="text-center">
//               <div className="text-4xl font-bold text-white mb-2">300k+</div>
//               <div className="text-blue-100">Payments</div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Grid */}
//       <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
//         <div className="max-w-7xl mx-auto">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl font-bold text-gray-900 mb-4">
//               Groups of <span className="text-blue-600">features</span>
//             </h2>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
//             <div className="text-center">
//               <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-2xl">⏰</span>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                 Time Tracking
//               </h3>
//               <p className="text-gray-600">
//                 Automatic time tracking with detailed reports and analytics.
//               </p>
//             </div>

//             <div className="text-center">
//               <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-2xl">📊</span>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                 Employee productivity
//               </h3>
//               <p className="text-gray-600">
//                 Monitor activity levels and productivity metrics.
//               </p>
//             </div>

//             <div className="text-center">
//               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <span className="text-2xl">👥</span>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                 Workforce management
//               </h3>
//               <p className="text-gray-600">
//                 Manage teams, projects, and tasks efficiently.
//               </p>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
//             <div>
//               <img
//                 src="https://images.unsplash.com/photo-1572205796404-7d40a79a98d6?w=500&h=400&fit=crop"
//                 alt="Time tracking feature"
//                 className="w-full rounded-lg shadow-lg"
//               />
//             </div>
//             <div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-4">
//                 <span className="text-blue-600">⏰</span> Time tracking
//               </h3>
//               <p className="text-gray-600 mb-6">
//                 Smarter, streamlined employee time tracking for any type of
//                 business. Track work hours, set limits, and get detailed
//                 timesheets to review and approve with one simple tool.
//               </p>
//               <div className="space-y-4">
//                 <div className="flex items-center space-x-3">
//                   <span className="text-blue-600">✓</span>
//                   <span className="text-gray-700">Automatic time tracking</span>
//                 </div>
//                 <div className="flex items-center space-x-3">
//                   <span className="text-blue-600">✓</span>
//                   <span className="text-gray-700">Manual time entry</span>
//                 </div>
//                 <div className="flex items-center space-x-3">
//                   <span className="text-blue-600">✓</span>
//                   <span className="text-gray-700">Time tracking reports</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto text-center">
//           <div className="flex items-center justify-center mb-8">
//             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
//               <span className="text-white font-bold text-lg">H</span>
//             </div>
//             <span className="text-xl font-bold">Hubworker</span>
//           </div>
//           <p className="text-gray-400 mb-8">
//             Time tracking software for the global workforce
//           </p>
//           <div className="flex justify-center space-x-8">
//             <Link to="/login" className="text-gray-400 hover:text-white">
//               Login
//             </Link>
//             <Link to="/signup" className="text-gray-400 hover:text-white">
//               Sign Up
//             </Link>
//             <a href="#" className="text-gray-400 hover:text-white">
//               Features
//             </a>
//             <a href="#" className="text-gray-400 hover:text-white">
//               Pricing
//             </a>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export const LoginPage = ({ onLogin }) => {
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       // Use the new login function from our API utility
//       const response = await login(formData);

//       // The response structure from your backend is: { message, user, token }
//       const { token, user } = response;

//       // Store token using the correct key that matches your backend
//       localStorage.setItem("hubstaff_token", token);
//       localStorage.setItem("authToken", token); // Also store with the key our API utility expects
//       localStorage.setItem("hubstaff_user", JSON.stringify(user));

//       // Call the onLogin callback
//       onLogin(user);

//       // Navigate to dashboard
//       navigate("/dashboard");
//     } catch (error) {
//       // Handle different types of errors
//       console.error("Login error:", error);

//       let errorMessage = "Login failed. Please try again.";

//       if (error.message) {
//         errorMessage = error.message;
//       } else if (error.response?.data?.error) {
//         errorMessage = error.response.data.error;
//       } else if (error.response?.data?.detail) {
//         errorMessage = error.response.data.detail;
//       }

//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center px-4">
//       <div className="max-w-md w-full space-y-8">
//         <div className="text-center">
//           <div className="flex items-center justify-center mb-8">
//             <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
//               <span className="text-white font-bold text-xl">H</span>
//             </div>
//             <span className="text-2xl font-bold text-white">Hubworker</span>
//           </div>
//           <h2 className="text-3xl font-bold text-white">
//             Sign in to your account
//           </h2>
//         </div>

//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//           {error && (
//             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//               {error}
//             </div>
//           )}

//           <div>
//             <label
//               htmlFor="email"
//               className="block text-sm font-medium text-white"
//             >
//               Email address
//             </label>
//             <input
//               id="email"
//               type="email"
//               value={formData.email}
//               onChange={(e) =>
//                 setFormData({ ...formData, email: e.target.value })
//               }
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="password"
//               className="block text-sm font-medium text-white"
//             >
//               Password
//             </label>
//             <input
//               id="password"
//               type="password"
//               value={formData.password}
//               onChange={(e) =>
//                 setFormData({ ...formData, password: e.target.value })
//               }
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//           >
//             {loading ? "Signing in..." : "Sign in"}
//           </button>
//         </form>

//         <div className="text-center">
//           <p className="text-blue-100">
//             Don't have an account?{" "}
//             <Link
//               to="/signup"
//               className="text-white font-semibold hover:underline"
//             >
//               Sign up for free
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };
// // SignupPage Component
// export const SignupPage = ({ onLogin }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     company: "",
//     role: "user", // Add role field required by your backend
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       // Use the new register function from our API utility
//       const response = await register(formData);

//       // The response structure from your backend is: { message, user, token }
//       const { token, user } = response;

//       // Store token using the correct key that matches your backend
//       localStorage.setItem("hubstaff_token", token);
//       localStorage.setItem("authToken", token); // Also store with the key our API utility expects
//       localStorage.setItem("hubstaff_user", JSON.stringify(user));

//       // Call the onLogin callback
//       onLogin(user);

//       // Navigate to dashboard
//       navigate("/dashboard");
//     } catch (error) {
//       // Handle different types of errors
//       console.error("Registration error:", error);

//       let errorMessage = "Registration failed. Please try again.";

//       if (error.message) {
//         errorMessage = error.message;
//       } else if (error.response?.data?.error) {
//         errorMessage = error.response.data.error;
//       } else if (error.response?.data?.errors) {
//         // Handle validation errors array from express-validator
//         const errors = error.response.data.errors;
//         errorMessage = errors.map((err) => err.msg).join(", ");
//       } else if (error.response?.data?.detail) {
//         errorMessage = error.response.data.detail;
//       }

//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center px-4">
//       <div className="max-w-md w-full space-y-8">
//         <div className="text-center">
//           <div className="flex items-center justify-center mb-8">
//             <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
//               <span className="text-white font-bold text-xl">H</span>
//             </div>
//             <span className="text-2xl font-bold text-white">Hubworker</span>
//           </div>
//           <h2 className="text-3xl font-bold text-white">Create your account</h2>
//           <p className="text-blue-100 mt-2">Start your free 14-day trial</p>
//         </div>

//         <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//           {error && (
//             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//               {error}
//             </div>
//           )}

//           <div>
//             <label
//               htmlFor="name"
//               className="block text-sm font-medium text-white"
//             >
//               Full name
//             </label>
//             <input
//               id="name"
//               type="text"
//               value={formData.name}
//               onChange={(e) =>
//                 setFormData({ ...formData, name: e.target.value })
//               }
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="email"
//               className="block text-sm font-medium text-white"
//             >
//               Work email
//             </label>
//             <input
//               id="email"
//               type="email"
//               value={formData.email}
//               onChange={(e) =>
//                 setFormData({ ...formData, email: e.target.value })
//               }
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="company"
//               className="block text-sm font-medium text-white"
//             >
//               Company name
//             </label>
//             <input
//               id="company"
//               type="text"
//               value={formData.company}
//               onChange={(e) =>
//                 setFormData({ ...formData, company: e.target.value })
//               }
//               required
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="password"
//               className="block text-sm font-medium text-white"
//             >
//               Password
//             </label>
//             <input
//               id="password"
//               type="password"
//               value={formData.password}
//               onChange={(e) =>
//                 setFormData({ ...formData, password: e.target.value })
//               }
//               required
//               minLength={6}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//             />
//             <p className="mt-1 text-sm text-blue-100">
//               Password must be at least 6 characters long
//             </p>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//           >
//             {loading ? "Creating account..." : "Start free trial"}
//           </button>
//         </form>

//         <div className="text-center">
//           <p className="text-blue-100">
//             Already have an account?{" "}
//             <Link
//               to="/login"
//               className="text-white font-semibold hover:underline"
//             >
//               Sign in
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// // DashboardPage Component
// export const DashboardPage = ({ user, onLogout }) => {
//   const [dashboardData, setDashboardData] = useState({
//     widgets: [],
//     teamActivity: [],
//     recentProjects: [],
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       const [analyticsResponse, usersResponse, projectsResponse] =
//         await Promise.all([
//           analyticsAPI.getDashboardAnalytics(),
//           usersAPI.getUsers({ limit: 10 }),
//           projectsAPI.getProjects({ limit: 5 }),
//         ]);

//       const analytics = analyticsResponse.data;
//       const users = usersResponse.data;
//       const projects = projectsResponse.data;

//       const widgets = [
//         {
//           title: "Hours Worked",
//           value: `${analytics.user_stats?.total_hours || 0}h`,
//           subtitle: "This month",
//           icon: "⏰",
//           color: "blue",
//         },
//         {
//           title: "Active Workers",
//           value: users.filter((u) => u.status === "active").length,
//           subtitle: "Right now",
//           icon: "👥",
//           color: "green",
//         },
//         {
//           title: "Projects",
//           value: projects.length,
//           subtitle: "Active projects",
//           icon: "📁",
//           color: "purple",
//         },
//         {
//           title: "Activity Level",
//           value: `${Math.round(analytics.user_stats?.avg_activity || 0)}%`,
//           subtitle: "This week",
//           icon: "📊",
//           color: "orange",
//         },
//       ];

//       setDashboardData({
//         widgets,
//         teamActivity: users,
//         recentProjects: projects,
//       });
//     } catch (error) {
//       console.error("Failed to fetch dashboard data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Header user={user} onLogout={onLogout} currentPage="Dashboard" />
//         <div className="flex">
//           <Sidebar currentPage="Dashboard" />
//           <main className="flex-1 ml-64 p-8">
//             <div className="max-w-7xl mx-auto">
//               <div className="flex items-center justify-center h-64">
//                 <div className="spinner"></div>
//               </div>
//             </div>
//           </main>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header user={user} onLogout={onLogout} currentPage="Dashboard" />
//       <div className="flex">
//         <Sidebar currentPage="Dashboard" />

//         <main className="flex-1 ml-64 p-8">
//           <div className="max-w-7xl mx-auto">
//             <div className="mb-8">
//               <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
//               <p className="text-gray-600 mt-2">
//                 Welcome back, {user.name}! Here's what's happening with your
//                 team today.
//               </p>
//             </div>

//             {/* Stats Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//               {dashboardData.widgets.map((widget, index) => (
//                 <DashboardWidget key={index} {...widget} />
//               ))}
//             </div>

//             {/* Recent Activity */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//               <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   Team Activity
//                 </h3>
//                 <div className="space-y-4">
//                   {dashboardData.teamActivity.slice(0, 4).map((user) => (
//                     <div key={user.id} className="flex items-center space-x-3">
//                       <img
//                         src={
//                           user.avatar ||
//                           "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
//                         }
//                         alt={user.name}
//                         className="w-10 h-10 rounded-full"
//                       />
//                       <div className="flex-1">
//                         <div className="flex items-center justify-between">
//                           <h4 className="font-medium text-gray-900">
//                             {user.name}
//                           </h4>
//                           <span
//                             className={`px-2 py-1 text-xs rounded-full ${
//                               user.status === "active"
//                                 ? "bg-green-100 text-green-800"
//                                 : "bg-yellow-100 text-yellow-800"
//                             }`}
//                           >
//                             {user.status}
//                           </span>
//                         </div>
//                         <p className="text-sm text-gray-500">{user.role}</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   Recent Projects
//                 </h3>
//                 <div className="space-y-4">
//                   {dashboardData.recentProjects.map((project) => (
//                     <div
//                       key={project.id}
//                       className="border-l-4 border-blue-500 pl-4"
//                     >
//                       <div className="flex items-center justify-between">
//                         <h4 className="font-medium text-gray-900">
//                           {project.name}
//                         </h4>
//                         <span
//                           className={`px-2 py-1 text-xs rounded-full ${
//                             project.status === "active"
//                               ? "bg-green-100 text-green-800"
//                               : "bg-gray-100 text-gray-800"
//                           }`}
//                         >
//                           {project.status}
//                         </span>
//                       </div>
//                       <p className="text-sm text-gray-500">{project.client}</p>
//                       <p className="text-sm text-gray-600">
//                         {project.hours_tracked || 0} hours tracked
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// // TimeTrackingPage Component
// export const TimeTrackingPage = ({ user, onLogout }) => {
//   const [activeEntry, setActiveEntry] = useState(null);
//   const [projects, setProjects] = useState([]);
//   const [tasks, setTasks] = useState([]);
//   const [selectedProject, setSelectedProject] = useState("");
//   const [selectedTask, setSelectedTask] = useState("");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [activeResponse, projectsResponse] = await Promise.all([
//         timeTrackingAPI.getActiveEntry(),
//         projectsAPI.getProjects(),
//       ]);

//       setActiveEntry(activeResponse.data);
//       setProjects(projectsResponse.data);
//     } catch (error) {
//       console.error("Failed to fetch time tracking data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStart = async () => {
//     if (!selectedProject) {
//       alert("Please select a project first");
//       return;
//     }

//     try {
//       const response = await timeTrackingAPI.startTracking({
//         project_id: selectedProject,
//         task_id: selectedTask || null,
//         description: "Working on project",
//       });
//       setActiveEntry(response.data);
//     } catch (error) {
//       console.error("Failed to start tracking:", error);
//     }
//   };

//   const handleStop = async (entryId) => {
//     try {
//       await timeTrackingAPI.stopTracking(entryId);
//       setActiveEntry(null);
//     } catch (error) {
//       console.error("Failed to stop tracking:", error);
//     }
//   };

//   const handleReset = () => {
//     // Reset local state only
//     setSelectedProject("");
//     setSelectedTask("");
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Header user={user} onLogout={onLogout} currentPage="Time Tracking" />
//         <div className="flex">
//           <Sidebar currentPage="Time Tracking" />
//           <main className="flex-1 ml-64 p-8">
//             <div className="flex items-center justify-center h-64">
//               <div className="spinner"></div>
//             </div>
//           </main>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header user={user} onLogout={onLogout} currentPage="Time Tracking" />
//       <div className="flex">
//         <Sidebar currentPage="Time Tracking" />

//         <main className="flex-1 ml-64 p-8">
//           <div className="max-w-4xl mx-auto">
//             <div className="mb-8">
//               <h1 className="text-3xl font-bold text-gray-900">
//                 Time Tracking
//               </h1>
//               <p className="text-gray-600 mt-2">
//                 Track your time and manage your tasks efficiently.
//               </p>
//             </div>

//             {/* Timer Section */}
//             <div className="mb-8">
//               <Timer
//                 activeEntry={activeEntry}
//                 onStart={handleStart}
//                 onStop={handleStop}
//                 onReset={handleReset}
//               />
//             </div>

//             {/* Project and Task Selection */}
//             <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                 What are you working on?
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Project
//                   </label>
//                   <select
//                     value={selectedProject}
//                     onChange={(e) => setSelectedProject(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select a project</option>
//                     {projects.map((project) => (
//                       <option key={project.id} value={project.id}>
//                         {project.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Task
//                   </label>
//                   <select
//                     value={selectedTask}
//                     onChange={(e) => setSelectedTask(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="">Select a task (optional)</option>
//                     {tasks.map((task) => (
//                       <option key={task.id} value={task.id}>
//                         {task.title}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             </div>

//             {/* Activity Monitor */}
//             <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                 Activity Monitor
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
//                     <span className="text-2xl">📸</span>
//                   </div>
//                   <h4 className="font-medium text-gray-900">Screenshots</h4>
//                   <p className="text-sm text-gray-500">Every 10 minutes</p>
//                 </div>
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
//                     <span className="text-2xl">🖱️</span>
//                   </div>
//                   <h4 className="font-medium text-gray-900">Mouse Activity</h4>
//                   <p className="text-sm text-gray-500">85% active</p>
//                 </div>
//                 <div className="text-center">
//                   <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
//                     <span className="text-2xl">⌨️</span>
//                   </div>
//                   <h4 className="font-medium text-gray-900">
//                     Keyboard Activity
//                   </h4>
//                   <p className="text-sm text-gray-500">78% active</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// // TeamManagementPage Component
// export const TeamManagementPage = ({ user, onLogout }) => {
//   const [showInviteModal, setShowInviteModal] = useState(false);
//   const [inviteEmail, setInviteEmail] = useState("");
//   const [teamData, setTeamData] = useState({
//     members: [],
//     stats: {
//       total_users: 0,
//       active_users: 0,
//       users_by_role: {},
//     },
//   });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchTeamData();
//   }, []);

//   const fetchTeamData = async () => {
//     try {
//       const [usersResponse, statsResponse] = await Promise.all([
//         usersAPI.getUsers(),
//         usersAPI.getTeamStats(),
//       ]);

//       setTeamData({
//         members: usersResponse.data,
//         stats: statsResponse.data,
//       });
//     } catch (error) {
//       console.error("Failed to fetch team data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInviteUser = async (e) => {
//     e.preventDefault();
//     try {
//       // Mock invitation logic - in real app would call invitation API
//       alert(`Invitation sent to ${inviteEmail}`);
//       setInviteEmail("");
//       setShowInviteModal(false);
//       fetchTeamData(); // Refresh data
//     } catch (error) {
//       console.error("Failed to send invitation:", error);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Header user={user} onLogout={onLogout} currentPage="Team" />
//         <div className="flex">
//           <Sidebar currentPage="Team" />
//           <main className="flex-1 ml-64 p-8">
//             <div className="flex items-center justify-center h-64">
//               <div className="spinner"></div>
//             </div>
//           </main>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header user={user} onLogout={onLogout} currentPage="Team" />
//       <div className="flex">
//         <Sidebar currentPage="Team" />

//         <main className="flex-1 ml-64 p-8">
//           <div className="max-w-7xl mx-auto">
//             <div className="flex justify-between items-center mb-8">
//               <div>
//                 <h1 className="text-3xl font-bold text-gray-900">
//                   Team Management
//                 </h1>
//                 <p className="text-gray-600 mt-2">
//                   Manage your team members and their roles.
//                 </p>
//               </div>
//               <button
//                 onClick={() => setShowInviteModal(true)}
//                 className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
//               >
//                 <span className="mr-2">➕</span>
//                 Invite Member
//               </button>
//             </div>

//             {/* Team Stats */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//               <DashboardWidget
//                 title="Team Members"
//                 value={teamData.stats.total_users}
//                 subtitle="Active users"
//                 icon="👥"
//                 color="blue"
//               />
//               <DashboardWidget
//                 title="Online Now"
//                 value={teamData.stats.active_users}
//                 subtitle="Currently active"
//                 icon="🟢"
//                 color="green"
//               />
//               <DashboardWidget
//                 title="Total Hours"
//                 value="342"
//                 subtitle="This week"
//                 icon="⏰"
//                 color="purple"
//               />
//             </div>

//             {/* Team Members List */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//               <div className="p-6 border-b border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   Team Members
//                 </h3>
//               </div>
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                         Member
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                         Role
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                         Status
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                         Hours This Week
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200">
//                     {teamData.members.map((member) => (
//                       <tr
//                         key={member.id}
//                         className="hover:bg-gray-50 table-row"
//                       >
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center">
//                             <img
//                               src={
//                                 member.avatar ||
//                                 "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
//                               }
//                               alt={member.name}
//                               className="w-10 h-10 rounded-full mr-3"
//                             />
//                             <div>
//                               <div className="text-sm font-medium text-gray-900">
//                                 {member.name}
//                               </div>
//                               <div className="text-sm text-gray-500">
//                                 {member.email}
//                               </div>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span
//                             className={`px-2 py-1 text-xs rounded-full ${
//                               member.role === "admin"
//                                 ? "bg-red-100 text-red-800"
//                                 : member.role === "manager"
//                                 ? "bg-blue-100 text-blue-800"
//                                 : "bg-gray-100 text-gray-800"
//                             }`}
//                           >
//                             {member.role}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span
//                             className={`px-2 py-1 text-xs rounded-full ${
//                               member.status === "active"
//                                 ? "bg-green-100 text-green-800"
//                                 : "bg-yellow-100 text-yellow-800"
//                             }`}
//                           >
//                             {member.status}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                           {Math.floor(Math.random() * 40) + 10}h
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                           <button className="text-blue-600 hover:text-blue-900 mr-3">
//                             Edit
//                           </button>
//                           <button className="text-red-600 hover:text-red-900">
//                             Remove
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>

//       {/* Invite Modal */}
//       {showInviteModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">
//               Invite Team Member
//             </h3>
//             <form onSubmit={handleInviteUser}>
//               <div className="mb-4">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Email Address
//                 </label>
//                 <input
//                   type="email"
//                   value={inviteEmail}
//                   onChange={(e) => setInviteEmail(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   required
//                 />
//               </div>
//               <div className="flex justify-end space-x-3">
//                 <button
//                   type="button"
//                   onClick={() => setShowInviteModal(false)}
//                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
//                 >
//                   Send Invitation
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // ProjectsPage Component
// export const ProjectsPage = ({ user, onLogout }) => {
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [projects, setProjects] = useState([]);
//   const [tasks, setTasks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [newProject, setNewProject] = useState({
//     name: "",
//     client: "",
//     budget: "",
//     description: "",
//   });

//   useEffect(() => {
//     fetchProjectData();
//   }, []);

//   const fetchProjectData = async () => {
//     try {
//       const [projectsResponse, statsResponse] = await Promise.all([
//         projectsAPI.getProjects(),
//         projectsAPI.getProjectStats(),
//       ]);

//       setProjects(projectsResponse.data);
//       // Also fetch some tasks for display
//       if (projectsResponse.data.length > 0) {
//         const tasksPromises = projectsResponse.data
//           .slice(0, 3)
//           .map((project) =>
//             projectsAPI.getProjectTasks(project.id).catch(() => ({ data: [] }))
//           );
//         const tasksResponses = await Promise.all(tasksPromises);
//         const allTasks = tasksResponses.flatMap((response) => response.data);
//         setTasks(allTasks);
//       }
//     } catch (error) {
//       console.error("Failed to fetch project data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateProject = async (e) => {
//     e.preventDefault();
//     try {
//       await projectsAPI.createProject(newProject);
//       alert(`Project "${newProject.name}" created successfully!`);
//       setNewProject({ name: "", client: "", budget: "", description: "" });
//       setShowCreateModal(false);
//       fetchProjectData(); // Refresh data
//     } catch (error) {
//       console.error("Failed to create project:", error);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Header user={user} onLogout={onLogout} currentPage="Projects" />
//         <div className="flex">
//           <Sidebar currentPage="Projects" />
//           <main className="flex-1 ml-64 p-8">
//             <div className="flex items-center justify-center h-64">
//               <div className="spinner"></div>
//             </div>
//           </main>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header user={user} onLogout={onLogout} currentPage="Projects" />
//       <div className="flex">
//         <Sidebar currentPage="Projects" />

//         <main className="flex-1 ml-64 p-8">
//           <div className="max-w-7xl mx-auto">
//             <div className="flex justify-between items-center mb-8">
//               <div>
//                 <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
//                 <p className="text-gray-600 mt-2">
//                   Manage your projects and track their progress.
//                 </p>
//               </div>
//               <button
//                 onClick={() => setShowCreateModal(true)}
//                 className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
//               >
//                 <span className="mr-2">➕</span>
//                 New Project
//               </button>
//             </div>

//             {/* Projects Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {projects.map((project) => (
//                 <div
//                   key={project.id}
//                   className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 feature-card"
//                 >
//                   <div className="flex justify-between items-start mb-4">
//                     <h3 className="text-lg font-semibold text-gray-900">
//                       {project.name}
//                     </h3>
//                     <span
//                       className={`px-2 py-1 text-xs rounded-full ${
//                         project.status === "active"
//                           ? "bg-green-100 text-green-800"
//                           : "bg-gray-100 text-gray-800"
//                       }`}
//                     >
//                       {project.status}
//                     </span>
//                   </div>
//                   <p className="text-gray-600 mb-4">{project.client}</p>

//                   <div className="space-y-2 mb-4">
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-500">Hours tracked:</span>
//                       <span className="font-medium">
//                         {project.hours_tracked || 0}h
//                       </span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-500">Budget:</span>
//                       <span className="font-medium">${project.budget}</span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-500">Spent:</span>
//                       <span className="font-medium">${project.spent || 0}</span>
//                     </div>
//                   </div>

//                   <div className="w-full bg-gray-200 rounded-full h-2 mb-4 progress-bar">
//                     <div
//                       className="bg-blue-600 h-2 rounded-full"
//                       style={{
//                         width: `${Math.min(
//                           ((project.spent || 0) / project.budget) * 100,
//                           100
//                         )}%`,
//                         "--progress-width": `${Math.min(
//                           ((project.spent || 0) / project.budget) * 100,
//                           100
//                         )}%`,
//                       }}
//                     ></div>
//                   </div>

//                   <div className="flex justify-between">
//                     <button className="text-blue-600 hover:text-blue-800 text-sm">
//                       View Details
//                     </button>
//                     <button className="text-gray-600 hover:text-gray-800 text-sm">
//                       Edit
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Tasks Section */}
//             <div className="mt-12">
//               <h2 className="text-2xl font-bold text-gray-900 mb-6">
//                 Recent Tasks
//               </h2>
//               <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Task
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Project
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Assignee
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Status
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Priority
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                       {tasks.length > 0 ? (
//                         tasks.map((task) => (
//                           <tr
//                             key={task.id}
//                             className="hover:bg-gray-50 table-row"
//                           >
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               <div className="text-sm font-medium text-gray-900">
//                                 {task.title}
//                               </div>
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                               {projects.find((p) => p.id === task.project_id)
//                                 ?.name || "Unknown Project"}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                               {task.assignee_id}
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               <span
//                                 className={`px-2 py-1 text-xs rounded-full ${
//                                   task.status === "completed"
//                                     ? "bg-green-100 text-green-800"
//                                     : task.status === "in-progress"
//                                     ? "bg-blue-100 text-blue-800"
//                                     : "bg-gray-100 text-gray-800"
//                                 }`}
//                               >
//                                 {task.status}
//                               </span>
//                             </td>
//                             <td className="px-6 py-4 whitespace-nowrap">
//                               <span
//                                 className={`px-2 py-1 text-xs rounded-full ${
//                                   task.priority === "high"
//                                     ? "bg-red-100 text-red-800"
//                                     : task.priority === "medium"
//                                     ? "bg-yellow-100 text-yellow-800"
//                                     : "bg-green-100 text-green-800"
//                                 }`}
//                               >
//                                 {task.priority}
//                               </span>
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td
//                             colSpan="5"
//                             className="px-6 py-4 text-center text-gray-500"
//                           >
//                             No tasks found
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>

//       {/* Create Project Modal */}
//       {showCreateModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">
//               Create New Project
//             </h3>
//             <form onSubmit={handleCreateProject}>
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Project Name
//                   </label>
//                   <input
//                     type="text"
//                     value={newProject.name}
//                     onChange={(e) =>
//                       setNewProject({ ...newProject, name: e.target.value })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Client Name
//                   </label>
//                   <input
//                     type="text"
//                     value={newProject.client}
//                     onChange={(e) =>
//                       setNewProject({ ...newProject, client: e.target.value })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Budget
//                   </label>
//                   <input
//                     type="number"
//                     value={newProject.budget}
//                     onChange={(e) =>
//                       setNewProject({ ...newProject, budget: e.target.value })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Description
//                   </label>
//                   <textarea
//                     value={newProject.description}
//                     onChange={(e) =>
//                       setNewProject({
//                         ...newProject,
//                         description: e.target.value,
//                       })
//                     }
//                     rows={3}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-end space-x-3 mt-6">
//                 <button
//                   type="button"
//                   onClick={() => setShowCreateModal(false)}
//                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
//                 >
//                   Create Project
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // ReportsPage Component
// export const ReportsPage = ({ user, onLogout }) => {
//   const [dateRange, setDateRange] = useState("this-week");
//   const [selectedTeamMember, setSelectedTeamMember] = useState("all");
//   const [analyticsData, setAnalyticsData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchAnalyticsData();
//   }, [dateRange, selectedTeamMember]);

//   const fetchAnalyticsData = async () => {
//     try {
//       const [dashboardResponse, teamResponse, productivityResponse] =
//         await Promise.all([
//           analyticsAPI.getDashboardAnalytics(),
//           analyticsAPI.getTeamAnalytics(),
//           analyticsAPI.getProductivityAnalytics(
//             dateRange === "this-week" ? "week" : "month"
//           ),
//         ]);

//       setAnalyticsData({
//         dashboard: dashboardResponse.data,
//         team: teamResponse.data,
//         productivity: productivityResponse.data,
//       });
//     } catch (error) {
//       console.error("Failed to fetch analytics data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Header user={user} onLogout={onLogout} currentPage="Reports" />
//         <div className="flex">
//           <Sidebar currentPage="Reports" />
//           <main className="flex-1 ml-64 p-8">
//             <div className="flex items-center justify-center h-64">
//               <div className="spinner"></div>
//             </div>
//           </main>
//         </div>
//       </div>
//     );
//   }

//   const reportData = analyticsData?.dashboard?.user_stats || {
//     total_hours: 0,
//     avg_activity: 0,
//     projects_count: 0,
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header user={user} onLogout={onLogout} currentPage="Reports" />
//       <div className="flex">
//         <Sidebar currentPage="Reports" />

//         <main className="flex-1 ml-64 p-8">
//           <div className="max-w-7xl mx-auto">
//             <div className="mb-8">
//               <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
//               <p className="text-gray-600 mt-2">
//                 Analyze your team's productivity and time tracking data.
//               </p>
//             </div>

//             {/* Filters */}
//             <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Date Range
//                   </label>
//                   <select
//                     value={dateRange}
//                     onChange={(e) => setDateRange(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="today">Today</option>
//                     <option value="this-week">This Week</option>
//                     <option value="this-month">This Month</option>
//                     <option value="last-month">Last Month</option>
//                     <option value="custom">Custom Range</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Team Member
//                   </label>
//                   <select
//                     value={selectedTeamMember}
//                     onChange={(e) => setSelectedTeamMember(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="all">All Members</option>
//                     {analyticsData?.team?.team_stats?.map((member) => (
//                       <option key={member.user_id} value={member.user_id}>
//                         {member.user_name}
//                       </option>
//                     )) || []}
//                   </select>
//                 </div>
//                 <div className="flex items-end">
//                   <button
//                     onClick={fetchAnalyticsData}
//                     className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 w-full"
//                   >
//                     Generate Report
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Report Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//               <DashboardWidget
//                 title="Total Hours"
//                 value={`${Math.round(reportData.total_hours || 0)}h`}
//                 subtitle="This period"
//                 icon="⏰"
//                 color="blue"
//               />
//               <DashboardWidget
//                 title="Average Daily"
//                 value={`${Math.round((reportData.total_hours || 0) / 7)}h`}
//                 subtitle="Per day"
//                 icon="📊"
//                 color="green"
//               />
//               <DashboardWidget
//                 title="Productivity"
//                 value={`${Math.round(reportData.avg_activity || 0)}%`}
//                 subtitle="Average activity"
//                 icon="📈"
//                 color="purple"
//               />
//               <DashboardWidget
//                 title="Active Projects"
//                 value={reportData.projects_count || 0}
//                 subtitle="Currently running"
//                 icon="📁"
//                 color="orange"
//               />
//               <DashboardWidget
//                 title="Screenshots"
//                 value="1250"
//                 subtitle="Captured this period"
//                 icon="📸"
//                 color="red"
//               />
//               <DashboardWidget
//                 title="Activity Score"
//                 value={`${Math.round(
//                   analyticsData?.productivity?.productivity_score || 0
//                 )}%`}
//                 subtitle="Overall performance"
//                 icon="⚡"
//                 color="yellow"
//               />
//             </div>

//             {/* Charts Section */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//               <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   Time Tracking Overview
//                 </h3>
//                 <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
//                   {analyticsData?.productivity?.productivity_chart ? (
//                     <TimeTrackingChart
//                       data={analyticsData.productivity.productivity_chart}
//                     />
//                   ) : (
//                     <div className="text-center">
//                       <img
//                         src="https://images.unsplash.com/photo-1660144425546-b07680e711d1?w=400&h=200&fit=crop"
//                         alt="Chart placeholder"
//                         className="w-full h-48 object-cover rounded-lg"
//                       />
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                   Productivity Trends
//                 </h3>
//                 <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
//                   {analyticsData?.dashboard?.productivity_trend ? (
//                     <ProductivityChart
//                       data={analyticsData.dashboard.productivity_trend}
//                     />
//                   ) : (
//                     <div className="text-center">
//                       <img
//                         src="https://images.unsplash.com/photo-1587401511935-a7f87afadf2f?w=400&h=200&fit=crop"
//                         alt="Analytics chart"
//                         className="w-full h-48 object-cover rounded-lg"
//                       />
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Detailed Reports */}
//             <div className="mt-8">
//               <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//                 <div className="p-6 border-b border-gray-200">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     Detailed Time Report
//                   </h3>
//                 </div>
//                 <div className="overflow-x-auto">
//                   <table className="w-full">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Date
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Member
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Project
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Hours
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                           Activity
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                       {analyticsData?.team?.team_stats?.map((member, index) => (
//                         <tr
//                           key={member.user_id}
//                           className="hover:bg-gray-50 table-row"
//                         >
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             {new Date(
//                               Date.now() - index * 86400000
//                             ).toLocaleDateString()}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap">
//                             <div className="flex items-center">
//                               <img
//                                 src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
//                                 alt={member.user_name}
//                                 className="w-8 h-8 rounded-full mr-3"
//                               />
//                               <span className="text-sm font-medium text-gray-900">
//                                 {member.user_name}
//                               </span>
//                             </div>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                             Project {index + 1}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             {Math.round(member.total_hours)}h
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                             {Math.round(member.avg_activity)}%
//                           </td>
//                         </tr>
//                       )) || (
//                         <tr>
//                           <td
//                             colSpan="5"
//                             className="px-6 py-4 text-center text-gray-500"
//                           >
//                             No data available
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// // IntegrationsPage Component
// export const IntegrationsPage = ({ user, onLogout }) => {
//   const [integrations, setIntegrations] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showConnectModal, setShowConnectModal] = useState(false);
//   const [selectedIntegration, setSelectedIntegration] = useState(null);
//   const [connectionData, setConnectionData] = useState({});

//   useEffect(() => {
//     fetchIntegrations();
//   }, []);

//   const fetchIntegrations = async () => {
//     try {
//       const response = await integrationsAPI.getIntegrations();
//       setIntegrations(response.data.integrations || []);
//     } catch (error) {
//       console.error("Failed to fetch integrations:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleConnect = async (type) => {
//     try {
//       let response;
//       switch (type) {
//         case "slack":
//           response = await integrationsAPI.connectSlack(
//             connectionData.webhook_url
//           );
//           break;
//         case "trello":
//           response = await integrationsAPI.connectTrello(
//             connectionData.api_key,
//             connectionData.token
//           );
//           break;
//         case "github":
//           response = await integrationsAPI.connectGitHub(connectionData.token);
//           break;
//         default:
//           throw new Error("Unknown integration type");
//       }

//       alert(
//         `${
//           type.charAt(0).toUpperCase() + type.slice(1)
//         } connected successfully!`
//       );
//       setShowConnectModal(false);
//       setConnectionData({});
//       fetchIntegrations();
//     } catch (error) {
//       console.error(`Failed to connect ${type}:`, error);
//       alert(`Failed to connect ${type}. Please check your credentials.`);
//     }
//   };

//   const availableIntegrations = [
//     {
//       name: "Slack",
//       type: "slack",
//       icon: "💬",
//       description: "Send notifications and updates to Slack channels",
//       fields: [
//         {
//           name: "webhook_url",
//           label: "Webhook URL",
//           type: "url",
//           placeholder: "https://hooks.slack.com/...",
//         },
//       ],
//     },
//     {
//       name: "Trello",
//       type: "trello",
//       icon: "📋",
//       description: "Create cards and sync with Trello boards",
//       fields: [
//         {
//           name: "api_key",
//           label: "API Key",
//           type: "text",
//           placeholder: "Your Trello API Key",
//         },
//         {
//           name: "token",
//           label: "Token",
//           type: "text",
//           placeholder: "Your Trello Token",
//         },
//       ],
//     },
//     {
//       name: "GitHub",
//       type: "github",
//       icon: "💻",
//       description: "Create issues and sync with repositories",
//       fields: [
//         {
//           name: "token",
//           label: "Personal Access Token",
//           type: "password",
//           placeholder: "ghp_...",
//         },
//       ],
//     },
//   ];

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <Header user={user} onLogout={onLogout} currentPage="Integrations" />
//         <div className="flex">
//           <Sidebar currentPage="Integrations" />
//           <main className="flex-1 ml-64 p-8">
//             <div className="flex items-center justify-center h-64">
//               <div className="spinner"></div>
//             </div>
//           </main>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header user={user} onLogout={onLogout} currentPage="Integrations" />
//       <div className="flex">
//         <Sidebar currentPage="Integrations" />

//         <main className="flex-1 ml-64 p-8">
//           <div className="max-w-7xl mx-auto">
//             <div className="mb-8">
//               <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
//               <p className="text-gray-600 mt-2">
//                 Connect your favorite tools to streamline your workflow.
//               </p>
//             </div>

//             {/* Connected Integrations */}
//             {integrations.length > 0 && (
//               <div className="mb-8">
//                 <h2 className="text-xl font-semibold text-gray-900 mb-4">
//                   Connected Integrations
//                 </h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {integrations.map((integration) => (
//                     <div
//                       key={integration.id}
//                       className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
//                     >
//                       <div className="flex items-center justify-between mb-4">
//                         <div className="flex items-center">
//                           <span className="text-2xl mr-3">
//                             {integration.type === "slack"
//                               ? "💬"
//                               : integration.type === "trello"
//                               ? "📋"
//                               : "💻"}
//                           </span>
//                           <h3 className="text-lg font-semibold text-gray-900 capitalize">
//                             {integration.type}
//                           </h3>
//                         </div>
//                         <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
//                           Connected
//                         </span>
//                       </div>
//                       <p className="text-gray-600 mb-4">
//                         Connected on{" "}
//                         {format(new Date(integration.created_at), "PPP")}
//                       </p>
//                       <button
//                         onClick={() =>
//                           integrationsAPI.disconnectIntegration(integration.id)
//                         }
//                         className="text-red-600 hover:text-red-800 text-sm"
//                       >
//                         Disconnect
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Available Integrations */}
//             <div>
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">
//                 Available Integrations
//               </h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {availableIntegrations.map((integration) => {
//                   const isConnected = integrations.some(
//                     (i) => i.type === integration.type
//                   );
//                   return (
//                     <div
//                       key={integration.type}
//                       className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 feature-card"
//                     >
//                       <div className="flex items-center mb-4">
//                         <span className="text-2xl mr-3">
//                           {integration.icon}
//                         </span>
//                         <h3 className="text-lg font-semibold text-gray-900">
//                           {integration.name}
//                         </h3>
//                       </div>
//                       <p className="text-gray-600 mb-4">
//                         {integration.description}
//                       </p>
//                       <button
//                         onClick={() => {
//                           if (!isConnected) {
//                             setSelectedIntegration(integration);
//                             setShowConnectModal(true);
//                           }
//                         }}
//                         disabled={isConnected}
//                         className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
//                           isConnected
//                             ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                             : "bg-blue-600 text-white hover:bg-blue-700"
//                         }`}
//                       >
//                         {isConnected ? "Connected" : "Connect"}
//                       </button>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>
//         </main>
//       </div>

//       {/* Connect Modal */}
//       {showConnectModal && selectedIntegration && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">
//               Connect {selectedIntegration.name}
//             </h3>
//             <div className="space-y-4">
//               {selectedIntegration.fields.map((field) => (
//                 <div key={field.name}>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     {field.label}
//                   </label>
//                   <input
//                     type={field.type}
//                     placeholder={field.placeholder}
//                     value={connectionData[field.name] || ""}
//                     onChange={(e) =>
//                       setConnectionData({
//                         ...connectionData,
//                         [field.name]: e.target.value,
//                       })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               ))}
//             </div>
//             <div className="flex justify-end space-x-3 mt-6">
//               <button
//                 onClick={() => {
//                   setShowConnectModal(false);
//                   setConnectionData({});
//                 }}
//                 className="px-4 py-2 text-gray-600 hover:text-gray-800"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={() => handleConnect(selectedIntegration.type)}
//                 className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
//               >
//                 Connect
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // SettingsPage Component
// export const SettingsPage = ({ user, onLogout }) => {
//   const [settings, setSettings] = useState({
//     screenshotInterval: 10,
//     activityTracking: true,
//     idleTimeout: 5,
//     notifications: true,
//     timezone: "UTC-5",
//     workingHours: { start: "09:00", end: "17:00" },
//   });
//   const [userProfile, setUserProfile] = useState(user);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     // Initialize settings from user data
//     if (user.settings) {
//       setSettings({
//         ...settings,
//         ...user.settings,
//       });
//     }
//     if (user.working_hours) {
//       setSettings((prev) => ({
//         ...prev,
//         workingHours: user.working_hours,
//       }));
//     }
//   }, [user]);

//   const handleSave = async () => {
//     setLoading(true);
//     try {
//       await usersAPI.updateCurrentUser({
//         ...userProfile,
//         settings,
//         working_hours: settings.workingHours,
//         timezone: settings.timezone,
//       });
//       alert("Settings saved successfully!");
//     } catch (error) {
//       console.error("Failed to save settings:", error);
//       alert("Failed to save settings. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header user={user} onLogout={onLogout} currentPage="Settings" />
//       <div className="flex">
//         <Sidebar currentPage="Settings" />

//         <main className="flex-1 ml-64 p-8">
//           <div className="max-w-4xl mx-auto">
//             <div className="mb-8">
//               <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
//               <p className="text-gray-600 mt-2">
//                 Configure your time tracking and productivity settings.
//               </p>
//             </div>

//             {/* Profile Settings */}
//             <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                 Profile Settings
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Full Name
//                   </label>
//                   <input
//                     type="text"
//                     value={userProfile.name}
//                     onChange={(e) =>
//                       setUserProfile({ ...userProfile, name: e.target.value })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Email
//                   </label>
//                   <input
//                     type="email"
//                     value={userProfile.email}
//                     onChange={(e) =>
//                       setUserProfile({ ...userProfile, email: e.target.value })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Role
//                   </label>
//                   <input
//                     type="text"
//                     value={userProfile.role}
//                     disabled
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Time Zone
//                   </label>
//                   <select
//                     value={settings.timezone}
//                     onChange={(e) =>
//                       setSettings({ ...settings, timezone: e.target.value })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="UTC-5">Eastern Time (UTC-5)</option>
//                     <option value="UTC-6">Central Time (UTC-6)</option>
//                     <option value="UTC-7">Mountain Time (UTC-7)</option>
//                     <option value="UTC-8">Pacific Time (UTC-8)</option>
//                   </select>
//                 </div>
//               </div>
//             </div>

//             {/* Time Tracking Settings */}
//             <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                 Time Tracking Settings
//               </h3>
//               <div className="space-y-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Screenshot Interval (minutes)
//                   </label>
//                   <select
//                     value={settings.screenshotInterval}
//                     onChange={(e) =>
//                       setSettings({
//                         ...settings,
//                         screenshotInterval: parseInt(e.target.value),
//                       })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value={5}>Every 5 minutes</option>
//                     <option value={10}>Every 10 minutes</option>
//                     <option value={15}>Every 15 minutes</option>
//                     <option value={30}>Every 30 minutes</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Idle Timeout (minutes)
//                   </label>
//                   <select
//                     value={settings.idleTimeout}
//                     onChange={(e) =>
//                       setSettings({
//                         ...settings,
//                         idleTimeout: parseInt(e.target.value),
//                       })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value={3}>3 minutes</option>
//                     <option value={5}>5 minutes</option>
//                     <option value={10}>10 minutes</option>
//                     <option value={15}>15 minutes</option>
//                   </select>
//                 </div>

//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     id="activityTracking"
//                     checked={settings.activityTracking}
//                     onChange={(e) =>
//                       setSettings({
//                         ...settings,
//                         activityTracking: e.target.checked,
//                       })
//                     }
//                     className="mr-3"
//                   />
//                   <label
//                     htmlFor="activityTracking"
//                     className="text-sm font-medium text-gray-700"
//                   >
//                     Enable activity tracking (mouse and keyboard)
//                   </label>
//                 </div>

//                 <div className="flex items-center">
//                   <input
//                     type="checkbox"
//                     id="notifications"
//                     checked={settings.notifications}
//                     onChange={(e) =>
//                       setSettings({
//                         ...settings,
//                         notifications: e.target.checked,
//                       })
//                     }
//                     className="mr-3"
//                   />
//                   <label
//                     htmlFor="notifications"
//                     className="text-sm font-medium text-gray-700"
//                   >
//                     Enable notifications
//                   </label>
//                 </div>
//               </div>
//             </div>

//             {/* Working Hours */}
//             <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                 Working Hours
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Start Time
//                   </label>
//                   <input
//                     type="time"
//                     value={settings.workingHours.start}
//                     onChange={(e) =>
//                       setSettings({
//                         ...settings,
//                         workingHours: {
//                           ...settings.workingHours,
//                           start: e.target.value,
//                         },
//                       })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     End Time
//                   </label>
//                   <input
//                     type="time"
//                     value={settings.workingHours.end}
//                     onChange={(e) =>
//                       setSettings({
//                         ...settings,
//                         workingHours: {
//                           ...settings.workingHours,
//                           end: e.target.value,
//                         },
//                       })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Save Button */}
//             <div className="flex justify-end">
//               <button
//                 onClick={handleSave}
//                 disabled={loading}
//                 className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
//               >
//                 {loading ? "Saving..." : "Save Settings"}
//               </button>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };
