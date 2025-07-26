import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, useRealtime } from '../../utils/supabase';
import { 
  Box, 
  Button, 
  Card,
  CardMedia,
  CardContent, 
  CardActions, 
  Typography, 
  Grid, 
  Chip,
  Container,
  Paper,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  Event as EventIcon, 
  LocationOn as LocationIcon, 
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import EventCalendar from './EventCalendar';
import { parseISO, isPast, isToday, isFuture, isThisWeek, format } from 'date-fns';
import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz';

const EventsList = ({ isAdmin = false }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('upcoming');
  const [eventType, setEventType] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list' or 'calendar'
  const subscriptionRef = useRef(null);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Keep track of subscription status to prevent duplicate subscriptions
  const subscriptionStatusRef = useRef({ isSubscribing: false, isActive: false, isUnmounting: false });
  
  // Handle channel status changes separately from setup
  const handleChannelStatus = useCallback((status, err) => {
    // Only process status updates if the component is still mounted
    // This helps avoid state updates after unmounting
    if (status === 'SUBSCRIBED') {
      console.log('Successfully subscribed to events and rsvps channel!');
      subscriptionStatusRef.current.isActive = true;
      subscriptionStatusRef.current.isSubscribing = false;
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Channel error:', err || 'Unknown connection error');
      subscriptionStatusRef.current.isActive = false;
      subscriptionStatusRef.current.isSubscribing = false;
    } else if (status === 'CLOSED') {
      // This is normal during cleanup, so only log when not during unmount
      if (subscriptionStatusRef.current.isUnmounting !== true) {
        console.warn('Channel closed unexpectedly');
      }
      subscriptionStatusRef.current.isActive = false;
      subscriptionStatusRef.current.isSubscribing = false;
    }
  }, []);
  
  // Access realtime connection status and helper from our custom hook
  const { isRealtimeReady, setupRealtimeSubscription: checkRealtimeConnection } = useRealtime();
  
  // Set up real-time subscription with connection status check and fallback support
  const setupRealtimeSubscription = useCallback(async () => {
    // Prevent duplicate subscription attempts
    if (subscriptionStatusRef.current.isSubscribing) {
      console.log('Subscription setup already in progress, skipping');
      return;
    }
    
    // If we already have an active subscription, don't create another one
    if (subscriptionStatusRef.current.isActive && subscriptionRef.current) {
      console.log('Subscription already active, skipping setup');
      return;
    }
    
    subscriptionStatusRef.current.isSubscribing = true;
    
    try {
      // First, wait for realtime connection to be ready, with fallback option
      console.log('Checking if realtime connection is ready...');
      const connectionSuccess = await checkRealtimeConnection('events-list', { allowFallback: true })
        .catch(err => {
          console.warn('Realtime check failed but continuing in fallback mode:', err);
          return false; // Continue in fallback mode
        });
      
      if (connectionSuccess) {
        console.log('Realtime connection confirmed ready, creating subscription');
        
        // Clean up any existing subscription first
        if (subscriptionRef.current) {
          console.log('Removing existing channel before creating new one');
          await supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
        }
        
        // Create a new subscription
        const channel = supabase
          .channel('events-list-subscription')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'events' },
            (payload) => {
              console.log('Real-time change received for events:', payload);
              fetchEvents();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'event_rsvps' },
            (payload) => {
              console.log('Real-time change received for rsvps:', payload);
              fetchEvents();
            }
          )
          .subscribe(handleChannelStatus);

        subscriptionRef.current = channel;
      } else {
        console.log('Operating in non-realtime mode for events - updates will require manual refresh');
        // Could add a visual indicator here that realtime is disabled
      }
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      // Allow the component to continue working without realtime
      console.log('Continuing without realtime updates for events');
    } finally {
      subscriptionStatusRef.current.isSubscribing = false;
      // Don't mark as active if we didn't actually set up a subscription
      if (subscriptionRef.current) {
        subscriptionStatusRef.current.isActive = true;
      }
    }
  }, [handleChannelStatus, checkRealtimeConnection]);
  
  useEffect(() => {
    fetchEvents();
    
    // Initialize the subscription
    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      const cleanupSubscription = async () => {
        try {
          // Mark component as unmounting to prevent unnecessary warnings
          subscriptionStatusRef.current.isUnmounting = true;
          
          if (subscriptionRef.current) {
            console.log('Cleaning up events subscription...');
            // Mark subscription as inactive before removal
            subscriptionStatusRef.current.isActive = false;
            subscriptionStatusRef.current.isSubscribing = false;
            
            // Use a try-catch within the async function to handle connection errors
            try {
              await supabase.removeChannel(subscriptionRef.current);
            } catch (removeError) {
              // Silently handle WebSocket closed errors during unmount
              if (removeError?.message?.includes('WebSocket') || 
                  removeError?.message?.includes('connection')) {
                // Expected during navigation, no need to log
              } else {
                console.error('Error removing channel:', removeError);
              }
            }
            
            subscriptionRef.current = null;
          }
        } catch (error) {
          // Only log critical errors
          if (error?.name !== 'AbortError') {
            console.error('Error cleaning up subscription:', error);
          }
        }
      };
      
      cleanupSubscription();
    };
  }, [filter, eventType, setupRealtimeSubscription]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      let query = supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      // Apply filters
      const now = new Date().toISOString();
      if (filter === 'upcoming') {
        query = query.gt('start_date', now);
      } else if (filter === 'past') {
        query = query.lt('end_date', now);
      } else if (filter === 'today') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        query = query.gte('start_date', todayStart.toISOString())
                    .lte('end_date', todayEnd.toISOString());
      }

      if (eventType !== 'all') {
        query = query.eq('event_type', eventType);
      }

      const { data: eventsData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (eventsData && eventsData.length > 0) {
        const eventIds = eventsData.map(e => e.id);

        const { data: rsvpData, error: rsvpError } = await supabase
          .from('event_rsvps')
          .select('event_id')
          .in('event_id', eventIds)
          .eq('attendance_status', 'going');

        if (rsvpError) {
          console.error('Error fetching RSVP counts:', rsvpError);
        } else {
          const counts = rsvpData.reduce((acc, rsvp) => {
            acc[rsvp.event_id] = (acc[rsvp.event_id] || 0) + 1;
            return acc;
          }, {});

          const eventsWithCounts = eventsData.map(event => ({
            ...event,
            attendees_count: counts[event.id] || 0,
          }));

          setEvents(eventsWithCounts);
          return;
        }
      }

      setEvents(eventsData || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isPast(end)) return 'Past';
    if (isFuture(start)) return 'Upcoming';
    if (isToday(start) || isThisWeek(start) || (now >= start && now <= end)) return 'Happening Now';
    return 'Scheduled';
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'happening now':
        return 'success';
      case 'upcoming':
        return 'info';
      case 'past':
        return 'default';
      default:
        return 'primary';
    }
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner message="Loading events..." />;
  }

  if (error) {
    return (
      <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={fetchEvents} variant="outlined" sx={{ mt: 2 }}>
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Events
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(event, newViewMode) => {
              if (newViewMode !== null) {
                setViewMode(newViewMode);
              }
            }}
            aria-label="view mode"
          >
            <ToggleButton value="grid" aria-label="grid view">
              <ViewModuleIcon />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ViewListIcon />
            </ToggleButton>
            <ToggleButton value="calendar" aria-label="calendar view">
              <CalendarIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          {isAdmin && (
            <Button 
              component={Link} 
              to="/events/new" 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
            >
              Create Event
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter and Search Controls */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search events by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filter}
                onChange={handleFilterChange}
                label="Filter by Status"
              >
                <MenuItem value="all">All Events</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="past">Past Events</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                label="Event Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="workshop">Workshop</MenuItem>
                <MenuItem value="conference">Conference</MenuItem>
                <MenuItem value="networking">Networking</MenuItem>
                <MenuItem value="seminar">Seminar</MenuItem>
                <MenuItem value="webinar">Webinar</MenuItem>
                <MenuItem value="social">Social</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {filteredEvents.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
          <EventIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No events found
          </Typography>
          <Typography color="textSecondary" paragraph>
            {searchTerm || filter !== 'all' || eventType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Check back later for upcoming events'}
          </Typography>
          {(searchTerm || filter !== 'all' || eventType !== 'all') && (
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
                setEventType('all');
              }}
            >
              Clear all filters
            </Button>
          )}
        </Paper>
      ) : (
        <Box>
          {viewMode === 'grid' ? (
            <Grid container spacing={3}>
              {filteredEvents.map((event) => {
                const status = getEventStatus(event.start_date, event.end_date);
                const statusColor = getStatusColor(status);
                return (
                  <Grid item xs={12} sm={6} md={4} key={event.id}>
                    <Card 
                      elevation={2} 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                      }}
                    >
                      {event.featured_image_url && (
                        <CardMedia
                          component="img"
                          height="140"
                          image={event.featured_image_url}
                          alt={event.title}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip label={event.event_type || 'General'} size="small" sx={{ bgcolor: 'secondary.light', color: 'white' }} />
                          <Chip label={status} color={statusColor} size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                          <CalendarIcon sx={{ mr: 1, fontSize: '1rem' }} />
                          <Typography variant="body2">
                            {(() => {
                              const istZone = 'Asia/Kolkata';
                              const startDateIST = utcToZonedTime(parseISO(event.start_date), istZone);
                              return `${format(startDateIST, 'MMM d, yyyy')} at ${format(startDateIST, 'h:mm a')}`;
                            })()}
                          </Typography>
                        </Box>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 1, flexGrow: 1 }}>
                          {event.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                          {event.short_description ? event.short_description.substring(0, 100) + '...' : (event.description ? event.description.substring(0, 100) + '...' : 'No description available.')}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <PeopleIcon sx={{ mr: 1, fontSize: '1rem' }} />
                          <Typography variant="body2">
                            {event.attendees_count || 0} Attendees
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
                        <Button 
                          component={Link} 
                          to={`/events/${event.id}`} 
                          size="small" 
                          variant="contained" 
                          color="primary"
                        >
                          View Details
                        </Button>
                        {isAdmin && (
                          <Button 
                            component={Link} 
                            to={`/events/${event.id}/edit`} 
                            size="small" 
                            variant="outlined" 
                            color="secondary"
                          >
                            Edit
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : viewMode === 'list' ? (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <List disablePadding>
                {filteredEvents.map((event, index) => {
                  const status = getEventStatus(event.start_date, event.end_date);
                  const statusColor = getStatusColor(status);
                  return (
                    <React.Fragment key={event.id}>
                      <ListItem 
                        alignItems="flex-start"
                        secondaryAction={
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                            <Chip label={status} color={statusColor} size="small" />
                            <Box sx={{ mt: 1 }}>
                              <Button component={Link} to={`/events/${event.id}`} size="small">Details</Button>
                              {isAdmin && <Button component={Link} to={`/events/${event.id}/edit`} size="small" color="secondary">Edit</Button>}
                            </Box>
                          </Box>
                        }
                        sx={{ 
                          py: 2,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <CalendarIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="h6" component="span">{event.title}</Typography>}
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="text.primary">
                                {format(parseISO(event.start_date), 'EEEE, MMM d, yyyy')} at {format(parseISO(event.start_date), 'h:mm a')}
                              </Typography>
                              <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <LocationIcon fontSize="small" sx={{ mr: 0.5 }} /> {event.location}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < filteredEvents.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  );
                })}
              </List>
            </Paper>
          ) : (
            <EventCalendar events={events} />
          )}
        </Box>
      )}
    </Container>
  );
};

export default EventsList;
