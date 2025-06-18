from fastapi import FastAPI, APIRouter, HTTPException, Depends, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import logging
import uuid
from datetime import datetime, timedelta
from supabase import create_client, Client
import json

# Load environment variables
load_dotenv()

# Supabase connection
supabase_url = os.environ['SUPABASE_URL']
supabase_key = os.environ['SUPABASE_KEY']
supabase: Client = create_client(supabase_url, supabase_key)

# Create the main app
app = FastAPI(title="AMET Alumni Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================================
# MODELS - Updated to match existing database schema
# ================================

class Profile(BaseModel):
    id: Optional[str] = None
    email: str
    first_name: Optional[str] = None  # Made optional to handle existing data
    last_name: Optional[str] = None   # Made optional to handle existing data
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    graduation_year: Optional[int] = None
    degree: Optional[str] = None
    major: Optional[str] = None
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    website_url: Optional[str] = None
    is_verified: bool = False
    is_mentor: bool = False
    is_employer: bool = False
    is_admin: bool = False
    role: str = "alumni"
    phone: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ProfileCreate(BaseModel):
    email: str
    first_name: str
    last_name: str
    graduation_year: Optional[int] = None
    degree: Optional[str] = None
    role: str = "alumni"

class Job(BaseModel):
    id: Optional[str] = None
    title: str
    company_name: str
    location: str
    job_type: str
    description: str
    requirements: Optional[str] = None
    salary_range: Optional[str] = None
    application_url: Optional[str] = None
    contact_email: Optional[str] = None
    expires_at: Optional[datetime] = None
    posted_by: str
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    education_required: Optional[str] = None
    required_skills: Optional[List[str]] = None
    deadline: Optional[datetime] = None
    experience_required: Optional[str] = None

class JobCreate(BaseModel):
    title: str
    company_name: str
    location: str
    job_type: str
    description: str
    requirements: Optional[str] = None
    salary_range: Optional[str] = None
    application_url: Optional[str] = None
    contact_email: Optional[str] = None
    expires_at: Optional[datetime] = None
    education_required: Optional[str] = None
    required_skills: Optional[List[str]] = None
    deadline: Optional[datetime] = None
    experience_required: Optional[str] = None

class JobApplication(BaseModel):
    id: Optional[str] = None
    job_id: str
    applicant_id: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    applied_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    notes: Optional[str] = None

class JobApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None

class JobApplicationReview(BaseModel):
    status: str  # approved, rejected
    notes: Optional[str] = None

class Message(BaseModel):
    id: Optional[str] = None
    sender_id: str
    recipient_id: str  # Updated to match existing schema
    subject: Optional[str] = None
    content: str
    is_read: bool = False
    parent_message_id: Optional[str] = None
    created_at: Optional[datetime] = None

class MessageCreate(BaseModel):
    recipient_id: str  # Updated to match existing schema
    subject: Optional[str] = None
    content: str

class DashboardStats(BaseModel):
    total_alumni: int
    total_jobs: int
    total_applications: int
    recent_activities: List[Dict[str, Any]]

# ================================
# UTILITY FUNCTIONS
# ================================

def get_current_user_id():
    # In a real app, this would extract user ID from JWT token
    # For now, getting a sample user ID from existing profiles
    try:
        result = supabase.table("profiles").select("id").limit(1).execute()
        if result.data:
            return result.data[0]["id"]
        return "sample_user_id"
    except:
        return "sample_user_id"

# ================================
# USER/PROFILE MANAGEMENT APIs
# ================================

@api_router.post("/users", response_model=Profile)
async def create_profile(profile_data: ProfileCreate):
    try:
        profile_dict = profile_data.dict()
        profile_dict["id"] = str(uuid.uuid4())
        profile_dict["full_name"] = f"{profile_dict['first_name']} {profile_dict['last_name']}"
        profile_dict["created_at"] = datetime.utcnow().isoformat()
        profile_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("profiles").insert(profile_dict).execute()
        
        if result.data:
            return Profile(**result.data[0])
        else:
            raise HTTPException(status_code=400, detail="Failed to create profile")
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users", response_model=List[Profile])
async def get_profiles():
    try:
        result = supabase.table("profiles").select("*").execute()
        return [Profile(**profile) for profile in result.data]
    except Exception as e:
        logger.error(f"Error fetching profiles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{user_id}", response_model=Profile)
async def get_profile(user_id: str):
    try:
        result = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if result.data:
            return Profile(**result.data[0])
        else:
            raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        logger.error(f"Error fetching profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# DASHBOARD APIs
# ================================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    try:
        # Get total alumni (profiles with role user - these are your alumni)
        alumni_result = supabase.table("profiles").select("id", count="exact").eq("role", "user").execute()
        total_alumni = alumni_result.count or 0
        
        # Get total active jobs
        jobs_result = supabase.table("jobs").select("id", count="exact").eq("is_active", True).execute()
        total_jobs = jobs_result.count or 0
        
        # Get total applications
        applications_result = supabase.table("job_applications").select("id", count="exact").execute()
        total_applications = applications_result.count or 0
        
        # Get recent activities (recent jobs as activities)
        recent_jobs = supabase.table("jobs").select("*").order("created_at", desc=True).limit(5).execute()
        recent_activities = []
        
        for job in recent_jobs.data:
            recent_activities.append({
                "id": job["id"],
                "type": "job",
                "title": f"New job posted: {job['title']}",
                "time": job["created_at"],
                "status": "active"
            })
        
        return DashboardStats(
            total_alumni=total_alumni,
            total_jobs=total_jobs,
            total_applications=total_applications,
            recent_activities=recent_activities
        )
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# JOB MANAGEMENT APIs
# ================================

@api_router.post("/jobs", response_model=Job)
async def create_job(job_data: JobCreate):
    try:
        job_dict = job_data.dict()
        job_dict["id"] = str(uuid.uuid4())
        job_dict["posted_by"] = get_current_user_id()
        job_dict["created_at"] = datetime.utcnow().isoformat()
        job_dict["updated_at"] = datetime.utcnow().isoformat()
        job_dict["is_active"] = True
        
        result = supabase.table("jobs").insert(job_dict).execute()
        
        if result.data:
            return Job(**result.data[0])
        else:
            raise HTTPException(status_code=400, detail="Failed to create job")
    except Exception as e:
        logger.error(f"Error creating job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/jobs", response_model=List[Job])
async def get_jobs():
    try:
        result = supabase.table("jobs").select("*").eq("is_active", True).order("created_at", desc=True).execute()
        return [Job(**job) for job in result.data]
    except Exception as e:
        logger.error(f"Error fetching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str):
    try:
        result = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if result.data:
            return Job(**result.data[0])
        else:
            raise HTTPException(status_code=404, detail="Job not found")
    except Exception as e:
        logger.error(f"Error fetching job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# JOB APPLICATION APIs
# ================================

@api_router.post("/job-applications", response_model=JobApplication)
async def create_job_application(application_data: JobApplicationCreate):
    try:
        app_dict = application_data.dict()
        app_dict["id"] = str(uuid.uuid4())
        app_dict["applicant_id"] = get_current_user_id()
        app_dict["applied_at"] = datetime.utcnow().isoformat()
        app_dict["status"] = "pending"
        
        result = supabase.table("job_applications").insert(app_dict).execute()
        
        if result.data:
            return JobApplication(**result.data[0])
        else:
            raise HTTPException(status_code=400, detail="Failed to create application")
    except Exception as e:
        logger.error(f"Error creating job application: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/job-applications", response_model=List[JobApplication])
async def get_job_applications():
    try:
        result = supabase.table("job_applications").select("*").order("applied_at", desc=True).execute()
        return [JobApplication(**app) for app in result.data]
    except Exception as e:
        logger.error(f"Error fetching job applications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/job-applications/pending", response_model=List[JobApplication])
async def get_pending_applications():
    try:
        result = supabase.table("job_applications").select("*").eq("status", "pending").order("applied_at", desc=True).execute()
        return [JobApplication(**app) for app in result.data]
    except Exception as e:
        logger.error(f"Error fetching pending applications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/job-applications/{application_id}/review", response_model=JobApplication)
async def review_job_application(application_id: str, review_data: JobApplicationReview):
    try:
        update_data = {
            "status": review_data.status,
            "reviewed_at": datetime.utcnow().isoformat(),
            "reviewed_by": get_current_user_id(),
            "notes": review_data.notes
        }
        
        result = supabase.table("job_applications").update(update_data).eq("id", application_id).execute()
        
        if result.data:
            return JobApplication(**result.data[0])
        else:
            raise HTTPException(status_code=404, detail="Application not found")
    except Exception as e:
        logger.error(f"Error reviewing job application: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# MESSAGES APIs
# ================================

@api_router.post("/messages", response_model=Message)
async def send_message(message_data: MessageCreate):
    try:
        msg_dict = message_data.dict()
        msg_dict["id"] = str(uuid.uuid4())
        msg_dict["sender_id"] = get_current_user_id()
        msg_dict["created_at"] = datetime.utcnow().isoformat()
        msg_dict["is_read"] = False
        
        result = supabase.table("messages").insert(msg_dict).execute()
        
        if result.data:
            return Message(**result.data[0])
        else:
            raise HTTPException(status_code=400, detail="Failed to send message")
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/messages/conversations/{user_id}", response_model=List[Message])
async def get_conversation(user_id: str):
    try:
        current_user = get_current_user_id()
        
        # Get messages between current user and specified user
        result = supabase.table("messages").select("*").or_(
            f"and(sender_id.eq.{current_user},recipient_id.eq.{user_id}),"
            f"and(sender_id.eq.{user_id},recipient_id.eq.{current_user})"
        ).order("created_at", desc=False).execute()
        
        return [Message(**msg) for msg in result.data]
    except Exception as e:
        logger.error(f"Error fetching conversation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/messages/recent")
async def get_recent_conversations():
    try:
        current_user = get_current_user_id()
        
        # Get recent conversations (simplified - gets recent messages)
        result = supabase.table("messages").select("*").or_(
            f"sender_id.eq.{current_user},recipient_id.eq.{current_user}"
        ).order("created_at", desc=True).limit(50).execute()
        
        # Group by conversation partner
        conversations = {}
        for msg in result.data:
            partner_id = msg["recipient_id"] if msg["sender_id"] == current_user else msg["sender_id"]
            if partner_id not in conversations:
                conversations[partner_id] = msg
        
        return list(conversations.values())
    except Exception as e:
        logger.error(f"Error fetching recent conversations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# BASIC ROUTES
# ================================

@api_router.get("/")
async def root():
    return {"message": "AMET Alumni Management System API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include the router in the main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
