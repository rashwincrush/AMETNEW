import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, fetchGroups, joinGroup, leaveGroup } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Search, Tag, Calendar, Filter } from 'lucide-react';

// Skeleton loader component for a better loading experience
const GroupCardSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse">
    <div className="w-full h-32 bg-gray-300 rounded-md mb-4"></div>
    <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-full mb-4"></div>
    <div className="flex items-center text-sm text-gray-500">
      <div className="h-4 bg-gray-300 rounded w-16"></div>
    </div>
  </div>
);

// Group card component
const GroupCard = ({ group, isMember, onJoinLeave, currentUserId }) => {
  const isCreator = group.created_by === currentUserId;
  const formattedDate = new Date(group.created_at).toLocaleDateString();
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden transform transition-transform hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/groups/${group.id}`}>
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
          {group.group_avatar_url ? (
            <img 
              src={group.group_avatar_url} 
              alt={group.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Users size={32} />
              <span className="mt-2 text-sm">Group Image</span>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2 truncate">
          <Link to={`/groups/${group.id}`} className="hover:text-blue-600 transition-colors">
            {group.name}
          </Link>
        </h2>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10">
          {group.description || 'No description provided.'}
        </p>
        
        {/* Tags */}
        {group.tags && group.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {group.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index} 
                className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {group.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{group.tags.length - 3} more</span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
          <div className="flex items-center">
            <Users className="w-3 h-3 mr-1" />
            <span>{group.group_members[0]?.count ?? 0} Members</span>
          </div>
          <span className={`px-2 py-1 rounded-full ${group.is_private ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {group.is_private ? 'Private' : 'Public'}
          </span>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-gray-500 flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {formattedDate}
          </span>
          
          {!group.is_private || isCreator ? (
            <button
              onClick={() => onJoinLeave(group.id, isMember, group.is_private)}
              className={`text-xs px-3 py-1.5 rounded-md ${isMember 
                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {isMember ? 'Leave' : 'Join'}
            </button>
          ) : (
            <button
              disabled
              className="text-xs px-3 py-1.5 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
            >
              Private
            </button>
          )}
        </div>
        
        {isCreator && (
          <div className="mt-2 text-right">
            <Link 
              to={`/groups/${group.id}/manage`}
              className="text-xs text-blue-600 hover:underline"
            >
              Manage Group
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const GroupsList = () => {
  const { user, isAdmin, hasPermission } = useAuth();
  const [groups, setGroups] = useState([]);
  const [userMemberships, setUserMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'joined', 'created'
  
  // Check if user can manage all groups (admin privilege)
  const canManageAllGroups = isAdmin || hasPermission('manage:all_groups');
  
  // Get all unique tags from groups
  const allTags = [...new Set(groups.flatMap(group => group.tags || []))];

  useEffect(() => {
    const getGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch groups with proper filters based on role and permissions
        const { data, error } = await fetchGroups({
          searchQuery: searchQuery,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          isAdmin: canManageAllGroups, // Admins can see all
          currentUserId: user?.id || null, // Non-admins: include private groups where member
        });
        
        if (error) throw error;
        
        let filteredData = data || [];
        
        // Apply client-side filtering based on the selected filter
        if (user && filter !== 'all' && filteredData.length > 0) {
          if (filter === 'joined') {
            // Show only groups the user is a member of (via is_member flag)
            filteredData = filteredData.filter(group => group.is_member === true);
          } else if (filter === 'created') {
            // Show only groups created by the user
            filteredData = filteredData.filter(group => group.created_by === user.id);
          }
        }
        
        setGroups(filteredData);
        
        // If user is logged in, identify their group memberships via is_member flag
        if (user) {
          const memberships = (data || [])
            .filter(group => group.is_member === true)
            .map(group => group.id);
          setUserMemberships(memberships);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching groups:", err);
      } finally {
        setLoading(false);
      }
    };

    getGroups();
  }, [user, searchQuery, selectedTags, filter, canManageAllGroups]);

  const handleJoinLeave = async (groupId, isMember, isPrivate) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login?redirect=/groups';
      return;
    }
    
    // Block joining private groups unless user is admin
    if (!isMember && isPrivate && !canManageAllGroups) {
      setError("This is a private group. You need an invitation to join.");
      setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
      return;
    }
    
    try {
      if (isMember) {
        // Leave group - need to pass both groupId and userId
        const { error } = await leaveGroup(groupId, user.id);
        if (error) throw error;
        
        setUserMemberships(prev => prev.filter(id => id !== groupId));
        console.log(`User left group ${groupId}`);
      } else {
        // Join group - supabase backend will handle current user assignment
        const { error } = await joinGroup(groupId);
        
        // Handle potential errors
        if (error) {
          if (error.code === "23505") { // Duplicate membership
            setError("You're already a member of this group.");
          } else if (error.code === "42501") { // Permission denied
            setError("You don't have permission to join this group.");
          } else {
            setError(error.message);
          }
          return;
        }
        
        setUserMemberships(prev => [...prev, groupId]);
        console.log(`User joined group ${groupId}`);
      }
    } catch (err) {
      console.error("Error joining/leaving group:", err);
      setError("An error occurred while trying to join/leave the group.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleTagSelect = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Networking Groups</h1>
        {user && (
          <Link 
            to="/groups/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
          >
            Create Group
          </Link>
        )}
      </div>

      {/* Search and filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            </div>
          </div>
          
          {/* Filter dropdown for logged in users */}
          {user && (
            <div className="flex-shrink-0">
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="all">All Groups</option>
                  <option value="joined">My Groups</option>
                  <option value="created">Created By Me</option>
                </select>
                <Filter className="absolute left-2 top-2.5 text-gray-400 w-4 h-4" />
              </div>
            </div>
          )}
        </div>
        
        {/* Tags filter */}
        {allTags.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <Tag className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => handleTagSelect(tag)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Groups grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => <GroupCardSkeleton key={index} />)
        ) : groups.length > 0 ? (
          groups.map(group => (
            <GroupCard 
              key={group.id} 
              group={group} 
              isMember={group.is_member === true || userMemberships.includes(group.id)}
              onJoinLeave={handleJoinLeave}
              currentUserId={user?.id}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h2 className="text-xl text-gray-600">No groups found.</h2>
            <p className="text-gray-500 mt-2">
              {searchQuery || selectedTags.length > 0
                ? 'Try adjusting your search or filters.'
                : user
                  ? 'Why not be the first to create one?'
                  : 'Sign in to create a new group.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsList;
