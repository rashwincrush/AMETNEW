import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { Box, Typography, Paper, TextField, Button, Alert, CircularProgress } from '@mui/material';

const JobApplyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      let uploadedResumeUrl = resumeUrl;
      if (file) {
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const filePath = `resumes/${Date.now()}-${file.name}`;
        const { data, error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file);
        if (uploadError) throw uploadError;
        uploadedResumeUrl = data.Key || data.path;
      }
      // Submit application
      const { error: insertError } = await supabase.from('job_applications').insert([
        {
          job_id: id,
          resume_url: uploadedResumeUrl,
          cover_letter: coverLetter
        }
      ]);
      if (insertError) throw insertError;
      setSuccess('Application submitted successfully!');
      setTimeout(() => navigate('/jobs'), 1500);
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', py: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Apply for this Job</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Resume URL (or upload below)"
            value={resumeUrl}
            onChange={e => setResumeUrl(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button variant="outlined" component="label" sx={{ mb: 2 }}>
            Upload Resume
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
          {file && <Typography variant="body2">Selected file: {file.name}</Typography>}
          <TextField
            label="Cover Letter (optional)"
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
            fullWidth
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth>
            {loading ? <CircularProgress size={24} /> : 'Submit Application'}
          </Button>
        </form>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Paper>
    </Box>
  );
};

export default JobApplyForm;
