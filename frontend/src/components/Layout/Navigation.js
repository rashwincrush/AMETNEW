import React from 'react';
import Logo from '../common/Logo';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarIcon, 
  BriefcaseIcon,
  BookmarkIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
  const location = useLocation();
    const { signOut, getUserRole, profile } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const alumniMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/directory', label: 'Alumni Directory', icon: UsersIcon },
    { path: '/events', label: 'Events', icon: CalendarIcon },
    { path: '/jobs', label: 'Job Portal', icon: BriefcaseIcon },
    { path: '/mentorship', label: 'Mentorship', icon: AcademicCapIcon },
    { path: '/groups', label: 'Groups', icon: UserGroupIcon },
    { path: '/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
  ];

  const adminMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/directory', label: 'Alumni Directory', icon: UsersIcon },
    { path: '/events', label: 'Events', icon: CalendarIcon },
    { path: '/jobs', label: 'Job Portal', icon: BriefcaseIcon },
    { path: '/mentorship', label: 'Mentorship', icon: AcademicCapIcon },
    { path: '/groups', label: 'Groups', icon: UserGroupIcon },
    { path: '/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
    { path: '/admin/approvals', label: 'User Approvals', icon: CogIcon },
    { path: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
    { path: '/admin/users', label: 'User Management', icon: BuildingOfficeIcon },
    { path: '/admin/csv', label: 'CSV Import/Export', icon: ArrowUpTrayIcon },
  ];

  const employerMenuItems = [
    { path: '/jobs', label: 'Job Portal', icon: BriefcaseIcon },
  ];

    const getMenuItems = () => {
        const role = profile?.role || 'alumni';
    switch (role) {
      case 'admin':
        return adminMenuItems;
      case 'employer':
        return employerMenuItems;
      default:
        return alumniMenuItems;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-ocean-200">
      {/* Logo Section */}
      <div className="p-6 border-b border-ocean-200">
        <div className="flex items-center space-x-3">
          <Logo className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">AMET Alumni</h1>
          </div>
        </div>
      </div>



      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {getMenuItems().map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative
                ${isActive(item.path) 
                  ? 'nav-active text-white' 
                  : 'text-gray-700 hover:bg-ocean-50 hover:text-ocean-700'
                }
              `}
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-ocean-200">
        <Link
          to="/profile"
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-ocean-50 hover:text-ocean-700 transition-all duration-200 mb-2"
        >
          <CogIcon className="w-5 h-5 mr-3" />
          Profile Settings
        </Link>
        
        {/* Admin Settings Link - Only visible to admins and super_admins */}
                {profile && (profile.role === 'admin' || profile.role === 'super_admin') && (
          <Link
            to="/admin/settings"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-ocean-50 hover:text-ocean-700 transition-all duration-200 mb-2"
          >
            <ShieldCheckIcon className="w-5 h-5 mr-3" />
            Admin Settings
          </Link>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 transition-all duration-200"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navigation;