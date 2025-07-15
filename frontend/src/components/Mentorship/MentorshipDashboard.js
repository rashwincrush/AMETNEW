import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Container, Typography, Paper, Button, Grid } from '@mui/material';

const MentorshipDashboard = () => {
  const { user, profile, getUserRole } = useAuth();
  const role = getUserRole();

  // This is a placeholder. In a real app, you'd fetch mentorship-specific data.
  const isMentor = profile?.is_mentor;
  const isMentee = profile?.is_mentee;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mentorship Dashboard
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6">Welcome, {profile?.full_name || user?.email}!</Typography>
        <Typography color="text.secondary">Here you can manage your mentorship activities.</Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Actions for all users */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>Find a Mentor</Typography>
            <Typography sx={{ flexGrow: 1 }}>Browse our directory or use our matching tool to find the perfect mentor.</Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button component={Link} to="/mentorship/directory" variant="outlined" sx={{ flex: 1 }}>
                Browse Directory
              </Button>
              <Button component={Link} to="/mentorship/matching" variant="contained" sx={{ flex: 1 }}>
                Find a Match
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Action to become a mentor */}
        {!isMentor && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h6" gutterBottom>Become a Mentor</Typography>
              <Typography sx={{ flexGrow: 1 }}>Share your knowledge and experience with the next generation of professionals.</Typography>
              <Button component={Link} to="/mentorship/become-mentor" variant="contained" sx={{ mt: 2 }}>
                Register as Mentor
              </Button>
            </Paper>
          </Grid>
        )}

        {/* Manage Requests for both Mentors and Mentees */}
        {(isMentor || isMentee) && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h6" gutterBottom>Manage Mentorships</Typography>
              <Typography sx={{ flexGrow: 1 }}>View and respond to mentorship requests, and track your ongoing mentorships.</Typography>
              <Button component={Link} to="/mentorship/requests" variant="contained" sx={{ mt: 2 }}>
                Manage Requests
              </Button>
            </Paper>
          </Grid>
        )}


      </Grid>
    </Container>
  );
};

export default MentorshipDashboard;
