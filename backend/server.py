from fastapi import FastAPI, APIRouter, Depends, HTTPException
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import logging
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from .dependencies import get_current_user, supabase, supabase_admin, SUPABASE_URL
from .routers import groups, notifications

# Create the main app
app = FastAPI(title="AMET Alumni Portal API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Include routers
api_router.include_router(groups.router)
api_router.include_router(notifications.router)

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

class LoginRequest(BaseModel):
    email: str
    password: str

# Registration endpoint
@api_router.post("/register")
async def register_user(request: dict):
    """Register a new user"""
    email = request.get("email")
    password = request.get("password")
    full_name = request.get("full_name")

    if not email or not password or not full_name:
        raise HTTPException(
            status_code=400, detail="Email, password, and full name are required"
        )

    try:
        # Create user in Supabase Auth
        user_response = supabase.auth.sign_up({
            "email": email,
            "password": password,
        })

        if user_response.user is None:
            raise HTTPException(
                status_code=400, detail="Could not create user account."
            )

        user_id = user_response.user.id

        # Create profile in the public.profiles table
        profile_data = {
            "id": user_id,
            "user_id": user_id,
            "email": email,
            "full_name": full_name,
        }
        
        profile_response = supabase_admin.table("profiles").insert(profile_data).execute()

        if not profile_response.data:
            # If profile creation fails, you might want to delete the auth user
            # This part is complex and requires admin privileges.
            # For now, we log the error.
            logging.error(f"Failed to create profile for user {user_id}")
            raise HTTPException(
                status_code=500, detail="Failed to create user profile."
            )

        return {"message": "User registered successfully. Please check your email for verification.", "user_id": user_id}

    except Exception as e:
        # More specific error handling can be added here
        raise HTTPException(status_code=500, detail=str(e))

# Authentication routes
@api_router.post("/login/test")
async def test_login(request: LoginRequest):
    """Test login endpoint for debugging"""
    email = request.email
    password = request.password
    try:
        response = supabase.auth.sign_in_with_password({"email": email, "password": password})
        if response.session:
            return {"access_token": response.session.access_token, "token_type": "bearer"}
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/user", response_model=Dict[str, Any])
async def get_user(current_user: Dict[str, Any] = Depends(get_current_user)):
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


class LoginRequest(BaseModel):
    email: str
    password: str

# Registration endpoint
@api_router.post("/auth/register")
async def register_user(request: dict):
    """Register a new user"""
    try:
        email = request.get('email')
        password = request.get('password')
        user_metadata = request.get('user_metadata', {})
        
        # Sign up user with Supabase
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": user_metadata
            }
        })
        
        if auth_response.user:
            # Create profile in profiles table (using id instead of user_id)
            profile_data = {
                "id": auth_response.user.id,  # Using id directly as primary key
                "email": email,
                "first_name": user_metadata.get('first_name', ''),
                "last_name": user_metadata.get('last_name', ''),
                "graduation_year": user_metadata.get('graduation_year'),
                "degree": user_metadata.get('degree', ''),
                "phone": user_metadata.get('phone', ''),
                "account_type": user_metadata.get('primary_role', 'alumni'),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "is_verified": False,
                "is_mentor": False,
                "is_employer": False,
                "alumni_verification_status": "pending",
                "mentor_status": "pending",
                "mentee_status": "pending"
            }
            
            # Insert into profiles table
            profile_response = supabase.table("profiles").insert(profile_data).execute()
            
            return {
                "success": True,
                "user": {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "created_at": auth_response.user.created_at
                },
                "profile": profile_response.data[0] if profile_response.data else None
            }
        else:
            return {
                "success": False,
                "error": "Failed to create user"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# Authentication routes
@api_router.post("/auth/test-login")
async def test_login(request: LoginRequest):
    """Test login endpoint for debugging"""
    try:
        # Use admin client to check if user exists
        auth_response = supabase_admin.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        return {
            "success": True,
            "user_exists": auth_response.user is not None,
            "user_id": auth_response.user.id if auth_response.user else None,
            "email": auth_response.user.email if auth_response.user else None
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "user_exists": False
        }

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
    limit: int = 1000,
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

from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

@api_router.get("/profiles/{profile_id}")
async def get_profile_by_id(
    profile_id: str
):
    """Get specific profile by ID"""
    try:
        response = supabase.table("profiles").select("*").eq("id", profile_id).execute()
        if response.data:
            content = jsonable_encoder(response.data[0])
            return JSONResponse(
                content=content,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                }
            )
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

# Include the main router in the app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
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
    uvicorn.run(app, host="0.0.0.0", port=8003)
