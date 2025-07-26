import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';
import ContentApproval from './ContentApproval';
import UserManagement from './UserManagement';
import CSVExport from './CSVExport';
import { 
  Cog6ToothIcon, 
  ShieldCheckIcon, 
  UsersIcon,
  DocumentCheckIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import PermissionGate from '../PermissionGate';

// Reports component that includes CSV Export functionality
const Reports = () => (
  <div className="p-4">
    <h2 className="text-lg font-semibold mb-4">Reports & Data Management</h2>
    <CSVExport />
  </div>
);

// System Administration component focused on super admin management
const SystemAdministration = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [targetEmail, setTargetEmail] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState(null);

  // Fetch admin users when component mounts
  React.useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role') 
        .or('role.eq.admin,role.eq.super_admin')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setAdminUsers(data || []);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      toast.error(`Could not load admin users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminAssignment = async (userIdToUpdate, makeSuperAdmin) => {
    setLoading(true);
    try {
      const newRole = makeSuperAdmin ? 'super_admin' : 'admin';
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userIdToUpdate);
        
      if (error) throw error;
      
      toast.success(`User role updated to ${newRole}`);
      fetchAdminUsers(); // Refresh the list
    } catch (err) {
      console.error('Error updating user role:', err);
      toast.error(`Failed to update role: ${err.message}`);
    } finally {
      setShowConfirmation(false);
      setSelectedUserForRoleChange(null);
      setLoading(false);
    }
  };

  const handleEmailSearch = async () => {
    if (!targetEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .ilike('email', targetEmail.trim())
        .single();
        
      if (error) throw error;
      if (!data) {
        toast.error('No user found with that email');
        return;
      }
      
      setSelectedUserForRoleChange(data);
      setShowConfirmation(true);
    } catch (err) {
      console.error('Error searching for user:', err);
      toast.error('Failed to find user with that email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-6 w-6 text-purple-700 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">System Administration</h2>
        </div>
        <p className="text-gray-600 mb-6">Manage system administrators and critical platform settings.</p>

        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Assign Super Admin Role</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              placeholder="Enter user's email to find"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              className="flex-1 rounded border border-gray-300 p-2"
            />
            <button
              onClick={handleEmailSearch}
              disabled={loading}
              className="bg-purple-600 text-white rounded px-4 py-2 hover:bg-purple-700 transition"
            >
              {loading ? 'Searching...' : 'Find User & Assign'}
            </button>
          </div>
        </div>

        {showConfirmation && selectedUserForRoleChange && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-yellow-800 mb-2">Confirm Role Change</h4>
            <p className="text-yellow-700 mb-3">
              Are you sure you want to make <span className="font-semibold">{selectedUserForRoleChange.email}</span> a Super Admin?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleSuperAdminAssignment(selectedUserForRoleChange.id, true)}
                className="bg-yellow-600 text-white rounded px-3 py-1 text-sm hover:bg-yellow-700"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-gray-200 text-gray-700 rounded px-3 py-1 text-sm hover:bg-gray-300"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Current Admins & Super Admins</h3>
          {loading && <p className="text-gray-500 italic">Loading administrators...</p>}
          {!loading && adminUsers.length === 0 && (
            <p className="text-gray-500">No administrators found.</p>
          )}
          {!loading && adminUsers.map(admin => (
            <div key={admin.id} className="border-b border-gray-100 py-3 flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {admin.first_name} {admin.last_name}
                </div>
                <div className="text-gray-500 text-sm">{admin.email}</div>
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 text-xs rounded mr-4 ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                  {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
                {admin.role === 'super_admin' ? (
                  <button
                    onClick={() => {
                      setSelectedUserForRoleChange(admin);
                      setShowConfirmation(true);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                    disabled={admin.id === user?.id}
                    title={admin.id === user?.id ? "You cannot revoke your own Super Admin role" : ""}
                  >
                    {admin.id !== user?.id ? 'Revoke Super Admin' : 'Current User'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedUserForRoleChange(admin);
                      setShowConfirmation(true);
                    }}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    Make Super Admin
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const AdminSettings = () => {
  const { getUserRole } = useAuth();
  const userRole = getUserRole();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isSuperAdmin = userRole === 'super_admin';

  // Define the consolidated tabs with redundant components removed
  const tabs = [
    {
      name: 'User Management',
      icon: <UsersIcon className="w-5 h-5" />,
      component: <UserManagement />,
      permission: 'approve_users',
      superAdminOnly: false,
    },
    {
      name: 'Content Management',
      icon: <DocumentCheckIcon className="w-5 h-5" />,
      component: <ContentApproval />,
      permission: 'approve_content',
      superAdminOnly: false,
    },
    {
      name: 'System Administration',
      icon: <WrenchScrewdriverIcon className="w-5 h-5" />,
      component: <SystemAdministration />,
      permission: 'manage_settings',
      superAdminOnly: true,
    },
    {
      name: 'Reports',
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
      component: <Reports />,
      permission: 'manage_settings',
      superAdminOnly: false,
    },
  ];

  const availableTabs = tabs.filter(tab => isSuperAdmin || !tab.superAdminOnly);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg p-6 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-white">
              <Cog6ToothIcon className="w-6 h-6 mr-2" />
              Admin Dashboard
            </h1>
            <p className="mt-1 text-white font-medium">
              Manage users, content, and site settings from one place.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <UsersIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="glass-card rounded-lg p-2 sm:p-6">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1">
            {availableTabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `w-full py-3 text-sm font-medium leading-5 text-blue-700 rounded-lg flex items-center justify-center focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60
                   ${selected
                      ? 'bg-white shadow'
                      : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'
                   }`
                }
              >
                {tab.icon}
                <span className="ml-2">{tab.name}</span>
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-6">
            {availableTabs.map((tab, idx) => (
              <Tab.Panel
                key={idx}
                className={'rounded-xl bg-white p-1'}
              >
                {!isSuperAdmin ? (
                  <PermissionGate
                    permissions={tab.permission}
                    fallback={
                      <div className="bg-yellow-50 p-8 rounded-lg text-center">
                        <ShieldCheckIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-yellow-800">Permission Required</h3>
                        <p className="text-yellow-700">You need additional permissions to access this section.</p>
                      </div>
                    }
                  >
                    {tab.component}
                  </PermissionGate>
                ) : (
                  tab.component
                )}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default AdminSettings;
