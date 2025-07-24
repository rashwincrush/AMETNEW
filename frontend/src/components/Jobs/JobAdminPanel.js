import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import { Box, Typography, Paper, Button, Chip, Grid, CircularProgress, TextField, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Alert, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle as ApproveIcon, ShieldCheck as VerifyIcon, Cancel as RejectIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

const JobAdminPanel = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*, company:companies(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      toast.error('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    (job.company && job.company.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    const { data, error } = await supabase
      .from('jobs')
      .update(newStatus)
      .eq('id', jobId)
      .select();

    if (error) {
      toast.error(`Failed to update job: ${error.message}`);
    } else {
      toast.success('Job status updated successfully!');
      fetchJobs();
    }
    return { data, error };
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job permanently?')) return;
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (error) {
      toast.error(`Failed to delete job: ${error.message}`);
    } else {
      toast.success('Job deleted successfully!');
      fetchJobs();
    }
  };

  const openEditDialog = (job) => {
    setSelectedJob(job);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (updatedFields) => {
    const { error } = await supabase
      .from('jobs')
      .update(updatedFields)
      .eq('id', selectedJob.id);

    if (error) {
      toast.error(`Failed to update job: ${error.message}`);
    } else {
      toast.success('Job updated successfully!');
      setEditDialogOpen(false);
      fetchJobs();
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Job Management</Typography>
      <TextField
        label="Search Jobs"
        variant="outlined"
        fullWidth
        margin="normal"
        onChange={(e) => setSearch(e.target.value)}
      />
      <Grid container spacing={3}>
        {filteredJobs.map(job => (
          <Grid item xs={12} key={job.id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{job.title}</Typography>
              <Typography variant="subtitle1" color="text.secondary">{job.company?.name || 'N/A'}</Typography>
              <Box sx={{ my: 1 }}>
                <Chip label={job.is_approved ? 'Approved' : 'Pending Approval'} color={job.is_approved ? 'success' : 'warning'} size="small" />
                <Chip label={job.is_verified ? 'Verified' : 'Not Verified'} color={job.is_verified ? 'info' : 'default'} size="small" sx={{ ml: 1 }} />
                <Chip label={job.is_active ? 'Active' : 'Inactive'} color={job.is_active ? 'primary' : 'default'} size="small" sx={{ ml: 1 }} />
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                {!job.is_approved && (
                  <Button variant="outlined" size="small" startIcon={<ApproveIcon />} onClick={() => handleUpdateJobStatus(job.id, { is_approved: true })}>
                    Approve
                  </Button>
                )}
                <Button variant="outlined" size="small" startIcon={<VerifyIcon />} onClick={() => handleUpdateJobStatus(job.id, { is_verified: !job.is_verified })}>
                  {job.is_verified ? 'Un-verify' : 'Verify'}
                </Button>
                <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => openEditDialog(job)}>Edit</Button>
                <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(job.id)}>Delete</Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      {selectedJob && (
        <EditJobDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          job={selectedJob}
          onSubmit={handleEditSubmit}
        />
      )}
    </Box>
  );
};

const EditJobDialog = ({ open, onClose, job, onSubmit }) => {
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job) {
      setFields({
        title: job.title || '',
        location: job.location || '',
        job_type: job.job_type || 'full-time',
        description: job.description || '',
        requirements: job.requirements || '',
        salary_range: job.salary_range || '',
        application_url: job.application_url || '',
        deadline: job.deadline ? job.deadline.split('T')[0] : '',
      });
    }
  }, [job]);

  const handleChange = (e) => {
    setFields(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(fields);
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Job: {job.title}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField name="title" label="Job Title" value={fields.title} onChange={handleChange} fullWidth margin="normal" />
          <TextField name="location" label="Location" value={fields.location} onChange={handleChange} fullWidth margin="normal" />
          <TextField name="description" label="Description" value={fields.description} onChange={handleChange} multiline rows={4} fullWidth margin="normal" />
          <TextField name="requirements" label="Requirements" value={fields.requirements} onChange={handleChange} multiline rows={3} fullWidth margin="normal" />
          <TextField name="salary_range" label="Salary Range" value={fields.salary_range} onChange={handleChange} fullWidth margin="normal" />
          <TextField name="application_url" label="Application URL" value={fields.application_url} onChange={handleChange} fullWidth margin="normal" />
          <TextField name="deadline" label="Deadline" type="date" value={fields.deadline} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default JobAdminPanel;              fullWidth sx={{ mb: 2 }}
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
