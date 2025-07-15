import React, { useState } from 'react';
import { Box, Button, Modal, TextField, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const FeedbackWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const feedbackData = {
      user_id: user?.id || null,
      name: user?.profile?.full_name || 'Anonymous',
      email: user?.email || 'N/A',
      page_url: window.location.href,
      feedback_type: feedbackType,
      message: message,
    };

    try {
      const { error } = await supabase.from('feedback').insert([feedbackData]);
      if (error) throw error;
      toast.success('Thank you for your feedback!');
      handleClose();
      setMessage('');
    } catch (error) {
      toast.error(`Failed to submit feedback: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          borderRadius: '50px',
          zIndex: 1000,
        }}
      >
        Feedback
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Typography variant="h6" component="h2">Submit Feedback</Typography>
          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Feedback Type</InputLabel>
              <Select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                label="Feedback Type"
              >
                <MenuItem value="bug">Bug Report</MenuItem>
                <MenuItem value="feature_request">Feature Request</MenuItem>
                <MenuItem value="general">General Comment</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Your Feedback"
              multiline
              rows={4}
              fullWidth
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              margin="normal"
            />
            <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </Box>
      </Modal>
    </>
  );
};

export default FeedbackWidget;
