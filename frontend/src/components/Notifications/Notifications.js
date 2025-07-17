import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BellIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const Notifications = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New event: Alumni Meetup 2024', time: '2 mins ago', unread: true, type: 'event', targetId: '1' },
    { id: 2, text: 'Job application received', time: '1 hour ago', unread: true, type: 'job', targetId: '2' },
    { id: 3, text: 'Mentorship request approved', time: '3 hours ago', unread: false, type: 'mentorship', targetId: '3' },
    { id: 4, text: 'New connection request from Amit Singh', time: '1 day ago', unread: true, type: 'connection', targetId: '4' },
    { id: 5, text: 'Career Development Workshop registration confirmed', time: '2 days ago', unread: false, type: 'event', targetId: '5' },
    { id: 6, text: 'Your resume was viewed by 3 employers', time: '3 days ago', unread: false, type: 'job', targetId: '6' }
  ]);
  
  const [filter, setFilter] = useState('all');

  // In a real application, you would fetch notifications from the backend
  useEffect(() => {
    // Simulating API call to fetch notifications
    // In production, replace this with a real API call

  }, [user]);

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(item => 
        item.id === notification.id 
          ? { ...item, unread: false } 
          : item
      )
    );
    
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

    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(item => ({ ...item, unread: false }))
    );
    // In a real app, you would also call an API to update the read status
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
      ? notifications.filter(n => n.unread) 
      : notifications.filter(n => !n.unread);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BellIcon className="h-6 w-6 text-ocean-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          </div>
          <div className="flex space-x-4">
            <div className="flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  filter === 'all' 
                    ? 'bg-ocean-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } border border-gray-300`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  filter === 'unread' 
                    ? 'bg-ocean-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } border-t border-b border-gray-300`}
                onClick={() => setFilter('unread')}
              >
                Unread
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  filter === 'read' 
                    ? 'bg-ocean-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                } border border-gray-300`}
                onClick={() => setFilter('read')}
              >
                Read
              </button>
            </div>
            <button
              onClick={markAllAsRead}
              className="text-sm font-medium text-ocean-600 hover:text-ocean-700"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-200">
          {filteredNotifications.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <BellIcon className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? "You don't have any notifications yet."
                  : filter === 'unread'
                    ? "You don't have any unread notifications."
                    : "You don't have any read notifications."}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`py-4 flex cursor-pointer ${notification.unread ? 'bg-blue-50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={`mr-4 flex-shrink-0 self-start mt-1 ${notification.unread ? 'text-blue-500' : 'text-gray-400'}`}>
                  {notification.unread ? (
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                  ) : (
                    <div className="h-2 w-2"></div>
                  )}
                </div>
                <div className="flex-grow">
                  <div className="text-sm font-medium text-gray-900">{notification.text}</div>
                  <div className="text-xs text-gray-500">{notification.time}</div>
                </div>
                <div>
                  {notification.unread ? (
                    <XCircleIcon 
                      className="h-5 w-5 text-gray-400 hover:text-gray-500" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotifications(prev => 
                          prev.map(item => 
                            item.id === notification.id 
                              ? { ...item, unread: false } 
                              : item
                          )
                        );
                      }}
                    />
                  ) : (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
