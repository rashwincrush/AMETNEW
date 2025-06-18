#!/usr/bin/env python3
import requests
import json
import uuid
import sys
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://014c2879-b51f-40b2-a32a-20f6564a2965.preview.emergentagent.com"
API_BASE_URL = f"{BACKEND_URL}/api"

# Test data
test_user = {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "alumni",
    "graduation_year": 2020,
    "department": "Computer Science"
}

test_job = {
    "title": "Software Engineer",
    "company": "Tech Solutions Inc.",
    "location": "San Francisco, CA",
    "job_type": "Full-time",
    "experience": "3-5 years",
    "salary": "$120,000 - $150,000",
    "description": "We are looking for a skilled software engineer to join our team.",
    "requirements": ["Bachelor's degree in CS", "Experience with Python", "Knowledge of cloud platforms"],
    "skills": ["Python", "JavaScript", "AWS", "Docker"]
}

test_job_application = {
    "job_id": "placeholder_job_id",  # Will be replaced with actual job ID
    "cover_letter": "I am excited to apply for this position and believe my skills match your requirements.",
    "expected_salary": "$130,000"
}

test_message = {
    "receiver_id": "placeholder_user_id",  # Will be replaced with actual user ID
    "content": "Hello, I'm interested in discussing the job opportunity."
}

test_job_application_review = {
    "status": "approved",
    "notes": "Great candidate with relevant experience."
}

# Test results tracking
results = {
    "total_tests": 0,
    "passed_tests": 0,
    "failed_tests": 0,
    "skipped_tests": 0
}

created_resources = {
    "user_id": None,
    "job_id": None,
    "job_application_id": None,
    "message_id": None
}

def print_header(title):
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80)

def print_test_result(test_name, success, response=None, error=None):
    results["total_tests"] += 1
    
    if success:
        results["passed_tests"] += 1
        status = "✅ PASSED"
    elif error == "SKIPPED":
        results["skipped_tests"] += 1
        status = "⏭️ SKIPPED"
    else:
        results["failed_tests"] += 1
        status = "❌ FAILED"
    
    print(f"{status} - {test_name}")
    
    if response and not success and error != "SKIPPED":
        try:
            print(f"  Response: {response.status_code} - {response.json()}")
        except:
            print(f"  Response: {response.status_code} - {response.text}")
    
    if error and error != "SKIPPED":
        print(f"  Error: {error}")
    
    return success

def test_health_endpoint():
    print_header("Testing Health Endpoint")
    
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        success = response.status_code == 200 and "status" in response.json()
        return print_test_result("GET /api/health", success, response)
    except Exception as e:
        return print_test_result("GET /api/health", False, error=str(e))

def test_root_endpoint():
    print_header("Testing Root Endpoint")
    
    try:
        response = requests.get(f"{API_BASE_URL}/")
        success = response.status_code == 200 and "message" in response.json()
        return print_test_result("GET /api/", success, response)
    except Exception as e:
        return print_test_result("GET /api/", False, error=str(e))

def test_user_endpoints():
    print_header("Testing User Endpoints")
    
    # Test GET /api/users
    try:
        response = requests.get(f"{API_BASE_URL}/users")
        get_success = response.status_code == 200
        print_test_result("GET /api/users", get_success, response)
    except Exception as e:
        print_test_result("GET /api/users", False, error=str(e))
    
    # Test POST /api/users
    try:
        headers = {"Content-Type": "application/json"}
        response = requests.post(
            f"{API_BASE_URL}/users", 
            headers=headers,
            json=test_user
        )
        
        post_success = response.status_code == 200 and "id" in response.json()
        
        if post_success:
            created_resources["user_id"] = response.json()["id"]
            test_message["receiver_id"] = created_resources["user_id"]
            
        print_test_result("POST /api/users", post_success, response)
        
        # Test GET /api/users/{user_id} if user was created
        if created_resources["user_id"]:
            try:
                response = requests.get(f"{API_BASE_URL}/users/{created_resources['user_id']}")
                get_by_id_success = response.status_code == 200 and response.json()["id"] == created_resources["user_id"]
                print_test_result(f"GET /api/users/{created_resources['user_id']}", get_by_id_success, response)
            except Exception as e:
                print_test_result(f"GET /api/users/{created_resources['user_id']}", False, error=str(e))
        else:
            print_test_result("GET /api/users/{user_id}", False, error="SKIPPED - No user created")
            
    except Exception as e:
        print_test_result("POST /api/users", False, error=str(e))

