import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { 
  fetchGroupDetails, 
  fetchGroupPosts, 
  leaveGroup, 
  requestGroupMembership,
  createGroupPost,
  deleteGroupPost,
  removeGroupMember,
  updateGroupDetails,
  uploadGroupAvatar,
  uploadPostImage,
  updateGroupPost,
  reportGroupPost,
  setMemberRole,
  deleteGroup,
  fetchGroupMembers
} from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  MessageSquare, 
  Info, 
  ArrowLeft, 
  Image as ImageIcon, 
  X, 
  Edit, 
  Trash2, 
  UserMinus, 
  Camera, 
  Shield
} from 'lucide-react';
import ShareButtons from '../common/ShareButtons';
import ImageWithFallback from '../common/ImageWithFallback';
import { format } from 'date-fns';
import CommentsThread from './CommentsThread';
import { joinGroup } from '../../api/groups';
import { ROLE_LABELS } from '../../utils/roles';
import { canPostToGroup } from '../../utils/acl';
import { getFriendlyErrorMessage } from '../../utils/errors';
import { isMember as checkMemberPresence } from '../../utils/membershipPresence';

// Removed local roleLabel; use ROLE_LABELS for consistency

// Local helper to avoid importing from ignored lib/membership in Vercel builds
async function getMyMembership(supabaseClient, groupId) {
  const { data: authData, error: authErr } = await supabaseClient.auth.getUser();
  if (authErr || !authData?.user) return null;
  const userId = authData.user.id;
  const { data, error } = await supabaseClient
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

const GroupDetail = () => {
  const { id } = useParams();
  const { user, profile, userRole } = useAuth();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [avatarSrc, setAvatarSrc] = useState('');
  
  // New state variables for enhanced features
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [joinPending, setJoinPending] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  // Modals: edit and report
  const [postToEdit, setPostToEdit] = useState(null);
  const [editText, setEditText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  // Paging
  const [hasMore, setHasMore] = useState(true);
  // Comments per post: { [postId]: { open, loading, items: [], input: '' } }
  const [comments, setComments] = useState({});
  // Edit group modal
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupTags, setEditGroupTags] = useState('');
  const [editGroupPrivate, setEditGroupPrivate] = useState(false);
  const [editGroupAdminOnly, setEditGroupAdminOnly] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const loadGroupData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: groupData, error: groupError } = await fetchGroupDetails(id);
      if (groupError) throw groupError;
      setGroup(groupData);
      // Initialize members from fetched group data (if present) so count shows immediately
      if (Array.isArray(groupData?.members)) {
        setMembers(groupData.members);
        setMemberCount(groupData.members.length || 0);
      }
      
      // Determine membership presence using group_memberships and admin role via group_members
      let memberCheck = false;
      let adminCheck = false;
      if (user?.id) {
        const presence = await checkMemberPresence(supabase, id, user.id);
        memberCheck = !!presence;
        const mem = await getMyMembership(supabase, id);
        const isSiteAdmin = profile?.is_admin === true;
        adminCheck = (mem?.role === 'admin') || isSiteAdmin;
      }
      setIsMember(memberCheck);
      setIsAdmin(adminCheck);

      // console debug removed to avoid referencing undefined variables

      // Fetch a lightweight members count (head-only) for the header tab badge
      try {
        const { count } = await supabase
          .from('group_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('group_id', id);
        if (typeof count === 'number') setMemberCount(count);
      } catch (e) {
        // ignore count failures; UI will fall back
      }

      // Fetch posts if user is a member or the group is public (paged)
      if (memberCheck || !groupData.is_private) {
        const { data: postsData, error: postsError } = await fetchGroupPosts(id, { limit: 10 });
        if (postsError) throw postsError;
        setPosts(postsData || []);
        setHasMore((postsData || []).length === 10);
      }
    } catch (err) {
      const msg = String(err?.message || '');
      if (/JSON object requested, multiple \(or no\) rows returned/i.test(msg)) {
        setError('This group is currently not available. It may be pending review or archived.');
      } else {
        setError('Failed to load this group. Please try again.');
      }
      console.error("Error loading group data:", err);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  // Compute avatar src: prefer stored public URL; otherwise fetch a signed URL
  useEffect(() => {
    const buildSrc = async () => {
      if (!id) return;
      // If we have a stored public URL, use it with cache-busting
      if (group?.group_avatar_url) {
        const cb = group.updated_at ? `?t=${new Date(group.updated_at).getTime()}` : '';
        setAvatarSrc(`${group.group_avatar_url}${cb}`);
        return;
      }
      // Otherwise, skip signed URL attempts to avoid noisy 400s; let placeholder render
      setAvatarSrc('');
    };
    buildSrc();
  }, [id, group?.group_avatar_url, group?.updated_at]);

  // Load members when Members tab is active (admins only)
  useEffect(() => {
    const loadMembers = async () => {
      if (activeTab !== 'members') return;
      if (!isAdmin) return; // Only admins
      try {
        const { data, error } = await fetchGroupMembers(id, 200, 0);
        if (!error) setMembers(data || []);
      } catch(e) {
        console.error('Failed to load members', e);
      }
    };
    loadMembers();
  }, [activeTab, id, isAdmin]);

  const handleMembership = async () => {
    try {
      if (!user) {
        // Redirect to login if not logged in
        window.location.href = `/login?redirect=/groups/${id}`;
        return;
      }
      if (userRole === 'employer') {
        setError('Employers cannot perform this action.');
        return;
      }
      // Enforce showJoin/showLeave rules
      const isSiteAdmin = profile?.is_admin === true;
      const isApproved = group.is_approved === true;
      const isPrivate = group.is_private === true;
      const showJoin = !isMember && isApproved && !isPrivate;
      const showLeave = isMember && !isAdmin; // isAdmin here means group/site admin
      // Last-admin guard: if current user is an admin trying to leave, ensure another admin exists
      if (isMember && isAdmin) {
        const { count, error } = await supabase
          .from('group_members')
          .select('role', { count: 'exact', head: true })
          .eq('group_id', id)
          .eq('role', 'admin')
          .neq('user_id', user.id);
        if (!error && ((count ?? 0) === 0)) {
          setError('Every group needs at least one admin. Transfer admin role before leaving.');
          return;
        }
      }
      
      // Private or public join via RPC
      if (!isMember) {
        const status = await joinGroup(id);
        if (status === 'active') {
          toast.success('Joined group');
          setJoinPending(false);
          await loadGroupData();
        } else {
          // pending
          setJoinPending(true);
          toast.success('Request sent');
        }
        return;
      }

      // Leave (block last admin handled server-side; we still run UI check above)
      const { error } = await leaveGroup(id, user.id);
      if (error) throw error;
      await loadGroupData();
    } catch (err) {
      console.error("Error handling membership change:", err);
      setError(getFriendlyErrorMessage(err, 'An unexpected error occurred. Please try again.'));
    }
  };

  // Delete group (site admin only)
  const handleDeleteGroup = async () => {
    try {
      const { error } = await deleteGroup(id);
      if (error) throw error;
      window.location.href = '/groups';
    } catch (err) {
      console.error('Error deleting group:', err);
      if (err?.message?.includes('Each group must have at least one admin')) {
        alert('Cannot delete: archive the group instead (safer), or ask a site admin.');
      } else {
        setError('Failed to delete group.');
      }
    } finally {
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };
  
  // Handle removing a member from the group (admin only)
  const handleRemoveMember = async (memberId) => {
    try {
      const { error } = await removeGroupMember(id, memberId);
      if (error) throw error;
      // Update local members list
      setMembers(prev => prev.filter(m => m.user.id !== memberId));
      
      setMemberToRemove(null);
      setShowConfirmDialog(false);
    } catch (err) {
      console.error("Error removing member:", err);
      setError("Failed to remove member.");
    }
  };
  
  // Handle deleting a post (admin or post owner)
  const handleDeletePost = async (postId) => {
    try {
      const { error } = await deleteGroupPost(postId);
      if (error) throw error;
      
      // Update posts list
      setPosts(prev => prev.filter(post => post.id !== postId));
      
      setPostToDelete(null);
      setShowConfirmDialog(false);
    } catch (err) {
      console.error("Error deleting post:", err);
      setError("Failed to delete post.");
    }
  };

  // Edit post modal handlers
  const openEditModal = (post) => {
    setPostToEdit(post);
    setEditText(post.content || '');
    setShowEditModal(true);
  };
  const submitEditPost = async () => {
    if (!postToEdit) return;
    try {
      const { data, error } = await updateGroupPost(postToEdit.id, { content: editText });
      if (error) throw error;
      setPosts(prev => prev.map(p => p.id === postToEdit.id ? { ...p, content: data.content } : p));
      setShowEditModal(false);
      setPostToEdit(null);
      setEditText('');
    } catch (err) {
      console.error('Error updating post:', err);
      setError('Failed to update post.');
    }
  };

  // Report post modal handlers
  const openReportModal = (postId) => {
    setReportPostId(postId);
    setReportReason('');
    setShowReportModal(true);
  };
  const submitReportPost = async () => {
    if (!reportPostId || !reportReason.trim()) return;
    try {
      const { error } = await reportGroupPost({ post_id: reportPostId, reason: reportReason.slice(0, 240), reporter_id: user.id });
      if (error) throw error;
      setShowReportModal(false);
      setReportPostId(null);
      setReportReason('');
      alert('Report sent to admins.');
    } catch (err) {
      console.error('Error reporting post:', err);
      setError('Failed to submit report.');
    }
  };

  const loadMorePosts = async () => {
    if (!posts.length) return;
    const last = posts[posts.length - 1];
    try {
      const { data, error } = await fetchGroupPosts(id, { cursor: { created_at: last.created_at }, limit: 10 });
      if (error) throw error;
      setPosts(prev => [...prev, ...(data || [])]);
      setHasMore((data || []).length === 10);
    } catch (err) {
      console.error('Error loading more posts:', err);
    }
  };
  
  // Show confirmation dialog for actions
  const showConfirm = (action, data) => {
    if (action === 'removeMember') {
      setMemberToRemove(data);
      setConfirmAction('removeMember');
    } else if (action === 'deletePost') {
      setPostToDelete(data);
      setConfirmAction('deletePost');
    } else if (action === 'deleteGroup') {
      setConfirmAction('deleteGroup');
    }
    setShowConfirmDialog(true);
  };
  
  // Handle confirmation dialog actions
  const handleConfirmAction = () => {
    if (confirmAction === 'removeMember' && memberToRemove) {
      handleRemoveMember(memberToRemove);
    } else if (confirmAction === 'deletePost' && postToDelete) {
      handleDeletePost(postToDelete);
    } else if (confirmAction === 'deleteGroup') {
      handleDeleteGroup();
    }
  };
  
  // Cancel confirmation dialog
  const cancelConfirmAction = () => {
    setShowConfirmDialog(false);
    setMemberToRemove(null);
    setPostToDelete(null);
    setConfirmAction(null);
  };

  // Handle post image selection
  const handlePostImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('File is too large. Please select a file smaller than 5MB.');
          return;
        }
        setPostImage(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPostImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };
  
  // Remove selected image
  const removeSelectedImage = () => {
    setPostImage(null);
    setPostImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle group avatar upload (PNG/JPG only, 2MB, upsert true)
  const handleAvatarChange = async (e) => {
    if (!user) {
      alert('You must be logged in to change the group avatar.');
      return;
    }
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const ACCEPT = ['image/png', 'image/jpeg'];
    const MAX = 2 * 1024 * 1024; // 2MB
    if (!ACCEPT.includes(file.type)) {
      alert('Only PNG or JPG images are allowed.');
      return;
    }
    if (file.size > MAX) {
      alert('Image must be 2 MB or smaller.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const path = `${id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('group_avatars')
        .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg', cacheControl: '3600' });
      if (uploadError) throw uploadError;

      // Persist URL on the group row
      const { data: pub } = supabase.storage.from('group_avatars').getPublicUrl(path);
      const publicUrl = pub?.publicUrl || '';
      const { error: updErr } = await supabase
        .from('groups')
        .update({ group_avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (updErr) {
        console.error('Failed to persist avatar URL to groups:', updErr);
        setError('Avatar uploaded but could not be saved to the group (permissions).');
        return;
      }

      const busted = publicUrl ? `${publicUrl}?t=${Date.now()}` : '';
      setGroup(prev => ({ ...prev, group_avatar_url: busted }));
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload group avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  // Create post with optional image
  const handleCreatePost = async (e) => {
    if (!user) {
      alert('You must be logged in to create a post.');
      return;
    }
    e.preventDefault();
    if (!newPostContent.trim() && !postImage) return;
    // Respect posting policy: archived or admin-only
    const isSiteAdmin = profile?.is_admin === true;
    const me = isAdmin ? { role: 'admin', status: 'active' } : (isMember ? { role: 'member', status: 'active' } : null);
    if (userRole === 'employer' || !canPostToGroup(group || {}, !!isSiteAdmin, me || undefined)) {
      setError('You don’t have permission for that.');
      return;
    }
    
    setUploadingPost(true);
    try {
      // First create the post without image to obtain postId
      const basePost = { group_id: id, content: newPostContent, user_id: user.id };
      const { data: created, error: createErr } = await createGroupPost(basePost);
      if (createErr) throw createErr;

      let finalPost = created;
      // If image selected, upload and update the post
      if (postImage) {
        const { url, error: uploadError } = await uploadPostImage(postImage, id, created.id);
        if (uploadError) throw uploadError;
        const { data: withImg, error: updErr } = await updateGroupPost(created.id, { image_url: url, has_image: true });
        if (updErr) throw updErr;
        finalPost = withImg;
      }

      setPosts(prev => [finalPost, ...prev]);
      setNewPostContent('');
      removeSelectedImage();
    } catch (err) {
      console.error("Error creating post:", err);
      setError(getFriendlyErrorMessage(err, 'Failed to create post.'));
    } finally {
      setUploadingPost(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  if (!group) return <div className="text-center p-4">Not available or archived.</div>;

  // Private route guard: block non-members (except site admins) from viewing private groups
  const isSiteAdmin = profile?.is_admin === true;
  if (group.is_private && !isMember && !isSiteAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Link to="/groups" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Groups
        </Link>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
          <p className="text-gray-600 mb-6">This is a private group. You must be a member to view its content.</p>
          {userRole !== 'employer' && (
            <button
              onClick={async () => {
                try {
                  const { error } = await requestGroupMembership(id);
                  if (error) throw error;
                  alert('Join request sent to group admins.');
                } catch (e) {
                  alert('Failed to send join request.');
                }
              }}
              className="px-4 py-2 rounded bg-gray-900 text-white"
            >
              Request to join
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {confirmAction === 'removeMember' ? 'Remove Member' : confirmAction === 'deleteGroup' ? 'Delete Group' : 'Delete Post'}
            </h3>
            <p className="mb-6">
              {confirmAction === 'removeMember'
                ? 'Are you sure you want to remove this member from the group?'
                : confirmAction === 'deleteGroup'
                  ? 'Are you sure you want to delete this group? This action cannot be undone.'
                  : 'Are you sure you want to delete this post? This action cannot be undone.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelConfirmAction}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                {confirmAction === 'removeMember' ? 'Remove' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Edit Post</h3>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              maxLength={1000}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={submitEditPost} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Report Post</h3>
            <p className="text-sm text-gray-600 mb-2">Please describe the issue (max 240 chars).</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              maxLength={240}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowReportModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={submitReportPost} disabled={!reportReason.trim()} className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Edit Group</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-700">Name</label>
                <input value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Description</label>
                <textarea value={editGroupDesc} onChange={(e) => setEditGroupDesc(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Tags (comma-separated)</label>
                <input value={editGroupTags} onChange={(e) => setEditGroupTags(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editGroupPrivate} onChange={(e) => setEditGroupPrivate(e.target.checked)} /> Private</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editGroupAdminOnly} onChange={(e) => setEditGroupAdminOnly(e.target.checked)} /> Admin-only Posts</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowEditGroup(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button
                onClick={async () => {
                  try {
                    const updates = {
                      name: editGroupName,
                      description: editGroupDesc,
                      is_private: editGroupPrivate,
                      is_admin_only_posts: editGroupAdminOnly,
                      tags: editGroupTags.split(',').map(t => t.trim()).filter(Boolean),
                    };
                    const { data, error } = await updateGroupDetails(id, updates);
                    if (error) throw error;
                    setGroup(prev => ({ ...prev, ...data }));
                    setShowEditGroup(false);
                  } catch (err) {
                    console.error('Error updating group:', err);
                    setError('Failed to update group');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto p-4">
        <Link to="/groups" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Groups
        </Link>

        {/* Group Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between">
            <div className="flex md:flex-row flex-col">
              {/* Group Avatar with upload option for admins */}
              <div className="relative mr-6 mb-4 md:mb-0">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                  <ImageWithFallback
                    src={avatarSrc}
                    alt={group.name}
                    className="w-24 h-24"
                    placeholderSrc="/default-avatar.svg"
                    emptyMessage="Group image to be uploaded"
                  />
                </div>
                
                {/* Avatar upload button (admin only) */}
                {isAdmin && (
                  <div className="absolute bottom-0 right-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      ref={avatarInputRef}
                    />
                    <button
                      onClick={() => avatarInputRef.current.click()}
                      className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-md"
                      title="Change group avatar"
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      ) : (
                        <Camera size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-800 mr-2">{group.name}</h1>
                  {/* Privacy badge */}
                  <span className={`px-2 py-1 rounded-full text-xs ${group.is_private ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {group.is_private ? 'Private' : 'Public'}
                  </span>
                  {/* Archived badge */}
                  {group.is_archived && (
                    <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Archived</span>
                  )}
                  {/* Admin-only posts badge */}
                  {group.is_admin_only_posts && (
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700">Admin-only Posts</span>
                  )}
                  {/* Moderation chip (creator/admin only) */}
                  {(user?.id === group.created_by || isAdmin) && (
                    group.is_rejected ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700" title={group.rejection_reason || ''}>Rejected</span>
                    ) : (group.is_approved || group.approval_status === 'approved') ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Approved</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Pending</span>
                    )
                  )}
                </div>
                <p className="text-gray-600 mt-1">{group.description}</p>
              </div>
            </div>
            
            <div className="flex-shrink-0 mt-4 md:mt-0 md:ml-4 flex items-center gap-2">
                  {(() => {
                    const isSiteAdmin = profile?.is_admin === true;
                    const isApproved = group.is_approved === true;
                    const isPrivate = group.is_private === true;
                    const showManage = isAdmin && !group.is_archived;
                    const showJoin = userRole !== 'employer' && !group.is_archived && !isMember && isApproved && !isPrivate;
                    const showLeave = !group.is_archived && isMember && !isAdmin;
                    const showRequest = userRole !== 'employer' && !group.is_archived && !isMember && isPrivate && !isAdmin;
                    return (
                      <>
                    {showJoin && (
                      <button 
                        onClick={handleMembership}
                        disabled={joinPending}
                        className={`px-6 py-2 rounded-lg font-semibold text-white transition-all ${joinPending ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {joinPending ? 'Request sent' : 'Join Group'}
                      </button>
                    )}
                    {showLeave && (
                      <button 
                        onClick={handleMembership}
                        className="px-6 py-2 rounded-lg font-semibold text-white transition-all bg-red-500 hover:bg-red-600">
                        Leave Group
                      </button>
                    )}
                    {!showJoin && !showLeave && isMember && (
                      <span className="px-3 py-1 rounded bg-gray-100 text-gray-600 text-sm">Member</span>
                    )}
                    {showRequest && (
                      <button 
                        onClick={handleMembership}
                        className="px-6 py-2 rounded-lg font-semibold text-white transition-all bg-gray-800 hover:bg-gray-900">
                        Request to join
                      </button>
                    )}
                    {showManage && (
                      <>
                        <Link
                          to={`/groups/${id}/manage`}
                          className="px-4 py-2 rounded border text-sm hover:bg-gray-50"
                        >
                          Manage
                        </Link>
                        {profile?.is_admin === true && (
                          <button
                            onClick={() => showConfirm('deleteGroup')}
                            className="px-4 py-2 rounded border border-red-600 text-red-600 text-sm hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </>
                );
              })()}
              
            </div>
          </div>
          {/* Pending approval banner for creator/admins */}
          {((user?.id === group.created_by) || (profile?.is_admin === true)) && !group.is_approved && (
            <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-800 p-3 mt-4">
              Awaiting admin approval. Only you and admins can see this group for now.
            </div>
          )}
          {(!group.is_private && group.is_approved && !group.is_archived) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <ShareButtons url={window.location.href} title={group.name} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button onClick={() => setActiveTab('posts')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'posts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><MessageSquare className="inline-block w-5 h-5 mr-2"/>Posts</button>
              <button onClick={() => setActiveTab('members')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Users className="inline-block w-5 h-5 mr-2"/>Members ({memberCount || members?.length || group?.members?.length || 0})</button>
              <button onClick={() => setActiveTab('about')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'about' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Info className="inline-block w-5 h-5 mr-2"/>About</button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'posts' && (
            (() => {
              const adminOnlyPost = group.is_admin_only_posts === true;
              const publicApproved = (group.is_private === false && group.is_approved === true);
              const canViewPosts = (isMember || publicApproved) && !group.is_archived;
              const canPost = !group.is_archived && isMember && (isAdmin || !adminOnlyPost);
              if (!canViewPosts) {
                if (group.is_archived) return <p className="text-center text-gray-600">This group is archived.</p>;
                if (group.is_private && !isMember) return <p className="text-center text-gray-600">This group is private. Ask an admin for access.</p>;
                if (!group.is_approved) return <p className="text-center text-gray-600">This group is pending review.</p>;
                return <p className="text-center text-gray-600">You don't have access to view posts.</p>;
              }
              return (
                <div>
                  {/* Composer */}
                  <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Create a Post</h2>
                    {group.is_archived && (
                      <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">This group is archived; posting is disabled.</div>
                    )}
                    {adminOnlyPost && !isAdmin && !group.is_archived && (
                      <div className="mb-3 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded p-2">Only group admins can post in this group.</div>
                    )}
                    <form onSubmit={handleCreatePost}>
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="w-full p-2 border rounded"
                        disabled={!canPost}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {/* Image upload for posts is temporarily disabled */}
                        </div>
                        <button
                          type="submit"
                          disabled={!canPost || uploadingPost || (!newPostContent.trim() && !postImage)}
                          className={`px-4 py-2 text-white rounded ${uploadingPost ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
                        >
                          {uploadingPost ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Posts list */}
                  <div className="space-y-4">
                    {posts.length > 0 ? posts.map(post => (
                      <div key={post.id} className="bg-white shadow-md rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <img
                              src={post.author?.avatar_url || '/default-avatar.png'}
                              alt={post.author?.full_name}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                            <div>
                              <p className="font-bold">{post.author?.full_name || 'Amet User'}</p>
                              <p className="text-gray-500 text-sm">{format(new Date(post.created_at), 'PPpp')}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {(isAdmin || post.user_id === user.id) && (
                              <button
                                onClick={() => openEditModal(post)}
                                className="text-gray-500 hover:text-gray-700"
                                title="Edit post"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {(isAdmin || post.user_id === user.id) && (
                              <button
                                onClick={() => showConfirm('deletePost', post.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete post"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                            {/* Report post option removed */}
                          </div>
                        </div>

                        <p className="mb-3">{post.content}</p>

                        {post.image_url && (
                          <div className="mt-2 mb-3">
                            <img
                              src={post.image_url}
                              alt="Post attachment"
                              className="max-h-96 rounded border max-w-full"
                            />
                          </div>
                        )}

                        <div className="mt-2">
                          <CommentsThread postId={post.id} group={group} isMember={isMember} />
                        </div>
                      </div>
                    )) : <p>No posts yet. Be the first!</p>}
                    {hasMore && (
                      <div className="text-center">
                        <button onClick={loadMorePosts} className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200">Load more</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {activeTab === 'members' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map(member => (
                <div key={member.user.id} className="bg-white p-4 rounded-lg shadow relative">
                  {/* Admin badge */}
                  {member.role === 'admin' && (
                    <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Shield size={12} className="mr-1" /> Admin
                    </span>
                  )}
                  
                  <div className="text-center">
                    <img 
                      src={member.user.avatar_url || '/default-avatar.png'} 
                      alt={member.user.full_name} 
                      className="w-20 h-20 rounded-full mx-auto mb-2"
                    />
                    <p className="font-semibold">{member.user.full_name}</p>
                    <p className="text-sm text-gray-600">
                      {(ROLE_LABELS[member?.user?.role] || 'Alumni')}
                      {" • "}
                      {member.role === 'admin' ? 'Group Admin' : 'Member'}
                    </p>
                  </div>
                  
                  {/* Remove member button (admin only, can't remove self or other admins) */}
                  {isAdmin && member.user.id !== user.id && (
                    <div className="mt-2 text-center space-y-2">
                      {member.role !== 'admin' ? (
                        <button
                          onClick={async () => {
                            try {
                              await setMemberRole(id, member.user.id, 'admin');
                              setMembers(prev => prev.map(m => m.user.id === member.user.id ? { ...m, role: 'admin' } : m));
                            } catch (e) {
                              setError('Failed to promote member');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center mx-auto"
                        >
                          Promote to Admin
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await setMemberRole(id, member.user.id, 'member');
                              setMembers(prev => prev.map(m => m.user.id === member.user.id ? { ...m, role: 'member' } : m));
                            } catch (e) {
                              setError('Failed to demote member');
                            }
                          }}
                          className="text-gray-600 hover:text-gray-800 text-sm flex items-center justify-center mx-auto"
                        >
                          Demote to Member
                        </button>
                      )}
                      {member.role !== 'admin' && (
                        <button
                          onClick={() => showConfirm('removeMember', member.user.id)}
                          className="text-red-500 hover:text-red-700 text-sm flex items-center justify-center mx-auto"
                        >
                          <UserMinus size={14} className="mr-1" />
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">About this group</h2>
              <p>{group.description}</p>
              <div className="mt-4">
                <p><strong>Privacy:</strong> {group.is_private ? 'Private' : 'Public'}</p>
                <p><strong>Created:</strong> {format(new Date(group.created_at), 'PPP')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
