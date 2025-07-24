import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Typography, Grid, CircularProgress, Paper } from '@mui/material';
import { JobCard } from './JobListingsPage'; // Reusing the JobCard component
import toast from 'react-hot-toast';
import { useNotification } from '../common/NotificationCenter';

const BookmarkedJobs = () => {
  const { user } = useAuth();
  const notification = useNotification();
  const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState([]);

  useEffect(() => {
    const fetchBookmarkedJobs = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // First, get the job_ids from the bookmarks table
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('job_bookmarks')
          .select('job_id')
          .eq('user_id', user.id);

        if (bookmarksError) throw bookmarksError;

        const jobIds = bookmarks.map(b => b.job_id);
        setBookmarkedJobIds(jobIds);

        if (jobIds.length === 0) {
          setBookmarkedJobs([]);
          return;
        }

        // Then, fetch the job details for those IDs
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select(`
            *,
            companies (*),
            job_applications(count)
          `)
          .in('id', jobIds);

        if (jobsError) throw jobsError;

        setBookmarkedJobs(jobs);
      } catch (error) {
        console.error('Error fetching bookmarked jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedJobs();
  }, [user]);

  const handleBookmark = async (jobId) => {
    if (!user) {
      notification.showWarning('Please login to bookmark jobs');
      return;
    }

    try {
      if (bookmarkedJobIds.includes(jobId)) {
        // Remove bookmark
        const { error } = await supabase
          .from('job_bookmarks')
          .delete()
          .match({ user_id: user.id, job_id: jobId });

        if (error) throw error;

        setBookmarkedJobIds(prev => prev.filter(id => id !== jobId));
        setBookmarkedJobs(prev => prev.filter(job => job.id !== jobId));
        toast.success('Bookmark removed');
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('job_bookmarks')
          .insert({ user_id: user.id, job_id: jobId });

        if (error) throw error;

        setBookmarkedJobIds(prev => [...prev, jobId]);
        // Fetch the job details to add to the list
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('*, companies(*), job_applications(count)')
          .eq('id', jobId)
          .single();

        if (jobError) throw jobError;

        setBookmarkedJobs(prev => [...prev, job]);
        toast.success('Job bookmarked!');
      }
    } catch (error) {
      console.error('Error bookmarking job:', error);
      notification.showError('Failed to update bookmark.');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Bookmarked Jobs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here are the jobs you've saved for later.
        </Typography>
      </Paper>

      {bookmarkedJobs.length > 0 ? (
        <Grid container spacing={3}>
          {bookmarkedJobs.map(job => (
            <Grid item key={job.id} xs={12} sm={6} md={4}>
              <JobCard 
                job={job} 
                handleBookmark={handleBookmark} 
                isBookmarked={bookmarkedJobIds.includes(job.id)} 
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>You haven't bookmarked any jobs yet.</Typography>
      )}
    </Box>
  );
};

export default BookmarkedJobs;
