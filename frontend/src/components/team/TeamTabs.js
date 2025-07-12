// frontend/src/components/team/TeamTabs.js
import React from "react";

export const TeamTabs = ({
  activeTab,
  onTabChange,
  membersCount,
  invitationsCount,
}) => {
  const tabs = [
    {
      id: "members",
      label: "Team Members",
      count: membersCount,
    },
    {
      id: "invitations",
      label: "Invitations",
      count: invitationsCount,
    },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </nav>
    </div>
  );
};
