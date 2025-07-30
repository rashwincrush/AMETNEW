import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const NotificationsPage = ({ currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'read'
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    fetchNotifications();
    fetchConnectionRequests();

    // Set up realtime subscription for new notifications
    const setupRealtimeSubscription = () => {
      // Clean up any existing subscription first
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      channelRef.current = supabase
        .channel('notifications_page')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications' }, 
          () => {
            // Refresh notifications on any changes
            fetchNotifications();
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'connections' },
          () => {
            // Refresh connection requests on any changes
            fetchConnectionRequests();
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      // Clean up subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      // Filter based on active tab
      if (activeTab === 'unread') {
        query = query.eq('is_read', false);
      } else if (activeTab === 'read') {
        query = query.eq('is_read', true);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      toast.error('Failed to load notifications');
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
          status,
          created_at,
          requester:requester_id(id, full_name, avatar_url, job_title, company)
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
          status,
          created_at,
          recipient:recipient_id(id, full_name, avatar_url, job_title, company)
        `)
        .eq('requester_id', currentUser.id)
        .eq('status', 'pending');

      if (outgoingError) throw outgoingError;
      setOutgoingRequests(outgoing || []);

    } catch (error) {
      console.error('Error fetching connection requests:', error);
      toast.error('Failed to load connection requests.');
    } finally {
      setRequestsLoading(false);
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
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
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
      toast.success('All notifications marked as read');
      fetchNotifications();
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

      if (error) throw error;
      toast.success(`Request ${newStatus === 'accepted' ? 'accepted' : 'declined'}.`);
      
      // Refresh connection requests
      fetchConnectionRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Failed to update connection.');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this connection request?')) return;

    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      toast.success('Request cancelled.');
      
      // Refresh connection requests
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
      return 'Unknown date';
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // We need to refetch with the new filter
    setLoading(true);
    setTimeout(() => {
      fetchNotifications();
    }, 100);
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
            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Incoming Requests</h3>
                <div className="bg-white rounded-lg shadow divide-y">
                  {incomingRequests.map(req => (
                    <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center mb-3 md:mb-0">
                        <div className="flex-shrink-0">
                          <img 
                            src={req.requester.avatar_url || `https://ui-avatars.com/api/?name=${req.requester.full_name}&background=random`} 
                            alt={req.requester.full_name} 
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <Link to={`/profile/${req.requester.id}`} className="text-lg font-medium text-gray-900 hover:text-ocean-600">
                            {req.requester.full_name}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {req.requester.job_title} {req.requester.company ? `at ${req.requester.company}` : ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Requested {formatDate(req.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleConnectionResponse(req.id, 'accepted')}
                          className="px-4 py-2 bg-ocean-500 text-white rounded hover:bg-ocean-600 text-sm font-medium"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleConnectionResponse(req.id, 'declined')}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Sent Requests</h3>
                <div className="bg-white rounded-lg shadow divide-y">
                  {outgoingRequests.map(req => (
                    <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center mb-3 md:mb-0">
                        <div className="flex-shrink-0">
                          <img 
                            src={req.recipient.avatar_url || `https://ui-avatars.com/api/?name=${req.recipient.full_name}&background=random`} 
                            alt={req.recipient.full_name} 
                            className="h-12 w-12 rounded-full object-cover"
                          />
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
            
            {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">No pending connection requests</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Notifications Section */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Notifications</h2>
          <button 
            onClick={markAllAsRead} 
            className="text-sm text-ocean-600 hover:text-ocean-800"
          >
            Mark all as read
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button 
              onClick={() => handleTabChange('all')}
              className={`flex-1 py-3 px-4 text-center ${activeTab === 'all' ? 'bg-gray-100 border-b-2 border-ocean-500 font-medium' : 'hover:bg-gray-50'}`}
            >
              All
            </button>
            <button 
              onClick={() => handleTabChange('unread')}
              className={`flex-1 py-3 px-4 text-center ${activeTab === 'unread' ? 'bg-gray-100 border-b-2 border-ocean-500 font-medium' : 'hover:bg-gray-50'}`}
            >
              Unread
            </button>
            <button 
              onClick={() => handleTabChange('read')}
              className={`flex-1 py-3 px-4 text-center ${activeTab === 'read' ? 'bg-gray-100 border-b-2 border-ocean-500 font-medium' : 'hover:bg-gray-50'}`}
            >
              Read
            </button>
          </div>
          
          {/* Notification List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ocean-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map(notification => (
                <Link 
                  key={notification.id}
                  to={notification.link || '#'}
                  className="block"
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className={`p-4 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                    <div className="flex justify-between">
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <span className="text-sm text-gray-500">{formatDate(notification.created_at)}</span>
                    </div>
                    <p className="mt-1 text-gray-600">{notification.message}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No notifications found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
