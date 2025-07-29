import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Box, TextField, Button, Typography, Paper, Grid, CircularProgress, MenuItem, Alert, Switch, FormControlLabel } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getUserRole } = useAuth();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const userRole = getUserRole();

  const fetchJob = useCallback(async () => {
    if (!user) {
      setLoading(false);
      toast.error('You must be logged in to edit a job.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Job not found.');

      const canEdit = data.posted_by === user.id || ['employer', 'admin', 'super_admin'].includes(userRole);
      if (!canEdit) {
        toast.error('You are not authorized to edit this job.');
        navigate(`/jobs/${id}`);
        return;
      }

      setFormData(data);
    } catch (err) {
      console.error('Error fetching job:', err);
      setError(err.message);
      toast.error('Failed to load job data.');
    } finally {
      setLoading(false);
    }
  }, [id, user, userRole, navigate]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { id: jobId, created_at, posted_by, company_id, ...updateData } = formData;

    if (!['admin', 'super_admin'].includes(userRole)) {
        delete updateData.is_approved;
        delete updateData.is_featured;
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Job updated successfully!');
      navigate(`/jobs/${id}`);
    } catch (err) {
      console.error('Error updating job:', err);
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !formData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Could not load job data.'}</Alert>
        <Button variant="contained" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back to Job Details
      </Button>
      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Edit Job
        </Typography>
        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField required fullWidth label="Job Title" name="title" value={formData.title || ''} onChange={handleChange} disabled={isSubmitting} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField select required fullWidth label="Job Type" name="job_type" value={formData.job_type || 'Full-time'} onChange={handleChange} disabled={isSubmitting}>
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Internship">Internship</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField required fullWidth label="Location" name="location" value={formData.location || ''} onChange={handleChange} disabled={isSubmitting} />
            </Grid>

            <Grid item xs={12}>
              <TextField required fullWidth multiline rows={4} label="Job Description" name="description" value={formData.description || ''} onChange={handleChange} disabled={isSubmitting} />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Requirements" name="requirements" value={Array.isArray(formData.requirements) ? formData.requirements.join(', ') : formData.requirements || ''} onChange={handleChange} disabled={isSubmitting} helperText="Separate items with commas" />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Responsibilities" name="responsibilities" value={Array.isArray(formData.responsibilities) ? formData.responsibilities.join(', ') : formData.responsibilities || ''} onChange={handleChange} disabled={isSubmitting} helperText="Separate items with commas" />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Salary Range (e.g., $80k - $120k)" name="salary_range" value={formData.salary_range || ''} onChange={handleChange} disabled={isSubmitting} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField type="date" fullWidth label="Application Deadline" name="deadline" value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''} onChange={handleChange} InputLabelProps={{ shrink: true }} disabled={isSubmitting} />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth label="Application URL or Email" name="application_url" value={formData.application_url || ''} onChange={handleChange} disabled={isSubmitting} />
            </Grid>

            {['admin', 'super_admin'].includes(userRole) && (
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>Admin Controls</Typography>
                <FormControlLabel control={<Switch checked={formData.is_approved || false} onChange={handleChange} name="is_approved" />} label="Is Approved" disabled={isSubmitting} />
                <FormControlLabel control={<Switch checked={formData.is_featured || false} onChange={handleChange} name="is_featured" />} label="Is Featured" disabled={isSubmitting} />
                <FormControlLabel control={<Switch checked={formData.is_active !== false} onChange={handleChange} name="is_active" />} label="Is Active" disabled={isSubmitting} />
              </Grid>
            )}

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button variant="outlined" color="secondary" onClick={() => navigate(`/jobs/${id}`)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default EditJob;
