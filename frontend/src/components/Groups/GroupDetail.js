import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchGroupDetails, fetchGroupPosts, joinGroup, leaveGroup, createGroupPost } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, MessageSquare, Info, ArrowLeft } from 'lucide-react';
import ShareButtons from '../common/ShareButtons';
import { format } from 'date-fns';

const GroupDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  const loadGroupData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: groupData, error: groupError } = await fetchGroupDetails(id);
      if (groupError) throw groupError;
      setGroup(groupData);
      
      const memberCheck = groupData.members.some(m => m.profiles.id === user.id);
      setIsMember(memberCheck);

      if (memberCheck) {
        const { data: postsData, error: postsError } = await fetchGroupPosts(id);
        if (postsError) throw postsError;
        setPosts(postsData || []);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error loading group data:", err);
    } finally {
      setLoading(false);
    }
  }, [id, user.id]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  const handleMembership = async () => {
    const action = isMember ? leaveGroup : joinGroup;
    const { error } = await action(id, user.id);
    if (error) {
      setError(error.message);
    } else {
      setIsMember(!isMember);
      loadGroupData(); // Refresh data after changing membership
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    const { data, error: postError } = await createGroupPost({ group_id: id, content: newPostContent }, user.id);
    if (postError) {
      setError(postError.message);
    } else {
      setPosts([data, ...posts]);
      setNewPostContent('');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  if (!group) return <div className="text-center p-4">Group not found.</div>;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4">
        <Link to="/groups" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Groups
        </Link>

        {/* Group Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between">
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-gray-800">{group.name}</h1>
              <p className="text-gray-600 mt-1">{group.description}</p>
            </div>
            <div className="flex-shrink-0 mt-4 md:mt-0 md:ml-4">
              <button 
                onClick={handleMembership}
                className={`px-6 py-2 rounded-lg font-semibold text-white transition-all ${isMember ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isMember ? 'Leave Group' : 'Join Group'}
              </button>
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
                <div className="bg-white shadow-md rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4">Create a Post</h2>
                  <form onSubmit={handleCreatePost}>
                    <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="w-full p-2 border rounded" placeholder="What's on your mind?" />
                    <button type="submit" className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Post</button>
                  </form>
                </div>
                <div className="space-y-4">
                  {posts.length > 0 ? posts.map(post => (
                    <div key={post.id} className="bg-white shadow-md rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <img src={post.profiles?.avatar_url || '/default-avatar.png'} alt={post.profiles?.full_name} className="w-10 h-10 rounded-full mr-3"/>
                        <div>
                          <p className="font-bold">{post.profiles?.full_name || 'Amet User'}</p>
                          <p className="text-gray-500 text-sm">{format(new Date(post.created_at), 'PPpp')}</p>
                        </div>
                      </div>
                      <p>{post.content}</p>
                    </div>
                  )) : <p>No posts yet. Be the first!</p>}
                </div>
              </div>
            ) : <p className="text-center text-gray-600">You must be a member to view and create posts.</p>
          )}

          {activeTab === 'members' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {group.members.map(member => (
                <div key={member.profiles.id} className="bg-white text-center p-4 rounded-lg shadow">
                  <img src={member.profiles.avatar_url || '/default-avatar.png'} alt={member.profiles.full_name} className="w-20 h-20 rounded-full mx-auto mb-2"/>
                  <p className="font-semibold">{member.profiles.full_name}</p>
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
