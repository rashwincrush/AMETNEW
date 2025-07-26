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
  XMarkIcon
} from '@heroicons/react/24/outline';

const SessionScheduler = ({ mentorshipRequestId, onSuccess }) => {
  const [formData, setFormData] = useState({
    scheduled_time: '',
    scheduled_date: '',
    duration_minutes: 30,
    meeting_url: '',
    meeting_type: 'video',
    meeting_notes: '',
    location: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [mentorshipRequest, setMentorshipRequest] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  const [isMentor, setIsMentor] = useState(false);
  const sessionListener = useRef(null);

  useEffect(() => {
    if (mentorshipRequestId) {
      fetchMentorshipRequest();
    }
    
    return () => {
      if (sessionListener.current) {
        sessionListener.current.unsubscribe();
      }
    };
  }, [mentorshipRequestId]);

  const fetchMentorshipRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('mentorship_requests')
        .select(`
          *,
          mentor:mentor_id(id, user_id, profiles:user_id(full_name, avatar_url)),
          mentee:mentee_id(id, user_id, profiles:user_id(full_name, avatar_url))
        `)
        .eq('id', mentorshipRequestId)
        .single();
        
      if (error) throw error;
      
      setMentorshipRequest(data);
      // Check if the current user is the mentor for this request
      if (data && user && data.mentor.user_id === user.id) {
        setIsMentor(true);
      }
    } catch (error) {
      console.error('Error fetching mentorship request:', error);
      toast.error('Failed to load mentorship request details');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateTimeChange = () => {
    // Combine date and time into ISO string
    if (formData.scheduled_date && formData.scheduled_time) {
      const dateTimeString = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
      const scheduled_time = new Date(dateTimeString).toISOString();
      
      setFormData(prev => ({
        ...prev,
        scheduled_time
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Combine date and time into ISO string for final submission
      const dateTimeString = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
      const scheduled_time = new Date(dateTimeString).toISOString();
      
      const { data, error } = await supabase
        .from('mentorship_sessions')
        .insert([
          {
            mentorship_request_id: mentorshipRequestId,
            scheduled_time: scheduled_time,
            duration_minutes: parseInt(formData.duration_minutes),
            meeting_url: formData.meeting_url,
            meeting_type: formData.meeting_type,
            meeting_notes: formData.meeting_notes,
            location: formData.location,
            created_by: user.id,
          }
        ]);
        
      if (error) throw error;
      
      toast.success('Mentorship session scheduled successfully!');
      setShowForm(false);
      if (onSuccess) onSuccess();
      
      // Reset form
      setFormData({
        scheduled_time: '',
        scheduled_date: '',
        duration_minutes: 30,
        meeting_url: '',
        meeting_type: 'video',
        meeting_notes: '',
        location: ''
      });
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast.error('Failed to schedule session');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Only render the scheduler if the user is the mentor and the request is approved
  if (!isMentor || !mentorshipRequest || mentorshipRequest.status !== 'approved') {
    // Optionally, return a message or null if the user is not authorized
    return null; 
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Mentorship Session Scheduler</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
        >
          {showForm ? (
            <>
              <XMarkIcon className="w-5 h-5 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <CalendarIcon className="w-5 h-5 mr-2" />
              Schedule Session
            </>
          )}
        </button>
      </div>
      
      {mentorshipRequest && (
        <div className="mb-4 text-gray-700">
          <p>
            <span className="font-semibold">Mentor:</span> {mentorshipRequest.mentor.profiles.full_name}
          </p>
          <p>
            <span className="font-semibold">Mentee:</span> {mentorshipRequest.mentee.profiles.full_name}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{' '}
            <span className={`font-medium ${
              mentorshipRequest.status === 'approved' ? 'text-green-600' : 
              mentorshipRequest.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {mentorshipRequest.status.charAt(0).toUpperCase() + mentorshipRequest.status.slice(1)}
            </span>
          </p>
        </div>
      )}
      
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <CalendarIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  onBlur={handleDateTimeChange}
                  className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleChange}
                  onBlur={handleDateTimeChange}
                  className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <select
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              className="w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes (1 hour)</option>
              <option value="90">90 minutes (1.5 hours)</option>
              <option value="120">120 minutes (2 hours)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Type
            </label>
            <select
              name="meeting_type"
              value={formData.meeting_type}
              onChange={handleChange}
              className="w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
              <option value="in-person">In Person</option>
              <option value="chat">Chat</option>
            </select>
          </div>
          
          {formData.meeting_type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting URL (Zoom, Google Meet, etc.)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <VideoCameraIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="url"
                  name="meeting_url"
                  value={formData.meeting_url}
                  onChange={handleChange}
                  placeholder="https://zoom.us/j/123456789"
                  className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={formData.meeting_type === 'video'}
                />
              </div>
            </div>
          )}
          
          {formData.meeting_type === 'in-person' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MapPinIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Campus Library, 2nd Floor"
                  className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={formData.meeting_type === 'in-person'}
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Notes (optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <DocumentTextIcon className="w-5 h-5 text-gray-400" />
              </div>
              <textarea
                name="meeting_notes"
                value={formData.meeting_notes}
                onChange={handleChange}
                placeholder="Topics to discuss, preparation required, etc."
                className="pl-10 w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="mr-2 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Scheduling...
                </>
              ) : (
                <>Schedule Session</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SessionScheduler;
