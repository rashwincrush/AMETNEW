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
  deleteGroup
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
import { format } from 'date-fns';

const GroupDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
      
      // Check if user is a member and/or admin
      // Find membership data - the membership record contains the role
      const memberships = groupData.members || [];
      const userMembership = memberships.find(m => m.profiles?.id === user?.id);
      
      // Set member status - a user is a member if they have any membership record
      const memberCheck = !!userMembership;
      setIsMember(memberCheck);
      
      // Admin check - user is an admin if they have 'admin' role in their membership
      // or if they are a site admin (handled via AuthContext)
      const adminCheck = 
        (memberCheck && userMembership.role === 'admin') || 
        user.is_admin === true;
      setIsAdmin(adminCheck);

      console.log('Group membership status:', { 
        isMember: memberCheck, 
        isAdmin: adminCheck,
        membershipData: userMembership
      });

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

  const handleMembership = async () => {
    try {
      if (!user) {
        // Redirect to login if not logged in
        window.location.href = `/login?redirect=/groups/${id}`;
        return;
      }
      
      const action = isMember ? leaveGroup : joinGroup;
      
      // For joining: only pass group ID (backend handles current user)
      // For leaving: pass both group ID and user ID
      const { error } = isMember 
        ? await leaveGroup(id, user.id)
        : await joinGroup(id);
      
      if (error) {
        // Handle specific error cases
        if (error.code === "23505") {
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

  // Delete group (admin or group-admin)
  const handleDeleteGroup = async () => {
    try {
      const { error } = await deleteGroup(id);
      if (error) throw error;
      window.location.href = '/groups';
    } catch (err) {
      console.error('Error deleting group:', err);
      setError('Failed to delete group.');
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
      
      // Update the group members list
      setGroup(prev => ({
        ...prev,
        members: prev.members.filter(member => member.profiles.id !== memberId)
      }));
      
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
      const { error } = await reportGroupPost({ post_id: reportPostId, reason: reportReason.slice(0, 240) });
      if (error) throw error;
      setShowReportModal(false);
      setReportPostId(null);
      setReportReason('');
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
  
  // Handle group avatar upload
  const handleAvatarChange = async (e) => {
    if (!user) {
      alert('You must be logged in to change the group avatar.');
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File is too large. Please select a file smaller than 5MB.');
        return;
      }

      setUploadingAvatar(true);
      try {
        const { url } = await uploadGroupAvatar(file, id);
        // Update group data with new avatar URL
        setGroup(prev => ({ ...prev, group_avatar_url: url }));
      } catch (err) {
        console.error("Error uploading avatar:", err);
        setError("Failed to upload group avatar.");
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
      let imageUrl = null;
      
      // Upload image if selected
      if (postImage) {
        const { url, error: uploadError } = await uploadPostImage(postImage, user.id);
        if (uploadError) throw uploadError;
        imageUrl = url;
      }
      
      // Create post with image URL if available
      const postData = { 
        group_id: id, 
        content: newPostContent,
        user_id: user.id,
        image_url: imageUrl,
        has_image: !!imageUrl
      };
      
      const { data, error: postError } = await createGroupPost(postData);
      if (postError) throw postError;
      
      // Update posts list and reset form
      setPosts([data, ...posts]);
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
              <button 
                onClick={handleMembership}
                className={`px-6 py-2 rounded-lg font-semibold text-white transition-all ${isMember ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isMember ? 'Leave Group' : 'Join Group'}
              </button>
              {(isAdmin || user?.id === group.created_by) && (
                <>
                  <button
                    onClick={() => {
                      setEditGroupName(group.name || '');
                      setEditGroupDesc(group.description || '');
                      setEditGroupTags(Array.isArray(group.tags) ? group.tags.join(', ') : '');
                      setEditGroupPrivate(!!group.is_private);
                      setEditGroupAdminOnly(!!group.is_admin_only_posts);
                      setShowEditGroup(true);
                    }}
                    className="px-4 py-2 rounded border text-sm hover:bg-gray-50"
                  >
                    Edit Group
                  </button>
                  <button
                    onClick={() => showConfirm('deleteGroup')}
                    className="px-4 py-2 rounded border border-red-600 text-red-600 text-sm hover:bg-red-50"
                  >
                    Delete
                  </button>
                </>
              )}
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
              <button onClick={() => setActiveTab('members')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Users className="inline-block w-5 h-5 mr-2"/>Members ({group.members.length})</button>
              <button onClick={() => setActiveTab('about')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'about' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}><Info className="inline-block w-5 h-5 mr-2"/>About</button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'posts' && (
            isMember ? (
              <div>
                {!group.is_admin_only_posts || isAdmin ? (
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
                            src={post.profiles?.avatar_url || '/default-avatar.png'} 
                            alt={post.profiles?.full_name} 
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <div>
                            <p className="font-bold">{post.profiles?.full_name || 'Amet User'}</p>
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
                    </div>
                  )) : <p>No posts yet. Be the first!</p>}
                  {hasMore && (
                    <div className="text-center">
                      <button onClick={loadMorePosts} className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200">Load more</button>
                    </div>
                  )}
                </div>
              </div>
            ) : <p className="text-center text-gray-600">You must be a member to view and create posts.</p>
          )}

          {activeTab === 'members' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {group.members.map(member => (
                <div key={member.profiles.id} className="bg-white p-4 rounded-lg shadow relative">
                  {/* Admin badge */}
                  {member.role === 'admin' && (
                    <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Shield size={12} className="mr-1" /> Admin
                    </span>
                  )}
                  
                  <div className="text-center">
                    <img 
                      src={member.profiles.avatar_url || '/default-avatar.png'} 
                      alt={member.profiles.full_name} 
                      className="w-20 h-20 rounded-full mx-auto mb-2"
                    />
                    <p className="font-semibold">{member.profiles.full_name}</p>
                  </div>
                  
                  {/* Remove member button (admin only, can't remove self or other admins) */}
                  {isAdmin && member.profiles.id !== user.id && (
                    <div className="mt-2 text-center space-y-2">
                      {member.role !== 'admin' ? (
                        <button
                          onClick={async () => {
                            try {
                              await setMemberRole(id, member.profiles.id, 'admin');
                              setGroup(prev => ({
                                ...prev,
                                members: prev.members.map(m => m.profiles.id === member.profiles.id ? { ...m, role: 'admin' } : m)
                              }));
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
                              await setMemberRole(id, member.profiles.id, 'member');
                              setGroup(prev => ({
                                ...prev,
                                members: prev.members.map(m => m.profiles.id === member.profiles.id ? { ...m, role: 'member' } : m)
                              }));
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
                          onClick={() => showConfirm('removeMember', member.profiles.id)}
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
