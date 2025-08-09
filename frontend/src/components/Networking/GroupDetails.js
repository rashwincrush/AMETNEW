import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase'; // Adjust this path if needed
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeftIcon, GlobeAltIcon, LockClosedIcon, TagIcon, UsersIcon, UserPlusIcon, ArrowRightOnRectangleIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const GroupDetails = () => {
  const { groupId } = useParams();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Step 1: Fetch group details
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();

        if (groupError) {
          throw new Error('Group not found or you do not have permission to view it.');
        }
        setGroup(groupData);

        // Step 2: Fetch members (just the user IDs and roles)
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('user_id, role')
          .eq('group_id', groupId);

        if (memberError) {
          throw new Error('Could not fetch group members.');
        }
        
        // Step 3: Get the list of user IDs from the members
        const userIds = memberData.map(member => member.user_id);
        
        // Step 4: Fetch all profile data for those users in a separate query
        if (userIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);
          
          if (profileError) {
            throw new Error('Could not fetch member profiles.');
          }
          
          // Step 5: Join the data manually
          const membersWithProfiles = memberData.map(member => {
            const profile = profileData.find(p => p.id === member.user_id);
            return {
              role: member.role,
              profiles: profile || { id: member.user_id, full_name: 'Unknown User', avatar_url: null }
            };
          });
          
          setMembers(membersWithProfiles || []);
          
          // Step 6: Check if the current user is a member and get their role
          if (user) {
            const currentUserMembership = memberData.find(m => m.user_id === user.id);
            if (currentUserMembership) {
              setIsMember(true);
              setCurrentUserRole(currentUserMembership.role);
            } else {
              setIsMember(false);
              setCurrentUserRole(null);
            }
          }
        } else {
          setMembers([]);
        }

        // Step 7: Fetch group posts
        const { data: postData, error: postError } = await supabase
          .from('group_posts')
          .select('id, content, created_at, user_id')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });

        if (postError) {
          console.error('Error fetching posts:', postError.message);
        } else {
          // Step 8: Fetch profiles for post authors
          const postUserIds = [...new Set(postData.map(post => post.user_id))];
          
          if (postUserIds.length > 0) {
            const { data: postProfilesData, error: postProfilesError } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', postUserIds);

            if (postProfilesError) {
              console.error('Error fetching post author profiles:', postProfilesError.message);
            } else {
              // Join posts with their author profiles
              const postsWithProfiles = postData.map(post => {
                const profile = postProfilesData.find(p => p.id === post.user_id);
                return {
                  ...post,
                  profiles: profile || { id: post.user_id, full_name: 'Unknown User', avatar_url: null }
                };
              });
              
              setPosts(postsWithProfiles || []);
            }
          } else {
            setPosts([]);
          }
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchData();
    }
  }, [groupId, user]);

  const handleJoinGroup = async () => {
    if (!user) {
      toast.error('You must be logged in to join a group.');
      return;
    }
    if (isMember) return; // already joined
    const toastId = toast.loading('Joining group...');
    try {
      // Insert only group_id; backend trigger/RLS will set user_id and role
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId });

      if (error) throw error;

      // Fetch current user's profile to ensure consistency
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .single();
      if (profileError) {
        console.error('Failed to fetch profile after join:', profileError.message);
      }

      const profileToUse = profileData || { 
        id: user.id, 
        full_name: user.user_metadata?.full_name || 'User', 
        avatar_url: user.user_metadata?.avatar_url 
      };
      
      // Optimistically update local state
      setMembers([...members, { role: 'member', profiles: profileToUse }]);
      setIsMember(true);
      setCurrentUserRole('member');
      toast.success('Successfully joined the group!', { id: toastId });
    } catch (err) {
      // Handle common RLS/duplicate cases gracefully
      const msg = err?.message || 'Unknown error';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        setIsMember(true);
        toast.success('You are already a member.', { id: toastId });
      } else if (err?.status === 403) {
        toast.error('You do not have permission to join this group.', { id: toastId });
      } else {
        toast.error(`Failed to join group: ${msg}`, { id: toastId });
      }
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast.error('Post content cannot be empty.');
      return;
    }
    if (!isMember) {
      toast.error('You must be a member to post in this group.');
      return;
    }

    setIsPosting(true);
    const toastId = toast.loading('Creating post...');

    try {
      // Insert the post without requesting nested data
      const { data, error } = await supabase.from('group_posts').insert({
        group_id: groupId,
        user_id: user.id,
        content: newPostContent.trim(),
      }).select('id, content, created_at, user_id').single();

      if (error) throw error;

      // Fetch the user's profile to attach to the post
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Could not fetch profile data, using fallback');
      }

      // Create a complete post object with profile data
      const newPost = {
        ...data,
        profiles: profileData || { 
          id: user.id, 
          full_name: user.user_metadata?.full_name || 'User', 
          avatar_url: user.user_metadata?.avatar_url 
        }
      };

      // Update local state with new post
      setPosts([newPost, ...posts]);
      setNewPostContent('');
      toast.success('Post created successfully!', { id: toastId });
    } catch (err) {
      toast.error(`Error creating post: ${err.message}`, { id: toastId });
    } finally {
      setIsPosting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    const toastId = toast.loading('Leaving group...');
    try {
      const { error } = await supabase.from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh state locally
      setMembers(members.filter(m => m.profiles.id !== user.id));
      setIsMember(false);
      setCurrentUserRole(null);
      toast.success('You have left the group.', { id: toastId });
    } catch (err) {
      toast.error(`Failed to leave group: ${err.message}`, { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Loading group details...</p>
          <div className="mt-4 w-16 h-16 border-4 border-dashed rounded-full animate-spin border-ocean-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600 bg-red-50 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
          <Link to="/networking" className="mt-6 inline-block bg-ocean-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-ocean-700 transition duration-300">
            Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  if (!group) {
    return null; // Should be handled by loading/error states
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Link to="/networking" className="inline-flex items-center gap-2 text-ocean-600 hover:text-ocean-800 mb-6">
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to All Groups</span>
        </Link>

        {/* Group Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:gap-6">
            <div className="flex-shrink-0 w-24 h-24 bg-ocean-100 rounded-lg flex items-center justify-center mb-4 md:mb-0">
              <UsersIcon className="h-12 w-12 text-ocean-500" />
            </div>
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  {group.is_private ? (
                    <><LockClosedIcon className="h-4 w-4" /> Private Group</>
                  ) : (
                    <><GlobeAltIcon className="h-4 w-4" /> Public Group</>
                  )}
                </div>
              </div>
              <p className="mt-3 text-gray-600">{group.description}</p>
              {group.tags && group.tags.length > 0 && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <TagIcon className="h-5 w-5 text-gray-400" />
                  {group.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Placeholder for future content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post Form */}
            {isMember && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${user?.user_metadata?.full_name}`}
                    alt="Your avatar"
                    className="w-10 h-10 rounded-full object-cover bg-gray-200"
                  />
                  <div className="flex-grow">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share something with the group..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition"
                      rows="3"
                      disabled={isPosting}
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleCreatePost}
                        disabled={isPosting || !newPostContent.trim()}
                        className="bg-ocean-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-ocean-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300"
                      >
                        {isPosting ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Posts List */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6" />
                  <span>Posts & Discussions</span>
                </h2>
              </div>
              <ul className="divide-y divide-gray-200">
                {posts.length > 0 ? (
                  posts.map(post => (
                    <li key={post.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <img 
                          src={post.profiles.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${post.profiles.full_name}`}
                          alt={post.profiles.full_name}
                          className="w-10 h-10 rounded-full object-cover bg-gray-200"
                        />
                        <div className="flex-grow">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold text-gray-900">{post.profiles.full_name}</p>
                            <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                          </div>
                          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{post.content}</p>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="p-6 text-center text-gray-500">
                    <p>No posts yet. Be the first to start a conversation!</p>
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Members ({members.length})</h2>
                {isMember ? (
                  <button
                    onClick={handleLeaveGroup}
                    className="flex items-center gap-2 text-sm bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-lg hover:bg-red-200 transition duration-300"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Leave</span>
                  </button>
                ) : (
                  <button
                    onClick={handleJoinGroup}
                    className="flex items-center gap-2 text-sm bg-ocean-100 text-ocean-700 font-semibold py-2 px-3 rounded-lg hover:bg-ocean-200 transition duration-300"
                  >
                    <UserPlusIcon className="h-5 w-5" />
                    <span>Join Group</span>
                  </button>
                )}
              </div>
              <ul className="space-y-4 max-h-96 overflow-y-auto">
                {members.map(member => (
                  <li key={member.profiles.id} className="flex items-center gap-3">
                    <img 
                      src={member.profiles.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${member.profiles.full_name}`}
                      alt={member.profiles.full_name}
                      className="w-10 h-10 rounded-full object-cover bg-gray-200"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-800">{member.profiles.full_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;

