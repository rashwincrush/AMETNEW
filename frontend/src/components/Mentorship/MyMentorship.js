import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase, onPostgresChangesOnce } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import MentorRegistrationForm from './MentorRegistrationForm';
import CreateSessionModal from './CreateSessionModal';
import { getPublicIdentity } from '../../lib/hydrateIdentity';
import { idempotentConnect, acceptPending } from '../../utils/connections';
import { RequestStatusChip } from '../../lib/statusChips';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMenteeRequests, fetchMentorRequests } from '../../lib/queries/mentorship';
import { mapSupabaseErrorToToast } from '../../utils/mapSupabaseErrorToToast';

// Small 3-row skeleton for lists
function ListSkeleton({ rows = 3 }) {
  return (
    <ul className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="py-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// Cancel button with optimistic React Query update
function CancelButton({ requestId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status: 'cancelled_by_user' })
        .eq('id', id);
      if (error) throw error;
      return { id };
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['menteeRequests', user?.id] });
      const prev = queryClient.getQueryData(['menteeRequests', user?.id]);
      queryClient.setQueryData(['menteeRequests', user?.id], (old = []) => old.map((r) => r.id === id ? { ...r, status: 'cancelled_by_user' } : r));
      toast.dismiss('rq-info');
      toast.success('Request cancelled', { id: 'rq-info' });
      return { prev };
    },
    onError: (err, id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['menteeRequests', user?.id], ctx.prev);
      mapSupabaseErrorToToast(err, 'Failed to cancel request');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['menteeRequests', user?.id] });
    },
  });
  return (
    <button
      className="btn-ocean-outline px-3 py-1.5 rounded"
      onClick={() => mutation.mutate(requestId)}
      disabled={mutation.isLoading}
    >
      Cancel Request
    </button>
  );
}

