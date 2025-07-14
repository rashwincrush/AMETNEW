import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Chip, 
  Divider, 
  Grid, 
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Container
} from '@mui/material';
import { 
  Event as EventIcon, 
  LocationOn as LocationIcon, 
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  EventAvailable as EventAvailableIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import { format, parseISO, isPast, isFuture } from 'date-fns';

const EventDetail = ({ isAdmin = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [userRsvp, setUserRsvp] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    fetchEvent();
    fetchCurrentUser();
    
    // Set up real-time subscription for this specific event
    const channel = supabase
      .channel(`event-detail-${id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'events',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Real-time change for event detail received:', payload);
          fetchEvent();
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchUserRsvp(user.id);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchUserRsvp = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      
      setUserRsvp(data || null);
    } catch (err) {
      console.error('Error fetching user RSVP:', err);
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
      
      // Fetch attendees
      await fetchAttendees(eventData.id);
      
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async (eventId) => {
    try {
      // First, get the event RSVPs
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select('id, status, created_at, user_id')
        .eq('event_id', eventId)
        .eq('status', 'going');

      if (rsvpError) throw rsvpError;
      
      if (rsvpData && rsvpData.length > 0) {
        // Get user profiles for the RSVPs
        const userIds = rsvpData.map(rsvp => rsvp.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, current_position, current_company')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const attendeesWithProfiles = rsvpData.map(rsvp => {
          const profile = profilesData.find(p => p.id === rsvp.user_id) || {};
          return {
            ...rsvp,
            profiles: profile
          };
        });

        setAttendees(attendeesWithProfiles || []);
      } else {
        setAttendees([]);
      }
    } catch (err) {
      console.error('Error fetching attendees:', err);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      // First delete all RSVPs for this event
      const { error: rsvpError } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', id);

      if (rsvpError) throw rsvpError;
      
      // Then delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (eventError) throw eventError;
      
      navigate('/events', { replace: true, state: { message: 'Event deleted successfully' } });
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event');
      setLoading(false);
    }
  };

  const handleRsvp = async (status) => {
    try {
      if (!currentUserId) {
        navigate('/login', { state: { from: `/events/${id}` } });
        return;
      }

      setRsvpLoading(true);

      if (userRsvp) {
        // Update existing RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .update({ 
            status,
            updated_at: new Date().toISOString() 
          })
          .eq('id', userRsvp.id);

        if (error) throw error;
      } else {
        // Create new RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .insert([{ 
            event_id: id, 
            user_id: currentUserId, 
            status,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      setRsvpSuccess(`Successfully ${status === 'going' ? 'RSVPed' : 'marked as not going'}!`);
      fetchUserRsvp(currentUserId);
      fetchAttendees(id);
      
    } catch (err) {
      console.error('Error updating RSVP:', err);
      setError('Failed to update your RSVP');
    } finally {
      setRsvpLoading(false);
    }
  };

  const getEventStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isPast(end)) return { text: 'Past Event', color: 'default' };
    if (isFuture(start)) return { text: 'Upcoming Event', color: 'info' };
    return { text: 'Happening Now', color: 'success' };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={fetchEvent}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Events
        </Button>
      </Paper>
    );
  }

  if (!event) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>Event not found</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          component={Link} 
          to="/events"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Events
        </Button>
      </Paper>
    );
  }

  const status = getEventStatus(event.start_date, event.end_date);
  const isPastEvent = isPast(new Date(event.end_date));
  const registrationOpen = !isPastEvent && 
    (!event.registration_deadline || new Date() < new Date(event.registration_deadline));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button 
        component={Link} 
        to="/events" 
        startIcon={<ArrowBackIcon />} 
        sx={{ mb: 3 }}
      >
        Back to Events
      </Button>

      <Paper elevation={3} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box 
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: { xs: 3, md: 4 },
            position: 'relative',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
            <Chip 
              label={status.text} 
              color={status.color} 
              size="small"
              sx={{ color: 'white', fontWeight: 'medium' }}
            />
          </Box>
          
          <Typography variant="h3" component="h1" sx={{ mb: 2, fontWeight: 'bold' }}>
            {event.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">
                {format(parseISO(event.start_date), 'EEEE, MMMM d, yyyy')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon sx={{ mr: 1 }} />
              <Typography variant="body1">
                {format(parseISO(event.start_date), 'h:mm a')} - {format(parseISO(event.end_date), 'h:mm a')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationIcon sx={{ mr: 1 }} />
              <Typography variant="body1">{event.location}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 3, md: 4 } }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  About This Event
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                  {event.description}
                </Typography>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Event Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      <EventIcon color="action" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Event Type</Typography>
                        <Typography variant="body1">
                          {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      <PeopleIcon color="action" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Capacity</Typography>
                        <Typography variant="body1">
                          {event.max_attendees ? `${attendees.length} / ${event.max_attendees} attending` : 'Unlimited'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  {event.registration_deadline && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <EventAvailableIcon color="action" sx={{ mr: 2 }} />
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">Registration Deadline</Typography>
                          <Typography variant="body1">
                            {format(parseISO(event.registration_deadline), 'MMMM d, yyyy h:mm a')}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {event.organizer && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <PersonIcon color="action" sx={{ mr: 2 }} />
                        <Box>
                          <Typography variant="subtitle2" color="textSecondary">Organizer</Typography>
                          <Typography variant="body1">{event.organizer}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {event.additional_info && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Additional Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {event.additional_info}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Register for this event
                </Typography>
                
                {isPastEvent ? (
                  <Box>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      This event has already ended.
                    </Alert>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      component={Link}
                      to={`/events/${id}/feedback`}
                      sx={{ mb: 2 }}
                      startIcon={<EventAvailableIcon />}
                    >
                      Provide Feedback
                    </Button>
                  </Box>
                ) : !registrationOpen ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Registration for this event is closed.
                  </Alert>
                ) : userRsvp ? (
                  <Box>
                    <Alert 
                      severity={userRsvp.status === 'going' ? 'success' : 'info'}
                      sx={{ mb: 2 }}
                    >
                      You've marked yourself as <strong>{userRsvp.status}</strong> for this event.
                    </Alert>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Change your response:
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Let us know if you'll be attending this event.
                  </Typography>
                )}

                {!isPastEvent && registrationOpen && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant={userRsvp?.status === 'going' ? 'contained' : 'outlined'}
                      color="primary"
                      fullWidth
                      onClick={() => handleRsvp('going')}
                      disabled={rsvpLoading}
                      startIcon={userRsvp?.status === 'going' ? <CheckCircleIcon /> : null}
                    >
                      {rsvpLoading && userRsvp?.status !== 'going' ? 'Updating...' : 'Going'}
                    </Button>
                    
                    <Button
                      variant={userRsvp?.status === 'not_going' ? 'contained' : 'outlined'}
                      color="secondary"
                      fullWidth
                      onClick={() => handleRsvp('not_going')}
                      disabled={rsvpLoading}
                      startIcon={userRsvp?.status === 'not_going' ? <CancelIcon /> : null}
                    >
                      {rsvpLoading && userRsvp?.status !== 'not_going' ? 'Updating...' : 'Not Going'}
                    </Button>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Share this event:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <IconButton 
                    color="primary" 
                    size="small"
                    onClick={() => {
                      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(event.title)}`;
                      window.open(url, '_blank', 'width=600,height=400');
                    }}
                    aria-label="Share on Facebook"
                  >
                    <FacebookIcon />
                  </IconButton>
                  <IconButton 
                    color="primary" 
                    size="small"
                    onClick={() => {
                      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this event: ${event.title}`)}&url=${encodeURIComponent(window.location.href)}`;
                      window.open(url, '_blank', 'width=600,height=400');
                    }}
                    aria-label="Share on Twitter"
                  >
                    <TwitterIcon />
                  </IconButton>
                  <IconButton 
                    color="primary" 
                    size="small"
                    onClick={() => {
                      const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
                      window.open(url, '_blank', 'width=600,height=400');
                    }}
                    aria-label="Share on LinkedIn"
                  >
                    <LinkedInIcon />
                  </IconButton>
                  <IconButton 
                    color="primary" 
                    size="small"
                    onClick={() => {
                      const subject = encodeURIComponent(`AMET Alumni Event: ${event.title}`);
                      const body = encodeURIComponent(`Check out this event: ${event.title}\n\nDate: ${format(parseISO(event.start_date), 'MMMM d, yyyy')}\nTime: ${format(parseISO(event.start_date), 'h:mm a')} - ${format(parseISO(event.end_date), 'h:mm a')}\nLocation: ${event.location}\n\nDetails: ${window.location.href}`);
                      window.location.href = `mailto:?subject=${subject}&body=${body}`;
                    }}
                    aria-label="Share via Email"
                  >
                    <EmailIcon />
                  </IconButton>
                </Box>

                {isAdmin && (
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Admin Actions:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        component={Link}
                        to={`/events/${event.id}/edit`}
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<EditIcon />}
                      >
                        Edit Event
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        Delete Event
                      </Button>
                      {isPast(new Date(event.end_date || event.event_date)) && (
                        <Button
                          component={Link}
                          to={`/events/${event.id}/feedback-dashboard`}
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<AssessmentIcon />}
                        >
                          View Feedback
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
              </Paper>

              {attendees.length > 0 && (
                <Paper elevation={0} sx={{ mt: 3, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Who's Going ({attendees.length})
                  </Typography>
                  <List dense>
                    {attendees.slice(0, 5).map((rsvp) => (
                      <ListItem key={rsvp.id}>
                        <ListItemAvatar>
                          <Avatar 
                            src={rsvp.profiles.avatar_url} 
                            alt={rsvp.profiles.full_name}
                          >
                            {rsvp.profiles.full_name ? rsvp.profiles.full_name.charAt(0) : 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={rsvp.profiles.full_name || 'Anonymous User'} 
                          secondary={rsvp.profiles.current_position || ''}
                        />
                        {rsvp.status === 'going' && (
                          <CheckCircleIcon color="success" fontSize="small" />
                        )}
                      </ListItem>
                    ))}
                    {attendees.length > 5 && (
                      <Button 
                        fullWidth 
                        size="small" 
                        sx={{ mt: 1 }}
                        onClick={() => {/* TODO: Show all attendees */}}
                      >
                        View all {attendees.length} attendees
                      </Button>
                    )}
                  </List>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete Event?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this event? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* RSVP Success Snackbar */}
      <Snackbar
        open={!!rsvpSuccess}
        autoHideDuration={6000}
        onClose={() => setRsvpSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setRsvpSuccess('')} severity="success" sx={{ width: '100%' }}>
          {rsvpSuccess}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EventDetail;
