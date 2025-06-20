import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MapPinIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  GlobeAltIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const NetworkingGroups = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    location: 'all',
    type: 'all',
    size: 'all'
  });

  // Networking groups data will be fetched from Supabase
  const groups = [];

  // User's groups will be fetched from Supabase
  const myGroups = [];

  // Group suggestions will be generated from Supabase data
  const suggestions = [];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'professional', label: 'Professional' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'academic', label: 'Academic' },
    { value: 'community', label: 'Community' },
    { value: 'business', label: 'Business' }
  ];

  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'mumbai', label: 'Mumbai' },
    { value: 'chennai', label: 'Chennai' },
    { value: 'kochi', label: 'Kochi' },
    { value: 'global', label: 'Global' }
  ];

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' }
  ];

  const handleJoinGroup = (groupId) => {
    console.log('Join group:', groupId);
  };

  const handleLeaveGroup = (groupId) => {
    console.log('Leave group:', groupId);
  };

  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'alumni': return 'bg-green-100 text-green-800';
      case 'academic': return 'bg-purple-100 text-purple-800';
      case 'community': return 'bg-pink-100 text-pink-800';
      case 'business': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filters.category === 'all' || 
                           group.category.toLowerCase() === filters.category;
    
    const matchesLocation = filters.location === 'all' || 
                           group.location.toLowerCase().includes(filters.location);
    
    const matchesType = filters.type === 'all' || 
                       group.type.toLowerCase() === filters.type;
    
    return matchesSearch && matchesCategory && matchesLocation && matchesType;
  });

  const GroupCard = ({ group }) => (
    <div className="glass-card rounded-lg overflow-hidden card-hover">
      <div className="relative">
        <img 
          src={group.image} 
          alt={group.name}
          className="w-full h-32 object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(group.category)}`}>
            {group.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          {group.type === 'Private' ? (
            <LockClosedIcon className="w-5 h-5 text-white bg-black bg-opacity-50 rounded p-1" />
          ) : (
            <GlobeAltIcon className="w-5 h-5 text-white bg-black bg-opacity-50 rounded p-1" />
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">{group.name}</h3>
          {group.isActive ? (
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          ) : (
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{group.description}</p>
        
        <div className="grid grid-cols-3 gap-2 mb-3 text-center text-sm">
          <div>
            <div className="font-semibold text-gray-900">{group.members}</div>
            <div className="text-gray-500 text-xs">Members</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{group.posts}</div>
            <div className="text-gray-500 text-xs">Posts</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{group.events}</div>
            <div className="text-gray-500 text-xs">Events</div>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPinIcon className="w-4 h-4 mr-1" />
          <span>{group.location}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src={group.admin.avatar} 
              alt={group.admin.name}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-xs text-gray-500">Admin: {group.admin.name}</span>
          </div>
          
          {group.isJoined ? (
            <div className="flex space-x-2">
              <Link 
                to={`/networking/groups/${group.id}`}
                className="btn-ocean-outline px-3 py-1 rounded text-xs"
              >
                View
              </Link>
              <button 
                onClick={() => handleLeaveGroup(group.id)}
                className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded text-xs"
              >
                Leave
              </button>
            </div>
          ) : (
            <button 
              onClick={() => handleJoinGroup(group.id)}
              className="btn-ocean px-3 py-1 rounded text-xs"
            >
              {group.type === 'Private' ? 'Request' : 'Join'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Networking Groups</h1>
            <p className="text-gray-600">Join communities of maritime professionals and expand your network</p>
          </div>
          <Link 
            to="/networking/create-group" 
            className="btn-ocean px-4 py-2 rounded-lg flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Group
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'discover', label: 'Discover Groups', icon: MagnifyingGlassIcon },
              { id: 'my-groups', label: 'My Groups', icon: UserGroupIcon },
              { id: 'suggestions', label: 'Suggestions', icon: FireIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'text-ocean-600 border-b-2 border-ocean-600 bg-ocean-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Discover Groups Tab */}
          {activeTab === 'discover' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input w-full pl-10 pr-4 py-2 rounded-lg"
                      placeholder="Search groups by name, description, or tags..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="form-input px-3 py-2 rounded-lg text-sm"
                  >
                    {categories.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="form-input px-3 py-2 rounded-lg text-sm"
                  >
                    {locations.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="form-input px-3 py-2 rounded-lg text-sm"
                  >
                    {types.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600">
                    Found <span className="font-medium">{filteredGroups.length}</span> groups
                  </p>
                  <select className="form-input px-3 py-1 rounded text-sm">
                    <option>Sort by Relevance</option>
                    <option>Sort by Members</option>
                    <option>Sort by Activity</option>
                    <option>Sort by Recent</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* My Groups Tab */}
          {activeTab === 'my-groups' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Groups ({myGroups.length})
                </h3>
                <Link 
                  to="/networking/create-group" 
                  className="btn-ocean-outline px-4 py-2 rounded-lg text-sm"
                >
                  Create New Group
                </Link>
              </div>
              
              {myGroups.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No groups joined yet</h3>
                  <p className="text-gray-600 mb-4">
                    Join groups to connect with like-minded professionals
                  </p>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="btn-ocean px-4 py-2 rounded-lg"
                  >
                    Discover Groups
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myGroups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
              
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{suggestion.name}</h4>
                        <p className="text-ocean-600 text-sm">{suggestion.members} members • {suggestion.category}</p>
                        <p className="text-gray-600 text-sm mt-1">{suggestion.reason}</p>
                      </div>
                      <button 
                        onClick={() => handleJoinGroup(suggestion.id)}
                        className="btn-ocean px-4 py-2 rounded-lg ml-4"
                      >
                        Join Group
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-ocean-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-2">💡 Why These Suggestions?</h4>
                <p className="text-gray-700 text-sm">
                  Our recommendations are based on your profile, interests, location, and connections. 
                  Join groups that match your professional goals and interests to maximize networking opportunities.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-ocean-600">{groups.length}</div>
          <div className="text-sm text-gray-600">Available Groups</div>
        </div>
        <div className="glass-card rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-green-600">{myGroups.length}</div>
          <div className="text-sm text-gray-600">Groups Joined</div>
        </div>
        <div className="glass-card rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {groups.reduce((sum, group) => sum + group.members, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Members</div>
        </div>
        <div className="glass-card rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {groups.filter(group => group.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Groups</div>
        </div>
      </div>
    </div>
  );
};

export default NetworkingGroups;