import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PlusIcon, MagnifyingGlassIcon, UsersIcon, LockClosedIcon, LockOpenIcon, CalendarIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Sub-component for displaying a single group card
const GroupCard = ({ group, isMember, onJoin, onLeave }) => {
    const {
        id,
        name = 'Unnamed Group',
        description = 'No description available.',
        tags = [],
        is_private = false,
        members_count = 0,
        posts_count = 0,
        events_count = 0,
        location = 'Not specified',
        created_by_username = 'Admin'
    } = group;

    const category = tags.length > 0 ? tags[0] : 'General';

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out">
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center mb-2">
                            {is_private ? (
                                <LockClosedIcon className="h-5 w-5 text-gray-500 mr-2" />
                            ) : (
                                <LockOpenIcon className="h-5 w-5 text-gray-500 mr-2" />
                            )}
                            <span className="text-sm font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">{category}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{name}</h3>
                    </div>
                    {isMember ? (
                        <button
                            onClick={() => onLeave(id)}
                            className="bg-red-500 text-white font-bold py-2 px-4 rounded-full text-sm hover:bg-red-600 transition-colors"
                        >
                            Leave
                        </button>
                    ) : (
                        <button
                            onClick={() => onJoin(id)}
                            className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-full text-sm hover:bg-indigo-700 transition-colors"
                        >
                            Join
                        </button>
                    )}
                </div>

                <p className="text-gray-600 mb-4 h-16 overflow-hidden">{description}</p>

                <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-700 mb-4">
                    <div className="flex flex-col items-center">
                        <UsersIcon className="h-6 w-6 text-indigo-500 mb-1" />
                        <span className="font-semibold">{members_count}</span>
                        <span>Members</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-indigo-500 mb-1" />
                        <span className="font-semibold">{posts_count}</span>
                        <span>Posts</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <CalendarIcon className="h-6 w-6 text-indigo-500 mb-1" />
                        <span className="font-semibold">{events_count}</span>
                        <span>Events</span>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <div className="text-xs text-gray-500">
                        <p><strong>Location:</strong> {location}</p>
                        <p><strong>Admin:</strong> {created_by_username}</p>
                    </div>
                    <Link to={`/networking/groups/${id}`} className="block w-full text-center bg-gray-100 text-indigo-600 font-semibold py-2 mt-4 rounded-lg hover:bg-gray-200 transition-colors">
                        View Group
                    </Link>
                </div>
            </div>
        </div>
    );
};

