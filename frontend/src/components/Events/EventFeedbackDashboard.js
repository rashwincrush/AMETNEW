import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Divider,
  Alert,
  Rating,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  BarChart as BarChartIcon,
  ChatBubble as ChatBubbleIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  FileDownload as FileDownloadIcon,
  Person as PersonIcon,
  Event as EventIcon
} from '@mui/icons-material';
import LoadingSpinner from '../common/LoadingSpinner';

const EventFeedbackDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [event, setEvent] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalResponses: 0,
    commentsCount: 0
  });
  
  // Use a ref to track mounted state to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Set up cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Centralized data fetching and permission check
  useEffect(() => {
    // Track if the component is mounted
    isMounted.current = true;
    console.log('DEBUG: useEffect triggered with id:', id);
    
    if (!user) {
      console.log('DEBUG: No user, redirecting to login');
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    const fetchAllData = async () => {
      try {
        if (!isMounted.current) return;
        
        console.log('DEBUG: Starting data fetch, setting loading state to true');
        setLoading(true);
        setError(null); // Reset any previous errors

        // Fetch event data
        console.log('DEBUG: Fetching event data for id:', id);
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        // Handle event data errors
        if (eventError) {
          console.error('DEBUG: Error fetching event:', eventError);
          throw eventError;
        }
        
        if (!eventData) {
          console.error('DEBUG: Event not found');
          throw new Error('Event not found');
        }

        // Check permissions
        if (!isAdmin && eventData.organizer_id !== user.id) {
          console.log('DEBUG: Permission denied, redirecting');
          navigate('/events', {
            state: { error: 'You do not have permission to view this feedback dashboard' },
          });
          return;
        }

        // Update event state
        if (isMounted.current) {
          console.log('DEBUG: Setting event state:', eventData);
          setEvent(eventData);
          
          // Wait for state update to complete
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Fetch feedback after event is set
        if (isMounted.current) {
          console.log('DEBUG: Now fetching feedback data');
          await fetchFeedback();
          console.log('DEBUG: Feedback fetch completed');
        }
      } catch (err) {
        if (isMounted.current) {
          console.error('DEBUG: Error in fetchAllData:', err);
          setError(err.message || 'Failed to load data');
          setLoading(false);
        }
      }
    };

    // Ensure loading is always set to false even if an error occurs
    // Execute data fetch and handle any unhandled errors
    fetchAllData().catch(err => {
      console.error('Unhandled error in data fetching:', err);
      if (isMounted.current) {
        setLoading(false);
        setError('An unexpected error occurred. Please try again.');
      }
    });

    // Cleanup function
    return () => {
      console.log('DEBUG: Component unmounting, cleaning up');
      isMounted.current = false;
    };
  }, [id, user, isAdmin, navigate]);

  const fetchFeedback = async () => {
    try {
      console.log('DEBUG: Starting fetchFeedback for event_id:', id);
      
      // Step 1: Fetch all feedback for the event.
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('event_feedback')
        .select('id, rating, comments, submitted_at, user_id')
        .eq('event_id', id)
        .order('submitted_at', { ascending: false });
      
      console.log('DEBUG: Feedback query response:', { feedbackData, feedbackError });

      if (feedbackError) {
        console.error('DEBUG: Feedback query error:', feedbackError);
        throw feedbackError;
      }

      if (!feedbackData || feedbackData.length === 0) {
        console.log('DEBUG: No feedback data found');
        if (isMounted.current) {
          setFeedback([]);
          setStats({
            averageRating: 0,
            totalResponses: 0,
            commentsCount: 0
          });
          setError('No feedback found for this event');
          setLoading(false); // Explicitly set loading to false here
        }
        return; // Exit early, finally block will still run.
      }

      // Step 2: Get the unique, non-null user IDs from the feedback.
      // Get the unique, non-null user IDs from the feedback
      console.log('DEBUG: Processing feedback data:', feedbackData);
      const userIds = [...new Set(feedbackData.map(item => item.user_id).filter(Boolean))];
      console.log('DEBUG: Found userIds:', userIds);
      
      let profileData = [];
      if (userIds.length > 0) {
        // Step 3: Fetch the profiles for those users.
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        if (profileError) {
          // Log the error but don't block rendering feedback.
          console.error('Error fetching profiles:', profileError);
        } else {
          profileData = data;
        }
      }

      // Step 4: Combine the feedback with the profile data.
      const transformedData = feedbackData.map(item => {
        const profile = profileData.find(p => p.id === item.user_id);
        return {
          ...item,
          profiles: profile || { full_name: 'Anonymous User', avatar_url: null },
        };
      });
      
      console.log('DEBUG: Final transformed feedback data:', transformedData);
      
      // Force a synchronous state update to avoid race conditions
      if (isMounted.current) {
        try {
          console.log('DEBUG: Setting feedback state to:', transformedData);
          setFeedback([...transformedData]);
          
          // Immediately calculate stats with the same data to ensure consistency
          const statsData = {
            averageRating: transformedData.reduce((sum, item) => sum + (item.rating || 0), 0) / 
                        (transformedData.length || 1),
            totalResponses: transformedData.length,
            commentsCount: transformedData.filter(item => item.comments && item.comments.trim() !== '').length
          };
          
          console.log('DEBUG: Calculated stats directly:', statsData);
          setStats(statsData);
          
          // Explicitly set loading to false
          setLoading(false);
          
          console.log('DEBUG: State updates completed');
        } catch (err) {
          console.error('Error updating state:', err);
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to load feedback');
      }
      // Re-throw the error so the calling function's catch block is triggered
      throw err;
    }
  };

  const calculateStats = (feedbackData) => {
    if (!feedbackData || feedbackData.length === 0) return;

    const totalResponses = feedbackData.length;
    const totalRating = feedbackData.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = totalResponses > 0 ? (totalRating / totalResponses) : 0;
    const commentsCount = feedbackData.filter(item => item.comments && item.comments.trim() !== '').length;

    if (isMounted.current) {
      setStats({
        averageRating: averageRating.toFixed(1),
        totalResponses,
        commentsCount
      });
    }
  };

  const exportFeedbackCSV = () => {
    if (feedback.length === 0) return;

    const headers = ['Date', 'Name', 'Rating', 'Comments'];
    const rows = feedback.map(item => [
      new Date(item.submitted_at).toLocaleDateString(),
      item.profiles?.full_name || 'Anonymous',
      item.rating,
      `"${item.comments ? item.comments.replace(/"/g, '""') : ''}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.title}_feedback.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add debugging before render
  console.log('DEBUG: Current feedback state:', feedback);
  console.log('DEBUG: Current stats:', stats);
  console.log('DEBUG: Current event:', event);
  console.log('DEBUG: Loading state:', loading);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        component={Link}
        to={`/events/${id}`}
        sx={{ mb: 3 }}
        color="primary"
      >
        Back to Event
      </Button>

      {loading ? (
        <LoadingSpinner message="Loading feedback data..." />
      ) : error ? (
        <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
      ) : (
        <>
          {/* Event Header */}
          <Paper elevation={1} sx={{ mb: 4, overflow: 'hidden', borderRadius: 2 }}>
            <Box p={3} borderBottom={1} borderColor="divider">
              <Typography variant="h4" component="h1" gutterBottom>
                {event.title}
              </Typography>
              <Typography color="text.secondary">
                {event.description}
              </Typography>
            </Box>
            <Box p={3} bgcolor="grey.50">
              <Typography variant="h5" component="h2" gutterBottom>
                Feedback Dashboard
              </Typography>
              <Typography color="text.secondary">
                View and analyze feedback from attendees for this event.
              </Typography>
            </Box>
          </Paper>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Average Rating */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <StarIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h3">
                      Average Rating
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="baseline">
                    <Typography variant="h3" component="p" fontWeight="bold">
                      {stats.averageRating}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" ml={1}>
                      / 5
                    </Typography>
                  </Box>
                  <Rating
                    value={stats.averageRating}
                    precision={0.5}
                    readOnly
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Total Responses */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <BarChartIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h3">
                      Total Responses
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="p" fontWeight="bold">
                    {stats.totalResponses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Feedback submissions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Comments */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={1} sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <ChatBubbleIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="h3">
                      Comments
                    </Typography>
                  </Box>
                  <Typography variant="h3" component="p" fontWeight="bold">
                    {stats.commentsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Written feedback received
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Export Button */}
          <Box display="flex" justifyContent="flex-end" mb={3}>
    
          </Box>

          {/* Feedback List */}
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box p={3} borderBottom={1} borderColor="divider">
              <Typography variant="h6" component="h3">
                All Feedback
              </Typography>
            </Box>

            <List disablePadding>
              {feedback.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{ py: 2, px: 3 }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={item.profiles?.avatar_url}
                        alt={item.profiles?.full_name || 'User'}
                      >
                        {(item.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1">
                            {item.profiles?.full_name || 'Anonymous User'}
                          </Typography>
                          <Box display="flex" alignItems="center">
                            <Rating value={item.rating} readOnly size="small" />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'No date available'}
                          </Typography>
                          {item.comments && (
                            <Paper
                              variant="outlined"
                              sx={{ mt: 1, p: 2, bgcolor: 'grey.50' }}
                            >
                              <Typography variant="body2">{item.comments}</Typography>
                            </Paper>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default EventFeedbackDashboard;
