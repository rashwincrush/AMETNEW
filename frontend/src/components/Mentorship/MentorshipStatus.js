import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Container, Typography, Paper, Box, Button, Chip, Tabs, Tab, CircularProgress } from '@mui/material';

const MentorshipStatus = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0); // 0 for received, 1 for sent

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mentorship_requests')
        .select(`
          id, created_at, status, request_message, response_message,
          mentor:mentor_id ( id, full_name, avatar_url ),
          mentee:mentee_id ( id, full_name, avatar_url )
        `)
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      toast.error('Failed to fetch mentorship requests: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

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
            <Button variant="outlined" color="warning" onClick={() => handleUpdateStatus(request.id, 'withdrawn')}>Withdraw</Button>
          )}
          {request.status === 'accepted' && (
            <Button component={Link} to={`/mentorship/chat/${request.id}`} variant="contained" color="primary">Go to Chat</Button>
          )}
        </Box>
      </Paper>
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>Mentorship Requests</Typography>
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
