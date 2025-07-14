import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Box, Typography, Paper, Button, Chip, Grid, CircularProgress, TextField, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle as ApproveIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const JobAdminPanel = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
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

  const handleApprove = async (jobId) => {
    try {
      setEditLoading(true);
      const { error } = await supabase
        .from('jobs')
        .update({ is_approved: true })
        .eq('id', jobId);
      if (error) throw error;
      setSuccess('Job approved!');
      fetchJobs();
    } catch (err) {
      setError('Failed to approve job');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      setEditLoading(true);
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
      if (error) throw error;
      setSuccess('Job deleted!');
      fetchJobs();
    } catch (err) {
      setError('Failed to delete job');
    } finally {
      setEditLoading(false);
    }
  };

  const openEditDialog = (job) => {
    setSelectedJob(job);
    setEditFields({ ...job });
    setEditDialogOpen(true);
  };

  const handleEditFieldChange = (field, value) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      const { error } = await supabase
        .from('jobs')
        .update(editFields)
        .eq('id', selectedJob.id);
      if (error) throw error;
      setSuccess('Job updated!');
      setEditDialogOpen(false);
      fetchJobs();
    } catch (err) {
      setError('Failed to update job');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>Job Admin Panel</Typography>
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
        <Alert severity="error">{error}</Alert>
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
                  <Chip label={job.is_approved ? 'Approved' : 'Pending'} color={job.is_approved ? 'success' : 'warning'} size="small" />
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>{job.short_description || job.description?.slice(0, 100) + '...'}</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {!job.is_approved && (
                    <Button size="small" color="success" variant="contained" startIcon={<ApproveIcon />} disabled={editLoading} onClick={() => handleApprove(job.id)}>Approve</Button>
                  )}
                  <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEditDialog(job)}>Edit</Button>
                  <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} disabled={editLoading} onClick={() => handleDelete(job.id)}>Delete</Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Job</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent>
            <TextField
              label="Title"
              value={editFields.title || ''}
              onChange={e => handleEditFieldChange('title', e.target.value)}
              fullWidth sx={{ mb: 2 }}
            />
            <TextField
              label="Company"
              value={editFields.company || ''}
              onChange={e => handleEditFieldChange('company', e.target.value)}
              fullWidth sx={{ mb: 2 }}
            />
            <TextField
              label="Location"
              value={editFields.location || ''}
              onChange={e => handleEditFieldChange('location', e.target.value)}
              fullWidth sx={{ mb: 2 }}
            />
            <TextField
              label="Type"
              value={editFields.type || ''}
              onChange={e => handleEditFieldChange('type', e.target.value)}
              fullWidth sx={{ mb: 2 }}
            />
            <TextField
              label="Salary Range"
              value={editFields.salary_range || ''}
              onChange={e => handleEditFieldChange('salary_range', e.target.value)}
              fullWidth sx={{ mb: 2 }}
            />
            <TextField
              label="Description"
              value={editFields.description || ''}
              onChange={e => handleEditFieldChange('description', e.target.value)}
              multiline rows={4} fullWidth sx={{ mb: 2 }}
            />
            <TextField
              label="Requirements"
              value={editFields.requirements || ''}
              onChange={e => handleEditFieldChange('requirements', e.target.value)}
              multiline rows={2} fullWidth sx={{ mb: 2 }}
            />
            <TextField
              label="Apply URL (optional)"
              value={editFields.apply_url || ''}
              onChange={e => handleEditFieldChange('apply_url', e.target.value)}
              fullWidth sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Chip
                label={editFields.is_approved ? 'Approved' : 'Pending'}
                color={editFields.is_approved ? 'success' : 'warning'}
              />
              <Button
                variant="outlined"
                onClick={() => handleEditFieldChange('is_approved', !editFields.is_approved)}
              >
                Toggle Approval
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
    </Box>
  );
};

export default JobAdminPanel;
