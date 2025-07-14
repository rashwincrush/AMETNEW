import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGate from '../PermissionGate';
import toast from 'react-hot-toast';
import { 
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../utils/supabase';

ReactModal.setAppElement('#root');

const DEFAULT_ROLES = [
  { name: 'super_admin', description: 'Super Administrator' },
  { name: 'admin', description: 'Administrator' },
  { name: 'moderator', description: 'Content Moderator' },
  { name: 'employer', description: 'Employer' },
  { name: 'alumni', description: 'AMET Alumni' },
  { name: 'student', description: 'Current Student' },
  { name: 'user', description: 'Standard User' }
];

const RoleManagement = () => {
  const { getUserRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all'
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .order('updated_at', { ascending: false });
          
        if (userError) throw userError;
        
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('*')
          .order('name', { ascending: true });
          
        if (roleError) {
          console.error('Error fetching roles:', roleError);
          setRoles(DEFAULT_ROLES);
        } else {
          if (!roleData || roleData.length === 0) {
            setRoles(DEFAULT_ROLES);
          } else {
            setRoles(roleData);
          }
        }
        
        setUsers(userData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setRoles(DEFAULT_ROLES);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filteredUsers = users.filter(user => {
    if (searchQuery && 
        !`${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !user.email?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (filters.role !== 'all' && user.role !== filters.role) {
      return false;
    }
    
    if (filters.status !== 'all') {
      const isVerified = user.is_verified || false;
      if (filters.status === 'verified' && !isVerified) return false;
      if (filters.status === 'unverified' && isVerified) return false;
    }
    
    return true;
  });

  const getRoleBadge = (roleName) => {
    const roleStyles = {
      super_admin: 'bg-red-100 text-red-800',
      admin: 'bg-orange-100 text-orange-800',
      moderator: 'bg-yellow-100 text-yellow-800',
      employer: 'bg-blue-100 text-blue-800',
      alumni: 'bg-indigo-100 text-indigo-800',
      student: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleStyles[roleName] || roleStyles.user}`}>
        {roleName}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return status ? (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        Verified
      </span>
    ) : (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
        Unverified
      </span>
    );
  };

  const handleEditRole = (user) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  const handleRoleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const newRole = e.target.role.value;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      toast.success(`Successfully updated ${selectedUser.email}'s role to ${newRole}.`);
      setIsRoleModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(`Failed to update role: ${error.message}`);
    }
  };

  const handleRoleFilterChange = (role) => {
    setFilters(prev => ({ ...prev, role }));
  };

  const handleStatusFilterChange = (status) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-8">Loading...</div>;
    }

    if (error) {
      return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    }

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-lg shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <ShieldCheckIcon className="w-6 h-6 mr-2" />
                Role Management
              </h1>
              <p className="mt-1 opacity-90">
                Assign and manage user roles in the system
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Users and Role Management</h3>
            <p className="text-gray-600 mb-2">Manage user roles including alumni, admins, and other users. Use the filters below to find specific users.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {showFilterPanel && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleRoleFilterChange('all')} className={`px-3 py-1 rounded-full text-sm ${filters.role === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>All</button>
                    {roles.map(role => (
                      <button key={role.name} onClick={() => handleRoleFilterChange(role.name)} className={`px-3 py-1 rounded-full text-sm ${filters.role === role.name ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>{role.description}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleStatusFilterChange('all')} className={`px-3 py-1 rounded-full text-sm ${filters.status === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>All</button>
                    <button onClick={() => handleStatusFilterChange('verified')} className={`px-3 py-1 rounded-full text-sm ${filters.status === 'verified' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Verified</button>
                    <button onClick={() => handleStatusFilterChange('unverified')} className={`px-3 py-1 rounded-full text-sm ${filters.status === 'unverified' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Unverified</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.is_verified)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleEditRole(user)} className="text-indigo-600 hover:text-indigo-900">Edit Role</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">
                      <ExclamationCircleIcon className="w-12 h-12 mx-auto text-gray-400" />
                      <p className="mt-2">No users found matching your criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ReactModal
          isOpen={isRoleModalOpen}
          onRequestClose={() => setIsRoleModalOpen(false)}
          onAfterOpen={() => { document.body.style.overflow = 'hidden'; }}
          onAfterClose={() => { document.body.style.overflow = 'auto'; }}
          contentLabel="Update User Role"
          className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl mx-auto my-0"
          style={{
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            },
            content: {
              position: 'relative',
              top: 'auto',
              left: 'auto',
              right: 'auto',
              bottom: 'auto',
              border: 'none',
              padding: '1.5rem',
              maxHeight: '90vh',
              overflow: 'auto'
            }
          }}
        >
          {selectedUser && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Update User Role</h3>
                <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Updating role for: <span className="font-medium">{selectedUser.email || 'User'}</span>
                </p>
                {selectedUser.first_name && selectedUser.last_name && (
                  <p className="text-sm text-gray-500">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                )}
              </div>
              
              <form onSubmit={handleRoleUpdate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    name="role"
                    defaultValue={selectedUser.role || 'user'}
                    className="appearance-none w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {roles.map(role => (
                      <option key={role.name} value={role.name}>
                        {role.description} ({role.name})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsRoleModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                  >
                    Update Role
                  </button>
                </div>
              </form>
            </>
          )}
        </ReactModal>
      </div>
    );
  };

  const userRole = getUserRole();
  const isSuperAdmin = userRole === 'super_admin';
  
  if (isSuperAdmin) {
    return renderContent();
  }
  
  return (
    <PermissionGate 
      permissions="manage_roles"
      fallback={
        <div className="bg-yellow-50 p-8 rounded-lg text-center">
          <ShieldCheckIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-yellow-800">Permission Required</h3>
          <p className="text-yellow-700">You need the 'manage_roles' permission to access this page.</p>
        </div>
      }
    >
      {renderContent()}
    </PermissionGate>
  );
};

export default RoleManagement;