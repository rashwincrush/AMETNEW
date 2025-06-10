import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarIcon, 
  BriefcaseIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const alumniMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/directory', label: 'Alumni Directory', icon: UsersIcon },
    { path: '/events', label: 'Events', icon: CalendarIcon },
    { path: '/jobs', label: 'Job Portal', icon: BriefcaseIcon },
    { path: '/mentorship', label: 'Mentorship', icon: AcademicCapIcon },
    { path: '/networking', label: 'Networking', icon: UserGroupIcon },
    { path: '/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
  ];

  const adminMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/directory', label: 'Alumni Directory', icon: UsersIcon },
    { path: '/events', label: 'Events', icon: CalendarIcon },
    { path: '/jobs', label: 'Job Portal', icon: BriefcaseIcon },
    { path: '/mentorship', label: 'Mentorship', icon: AcademicCapIcon },
    { path: '/networking', label: 'Networking', icon: UserGroupIcon },
    { path: '/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
    { path: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
    { path: '/admin/users', label: 'User Management', icon: CogIcon },
  ];

  const employerMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/directory', label: 'Alumni Directory', icon: UsersIcon },
    { path: '/jobs', label: 'Job Portal', icon: BriefcaseIcon },
    { path: '/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon },
  ];

  const getMenuItems = () => {
    switch (user.role) {
      case 'admin':
        return adminMenuItems;
      case 'employer':
        return employerMenuItems;
      default:
        return alumniMenuItems;
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-ocean-200">
      {/* Logo Section */}
      <div className="p-6 border-b border-ocean-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-ocean-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-ocean-800">AMET</h1>
            <p className="text-sm text-ocean-600">Alumni Portal</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-ocean-200">
        <div className="flex items-center space-x-3">
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-ocean-600 capitalize">{user.role}</p>
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
          Settings
        </Link>
        <button
          onClick={onLogout}
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