export default function MyMentorship() {
  const { user, profile, fetchUserProfile, getUserRole } = useAuth();
  const role = getUserRole ? getUserRole() : undefined;
  const [mentorRow, setMentorRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const [requestTab, setRequestTab] = useState('received'); // 'received' | 'sent'
  // Mentee requests via React Query
  const menteeReqQuery = useQuery({
    queryKey: ['menteeRequests', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const q = await fetchMenteeRequests(user.id, {});
      const { data: rows, error } = await q;
      if (error) throw error;
      const hydrated = await Promise.all((rows || []).map(async (r) => ({
        ...r,
        mentor: await getPublicIdentity(r.mentor_id),
      })));
      return hydrated;
    },
    staleTime: 60_000,
  });
  const requests = menteeReqQuery.data || [];
  const reqLoading = menteeReqQuery.isLoading || menteeReqQuery.isFetching;

  // Mentor (received) requests via React Query
  const mentorReqQuery = useQuery({
    queryKey: ['mentorRequests', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const q = await fetchMentorRequests(user.id, {});
      const { data: rows, error } = await q;
      if (error) throw error;
      const hydrated = await Promise.all((rows || []).map(async (r) => ({
        ...r,
        mentee: await getPublicIdentity(r.mentee_id),
      })));
      return hydrated;
    },
    staleTime: 60_000,
  });
  const received = mentorReqQuery.data || [];
  const receivedLoading = mentorReqQuery.isLoading || mentorReqQuery.isFetching;
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

  // Manual refresh
  const refreshMenteeRequests = useCallback(() => {
    if (user?.id) queryClient.invalidateQueries({ queryKey: ['menteeRequests', user.id] });
  }, [queryClient, user?.id]);

  // Realtime for my requests (INSERT/UPDATE)
  useEffect(() => {
    if (!user?.id) return;
    const channelName = `mentee-requests-${user.id}`;
    onPostgresChangesOnce(
      channelName,
      `mentee-requests-insert-${user.id}`,
      { event: 'INSERT', schema: 'public', table: 'mentorship_requests', filter: `mentee_id=eq.${user.id}` },
      () => refreshMenteeRequests()
    );
    onPostgresChangesOnce(
      channelName,
      `mentee-requests-update-${user.id}`,
      { event: 'UPDATE', schema: 'public', table: 'mentorship_requests', filter: `mentee_id=eq.${user.id}` },
      () => refreshMenteeRequests()
    );
  }, [user, refreshMenteeRequests]);

  // Realtime for mentor received requests (INSERT/UPDATE)
  useEffect(() => {
    if (!user?.id) return;
    const channelName = `mentor-requests-${user.id}`;
    onPostgresChangesOnce(
      channelName,
      `mentor-requests-insert-${user.id}`,
      { event: 'INSERT', schema: 'public', table: 'mentorship_requests', filter: `mentor_id=eq.${user.id}` },
      () => queryClient.invalidateQueries({ queryKey: ['mentorRequests', user?.id] })
    );
    onPostgresChangesOnce(
      channelName,
      `mentor-requests-update-${user.id}`,
      { event: 'UPDATE', schema: 'public', table: 'mentorship_requests', filter: `mentor_id=eq.${user.id}` },
      () => queryClient.invalidateQueries({ queryKey: ['mentorRequests', user?.id] })
    );
  }, [user, queryClient]);

  // Accept/Reject handlers for mentor side
  const handleAccept = useCallback(async (req) => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', req.id)
        .eq('mentor_id', user.id);
      if (error) throw error;
      toast.success('Request accepted');
      // Ensure a connection exists so chat can start immediately
      try {
        // Try to accept if mentee already requested connection
        await acceptPending(user.id, req.mentee_id);
      } catch (_) { /* benign */ }
      try {
        // Otherwise send a request; DM will be available once mentee accepts
        await idempotentConnect(user.id, req.mentee_id);
      } catch (_) { /* benign */ }
      queryClient.invalidateQueries({ queryKey: ['mentorRequests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['menteeRequests', user?.id] });
    } catch (e) {
      mapSupabaseErrorToToast(e, 'Failed to accept request');
    }
  }, [user?.id]);

  const handleReject = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('mentor_id', user.id);
      if (error) throw error;
      toast.success('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['mentorRequests'] });
      queryClient.invalidateQueries({ queryKey: ['menteeRequests'] });
    } catch (e) {
      mapSupabaseErrorToToast(e, 'Failed to reject request');
    }
  }, [user?.id]);

  const openSchedule = (req) => {
    setSessionModal({ open: true, requestId: req.id, mentorId: null, menteeId: null });
  };
  const closeSchedule = () => setSessionModal({ open: false, requestId: null, mentorId: null, menteeId: null });

  const statusChip = (status) => <RequestStatusChip status={status} />;

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

        {/* Requests panel (Received/Sent) */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800">Requests</h2>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1.5 rounded text-sm ${requestTab === 'received' ? 'btn-ocean' : 'btn-ocean-outline'}`}
                onClick={() => setRequestTab('received')}
              >
                Received ({received.length})
              </button>
              <button
                className={`px-3 py-1.5 rounded text-sm ${requestTab === 'sent' ? 'btn-ocean' : 'btn-ocean-outline'}`}
                onClick={() => setRequestTab('sent')}
              >
                Sent ({requests.length})
              </button>
            </div>
          </div>

          {/* Received tab */}
          {requestTab === 'received' && (
            receivedLoading ? (
              <ListSkeleton rows={3} />
            ) : received.length === 0 ? (
              <p className="text-gray-600">No requests received.</p>
            ) : (
              <ul className="divide-y">
                {received.map((r) => (
                  <li key={r.id} className={`py-3 flex items-center justify-between ${r.status === 'rejected' ? 'opacity-70' : ''}`}>
                    <div className="flex items-center gap-3">
                      <img src={r.mentee?.avatar_url || '/default-avatar.svg'} alt={r.mentee?.full_name || 'Mentee'} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-gray-900">{r.mentee?.full_name || 'Mentee'}</div>
                        <div className="text-sm text-gray-600">{new Date(r.created_at).toLocaleString()}</div>
                        <div className="mt-1">{statusChip(r.status)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => handleAccept(r)} className="btn-ocean px-3 py-1.5 rounded">Accept</button>
                          <button onClick={() => handleReject(r.id)} className="btn-ocean-outline px-3 py-1.5 rounded">Reject</button>
                        </>
                      )}
                      {r.status === 'accepted' && (
                        <Link to={`/messages?tab=chats&peer=${encodeURIComponent(r.mentee?.id || r.mentee_id)}`} className="btn-ocean px-3 py-1.5 rounded">Go to Chat</Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}

          {/* Sent tab */}
          {requestTab === 'sent' && (
            reqLoading ? (
              <ListSkeleton rows={3} />
            ) : requests.length === 0 ? (
              <p className="text-gray-600">No items yet.</p>
            ) : (
              <ul className="divide-y">
                {requests.map((r) => (
                  <li key={r.id} className={`py-3 flex items-center justify-between ${r.status === 'rejected' || r.status?.startsWith('cancelled') ? 'opacity-70' : ''}`} title={r.status === 'rejected' || (r.status && r.status.startsWith('cancelled')) ? 'This request is closed.' : ''}>
                    <div className="flex items-center gap-3">
                      <img src={r.mentor?.avatar_url || '/default-avatar.svg'} alt={r.mentor?.full_name || 'Mentor'} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-gray-900">{r.mentor?.full_name || 'Mentor'}</div>
                        <div className="text-sm text-gray-600">{new Date(r.created_at).toLocaleString()}</div>
                        <div className="mt-1">{statusChip(r.status)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === 'accepted' && (
                        <>
                          <Link to={`/messages?tab=chats&peer=${encodeURIComponent(r.mentor?.id || r.mentor_id)}`} className="btn-ocean px-3 py-1.5 rounded">Start Chat</Link>
                          <button onClick={() => openSchedule(r)} className="btn-ocean-outline px-3 py-1.5 rounded">Schedule Session</button>
                        </>
                      )}
                      {r.status === 'pending' && (
                        <CancelButton requestId={r.id} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
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
        {/* Requests panel (Received/Sent) */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800">Requests</h2>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1.5 rounded text-sm ${requestTab === 'received' ? 'btn-ocean' : 'btn-ocean-outline'}`}
                onClick={() => setRequestTab('received')}
              >
                Received ({received.length})
              </button>
              <button
                className={`px-3 py-1.5 rounded text-sm ${requestTab === 'sent' ? 'btn-ocean' : 'btn-ocean-outline'}`}
                onClick={() => setRequestTab('sent')}
              >
                Sent ({requests.length})
              </button>
            </div>
          </div>

          {/* Received tab */}
          {requestTab === 'received' && (
            receivedLoading ? (
              <ListSkeleton rows={3} />
            ) : received.length === 0 ? (
              <p className="text-gray-600">No requests received.</p>
            ) : (
              <ul className="divide-y">
                {received.map((r) => (
                  <li key={r.id} className={`py-3 flex items-center justify-between ${r.status === 'rejected' ? 'opacity-70' : ''}`}>
                    <div className="flex items-center gap-3">
                      <img src={r.mentee?.avatar_url || '/default-avatar.svg'} alt={r.mentee?.full_name || 'Mentee'} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-gray-900">{r.mentee?.full_name || 'Mentee'}</div>
                        <div className="text-sm text-gray-600">{new Date(r.created_at).toLocaleString()}</div>
                        <div className="mt-1">{statusChip(r.status)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => handleAccept(r)} className="btn-ocean px-3 py-1.5 rounded">Accept</button>
                          <button onClick={() => handleReject(r.id)} className="btn-ocean-outline px-3 py-1.5 rounded">Reject</button>
                        </>
                      )}
                      {r.status === 'accepted' && (
                        <Link to={`/messages?tab=chats&peer=${encodeURIComponent(r.mentee?.id || r.mentee_id)}`} className="btn-ocean px-3 py-1.5 rounded">Go to Chat</Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}

          {/* Sent tab */}
          {requestTab === 'sent' && (
            reqLoading ? (
              <ListSkeleton rows={3} />
            ) : requests.length === 0 ? (
              <p className="text-gray-600">No items yet.</p>
            ) : (
              <ul className="divide-y">
                {requests.map((r) => (
                  <li key={r.id} className={`py-3 flex items-center justify-between ${r.status === 'rejected' || r.status?.startsWith('cancelled') ? 'opacity-70' : ''}`} title={r.status === 'rejected' || (r.status && r.status.startsWith('cancelled')) ? 'This request is closed.' : ''}>
                    <div className="flex items-center gap-3">
                      <img src={r.mentor?.avatar_url || '/default-avatar.svg'} alt={r.mentor?.full_name || 'Mentor'} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-gray-900">{r.mentor?.full_name || 'Mentor'}</div>
                        <div className="text-sm text-gray-600">{new Date(r.created_at).toLocaleString()}</div>
                        <div className="mt-1">{statusChip(r.status)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === 'accepted' && (
                        <>
                          <Link to={`/messages?tab=chats&peer=${encodeURIComponent(r.mentor?.id || r.mentor_id)}`} className="btn-ocean px-3 py-1.5 rounded">Start Chat</Link>
                          <button onClick={() => openSchedule(r)} className="btn-ocean-outline px-3 py-1.5 rounded">Schedule Session</button>
                        </>
                      )}
                      {r.status === 'pending' && (
                        <CancelButton requestId={r.id} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>

      

      {/* Session Modal */}
      <CreateSessionModal
        open={sessionModal.open}
        onClose={closeSchedule}
        requestId={sessionModal.requestId}
      />
    </div>
  );
}
