import React, { useState, useEffect } from "react";
import { integrationsAPI } from "../api/client";

export const IntegrationsPage = ({ user, onLogout }) => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [connectionData, setConnectionData] = useState({});

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await integrationsAPI.getIntegrations();
      setIntegrations(response.data.integrations || []);
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (type) => {
    try {
      let response;
      switch (type) {
        case "slack":
          response = await integrationsAPI.connectSlack(
            connectionData.webhook_url
          );
          break;
        case "trello":
          response = await integrationsAPI.connectTrello(
            connectionData.api_key,
            connectionData.token
          );
          break;
        case "github":
          response = await integrationsAPI.connectGitHub(connectionData.token);
          break;
        default:
          throw new Error("Unknown integration type");
      }

      alert(
        `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } connected successfully!`
      );
      setShowConnectModal(false);
      setConnectionData({});
      fetchIntegrations();
    } catch (error) {
      console.error(`Failed to connect ${type}:`, error);
      alert(`Failed to connect ${type}. Please check your credentials.`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString();
    } catch (error) {
      return "Invalid date";
    }
  };

  const availableIntegrations = [
    {
      name: "Slack",
      type: "slack",
      icon: "💬",
      description: "Send notifications and updates to Slack channels",
      fields: [
        {
          name: "webhook_url",
          label: "Webhook URL",
          type: "url",
          placeholder: "https://hooks.slack.com/...",
        },
      ],
    },
    {
      name: "Trello",
      type: "trello",
      icon: "📋",
      description: "Create cards and sync with Trello boards",
      fields: [
        {
          name: "api_key",
          label: "API Key",
          type: "text",
          placeholder: "Your Trello API Key",
        },
        {
          name: "token",
          label: "Token",
          type: "text",
          placeholder: "Your Trello Token",
        },
      ],
    },
    {
      name: "GitHub",
      type: "github",
      icon: "💻",
      description: "Create issues and sync with repositories",
      fields: [
        {
          name: "token",
          label: "Personal Access Token",
          type: "password",
          placeholder: "ghp_...",
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">
            Connect your favorite tools to streamline your workflow.
          </p>
        </div>

        {/* Connected Integrations */}
        {integrations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Connected Integrations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">
                        {integration.type === "slack"
                          ? "💬"
                          : integration.type === "trello"
                          ? "📋"
                          : "💻"}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {integration.type}
                      </h3>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Connected
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Connected on {formatDate(integration.created_at)}
                  </p>
                  <button
                    onClick={() =>
                      integrationsAPI.disconnectIntegration(integration.id)
                    }
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Integrations */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Available Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableIntegrations.map((integration) => {
              const isConnected = integrations.some(
                (i) => i.type === integration.type
              );
              return (
                <div
                  key={integration.type}
                  className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 feature-card"
                >
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">{integration.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {integration.name}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {integration.description}
                  </p>
                  <button
                    onClick={() => {
                      if (!isConnected) {
                        setSelectedIntegration(integration);
                        setShowConnectModal(true);
                      }
                    }}
                    disabled={isConnected}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                      isConnected
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isConnected ? "Connected" : "Connect"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      {showConnectModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Connect {selectedIntegration.name}
            </h3>
            <div className="space-y-4">
              {selectedIntegration.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={connectionData[field.name] || ""}
                    onChange={(e) =>
                      setConnectionData({
                        ...connectionData,
                        [field.name]: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  setConnectionData({});
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConnect(selectedIntegration.type)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
