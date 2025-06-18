"""
Simple script to create database tables using Supabase's REST API
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.environ['SUPABASE_URL']
supabase_key = os.environ['SUPABASE_KEY']

# Supabase REST API headers
headers = {
    'apikey': supabase_key,
    'Authorization': f'Bearer {supabase_key}',
    'Content-Type': 'application/json'
}

def create_sample_data():
    """Create sample data directly in Supabase to test if tables exist"""
    
    # Try to create a user first - this will tell us if the table exists
    sample_user = {
        "name": "John Doe",
        "email": "john.doe@amet.ac.in", 
        "role": "alumni",
        "company": "Test Company",
        "graduation_year": 2020,
        "department": "Marine Engineering"
    }
    
    print("Testing if we can create data in Supabase...")
    
    try:
        # Try to insert a user
        response = requests.post(
            f"{supabase_url}/rest/v1/users",
            headers=headers,
            json=sample_user
        )
        
        print(f"User creation response: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ User created successfully!")
            user_data = response.json()[0]
            user_id = user_data['id']
            print(f"Created user with ID: {user_id}")
            
            # Try to create a job
            sample_job = {
                "title": "Senior Marine Engineer",
                "company": "Ocean Shipping Ltd.",
                "location": "Mumbai, Maharashtra",
                "job_type": "Full-time",
                "experience": "5-8 years",
                "salary": "₹12-15 LPA",
                "description": "Leading maritime company seeking experienced marine engineer for vessel operations and maintenance.",
                "requirements": ["Bachelor's degree in Marine Engineering", "Valid Chief Engineer license"],
                "skills": ["Marine Engineering", "Ship Operations", "Leadership"],
                "posted_by": user_id
            }
            
            job_response = requests.post(
                f"{supabase_url}/rest/v1/jobs",
                headers=headers,
                json=sample_job
            )
            
            print(f"Job creation response: {job_response.status_code}")
            
            if job_response.status_code == 201:
                print("✅ Job created successfully!")
                job_data = job_response.json()[0]
                job_id = job_data['id']
                print(f"Created job with ID: {job_id}")
                
                # Try to create a job application
                sample_application = {
                    "job_id": job_id,
                    "applicant_id": user_id,
                    "cover_letter": "I am very interested in this position and believe my experience makes me a strong candidate.",
                    "expected_salary": "₹14 LPA"
                }
                
                app_response = requests.post(
                    f"{supabase_url}/rest/v1/job_applications",
                    headers=headers,
                    json=sample_application
                )
                
                print(f"Application creation response: {app_response.status_code}")
                
                if app_response.status_code == 201:
                    print("✅ Job application created successfully!")
                    print("✅ All tables are working!")
                else:
                    print(f"❌ Failed to create job application: {app_response.text}")
            else:
                print(f"❌ Failed to create job: {job_response.text}")
        else:
            print(f"❌ Failed to create user: {response.text}")
            print("This likely means the tables don't exist yet.")
            
    except Exception as e:
        print(f"Error: {e}")

def check_existing_data():
    """Check what data already exists"""
    print("\nChecking existing data...")
    
    tables = ['users', 'jobs', 'job_applications', 'messages']
    
    for table in tables:
        try:
            response = requests.get(
                f"{supabase_url}/rest/v1/{table}?select=*&limit=5",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {table}: {len(data)} records found")
            else:
                print(f"❌ {table}: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ {table}: Error - {e}")

if __name__ == "__main__":
    print("Supabase Database Test Script")
    print("=" * 50)
    
    check_existing_data()
    create_sample_data()
    
    print("\n" + "=" * 50)
    print("Test completed!")