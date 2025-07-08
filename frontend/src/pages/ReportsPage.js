import React, { useState, useEffect } from "react";
import { DashboardWidget } from "../components/DashboardWidget";
import { analyticsAPI } from "../api/client";

export const ReportsPage = ({ user, onLogout }) => {
  const [dateRange, setDateRange] = useState("this-week");
  const [selectedTeamMember, setSelectedTeamMember] = useState("all");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedTeamMember]);

  const fetchAnalyticsData = async () => {
    try {
      const [dashboardResponse, teamResponse, productivityResponse] =
        await Promise.all([
          analyticsAPI.getDashboardAnalytics(),
          analyticsAPI.getTeamAnalytics(),
          analyticsAPI.getProductivityAnalytics(
            dateRange === "this-week" ? "week" : "month"
          ),
        ]);

      setAnalyticsData({
        dashboard: dashboardResponse.data,
        team: teamResponse.data,
        productivity: productivityResponse.data,
      });
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  const reportData = analyticsData?.dashboard?.user_stats || {
    total_hours: 0,
    avg_activity: 0,
    projects_count: 0,
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">
            Analyze your team's productivity and time tracking data.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Member
              </label>
              <select
                value={selectedTeamMember}
                onChange={(e) => setSelectedTeamMember(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Members</option>
                {analyticsData?.team?.team_stats?.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user_name}
                  </option>
                )) || []}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchAnalyticsData}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 w-full"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <DashboardWidget
            title="Total Hours"
            value={`${Math.round(reportData.total_hours || 0)}h`}
            subtitle="This period"
            icon="⏰"
            color="blue"
          />
          <DashboardWidget
            title="Average Daily"
            value={`${Math.round((reportData.total_hours || 0) / 7)}h`}
            subtitle="Per day"
            icon="📊"
            color="green"
          />
          <DashboardWidget
            title="Productivity"
            value={`${Math.round(reportData.avg_activity || 0)}%`}
            subtitle="Average activity"
            icon="📈"
            color="purple"
          />
          <DashboardWidget
            title="Active Projects"
            value={reportData.projects_count || 0}
            subtitle="Currently running"
            icon="📁"
            color="orange"
          />
          <DashboardWidget
            title="Screenshots"
            value="1250"
            subtitle="Captured this period"
            icon="📸"
            color="red"
          />
          <DashboardWidget
            title="Activity Score"
            value={`${Math.round(
              analyticsData?.productivity?.productivity_score || 0
            )}%`}
            subtitle="Overall performance"
            icon="⚡"
            color="yellow"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Time Tracking Overview
            </h3>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-600">
                  Time tracking chart will appear here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {Math.round(reportData.total_hours || 0)} hours tracked
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Productivity Trends
            </h3>
            <div className="h-64 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📈</div>
                <p className="text-gray-600">
                  Productivity trends will appear here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {Math.round(reportData.avg_activity || 0)}% average activity
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Reports */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Detailed Time Report
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analyticsData?.team?.team_stats?.map((member, index) => (
                    <tr
                      key={member.user_id}
                      className="hover:bg-gray-50 table-row"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(
                          Date.now() - index * 86400000
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                            alt={member.user_name}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {member.user_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Project {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.round(member.total_hours)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.round(member.avg_activity)}%
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
