import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Rating,
  FormControl,
  FormLabel,
  FormControlLabel,
  Radio,
  RadioGroup,
  Snackbar,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  SentimentVerySatisfied as HappyIcon,
  SentimentVeryDissatisfied as SadIcon,
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

const EventFeedback = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userFeedback, setUserFeedback] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchEvent();
    fetchCurrentUser();
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchUserFeedback(user.id);
      } else {
        // Redirect to login if not authenticated
        navigate('/login', { state: { from: `/events/${id}/feedback` } });
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setError('You must be logged in to provide feedback');
    }
  };

  const fetchUserFeedback = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('event_feedback')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      
      if (data) {
        // Pre-fill form with existing feedback
        setUserFeedback(data);
        setRating(data.rating);
        setWouldRecommend(data.would_recommend);
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Error fetching user feedback:', err);
    }
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error('Event not found');

      setEvent(eventData);
      
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const feedbackData = {
        event_id: id,
        user_id: currentUserId,
        rating,
        would_recommend: wouldRecommend,
        comments,
        created_at: new Date().toISOString()
      };
      
      if (userFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from('event_feedback')
          .update({
            ...feedbackData,
            updated_at: new Date().toISOString()
          })
          .eq('id', userFeedback.id);

        if (error) throw error;
        setSuccess('Your feedback has been updated!');
      } else {
        // Create new feedback
        const { error } = await supabase
          .from('event_feedback')
          .insert([feedbackData]);

        if (error) throw error;
        setSuccess('Thank you for your feedback!');
      }
      
      // Refresh user feedback
      fetchUserFeedback(currentUserId);
      
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !event) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => navigate('/events')}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Events
        </Button>
      </Paper>
    );
  }

  const isPastEvent = new Date(event.end_date) < new Date();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      <Button 
        onClick={() => navigate(`/events/${id}`)}
        startIcon={<ArrowBackIcon />} 
        sx={{ mb: 3 }}
      >
        Back to Event
      </Button>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Event Feedback
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          {event.title}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        {!isPastEvent ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            This event hasn't ended yet. You can provide feedback after the event has concluded.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Box sx={{ mb: 4 }}>
              <FormLabel component="legend" sx={{ mb: 1 }}>
                How would you rate this event?
              </FormLabel>
              <Rating
                name="event-rating"
                value={rating}
                onChange={(_, newValue) => setRating(newValue)}
                size="large"
                precision={0.5}
                sx={{ fontSize: '2rem' }}
              />
            </Box>
            
            <FormControl component="fieldset" sx={{ mb: 4 }}>
              <FormLabel component="legend">Would you recommend this event to others?</FormLabel>
              <RadioGroup
                row
                name="would-recommend"
                value={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.value)}
              >
                <FormControlLabel 
                  value="yes" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <HappyIcon color="success" sx={{ mr: 0.5 }} />
                      Yes
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="no" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SadIcon color="error" sx={{ mr: 0.5 }} />
                      No
                    </Box>
                  } 
                />
              </RadioGroup>
            </FormControl>
            
            <TextField
              label="Additional Comments"
              multiline
              rows={4}
              fullWidth
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share your thoughts about this event..."
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : userFeedback ? 'Update Feedback' : 'Submit Feedback'}
              </Button>
              
              {isAdmin && (
                <Button
                  component={Link}
                  to={`/events/${id}/feedback-dashboard`}
                  variant="outlined"
                  color="secondary"
                  startIcon={<AssessmentIcon />}
                >
                  View All Feedback
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Paper>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!error && !!event} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EventFeedback;
