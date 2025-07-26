import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import {
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const SessionsCalendar = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past', 'all'
  const { user } = useAuth();
  const sessionListener = useRef(null);
  
  useEffect(() => {
    if (user) {
      fetchSessions();
      setupRealtimeSubscription();
    }
    
    return () => {
      if (sessionListener.current) {
        sessionListener.current.unsubscribe();
      }
    };
  }, [user, activeTab]);
  
  const setupRealtimeSubscription = () => {
    if (sessionListener.current) {
      sessionListener.current.unsubscribe();
    }
    
    // Subscribe to changes in the mentorship_sessions table
    sessionListener.current = supabase
      .channel('mentorship_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentorship_sessions'
        },
        (payload) => {
          fetchSessions(); // Refresh sessions when there are changes
        }
      )
      .subscribe();
  };
  
  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('mentorship_sessions')
        .select(`
          *,
          mentorship_request:mentorship_request_id (
            id,
            mentor_id,
            mentee_id,
            mentor:mentor_id (
              id,
              user_id,
              mentor_profile:user_id (full_name, avatar_url)
            ),
            mentee:mentee_id (
              id,
              user_id, 
              mentee_profile:user_id (full_name, avatar_url)
            )
          )
        `)
        .order('scheduled_time', { ascending: true });
      
      // Filter based on the active tab
      const now = new Date().toISOString();
      if (activeTab === 'upcoming') {
        query = query.gte('scheduled_time', now);
      } else if (activeTab === 'past') {
        query = query.lt('scheduled_time', now);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching mentorship sessions:', error);
      toast.error('Failed to load mentorship sessions');
    } finally {
      setLoading(false);
    }
  };
  
  const updateSessionStatus = async (sessionId, newStatus) => {
    try {
      const { error } = await supabase
        .from('mentorship_sessions')
        .update({ status: newStatus })
        .eq('id', sessionId);
        
      if (error) throw error;
      
      // Update local state
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === sessionId ? { ...session, status: newStatus } : session
        )
      );
      
      toast.success(`Session marked as ${newStatus}`);
    } catch (error) {
      console.error(`Error updating session to ${newStatus}:`, error);
      toast.error('Failed to update session status');
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getSessionTypeIcon = (meetingType) => {
    switch (meetingType) {
      case 'video':
        return <VideoCameraIcon className="w-5 h-5 text-blue-600" />;
      case 'in-person':
        return <MapPinIcon className="w-5 h-5 text-green-600" />;
      case 'phone':
        return <ClockIcon className="w-5 h-5 text-orange-600" />;
      case 'chat':
        return <DocumentTextIcon className="w-5 h-5 text-purple-600" />;
      default:
        return <CalendarIcon className="w-5 h-5 text-gray-600" />;
    }
  };
  
  const isPastSession = (scheduledTime) => {
    return new Date(scheduledTime) < new Date();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mentorship Sessions</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'past'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={fetchSessions}
            className="px-3 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-md"
            title="Refresh sessions"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-10">
          <CalendarIcon className="w-16 h-16 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">
            {activeTab === 'upcoming'
              ? 'No upcoming mentorship sessions scheduled.'
              : activeTab === 'past'
              ? 'No past mentorship sessions found.'
              : 'No mentorship sessions found.'}
          </p>
          <p className="mt-1 text-gray-500">
            Use the scheduler to book new mentorship sessions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const mentorProfile = session.mentorship_request?.mentor?.mentor_profile;
            const menteeProfile = session.mentorship_request?.mentee?.mentee_profile;
            const isPast = isPastSession(session.scheduled_time);
            
            return (
              <div 
                key={session.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex items-center mb-2 md:mb-0">
                    {getSessionTypeIcon(session.meeting_type)}
                    <span className="ml-2 font-medium text-lg">
                      {session.meeting_type === 'video' ? 'Video Call' :
                       session.meeting_type === 'in-person' ? 'In-Person Meeting' :
                       session.meeting_type === 'phone' ? 'Phone Call' : 'Chat Session'}
                    </span>
                    <span className={`ml-3 text-xs font-semibold px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(session.status)}`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 text-gray-500 mr-1" />
                    <span className="font-medium">
                      {formatDate(session.scheduled_time)}
                    </span>
                    <span className="mx-2 text-gray-500">•</span>
                    <ClockIcon className="w-5 h-5 text-gray-500 mr-1" />
                    <span>
                      {formatTime(session.scheduled_time)} ({session.duration_minutes} min)
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Mentor</p>
                    <div className="flex items-center">
                      {mentorProfile?.avatar_url && (
                        <img
                          src={mentorProfile.avatar_url}
                          alt={mentorProfile.full_name}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      )}
                      <span>{mentorProfile?.full_name || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Mentee</p>
                    <div className="flex items-center">
                      {menteeProfile?.avatar_url && (
                        <img
                          src={menteeProfile.avatar_url}
                          alt={menteeProfile.full_name}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      )}
                      <span>{menteeProfile?.full_name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Meeting details */}
                <div className="mt-4 border-t pt-3">
                  {session.meeting_type === 'video' && session.meeting_url && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">Meeting Link</p>
                      <a
                        href={session.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {session.meeting_url}
                      </a>
                    </div>
                  )}
                  
                  {session.meeting_type === 'in-person' && session.location && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">Location</p>
                      <p>{session.location}</p>
                    </div>
                  )}
                  
                  {session.meeting_notes && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">Notes</p>
                      <p className="text-sm">{session.meeting_notes}</p>
                    </div>
                  )}
                </div>
                
                {/* Action buttons - only show for upcoming and scheduled sessions */}
                {!isPast && session.status === 'scheduled' && (
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => updateSessionStatus(session.id, 'completed')}
                      className="flex items-center bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md text-sm"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Mark Complete
                    </button>
                    <button
                      onClick={() => updateSessionStatus(session.id, 'canceled')}
                      className="flex items-center bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-md text-sm"
                    >
                      <XCircleIcon className="w-4 h-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SessionsCalendar;
