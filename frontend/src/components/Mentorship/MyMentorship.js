import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase, onPostgresChangesOnce } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import MentorRegistrationForm from './MentorRegistrationForm';
import CreateSessionModal from './CreateSessionModal';

export default function MyMentorship() {
  const { user, profile, fetchUserProfile, getUserRole } = useAuth();
  const role = getUserRole ? getUserRole() : undefined;
  const [mentorRow, setMentorRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Mentee requests state
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [sessionModal, setSessionModal] = useState({ open: false, requestId: null, mentorId: null, menteeId: null });

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

  // Fetch my mentee requests
  const fetchMyRequests = useCallback(async () => {
    if (!user) return;
    setReqLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from('mentorship_requests')
        .select('id, mentor_id, mentee_id, status, message, goals, created_at')
        .eq('mentee_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const ids = Array.from(new Set((rows || []).map(r => r.mentor_id).filter(Boolean)));
      let map = new Map();
      if (ids.length) {
        const { data: pubs } = await supabase
          .from('alumni_directory_public')
          .select('id, full_name, avatar_url')
          .in('id', ids);
        (pubs || []).forEach(p => map.set(p.id, p));
      }

      const hydrated = (rows || []).map(r => ({
        ...r,
        mentor: map.get(r.mentor_id) || { id: r.mentor_id, full_name: 'Mentor', avatar_url: null }
      }));
      setRequests(hydrated);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load your mentorship requests');
    } finally {
      setReqLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  // Realtime for my requests (INSERT/UPDATE)
  useEffect(() => {
    if (!user?.id) return;
    const channelName = `mentee-requests-${user.id}`;
    onPostgresChangesOnce(
      channelName,
      `mentee-requests-insert-${user.id}`,
      { event: 'INSERT', schema: 'public', table: 'mentorship_requests', filter: `mentee_id=eq.${user.id}` },
      () => fetchMyRequests()
    );
    onPostgresChangesOnce(
      channelName,
      `mentee-requests-update-${user.id}`,
      { event: 'UPDATE', schema: 'public', table: 'mentorship_requests', filter: `mentee_id=eq.${user.id}` },
      () => fetchMyRequests()
    );
  }, [user, fetchMyRequests]);

  const openSchedule = (req) => {
    setSessionModal({ open: true, requestId: req.id, mentorId: null, menteeId: null });
  };
  const closeSchedule = () => setSessionModal({ open: false, requestId: null, mentorId: null, menteeId: null });

  const statusChip = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    const cls = map[status] || 'bg-gray-100 text-gray-800';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
  };

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

  // No mentor profile yet → for students and non-mentors, show mentee view only (no registration form here)
  if (!mentorRow) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-800">My Mentorship</h1>
          <p className="text-sm text-gray-600 mt-1">Your mentorship requests and sessions as a mentee.</p>
        </div>

        {/* My Requests (as Mentee) */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800">Requests I Sent</h2>
            <button className="text-sm text-ocean-600 hover:underline" onClick={fetchMyRequests}>Refresh</button>
          </div>
          {reqLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-gray-600">You haven't sent any mentorship requests yet.</p>
          ) : (
            <ul className="divide-y">
              {requests.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{r.mentor?.full_name || 'Mentor'}</div>
                    <div className="text-sm text-gray-600">{new Date(r.created_at).toLocaleString()}</div>
                    <div className="mt-1">{statusChip(r.status)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === 'accepted' && (
                      <>
                        <Link to={`/mentorship/chat/${r.id}`} className="btn-ocean px-3 py-1.5 rounded">Start Chat</Link>
                        <button onClick={() => openSchedule(r)} className="btn-ocean-outline px-3 py-1.5 rounded">Schedule Session</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
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

      {/* My Requests (as Mentee) */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-800">Requests I Sent</h2>
          <button className="text-sm text-ocean-600 hover:underline" onClick={fetchMyRequests}>Refresh</button>
        </div>
        {reqLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-600">You haven't sent any mentorship requests yet.</p>
        ) : (
          <ul className="divide-y">
            {requests.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{r.mentor?.full_name || 'Mentor'}</div>
                  <div className="text-sm text-gray-600">{new Date(r.created_at).toLocaleString()}</div>
                  <div className="mt-1">{statusChip(r.status)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === 'accepted' && (
                    <>
                      <Link to={`/mentorship/chat/${r.id}`} className="btn-ocean px-3 py-1.5 rounded">Start Chat</Link>
                      <button onClick={() => openSchedule(r)} className="btn-ocean-outline px-3 py-1.5 rounded">Schedule Session</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateSessionModal
        open={sessionModal.open}
        onClose={closeSchedule}
        requestId={sessionModal.requestId}
      />
    </div>
  );
}
