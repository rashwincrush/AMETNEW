import React, { useState, useEffect } from 'react';
import { fetchJobsFeed } from '../../api/jobs';
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
      const data = await fetchJobsFeed();
      setJobs(data || []);
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title?.toLowerCase().includes(search.toLowerCase()) ||
    job.company_name?.toLowerCase().includes(search.toLowerCase())
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
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
          <p className="text-gray-600">Try adjusting your search terms or browse all available positions.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredJobs.length === jobs.length
                ? `Showing all ${jobs.length} jobs`
                : `Showing ${filteredJobs.length} of ${jobs.length} jobs`
              }
            </p>
          </div>
          <Grid container spacing={3}>
            {filteredJobs.map(job => (
              <Grid item xs={12} sm={6} md={4} key={job.id}>
                <JobCard job={job} />
              </Grid>
            ))}
          </Grid>
        </div>
      )}
    </Box>
  );
};

export default JobsList;
