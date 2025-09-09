import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { 
  fetchGroupDetails, 
  fetchGroupPosts, 
  joinGroup, 
  leaveGroup, 
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
  fetchGroupMembers,
  fetchPostComments
} from '../../utils/supabase';
import { getMyMembership } from '../../lib/membership';
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
import { format } from 'date-fns';

const GroupDetail = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  
  // New state variables for enhanced features
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
      
      // Determine membership and admin using new helper
      let memberCheck = false;
      let adminCheck = false;
      if (user?.id) {
        const mem = await getMyMembership(supabase, id);
        memberCheck = !!mem;
        const isSiteAdmin = profile?.is_admin === true;
        adminCheck = (mem?.role === 'admin') || isSiteAdmin;
      }
      setIsMember(memberCheck);
      setIsAdmin(adminCheck);

      // console debug removed to avoid referencing undefined variables

      // Fetch posts if user is a member or the group is public (paged)
      if (memberCheck || !groupData.is_private) {
        const { data: postsData, error: postsError } = await fetchGroupPosts(id, { limit: 10 });
        if (postsError) throw postsError;
        setPosts(postsData || []);
        setHasMore((postsData || []).length === 10);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error loading group data:", err);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

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
      
      if (!isMember && !showJoin) return; // no-op if join not allowed
      if (isMember && !showLeave) return;  // no-op if leave not allowed
      
      const action = isMember ? leaveGroup : joinGroup;
      
      // For joining: only pass group ID (backend handles current user)
      // For leaving: pass both group ID and user ID
      const { error } = isMember 
        ? await leaveGroup(id, user.id)
        : await joinGroup(id);
      
      if (error) {
        // Handle specific error cases
        if (error.code === "23505" || error.status === 409) {
          // Duplicate key error - user is already a member
          setError("You're already a member of this group");
        } else if (error.code === "42501") {
          // Permission error
          setError("You don't have permission to join this group");
        } else {
          setError(error.message);
        }
      } else {
        // Toggle membership status and refresh data
        setIsMember(!isMember);
        loadGroupData();
      }
    } catch (err) {
      console.error("Error handling membership change:", err);
      setError("An unexpected error occurred. Please try again.");
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
  
  // Handle group avatar upload (PNG/JPG only, 5MB, upsert true)
  const handleAvatarChange = async (e) => {
    if (!user) {
      alert('You must be logged in to change the group avatar.');
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file) return;

      const ACCEPT = ['image/png','image/jpeg'];
      const MAX = 5 * 1024 * 1024;
      if (!ACCEPT.includes(file.type)) {
        alert('Only PNG or JPG images are allowed.');
        return;
      }
      if (file.size > MAX) {
        alert('Image must be 5 MB or smaller.');
        return;
      }

      setUploadingAvatar(true);
      try {
        const ext = file.type === 'image/png' ? 'png' : 'jpg';
        const path = `${id}/avatar.${ext}`;
        const { error } = await supabase.storage
          .from('group_avatars')
          .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
        if (error) throw error;
        const { data } = supabase.storage.from('group_avatars').getPublicUrl(path);
        const busted = `${data.publicUrl}?v=${Date.now()}`;
        setGroup(prev => ({ ...prev, group_avatar_url: busted }));
      } catch (err) {
        console.error('Error uploading avatar:', err);
        setError('Failed to upload group avatar.');
      } finally {
        setUploadingAvatar(false);
      }
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
      setError("Failed to create post.");
    } finally {
      setUploadingPost(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  if (!group) return <div className="text-center p-4">Group not found.</div>;

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
                  {group.group_avatar_url ? (
                    <img 
                      src={group.group_avatar_url} 
                      alt={group.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users size={40} className="text-gray-400" />
                  )}
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
                const showJoin = !group.is_archived && !isMember && isApproved && !isPrivate;
                const showLeave = !group.is_archived && isMember && !isAdmin;
                return (
                  <>
                    {showJoin && (
                      <button 
                        onClick={handleMembership}
                        className="px-6 py-2 rounded-lg font-semibold text-white transition-all bg-blue-600 hover:bg-blue-700">
                        Join Group
                      </button>
                    )}
                    {showLeave && (
                      <button 
                        onClick={handleMembership}
                        className="px-6 py-2 rounded-lg font-semibold text-white transition-all bg-red-500 hover:bg-red-600">
                        Leave Group
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
          <div className="mt-4 pt-4 border-t border-gray-200">
            <ShareButtons url={window.location.href} title={group.name} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button onClick={() => setActiveTab('posts')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'posts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><MessageSquare className="inline-block w-5 h-5 mr-2"/>Posts</button>
              <button onClick={() => setActiveTab('members')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Users className="inline-block w-5 h-5 mr-2"/>Members ({members.length})</button>
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
              const showPostBox = !group.is_archived && isMember && (isAdmin || !adminOnlyPost);
              if (!canViewPosts) {
                if (group.is_archived) {
                  return <p className="text-center text-gray-600">This group is archived.</p>;
                }
                if (group.is_private && !isMember) {
                  return <p className="text-center text-gray-600">This group is private. Ask an admin for access.</p>;
                }
                if (!group.is_approved) {
                  return <p className="text-center text-gray-600">This group is pending review.</p>;
                }
                return <p className="text-center text-gray-600">You don't have access to view posts.</p>;
              }
              return (
              <div>
                {showPostBox ? (
                  <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Create a Post</h2>
                    <form onSubmit={handleCreatePost}>
                      <textarea 
                        value={newPostContent} 
                        onChange={(e) => setNewPostContent(e.target.value)} 
                        className="w-full p-2 border rounded" 
                        placeholder="What's on your mind?" 
                        maxLength={1000}
                      />
                    
                      {/* Image preview */}
                      {postImagePreview && (
                        <div className="relative mt-2 inline-block">
                          <img 
                            src={postImagePreview} 
                            alt="Preview" 
                            className="max-h-40 rounded border" 
                          />
                          <button
                            type="button"
                            onClick={removeSelectedImage}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center">
                          {/* Image upload button */}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePostImageChange}
                            className="hidden"
                            ref={fileInputRef}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="flex items-center text-blue-500 hover:text-blue-700 mr-2"
                          >
                            <ImageIcon size={18} className="mr-1" />
                            Add Image
                          </button>
                        </div>
                        
                        {/* Post button */}
                        <button 
                          type="submit" 
                          disabled={uploadingPost || (!newPostContent.trim() && !postImage)}
                          className={`px-4 py-2 text-white rounded ${uploadingPost ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}`}
                        >
                          {uploadingPost ? 'Posting...' : 'Post'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-4 mb-6 text-sm">
                    Only group admins can post in this group.
                  </div>
                )}
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
                          {/* Edit post (owner/admin) */}
                          {(isAdmin || post.user_id === user.id) && (
                            <button 
                              onClick={() => openEditModal(post)}
                              className="text-gray-500 hover:text-gray-700"
                              title="Edit post"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                          {/* Delete post (owner/admin) */}
                          {(isAdmin || post.user_id === user.id) && (
                            <button 
                              onClick={() => showConfirm('deletePost', post.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete post"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          {/* Report (non-owner) */}
                          {post.user_id !== user.id && (
                            <button
                              onClick={() => openReportModal(post.id)}
                              className="text-orange-500 hover:text-orange-700"
                              title="Report post"
                            >
                              <Shield size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Post content */}
                      <p className="mb-3">{post.content}</p>
                      
                      {/* Post image if available */}
                      {post.image_url && (
                        <div className="mt-2 mb-3">
                          <img 
                            src={post.image_url} 
                            alt="Post attachment" 
                            className="max-h-96 rounded border max-w-full"
                          />
                        </div>
                      )}

                      {/* Comments toggle and list */}
                      <div className="mt-2">
                        <button
                          className="text-sm text-blue-600 hover:underline"
                          onClick={async () => {
                            setComments(prev => ({
                              ...prev,
                              [post.id]: { ...(prev[post.id] || {}), open: !prev[post.id]?.open }
                            }));
                            const entry = comments[post.id];
                            if (!entry || (!entry.items && !entry.loading)) {
                              setComments(prev => ({ ...prev, [post.id]: { ...(prev[post.id] || {}), loading: true } }));
                              const { data } = await fetchPostComments(post.id);
                              setComments(prev => ({ ...prev, [post.id]: { open: true, loading: false, items: data || [], input: '' } }));
                            }
                          }}
                        >
                          {comments[post.id]?.open ? 'Hide comments' : 'Comments'}
                        </button>
                        {comments[post.id]?.open && (
                          <div className="mt-2 space-y-2">
                            {(comments[post.id]?.items || []).map(c => (
                              <div key={c.id} className="border-t pt-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <img src={c.author?.avatar_url || '/default-avatar.png'} alt={c.author?.full_name} className="w-6 h-6 rounded-full mr-2" />
                                    <span className="text-sm font-medium">{c.author?.full_name || 'Amet User'}</span>
                                    <span className="text-xs text-gray-500 ml-2">{format(new Date(c.created_at), 'PPpp')}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {(isAdmin || c.user_id === user.id) && (
                                      <button onClick={() => openEditModal(c)} aria-label="Edit comment" className="text-gray-500 hover:text-gray-700"><Edit size={14} /></button>
                                    )}
                                    {(isAdmin || c.user_id === user.id) && (
                                      <button onClick={() => showConfirm('deletePost', c.id)} aria-label="Delete comment" className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm mt-1">{c.content}</p>
                              </div>
                            ))}
                            {isMember && (!group.is_admin_only_posts || isAdmin) && (
                              <div className="flex items-center gap-2 mt-2">
                                <input
                                  type="text"
                                  value={comments[post.id]?.input || ''}
                                  onChange={(e) => setComments(prev => ({ ...prev, [post.id]: { ...(prev[post.id] || {}), input: e.target.value } }))}
                                  className="flex-1 border rounded px-2 py-1 text-sm"
                                  placeholder="Write a comment..."
                                  maxLength={500}
                                />
                                <button
                                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
                                  onClick={async () => {
                                    const text = (comments[post.id]?.input || '').trim();
                                    if (!text) return;
                                    const { data, error } = await createGroupPost({ group_id: id, user_id: user.id, content: text, parent_post_id: post.id });
                                    if (!error && data) {
                                      setComments(prev => ({
                                        ...prev,
                                        [post.id]: { open: true, loading: false, input: '', items: [...(prev[post.id]?.items || []), data] }
                                      }));
                                    }
                                  }}
                                >
                                  Send
                                </button>
                              </div>
                            )}
                          </div>
                        )}
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
