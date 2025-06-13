import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BellIcon, 
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Header = ({ user }) => {
  // Get the latest user profile from auth context
  const { profile } = useAuth();
  
  // Use the most up-to-date user information (profile from context or passed user prop)
  const currentUser = profile || user;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const [notifications] = useState([
    { id: 1, text: 'New event: Alumni Meetup 2024', time: '2 mins ago', unread: true },
    { id: 2, text: 'Job application received', time: '1 hour ago', unread: true },
    { id: 3, text: 'Mentorship request approved', time: '3 hours ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
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

  return (
    <header className="bg-white shadow-sm border-b border-ocean-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-ocean-500 focus:border-ocean-500"
              placeholder="Search alumni, events, jobs..."
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              className="p-2 text-gray-400 hover:text-ocean-600 relative" 
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Notification dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNotifications(false)}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-3 px-4 text-sm text-gray-500">No notifications</div>
                  ) : (
                    <ul>
                      {notifications.map(notification => (
                        <li 
                          key={notification.id} 
                          className={`py-3 px-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${notification.unread ? 'bg-blue-50' : ''}`}
                          onClick={() => handleNotificationClick({
                            ...notification,
                            // Adding these properties for routing purposes
                            type: notification.text.toLowerCase().includes('event') ? 'event' : 
                                  notification.text.toLowerCase().includes('job') ? 'job' : 
                                  notification.text.toLowerCase().includes('connection') ? 'connection' : 'mentorship',
                            targetId: '1' // Default ID; in a real app, this would come from the notification data
                          })}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-900">{notification.text}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 text-center">
                    <button 
                      className="text-sm text-ocean-600 hover:text-ocean-800"
                      onClick={viewAllNotifications}
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{currentUser.full_name || currentUser.name || 'User'}</p>
              <p className="text-xs text-ocean-600">{currentUser.primary_role || currentUser.role || 'Alumni'}</p>
            </div>
            <img 
              src={currentUser.avatar || '/default-avatar.svg'} 
              alt={currentUser.full_name || currentUser.name || 'User'}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.svg';
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;