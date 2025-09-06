import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheckIcon, KeyIcon, CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline';

/**
 * PermissionsManagement - Allows super admins to manage role permissions
 */
const PermissionsManagement = () => {
  const { getUserRole } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [newPermission, setNewPermission] = useState({ name: '', description: '' });
  const [showAddPermission, setShowAddPermission] = useState(false);
  
  const isSuperAdmin = getUserRole() === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchRoles();
      fetchPermissions();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
      
      if (data && data.length > 0) {
        setSelectedRole(data[0]);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      toast.error(`Could not load roles: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('name');

      if (error) throw error;
      setPermissions(data || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      toast.error(`Could not load permissions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          role_id,
          permission_id
        `)
        .eq('role_id', roleId);

      if (error) throw error;
      
      const permissionMap = {};
      data?.forEach(item => {
        permissionMap[item.permission_id] = true;
      });
      
      setRolePermissions(permissionMap);
    } catch (err) {
      console.error('Error fetching role permissions:', err);
      toast.error(`Could not load role permissions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (permissionId) => {
    if (!selectedRole) return;
    
    try {
      setLoading(true);
      const hasPermission = rolePermissions[permissionId];
      
      if (hasPermission) {
        // Remove permission
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', selectedRole.id)
          .eq('permission_id', permissionId);
          
        if (error) throw error;
        
        setRolePermissions(prev => {
          const updated = {...prev};
          delete updated[permissionId];
          return updated;
        });
        
        toast.success('Permission removed');
      } else {
        // Add permission
        const { error } = await supabase
          .from('role_permissions')
          .insert({
            role_id: selectedRole.id,
            permission_id: permissionId
          });
          
        if (error) throw error;
        
        setRolePermissions(prev => ({
          ...prev,
          [permissionId]: true
        }));
        
        toast.success('Permission granted');
      }
    } catch (err) {
      console.error('Error updating permission:', err);
      toast.error(`Could not update permission: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addNewPermission = async () => {
    if (!newPermission.name) {
      toast.error('Permission name is required');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('permissions')
        .insert({
          name: newPermission.name.toLowerCase().replace(/\s+/g, '_'),
          description: newPermission.description || newPermission.name
        })
        .select();
        
      if (error) throw error;
      
      toast.success('Permission added successfully');
      fetchPermissions();
      setNewPermission({ name: '', description: '' });
      setShowAddPermission(false);
    } catch (err) {
      console.error('Error adding permission:', err);
      toast.error(`Could not add permission: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-red-50 p-8 rounded-lg shadow-md text-center">
        <div className="text-red-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-red-800">Super Admin Access Required</h3>
        <p className="mt-2 text-sm text-red-700">
          You need Super Admin privileges to manage permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <KeyIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-blue-900">Permission Management</h3>
            <p className="text-sm text-blue-700 mt-1">
              Define which roles have access to specific system features and actions.
            </p>
          </div>
        </div>
      </div>

      {/* Role Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white shadow rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-4">System Roles</h4>
            <div className="space-y-2">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedRole?.id === role.id 
                      ? 'bg-blue-100 text-blue-800 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {role.name === selectedRole?.name && (
                    <span className="mr-1">→</span>
                  )}
                  {role.name}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => setShowAddPermission(true)} 
            className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add new permission
          </button>
        </div>
        
        <div className="md:col-span-3">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedRole?.name && (
                  <span className="capitalize">{selectedRole.name}</span>
                )} Permissions
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedRole?.description || "Manage role's system access"}
              </p>
            </div>
            
            <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Available Permissions
            </div>
            
            {loading ? (
              <div className="px-4 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading permissions...</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {permissions.map(permission => (
                  <li key={permission.id} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                      <div className="text-sm text-gray-500">{permission.description}</div>
                    </div>
                    <div>
                      <button
                        onClick={() => togglePermission(permission.id)}
                        disabled={loading}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          rolePermissions[permission.id] ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            rolePermissions[permission.id] ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {permissions.length === 0 && !loading && (
              <div className="px-4 py-6 text-center">
                <p className="text-gray-500 text-sm">No permissions defined yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Permission Modal */}
      {showAddPermission && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Permission</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="permission-name" className="block text-sm font-medium text-gray-700">
                  Permission Name
                </label>
                <input
                  type="text"
                  id="permission-name"
                  value={newPermission.name}
                  onChange={(e) => setNewPermission({...newPermission, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g. manage_articles"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use lowercase and underscores, no spaces
                </p>
              </div>
              
              <div>
                <label htmlFor="permission-desc" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  id="permission-desc"
                  value={newPermission.description}
                  onChange={(e) => setNewPermission({...newPermission, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g. Can create and edit articles"
                />
              </div>
            </div>
            
            <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddPermission(false)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addNewPermission}
                disabled={loading || !newPermission.name}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Add Permission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsManagement;
