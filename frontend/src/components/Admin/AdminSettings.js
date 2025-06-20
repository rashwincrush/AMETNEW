import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { useAuth } from '../../contexts/AuthContext';
import RoleManagement from './RoleManagement';
import ContentApproval from './ContentApproval';
import UserApproval from './UserApproval';
import MentorApproval from './MentorApproval';
import SuperAdminPanel from './SuperAdminPanel';
import { 
  Cog6ToothIcon, 
  ShieldCheckIcon, 
  UsersIcon,
  UserGroupIcon,
  KeyIcon,
  DocumentCheckIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import PermissionGate from '../PermissionGate';

/**
 * AdminSettings component - Contains all administrative settings
 * Organized in tabs for better navigation
 */
const AdminSettings = () => {
  const { getUserRole } = useAuth();
  const userRole = getUserRole();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isSuperAdmin = userRole === 'super_admin';
  
  // Define the tabs based on permissions
  const tabs = [
    {
      name: 'Role Management',
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      component: <RoleManagement />,
      permission: 'manage_roles',
      superAdminOnly: false
    },
    {
      name: 'User Approval',
      icon: <UserCircleIcon className="w-5 h-5" />,
      component: <UserApproval />,
      permission: 'approve_users',
      superAdminOnly: false
    },
    {
      name: 'Content Moderation',
      icon: <DocumentCheckIcon className="w-5 h-5" />,
      component: <ContentApproval />,
      permission: 'approve_content',
      superAdminOnly: false
    },
    {
      name: 'Super Admin Tools',
      icon: <ShieldCheckIcon className="w-5 h-5 text-purple-600" />,
      component: <SuperAdminPanel />,
      permission: null,  // No specific permission needed as it's restricted by role
      superAdminOnly: true
    },
    {
      name: 'Mentor Approval',
      icon: <UserGroupIcon className="w-5 h-5" />,
      component: <MentorApproval />,
      permission: 'approve_mentors',
      superAdminOnly: false
    },
    {
      name: 'App Settings',
      icon: <Cog6ToothIcon className="w-5 h-5" />,
      component: <AppSettings />,
      permission: 'manage_settings',
      superAdminOnly: true
    }
  ];
  
  // Filter tabs based on permissions
  const getAvailableTabs = () => {
    return tabs.filter(tab => {
      if (isSuperAdmin) return true;
      return !tab.superAdminOnly;
    });
  };
  
  const availableTabs = getAvailableTabs();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg p-6 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center text-white">
              <Cog6ToothIcon className="w-6 h-6 mr-2" />
              Admin Settings
            </h1>
            <p className="mt-1 text-white font-medium">
              Configure and manage system-wide settings
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content with Tabs */}
      <div className="glass-card rounded-lg p-6">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1">
            {availableTabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `w-full py-3 text-sm font-medium leading-5 text-blue-700 rounded-lg flex items-center justify-center
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
                className={
                  'rounded-xl bg-white'
                }
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

// Removed the PermissionsManagement placeholder component as it's been replaced with MentorApproval

// Placeholder component for App Settings
const AppSettings = () => (
  <div className="p-4">
    <h2 className="text-lg font-semibold mb-4">Application Settings</h2>
    <p className="text-gray-600">
      Configure global application settings, features, and behaviors.
      This feature is coming soon.
    </p>
  </div>
);

export default AdminSettings;
