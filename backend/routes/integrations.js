const express = require('express');
const { authMiddleware, requireManager } = require('../middleware/auth');

const router = express.Router();

// Get available integrations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const integrations = [
      {
        id: 'slack',
        name: 'Slack',
        description: 'Connect with Slack for team notifications',
        icon: '💬',
        category: 'Communication',
        status: 'available',
        configured: false,
        features: [
          'Time tracking notifications',
          'Project updates',
          'Daily summaries',
          'Team alerts'
        ]
      },
      {
        id: 'trello',
        name: 'Trello',
        description: 'Sync tasks with Trello boards',
        icon: '📋',
        category: 'Project Management',
        status: 'available',
        configured: false,
        features: [
          'Task synchronization',
          'Board integration',
          'Card time tracking',
          'Progress updates'
        ]
      },
      {
        id: 'github',
        name: 'GitHub',
        description: 'Track time on GitHub issues and pull requests',
        icon: '🐙',
        category: 'Development',
        status: 'available',
        configured: false,
        features: [
          'Issue tracking',
          'Pull request time',
          'Commit tracking',
          'Repository insights'
        ]
      },
      {
        id: 'jira',
        name: 'Jira',
        description: 'Integrate with Jira for issue tracking',
        icon: '🎯',
        category: 'Project Management',
        status: 'available',
        configured: false,
        features: [
          'Issue synchronization',
          'Sprint tracking',
          'Worklog integration',
          'Status updates'
        ]
      },
      {
        id: 'calendar',
        name: 'Google Calendar',
        description: 'Sync with Google Calendar events',
        icon: '📅',
        category: 'Productivity',
        status: 'available',
        configured: false,
        features: [
          'Calendar sync',
          'Meeting tracking',
          'Event integration',
          'Schedule optimization'
        ]
      },
      {
        id: 'zapier',
        name: 'Zapier',
        description: 'Connect with 3000+ apps via Zapier',
        icon: '⚡',
        category: 'Automation',
        status: 'available',
        configured: false,
        features: [
          'Workflow automation',
          'Custom triggers',
          'Data synchronization',
          'Cross-platform integration'
        ]
      }
    ];
    
    res.json({
      integrations,
      categories: ['Communication', 'Project Management', 'Development', 'Productivity', 'Automation']
    });
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get integration details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock integration details - in real implementation, this would come from database
    const integrationDetails = {
      slack: {
        id: 'slack',
        name: 'Slack',
        description: 'Connect with Slack for team notifications',
        icon: '💬',
        category: 'Communication',
        status: 'available',
        configured: false,
        setup_steps: [
          'Create a Slack app in your workspace',
          'Add bot permissions: chat:write, channels:read',
          'Install the app to your workspace',
          'Copy the Bot User OAuth Token',
          'Paste the token in the configuration below'
        ],
        config_fields: [
          {
            name: 'bot_token',
            label: 'Bot User OAuth Token',
            type: 'password',
            required: true,
            description: 'Your Slack bot token starting with xoxb-'
          },
          {
            name: 'channel',
            label: 'Default Channel',
            type: 'text',
            required: false,
            description: 'Channel for notifications (e.g., #general)'
          }
        ]
      },
      trello: {
        id: 'trello',
        name: 'Trello',
        description: 'Sync tasks with Trello boards',
        icon: '📋',
        category: 'Project Management',
        status: 'available',
        configured: false,
        setup_steps: [
          'Get your Trello API key from https://trello.com/app-key',
          'Generate a token for your application',
          'Find your board ID from the board URL',
          'Configure the integration below'
        ],
        config_fields: [
          {
            name: 'api_key',
            label: 'API Key',
            type: 'password',
            required: true
          },
          {
            name: 'token',
            label: 'Token',
            type: 'password',
            required: true
          },
          {
            name: 'board_id',
            label: 'Board ID',
            type: 'text',
            required: true
          }
        ]
      },
      github: {
        id: 'github',
        name: 'GitHub',
        description: 'Track time on GitHub issues and pull requests',
        icon: '🐙',
        category: 'Development',
        status: 'available',
        configured: false,
        setup_steps: [
          'Create a Personal Access Token in GitHub',
          'Grant repo permissions to the token',
          'Add the token to the configuration below',
          'Select repositories to track'
        ],
        config_fields: [
          {
            name: 'access_token',
            label: 'Personal Access Token',
            type: 'password',
            required: true
          },
          {
            name: 'repositories',
            label: 'Repositories',
            type: 'textarea',
            required: true,
            description: 'List repositories (one per line, format: owner/repo)'
          }
        ]
      }
    };
    
    const integration = integrationDetails[id];
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    
    res.json(integration);
  } catch (error) {
    console.error('Get integration details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Configure integration (admin/manager only)
router.post('/:id/configure', authMiddleware, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { config } = req.body;
    
    // Mock configuration save - in real implementation, this would save to database
    // and validate the configuration
    
    res.json({
      message: `${id} integration configured successfully`,
      integration: {
        id,
        configured: true,
        config: {
          // Return sanitized config (without sensitive data)
          ...config,
          // Remove sensitive fields
          bot_token: config.bot_token ? '***' : undefined,
          api_key: config.api_key ? '***' : undefined,
          access_token: config.access_token ? '***' : undefined,
          token: config.token ? '***' : undefined
        }
      }
    });
  } catch (error) {
    console.error('Configure integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test integration connection
router.post('/:id/test', authMiddleware, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock test - in real implementation, this would test the actual connection
    const testResults = {
      slack: {
        success: true,
        message: 'Successfully connected to Slack workspace',
        details: {
          workspace: 'My Team Workspace',
          bot_user: 'Hubstaff Bot',
          permissions: ['chat:write', 'channels:read']
        }
      },
      trello: {
        success: true,
        message: 'Successfully connected to Trello',
        details: {
          boards_found: 5,
          user: 'john.doe@example.com'
        }
      },
      github: {
        success: true,
        message: 'Successfully connected to GitHub',
        details: {
          user: 'johndoe',
          repositories: 12,
          permissions: ['repo']
        }
      }
    };
    
    const result = testResults[id] || {
      success: false,
      message: 'Integration test not implemented'
    };
    
    res.json(result);
  } catch (error) {
    console.error('Test integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disable integration
router.post('/:id/disable', authMiddleware, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock disable - in real implementation, this would update database
    
    res.json({
      message: `${id} integration disabled successfully`,
      integration: {
        id,
        configured: false
      }
    });
  } catch (error) {
    console.error('Disable integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get integration logs
router.get('/:id/logs', authMiddleware, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Mock logs - in real implementation, this would come from database
    const logs = [
      {
        id: '1',
        timestamp: new Date(),
        level: 'info',
        message: 'Integration sync completed successfully',
        details: {
          items_synced: 5,
          duration: '2.3s'
        }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3600000),
        level: 'warning',
        message: 'Rate limit reached, retrying in 60 seconds',
        details: {
          retry_count: 1
        }
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 7200000),
        level: 'error',
        message: 'Failed to sync project: Invalid project ID',
        details: {
          project_id: 'invalid-123',
          error_code: 'PROJECT_NOT_FOUND'
        }
      }
    ];
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: logs.length,
        pages: Math.ceil(logs.length / limit)
      }
    });
  } catch (error) {
    console.error('Get integration logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;