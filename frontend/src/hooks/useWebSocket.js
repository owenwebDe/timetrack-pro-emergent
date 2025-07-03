import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const useWebSocket = (user) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('hubstaff_token');
    if (!token) return;

    // Connect to WebSocket
    const wsUrl = `${BACKEND_URL}/ws/${token}`;
    socketRef.current = io(wsUrl, {
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    socketRef.current.on('connection_established', (data) => {
      setOnlineUsers(data.online_users || []);
    });

    socketRef.current.on('user_status_update', (data) => {
      setOnlineUsers(prev => {
        if (data.status === 'online') {
          return [...prev.filter(id => id !== data.user_id), data.user_id];
        } else {
          return prev.filter(id => id !== data.user_id);
        }
      });
    });

    socketRef.current.on('time_entry_update', (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'time_entry',
        message: `${data.user_id} updated time tracking`,
        timestamp: new Date(),
        data: data.time_entry
      }]);
    });

    socketRef.current.on('project_update', (data) => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'project',
        message: `Project "${data.project.name}" was updated`,
        timestamp: new Date(),
        data: data.project
      }]);
    });

    socketRef.current.on('team_activity', (data) => {
      // Handle team activity updates
      console.log('Team activity update:', data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const sendMessage = (type, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message', { type, data });
    }
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return {
    isConnected,
    onlineUsers,
    notifications,
    sendMessage,
    markNotificationAsRead
  };
};