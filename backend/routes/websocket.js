const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// WebSocket connection info
router.get('/info', authMiddleware, async (req, res) => {
  try {
    res.json({
      message: 'WebSocket is available',
      endpoint: '/socket.io',
      events: {
        connection: 'Client connects to WebSocket',
        disconnect: 'Client disconnects from WebSocket',
        'join-team': 'Join a team room for real-time updates',
        'time-started': 'Broadcast when user starts time tracking',
        'time-stopped': 'Broadcast when user stops time tracking',
        'project-updated': 'Broadcast when project is updated',
        'task-assigned': 'Broadcast when task is assigned',
        'team-notification': 'Send notification to team members'
      }
    });
  } catch (error) {
    console.error('WebSocket info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send notification to team
router.post('/notify', authMiddleware, async (req, res) => {
  try {
    const { type, message, recipients, data } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({ error: 'Type and message are required' });
    }
    
    // Get Socket.IO instance from app
    const io = req.app.get('io');
    
    if (!io) {
      return res.status(500).json({ error: 'WebSocket not available' });
    }
    
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      from: req.user.id,
      timestamp: new Date(),
      data: data || {}
    };
    
    // Send to specific recipients or broadcast to all
    if (recipients && recipients.length > 0) {
      recipients.forEach(recipient => {
        io.to(`user-${recipient}`).emit('notification', notification);
      });
    } else {
      io.emit('notification', notification);
    }
    
    res.json({
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Broadcast time tracking event
router.post('/time-event', authMiddleware, async (req, res) => {
  try {
    const { event, project_id, task_id, data } = req.body;
    
    if (!event || !project_id) {
      return res.status(400).json({ error: 'Event and project_id are required' });
    }
    
    const io = req.app.get('io');
    
    if (!io) {
      return res.status(500).json({ error: 'WebSocket not available' });
    }
    
    const timeEvent = {
      event,
      user_id: req.user.id,
      project_id,
      task_id,
      timestamp: new Date(),
      data: data || {}
    };
    
    // Broadcast to project team
    io.to(`project-${project_id}`).emit('time-event', timeEvent);
    
    res.json({
      message: 'Time event broadcasted successfully',
      event: timeEvent
    });
  } catch (error) {
    console.error('Broadcast time event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active connections
router.get('/connections', authMiddleware, async (req, res) => {
  try {
    const io = req.app.get('io');
    
    if (!io) {
      return res.status(500).json({ error: 'WebSocket not available' });
    }
    
    const sockets = await io.fetchSockets();
    const connections = sockets.map(socket => ({
      id: socket.id,
      connected: socket.connected,
      rooms: Array.from(socket.rooms)
    }));
    
    res.json({
      total_connections: connections.length,
      connections
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;