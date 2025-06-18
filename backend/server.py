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
# MODELS
# ================================

class User(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    role: str  # alumni, admin, employer
    avatar: Optional[str] = None
    company: Optional[str] = None
    graduation_year: Optional[int] = None
    department: Optional[str] = None
    created_at: Optional[datetime] = None

class UserCreate(BaseModel):
    name: str
    email: str
    role: str
    company: Optional[str] = None
    graduation_year: Optional[int] = None
    department: Optional[str] = None

class Job(BaseModel):
    id: Optional[str] = None
    title: str
    company: str
    location: str
    job_type: str
    experience: str
    salary: str
    description: str
    requirements: List[str]
    skills: List[str]
    posted_by: str
    created_at: Optional[datetime] = None
    status: str = "active"

class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    job_type: str
    experience: str
    salary: str
    description: str
    requirements: List[str]
    skills: List[str]

class JobApplication(BaseModel):
    id: Optional[str] = None
    job_id: str
    applicant_id: str
    cover_letter: str
    expected_salary: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    applied_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    notes: Optional[str] = None

class JobApplicationCreate(BaseModel):
    job_id: str
    cover_letter: str
    expected_salary: Optional[str] = None

class JobApplicationReview(BaseModel):
    status: str  # approved, rejected
    notes: Optional[str] = None

class Message(BaseModel):
    id: Optional[str] = None
    sender_id: str
    receiver_id: str
    content: str
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

class MessageCreate(BaseModel):
    receiver_id: str
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
    # For now, returning a mock user ID
    return "user_123"

# ================================
# USER MANAGEMENT APIs
# ================================

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    try:
        user_dict = user_data.dict()
        user_dict["id"] = str(uuid.uuid4())
        user_dict["created_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("users").insert(user_dict).execute()
        
        if result.data:
            return User(**result.data[0])
        else:
            raise HTTPException(status_code=400, detail="Failed to create user")
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users", response_model=List[User])
async def get_users():
    try:
        result = supabase.table("users").select("*").execute()
        return [User(**user) for user in result.data]
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    try:
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        if result.data:
            return User(**result.data[0])
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        logger.error(f"Error fetching user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# DASHBOARD APIs
# ================================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    try:
        # Get total alumni
        alumni_result = supabase.table("users").select("id", count="exact").eq("role", "alumni").execute()
        total_alumni = alumni_result.count or 0
        
        # Get total jobs
        jobs_result = supabase.table("jobs").select("id", count="exact").eq("status", "active").execute()
        total_jobs = jobs_result.count or 0
        
        # Get total applications
        applications_result = supabase.table("job_applications").select("id", count="exact").execute()
        total_applications = applications_result.count or 0
        
        # Get recent activities (simplified)
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
        job_dict["status"] = "active"
        
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
        result = supabase.table("jobs").select("*").eq("status", "active").order("created_at", desc=True).execute()
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
        msg_dict["sent_at"] = datetime.utcnow().isoformat()
        
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
            f"and(sender_id.eq.{current_user},receiver_id.eq.{user_id}),"
            f"and(sender_id.eq.{user_id},receiver_id.eq.{current_user})"
        ).order("sent_at", desc=False).execute()
        
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
            f"sender_id.eq.{current_user},receiver_id.eq.{current_user}"
        ).order("sent_at", desc=True).limit(50).execute()
        
        # Group by conversation partner
        conversations = {}
        for msg in result.data:
            partner_id = msg["receiver_id"] if msg["sender_id"] == current_user else msg["sender_id"]
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
