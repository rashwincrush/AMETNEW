import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { Box, Typography, Paper, Avatar, Chip, Button, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const MentorshipProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [alreadyRequested, setAlreadyRequested] = useState(false);

  useEffect(() => {
    fetchProfile();
    if (user) checkIfRequested();
    // eslint-disable-next-line
  }, [id, user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) setError('Profile not found');
    setProfile(data);
    setLoading(false);
  };

  const checkIfRequested = async () => {
    const { data } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('mentor_id', id)
      .eq('mentee_id', user.id)
      .in('status', ['pending', 'approved']);
    setAlreadyRequested(data && data.length > 0);
  };

  const handleRequestMentorship = async () => {
    setRequesting(true);
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase.from('mentorship_requests').insert([
        {
          mentor_id: id,
          mentee_id: user.id,
          status: 'pending',
          requested_at: new Date().toISOString()
        }
      ]);
      if (error) throw error;
      setSuccess('Mentorship request sent!');
      setAlreadyRequested(true);
    } catch (err) {
      setError('Failed to send request.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>;
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!profile) {
    return <Alert severity="info">Profile not found.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', py: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2, display: 'flex', gap: 3, alignItems: 'center' }}>
        <Avatar src={profile.avatar_url} alt={profile.full_name} sx={{ width: 96, height: 96 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{profile.full_name}</Typography>
          <Typography variant="body1" color="textSecondary">{profile.department}</Typography>
          {profile.expertise && <Chip label={profile.expertise} color="info" sx={{ mt: 1 }} />}
          {profile.bio && <Typography sx={{ mt: 2 }}>{profile.bio}</Typography>}
        </Box>
      </Paper>
      {profile.is_mentor && user && user.id !== profile.id && (
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            disabled={alreadyRequested || requesting}
            onClick={handleRequestMentorship}
          >
            {alreadyRequested ? 'Request Pending or Approved' : requesting ? 'Requesting...' : 'Request Mentorship'}
          </Button>
        </Box>
      )}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
};

export default MentorshipProfile;
