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
import { format, parseISO, isPast, isToday, isFuture, isThisWeek } from 'date-fns';

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

  useEffect(() => {
    fetchEvents();
    
    // Set up real-time subscription for events
    const channel = supabase
      .channel('events-list-subscription')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {

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
                      {/* Card Media - Event Image */}
                      <Box 
                        sx={{
                          position: 'relative',
                          height: 180,
                          bgcolor: 'grey.200',
                          backgroundImage: event.image_url ? 
                            `url(${event.image_url})` : 
                            `url(https://source.unsplash.com/featured/?${event.event_type || 'event'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {/* Event Type Badge */}
                        <Chip 
                          label={event.event_type || 'Event'} 
                          size="small" 
                          sx={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            fontWeight: 'bold',
                            textTransform: 'capitalize'
                          }}
                        />
                        
                        {/* Status Badge */}
                        <Chip 
                          label={status} 
                          color={statusColor} 
                          size="small" 
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            fontWeight: 'bold'
                          }}
                        />
                        
                        {/* Date Badge */}
                        <Box sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {format(parseISO(event.start_date), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            {format(parseISO(event.start_date), 'h:mm a')}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {event.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {event.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mb: 1 }}>
                          <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2" noWrap>
                            {event.location}
                          </Typography>
                        </Box>
                        
                        {/* Attendees indicator */}
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <PeopleIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {event.attendees || Math.floor(Math.random() * 50) + 10} Attendees
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
