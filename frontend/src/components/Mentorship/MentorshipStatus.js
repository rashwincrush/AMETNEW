import React, { useState, useEffect, useCallback } from 'react';
import { supabase, onPostgresChangesOnce } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Container, Typography, Paper, Box, Button, Chip, Tabs, Tab, CircularProgress } from '@mui/material';

const MentorshipStatus = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0); // 0 for received, 1 for sent
  const [myMentorStatus, setMyMentorStatus] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from('mentorship_requests')
        .select('*')
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Hydrate mentor/mentee identities from public view, then fallback to profiles
      const ids = Array.from(new Set((rows || []).flatMap(r => [r.mentor_id, r.mentee_id]).filter(Boolean)));
      const idMap = new Map();
      if (ids.length) {
        const { data: pubs } = await supabase
          .from('alumni_directory_public')
          .select('id, full_name, avatar_url')
          .in('id', ids);
        (pubs || []).forEach(p => idMap.set(p.id, p));

        // Fallback for IDs missing from the public view (e.g., not public or not yet approved)
        const missing = ids.filter(id => !idMap.has(id));
        if (missing.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, first_name, last_name, email, avatar_url')
            .in('id', missing);
          (profs || []).forEach(p => {
            const display = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || (p.email ? p.email.split('@')[0] : 'User');
            idMap.set(p.id, { id: p.id, full_name: display, avatar_url: p.avatar_url });
          });
        }
      }

      const hydrated = (rows || []).map(r => {
        const mentor = idMap.get(r.mentor_id) || { id: r.mentor_id, full_name: 'Mentor', avatar_url: null };
        const mentee = idMap.get(r.mentee_id) || { id: r.mentee_id, full_name: 'Mentee', avatar_url: null };
        return { ...r, mentor, mentee };
      });

      setRequests(hydrated);
    } catch (error) {
      toast.error('Failed to fetch mentorship requests: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Realtime updates: refresh when requests are inserted/updated for me
  useEffect(() => {
    if (!user?.id) return;
    const channelName = `mentorship-status-${user.id}`;
    onPostgresChangesOnce(
      channelName,
      `requests-insert-${user.id}`,
      { event: 'INSERT', schema: 'public', table: 'mentorship_requests', filter: `mentor_id=eq.${user.id}` },
      () => fetchRequests()
    );
    onPostgresChangesOnce(
      channelName,
      `requests-update-${user.id}`,
      { event: 'UPDATE', schema: 'public', table: 'mentorship_requests', filter: `mentor_id=eq.${user.id}` },
      () => fetchRequests()
    );
    onPostgresChangesOnce(
      channelName,
      `requests-update-mentee-${user.id}`,
      { event: 'UPDATE', schema: 'public', table: 'mentorship_requests', filter: `mentee_id=eq.${user.id}` },
      () => fetchRequests()
    );
  }, [user, fetchRequests]);

  useEffect(() => {
    const fetchMyMentorRow = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('mentors')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();
      setMyMentorStatus(data?.status || null);
    };
    fetchMyMentorRow();
  }, [user]);

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('mentor_id', user.id);

      if (error) throw error;
      toast.success(`Request ${newStatus}.`);
      fetchRequests(); // Refresh the list
    } catch (error) {
      toast.error(`Failed to update request: ${error.message}`);
    }
  };

  const receivedRequests = requests.filter(r => r.mentor.id === user.id);
  const sentRequests = requests.filter(r => r.mentee.id === user.id);

  const renderRequestCard = (request, type) => {
    const isMentorView = type === 'received';
    const otherParty = isMentorView ? request.mentee : request.mentor;

    return (
      <Paper key={request.id} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">{otherParty.full_name}</Typography>
          <Typography variant="body2" color="text.secondary">{new Date(request.created_at).toLocaleDateString()}</Typography>
          <Chip label={request.status} size="small" color={request.status === 'pending' ? 'warning' : request.status === 'accepted' ? 'success' : 'error'} sx={{ mt: 1 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isMentorView && request.status === 'pending' && (
            <>
              <Button variant="contained" color="success" onClick={() => handleUpdateStatus(request.id, 'accepted')}>Accept</Button>
              <Button variant="outlined" color="error" onClick={() => handleUpdateStatus(request.id, 'rejected')}>Reject</Button>
            </>
          )}
          {!isMentorView && request.status === 'pending' && (
            <Button
              variant="outlined"
              color="warning"
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('mentorship_requests')
                    .delete()
                    .eq('id', request.id);
                  toast.success('Request withdrawn');
                  fetchRequests();
                } catch (e) {
                  toast.error('Failed to withdraw request: ' + e.message);
                }
              }}
            >
              Withdraw
            </Button>
          )}
          {request.status === 'accepted' && (
            <Button
              component={Link}
              to={`/messages?peer=${encodeURIComponent((isMentorView ? request.mentee.id : request.mentor.id) || '')}`}
              variant="contained"
              color="primary"
            >
              Go to Chat
            </Button>
          )}
        </Box>
      </Paper>
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ mr: 2 }}>Mentorship Requests</Typography>
        {(profile?.is_approved || profile?.approval_status === 'approved') && (
          <Chip
            size="small"
            label={myMentorStatus === 'approved' ? 'Approved + Mentor' : 'Approved + Mentor Pending'}
            color={myMentorStatus === 'approved' ? 'success' : 'warning'}
          />
        )}
      </Box>
      <Paper>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} centered>
          <Tab label={`Received (${receivedRequests.length})`} />
          <Tab label={`Sent (${sentRequests.length})`} />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {loading ? <CircularProgress /> : (
            tab === 0 ? (
              receivedRequests.length > 0 ? receivedRequests.map(r => renderRequestCard(r, 'received')) : <Typography>No requests received.</Typography>
            ) : (
              sentRequests.length > 0 ? sentRequests.map(r => renderRequestCard(r, 'sent')) : <Typography>You haven't sent any requests.</Typography>
            )
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default MentorshipStatus;
