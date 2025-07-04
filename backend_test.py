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
            "company": "Test Company",
            "role": "admin"
        }
        
        cls.manager_user = {
            "name": "Manager User",
            "email": f"manager_{uuid.uuid4()}@example.com",
            "password": "Manager@123456",
            "company": "Test Company",
            "role": "manager"
        }
        
        cls.regular_user = {
            "name": "Regular User",
            "email": f"user_{uuid.uuid4()}@example.com",
            "password": "User@123456",
            "company": "Test Company",
            "role": "user"
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
            response = requests.get(f"{API_URL}")
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
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.admin_user["email"])
        self.assertEqual(data["user"]["role"], self.admin_user["role"])
        
        # Save token and user ID
        self.tokens["admin"] = data["token"]
        self.user_ids["admin"] = data["user"]["id"]

    def test_04_register_manager(self):
        """Test user registration - manager"""
        response = requests.post(f"{API_URL}/auth/register", json=self.manager_user)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("token", data)
        
        # Save token and user ID
        self.tokens["manager"] = data["token"]
        self.user_ids["manager"] = data["user"]["id"]

    def test_05_register_regular_user(self):
        """Test user registration - regular user"""
        response = requests.post(f"{API_URL}/auth/register", json=self.regular_user)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("token", data)
        
        # Save token and user ID
        self.tokens["user"] = data["token"]
        self.user_ids["user"] = data["user"]["id"]

    def test_06_register_duplicate_email(self):
        """Test registration with duplicate email"""
        response = requests.post(f"{API_URL}/auth/register", json=self.admin_user)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "User already exists with this email")

    def test_07_login(self):
        """Test user login"""
        login_data = {
            "email": self.admin_user["email"],
            "password": self.admin_user["password"]
        }
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.admin_user["email"])

    def test_08_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": self.admin_user["email"],
            "password": "wrong_password"
        }
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Invalid credentials")

    def test_09_get_current_user(self):
        """Test getting current user info"""
        response = requests.get(
            f"{API_URL}/auth/me",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["email"], self.admin_user["email"])
        self.assertEqual(data["role"], self.admin_user["role"])

    # User Management Tests
    def test_10_get_all_users(self):
        """Test getting all users (admin only)"""
        response = requests.get(
            f"{API_URL}/users/",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("users", data)
        self.assertIsInstance(data["users"], list)
        self.assertGreaterEqual(len(data["users"]), 3)  # At least our 3 test users

    def test_11_get_all_users_as_regular_user(self):
        """Test getting all users as regular user (should fail)"""
        response = requests.get(
            f"{API_URL}/users/",
            headers=self.get_headers("user")
        )
        self.assertEqual(response.status_code, 403)
        data = response.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"], "Insufficient permissions")

    def test_12_get_user_profile(self):
        """Test getting user profile"""
        response = requests.get(
            f"{API_URL}/users/me",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["email"], self.admin_user["email"])
        self.assertEqual(data["role"], self.admin_user["role"])

    def test_13_update_user_profile(self):
        """Test updating user profile"""
        update_data = {
            "name": "Updated Admin Name",
            "timezone": "America/New_York"
        }
        response = requests.put(
            f"{API_URL}/users/me",
            json=update_data,
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user", data)
        self.assertEqual(data["user"]["name"], update_data["name"])
        self.assertEqual(data["user"]["timezone"], update_data["timezone"])

    def test_14_get_specific_user(self):
        """Test getting specific user by ID"""
        response = requests.get(
            f"{API_URL}/users/{self.user_ids['manager']}",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["email"], self.manager_user["email"])
        self.assertEqual(data["role"], self.manager_user["role"])

    def test_15_update_specific_user(self):
        """Test updating specific user (admin only)"""
        update_data = {
            "name": "Updated Manager Name"
        }
        response = requests.put(
            f"{API_URL}/users/{self.user_ids['manager']}",
            json=update_data,
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user", data)
        self.assertEqual(data["user"]["name"], update_data["name"])

    def test_16_get_team_stats(self):
        """Test getting team statistics"""
        response = requests.get(
            f"{API_URL}/users/team/stats",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("totalUsers", data)
        self.assertIn("activeUsers", data)
        self.assertIn("usersByRole", data)
        self.assertGreaterEqual(data["totalUsers"], 3)  # At least our 3 test users

    # Project Management Tests
    def test_17_create_project(self):
        """Test creating a project"""
        response = requests.post(
            f"{API_URL}/projects/",
            json=self.test_project,
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("project", data)
        self.assertEqual(data["project"]["name"], self.test_project["name"])
        self.assertEqual(data["project"]["client"], self.test_project["client"])
        self.assertEqual(data["project"]["budget"], self.test_project["budget"])
        self.assertEqual(data["project"]["createdBy"], self.user_ids["admin"])
        
        # Save project ID for later tests
        self.__class__.project_id = data["project"]["id"]
        self.__class__.test_project["id"] = data["project"]["id"]
        
        # Update team members to include our test users
        update_data = {
            "members": [self.user_ids["manager"], self.user_ids["user"]]
        }
        requests.put(
            f"{API_URL}/projects/{self.project_id}",
            json=update_data,
            headers=self.get_headers("admin")
        )

    def test_18_get_projects(self):
        """Test getting all projects"""
        response = requests.get(
            f"{API_URL}/projects/",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("projects", data)
        self.assertIsInstance(data["projects"], list)
        self.assertGreaterEqual(len(data["projects"]), 1)
        
        # Check if our test project is in the list
        project_ids = [p["id"] for p in data["projects"]]
        self.assertIn(self.project_id, project_ids)

    def test_19_get_specific_project(self):
        """Test getting specific project by ID"""
        response = requests.get(
            f"{API_URL}/projects/{self.project_id}",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.project_id)
        self.assertEqual(data["name"], self.test_project["name"])

    def test_20_update_project(self):
        """Test updating a project"""
        update_data = {
            "name": "Updated Project Name",
            "budget": 6000.0
        }
        response = requests.put(
            f"{API_URL}/projects/{self.project_id}",
            json=update_data,
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("project", data)
        self.assertEqual(data["project"]["name"], update_data["name"])
        self.assertEqual(data["project"]["budget"], update_data["budget"])

    def test_21_create_task(self):
        """Test creating a task in a project"""
        # Add assignee_id to task data
        task_data = self.test_task.copy()
        task_data["assignee_id"] = self.user_ids["user"]
        
        response = requests.post(
            f"{API_URL}/projects/{self.project_id}/tasks",
            json=task_data,
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("task", data)
        self.assertEqual(data["task"]["title"], task_data["title"])
        self.assertEqual(data["task"]["project_id"], self.project_id)
        self.assertEqual(data["task"]["assignee_id"], self.user_ids["user"])
        
        # Save task ID for later tests
        self.__class__.task_id = data["task"]["id"]
        self.__class__.time_entry["project_id"] = self.project_id
        self.__class__.time_entry["task_id"] = data["task"]["id"]
        self.__class__.manual_time_entry["project_id"] = self.project_id
        self.__class__.manual_time_entry["task_id"] = data["task"]["id"]

    def test_22_get_project_tasks(self):
        """Test getting tasks for a project"""
        response = requests.get(
            f"{API_URL}/projects/{self.project_id}/tasks",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("tasks", data)
        self.assertIsInstance(data["tasks"], list)
        self.assertGreaterEqual(len(data["tasks"]), 1)
        
        # Check if our test task is in the list
        task_ids = [t["id"] for t in data["tasks"]]
        self.assertIn(self.task_id, task_ids)

    def test_23_get_project_stats(self):
        """Test getting project statistics"""
        response = requests.get(
            f"{API_URL}/projects/stats/dashboard",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("project_stats", data)
        self.assertIn("recent_projects", data)
        self.assertIn("task_stats", data)

    # Time Tracking Tests
    def test_24_start_time_tracking(self):
        """Test starting time tracking"""
        response = requests.post(
            f"{API_URL}/time-tracking/start",
            json=self.time_entry,
            headers=self.get_headers("user")
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["project_id"], self.project_id)
        self.assertEqual(data["task_id"], self.task_id)
        self.assertEqual(data["user_id"], self.user_ids["user"])
        self.assertIsNone(data["end_time"])
        
        # Save time entry ID for later tests
        self.__class__.time_entry_id = data["id"]

    def test_25_get_active_time_entry(self):
        """Test getting active time entry"""
        response = requests.get(
            f"{API_URL}/time-tracking/active",
            headers=self.get_headers("user")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.time_entry_id)
        self.assertEqual(data["project_id"], self.project_id)
        self.assertEqual(data["task_id"], self.task_id)
        self.assertIsNone(data["end_time"])

    def test_26_stop_time_tracking(self):
        """Test stopping time tracking"""
        # Wait a moment to ensure some duration
        time.sleep(2)
        
        response = requests.post(
            f"{API_URL}/time-tracking/stop/{self.time_entry_id}",
            headers=self.get_headers("user")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.time_entry_id)
        self.assertIsNotNone(data["end_time"])
        self.assertIsNotNone(data["duration"])
        self.assertGreater(data["duration"], 0)

    def test_27_get_time_entries(self):
        """Test getting time entries"""
        response = requests.get(
            f"{API_URL}/time-tracking/entries",
            headers=self.get_headers("user")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("entries", data)
        self.assertIsInstance(data["entries"], list)
        self.assertGreaterEqual(len(data["entries"]), 1)
        
        # Check if our test time entry is in the list
        entry_ids = [e["id"] for e in data["entries"]]
        self.assertIn(self.time_entry_id, entry_ids)

    def test_28_create_manual_time_entry(self):
        """Test creating a manual time entry"""
        response = requests.post(
            f"{API_URL}/time-tracking/manual",
            json=self.manual_time_entry,
            headers=self.get_headers("user")
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["project_id"], self.project_id)
        self.assertEqual(data["task_id"], self.task_id)
        self.assertEqual(data["user_id"], self.user_ids["user"])
        self.assertIsNotNone(data["end_time"])
        self.assertTrue(data["is_manual"])

    # Analytics Tests
    def test_29_get_dashboard_analytics(self):
        """Test getting dashboard analytics"""
        response = requests.get(
            f"{API_URL}/analytics/dashboard",
            headers=self.get_headers("user")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("user_stats", data)
        self.assertIn("productivity_trend", data)
        self.assertIn("project_breakdown", data)
        self.assertIn("period", data)

    def test_30_get_team_analytics(self):
        """Test getting team analytics"""
        response = requests.get(
            f"{API_URL}/analytics/team",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("team_stats", data)
        self.assertIn("daily_productivity", data)
        self.assertIn("project_stats", data)
        self.assertIn("summary", data)
        self.assertIn("period", data)

    def test_31_get_productivity_analytics(self):
        """Test getting productivity analytics"""
        response = requests.get(
            f"{API_URL}/analytics/productivity?period=week",
            headers=self.get_headers("user")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("productivity_chart", data)
        self.assertIn("productivity_score", data)
        self.assertIn("total_hours", data)
        self.assertIn("avg_activity", data)
        self.assertIn("period", data)
        self.assertEqual(data["period"], "week")

    # Integration Tests
    def test_32_get_integrations(self):
        """Test getting user integrations"""
        response = requests.get(
            f"{API_URL}/integrations/",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("integrations", data)

    # WebSocket Tests
    def test_33_get_websocket_info(self):
        """Test getting WebSocket info"""
        response = requests.get(
            f"{API_URL}/websocket/info",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertIn("endpoint", data)
        self.assertIn("events", data)

    # Cleanup Tests
    def test_98_delete_project(self):
        """Test deleting a project"""
        response = requests.delete(
            f"{API_URL}/projects/{self.project_id}",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertEqual(data["message"], "Project deleted successfully")

    def test_99_logout(self):
        """Test user logout"""
        response = requests.post(
            f"{API_URL}/auth/logout",
            headers=self.get_headers("admin")
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertEqual(data["message"], "Logged out successfully")

if __name__ == "__main__":
    # Run tests in order
    unittest.main(verbosity=2)