"""
Script to check existing Supabase database structure without making any changes
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

def check_existing_tables():
    """Check what tables already exist and their structure"""
    print("Checking existing Supabase database structure...")
    print("=" * 60)
    
    # Common table names to check
    possible_tables = [
        'users', 'profiles', 'alumni', 'students',
        'jobs', 'job_postings', 'positions',
        'job_applications', 'applications', 
        'messages', 'conversations', 'chats',
        'events', 'announcements', 'news',
        'mentorship', 'mentors', 'mentees',
        'networking', 'groups', 'connections',
        'dashboard_stats', 'analytics'
    ]
    
    existing_tables = []
    
    for table in possible_tables:
        try:
            response = requests.get(
                f"{supabase_url}/rest/v1/{table}?select=*&limit=1",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                existing_tables.append(table)
                print(f"✅ Table '{table}' exists - Sample record count: {len(data)}")
                
                # Get total count
                count_response = requests.get(
                    f"{supabase_url}/rest/v1/{table}?select=*",
                    headers={**headers, 'Prefer': 'count=exact'}
                )
                if count_response.status_code == 200:
                    total_count = count_response.headers.get('Content-Range', '').split('/')[-1]
                    print(f"   Total records: {total_count}")
                
            elif response.status_code == 404:
                # Table doesn't exist - this is normal
                continue
            else:
                print(f"❌ Table '{table}': {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Error checking table '{table}': {e}")
    
    print("\n" + "=" * 60)
    print(f"Found {len(existing_tables)} existing tables:")
    for table in existing_tables:
        print(f"  - {table}")
    
    return existing_tables

def get_table_schema(table_name):
    """Get the structure of an existing table"""
    try:
        # Try to get a sample record to understand the schema
        response = requests.get(
            f"{supabase_url}/rest/v1/{table_name}?select=*&limit=1",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if data:
                print(f"\nSchema for '{table_name}':")
                print("-" * 40)
                sample_record = data[0]
                for key, value in sample_record.items():
                    value_type = type(value).__name__
                    print(f"  {key}: {value_type}")
                return sample_record
            else:
                print(f"\nTable '{table_name}' exists but is empty")
                return {}
        else:
            print(f"❌ Could not get schema for '{table_name}': {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting schema for '{table_name}': {e}")
        return None

if __name__ == "__main__":
    print("SUPABASE DATABASE INSPECTION (READ-ONLY)")
    print("=" * 60)
    print("This script will only READ existing data, no changes will be made.")
    print("=" * 60)
    
    existing_tables = check_existing_tables()
    
    # Get schema for each existing table
    print("\n" + "=" * 60)
    print("TABLE SCHEMAS:")
    print("=" * 60)
    
    for table in existing_tables:
        get_table_schema(table)
    
    print("\n" + "=" * 60)
    print("Inspection completed! No data was modified.")
    print("=" * 60)