import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Chip, 
  Grid, 
  CircularProgress, 
  Alert, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const MentorshipRequestsDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

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

  const handleAction = async (id, status, responseMessage = null) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const updateData = { status };
      if (responseMessage !== null) {
        updateData.response_message = responseMessage;
      }
      
      const { error } = await supabase
        .from('mentorship_requests')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      setSuccess(`Request ${status}`);
      fetchRequests();
    } catch (err) {
      console.error('Error updating request:', err);
      setError('Failed to update request');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (requestId) => {
    setSelectedRequestId(requestId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    handleAction(selectedRequestId, 'rejected', rejectionReason);
    setRejectDialogOpen(false);
    setRejectionReason('');
  };

  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setSelectedRequestId(null);
    setRejectionReason('');
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
                <Box sx={{ mt: 2 }}>
                  {/* Display rejection reason if request is rejected */}
                  {req.status === 'rejected' && req.response_message && (
                    <Box sx={{ mb: 2, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold">Rejection Reason:</Typography>
                      <Typography variant="body2">{req.response_message}</Typography>
                    </Box>
                  )}
                  
                  {/* Admin or mentor controls for pending requests */}
                  {(isAdmin || user.id === req.mentor_id) && req.status === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" color="success" disabled={actionLoading} onClick={() => handleAction(req.id, 'approved')}>Approve</Button>
                      <Button variant="outlined" color="error" disabled={actionLoading} onClick={() => openRejectDialog(req.id)}>Reject</Button>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      
      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleRejectCancel}>
        <DialogTitle>Provide Rejection Reason</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting this mentorship request. This feedback will be visible to the mentee.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="rejection-reason"
            label="Rejection Reason"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            error={rejectionReason.trim() === ''}
            helperText={rejectionReason.trim() === '' ? 'Rejection reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectCancel}>Cancel</Button>
          <Button onClick={handleRejectConfirm} variant="contained" color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MentorshipRequestsDashboard;
