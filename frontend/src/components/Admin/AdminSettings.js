import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { useAuth } from '../../contexts/AuthContext';
import RoleManagement from './RoleManagement';
import ContentApproval from './ContentApproval';
import SuperAdminPanel from './SuperAdminPanel';
import UserManagement from './UserManagement';
import { 
  Cog6ToothIcon, 
  ShieldCheckIcon, 
  UsersIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import PermissionGate from '../PermissionGate';

// AppSettings can be a simple component defined at the bottom
const AppSettings = () => (
  <div className="p-4">
    <h2 className="text-lg font-semibold mb-4">Application Settings</h2>
    <p className="text-gray-600">
      Configure global application settings, features, and behaviors. This feature is coming soon.
    </p>
  </div>
);

// Define the new SiteAdministration component that will contain sub-tabs
const SiteAdministration = () => {
  const { getUserRole } = useAuth();
  const isSuperAdmin = getUserRole() === 'super_admin';

  // These are the tabs *within* Site Administration
  const adminTabs = [
    { name: 'Role Management', component: <RoleManagement />, superAdminOnly: false },
    { name: 'Super Admin Tools', component: <SuperAdminPanel />, superAdminOnly: true },
    { name: 'App Settings', component: <AppSettings />, superAdminOnly: true },
  ].filter(tab => isSuperAdmin || !tab.superAdminOnly);

  if (!isSuperAdmin) {
      // Although the parent tab is gated, this provides a clear message if somehow accessed.
      return (
          <div className="bg-yellow-50 p-8 rounded-lg text-center">
            <ShieldCheckIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-yellow-800">Super Admin Access Required</h3>
            <p className="text-yellow-700">This section is available to Super Admins only.</p>
          </div>
      )
  }

  return (
    <div className="p-2 sm:p-4">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-purple-100 p-1">
          {adminTabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 text-purple-700 rounded-lg
                 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-purple-400 ring-white ring-opacity-60
                 ${selected ? 'bg-white shadow' : 'text-purple-500 hover:bg-white/[0.3]'}`
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {adminTabs.map((tab, idx) => (
            <Tab.Panel key={idx} className="rounded-xl bg-white p-3">
              {tab.component}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};


const AdminSettings = () => {
  const { getUserRole } = useAuth();
  const userRole = getUserRole();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isSuperAdmin = userRole === 'super_admin';

  // Define the new, consolidated tabs
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
      name: 'Site Administration',
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      component: <SiteAdministration />,
      permission: 'manage_settings',
      superAdminOnly: true,
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
