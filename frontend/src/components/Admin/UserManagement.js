import React, { useState } from 'react';
import { 
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  EyeIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

const UserManagement = () => {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    graduationYear: 'all',
    location: 'all'
  });
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Mock users data
  const users = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      phone: '+91 98765 43210',
      role: 'alumni',
      status: 'active',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      graduationYear: 2018,
      degree: 'B.Tech Naval Architecture',
      currentPosition: 'Senior Marine Engineer',
      company: 'Ocean Shipping Ltd.',
      location: 'Mumbai, Maharashtra',
      joinedDate: '2024-01-15',
      lastLogin: '2024-04-11',
      profileCompletion: 95,
      connections: 45,
      eventsAttended: 8,
      jobsApplied: 3
    },
    {
      id: 2,
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91 98765 43211',
      role: 'alumni',
      status: 'active',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=50&h=50&fit=crop&crop=face',
      graduationYear: 2015,
      degree: 'M.Tech Marine Technology',
      currentPosition: 'Research Director',
      company: 'Maritime Design Solutions',
      location: 'Chennai, Tamil Nadu',
      joinedDate: '2024-02-01',
      lastLogin: '2024-04-10',
      profileCompletion: 100,
      connections: 78,
      eventsAttended: 12,
      jobsApplied: 0
    },
    {
      id: 3,
      name: 'Mohammed Ali',
      email: 'mohammed.ali@email.com',
      phone: '+91 98765 43212',
      role: 'alumni',
      status: 'active',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
      graduationYear: 2012,
      degree: 'MBA Maritime Management',
      currentPosition: 'Port Operations Manager',
      company: 'Indian Ports Authority',
      location: 'Kochi, Kerala',
      joinedDate: '2023-11-20',
      lastLogin: '2024-04-09',
      profileCompletion: 88,
      connections: 62,
      eventsAttended: 15,
      jobsApplied: 1
    },
    {
      id: 4,
      name: 'Sneha Patel',
      email: 'sneha.patel@email.com',
      phone: '+91 98765 43213',
      role: 'alumni',
      status: 'pending',
      verified: false,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      graduationYear: 2023,
      degree: 'B.Tech Marine Engineering',
      currentPosition: 'Junior Engineer',
      company: 'Coastal Engineering Corp',
      location: 'Pune, Maharashtra',
      joinedDate: '2024-04-05',
      lastLogin: '2024-04-11',
      profileCompletion: 65,
      connections: 12,
      eventsAttended: 2,
      jobsApplied: 5
    },
    {
      id: 5,
      name: 'HR Manager',
      email: 'hr@oceanshipping.com',
      phone: '+91 98765 43214',
      role: 'employer',
      status: 'active',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50&h=50&fit=crop&crop=face',
      graduationYear: null,
      degree: null,
      currentPosition: 'HR Manager',
      company: 'Ocean Shipping Ltd.',
      location: 'Mumbai, Maharashtra',
      joinedDate: '2024-02-15',
      lastLogin: '2024-04-11',
      profileCompletion: 90,
      connections: 23,
      eventsAttended: 1,
      jobsPosted: 8
    },
    {
      id: 6,
      name: 'Admin User',
      email: 'admin@amet.ac.in',
      phone: '+91 98765 43215',
      role: 'admin',
      status: 'active',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      graduationYear: null,
      degree: null,
      currentPosition: 'System Administrator',
      company: 'AMET University',
      location: 'Chennai, Tamil Nadu',
      joinedDate: '2023-01-01',
      lastLogin: '2024-04-11',
      profileCompletion: 100,
      connections: 150,
      eventsAttended: 25,
      eventsCreated: 12
    }
  ];

  const userCounts = {
    all: users.length,
    alumni: users.filter(u => u.role === 'alumni').length,
    employers: users.filter(u => u.role === 'employer').length,
    admins: users.filter(u => u.role === 'admin').length,
    pending: users.filter(u => u.status === 'pending').length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length
  };

  const tabs = [
    { id: 'all', label: `All Users (${userCounts.all})`, icon: UsersIcon },
    { id: 'alumni', label: `Alumni (${userCounts.alumni})`, icon: AcademicCapIcon },
    { id: 'employers', label: `Employers (${userCounts.employers})`, icon: BriefcaseIcon },
    { id: 'admins', label: `Admins (${userCounts.admins})`, icon: ShieldCheckIcon },
    { id: 'pending', label: `Pending (${userCounts.pending})`, icon: ExclamationTriangleIcon }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'employer':
        return 'bg-blue-100 text-blue-800';
      case 'alumni':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    // Tab filter
    let tabMatch = true;
    if (selectedTab === 'alumni') tabMatch = user.role === 'alumni';
    else if (selectedTab === 'employers') tabMatch = user.role === 'employer';
    else if (selectedTab === 'admins') tabMatch = user.role === 'admin';
    else if (selectedTab === 'pending') tabMatch = user.status === 'pending';

    // Search filter
    const searchMatch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (user.company && user.company.toLowerCase().includes(searchQuery.toLowerCase()));

    // Other filters
    const roleMatch = filters.role === 'all' || user.role === filters.role;
    const statusMatch = filters.status === 'all' || user.status === filters.status;
    const locationMatch = filters.location === 'all' || 
                         (user.location && user.location.toLowerCase().includes(filters.location));

    return tabMatch && searchMatch && roleMatch && statusMatch && locationMatch;
  });

  const handleUserAction = (action, userId) => {
    console.log(`${action} user:`, userId);
    // Implement user actions (approve, suspend, delete, etc.)
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk ${action}:`, selectedUsers);
    setSelectedUsers([]);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage and monitor platform users</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="btn-ocean-outline px-4 py-2 rounded-lg flex items-center text-sm">
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Export
            </button>
            <button className="btn-ocean-outline px-4 py-2 rounded-lg flex items-center text-sm">
              <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
              Import
            </button>
            <button className="btn-ocean px-4 py-2 rounded-lg flex items-center text-sm">
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{userCounts.all}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{userCounts.active}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{userCounts.pending}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AcademicCapIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alumni</p>
              <p className="text-2xl font-bold text-gray-900">{userCounts.alumni}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap ${
                    selectedTab === tab.id
                      ? 'text-ocean-600 border-b-2 border-ocean-600 bg-ocean-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input w-full pl-10 pr-4 py-2 rounded-lg"
                  placeholder="Search users by name, email, or company..."
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="form-input px-3 py-2 rounded-lg text-sm"
              >
                <option value="all">All Roles</option>
                <option value="alumni">Alumni</option>
                <option value="employer">Employers</option>
                <option value="admin">Admins</option>
              </select>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="form-input px-3 py-2 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mb-4 p-4 bg-ocean-50 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium text-ocean-800">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleBulkAction('approve')}
                  className="btn-ocean px-3 py-1 rounded text-sm"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleBulkAction('suspend')}
                  className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded text-sm"
                >
                  Suspend
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">User</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Role</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Location</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Last Login</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {user.verified && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircleIcon className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.currentPosition && (
                            <p className="text-xs text-gray-500">{user.currentPosition}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {user.location}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleUserAction('view', user.id)}
                          className="p-1 text-gray-400 hover:text-ocean-600"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleUserAction('edit', user.id)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {user.status === 'pending' && (
                          <button 
                            onClick={() => handleUserAction('approve', user.id)}
                            className="p-1 text-gray-400 hover:text-green-600"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleUserAction('delete', user.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredUsers.length}</span> of{' '}
              <span className="font-medium">{users.length}</span> users
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 bg-ocean-500 text-white rounded-lg text-sm">
                1
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                2
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;