import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { format, parseISO, isPast, isFuture } from 'date-fns';

// Helper to check if a string is a valid ISO date
function isValidDateString(dateString) {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return date instanceof Date && !isNaN(date);
}
import { ArrowLeft, Edit, Trash2, Calendar, Clock, MapPin, Tag, Users, CheckCircle, BarChart2 } from 'lucide-react';
import SocialShareButtons from '../common/SocialShareButtons';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [userRsvp, setUserRsvp] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchEventData = useCallback(async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: attendeesData, error: attendeesError } = await supabase
        .from('event_attendees')
        .select('id, attendance_status, profiles:attendee_id(id, full_name, avatar_url, current_position)')
        .eq('event_id', id)
        .eq('attendance_status', 'going');
      if (attendeesError) throw attendeesError;
      setAttendees(attendeesData.filter(a => a.profiles));

    } catch (err) {
      console.error("Error fetching event data:", err);
      setError('Failed to fetch event details.');
    }
  }, [id]);

  const fetchCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data } = await supabase.from('event_attendees').select('*').eq('event_id', id).eq('attendee_id', user.id).single();
      setUserRsvp(data);

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile && profile.role === 'admin') {
        setIsAdmin(true);
      }
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchEventData(), fetchCurrentUser()]).finally(() => setLoading(false));
  }, [id, fetchEventData, fetchCurrentUser]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setLoading(true);
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      setError('Failed to delete event.');
      setLoading(false);
    } else {
      navigate('/events');
    }
  };

  const handleRsvp = async (attendance_status) => {
    if (!currentUserId) return setError('You must be logged in to RSVP.');
    setRsvpLoading(true);
    try {
      const { error } = await supabase.rpc('rsvp_to_event', { 
        p_event_id: id, 
        p_attendee_id: currentUserId, 
        p_attendance_status: attendance_status 
      });

      if (error) throw error;

      setRsvpSuccess(`Successfully RSVP'd as ${attendance_status}!`)
      await Promise.all([fetchEventData(), fetchCurrentUser()]);
      setTimeout(() => setRsvpSuccess(''), 3000);
    } catch (err) {
      console.error('Error during RSVP:', err);
      setError('Failed to process your RSVP.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const getEventStatus = (startDate, endDate) => {
    const now = new Date();
    if (isPast(parseISO(endDate))) return { text: 'Past', color: 'bg-red-500' };
    if (isFuture(parseISO(startDate))) return { text: 'Upcoming', color: 'bg-blue-500' };
    return { text: 'Ongoing', color: 'bg-green-500' };
  };

  if (loading && !event) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-center p-4 text-red-500 bg-red-100 rounded-md">Error: {error}</div>;
  if (!event) return <div className="text-center p-4">Event not found.</div>;

  const eventStatus = getEventStatus(event.start_time, event.end_time);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-6">
        <Link to="/events" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Events
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {event.image_url && <img src={event.image_url} alt={event.name} className="w-full h-48 md:h-64 object-cover" />}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 sm:mb-0">{event.name}</h1>
              <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${eventStatus.color}`}>
                {eventStatus.text}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Event Info */}
              <div className="md:col-span-2 space-y-4">
                <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                <div className="flex items-center"><Calendar className="w-5 h-5 mr-3 text-gray-500"/><span>{isValidDateString(event.start_time) ? format(parseISO(event.start_time), 'EEEE, MMMM d, yyyy') : 'N/A'}</span></div>
                <div className="flex items-center"><Clock className="w-5 h-5 mr-3 text-gray-500"/><span>{isValidDateString(event.start_time) ? format(parseISO(event.start_time), 'h:mm a') : 'N/A'} - {isValidDateString(event.end_time) ? format(parseISO(event.end_time), 'h:mm a') : 'N/A'}</span></div>
                <div className="flex items-center"><MapPin className="w-5 h-5 mr-3 text-gray-500"/><span>{event.location}</span></div>
                <div className="flex items-center"><Tag className="w-5 h-5 mr-3 text-gray-500"/><span>{event.type}</span></div>
              </div>

              {/* RSVP & Admin */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-bold text-lg mb-3 text-center">RSVP Here</h3>
                  {rsvpSuccess && <div className="text-center p-2 mb-3 bg-green-100 text-green-700 rounded">{rsvpSuccess}</div>}
                  {userRsvp?.attendance_status === 'going' ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center text-green-600 font-semibold mb-2"><CheckCircle className="w-5 h-5 mr-2"/> You are going!</div>
                      <button onClick={() => handleRsvp('not_going')} disabled={rsvpLoading} className="text-sm text-red-500 hover:underline">Cancel RSVP</button>
                    </div>
                  ) : (
                    <button onClick={() => handleRsvp('going')} disabled={rsvpLoading || isPast(parseISO(event.end_time))} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 transition duration-200">
                      {rsvpLoading ? 'Processing...' : 'Attend Event'}
                    </button>
                  )}
                </div>

                {isAdmin && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-bold text-lg mb-3 text-center">Admin Actions</h3>
                    <div className="flex flex-col space-y-2">
                      <Link to={`/events/edit/${id}`} className="flex items-center justify-center w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded hover:bg-yellow-600 transition duration-200">
                        <Edit className="w-4 h-4 mr-2"/> Edit
                      </Link>
                      <button onClick={handleDelete} disabled={loading} className="flex items-center justify-center w-full bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 disabled:bg-gray-400 transition duration-200">
                        <Trash2 className="w-4 h-4 mr-2"/> Delete
                      </button>
                      <Link to={`/admin/events/${id}/feedback`} className="flex items-center justify-center w-full bg-indigo-500 text-white font-bold py-2 px-4 rounded hover:bg-indigo-600 transition duration-200">
                        <BarChart2 className="w-4 h-4 mr-2"/> View Feedback
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <SocialShareButtons url={window.location.href} title={event.name} />
            </div>

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><Users className="w-6 h-6 mr-3"/>Attendees ({attendees.length})</h3>
              {attendees.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {attendees.map(attendee => (
                    <Link to={`/profile/${attendee.profiles.id}`} key={attendee.id} className="text-center">
                      <img src={attendee.profiles.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${attendee.profiles.full_name}` } alt={attendee.profiles.full_name} className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"/>
                      <p className="font-semibold text-sm text-gray-700">{attendee.profiles.full_name}</p>
                      <p className="text-xs text-gray-500">{attendee.profiles.current_position}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No attendees yet. Be the first to RSVP!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
