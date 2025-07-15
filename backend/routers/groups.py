from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

# To be replaced with imports from a dependencies.py file
from ..dependencies import get_current_user, supabase_admin, Group, GroupCreate, GroupPost, GroupPostCreate

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=Group)
async def create_group(
    group_data: GroupCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new group."""
    try:
        user_id = current_user['id']
        db_group = group_data.model_dump()
        db_group['created_by'] = user_id

        response = supabase_admin.table("groups").insert(db_group).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create group")

        new_group = response.data[0]
        
        # Automatically add the creator as the first member with the 'admin' role
        membership_data = {
            'group_id': new_group['id'],
            'user_id': user_id,
            'role': 'admin'
        }
        supabase_admin.table('group_members').insert(membership_data).execute()

        return new_group
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Group])
async def list_groups():
    """List all public groups."""
    try:
        response = supabase_admin.table("groups").select("*").eq('is_private', False).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{group_id}", response_model=Group)
async def get_group_details(
    group_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get details for a specific group."""
    try:
        # This logic should be more complex to handle private groups
        # For now, it fetches any group by ID
        response = supabase_admin.table("groups").select("*").eq('id', group_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Group not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{group_id}/join")
async def join_group(
    group_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Join a group."""
    try:
        user_id = current_user['id']
        # First, check if group exists and is not private (or if private, if invites are supported - not implemented)
        group_response = supabase_admin.table('groups').select('id, is_private').eq('id', group_id).single().execute()
        if not group_response.data:
            raise HTTPException(status_code=404, detail="Group not found")
        if group_response.data['is_private']:
            raise HTTPException(status_code=403, detail="Cannot join a private group without an invitation.")

        # Check if user is already a member
        member_response = supabase_admin.table('group_members').select('id').eq('group_id', group_id).eq('user_id', user_id).execute()
        if member_response.data:
            return {"message": "User is already a member of this group."}

        membership_data = {
            'group_id': group_id,
            'user_id': user_id,
            'role': 'member'
        }
        response = supabase_admin.table('group_members').insert(membership_data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to join group")
        return {"message": "Successfully joined group"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{group_id}/posts", response_model=GroupPost)
async def create_post_in_group(
    group_id: str,
    post_data: GroupPostCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a post in a group."""
    try:
        user_id = current_user['id']
        # Check if user is a member of the group
        member_response = supabase_admin.table('group_members').select('id').eq('group_id', group_id).eq('user_id', user_id).execute()
        if not member_response.data:
            raise HTTPException(status_code=403, detail="User is not a member of this group")

        db_post = post_data.model_dump()
        db_post['group_id'] = group_id
        db_post['user_id'] = user_id
        response = supabase_admin.table("group_posts").insert(db_post).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create post")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{group_id}/posts", response_model=List[GroupPost])
async def list_posts_in_group(
    group_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List all posts in a group."""
    try:
        # Check if user is a member of the group to view posts
        member_response = supabase_admin.table('group_members').select('id').eq('group_id', group_id).eq('user_id', current_user['id']).execute()
        if not member_response.data:
            # Check if the group is public
            group_response = supabase_admin.table('groups').select('is_private').eq('id', group_id).single().execute()
            if not group_response.data or group_response.data['is_private']:
                 raise HTTPException(status_code=403, detail="Cannot view posts in a private group without being a member.")

        response = supabase_admin.table("group_posts").select("*").eq('group_id', group_id).order('created_at', desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
