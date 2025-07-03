from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, WebSocket] = {}
        # Store user sessions
        self.user_sessions: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a user to WebSocket"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_sessions[user_id] = {
            "connected_at": datetime.utcnow(),
            "status": "online"
        }
        logger.info(f"User {user_id} connected to WebSocket")
        
        # Notify others about user coming online
        await self.broadcast_user_status(user_id, "online")

    async def disconnect(self, user_id: str):
        """Disconnect a user from WebSocket"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_sessions:
            del self.user_sessions[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket")
        
        # Notify others about user going offline
        await self.broadcast_user_status(user_id, "offline")

    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to specific user"""
        if user_id in self.active_connections:
            try:
                websocket = self.active_connections[user_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                # Remove dead connection
                await self.disconnect(user_id)

    async def broadcast_message(self, message: dict, exclude_user: str = None):
        """Broadcast message to all connected users"""
        disconnected_users = []
        
        for user_id, websocket in self.active_connections.items():
            if exclude_user and user_id == exclude_user:
                continue
                
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            await self.disconnect(user_id)

    async def broadcast_user_status(self, user_id: str, status: str):
        """Broadcast user status change to all connected users"""
        message = {
            "type": "user_status_update",
            "data": {
                "user_id": user_id,
                "status": status,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        await self.broadcast_message(message, exclude_user=user_id)

    async def broadcast_time_entry_update(self, user_id: str, time_entry_data: dict):
        """Broadcast time entry updates"""
        message = {
            "type": "time_entry_update",
            "data": {
                "user_id": user_id,
                "time_entry": time_entry_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        await self.broadcast_message(message)

    async def broadcast_project_update(self, project_data: dict):
        """Broadcast project updates"""
        message = {
            "type": "project_update",
            "data": {
                "project": project_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        await self.broadcast_message(message)

    async def broadcast_team_activity(self, activity_data: dict):
        """Broadcast team activity updates"""
        message = {
            "type": "team_activity",
            "data": {
                "activity": activity_data,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        await self.broadcast_message(message)

    def get_online_users(self) -> List[str]:
        """Get list of online user IDs"""
        return list(self.active_connections.keys())

    def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        return user_id in self.active_connections

# Create global instance
manager = ConnectionManager()