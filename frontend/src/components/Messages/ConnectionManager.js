import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';
import { UserPlusIcon, ClockIcon } from '@heroicons/react/24/outline';

const ConnectionManager = ({ currentUser }) => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchRequests = async () => {
      setLoading(true);
      try {
        // Fetch incoming requests
        const { data: incoming, error: incomingError } = await supabase
          .from('connections')
          .select(`
            id,
            status,
            requester:requester_id(id, full_name, avatar_url, job_title)
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
            recipient:recipient_id(id, full_name, avatar_url, job_title)
          `)
          .eq('requester_id', currentUser.id)
          .eq('status', 'pending');

        if (outgoingError) throw outgoingError;
        setOutgoingRequests(outgoing || []);

      } catch (error) {
        console.error('Error fetching connection requests:', error);
        toast.error('Failed to load connection requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Set up a real-time listener for changes
    const subscription = supabase
      .channel('public:connections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, payload => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  const handleResponse = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      toast.success(`Request ${newStatus === 'accepted' ? 'accepted' : 'declined'}.`);
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.error('Failed to update connection.');
    }
  };

  const handleCancel = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this connection request?')) return;

    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      toast.success('Request cancelled.');
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request.');
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading requests...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Incoming Requests */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
          <UserPlusIcon className="h-6 w-6 mr-2 text-ocean-500" />
          Incoming Requests ({incomingRequests.length})
        </h3>
        {incomingRequests.length > 0 ? (
          <ul className="space-y-3">
            {incomingRequests.map(req => (
              <li key={req.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img src={req.requester.avatar_url || `https://ui-avatars.com/api/?name=${req.requester.full_name}&background=random`} alt={req.requester.full_name} className="h-10 w-10 rounded-full" />
                  <div>
                    <p className="font-semibold text-gray-800">{req.requester.full_name}</p>
                    <p className="text-sm text-gray-500">{req.requester.job_title || 'No title specified'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleResponse(req.id, 'accepted')} className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600">Accept</button>
                  <button onClick={() => handleResponse(req.id, 'declined')} className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600">Decline</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No new connection requests.</p>
        )}
      </div>

      {/* Outgoing Requests */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
          <ClockIcon className="h-6 w-6 mr-2 text-gray-500" />
          Pending Sent Requests ({outgoingRequests.length})
        </h3>
        {outgoingRequests.length > 0 ? (
          <ul className="space-y-3">
            {outgoingRequests.map(req => (
              <li key={req.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img src={req.recipient.avatar_url || `https://ui-avatars.com/api/?name=${req.recipient.full_name}&background=random`} alt={req.recipient.full_name} className="h-10 w-10 rounded-full" />
                  <div>
                    <p className="font-semibold text-gray-800">{req.recipient.full_name}</p>
                    <p className="text-sm text-gray-500">{req.recipient.job_title || 'No title specified'}</p>
                  </div>
                </div>
                <button onClick={() => handleCancel(req.id)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">Cancel</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">You have no pending sent requests.</p>
        )}
      </div>
    </div>
  );
};

export default ConnectionManager;
