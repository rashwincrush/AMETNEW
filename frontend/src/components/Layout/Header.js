import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BellIcon, 
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Header = ({ user }) => {
  // Get the latest user profile from auth context
  const { profile, signOut } = useAuth();
  
  // Use the most up-to-date user information (profile from context or passed user prop)
  const currentUser = profile || user;
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const [notifications] = useState([
    { id: 1, text: 'New event: Alumni Meetup 2024', time: '2 mins ago', unread: true },
    { id: 2, text: 'Job application received', time: '1 hour ago', unread: true },
    { id: 3, text: 'Mentorship request approved', time: '3 hours ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };
  
  // Handle notification click based on type
  const handleNotificationClick = (notification) => {
    setShowNotifications(false); // Close the dropdown
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'event':
        navigate(`/events/${notification.targetId}`);
        break;
      case 'job':
        navigate(`/jobs/${notification.targetId}`);
        break;
      case 'connection':
        navigate(`/directory/${notification.targetId}`);
        break;
      case 'mentorship':
        navigate(`/mentorship`);
        break;
      default:
        console.log('Unknown notification type');
    }
  };
  
  // View all notifications
  const viewAllNotifications = () => {
    setShowNotifications(false); // Close the dropdown
    navigate('/notifications');
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-ocean-200 px-6 py-4">
      <div className="flex items-center justify-between space-x-6">
        {/* Logo and Title */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-3">
            
            
          </Link>
        </div>

        {/* Animated Tagline with Water Animation - Centered */}
        <div className="flex-1 flex justify-center px-4">
          <style>
            {`
              @keyframes fade-in-slide-up {
                0% {
                  opacity: 0;
                  transform: translateY(10px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              .tagline-animation {
                animation: fade-in-slide-up 1s ease-out forwards;
              }

              @keyframes wave {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }

              .wave-container {
                width: 250px; /* Width of the visible wave area */
                height: 15px; /* Height of the wave */
                overflow: hidden;
                margin-top: 2px; /* Space below the tagline */
              }

              .wave-svg {
                width: 200%; /* SVG is twice the width to allow for smooth looping */
                height: 100%;
                animation: wave 4s linear infinite;
              }
            `}
          </style>
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-ocean-700 tagline-animation">
              Connecting Mariners Since 1993
            </h2>
            <div className="wave-container">
              <svg className="wave-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 40">
                {/* The wave is duplicated to create a seamless loop */}
                <path fill="none" stroke="#3498db" strokeWidth="2" d="M0,20 Q100,0 200,20 T400,20 Q500,0 600,20 T800,20" />
                <path fill="none" stroke="#3498db" strokeWidth="2" d="M800,20 Q900,0 1000,20 T1200,20 Q1300,0 1400,20 T1600,20" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">

          {/* Notifications */}
          <Link 
            to="/notifications"
            className="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none"
          >
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </Link>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(prev => !prev)}
              className="flex items-center space-x-3 focus:outline-none p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.full_name || currentUser.name || 'User'}</p>
                <p className="text-xs text-ocean-600">{currentUser.primary_role || currentUser.role || 'Alumni'}</p>
              </div>
              <img 
                src={currentUser.avatar_url ? `${currentUser.avatar_url}?t=${new Date().getTime()}` : '/default-avatar.svg'} 
                alt={currentUser.full_name || currentUser.name || 'User'}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.svg';
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                <div className="py-1">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.full_name || currentUser.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser.email || 'No email provided'}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;