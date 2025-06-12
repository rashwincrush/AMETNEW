#!/usr/bin/env python3
import requests
import json
import os
import sys
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = None
try:
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BACKEND_URL = line.strip().split('=')[1].strip('"\'')
                break
except Exception as e:
    print(f"Error reading frontend .env file: {e}")
    sys.exit(1)

if not BACKEND_URL:
    print("REACT_APP_BACKEND_URL not found in frontend .env file")
    sys.exit(1)

# Ensure the URL ends with /api
API_URL = f"{BACKEND_URL}/api"
print(f"Using API URL: {API_URL}")

def test_health_endpoint():
    """Test the health check endpoint"""
    print("\n=== Testing Health Check Endpoint ===")
    try:
        response = requests.get(f"{API_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy" and data.get("database") == "connected":
                print("✅ Health check passed - API is healthy and connected to Supabase")
                return True
            else:
                print("❌ Health check failed - API is not reporting healthy status")
                return False
        else:
            print(f"❌ Health check failed with status code {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing health endpoint: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    print("\n=== Testing Root Endpoint ===")
    try:
        response = requests.get(f"{API_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "version" in data:
                print("✅ Root endpoint test passed")
                return True
            else:
                print("❌ Root endpoint test failed - unexpected response format")
                return False
        else:
            print(f"❌ Root endpoint test failed with status code {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing root endpoint: {e}")
        return False

def test_auth_endpoint_structure():
    """Test the authentication endpoint structure (without actual authentication)"""
    print("\n=== Testing Authentication Endpoint Structure ===")
    try:
        # Try to access a protected endpoint without authentication
        response = requests.get(f"{API_URL}/user")
        print(f"Status Code: {response.status_code}")
        
        # We expect a 401 Unauthorized or 403 Forbidden response
        if response.status_code in [401, 403]:
            print("✅ Authentication endpoint structure test passed - endpoint requires authentication")
            return True
        else:
            print(f"❌ Authentication endpoint structure test failed - expected 401/403, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing authentication endpoint structure: {e}")
        return False

def test_profiles_endpoint_structure():
    """Test the profiles endpoint structure (without actual authentication)"""
    print("\n=== Testing Profiles Endpoint Structure ===")
    try:
        # Try to access a protected endpoint without authentication
        response = requests.get(f"{API_URL}/profiles")
        print(f"Status Code: {response.status_code}")
        
        # We expect a 401 Unauthorized or 403 Forbidden response
        if response.status_code in [401, 403]:
            print("✅ Profiles endpoint structure test passed - endpoint requires authentication")
            return True
        else:
            print(f"❌ Profiles endpoint structure test failed - expected 401/403, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing profiles endpoint structure: {e}")
        return False

def test_events_endpoint_structure():
    """Test the events endpoint structure (without actual authentication)"""
    print("\n=== Testing Events Endpoint Structure ===")
    try:
        # Try to access a protected endpoint without authentication
        response = requests.get(f"{API_URL}/events")
        print(f"Status Code: {response.status_code}")
        
        # We expect a 401 Unauthorized or 403 Forbidden response
        if response.status_code in [401, 403]:
            print("✅ Events endpoint structure test passed - endpoint requires authentication")
            return True
        else:
            print(f"❌ Events endpoint structure test failed - expected 401/403, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing events endpoint structure: {e}")
        return False

def test_jobs_endpoint_structure():
    """Test the jobs endpoint structure (without actual authentication)"""
    print("\n=== Testing Jobs Endpoint Structure ===")
    try:
        # Try to access a protected endpoint without authentication
        response = requests.get(f"{API_URL}/jobs")
        print(f"Status Code: {response.status_code}")
        
        # We expect a 401 Unauthorized or 403 Forbidden response
        if response.status_code in [401, 403]:
            print("✅ Jobs endpoint structure test passed - endpoint requires authentication")
            return True
        else:
            print(f"❌ Jobs endpoint structure test failed - expected 401/403, got {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing jobs endpoint structure: {e}")
        return False

def run_all_tests():
    """Run all tests and return a summary"""
    print("\n=== AMET Alumni Portal API Test Suite ===")
    print(f"Testing API at: {API_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    results = {
        "health_check": test_health_endpoint(),
        "root_endpoint": test_root_endpoint(),
        "auth_structure": test_auth_endpoint_structure(),
        "profiles_structure": test_profiles_endpoint_structure(),
        "events_structure": test_events_endpoint_structure(),
        "jobs_structure": test_jobs_endpoint_structure()
    }
    
    print("\n=== Test Summary ===")
    all_passed = True
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        if not result:
            all_passed = False
        print(f"{test_name}: {status}")
    
    print("\n=== Overall Result ===")
    if all_passed:
        print("✅ All tests passed successfully!")
    else:
        print("❌ Some tests failed. See details above.")
    
    return results

if __name__ == "__main__":
    run_all_tests()