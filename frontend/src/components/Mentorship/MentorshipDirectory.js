import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Box, Typography, Paper, Grid, Chip, TextField, CircularProgress, Button, Avatar } from '@mui/material';
import { Link } from 'react-router-dom';

const MentorshipDirectory = () => {
  const [mentors, setMentors] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('mentors');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    // Fetch mentors
    const { data: mentorData } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_mentor', true)
      .order('full_name');
    // Fetch mentees
    const { data: menteeData } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_mentor', false)
      .order('full_name');
    setMentors(mentorData || []);
    setMentees(menteeData || []);
    setLoading(false);
  };

  const filteredMentors = mentors.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.expertise?.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredMentees = mentees.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>Mentorship Directory</Typography>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant={filter === 'mentors' ? 'contained' : 'outlined'}
          onClick={() => setFilter('mentors')}
        >
          Mentors
        </Button>
        <Button
          variant={filter === 'mentees' ? 'contained' : 'outlined'}
          onClick={() => setFilter('mentees')}
        >
          Mentees
        </Button>
        <TextField
          label="Search by name, expertise, or department"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, ml: 2 }}
        />
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {(filter === 'mentors' ? filteredMentors : filteredMentees).map(profile => (
            <Grid item xs={12} md={4} key={profile.id}>
              <Paper sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={profile.avatar_url} alt={profile.full_name} sx={{ width: 56, height: 56 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" component={Link} to={`/mentorship/profile/${profile.id}`} sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 'bold' }}>{profile.full_name}</Typography>
                  <Typography variant="body2" color="textSecondary">{profile.department}</Typography>
                  {profile.expertise && <Chip label={profile.expertise} size="small" color="info" sx={{ mt: 1 }} />}
                </Box>
                <Button
                  component={Link}
                  to={`/mentorship/profile/${profile.id}`}
                  variant="outlined"
                  size="small"
                >
                  View Profile
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MentorshipDirectory;