def test_dashboard_stats_endpoint():
    print_header("Testing Dashboard Stats Endpoint")
    
    try:
        response = requests.get(f"{API_BASE_URL}/dashboard/stats")
        success = response.status_code == 200 and "total_alumni" in response.json()
        return print_test_result("GET /api/dashboard/stats", success, response)
    except Exception as e:
        return print_test_result("GET /api/dashboard/stats", False, error=str(e))

def test_job_endpoints():
    print_header("Testing Job Endpoints")
    
    # Test GET /api/jobs
    try:
        response = requests.get(f"{API_BASE_URL}/jobs")
        get_success = response.status_code == 200
        print_test_result("GET /api/jobs", get_success, response)
    except Exception as e:
        print_test_result("GET /api/jobs", False, error=str(e))
    
    # Test POST /api/jobs
    try:
        headers = {"Content-Type": "application/json"}
        response = requests.post(
            f"{API_BASE_URL}/jobs", 
            headers=headers,
            json=test_job
        )
        
        post_success = response.status_code == 200 and "id" in response.json()
        
        if post_success:
            created_resources["job_id"] = response.json()["id"]
            test_job_application["job_id"] = created_resources["job_id"]
            
        print_test_result("POST /api/jobs", post_success, response)
        
        # Test GET /api/jobs/{job_id} if job was created
        if created_resources["job_id"]:
            try:
                response = requests.get(f"{API_BASE_URL}/jobs/{created_resources['job_id']}")
                get_by_id_success = response.status_code == 200 and response.json()["id"] == created_resources["job_id"]
                print_test_result(f"GET /api/jobs/{created_resources['job_id']}", get_by_id_success, response)
            except Exception as e:
                print_test_result(f"GET /api/jobs/{created_resources['job_id']}", False, error=str(e))
        else:
            print_test_result("GET /api/jobs/{job_id}", False, error="SKIPPED - No job created")
            
    except Exception as e:
        print_test_result("POST /api/jobs", False, error=str(e))

def test_job_application_endpoints():
    print_header("Testing Job Application Endpoints")
    
    # Skip if no job was created
    if not created_resources["job_id"]:
        print_test_result("POST /api/job-applications", False, error="SKIPPED - No job created")
        print_test_result("GET /api/job-applications", False, error="SKIPPED - No job created")
        print_test_result("GET /api/job-applications/pending", False, error="SKIPPED - No job created")
        print_test_result("PUT /api/job-applications/{id}/review", False, error="SKIPPED - No job created")
        return
    
    # Test POST /api/job-applications
    try:
        headers = {"Content-Type": "application/json"}
        response = requests.post(
            f"{API_BASE_URL}/job-applications", 
            headers=headers,
            json=test_job_application
        )
        
        post_success = response.status_code == 200 and "id" in response.json()
        
        if post_success:
            created_resources["job_application_id"] = response.json()["id"]
            
        print_test_result("POST /api/job-applications", post_success, response)
    except Exception as e:
        print_test_result("POST /api/job-applications", False, error=str(e))
    
    # Test GET /api/job-applications
    try:
        response = requests.get(f"{API_BASE_URL}/job-applications")
        get_success = response.status_code == 200
        print_test_result("GET /api/job-applications", get_success, response)
    except Exception as e:
        print_test_result("GET /api/job-applications", False, error=str(e))
    
    # Test GET /api/job-applications/pending
    try:
        response = requests.get(f"{API_BASE_URL}/job-applications/pending")
        get_pending_success = response.status_code == 200
        print_test_result("GET /api/job-applications/pending", get_pending_success, response)
    except Exception as e:
        print_test_result("GET /api/job-applications/pending", False, error=str(e))
    
    # Test PUT /api/job-applications/{id}/review if application was created
    if created_resources["job_application_id"]:
        try:
            headers = {"Content-Type": "application/json"}
            response = requests.put(
                f"{API_BASE_URL}/job-applications/{created_resources['job_application_id']}/review", 
                headers=headers,
                json=test_job_application_review
            )
            
            review_success = response.status_code == 200 and response.json()["status"] == test_job_application_review["status"]
            print_test_result(f"PUT /api/job-applications/{created_resources['job_application_id']}/review", review_success, response)
        except Exception as e:
            print_test_result(f"PUT /api/job-applications/{created_resources['job_application_id']}/review", False, error=str(e))
    else:
        print_test_result("PUT /api/job-applications/{id}/review", False, error="SKIPPED - No job application created")

