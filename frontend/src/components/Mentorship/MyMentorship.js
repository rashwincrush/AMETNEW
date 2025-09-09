import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import MentorRegistrationForm from './MentorRegistrationForm';

export default function MyMentorship() {
  const { user, profile, fetchUserProfile } = useAuth();
  const [mentorRow, setMentorRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMyMentor = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('mentors')
        .select(`*, applicant:profiles!mentors_user_id_fkey(full_name, avatar_url)`) 
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error) setMentorRow(data);
      setLoading(false);
    };
    fetchMyMentor();
  }, [user, fetchUserProfile]);

  // Read initial availability from profiles for the current user
  useEffect(() => {
    const readAvailability = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('is_available_for_mentorship')
        .eq('id', user.id)
        .maybeSingle();
      if (!error && data) {
        setIsAvailable(!!data.is_available_for_mentorship);
      } else if (profile && typeof profile.is_available_for_mentorship === 'boolean') {
        setIsAvailable(!!profile.is_available_for_mentorship);
      }
    };
    readAvailability();
  }, [user, profile]);

  const toggleAvailability = useCallback(async (next) => {
    if (!user) return;
    setIsSaving(true);
    // Optimistic UI update
    setIsAvailable(next);
    try {
      // Update profiles flag directly
      const { error } = await supabase
        .from('profiles')
        .update({ is_available_for_mentorship: next })
        .eq('id', user.id);
      if (error) throw error;
      // Refresh AuthContext state so the value persists across sessions, then toast once
      await fetchUserProfile(user.id);
      toast.success('Availability updated');

    } catch (e) {
      console.error('Failed to update availability', e);
      toast.error('Failed to update availability');
      // Revert optimistic state
      setIsAvailable(!next);
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const profileApproved = !!(profile?.is_approved || profile?.approval_status === 'approved');
  const compositeBadge = () => {
    if (!profileApproved) return null;
    const st = mentorRow?.status;
    if (st === 'approved') return (
      <span className="ml-3 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved + Mentor</span>
    );
    return (
      <span className="ml-3 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Approved + Mentor Pending</span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-800">My Mentorship</h1>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // No mentor profile yet → show registration form
  if (!mentorRow) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">My Mentorship</h1>
          {/* Availability Switch */}
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="toggle-checkbox h-5 w-10"
                checked={isAvailable}
                onChange={(e) => toggleAvailability(e.target.checked)}
                disabled={isSaving}
              />
              <span className="text-sm font-medium">Accepting mentees</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isAvailable
              ? "You’re visible in the Mentor directory and can receive new requests."
              : "You’re hidden from the Mentor directory and cannot receive new requests."}
          </p>
          {compositeBadge()}
          <p className="mt-2 text-gray-600">You haven’t created a mentor profile yet. Fill the form to get started.</p>
        </div>
        <MentorRegistrationForm />
      </div>
    );
  }

  // Pending
  if (mentorRow.status === 'pending') {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-800">My Mentorship</h1>
            {compositeBadge()}
          </div>
          {/* Availability Switch */}
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="toggle-checkbox h-5 w-10"
                checked={isAvailable}
                onChange={(e) => toggleAvailability(e.target.checked)}
                disabled={isSaving}
              />
              <span className="text-sm font-medium">Accepting mentees</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isAvailable
              ? "You’re visible in the Mentor directory and can receive new requests."
              : "You’re hidden from the Mentor directory and cannot receive new requests."}
          </p>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">Pending admin approval</div>
          <p className="mt-3 text-gray-600">Your mentor application has been submitted and is awaiting review.</p>
          <div className="mt-4">
            <Link to="/mentorship/become-mentor" className="btn-ocean-outline px-4 py-2 rounded">Edit & Resubmit</Link>
          </div>
        </div>
      </div>
    );
  }

  // Rejected
  if (mentorRow.status === 'rejected') {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-800">My Mentorship</h1>
            {compositeBadge()}
          </div>
          {/* Availability Switch */}
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="toggle-checkbox h-5 w-10"
                checked={isAvailable}
                onChange={(e) => toggleAvailability(e.target.checked)}
                disabled={isSaving}
              />
              <span className="text-sm font-medium">Accepting mentees</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isAvailable
              ? "You’re visible in the Mentor directory and can receive new requests."
              : "You’re hidden from the Mentor directory and cannot receive new requests."}
          </p>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">Rejected</div>
          <p className="mt-3 text-gray-600">Your mentor application was rejected. Please edit and resubmit your details.</p>
          <div className="mt-4">
            <Link to="/mentorship/become-mentor" className="btn-ocean-outline px-4 py-2 rounded">Edit & Resubmit</Link>
          </div>
        </div>
      </div>
    );
  }

  // Approved
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-gray-800">My Mentorship</h1>
          {compositeBadge()}
        </div>
        {/* Availability Switch */}
        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="toggle-checkbox h-5 w-10"
              checked={isAvailable}
              onChange={(e) => toggleAvailability(e.target.checked)}
              disabled={isSaving}
            />
            <span className="text-sm font-medium">Accepting mentees</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {isAvailable
            ? "You’re visible in the Mentor directory and can receive new requests."
            : "You’re hidden from the Mentor directory and cannot receive new requests."}
        </p>
        <div className="mt-4 flex items-start gap-4">
          {mentorRow.applicant?.avatar_url && (
            <img src={mentorRow.applicant.avatar_url} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
          )}
          <div>
            <div className="text-lg font-medium">{mentorRow.applicant?.full_name || 'My Mentor Profile'}</div>
            {Array.isArray(mentorRow.expertise) && mentorRow.expertise.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {mentorRow.expertise.map((x, i) => (
                  <span key={i} className="px-2 py-1 bg-ocean-100 text-ocean-800 rounded text-xs">{x}</span>
                ))}
              </div>
            )}
            {mentorRow.mentoring_preferences && (
              <div className="mt-2 text-sm text-gray-700">
                <div>Preferences:</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {mentorRow.mentoring_preferences.communication && (
                    <span className="px-2 py-1 bg-gray-100 rounded">Communication: {mentorRow.mentoring_preferences.communication}</span>
                  )}
                  {mentorRow.mentoring_preferences.format && (
                    <span className="px-2 py-1 bg-gray-100 rounded">Format: {mentorRow.mentoring_preferences.format}</span>
                  )}
                  {mentorRow.mentoring_preferences.duration && (
                    <span className="px-2 py-1 bg-gray-100 rounded">Duration: {mentorRow.mentoring_preferences.duration}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Link to="/mentorship/requests" className="btn-ocean px-4 py-2 rounded">Requests</Link>
          <Link to="/messages" className="btn-ocean-outline px-4 py-2 rounded">Chat</Link>
          <Link to="/mentorship" className="btn-ocean-outline px-4 py-2 rounded">Sessions</Link>
        </div>
      </div>
    </div>
  );
}
