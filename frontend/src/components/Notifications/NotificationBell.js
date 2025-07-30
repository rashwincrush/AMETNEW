import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { BellIcon, EnvelopeIcon, UserIcon, CalendarIcon, BriefcaseIcon, ChatBubbleLeftRightIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NotificationBell = ({ currentUser }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByType, setUnreadByType] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const channelRef = useRef(null);
  
  // Icons mapping for each notification type
  const typeIcons = {
    profile: UserIcon,
    connections: UserGroupIcon,
    messaging: EnvelopeIcon,
    events: CalendarIcon,
    jobs: BriefcaseIcon,
    chat: ChatBubbleLeftRightIcon,
    default: BellIcon
  };

  // Fetch unread notification count
  useEffect(() => {
    if (!currentUser) return;

    const fetchUnreadCount = async () => {
      try {
        // Get total count
        const { data: totalCount, error } = await supabase
          .rpc('get_unread_notifications_count');
        
        if (error) throw error;
        setUnreadCount(totalCount || 0);
        
        // Get count by type
        try {
          const { data: typeCount, error: typeError } = await supabase
            .rpc('get_unread_notifications_count_by_type');
            
          if (typeError) throw typeError;
          
          // Convert array to object for easier access
          const countByType = {};
          (typeCount || []).forEach(item => {
            countByType[item.notification_type] = item.count;
          });
          
          setUnreadByType(countByType);
        } catch (typeErr) {
          console.error('Error fetching notification count by type:', typeErr);
          // Fallback: Use total count as default type
          setUnreadByType({
            'default': totalCount || 0
          });
        }
      } catch (err) {
        console.error('Error fetching notification count:', err);
      }
    };

    fetchUnreadCount();

    // Set up realtime subscription for new notifications
    const setupRealtimeSubscription = async () => {
      try {
        // First check if we have an auth session before attempting realtime connection
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          console.log('No auth session found, delaying notifications subscription');
          return;
        }

        // Clean up any existing subscription first
        if (channelRef.current) {
          try {
            await supabase.removeChannel(channelRef.current);
            console.log('Removed existing notifications channel');
          } catch (error) {
            console.error('Error removing existing channel:', error);
          }
          // Reset the ref to ensure we don't try to use it again
          channelRef.current = null;
        }

        // Create a unique channel name with userId to avoid conflicts
        const channelName = `notifications:${currentUser.id}`;
        console.log(`Setting up notifications channel: ${channelName}`);
        
        // Create and subscribe to the channel
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'notifications' }, 
            (payload) => {
              if (payload.new && payload.new.profile_id === currentUser.id) {
                // Update count and show toast
                setUnreadCount(prev => prev + 1);
                
                // Update type-specific count
                setUnreadByType(prev => {
                  const type = payload.new.type || 'default';
                  return {
                    ...prev,
                    [type]: (prev[type] || 0) + 1
                  };
                });
                
                toast.success(payload.new.title, {
                  duration: 4000,
                  position: 'top-right',
                });
                // Refresh notifications list if dropdown is open
                if (showDropdown) {
                  fetchNotifications();
                }
              }
            }
          );

        // Only after the channel is created, save it to the ref and subscribe
        channelRef.current = channel;
        const status = await channel.subscribe();
        console.log(`Notification channel subscription status: ${status}`);
      } catch (error) {
        console.error('Error setting up notification subscription:', error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      // Clean up subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUser]);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications when dropdown is opened
  const fetchNotifications = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    const newState = !showDropdown;
    setShowDropdown(newState);
    if (newState) {
      fetchNotifications();
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('profile_id', currentUser.id)
        .eq('is_read', false);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark notifications as read');
    }
  };

  const formatNotificationDate = (date) => {
    try {
      const today = new Date().toDateString();
      const notifDate = new Date(date).toDateString();
      
      if (today === notifDate) {
        return formatDistanceToNow(new Date(date), { addSuffix: true });
      } else {
        return format(new Date(date), 'MMM dd, yyyy');
      }
    } catch (err) {
      console.error('Date formatting error:', err);
      return 'Unknown date';
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if it's not already
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setShowDropdown(false);
  };

  // Helper function to get icon for notification type
  const getIconForType = (type) => {
    const IconComponent = typeIcons[type] || typeIcons.default;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center">
        {/* Main notification button with bell icon */}
        <button
          onClick={toggleDropdown}
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
          aria-label="Notifications"
        >
          <BellIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-96 overflow-auto">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-ocean-600 hover:text-ocean-800"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-72">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-ocean-500 mx-auto"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div>
                {notifications.map((notification) => (
                  <Link 
                    key={notification.id} 
                    to={notification.link || '#'} 
                    className="block"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`p-3 border-b hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-gray-800">{notification.title}</p>
                        <span className="text-xs text-gray-500">
                          {formatNotificationDate(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications found
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <Link 
              to="/notifications" 
              className="block w-full text-center text-sm text-ocean-600 hover:text-ocean-800 py-1"
              onClick={() => setShowDropdown(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
