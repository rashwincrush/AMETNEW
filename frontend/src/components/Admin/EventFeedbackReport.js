import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { ArrowLeft, Star } from 'lucide-react';

const EventFeedbackReport = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFeedbackData = useCallback(async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('title')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: feedbackData, error: feedbackError } = await supabase
        .from('event_feedback')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('event_id', id);
      
      if (feedbackError) throw feedbackError;
      setFeedback(feedbackData);

    } catch (err) {
      console.error("Error fetching feedback data:", err);
      setError('Failed to fetch feedback data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFeedbackData();
  }, [fetchFeedbackData]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <Link to={`/events/${id}`} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Event
      </Link>
      <h1 className="text-3xl font-bold mb-2">Feedback for {event?.title}</h1>
      <p className="text-lg text-gray-600 mb-6">A total of {feedback.length} feedback entries received.</p>

      <div className="space-y-4">
        {feedback.length > 0 ? (
          feedback.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center mb-2">
                <img src={item.profiles?.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${item.profiles?.full_name}`} alt={item.profiles?.full_name} className="w-10 h-10 rounded-full mr-3" />
                <span className="font-semibold">{item.profiles?.full_name || 'Anonymous'}</span>
              </div>
              <div className="flex items-center my-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < item.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" />
                ))}
                <span className="ml-2 text-gray-600">({item.rating}/5)</span>
              </div>
              {item.comment && <p className="text-gray-700 mt-2 pl-1">{item.comment}</p>}
              <p className="text-xs text-gray-400 mt-2">RSVP Status: {item.rsvp_status}</p>
            </div>
          ))
        ) : (
          <p>No feedback has been submitted for this event yet.</p>
        )}
      </div>
    </div>
  );
};

export default EventFeedbackReport;
