"""
Database initialization script for Supabase
Creates necessary tables for the AMET Alumni Management System
"""

from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.environ['SUPABASE_URL']
supabase_key = os.environ['SUPABASE_KEY']
supabase: Client = create_client(supabase_url, supabase_key)

def create_tables():
    """Create necessary tables in Supabase"""
    
    # SQL statements to create tables
    create_users_table = """
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('alumni', 'admin', 'employer')),
        avatar TEXT,
        company TEXT,
        graduation_year INTEGER,
        department TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    create_jobs_table = """
    CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        job_type TEXT NOT NULL,
        experience TEXT NOT NULL,
        salary TEXT NOT NULL,
        description TEXT NOT NULL,
        requirements TEXT[] DEFAULT '{}',
        skills TEXT[] DEFAULT '{}',
        posted_by UUID REFERENCES users(id),
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
    
    create_job_applications_table = """
    CREATE TABLE IF NOT EXISTS job_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
        applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
        cover_letter TEXT NOT NULL,
        expected_salary TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by UUID REFERENCES users(id),
        notes TEXT
    );
    """
    
    create_messages_table = """
    CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        read_at TIMESTAMP WITH TIME ZONE
    );
    """
    
    # Execute table creation
    try:
        print("Creating users table...")
        supabase.rpc('exec_sql', {'sql': create_users_table}).execute()
        
        print("Creating jobs table...")
        supabase.rpc('exec_sql', {'sql': create_jobs_table}).execute()
        
        print("Creating job_applications table...")
        supabase.rpc('exec_sql', {'sql': create_job_applications_table}).execute()
        
        print("Creating messages table...")
        supabase.rpc('exec_sql', {'sql': create_messages_table}).execute()
        
        print("All tables created successfully!")
        
    except Exception as e:
        print(f"Error creating tables: {e}")
        print("Note: You may need to create these tables manually in your Supabase dashboard")
        print("Or enable RLS policies if required")

def create_sample_data():
    """Create some sample data for testing"""
    try:
        # Create sample users
        sample_users = [
            {
                "name": "John Doe",
                "email": "john.doe@amet.ac.in",
                "role": "alumni",
                "company": "Ocean Shipping Ltd.",
                "graduation_year": 2020,
                "department": "Marine Engineering"
            },
            {
                "name": "Admin User",
                "email": "admin@amet.ac.in",
                "role": "admin",
                "department": "Administration"
            },
            {
                "name": "HR Manager",
                "email": "hr@oceanshipping.com",
                "role": "employer",
                "company": "Ocean Shipping Ltd."
            }
        ]
        
        print("Creating sample users...")
        for user in sample_users:
            result = supabase.table("users").insert(user).execute()
            print(f"Created user: {user['name']}")
        
        # Get user IDs for creating jobs
        users_result = supabase.table("users").select("*").execute()
        employer_id = None
        alumni_id = None
        
        for user in users_result.data:
            if user['role'] == 'employer':
                employer_id = user['id']
            elif user['role'] == 'alumni':
                alumni_id = user['id']
        
        if employer_id:
            # Create sample jobs
            sample_jobs = [
                {
                    "title": "Senior Marine Engineer",
                    "company": "Ocean Shipping Ltd.",
                    "location": "Mumbai, Maharashtra",
                    "job_type": "Full-time",
                    "experience": "5-8 years",
                    "salary": "₹12-15 LPA",
                    "description": "Leading maritime company seeking experienced marine engineer for vessel operations and maintenance.",
                    "requirements": [
                        "Bachelor's degree in Marine Engineering",
                        "Valid Chief Engineer license",
                        "Minimum 5 years of sea-going experience"
                    ],
                    "skills": ["Marine Engineering", "Ship Operations", "Leadership"],
                    "posted_by": employer_id
                },
                {
                    "title": "Naval Architect",
                    "company": "Maritime Design Solutions",
                    "location": "Chennai, Tamil Nadu",
                    "job_type": "Full-time",
                    "experience": "3-5 years",
                    "salary": "₹8-12 LPA",
                    "description": "Innovative maritime design company looking for naval architect to join our team.",
                    "requirements": [
                        "Bachelor's degree in Naval Architecture",
                        "Experience with CAD software",
                        "Knowledge of ship design principles"
                    ],
                    "skills": ["Naval Architecture", "CAD", "Ship Design"],
                    "posted_by": employer_id
                }
            ]
            
            print("Creating sample jobs...")
            for job in sample_jobs:
                result = supabase.table("jobs").insert(job).execute()
                print(f"Created job: {job['title']}")
        
        print("Sample data created successfully!")
        
    except Exception as e:
        print(f"Error creating sample data: {e}")

if __name__ == "__main__":
    print("Initializing AMET Alumni Management System Database...")
    create_tables()
    create_sample_data()
    print("Database initialization completed!")