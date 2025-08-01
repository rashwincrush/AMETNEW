import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../utils/supabase';
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
import toast from 'react-hot-toast';
import UserDetailsModal from './UserDetailsModal';
import EditUserModal from './EditUserModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [filters, setFilters] = useState({
    role: 'all',
    alumni_verification_status: 'all',
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    let { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      toast.error('Could not fetch users.');
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchMatch = 
        (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const roleMatch = filters.role === 'all' || 
                        (filters.role === 'mentor' && user.is_mentor) ||
                        (filters.role === 'employer' && user.is_employer) ||
                        (filters.role === 'admin' && user.is_admin);

      const statusMatch = filters.alumni_verification_status === 'all' || user.alumni_verification_status === filters.alumni_verification_status;

      let tabMatch = true;
      if (selectedTab === 'pending') {
        tabMatch = user.alumni_verification_status === 'pending' || user.mentor_status === 'pending';
      } else if (selectedTab === 'mentors') {
        tabMatch = user.is_mentor;
      } else if (selectedTab === 'employers') {
        tabMatch = user.is_employer;
      }

      return searchMatch && roleMatch && statusMatch && tabMatch;
    });
  }, [users, searchQuery, filters, selectedTab]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadge = (user) => {
    if (user.is_admin) return 'bg-purple-100 text-purple-800';
    if (user.is_mentor) return 'bg-blue-100 text-blue-800';
    if (user.is_employer) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  const getRoleName = (user) => {
    if (user.is_admin) return 'Admin';
    if (user.is_mentor) return 'Mentor';
    if (user.is_employer) return 'Employer';
    return 'Alumni';
  };

  const tabs = [
    { name: 'All Users', id: 'all' },
    { name: 'Pending Approval', id: 'pending' },
    { name: 'Mentors', id: 'mentors' },
    { name: 'Employers', id: 'employers' },
  ];

  const handleUserAction = async (action, userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    switch (action) {
      case 'view':
        setSelectedUser(user);
        setIsModalOpen(true);
        break;
      case 'edit':
        setSelectedUser(user);
        setIsEditModalOpen(true);
        break;
      case 'approve':
        if (user.alumni_verification_status !== 'pending') return;
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ alumni_verification_status: 'verified' })
            .eq('id', userId);
          if (error) throw error;
          setUsers(currentUsers => currentUsers.map(u => u.id === userId ? { ...u, alumni_verification_status: 'verified' } : u));
          toast.success(`${user.full_name || user.email} has been verified.`);
        } catch (error) {
          toast.error(`Failed to verify user: ${error.message}`);
        }
        break;
      case 'reject': {
        if (user.alumni_verification_status !== 'pending') return;
        const reason = prompt(`Provide a reason for rejecting ${user.full_name || user.email}:`);
        if (reason) {
          try {
            const { error } = await supabase
              .from('profiles')
              .update({ alumni_verification_status: 'rejected' })
              .eq('id', userId);
            if (error) throw error;
            setUsers(currentUsers => currentUsers.map(u => u.id === userId ? { ...u, alumni_verification_status: 'rejected' } : u));
            toast.success(`${user.full_name || user.email} has been rejected.`);
          } catch (error) {
            toast.error(`Failed to reject user: ${error.message}`);
          }
        }
        break;
      }
      case 'delete': {
        if (window.confirm(`Are you sure you want to delete ${user.full_name || user.email}? This action is irreversible.`)) {
          toast.error('User deletion from the client is not secure. This requires a backend function.');
          console.log(`Attempted to delete user: ${userId}`);
        }
        break;
      }
      default: {
        toast.error(`Unknown action: ${action}`);
      }
    }
  };

  const handleSaveUser = async (userId, updatedData) => {
    try {
      // First, update the role if it has changed.
      if (updatedData.role) {
        const { error: rpcError } = await supabase.rpc('update_user_role', {
          user_id: userId,
          new_role: updatedData.role,
        });

        if (rpcError) {
          throw new Error(`Role update failed: ${rpcError.message}`);
        }
      }

      // Then, update any other fields, excluding role and generated columns.
      const { full_name, role, ...otherData } = updatedData;
      if (Object.keys(otherData).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(otherData)
          .eq('id', userId);

        if (updateError) {
          throw new Error(`Profile update failed: ${updateError.message}`);
        }
      }

      // If all successful, update UI and show success toast.
      setUsers(users.map((user) => (user.id === userId ? { ...user, ...updatedData } : user)));
      toast.success('User profile updated successfully!');
      setEditingUser(null); // Exit editing mode

    } catch (error) {
      toast.error(`Update failed: ${error.message}`);
      // On failure, refresh data from server to ensure UI consistency.
      fetchUsers();
    }
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk Action: ${action}, Selected Users:`, selectedUsers);
    toast.success(`Bulk action ${action} will be implemented soon!`);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  if (loading) {
    return <div className="p-8">Loading user data...</div>;
  }

  return (
    <div className="bg-gray-50/50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <UsersIcon className="w-8 h-8 mr-3 text-ocean-500" />
            User Management
          </h1>
          <p className="mt-1 text-gray-600">
            Oversee, manage, and moderate all users on the platform.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`${
                    selectedTab === tab.id
                      ? 'border-ocean-500 text-ocean-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full rounded-lg border-gray-300 pl-10 focus:border-ocean-500 focus:ring-ocean-500 sm:text-sm"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="role-filter" className="sr-only">Filter by Role</label>
              <select 
                id="role-filter"
                className="block w-full rounded-lg border-gray-300 focus:border-ocean-500 focus:ring-ocean-500 sm:text-sm"
                value={filters.role}
                onChange={e => setFilters({...filters, role: e.target.value})}
              >
                <option value="all">All Roles</option>
                <option value="alumni">Alumni</option>
                <option value="mentor">Mentor</option>
                <option value="employer">Employer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
              <select 
                id="status-filter"
                className="block w-full rounded-lg border-gray-300 focus:border-ocean-500 focus:ring-ocean-500 sm:text-sm"
                value={filters.alumni_verification_status}
                onChange={e => setFilters({...filters, alumni_verification_status: e.target.value})}
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="bg-ocean-50 border border-ocean-200 rounded-lg p-3 mb-6 flex items-center justify-between">
              <p className="text-sm font-medium text-ocean-800">
                {selectedUsers.length} user{selectedUsers.length > 1 && 's'} selected
              </p>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => handleBulkAction('approve')}
                  className="text-sm font-medium text-green-600 hover:text-green-800 flex items-center"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-1" /> Approve
                </button>
                <button 
                  onClick={() => handleBulkAction('reject')}
                  className="text-sm font-medium text-yellow-600 hover:text-yellow-800 flex items-center"
                >
                  <XCircleIcon className="w-4 h-4 mr-1" /> Reject
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center"
                >
                  <TrashIcon className="w-4 h-4 mr-1" /> Delete
                </button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="relative py-3.5 pl-4 pr-3 text-left sm:pl-6">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      ref={el => {
                        if (el) {
                          el.indeterminate = selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length;
                        }
                      }}
                    />
                  </th>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    User
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Location
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Last Login
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={selectedUsers.includes(user.id) ? 'bg-ocean-50' : ''}>
                    <td className="relative py-4 pl-4 pr-3 sm:pl-6">
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-ocean-600 focus:ring-ocean-500"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img className="h-10 w-10 rounded-full object-cover" src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=random`} alt="" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.current_position && (
                            <p className="text-xs text-gray-500">{user.current_position}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user)}`}>
                        {getRoleName(user)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.alumni_verification_status)}`}>
                        {user.alumni_verification_status || 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {user.location || 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {user.last_seen ? new Date(user.last_seen).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          title="View Details"
                          onClick={() => handleUserAction('view', user.id)}
                          className="p-1 text-gray-400 hover:text-ocean-600"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button 
                          title="Edit User"
                          onClick={() => handleUserAction('edit', user.id)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {user.alumni_verification_status === 'pending' && (
                          <>
                            <button 
                              title="Approve User"
                              onClick={() => handleUserAction('approve', user.id)}
                              className="p-1 text-gray-400 hover:text-green-600"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button 
                              title="Reject User"
                              onClick={() => handleUserAction('reject', user.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          title="Delete User"
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

      <UserDetailsModal 
        user={selectedUser} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <EditUserModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default UserManagement;