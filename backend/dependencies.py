from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
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

class Group(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_by: str
    is_private: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class GroupMember(BaseModel):
    id: str
    group_id: str
    user_id: str
    role: str = 'member'
    joined_at: Optional[datetime] = None

class GroupPost(BaseModel):
    id: str
    group_id: str
    user_id: str
    content: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_private: bool = False

class GroupPostCreate(BaseModel):
    content: str

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
