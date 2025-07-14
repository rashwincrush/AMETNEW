import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Grid, 
  Chip,
  Container,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  Event as EventIcon, 
  LocationOn as LocationIcon, 
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format, parseISO, isPast, isToday, isFuture, isThisWeek } from 'date-fns';

const EventsList = ({ isAdmin = false }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [eventType, setEventType] = useState('all');
  const subscriptionRef = useRef(null);

  useEffect(() => {
    fetchEvents();
    
    // Set up real-time subscription for events
    const channel = supabase
      .channel('events-list-subscription')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          console.log('Real-time change received:', payload);
          fetchEvents();
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
  }, [filter, eventType]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
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

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setEvents(data || []);
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
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
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
                onChange={(e) => setFilter(e.target.value)}
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
        <Grid container spacing={3}>
          {filteredEvents.map((event) => {
            const status = getEventStatus(event.start_date, event.end_date);
            const statusColor = getStatusColor(status);
            
            return (
              <Grid item xs={12} key={event.id}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <Box 
                    sx={{
                      width: { xs: '100%', md: '30%' },
                      minHeight: { xs: 200, md: 'auto' },
                      bgcolor: 'primary.main',
                      color: 'white',
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {format(parseISO(event.start_date), 'dd')}
                    </Typography>
                    <Typography variant="h6" component="div" fontWeight="medium">
                      {format(parseISO(event.start_date), 'MMM yyyy')}
                    </Typography>
                    <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.5)', width: '60%' }} />
                    <Typography variant="subtitle2">
                      {format(parseISO(event.start_date), 'h:mm a')} - {format(parseISO(event.end_date), 'h:mm a')}
                    </Typography>
                    <Chip 
                      label={status} 
                      color={statusColor} 
                      size="small" 
                      sx={{ mt: 2, color: 'white', fontWeight: 'medium' }}
                    />
                  </Box>
                  
                  <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                        size="small"
                        color="secondary"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="h5" component="h2" gutterBottom>
                        {event.title}
                      </Typography>
                      <Typography variant="body1" color="textSecondary" paragraph>
                        {event.description.length > 200 
                          ? `${event.description.substring(0, 200)}...` 
                          : event.description}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          {event.location}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          {format(parseISO(event.start_date), 'EEEE, MMMM d, yyyy')}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <CardActions sx={{ mt: 2, justifyContent: 'flex-end' }}>
                      <Button 
                        component={Link} 
                        to={`/events/${event.id}`}
                        size="small" 
                        color="primary"
                      >
                        View Details
                      </Button>
                      {isAdmin && (
                        <Button 
                          component={Link} 
                          to={`/events/${event.id}/edit`}
                          size="small" 
                          color="secondary"
                        >
                          Edit
                        </Button>
                      )}
                    </CardActions>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default EventsList;
