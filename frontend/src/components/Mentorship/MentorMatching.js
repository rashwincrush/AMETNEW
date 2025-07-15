import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Container, Typography, Paper, Box, Button, Chip, TextField, Autocomplete, CircularProgress, Grid, Avatar } from '@mui/material';

const MentorMatching = () => {
  const [expertiseOptions, setExpertiseOptions] = useState([]);
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [industry, setIndustry] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const fetchExpertise = async () => {
      // Fetch all unique areas of expertise from approved mentors
      const { data, error } = await supabase
        .from('mentors')
        .select('areas_of_expertise')
        .eq('approval_status', 'approved');

      if (error) {
        toast.error('Failed to load expertise options.');
        return;
      }

      const allExpertise = data.flatMap(m => m.areas_of_expertise || []);
      const uniqueExpertise = [...new Set(allExpertise)];
      setExpertiseOptions(uniqueExpertise);
    };

    fetchExpertise();
  }, []);

  const handleFindMatch = async () => {
    if (selectedExpertise.length === 0 || !industry.trim()) {
      toast.error('Please select at least one area of expertise and enter an industry.');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('mentor-matching', {
        body: { expertise: selectedExpertise, industry },
      });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      toast.error(`Failed to find matches: ${error.message}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>Find Your Mentor</Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Select your desired areas of expertise and industry to find the best mentors for you.
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <Autocomplete
              multiple
              options={expertiseOptions}
              getOptionLabel={(option) => option}
              value={selectedExpertise}
              onChange={(event, newValue) => {
                setSelectedExpertise(newValue);
              }}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" label="Areas of Expertise" placeholder="Select expertise..." />
              )}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              variant="outlined"
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Technology, Finance"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="contained" size="large" onClick={handleFindMatch} disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Find Match'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}

      {!loading && searched && (
        <Box>
          <Typography variant="h5" gutterBottom>{results.length} Matches Found</Typography>
          {results.length > 0 ? (
            <Grid container spacing={3}>
              {results.map(mentor => (
                <Grid item key={mentor.user_id} xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Avatar src={mentor.profile.avatar_url} sx={{ width: 80, height: 80, margin: 'auto', mb: 2 }} />
                    <Typography variant="h6">{mentor.profile.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary">{mentor.industry}</Typography>
                    <Box sx={{ my: 2 }}>
                      {mentor.areas_of_expertise.slice(0, 3).map(exp => <Chip key={exp} label={exp} size="small" sx={{ mr: 0.5, mb: 0.5 }} />)}
                    </Box>
                    <Button component={Link} to={`/mentorship/mentor/${mentor.user_id}`} variant="outlined">View Profile</Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No mentors found matching your criteria. Try broadening your search.</Typography>
          )}
        </Box>
      )}
    </Container>
  );
};

export default MentorMatching;
