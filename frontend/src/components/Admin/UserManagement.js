import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { adminSetProfileApproval } from '../../api/admin';
import { isRole } from '../../utils/roles';
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
  DocumentArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getFriendlyErrorMessage } from '../../utils/errors';
import UserDetailsModal from './UserDetailsModal';
import EditUserModal from './EditUserModal';
import RejectUserModal from './RejectUserModal';
import MentorsTab from './MentorsTab';

const UserManagement = () => {
  const { hasPermission, user: currentUser, getUserRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchInputRef = useRef(null);
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    role: 'all',
    alumni_verification_status: 'all', // legacy UI label; we will map to approval_status
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const softDeleteUser = async (userId) => {
    setDeletingId(userId);
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_soft_delete_user', { target: userId });
      if (error) {
        console.error('Soft delete failed:', error);
        toast.error(`Delete failed: ${getFriendlyErrorMessage(error, 'Unable to delete user.')}`);
        return { success: false, error };
      }
      
      toast.success('User soft-deleted');
      await fetchUsers(); // refresh the users list
      return { success: true };
    } catch (err) {
      console.error('Error in soft delete:', err);
      toast.error(`Delete failed: ${getFriendlyErrorMessage(err, 'Unable to delete user.')}`);
      return { success: false, error: err };
    } finally {
      setDeletingId(null);
      setLoading(false);
    }
  };

  // Final step: delete Supabase Auth user via Edge Function
  const deleteAuthUser = async (userId) => {
    // Prevent self-delete safety
    if (userId === currentUser?.id) {
      toast.error('You cannot delete your own account.');
      return { success: false };
    }

    const ok = window.confirm('This will permanently delete the user from Supabase Auth. Continue?');
    if (!ok) return { success: false, cancelled: true };

    setDeletingId(userId);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });
      if (error) {
        console.error('Auth delete failed:', error);
        toast.error(`Auth delete failed: ${getFriendlyErrorMessage(error, 'Unable to delete auth user.')}`);
        return { success: false, error };
      }
      if (!data?.ok) {
        toast.error(`Auth delete failed: ${data?.error || 'Unknown error'}`);
        return { success: false, error: data };
      }
      toast.success('Auth user deleted successfully');
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error invoking admin-delete-user:', err);
      toast.error(`Auth delete failed: ${getFriendlyErrorMessage(err, 'Unable to delete auth user.')}`);
      return { success: false, error: err };
    } finally {
      setDeletingId(null);
      setLoading(false);
    }
  };
  
  const purgeUserData = async (userId) => {
    const ok = window.confirm('Purge will permanently remove user-owned data in app DB. Continue?');
    if (!ok) return { success: false, cancelled: true };
    
    setDeletingId(userId);
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_purge_user_data', { target: userId });
      if (error) {
        console.error('Purge failed:', error);
        toast.error(`Purge failed: ${getFriendlyErrorMessage(error, 'Unable to purge user data.')}`);
        return { success: false, error };
      }
      
      toast.success('User data purged');
      await fetchUsers(); // refresh the users list
      return { success: true };
    } catch (err) {
      console.error('Error in purge:', err);
      toast.error(`Purge failed: ${getFriendlyErrorMessage(err, 'Unable to purge user data.')}`);
      return { success: false, error: err };
    } finally {
      setDeletingId(null);
      setLoading(false);
    }
  };
  
  // Legacy function - keep for compatibility but convert to soft delete
  const callAdminDeleteUser = async (userId) => {
    console.log(`Converting deletion to soft delete for user ${userId}`);
    return softDeleteUser(userId);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Debounce search input to reduce network churn and UI jank
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [debouncedQuery, page]);

  // Reset to page 1 when filters, tab, or search change
  useEffect(() => {
    setPage(1);
  }, [selectedTab, filters, debouncedQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // If search text entered, fetch a narrowed set server-side to ensure fresh results include recent users
      const base = supabase.from('profiles').select('*');
      const q = debouncedQuery && debouncedQuery.trim();
      let profilesQuery = q
        ? base.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
        : base;

      // Apply server-side filters to align with selected tab and dropdown filters
      // Selected tab filters
      if (selectedTab === 'employers') {
        profilesQuery = profilesQuery.or('role.eq.employer,is_employer.eq.true');
      } else if (selectedTab === 'deleted') {
        profilesQuery = profilesQuery.eq('is_deleted', true);
      } else if (selectedTab === 'pending') {
        profilesQuery = profilesQuery.or('approval_status.eq.pending,alumni_verification_status.eq.pending');
      } else if (selectedTab === 'rejected') {
        profilesQuery = profilesQuery.or('approval_status.eq.rejected,alumni_verification_status.eq.rejected');
      }

      // Role dropdown filter
      if (filters.role && filters.role !== 'all') {
        if (filters.role === 'admin') {
          profilesQuery = profilesQuery.or('role.eq.admin,role.eq.super_admin');
        } else if (filters.role === 'mentor') {
          profilesQuery = profilesQuery.or('role.eq.mentor,is_mentor.eq.true');
        } else if (filters.role === 'employer') {
          profilesQuery = profilesQuery.or('role.eq.employer,is_employer.eq.true');
        } else if (filters.role === 'alumni') {
          profilesQuery = profilesQuery.eq('role', 'alumni');
        }
      }

      // Status dropdown filter
      if (filters.alumni_verification_status && filters.alumni_verification_status !== 'all') {
        if (filters.alumni_verification_status === 'deleted') {
          profilesQuery = profilesQuery.eq('is_deleted', true);
        } else {
          const s = filters.alumni_verification_status;
          profilesQuery = profilesQuery.or(`approval_status.eq.${s},alumni_verification_status.eq.${s}`);
        }
      }

      // Apply a stable ordering and pagination
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      profilesQuery = profilesQuery
        .order('updated_at', { ascending: false })
        .range(from, to);
      const [profilesRes, rpcRes] = await Promise.all([
        profilesQuery,
        // Prefer the new function exposed in migrations: public.get_admin_users()
        supabase.rpc('get_admin_users')
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const lastMap = new Map();
      if (!rpcRes.error && Array.isArray(rpcRes.data)) {
        rpcRes.data.forEach(row => {
          lastMap.set(row.id, row.last_sign_in_at || null);
        });
      } else if (rpcRes.error) {
        console.warn('get_admin_users RPC not available or failed:', rpcRes.error.message);
      }

      const merged = (profilesRes.data || []).map(p => ({
        ...p,
        last_sign_in_at: lastMap.get(p.id) || null,
      }));
      setUsers(merged);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Could not fetch users.');
      setUsers([]);
    } finally {
      setLoading(false);
      if (initialLoading) setInitialLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchMatch = 
        (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const roleMatch =
        filters.role === 'all' ||
        (filters.role === 'alumni' && user.role === 'alumni') ||
        (filters.role === 'mentor' && (user.role === 'mentor' || user.is_mentor)) ||
        (filters.role === 'employer' && (user.role === 'employer' || user.is_employer)) ||
        (filters.role === 'admin' && (user.role === 'admin' || user.role === 'super_admin' || user.is_admin));

      const effectiveApproval = user.approval_status || user.alumni_verification_status || (user.is_approved ? 'approved' : 'pending');
      const statusMatch =
        filters.alumni_verification_status === 'all' ? true :
        (filters.alumni_verification_status === 'deleted'
          ? user.is_deleted === true
          : String(effectiveApproval) === filters.alumni_verification_status);

      let tabMatch = true;
      if (selectedTab === 'pending') {
        // Only include users whose PROFILE approval is pending (source of truth: alumni_verification_status)
        tabMatch = (effectiveApproval === 'pending');
      } else if (selectedTab === 'rejected') {
        tabMatch = (effectiveApproval === 'rejected');
      } else if (selectedTab === 'mentors') {
        // Delegated to MentorsTab component; this filter is not used when rendering MentorsTab
        tabMatch = false;
      } else if (selectedTab === 'employers') {
        tabMatch = (user.role === 'employer' || user.is_employer);
      } else if (selectedTab === 'deleted') {
        tabMatch = user.is_deleted === true;
      }

      return searchMatch && roleMatch && statusMatch && tabMatch;
    });
  }, [users, searchQuery, filters, selectedTab]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'deleted':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      case 'deleted':
        return 'Deleted';
      default:
        return status || 'N/A';
    }
  };
 
  // Role mapping utility functions
  const ROLE_MAPPINGS = {
    'alumni': 'Alumni',
    'mentor': 'Mentor',
    'employer': 'Employer',
    'mentee_student': 'Mentee/Student',
    'student': 'Mentee/Student',
    'admin': 'Admin',
    'super_admin': 'Super Admin'
  };
  
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'mentor':
        return 'bg-ocean-100 text-ocean-800';
      case 'employer':
        return 'bg-indigo-100 text-indigo-800';
      case 'mentee_student':
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getRoleLabel = (role) => {
    return ROLE_MAPPINGS[role] || 'Unknown';
  };

  const tabs = [
    { name: 'All Users', id: 'all' },
    { name: 'Pending Approval', id: 'pending' },
    { name: 'Rejected', id: 'rejected' },
    { name: 'Mentors', id: 'mentors' },
    { name: 'Employers', id: 'employers' },
    { name: 'Deleted Users', id: 'deleted' },
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
      case 'reject':
        if (user.alumni_verification_status === 'rejected') return;
        setSelectedUser(user);
        setIsRejectModalOpen(true);
        break;
      case 'approve':
        if (user.alumni_verification_status === 'approved') return;
        try {
          const { error } = await adminSetProfileApproval(userId, 'approved');
          if (error) throw error;
          setUsers(currentUsers => currentUsers.map(u => u.id === userId ? { 
            ...u, 
            alumni_verification_status: 'approved',
            approval_status: 'approved',
            rejection_reason: null 
          } : u));
          toast.success(`${user.full_name || user.email} has been approved.`);
        } catch (error) {
          const msg = error?.message || String(error);
          if (/404/.test(msg) || /schema cache/i.test(msg) || /could not find the function/i.test(msg)) {
            toast.error('Approval failed: ensure RPC exists and matches (target uuid, new_status text). Reload PostgREST schema if needed.');
          } else {
            toast.error(`Failed to approve user: ${msg}`);
          }
        }
        break;
      case 'delete':
        // Prevent self-delete
        if (userId === currentUser?.id) {
          toast.error('You cannot delete your own account.');
          return;
        }
        
        if (window.confirm(`Are you sure you want to soft delete user ${user.email || user.id}? They can be restored later.`)) {
          try {
            await softDeleteUser(userId);
            // Don't filter out the user - instead update the UI to show deleted status
            setUsers(prev => prev.map(u => u.id === userId ? {...u, is_deleted: true} : u));
          } catch (err) {
            console.error('Error soft-deleting user:', err);
            toast.error(`Failed to delete user: ${getFriendlyErrorMessage(err, 'Unable to delete user.')}`);
          }
        }
        break;
      case 'purge':
        // Prevent self-purge
        if (userId === currentUser?.id) {
          toast.error('You cannot purge your own account data.');
          return;
        }
        
        if (window.confirm(`Are you sure you want to PERMANENTLY PURGE all data for user ${user.email || user.id}? This cannot be undone!`)) {
          try {
            await purgeUserData(userId);
            // After purging, keep the user in the list but mark data as purged
            setUsers(prev => prev.map(u => u.id === userId ? {...u, is_data_purged: true} : u));
          } catch (err) {
            console.error('Error purging user data:', err);
            toast.error(`Failed to purge user data: ${getFriendlyErrorMessage(err, 'Unable to purge user data.')}`);
          }
        }
        break;
      case 'delete-auth':
        // Prevent self-delete
        if (userId === currentUser?.id) {
          toast.error('You cannot delete your own account.');
          return;
        }
        try {
          await deleteAuthUser(userId);
        } catch (err) {
          console.error('Error deleting auth user:', err);
          toast.error(`Failed to delete auth user: ${getFriendlyErrorMessage(err, 'Unable to delete auth user.')}`);
        }
        break;
      default: {
        toast.error(`Unknown action: ${action}`);
      }
    }
  };

  const handleSaveUser = async (userId, newRole) => {
    try {
      if (!isRole(newRole)) {
        toast.error('Invalid role');
        return;
      }
      // Guard: prevent demoting the last super_admin
      if (selectedUser?.id === userId && selectedUser?.role === 'super_admin' && newRole !== 'super_admin') {
        const { count, error: cntErr } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'super_admin');
        if (!cntErr && (count || 0) <= 1) {
          toast.error('Cannot demote the last Super Admin. Please assign another Super Admin first.');
          return;
        }
      }
      const { error } = await supabase.rpc('admin_set_user_role', {
        p_user_id: userId,
        p_role: newRole,
      });

      if (error) {
        throw error;
      }

      toast.success('User role updated successfully!');
      fetchUsers(); // Refresh the user list
      setIsEditModalOpen(false);
      setSelectedUser(null);

      // If the current actor changed their own role away from super_admin, refresh session & reload
      if (userId === currentUser?.id && newRole !== 'super_admin') {
        try {
          await supabase.auth.refreshSession();
        } catch (e) {
          console.warn('refreshSession failed, proceeding to hard reload');
        }
        // Hard reload to ensure guards and context re-evaluate permissions
        setTimeout(() => window.location.reload(), 300);
      }

    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(`Failed to update user role: ${getFriendlyErrorMessage(error, 'Unable to update user role.')}`);
    }
  };

  const handleBulkAction = async (action) => {
    if (!selectedUsers.length) return;

    if (action === 'approve' || action === 'reject') {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      setLoading(true);
      const results = await Promise.allSettled(
        selectedUsers.map(id => adminSetProfileApproval(id, newStatus))
      );
      const ok = results.filter(r => r.status === 'fulfilled' && !r.value?.error).length;
      const failed = results.length - ok;
      if (ok) {
        setUsers(prev => prev.map(u => selectedUsers.includes(u.id) ? {
          ...u,
          approval_status: newStatus,
          alumni_verification_status: newStatus,
          rejection_reason: newStatus === 'approved' ? null : u.rejection_reason
        } : u));
      }
      setSelectedUsers([]);
      setLoading(false);
      if (ok) toast.success(`${newStatus === 'approved' ? 'Approved' : 'Rejected'} ${ok} user(s).`);
      if (failed) toast.error(`Failed to ${newStatus} ${failed} user(s).`);
      return;
    }

    if (action === 'delete') {
      if (!window.confirm(`Soft delete ${selectedUsers.length} user(s)? They can be restored later.`)) return;
      // Check if trying to delete self
      if (selectedUsers.includes(currentUser?.id)) {
        toast.error('You cannot delete your own account.');
        return;
      }
      setLoading(true);
      const results = await Promise.allSettled(
        selectedUsers.map(id => softDeleteUser(id))
      );
      const ok = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      const failed = results.length - ok;
      setUsers(prev => prev.map(u => selectedUsers.includes(u.id) ? {...u, is_deleted: true} : u));
      setSelectedUsers([]);
      setLoading(false);
      if (ok) toast.success(`Soft-deleted ${ok} user(s).`);
      if (failed) toast.error(`Failed to delete ${failed} user(s).`);
      return;
    }
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

  const handleRejectUser = async (userId, rejectionComment) => {
    try {
      const { error } = await adminSetProfileApproval(userId, 'rejected');
      if (error) throw error;
      
      // Update local UI immediately
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        alumni_verification_status: 'rejected',
        approval_status: 'rejected',
        rejection_reason: rejectionComment || null
      } : u));

      // Remove any stored rejection comments from localStorage if they exist
      // This is to clean up any legacy localStorage items
      try {
        const rejectionComments = JSON.parse(localStorage.getItem('rejectionComments') || '{}');
        if (rejectionComments[userId]) {
          delete rejectionComments[userId];
          localStorage.setItem('rejectionComments', JSON.stringify(rejectionComments));
        }
      } catch (e) {
        console.log('Error cleaning localStorage:', e);
      }
      
      toast.success('User has been rejected');
    } catch (error) {
      const msg = error?.message || String(error);
      if (/404/.test(msg) || /schema cache/i.test(msg) || /could not find the function/i.test(msg)) {
        toast.error('Rejection failed: ensure RPC exists and matches (target uuid, new_status text). Reload PostgREST schema if needed.');
      } else {
        toast.error(`Failed to reject user: ${msg}`);
      }
    } finally {
      setIsRejectModalOpen(false);
    }
  };

  if (initialLoading) {
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

          {/* Render Mentors sub-tab using dedicated MentorsTab */}
          {selectedTab === 'mentors' ? (
            <div className="mt-2">
              <MentorsTab />
            </div>
          ) : (
          /* Search and Filters */
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
                  ref={searchInputRef}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDebouncedQuery('');
                      if (searchInputRef.current) searchInputRef.current.focus();
                    }}
                    aria-label="Clear search"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
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
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>
          )}

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
          {selectedTab !== 'mentors' && (
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.is_deleted ? 'deleted' : (user.approval_status || user.alumni_verification_status || (user.is_approved ? 'approved' : 'pending')))}`}>
                        {getStatusLabel(user.is_deleted ? 'deleted' : (user.approval_status || user.alumni_verification_status || (user.is_approved ? 'approved' : 'pending')))}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {user.location || 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600" title={user.last_sign_in_at || ''}>
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          title="View Details"
                          onClick={() => handleUserAction('view', user.id)}
                          className="inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg text-gray-400 hover:text-ocean-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button 
                          title="Edit User"
                          onClick={() => handleUserAction('edit', user.id)}
                          className="inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg text-gray-400 hover:text-ocean-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {hasPermission('manage:users') && (
                          <>
                            <button 
                              title={(user.approval_status || user.alumni_verification_status || (user.is_approved ? 'approved' : 'pending')) === 'approved' ? 'Already approved' : 'Approve User'}
                              disabled={(user.approval_status || user.alumni_verification_status || (user.is_approved ? 'approved' : 'pending')) === 'approved'}
                              onClick={() => handleUserAction('approve', user.id)}
                              className={`inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg ${(user.approval_status || user.alumni_verification_status || (user.is_approved ? 'approved' : 'pending')) === 'approved' ? 'text-green-300 cursor-not-allowed' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2`}
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button 
                              title={(user.approval_status || user.alumni_verification_status || (user.is_approved ? 'approved' : 'pending')) === 'rejected' ? 'Already rejected' : 'Reject User'}
                              disabled={(user.approval_status || user.alumni_verification_status || (user.is_approved ? 'approved' : 'pending')) === 'rejected'}
                              onClick={() => handleUserAction('reject', user.id)}
                              className={`inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg ${(user.approval_status || user.alumni_verification_status || (user.is_approved ? 'approved' : 'pending')) === 'rejected' ? 'text-red-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2`}
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {hasPermission('delete:users') && user.id !== currentUser?.id && (
                          <>
                            {user.is_deleted ? (
                              <button 
                                title="Purge User Data"
                                onClick={() => handleUserAction('purge', user.id)}
                                disabled={deletingId === user.id}
                                className={`inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg ${deletingId === user.id ? 'opacity-50 cursor-not-allowed' : 'text-gray-400 hover:text-red-800 hover:bg-red-50'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2`}
                                aria-label="Purge user data permanently"
                              >
                                {deletingId === user.id ? (
                                  <div className="w-4 h-4 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
                                ) : (
                                  <DocumentArrowDownIcon className="w-4 h-4" />
                                )}
                              </button>
                              ) : null}
                              {user.is_deleted ? (
                              <button 
                                title="Delete Auth User"
                                onClick={() => handleUserAction('delete-auth', user.id)}
                                disabled={deletingId === user.id}
                                className={`inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg ${deletingId === user.id ? 'opacity-50 cursor-not-allowed' : 'text-gray-400 hover:text-red-900 hover:bg-red-50'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2`}
                                aria-label="Delete user from Supabase Auth"
                              >
                                {deletingId === user.id ? (
                                  <div className="w-4 h-4 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
                                ) : (
                                  <DocumentArrowUpIcon className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <button 
                                title="Soft Delete User"
                                onClick={() => handleUserAction('delete', user.id)}
                                disabled={deletingId === user.id}
                                className={`inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg ${deletingId === user.id ? 'opacity-50 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2`}
                                aria-label="Soft delete user"
                              >
                                {deletingId === user.id ? (
                                  <div className="w-4 h-4 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
                                ) : (
                                  <TrashIcon className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* Pagination */}
          {selectedTab !== 'mentors' && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Page <span className="font-medium">{page}</span> • Showing <span className="font-medium">{filteredUsers.length}</span>
              </p>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border-2 border-ocean-600 text-ocean-600 hover:bg-ocean-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-[colors,opacity,transform,shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={users.length < PAGE_SIZE}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border-2 border-ocean-600 text-ocean-600 hover:bg-ocean-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-[colors,opacity,transform,shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
        isSuperAdminActor={getUserRole && getUserRole() === 'super_admin'}
      />
      
      <RejectUserModal 
        user={selectedUser}
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onReject={handleRejectUser}
      />
    </div>
  );
};

export default UserManagement;