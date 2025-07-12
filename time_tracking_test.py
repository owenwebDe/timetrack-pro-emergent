#!/usr/bin/env python3
"""
Focused Time Tracking API Test
Tests specifically the time tracking functionality that was just fixed.
"""
import requests
import json
import time
import uuid
from datetime import datetime, timedelta
import os

# Get backend URL from frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BASE_URL = line.strip().split('=')[1].strip('"\'')
            break

API_URL = f"{BASE_URL}/api"
print(f"Testing Time Tracking API at: {API_URL}")

class TimeTrackingTest:
    def __init__(self):
        org_suffix = str(uuid.uuid4())[:8]
        self.admin_user = {
            "name": "Time Tracker Admin",
            "email": f"timetrack_admin_{uuid.uuid4()}@example.com",
            "password": "TimeTrack@123456",
            "organizationName": f"TimeTrack Admin Org {org_suffix}",
            "role": "admin"
        }
        
        self.regular_user = {
            "name": "Time Tracker User",
            "email": f"timetrack_user_{uuid.uuid4()}@example.com",
            "password": "TimeTrack@123456",
            "organizationName": f"TimeTrack User Org {org_suffix}",
            "role": "user"
        }
        
        self.test_project = {
            "name": "Time Tracking Test Project",
            "description": "A project for testing time tracking functionality",
            "client": "Test Client",
            "budget": 5000.0,
            "startDate": (datetime.utcnow()).isoformat(),
            "endDate": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "members": []
        }
        
        self.test_task = {
            "title": "Time Tracking Test Task",
            "description": "A task for testing time tracking",
            "priority": "medium",
            "estimatedHours": 10.0,
            "dueDate": (datetime.utcnow() + timedelta(days=7)).isoformat()
        }
        
        self.tokens = {}
        self.user_ids = {}
        self.project_id = None
        self.task_id = None
        self.time_entry_id = None
        
    def get_headers(self, user_type="admin"):
        """Get authorization headers for a user type"""
        token = self.tokens.get(user_type)
        if not token:
            raise Exception(f"No token available for {user_type}")
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def setup_test_data(self):
        """Setup users, project, and task for testing"""
        print("\n🔧 Setting up test data...")
        
        # Register admin user (creates organization)
        response = requests.post(f"{API_URL}/auth/register", json=self.admin_user)
        if response.status_code != 201:
            raise Exception(f"Failed to register admin user: {response.text}")
        
        data = response.json()
        self.tokens["admin"] = data["token"]
        self.user_ids["admin"] = data["user"]["id"]
        print(f"✅ Admin user registered: {self.admin_user['email']}")
        
        # Create invitation for regular user
        invitation_data = {
            "email": self.regular_user["email"],
            "role": "user",
            "message": "Join our time tracking test organization"
        }
        
        response = requests.post(
            f"{API_URL}/invitations/",
            json=invitation_data,
            headers=self.get_headers("admin")
        )
        
        if response.status_code != 201:
            raise Exception(f"Failed to create invitation: {response.text}")
        
        invitation_data = response.json()
        invitation_token = invitation_data["invitation"]["token"]
        print(f"✅ Invitation created for regular user")
        
        # Register regular user with invitation token
        regular_user_with_token = self.regular_user.copy()
        regular_user_with_token["invitationToken"] = invitation_token
        # Remove organizationName since they're joining existing org
        del regular_user_with_token["organizationName"]
        
        response = requests.post(f"{API_URL}/auth/register", json=regular_user_with_token)
        if response.status_code != 201:
            raise Exception(f"Failed to register regular user: {response.text}")
        
        data = response.json()
        self.tokens["user"] = data["token"]
        self.user_ids["user"] = data["user"]["id"]
        print(f"✅ Regular user registered: {self.regular_user['email']}")
        
        # Create project
        response = requests.post(
            f"{API_URL}/projects/",
            json=self.test_project,
            headers=self.get_headers("admin")
        )
        if response.status_code != 201:
            raise Exception(f"Failed to create project: {response.text}")
        
        data = response.json()
        self.project_id = data["project"]["id"]
        print(f"✅ Project created: {self.test_project['name']} (ID: {self.project_id})")
        
        # Add regular user to project
        update_data = {"members": [self.user_ids["user"]]}
        response = requests.put(
            f"{API_URL}/projects/{self.project_id}",
            json=update_data,
            headers=self.get_headers("admin")
        )
        if response.status_code != 200:
            print(f"⚠️ Warning: Failed to add user to project: {response.text}")
        else:
            print(f"✅ User added to project")
        
        # Create task
        task_data = self.test_task.copy()
        task_data["assignee_id"] = self.user_ids["user"]
        
        response = requests.post(
            f"{API_URL}/projects/{self.project_id}/tasks",
            json=task_data,
            headers=self.get_headers("admin")
        )
        if response.status_code != 201:
            raise Exception(f"Failed to create task: {response.text}")
        
        data = response.json()
        self.task_id = data["task"]["id"]
        print(f"✅ Task created: {self.test_task['title']} (ID: {self.task_id})")

    def test_diagnose_endpoint(self):
        """Test /api/time-tracking/diagnose endpoint"""
        print("\n🔍 Testing diagnose endpoint...")
        
        response = requests.post(
            f"{API_URL}/time-tracking/diagnose",
            json={},
            headers=self.get_headers("user")
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Diagnose endpoint working")
            print(f"   Success: {data.get('success', False)}")
            print(f"   Checks: {len(data.get('checks', []))}")
            print(f"   Errors: {len(data.get('errors', []))}")
            
            for check in data.get('checks', []):
                print(f"   - {check['name']}: {check['status']}")
            
            if data.get('errors'):
                for error in data['errors']:
                    print(f"   ❌ Error: {error}")
            
            return data.get('success', False)
        else:
            print(f"❌ Diagnose endpoint failed: {response.text}")
            return False

    def test_start_time_tracking(self):
        """Test /api/time-tracking/start endpoint"""
        print("\n▶️ Testing start time tracking...")
        
        # Test with project and task
        time_entry_data = {
            "project_id": self.project_id,
            "task_id": self.task_id,
            "description": "Testing time tracking functionality"
        }
        
        response = requests.post(
            f"{API_URL}/time-tracking/start",
            json=time_entry_data,
            headers=self.get_headers("user")
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            self.time_entry_id = data["id"]
            print(f"✅ Time tracking started successfully")
            print(f"   Entry ID: {data['id']}")
            print(f"   Project: {data.get('project_name', 'Unknown')}")
            print(f"   Task: {data.get('task_title', 'Unknown')}")
            print(f"   Description: {data['description']}")
            return True
        else:
            print(f"❌ Failed to start time tracking: {response.text}")
            return False

    def test_get_active_timer(self):
        """Test /api/time-tracking/active endpoint"""
        print("\n🔄 Testing get active timer...")
        
        response = requests.get(
            f"{API_URL}/time-tracking/active",
            headers=self.get_headers("user")
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data:
                print(f"✅ Active timer found")
                print(f"   Entry ID: {data['id']}")
                print(f"   Project: {data.get('project_name', 'Unknown')}")
                print(f"   Task: {data.get('task_title', 'Unknown')}")
                print(f"   Started: {data['start_time']}")
                return True
            else:
                print(f"ℹ️ No active timer (this is expected if no timer is running)")
                return True
        else:
            print(f"❌ Failed to get active timer: {response.text}")
            return False

    def test_stop_time_tracking(self):
        """Test /api/time-tracking/stop/:id endpoint"""
        print("\n⏹️ Testing stop time tracking...")
        
        if not self.time_entry_id:
            print("❌ No time entry ID available for stopping")
            return False
        
        # Wait a moment to ensure some duration
        time.sleep(2)
        
        response = requests.post(
            f"{API_URL}/time-tracking/stop/{self.time_entry_id}",
            headers=self.get_headers("user")
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Time tracking stopped successfully")
            print(f"   Entry ID: {data['id']}")
            print(f"   Duration: {data['duration']} seconds")
            print(f"   Total Amount: ${data.get('total_amount', 0):.2f}")
            return True
        else:
            print(f"❌ Failed to stop time tracking: {response.text}")
            return False

    def test_get_time_entries(self):
        """Test /api/time-tracking/entries endpoint"""
        print("\n📋 Testing get time entries...")
        
        response = requests.get(
            f"{API_URL}/time-tracking/entries",
            headers=self.get_headers("user")
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            entries = data.get("entries", [])
            print(f"✅ Time entries retrieved successfully")
            print(f"   Total entries: {len(entries)}")
            print(f"   Pagination: {data.get('pagination', {})}")
            
            if entries:
                entry = entries[0]
                print(f"   Latest entry:")
                print(f"     - Project: {entry.get('project_name', 'Unknown')}")
                print(f"     - Task: {entry.get('task_title', 'Unknown')}")
                print(f"     - Duration: {entry.get('duration', 0)} seconds")
            
            return True
        else:
            print(f"❌ Failed to get time entries: {response.text}")
            return False

    def test_manual_time_entry(self):
        """Test /api/time-tracking/manual endpoint"""
        print("\n✏️ Testing manual time entry...")
        
        manual_entry = {
            "project_id": self.project_id,
            "task_id": self.task_id,
            "description": "Manual time entry for testing",
            "start_time": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            "end_time": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
            "billable": True
        }
        
        response = requests.post(
            f"{API_URL}/time-tracking/manual",
            json=manual_entry,
            headers=self.get_headers("user")
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Manual time entry created successfully")
            print(f"   Entry ID: {data['entry']['id']}")
            print(f"   Duration: {data['entry']['duration']} seconds")
            print(f"   Is Manual: {data['entry']['is_manual']}")
            return True
        else:
            print(f"❌ Failed to create manual time entry: {response.text}")
            return False

    def test_error_cases(self):
        """Test error cases"""
        print("\n🚨 Testing error cases...")
        
        results = []
        
        # Test starting timer without project (should auto-select or fail gracefully)
        print("   Testing start without project...")
        response = requests.post(
            f"{API_URL}/time-tracking/start",
            json={"description": "No project specified"},
            headers=self.get_headers("user")
        )
        if response.status_code in [201, 400]:  # Either auto-selects or fails gracefully
            print(f"   ✅ Start without project handled correctly ({response.status_code})")
            results.append(True)
        else:
            print(f"   ❌ Unexpected response for start without project: {response.status_code}")
            results.append(False)
        
        # Test starting timer when one is already active (first start one)
        print("   Testing start when timer already active...")
        # Start a timer first
        start_response = requests.post(
            f"{API_URL}/time-tracking/start",
            json={
                "project_id": self.project_id,
                "task_id": self.task_id,
                "description": "First timer"
            },
            headers=self.get_headers("user")
        )
        
        if start_response.status_code == 201:
            # Try to start another timer
            response = requests.post(
                f"{API_URL}/time-tracking/start",
                json={
                    "project_id": self.project_id,
                    "description": "Second timer"
                },
                headers=self.get_headers("user")
            )
            
            if response.status_code == 400:
                print(f"   ✅ Duplicate timer start prevented correctly")
                results.append(True)
                
                # Stop the active timer for cleanup
                active_data = start_response.json()
                requests.post(
                    f"{API_URL}/time-tracking/stop/{active_data['id']}",
                    headers=self.get_headers("user")
                )
            else:
                print(f"   ❌ Duplicate timer start not prevented: {response.status_code}")
                results.append(False)
        else:
            print(f"   ⚠️ Could not start initial timer for duplicate test")
            results.append(False)
        
        # Test stopping non-existent timer
        print("   Testing stop non-existent timer...")
        fake_id = str(uuid.uuid4())
        response = requests.post(
            f"{API_URL}/time-tracking/stop/{fake_id}",
            headers=self.get_headers("user")
        )
        
        if response.status_code == 404:
            print(f"   ✅ Non-existent timer stop handled correctly")
            results.append(True)
        else:
            print(f"   ❌ Non-existent timer stop not handled correctly: {response.status_code}")
            results.append(False)
        
        return all(results)

    def cleanup(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        try:
            # Delete project (this should cascade delete tasks and time entries)
            if self.project_id:
                response = requests.delete(
                    f"{API_URL}/projects/{self.project_id}",
                    headers=self.get_headers("admin")
                )
                if response.status_code == 200:
                    print("✅ Test project deleted")
                else:
                    print(f"⚠️ Failed to delete project: {response.text}")
        except Exception as e:
            print(f"⚠️ Cleanup error: {e}")

    def run_all_tests(self):
        """Run all time tracking tests"""
        print("🚀 Starting Time Tracking API Tests")
        print("=" * 50)
        
        results = {}
        
        try:
            # Setup
            self.setup_test_data()
            
            # Run tests
            results["diagnose"] = self.test_diagnose_endpoint()
            results["start_tracking"] = self.test_start_time_tracking()
            results["get_active"] = self.test_get_active_timer()
            results["stop_tracking"] = self.test_stop_time_tracking()
            results["get_entries"] = self.test_get_time_entries()
            results["manual_entry"] = self.test_manual_time_entry()
            results["error_cases"] = self.test_error_cases()
            
        except Exception as e:
            print(f"\n❌ Test setup failed: {e}")
            return False
        
        finally:
            # Cleanup
            self.cleanup()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 50)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All time tracking tests PASSED!")
            return True
        else:
            print("⚠️ Some time tracking tests FAILED!")
            return False

if __name__ == "__main__":
    test = TimeTrackingTest()
    success = test.run_all_tests()
    exit(0 if success else 1)