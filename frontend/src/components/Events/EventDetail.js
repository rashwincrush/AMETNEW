import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz';
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');

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
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', user.id);

      if (rsvpError) {
        console.error('Error fetching user RSVP:', rsvpError);
        setUserRsvp(null);
      } else {
        setUserRsvp(rsvpData.length > 0 ? rsvpData[0] : null);
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile && ['admin', 'super_admin'].includes(profile.role)) {
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
        p_attendance_status_text: attendance_status 
      });

      if (error) throw error;

      setRsvpSuccess(`Successfully RSVP'd as ${attendance_status}!`);
      setShowFeedback(true);
      setFeedbackSubmitted(false);
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
    if (!startDate || !endDate) return { text: 'Date TBD', color: 'bg-gray-400' };
    const now = new Date();
    if (isPast(parseISO(endDate))) return { text: 'Past', color: 'bg-red-500' };
    if (isFuture(parseISO(startDate))) return { text: 'Upcoming', color: 'bg-blue-500' };
    return { text: 'Ongoing', color: 'bg-green-500' };
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (feedbackRating === 0) {
      setError('Please provide a rating.');
      return;
    }
    setRsvpLoading(true);
    try {
      const { error } = await supabase.from('event_feedback').insert([
        {
          event_id: id,
          user_id: currentUserId,
          rsvp_status: userRsvp?.attendance_status || 'unknown',
          rating: feedbackRating,
          comment: feedbackComment,
        },
      ]);
      if (error) throw error;
      setFeedbackSubmitted(true);
      setShowFeedback(false);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit your feedback.');
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading && !event) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-center p-4 text-red-500 bg-red-100 rounded-md">Error: {error}</div>;
  if (!event) return <div className="text-center p-4">Event not found.</div>;

  const eventStatus = getEventStatus(event.start_date, event.end_date);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-6">
        <Link to="/events" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Events
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {event.featured_image_url && <img src={event.featured_image_url} alt={event.title} className="w-full h-48 md:h-64 object-cover" />}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 sm:mb-0">{event.title}</h1>
                <p className="text-lg text-gray-500 mt-1">{event.short_description}</p>
                {event.organizer_name && <p className="text-md text-gray-600 mt-2">by {event.organizer_name}</p>}
              </div>
              <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${eventStatus.color} flex-shrink-0 mt-2 sm:mt-0`}>
                {eventStatus.text}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Event Info */}
              <div className="md:col-span-2 space-y-4">
                <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                <div className="flex items-center text-gray-600 mb-2">
                  <Calendar className="w-5 h-5 mr-3 text-blue-500"/>
                  <span>
                    {event.start_date ? 
                      (() => {
                        // Convert UTC date from Supabase to IST for display
                        const istZone = 'Asia/Kolkata';
                        const startDateIST = utcToZonedTime(parseISO(event.start_date), istZone);
                        return format(startDateIST, 'EEEE, MMMM d, yyyy');
                      })() : 'Date not available'
                    }
                  </span>
                </div>
                <div className="flex items-center text-gray-600 mb-2">
                  <Clock className="w-5 h-5 mr-3 text-blue-500"/>
                  <span>
                    {event.start_date ? 
                      (() => {
                        const istZone = 'Asia/Kolkata';
                        const startDateIST = utcToZonedTime(parseISO(event.start_date), istZone);
                        return format(startDateIST, 'h:mm a');
                      })() : 'Time not available'
                    }
                    {event.end_date && 
                      (() => {
                        const istZone = 'Asia/Kolkata';
                        const endDateIST = utcToZonedTime(parseISO(event.end_date), istZone);
                        return ` - ${format(endDateIST, 'h:mm a')}`;
                      })()
                    }
                  </span>
                </div>

                {event.is_virtual ? (
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-5 h-5 mr-3 text-green-500"/>
                    <a href={event.virtual_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Join Virtual Event</a>
                  </div>
                ) : (
                  <>
                    {event.venue_name && <div className="flex items-center text-gray-600 mb-1"><MapPin className="w-5 h-5 mr-3 text-red-500"/><span>{event.venue_name}</span></div>}
                    {event.address && <div className="flex items-center text-gray-600 mb-2 pl-8"><span>{event.address}</span></div>}
                  </>
                )}

                {event.category && <div className="flex items-center text-gray-600 mb-2"><BarChart2 className="w-5 h-5 mr-3 text-purple-500"/><span>Category: {event.category}</span></div>}

                {event.tags && event.tags.length > 0 && (
                  <div className="flex items-center text-gray-600 flex-wrap">
                    <Tag className="w-5 h-5 mr-3 text-gray-500"/>
                    {event.tags.map(tag => (
                      <Link 
                        to={`/events?tag=${encodeURIComponent(tag)}`} 
                        key={tag} 
                        className="bg-gray-200 text-gray-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full hover:bg-blue-100 hover:text-blue-800 cursor-pointer transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* RSVP & Admin */}
              <div className="md:col-span-1 space-y-4">
                {(event.organizer_email || event.organizer_phone) && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-bold text-lg mb-3">Contact Organizer</h3>
                    {event.organizer_email && <p className="text-sm text-gray-600 break-all"><strong>Email:</strong> {event.organizer_email}</p>}
                    {event.organizer_phone && <p className="text-sm text-gray-600 mt-1"><strong>Phone:</strong> {event.organizer_phone}</p>}
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="font-bold text-lg mb-3 text-center">RSVP Here</h3>
                  {error && <div className="text-center p-2 mb-3 bg-red-100 text-red-700 rounded">{error}</div>}
                  {rsvpSuccess && <div className="text-center p-2 mb-3 bg-green-100 text-green-700 rounded">{rsvpSuccess}</div>}
                  {userRsvp?.attendance_status === 'going' ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center text-green-600 font-semibold mb-2"><CheckCircle className="w-5 h-5 mr-2"/> You are going!</div>
                      <button onClick={() => handleRsvp('not_going')} disabled={rsvpLoading} className="text-sm text-red-500 hover:underline">Cancel RSVP</button>
                    </div>
                  ) : (
                    <button onClick={() => handleRsvp('going')} disabled={rsvpLoading || (event.end_time && isPast(parseISO(event.end_time)))} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 transition duration-200">
                      {rsvpLoading ? 'Processing...' : 'Attend Event'}
                    </button>
                  )}
                  {showFeedback && !feedbackSubmitted && (
                    <form onSubmit={handleFeedbackSubmit} className="mt-4 pt-4 border-t">
                      <h4 className="font-bold text-md mb-2 text-center">How was your experience?</h4>
                      <div className="flex justify-center items-center mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFeedbackRating(star)}
                            className={`text-2xl ${feedbackRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Any additional comments?"
                        className="w-full p-2 border rounded mb-3"
                        rows="3"
                      ></textarea>
                      <button type="submit" disabled={rsvpLoading} className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400 transition duration-200">
                        {rsvpLoading ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </form>
                  )}
                  {feedbackSubmitted && (
                    <div className="text-center mt-4 pt-4 border-t text-green-600 font-semibold">
                      Thank you for your feedback!
                    </div>
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
