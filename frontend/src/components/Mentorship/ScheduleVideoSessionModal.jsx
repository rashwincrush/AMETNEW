import React, { useState } from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase';
import { generateAllCalendarLinks } from '../../utils/googleCalendarLinkGenerator';
import { generateMentorshipJitsiLink } from '../../utils/jitsiMeetGenerator';

/**
 * Modal component for scheduling a video session
 * Generates a Google Calendar link (no OAuth required) and Jitsi Meet link
 */
export default function ScheduleVideoSessionModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  mentorshipRequestId,
  mentorName,
  menteeName,
  videoMeetingLink,
  initialDate = null,
  initialStartTime = null,
  initialEndTime = null,
}) {
  const [loading, setLoading] = useState(false);
  const [scheduledTime, setScheduledTime] = useState({
    date: initialDate || '',
    startTime: initialStartTime || '',
    endTime: initialEndTime || '',
  });
  const [calendarLinks, setCalendarLinks] = useState(null);
  const [jitsiLink, setJitsiLink] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (!scheduledTime.date || !scheduledTime.startTime || !scheduledTime.endTime) {
        toast.error('Please fill in all fields');
        setLoading(false);
        return;
      }

      // Combine date and time into ISO strings
      const startDateTime = new Date(`${scheduledTime.date}T${scheduledTime.startTime}`);
      const endDateTime = new Date(`${scheduledTime.date}T${scheduledTime.endTime}`);

      if (endDateTime <= startDateTime) {
        toast.error('End time must be after start time');
        setLoading(false);
        return;
      }

      // Generate Jitsi Meet link (if not provided)
      const meetingLink = videoMeetingLink || generateMentorshipJitsiLink(mentorshipRequestId);
      setJitsiLink(meetingLink);

      // Generate all calendar links (Google, Outlook, Apple)
      const links = generateAllCalendarLinks({
        mentorName: mentorName || 'Mentor',
        menteeName: menteeName || 'Mentee',
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        videoMeetingLink: meetingLink,
        timezone: 'Asia/Kolkata',
      });

      setCalendarLinks(links);

      // Update mentorship request with scheduling details
      const { error } = await supabase
        .from('mentorship_requests')
        .update({
          scheduled_start_time: startDateTime.toISOString(),
          scheduled_end_time: endDateTime.toISOString(),
          is_video_session_scheduled: true,
          video_meeting_link: meetingLink,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mentorshipRequestId);

      if (error) {
        throw error;
      }

      toast.success('Video session scheduled! Jitsi Meet link generated.');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to schedule video session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToGoogle = () => {
    if (calendarLinks?.google) {
      window.open(calendarLinks.google, '_blank');
    }
  };

  const handleAddToOutlook = () => {
    if (calendarLinks?.outlook) {
      window.open(calendarLinks.outlook, '_blank');
    }
  };

  const handleAddToApple = () => {
    if (calendarLinks?.apple) {
      window.open(calendarLinks.apple, '_blank');
    }
  };

  const handleDone = () => {
    onClose();
    // Refresh the page to show the updated mentorship request
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">Schedule Video Session</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date Picker */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                Date
              </div>
            </label>
            <input
              type="date"
              id="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={scheduledTime.date}
              onChange={(e) => setScheduledTime({ ...scheduledTime, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-slate-500" />
                Start Time
              </div>
            </label>
            <input
              type="time"
              id="startTime"
              required
              value={scheduledTime.startTime}
              onChange={(e) => setScheduledTime({ ...scheduledTime, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* End Time */}
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-2">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-slate-500" />
                End Time
              </div>
            </label>
            <input
              type="time"
              id="endTime"
              required
              value={scheduledTime.endTime}
              onChange={(e) => setScheduledTime({ ...scheduledTime, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> This will generate a Jitsi Meet link (free, unlimited duration) and calendar links for Google, Outlook, and Apple Calendar.
            </p>
          </div>

          {/* Actions */}
          {!calendarLinks ? (
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {loading ? 'Scheduling...' : 'Schedule Session'}
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-4">
              {/* Jitsi Meet Link */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 mb-2">Jitsi Meet Link:</p>
                <a
                  href={jitsiLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 hover:text-green-800 break-all"
                >
                  {jitsiLink}
                </a>
              </div>
              
              {/* Calendar Links */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-3">Add to Calendar:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleAddToGoogle}
                    className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="Google Calendar"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.5 3h-15A2.5 2.5 0 0 0 2 5.5v15A2.5 2.5 0 0 0 4.5 23h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 19.5 3z"/>
                    </svg>
                    Google
                  </button>
                  <button
                    onClick={handleAddToOutlook}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="Outlook Calendar"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21.17 3.25Q21.5 3.25 21.76 3.5 22 3.74 22 4.08V19.92Q22 20.26 21.76 20.5 21.5 20.75 21.17 20.75H7.83Q7.5 20.75 7.24 20.5 7 20.26 7 19.92V17H2.83Q2.5 17 2.24 16.76 2 16.5 2 16.17V7.83Q2 7.5 2.24 7.24 2.5 7 2.83 7H7V4.08Q7 3.74 7.24 3.5 7.5 3.25 7.83 3.25M7 13.06L8.18 15.28H9.97L8 12.06L9.93 8.89H8.22L7.13 10.9L7.09 10.96L7.06 11.03Q6.8 10.5 6.5 9.96 6.25 9.43 5.97 8.89H4.16L6.05 12.08L4 15.28H5.78M13.88 19.5V17H8.25V19.5M13.88 15.75V12.63H12V15.75M13.88 11.38V8.25H12V11.38M13.88 7V4.5H8.25V7M20.75 19.5V17H15.13V19.5M20.75 15.75V12.63H15.13V15.75M20.75 11.38V8.25H15.13V11.38M20.75 7V4.5H15.13V7Z"/>
                    </svg>
                    Outlook
                  </button>
                  <button
                    onClick={handleAddToApple}
                    className="px-3 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="Apple Calendar"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 2h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2zm-4-8h2v2H8V5zm0 4h2v2H8V9zm0 4h2v2H8v-2zM5 15h2v2H5v-2zm0-4h2v2H5V9zm0-4h2v2H5V5zm12 10h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2z"/>
                    </svg>
                    Apple
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDone}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