def test_message_endpoints():
    print_header("Testing Message Endpoints")
    
    # Skip if no user was created
    if not created_resources["user_id"]:
        print_test_result("POST /api/messages", False, error="SKIPPED - No user created")
        print_test_result("GET /api/messages/conversations/{user_id}", False, error="SKIPPED - No user created")
        print_test_result("GET /api/messages/recent", False, error="SKIPPED - No user created")
        return
    
    # Test POST /api/messages
    try:
        headers = {"Content-Type": "application/json"}
        response = requests.post(
            f"{API_BASE_URL}/messages", 
            headers=headers,
            json=test_message
        )
        
        post_success = response.status_code == 200 and "id" in response.json()
        
        if post_success:
            created_resources["message_id"] = response.json()["id"]
            
        print_test_result("POST /api/messages", post_success, response)
    except Exception as e:
        print_test_result("POST /api/messages", False, error=str(e))
    
    # Test GET /api/messages/conversations/{user_id}
    try:
        response = requests.get(f"{API_BASE_URL}/messages/conversations/{created_resources['user_id']}")
        get_conversation_success = response.status_code == 200
        print_test_result(f"GET /api/messages/conversations/{created_resources['user_id']}", get_conversation_success, response)
    except Exception as e:
        print_test_result(f"GET /api/messages/conversations/{created_resources['user_id']}", False, error=str(e))
    
    # Test GET /api/messages/recent
    try:
        response = requests.get(f"{API_BASE_URL}/messages/recent")
        get_recent_success = response.status_code == 200
        print_test_result("GET /api/messages/recent", get_recent_success, response)
    except Exception as e:
        print_test_result("GET /api/messages/recent", False, error=str(e))

def print_summary():
    print_header("Test Summary")
    print(f"Total Tests: {results['total_tests']}")
    print(f"Passed: {results['passed_tests']}")
    print(f"Failed: {results['failed_tests']}")
    print(f"Skipped: {results['skipped_tests']}")
    
    success_rate = (results['passed_tests'] / (results['total_tests'] - results['skipped_tests'])) * 100 if (results['total_tests'] - results['skipped_tests']) > 0 else 0
    print(f"Success Rate: {success_rate:.2f}%")
    
    print("\nCreated Resources:")
    for resource, resource_id in created_resources.items():
        print(f"  {resource}: {resource_id if resource_id else 'None'}")

def run_all_tests():
    print_header("AMET Alumni Management System API Tests")
    print(f"Testing against: {API_BASE_URL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Basic endpoints
    test_root_endpoint()
    test_health_endpoint()
    
    # Core functionality
    test_user_endpoints()
    test_dashboard_stats_endpoint()
    test_job_endpoints()
    test_job_application_endpoints()
    test_message_endpoints()
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    run_all_tests()