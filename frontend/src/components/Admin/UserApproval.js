import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import {
  CheckIcon,
  XMarkIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  FlagIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

/**
 * UserApproval - Component for verifying and approving user registrations
 * Handles alumni verification, employer accounts, and other user types
 */
const UserApproval = () => {
  const { getUserRole, profile } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  useEffect(() => {
    fetchPendingUsers();
  }, [userType]);
  
  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false });
      
      if (userType !== 'all') {
        query = query.eq('user_type', userType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setPendingUsers(data || []);
    } catch (err) {
      console.error('Error fetching pending users:', err);
      setError(err.message);
      toast.error(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: profile?.id
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setPendingUsers(current =>
        current.filter(user => user.id !== userId)
      );
      
      toast.success('User approved successfully');
    } catch (err) {
      console.error('Error approving user:', err);
      toast.error(`Approval failed: ${err.message}`);
    }
  };
  
  const openRejectModal = (user) => {
    setSelectedUser(user);
    setIsRejectModalOpen(true);
  };
  
  const handleReject = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_rejected: true,
          rejection_reason: rejectionReason,
          rejected_at: new Date().toISOString(),
          rejected_by: profile?.id
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      // Update local state
      setPendingUsers(current =>
        current.filter(user => user.id !== selectedUser.id)
      );
      
      setIsRejectModalOpen(false);
      setSelectedUser(null);
      setRejectionReason('');
      toast.success('User rejected');
    } catch (err) {
      console.error('Error rejecting user:', err);
      toast.error(`Rejection failed: ${err.message}`);
    }
  };
  
  const getUserTypeBadge = (type) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch(type) {
      case 'alumni': return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'employer': return `${baseClasses} bg-green-100 text-green-800`;
      case 'student': return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'faculty': return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'admin': return `${baseClasses} bg-red-100 text-red-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };
  
  // Filter users by search query
  const filteredUsers = pendingUsers.filter(user => {
    if (!searchQuery) return true;
    
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query);
  });
  
  const userTypes = [
    { value: 'all', label: 'All Users' },
    { value: 'alumni', label: 'Alumni' },
    { value: 'employer', label: 'Employers' },
    { value: 'student', label: 'Students' },
    { value: 'faculty', label: 'Faculty' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header and filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">User Verification</h2>
          <p className="text-sm text-gray-600">
            Approve or reject user registration requests
          </p>
        </div>
        
        <div className="flex flex-wrap items-center space-x-2">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
            className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {userTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={fetchPendingUsers}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Users list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-blue-50 p-8 text-center rounded-md">
          <UserGroupIcon className="h-12 w-12 text-blue-400 mx-auto" />
          <h3 className="mt-2 text-lg font-medium text-blue-800">No pending users</h3>
          <p className="mt-1 text-blue-600">All users have been verified!</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <li key={user.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.avatar_url ? (
                        <img 
                          className="h-10 w-10 rounded-full" 
                          src={user.avatar_url} 
                          alt={`${user.first_name} ${user.last_name}`} 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCircleIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </h3>
                        <span className="ml-2">
                          {user.user_type && (
                            <span className={getUserTypeBadge(user.user_type)}>
                              {user.user_type}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <EnvelopeIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <PhoneIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckIcon className="mr-1.5 h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(user)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XMarkIcon className="mr-1.5 h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <XMarkIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Reject User
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Please provide a reason for rejecting {selectedUser?.first_name} {selectedUser?.last_name}'s account. 
                        This will be sent to the user via email.
                      </p>
                      <textarea
                        rows="4"
                        className="mt-3 shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                        placeholder="Enter rejection reason..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleReject}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setSelectedUser(null);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserApproval;
