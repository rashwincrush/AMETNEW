import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, onPostgresChangesOnce, getOrCreateChannel } from '../../utils/supabase';
import { NOTIF_ID_FIELD, notifScopeFilter } from '../../utils/notifications';
import toast from 'react-hot-toast';
import { 
  AcademicCapIcon, 
  UserIcon, 
  UserGroupIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  BriefcaseIcon, 
  ChatBubbleLeftRightIcon,
  BellIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';

const Notifications = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const currentUser = profile || user;
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'read'
  const [activeTypeFilter, setActiveTypeFilter] = useState('all'); // Filter by notification type
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [showTypeFilters, setShowTypeFilters] = useState(false);
  // Track component mount state
  const isMountedRef = useRef(true);

  const notificationTypes = {
    all: { name: 'All Types', icon: BellIcon, color: 'bg-gray-500' },
    profile: { name: 'Profile', icon: UserIcon, color: 'bg-purple-500' },
    connections: { name: 'Connections', icon: UserGroupIcon, color: 'bg-blue-500' },
    messaging: { name: 'Messages', icon: EnvelopeIcon, color: 'bg-green-500' },
    events: { name: 'Events', icon: CalendarIcon, color: 'bg-yellow-500' },
    jobs: { name: 'Jobs', icon: BriefcaseIcon, color: 'bg-red-500' },
    chat: { name: 'Chats', icon: ChatBubbleLeftRightIcon, color: 'bg-pink-500' },
    mentorship: { name: 'Mentorship', icon: AcademicCapIcon, color: 'bg-indigo-500' }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .or(notifScopeFilter(currentUser.id))
        .order('created_at', { ascending: false });
      
      if (activeTab === 'unread') {
        query = query.eq('is_read', false);
      } else if (activeTab === 'read') {
        query = query.eq('is_read', true);
      }

      if (activeTypeFilter !== 'all') {
        query = query.eq('type', activeTypeFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      setNotifications(data || []);
    } catch (error) {
      toast.error('Failed to fetch notifications.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionRequests = async () => {
    if (!currentUser) return;
    setRequestsLoading(true);
    try {
      // Fetch incoming requests
      const { data: incoming, error: incomingError } = await supabase
        .from('connections')
        .select(`
          id,
          requester_id,
          recipient_id,
          status,
          created_at,
          updated_at,
          requester:requester_id (id, full_name, avatar_url, job_title, company)
        `)
        .eq('recipient_id', currentUser.id)
        .eq('status', 'pending');
      if (incomingError) throw incomingError;
      setIncomingRequests(incoming || []);

      // Fetch outgoing requests
      const { data: outgoing, error: outgoingError } = await supabase
        .from('connections')
        .select(`
          id,
          requester_id,
          recipient_id,
          status,
          created_at,
          updated_at,
          recipient:recipient_id (id, full_name, avatar_url, job_title, company)
        `)
        .eq('requester_id', currentUser.id)
        .eq('status', 'pending');
      if (outgoingError) throw outgoingError;
      setOutgoingRequests(outgoing || []);

    } catch (error) {
      console.error('Error fetching connection requests:', error);
      toast.error('Could not fetch connection requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      fetchConnectionRequests();
    }
  }, [currentUser, activeTab, activeTypeFilter]);

  // Handle notification events
  const handleNotificationUpdate = useCallback((payload) => {
    if (!isMountedRef.current) return;
    console.log('Realtime notification update:', payload);
    toast('You have a new notification!');
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle connection events
  const handleConnectionUpdate = useCallback((payload) => {
    if (!isMountedRef.current) return;
    console.log('Realtime connection request update:', payload);
    fetchConnectionRequests();
  }, [fetchConnectionRequests]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!currentUser) return;

    isMountedRef.current = true;

    const notificationFilter = { 
      event: '*', 
      schema: 'public', 
      table: 'notifications', 
      filter: `${NOTIF_ID_FIELD}=eq.${currentUser.id}` 
    };
    onPostgresChangesOnce(
      `notifications:${currentUser.id}`,
      'notifications-listener',
      notificationFilter,
      handleNotificationUpdate
    );

    const connectionFilter = { 
      event: '*', 
      schema: 'public', 
      table: 'connections'
    };
    onPostgresChangesOnce(
      'connections-global',
      'connections-listener',
      connectionFilter,
      handleConnectionUpdate
    );

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      // The new channel management in utils/supabase handles cleanup via reference counting,
      // so explicit unsubscription is no longer needed here.
    };
  }, [currentUser, handleNotificationUpdate, handleConnectionUpdate]);

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      // refresh unread counts by type (optional usage in UI)
      try { await supabase.rpc('get_unread_notifications_count_by_type'); }
      catch (e) { console.debug('Unread count refresh failed (non-fatal).'); }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to update notification.');
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq(NOTIF_ID_FIELD, currentUser.id)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
      try { await supabase.rpc('get_unread_notifications_count_by_type'); }
      catch (e) { console.debug('Unread count refresh failed (non-fatal).'); }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleConnectionResponse = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) {
        console.error('Error responding to connection request:', error);
        throw error;
      }
      toast.success(`Request ${newStatus === 'accepted' ? 'accepted' : 'declined'}.`);
      
      fetchConnectionRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Failed to update connection.');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this connection request?')) return;

    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Error cancelling connection request:', error);
        throw error;
      }
      toast.success('Request cancelled.');
      
      fetchConnectionRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request.');
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Unknown date';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      
      {/* Connection Requests Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Connection Requests</h2>
        
        {requestsLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ocean-500 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {incomingRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Incoming Requests</h3>
                <div className="bg-white rounded-lg shadow divide-y">
                  {incomingRequests.map(req => (
                    <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center mb-3 md:mb-0">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full overflow-hidden">
                            <Avatar src={req.requester.avatar_url} alt={req.requester.full_name} size={48} />
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link to={`/profile/${req.requester.id}`} className="text-lg font-medium text-gray-900 hover:text-ocean-600">
                            {req.requester.full_name}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {req.requester.job_title} {req.requester.company ? `at ${req.requester.company}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3 md:mt-0">
                        <button onClick={() => handleConnectionResponse(req.id, 'accepted')} className="px-4 py-2 bg-ocean-500 text-white rounded hover:bg-ocean-600 text-sm font-medium">Accept</button>
                        <button onClick={() => handleConnectionResponse(req.id, 'declined')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {outgoingRequests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Sent Requests</h3>
                <div className="bg-white rounded-lg shadow divide-y">
                  {outgoingRequests.map(req => (
                    <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center mb-3 md:mb-0">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full overflow-hidden">
                            <Avatar src={req.recipient.avatar_url} alt={req.recipient.full_name} size={48} />
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link to={`/profile/${req.recipient.id}`} className="text-lg font-medium text-gray-900 hover:text-ocean-600">
                            {req.recipient.full_name}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {req.recipient.job_title} {req.recipient.company ? `at ${req.recipient.company}` : ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Sent {formatDate(req.created_at)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCancelRequest(req.id)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
                      >
                        Cancel Request
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(incomingRequests.length === 0 && outgoingRequests.length === 0) && (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">No pending connection requests</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Notifications Section */}
      <div className="mt-10">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold">All Notifications</h2>
          <button 
            onClick={markAllAsRead} 
            className="text-sm text-ocean-600 hover:text-ocean-800 order-last md:order-none"
          >
            Mark all as read
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Tabs and Filters */}
          <div className="flex flex-wrap items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-2">
              <button onClick={() => setActiveTab('all')} className={`px-3 py-1.5 text-sm rounded-md ${activeTab === 'all' ? 'bg-ocean-500 text-white' : 'bg-white hover:bg-gray-100'}`}>All</button>
              <button onClick={() => setActiveTab('unread')} className={`px-3 py-1.5 text-sm rounded-md ${activeTab === 'unread' ? 'bg-ocean-500 text-white' : 'bg-white hover:bg-gray-100'}`}>Unread</button>
              <button onClick={() => setActiveTab('read')} className={`px-3 py-1.5 text-sm rounded-md ${activeTab === 'read' ? 'bg-ocean-500 text-white' : 'bg-white hover:bg-gray-100'}`}>Read</button>
            </div>
            <div className="relative">
              <button onClick={() => setShowTypeFilters(!showTypeFilters)} className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-white hover:bg-gray-100 border">
                <FunnelIcon className="h-4 w-4 mr-2" />
                {notificationTypes[activeTypeFilter]?.name || 'Filter'}
              </button>
              {showTypeFilters && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1">
                    {Object.entries(notificationTypes).map(([type, { name, icon: Icon, color }]) => (
                      <a href="#" key={type} onClick={(e) => { e.preventDefault(); setActiveTypeFilter(type); setShowTypeFilters(false); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <span className={`p-1 rounded-full text-white mr-3 ${color}`}><Icon className="h-4 w-4" /></span>
                        {name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Notification List */}
          {loading ? (
            <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ocean-500 mx-auto"></div><p className="mt-2 text-gray-500">Loading...</p></div>
          ) : notifications.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {notifications.map(notification => {
                const typeInfo = notificationTypes[notification.type] || { icon: BellIcon, name: 'General', color: 'bg-gray-400' };
                const Icon = typeInfo.icon;
                return (
                  <li key={notification.id} onClick={() => !notification.is_read && markAsRead(notification.id)} className={`p-4 flex items-start space-x-4 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-ocean-50' : ''}`}>
                    <div className={`p-2 rounded-full text-white ${typeInfo.color}`}><Icon className="h-5 w-5" /></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <span className="text-xs text-gray-500">{format(new Date(notification.created_at), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color} bg-opacity-20 text-opacity-90`}>{typeInfo.name}</span>
                        {!notification.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" title="Unread"></span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-12">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