const NetworkingGroups = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [myGroupIds, setMyGroupIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('discover');
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState(['Technology', 'Finance', 'Marketing', 'Startups', 'Sustainability']);
    const [filters, setFilters] = useState({
        category: 'all',
        type: 'all',
        location: 'all',
    });

    useEffect(() => {
        const fetchGroupsAndMembers = async () => {
            setLoading(true);
            setError(null);
            try {
                // Set up promises to run in parallel
                const groupsPromise = supabase.from('groups').select('*');
                const userGroupsPromise = user 
                    ? supabase.from('group_members').select('group_id').eq('user_id', user.id)
                    : Promise.resolve({ data: [], error: null });

                const [groupsResult, userGroupsResult] = await Promise.all([groupsPromise, userGroupsPromise]);

                if (groupsResult.error) throw groupsResult.error;
                if (userGroupsResult.error) throw userGroupsResult.error;

                // Process user groups
                if (userGroupsResult.data) {
                    setMyGroupIds(new Set(userGroupsResult.data.map(g => g.group_id)));
                }

                // Process groups and fetch creator profiles
                const groupsData = groupsResult.data || [];
                if (groupsData.length === 0) {
                    setGroups([]);
                    setLoading(false);
                    return;
                }

                const creatorIds = [...new Set(groupsData.map(g => g.created_by).filter(Boolean))];

                if (creatorIds.length > 0) {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, full_name')
                        .in('id', creatorIds);

                    if (profilesError) throw profilesError;

                    const creatorMap = new Map(profilesData.map(p => [p.id, p.full_name]));

                    const transformedGroups = groupsData.map(group => ({
                        ...group,
                        members_count: group.members_count || 0,
                        posts_count: group.posts_count || 0,
                        events_count: group.events_count || 0,
                        created_by_username: creatorMap.get(group.created_by) || 'Admin'
                    }));
                    setGroups(transformedGroups);
                } else {
                    // Handle case where groups exist but have no creators
                     const transformedGroups = groupsData.map(group => ({
                        ...group,
                        members_count: group.members_count || 0,
                        posts_count: group.posts_count || 0,
                        events_count: group.events_count || 0,
                        created_by_username: 'Admin'
                    }));
                    setGroups(transformedGroups);
                }

            } catch (err) {
                console.error("Error fetching networking data:", err);
                setError(`Failed to load networking data: ${err.message}`);
                setGroups([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupsAndMembers();
    }, [user]);

    const handleJoinGroup = async (groupId) => {
        if (!user) {
            toast.error('You must be logged in to join a group.');
            return;
        }
        try {
            const { error } = await supabase
                .from('group_members')
                .insert({ group_id: groupId, user_id: user.id, role: 'member' });
            if (error) throw error;
            setMyGroupIds(prev => new Set(prev).add(groupId));
            toast.success('Successfully joined the group!');
        } catch (err) {
            console.error('Error joining group:', err);
            toast.error('Failed to join the group.');
        }
    };

    const handleLeaveGroup = async (groupId) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', user.id);
            if (error) throw error;
            setMyGroupIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(groupId);
                return newSet;
            });
            toast.success('Successfully left the group.');
        } catch (err) {
            console.error('Error leaving group:', err);
            toast.error('Failed to leave the group.');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredGroups = groups.filter(group => {
        const name = group.name || '';
        const description = group.description || '';
        const tags = group.tags || [];

        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const groupCategory = (tags[0] || 'general').toLowerCase();
        const matchesCategory = filters.category === 'all' || groupCategory === filters.category;

        const groupType = group.is_private ? 'private' : 'public';
        const matchesType = filters.type === 'all' || groupType === filters.type;

        const matchesLocation = filters.location === 'all' || (group.location && group.location.toLowerCase().includes(filters.location.toLowerCase()));

        return matchesSearch && matchesCategory && matchesType && matchesLocation;
    });

    const getVisibleGroups = () => {
        switch (activeTab) {
            case 'my-groups':
                return filteredGroups.filter(group => myGroupIds.has(group.id));
            case 'suggestions':
                // Simple suggestion: show public groups the user is not a member of
                return filteredGroups.filter(group => !myGroupIds.has(group.id) && !group.is_private);
            case 'discover':
            default:
                return filteredGroups;
        }
    };

    const visibleGroups = getVisibleGroups();

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-lg text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900">Networking Groups</h1>
                    <p className="mt-2 text-lg text-gray-600">Connect with fellow alumni, share ideas, and grow your professional network.</p>
                </div>
                <Link
                    to="/networking/create-group"
                    className="mt-4 md:mt-0 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="-ml-1 mr-3 h-5 w-5" />
                    Create New Group
                </Link>
            </div>

            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('discover')}
                            className={`${activeTab === 'discover' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Discover
                        </button>
                        <button
                            onClick={() => setActiveTab('my-groups')}
                            className={`${activeTab === 'my-groups' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            My Groups
                        </button>
                        <button
                            onClick={() => setActiveTab('suggestions')}
                            className={`${activeTab === 'suggestions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Suggestions
                        </button>
                    </nav>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="all">All Categories</option>
                            {categories.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}                        </select>
                    </div>
                    <div>
                        <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="all">All Types</option>
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                    <div>
                        <select name="location" value={filters.location} onChange={handleFilterChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="all">All Locations</option>
                            {/* This should be populated dynamically */}
                            <option value="online">Online</option>
                            <option value="new york">New York</option>
                            <option value="san francisco">San Francisco</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">
                    <p className="text-lg text-gray-600">Loading groups...</p>
                </div>
            ) : visibleGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {visibleGroups.map(group => (
                        <GroupCard
                            key={group.id}
                            group={group}
                            isMember={myGroupIds.has(group.id)}
                            onJoin={handleJoinGroup}
                            onLeave={handleLeaveGroup}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <h3 className="text-xl font-semibold text-gray-800">No Groups Found</h3>
                    <p className="text-gray-500 mt-2">
                        {searchQuery || filters.category !== 'all' || filters.type !== 'all'
                            ? "Try adjusting your search or filters."
                            : "There are no groups to display in this section."}
                    </p>
                </div>
            )}
        </div>
    );
};

export default NetworkingGroups;
