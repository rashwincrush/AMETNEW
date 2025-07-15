import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const MentorProfile = () => {
  const { id: mentorId } = useParams();
  const { user } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);

  const handleRequestSubmit = async () => {
    if (!requestMessage.trim()) {
      toast.error('Please enter a message for the mentor.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('mentorship_requests')
        .insert({
          mentor_id: mentorId,
          mentee_id: user.id,
          request_message: requestMessage,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setExistingRequest(data);
      setShowRequestModal(false);
      setRequestMessage('');
      toast.success('Mentorship request sent successfully!');
    } catch (error) {
      toast.error(`Failed to send request: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchMentorAndRequestStatus = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // Fetch mentor profile
        const { data: mentorData, error: mentorError } = await supabase
          .from('mentors')
          .select(`*, profile:user_id (full_name, avatar_url)`)
          .eq('user_id', mentorId)
          .single();

        if (mentorError) throw mentorError;
        if (mentorData) setMentor(mentorData);
        else toast.error('Mentor not found.');

        // Check for an existing mentorship request
        const { data: requestData, error: requestError } = await supabase
          .from('mentorship_requests')
          .select('*')
          .eq('mentor_id', mentorId)
          .eq('mentee_id', user.id)
          .in('status', ['pending', 'accepted'])
          .maybeSingle();

        if (requestError) throw requestError;
        if (requestData) setExistingRequest(requestData);

      } catch (error) {
        toast.error('Failed to fetch mentor details: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMentorAndRequestStatus();
  }, [mentorId, user]);

  if (loading) {
    return <div className="text-center p-8">Loading mentor profile...</div>;
  }

  if (!mentor) {
    return <div className="text-center p-8">Mentor not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-6">
          <img 
            src={mentor.profile?.avatar_url || '/default-avatar.png'} 
            alt={mentor.profile?.full_name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{mentor.profile?.full_name}</h1>
            <p className="text-xl text-gray-600">Maritime Professional</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">About Me</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{mentor.mentoring_statement}</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.expertise?.map((skill, index) => (
                <span key={index} className="bg-ocean-100 text-ocean-800 px-3 py-1 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Mentorship Details</h3>
            <ul className="space-y-3 text-gray-700">
              <li><strong>Experience:</strong> {mentor.mentoring_experience_years} years</li>
              <li><strong>Max Mentees:</strong> {mentor.max_mentees}</li>
              <li><strong>Capacity:</strong> {mentor.mentoring_capacity_hours_per_month} hours/month</li>
                            <li>
                <strong>Preferences:</strong>
                {typeof mentor.mentoring_preferences === 'object' && mentor.mentoring_preferences ? (
                  <ul className="list-disc list-inside pl-4 mt-1 text-sm">
                    {Object.entries(mentor.mentoring_preferences).map(([key, value]) => (
                      <li key={key}><span className="capitalize font-medium">{key}:</span> {String(value)}</li>
                    ))}
                  </ul>
                ) : (
                  <span> {String(mentor.mentoring_preferences || 'Not specified')}</span>
                )}
              </li>
            </ul>
            <button 
              className="btn-ocean w-full mt-6 py-2 disabled:opacity-50"
              onClick={() => setShowRequestModal(true)}
              disabled={loading || !!existingRequest || user?.id === mentorId}
            >
              {user?.id === mentorId ? 'This is your profile' : existingRequest ? `Request ${existingRequest.status}` : 'Request Mentorship'}
            </button>
          </div>
        </div>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Send Mentorship Request</h2>
            <p className="mb-4 text-gray-600">Send a message to {mentor.profile?.full_name} to start your mentorship journey.</p>
            <textarea
              className="w-full border rounded-md p-2 h-32"
              placeholder="Write a brief message about your goals and why you'd like to connect..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
            />
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowRequestModal(false)} className="btn-secondary-outline">Cancel</button>
              <button onClick={handleRequestSubmit} className="btn-primary" disabled={isSubmitting || !requestMessage.trim()}>
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorProfile;
