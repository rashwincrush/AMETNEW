import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Box, Typography, Paper, Button, Chip, Grid, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const MentorshipRequestsDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    let query = supabase
      .from('mentorship_requests')
      .select('*, mentor:profiles!mentorship_requests_mentor_id_fkey(*), mentee:profiles!mentorship_requests_mentee_id_fkey(*)')
      .order('requested_at', { ascending: false });
    if (!isAdmin) {
      query = query.or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`);
    }
    const { data, error } = await query;
    if (error) setError('Failed to fetch requests');
    setRequests(data || []);
    setLoading(false);
  };

  const handleAction = async (id, status) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      setSuccess(`Request ${status}`);
      fetchRequests();
    } catch (err) {
      setError('Failed to update request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>Mentorship Requests</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {requests.length === 0 ? (
            <Typography sx={{ ml: 2 }}>No mentorship requests found.</Typography>
          ) : requests.map(req => (
            <Grid item xs={12} md={6} key={req.id}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Mentor: <Link to={`/mentorship/profile/${req.mentor_id}`}>{req.mentor?.full_name}</Link>
                </Typography>
                <Typography variant="subtitle2">
                  Mentee: <Link to={`/mentorship/profile/${req.mentee_id}`}>{req.mentee?.full_name}</Link>
                </Typography>
                <Chip label={req.status} color={req.status === 'approved' ? 'success' : req.status === 'pending' ? 'warning' : 'error'} sx={{ mt: 1, mb: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  Requested at: {new Date(req.requested_at).toLocaleString()}
                </Typography>
                {isAdmin && req.status === 'pending' && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button variant="contained" color="success" disabled={actionLoading} onClick={() => handleAction(req.id, 'approved')}>Approve</Button>
                    <Button variant="outlined" color="error" disabled={actionLoading} onClick={() => handleAction(req.id, 'rejected')}>Reject</Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
};

export default MentorshipRequestsDashboard;
