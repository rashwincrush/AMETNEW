import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { Box, Typography, Paper, TextField, Button, Grid, Chip, CircularProgress, Divider } from '@mui/material';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>Job Openings</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          label="Search jobs or companies"
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
        />
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : filteredJobs.length === 0 ? (
        <Typography>No jobs found.</Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredJobs.map(job => (
            <Grid item xs={12} md={6} key={job.id}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" component={Link} to={`/jobs/${job.id}`} sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 'bold' }}>
                  {job.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">{job.company}</Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {job.location && <Chip label={job.location} size="small" />}
                  {job.type && <Chip label={job.type} size="small" color="info" />}
                  {job.salary_range && <Chip label={job.salary_range} size="small" color="success" />}
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>{job.short_description || job.description?.slice(0, 100) + '...'}</Typography>
                <Button component={Link} to={`/jobs/${job.id}`} variant="contained" size="small">View Details</Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default JobsList;
