from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import logging
from pathlib import Path
from datetime import datetime
from supabase import create_client, Client
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY]):
    raise ValueError("Missing required Supabase environment variables")

# Create Supabase clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Create the main app
app = FastAPI(title="AMET Alumni Portal API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Pydantic Models
class User(BaseModel):
    id: str
    email: str
    role: Optional[str] = None
    full_name: Optional[str] = None
    created_at: Optional[datetime] = None

class Profile(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    graduation_year: Optional[int] = None
    department: Optional[str] = None
    current_position: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class Event(BaseModel):
    id: str
    title: str
    description: str
    event_date: datetime
    location: str
    organizer_id: str
    max_attendees: Optional[int] = None
    registration_deadline: Optional[datetime] = None
    is_virtual: bool = False
    meeting_link: Optional[str] = None
    created_at: Optional[datetime] = None

class Job(BaseModel):
    id: str
    title: str
    company: str
    description: str
    location: str
    job_type: str
    salary_range: Optional[str] = None
    requirements: str
    posted_by: str
    application_deadline: Optional[datetime] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

class Message(BaseModel):
    id: str
    sender_id: str
    recipient_id: str
    subject: str
    content: str
    is_read: bool = False
    created_at: Optional[datetime] = None

# Authentication helper functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify JWT token and return user data"""
    try:
        token = credentials.credentials
        
        # Use Supabase to verify the token
        user_response = supabase.auth.get_user(token)
        
        if user_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_response.user.model_dump()
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "AMET Alumni Portal API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Supabase connection
        response = supabase_admin.table("profiles").select("count").execute()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Authentication routes
@api_router.get("/user", response_model=Dict[str, Any])
async def get_user(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current authenticated user"""
    return current_user

@api_router.get("/profile")
async def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get user profile from profiles table"""
    try:
        response = supabase.table("profiles").select("*").eq("user_id", current_user["id"]).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/profile")
async def update_user_profile(
    profile_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update user profile"""
    try:
        response = supabase.table("profiles").update(profile_data).eq("user_id", current_user["id"]).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Profiles routes
@api_router.get("/profiles", response_model=List[Dict[str, Any]])
async def get_profiles(
    limit: int = 100,
    offset: int = 0
):
    """Get all alumni profiles - public endpoint for directory"""
    try:
        response = supabase.table("profiles").select("*").range(offset, offset + limit - 1).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/profiles/protected", response_model=List[Dict[str, Any]])
async def get_profiles_protected(
    limit: int = 50,
    offset: int = 0,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all alumni profiles - protected endpoint"""
    try:
        response = supabase.table("profiles").select("*").range(offset, offset + limit - 1).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/profiles/{profile_id}")
async def get_profile_by_id(
    profile_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get specific profile by ID"""
    try:
        response = supabase.table("profiles").select("*").eq("id", profile_id).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=404, detail="Profile not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Events routes
@api_router.get("/events", response_model=List[Dict[str, Any]])
async def get_events(
    limit: int = 50,
    offset: int = 0,
    upcoming_only: bool = True,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get events"""
    try:
        query = supabase.table("events").select("*")
        
        if upcoming_only:
            query = query.gte("event_date", datetime.now().isoformat())
        
        response = query.range(offset, offset + limit - 1).order("event_date").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/events/{event_id}")
async def get_event_by_id(
    event_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get specific event by ID"""
    try:
        response = supabase.table("events").select("*").eq("id", event_id).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=404, detail="Event not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/events")
async def create_event(
    event_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create new event"""
    try:
        event_data["organizer_id"] = current_user["id"]
        response = supabase.table("events").insert(event_data).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create event")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Event attendees routes
@api_router.post("/events/{event_id}/register")
async def register_for_event(
    event_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Register for an event"""
    try:
        registration_data = {
            "event_id": event_id,
            "attendee_id": current_user["id"],
            "registration_date": datetime.now().isoformat()
        }
        response = supabase.table("event_attendees").insert(registration_data).execute()
        if response.data:
            return {"message": "Successfully registered for event"}
        else:
            raise HTTPException(status_code=400, detail="Failed to register for event")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/events/{event_id}/attendees")
async def get_event_attendees(
    event_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get attendees for an event"""
    try:
        response = supabase.table("event_attendees").select("*, profiles(*)").eq("event_id", event_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Jobs routes
@api_router.get("/jobs", response_model=List[Dict[str, Any]])
async def get_jobs(
    limit: int = 50,
    offset: int = 0,
    active_only: bool = True,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get job listings"""
    try:
        query = supabase.table("jobs").select("*")
        
        if active_only:
            query = query.eq("is_active", True)
        
        response = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/jobs/{job_id}")
async def get_job_by_id(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get specific job by ID"""
    try:
        response = supabase.table("jobs").select("*").eq("id", job_id).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=404, detail="Job not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/jobs")
async def create_job(
    job_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create new job listing"""
    try:
        job_data["posted_by"] = current_user["id"]
        response = supabase.table("jobs").insert(job_data).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create job")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Job applications routes
@api_router.post("/jobs/{job_id}/apply")
async def apply_for_job(
    job_id: str,
    application_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Apply for a job"""
    try:
        application_data.update({
            "job_id": job_id,
            "applicant_id": current_user["id"],
            "application_date": datetime.now().isoformat()
        })
        response = supabase.table("job_applications").insert(application_data).execute()
        if response.data:
            return {"message": "Application submitted successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to submit application")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/jobs/{job_id}/applications")
async def get_job_applications(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get applications for a job (only for job poster)"""
    try:
        # First verify the user posted this job
        job_response = supabase.table("jobs").select("posted_by").eq("id", job_id).execute()
        if not job_response.data or job_response.data[0]["posted_by"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        response = supabase.table("job_applications").select("*, profiles(*)").eq("job_id", job_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Messages routes
@api_router.get("/messages")
async def get_messages(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get messages for current user"""
    try:
        response = supabase.table("messages").select("*, sender:sender_id(full_name), recipient:recipient_id(full_name)").or_(f"sender_id.eq.{current_user['id']},recipient_id.eq.{current_user['id']}").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/messages")
async def send_message(
    message_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Send a message"""
    try:
        message_data["sender_id"] = current_user["id"]
        response = supabase.table("messages").insert(message_data).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to send message")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/messages/{message_id}/read")
async def mark_message_as_read(
    message_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Mark message as read"""
    try:
        response = supabase.table("messages").update({"is_read": True}).eq("id", message_id).eq("recipient_id", current_user["id"]).execute()
        if response.data:
            return {"message": "Message marked as read"}
        else:
            raise HTTPException(status_code=404, detail="Message not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mentorship routes
@api_router.get("/mentors")
async def get_mentors(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get available mentors"""
    try:
        response = supabase.table("mentors").select("*, profiles(*)").eq("is_available", True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/mentorship-requests")
async def get_mentorship_requests(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get mentorship requests for current user"""
    try:
        response = supabase.table("mentorship_requests").select("*, mentor:mentor_id(profiles(*)), mentee:mentee_id(profiles(*))").or_(f"mentor_id.eq.{current_user['id']},mentee_id.eq.{current_user['id']}").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/mentorship-requests")
async def create_mentorship_request(
    request_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create mentorship request"""
    try:
        request_data["mentee_id"] = current_user["id"]
        response = supabase.table("mentorship_requests").insert(request_data).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create mentorship request")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("AMET Alumni Portal API is starting up...")
    logger.info(f"Supabase URL: {SUPABASE_URL}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
