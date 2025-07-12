#!/usr/bin/env python3
import requests
import json
import time
import unittest
import uuid
from datetime import datetime, timedelta
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get backend URL from frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.strip().split('=')[1].strip('"\'')
            break

API_URL = f"{BASE_URL}/api"
print(f"Testing API at: {API_URL}")

class HubstaffAPITest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.admin_user = {
            "name": "Admin User",
            "email": f"admin_{uuid.uuid4()}@example.com",
            "password": "Admin@123456",
            "organizationName": "Test Company Admin"
        }
        
        cls.manager_user = {
            "name": "Manager User", 
            "email": f"manager_{uuid.uuid4()}@example.com",
            "password": "Manager@123456",
            "organizationName": "Test Company Manager"
        }
        
        cls.regular_user = {
            "name": "Regular User",
            "email": f"user_{uuid.uuid4()}@example.com", 
            "password": "User@123456",
            "organizationName": "Test Company User"
        }
        
        cls.test_project = {
            "name": "Test Project",
            "description": "A test project for API testing",
            "client": "Test Client",
            "budget": 5000.0,
            "startDate": (datetime.utcnow()).isoformat(),
            "endDate": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "members": []
        }
        
        cls.test_task = {
            "title": "Test Task",
            "description": "A test task for API testing",
            "priority": "medium",
            "estimatedHours": 10.0,
            "dueDate": (datetime.utcnow() + timedelta(days=7)).isoformat()
        }
        
        cls.time_entry = {
            "project_id": "",  # Will be set during tests
            "task_id": "",     # Will be set during tests
            "description": "Working on test task"
        }
        
        cls.manual_time_entry = {
            "project_id": "",  # Will be set during tests
            "task_id": "",     # Will be set during tests
            "start_time": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            "end_time": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
            "description": "Manual time entry for testing"
        }
        
        cls.tokens = {
            "admin": None,
            "manager": None,
            "user": None
        }
        
        cls.user_ids = {
            "admin": None,
            "manager": None,
            "user": None
        }
        
        cls.project_id = None
        cls.task_id = None
        cls.time_entry_id = None

    def get_headers(self, user_type="admin"):
        """Get authorization headers for a user type"""
        token = self.tokens.get(user_type)
        if not token:
            self.fail(f"No token available for {user_type}")
        return {
            "Authorization": f"Bearer {token}"
        }

    def test_01_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{API_URL}/health")
            print(f"Health check response: {response.status_code}, {response.text}")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["status"], "healthy")
        except Exception as e:
            print(f"Health check error: {e}")
            raise

    def test_02_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{BASE_URL}")  # Test root endpoint, not /api
            print(f"API root response: {response.status_code}, {response.text}")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("message", data)
            self.assertIn("version", data)
        except Exception as e:
            print(f"API root error: {e}")
            raise

    # Authentication Tests
    def test_03_register_admin(self):
        """Test user registration - admin"""
        response = requests.post(f"{API_URL}/auth/register", json=self.admin_user)
        print(f"Admin registration response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.admin_user["email"])
        
        # Save token and user ID
        self.tokens["admin"] = data["token"]
        self.user_ids["admin"] = data["user"]["id"]

    def test_04_register_manager(self):
        """Test user registration - manager"""
        response = requests.post(f"{API_URL}/auth/register", json=self.manager_user)
        print(f"Manager registration response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("token", data)
        
        # Save token and user ID
        self.tokens["manager"] = data["token"]
        self.user_ids["manager"] = data["user"]["id"]

    def test_05_register_regular_user(self):
        """Test user registration - regular user"""
        response = requests.post(f"{API_URL}/auth/register", json=self.regular_user)
        print(f"User registration response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("token", data)
        
        # Save token and user ID
        self.tokens["user"] = data["token"]
        self.user_ids["user"] = data["user"]["id"]

    def test_06_login(self):
        """Test user login"""
        login_data = {
            "email": self.admin_user["email"],
            "password": self.admin_user["password"]
        }
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        print(f"Login response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.admin_user["email"])

    def test_07_get_current_user(self):
        """Test getting current user info"""
        response = requests.get(
            f"{API_URL}/auth/me",
            headers=self.get_headers("admin")
        )
        print(f"Current user response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["email"], self.admin_user["email"])

    # User Management Tests
    def test_08_get_all_users(self):
        """Test getting all users (admin only)"""
        response = requests.get(
            f"{API_URL}/users/",
            headers=self.get_headers("admin")
        )
        print(f"Get all users response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("users", data)
        self.assertIsInstance(data["users"], list)

    def test_09_get_user_profile(self):
        """Test getting user profile"""
        response = requests.get(
            f"{API_URL}/users/me",
            headers=self.get_headers("admin")
        )
        print(f"User profile response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["email"], self.admin_user["email"])

    # Project Management Tests
    def test_10_create_project(self):
        """Test creating a project"""
        response = requests.post(
            f"{API_URL}/projects/",
            json=self.test_project,
            headers=self.get_headers("admin")
        )
        print(f"Create project response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("project", data)
        self.assertEqual(data["project"]["name"], self.test_project["name"])
        
        # Save project ID for later tests
        self.__class__.project_id = data["project"]["id"]
        self.__class__.time_entry["project_id"] = data["project"]["id"]
        self.__class__.manual_time_entry["project_id"] = data["project"]["id"]

    def test_11_get_projects(self):
        """Test getting all projects"""
        response = requests.get(
            f"{API_URL}/projects/",
            headers=self.get_headers("admin")
        )
        print(f"Get projects response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("projects", data)
        self.assertIsInstance(data["projects"], list)

    def test_12_create_task(self):
        """Test creating a task in a project"""
        task_data = self.test_task.copy()
        task_data["assignee_id"] = self.user_ids["user"]
        
        response = requests.post(
            f"{API_URL}/projects/{self.project_id}/tasks",
            json=task_data,
            headers=self.get_headers("admin")
        )
        print(f"Create task response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("task", data)
        self.assertEqual(data["task"]["title"], task_data["title"])
        
        # Save task ID for later tests
        self.__class__.task_id = data["task"]["id"]
        self.__class__.time_entry["task_id"] = data["task"]["id"]
        self.__class__.manual_time_entry["task_id"] = data["task"]["id"]

    def test_13_get_project_tasks(self):
        """Test getting tasks for a project"""
        response = requests.get(
            f"{API_URL}/projects/{self.project_id}/tasks",
            headers=self.get_headers("admin")
        )
        print(f"Get project tasks response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("tasks", data)
        self.assertIsInstance(data["tasks"], list)

    # Time Tracking Tests
    def test_14_start_time_tracking(self):
        """Test starting time tracking"""
        response = requests.post(
            f"{API_URL}/time-tracking/start",
            json=self.time_entry,
            headers=self.get_headers("user")
        )
        print(f"Start time tracking response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["project_id"], self.project_id)
        self.assertEqual(data["task_id"], self.task_id)
        self.assertIsNone(data["end_time"])
        
        # Save time entry ID for later tests
        self.__class__.time_entry_id = data["id"]

    def test_15_get_active_time_entry(self):
        """Test getting active time entry"""
        response = requests.get(
            f"{API_URL}/time-tracking/active",
            headers=self.get_headers("user")
        )
        print(f"Get active time entry response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.time_entry_id)
        self.assertIsNone(data["end_time"])

    def test_16_stop_time_tracking(self):
        """Test stopping time tracking"""
        time.sleep(2)  # Wait a moment to ensure some duration
        
        response = requests.post(
            f"{API_URL}/time-tracking/stop/{self.time_entry_id}",
            headers=self.get_headers("user")
        )
        print(f"Stop time tracking response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.time_entry_id)
        self.assertIsNotNone(data["end_time"])
        self.assertIsNotNone(data["duration"])

    def test_17_get_time_entries(self):
        """Test getting time entries"""
        response = requests.get(
            f"{API_URL}/time-tracking/entries",
            headers=self.get_headers("user")
        )
        print(f"Get time entries response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("entries", data)
        self.assertIsInstance(data["entries"], list)

    def test_18_create_manual_time_entry(self):
        """Test creating a manual time entry"""
        response = requests.post(
            f"{API_URL}/time-tracking/manual",
            json=self.manual_time_entry,
            headers=self.get_headers("user")
        )
        print(f"Create manual time entry response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["project_id"], self.project_id)
        self.assertEqual(data["task_id"], self.task_id)
        self.assertIsNotNone(data["end_time"])

    # Analytics Tests
    def test_19_get_dashboard_analytics(self):
        """Test getting dashboard analytics"""
        response = requests.get(
            f"{API_URL}/analytics/dashboard",
            headers=self.get_headers("user")
        )
        print(f"Get dashboard analytics response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user_stats", data)

    def test_20_get_team_analytics(self):
        """Test getting team analytics"""
        response = requests.get(
            f"{API_URL}/analytics/team",
            headers=self.get_headers("admin")
        )
        print(f"Get team analytics response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("team_stats", data)

    # Integration Tests
    def test_21_get_integrations(self):
        """Test getting user integrations"""
        response = requests.get(
            f"{API_URL}/integrations/",
            headers=self.get_headers("admin")
        )
        print(f"Get integrations response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("integrations", data)

    # WebSocket Tests
    def test_22_get_websocket_info(self):
        """Test getting WebSocket info"""
        response = requests.get(
            f"{API_URL}/websocket/info",
            headers=self.get_headers("admin")
        )
        print(f"Get WebSocket info response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)

    # Cleanup Tests
    def test_98_delete_project(self):
        """Test deleting a project"""
        response = requests.delete(
            f"{API_URL}/projects/{self.project_id}",
            headers=self.get_headers("admin")
        )
        print(f"Delete project response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)

    def test_99_logout(self):
        """Test user logout"""
        response = requests.post(
            f"{API_URL}/auth/logout",
            headers=self.get_headers("admin")
        )
        print(f"Logout response: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)

if __name__ == "__main__":
    # Run tests in order
    unittest.main(verbosity=2)