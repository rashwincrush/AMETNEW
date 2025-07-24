import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { Box, Typography, Paper, TextField, Grid, CircularProgress } from '@mui/material';
import JobCard from './JobCard'; // Import the new component

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
        .select(`
          *,
          companies ( name )
        `)
        .eq('is_active', true)
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
    (job.companies ? job.companies.name.toLowerCase().includes(search.toLowerCase()) : false)
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>Job Openings</Typography>
      <Paper sx={{ p: 2, mb: 4, borderRadius: 2 }}>
        <TextField
          label="Search by title or company"
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
          variant="outlined"
        />
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : filteredJobs.length === 0 ? (
        <Typography>No matching jobs found.</Typography>
      ) : (
        <Grid container spacing={4}>
          {filteredJobs.map(job => (
            <Grid item xs={12} sm={6} md={4} key={job.id}>
              <JobCard job={job} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default JobsList;
