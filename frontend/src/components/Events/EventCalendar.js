import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { Link, useNavigate } from 'react-router-dom';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  Paper, 
  Box, 
  Typography, 
  Button, 
  Chip, 
  Grid,
  ButtonGroup,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  Public as PublicIcon
} from '@mui/icons-material';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EventCalendar = ({ events }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { label: 'All', value: 'all', color: theme.palette.grey[500] },
    { label: 'Reunion', value: 'reunion', color: theme.palette.primary.main },
    { label: 'Workshop', value: 'workshop', color: theme.palette.success.main },
    { label: 'Networking', value: 'networking', color: theme.palette.secondary.main },
    { label: 'Seminar', value: 'seminar', color: theme.palette.warning.main },
    { label: 'Sports', value: 'sports', color: theme.palette.error.main },
    { label: 'Virtual', value: 'virtual', color: theme.palette.info.main },
    { label: 'In-Person', value: 'in-person', color: theme.palette.success.dark },
  ];

  // Format events for the calendar
  const formattedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: new Date(event.start_date),
    end: new Date(event.end_date),
    allDay: false,
    resource: {
      ...event,
      type: event.location?.toLowerCase().includes('online') ? 'virtual' : 'in-person',
      category: event.event_type || 'general',
      attendees: event.attendees || Math.floor(Math.random() * 50) + 10 // Placeholder for demo
    }
  }));

  // Filter events based on active category
  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredEvents(formattedEvents);
    } else if (activeCategory === 'virtual' || activeCategory === 'in-person') {
      setFilteredEvents(formattedEvents.filter(e => e.resource.type === activeCategory));
    } else {
      setFilteredEvents(formattedEvents.filter(e => e.resource.category === activeCategory));
    }
  }, [formattedEvents, activeCategory]);

  const handleCategoryFilter = (category) => {
    setActiveCategory(category);
  };

  const handleSelectEvent = (event) => {
    navigate(`/events/${event.id}`);
  };

  // Custom styling for events based on their category
  const eventStyleGetter = (event) => {
    let backgroundColor = theme.palette.primary.main; // Default color
    
    const category = categories.find(c => c.value === event.resource.category);
    if (category) {
      backgroundColor = category.color;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        transition: 'all 0.2s ease',
      }
    };
  };

  // Custom event component
  const EventComponent = ({ event }) => (
    <Tooltip title={`${event.title} - ${event.resource.location}`}>
      <Box sx={{ p: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
          {event.title}
        </Typography>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
          {event.resource.type === 'virtual' ? 
            <PublicIcon fontSize="inherit" sx={{ mr: 0.5 }} /> : 
            <LocationOnIcon fontSize="inherit" sx={{ mr: 0.5 }} />}
          {event.resource.location}
        </Typography>
      </Box>
    </Tooltip>
  );

  // Custom toolbar component
  const CustomToolbar = ({ label, onNavigate, onView, view }) => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', sm: 'row' }, 
      justifyContent: 'space-between', 
      alignItems: { xs: 'stretch', sm: 'center' },
      mb: 2,
      gap: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" component="span">{label}</Typography>
        <ButtonGroup size="small" variant="outlined">
          <IconButton onClick={() => onNavigate('PREV')}>
            <ChevronLeftIcon />
          </IconButton>
          <Button onClick={() => onNavigate('TODAY')}>Today</Button>
          <IconButton onClick={() => onNavigate('NEXT')}>
            <ChevronRightIcon />
          </IconButton>
        </ButtonGroup>
      </Box>
      
      <ButtonGroup size="small" variant="outlined">
        {['month', 'week', 'day', 'agenda'].map(viewName => (
          <Button 
            key={viewName}
            onClick={() => onView(viewName)}
            variant={view === viewName ? 'contained' : 'outlined'}
            color={view === viewName ? 'primary' : 'inherit'}
          >
            {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Category Filters */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterListIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">Filter by Category</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map(category => (
            <Chip 
              key={category.value}
              label={category.label}
              onClick={() => handleCategoryFilter(category.value)}
              color={activeCategory === category.value ? 'primary' : 'default'}
              variant={activeCategory === category.value ? 'filled' : 'outlined'}
              sx={{
                bgcolor: activeCategory === category.value ? category.color : 'transparent',
                color: activeCategory === category.value ? 'white' : 'inherit',
                '&:hover': { opacity: 0.9 }
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Calendar */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
            toolbar: CustomToolbar
          }}
          onSelectEvent={handleSelectEvent}
          popup
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({start, end}) => {
              return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
            },
            agendaTimeFormat: 'HH:mm',
            agendaTimeRangeFormat: ({start, end}) => {
              return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
            }
          }}
        />
      </Paper>

      {/* Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
            <CalendarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" color="primary.main">{filteredEvents.length}</Typography>
            <Typography variant="body2" color="text.secondary">Total Events</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" color="success.main">
              {filteredEvents.reduce((sum, event) => sum + (event.resource.attendees || 0), 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">Total Attendees</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
            <PublicIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" color="info.main">
              {filteredEvents.filter(e => e.resource.type === 'virtual').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Virtual Events</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Legend */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>Event Categories</Typography>
        <Grid container spacing={2}>
          {categories.filter(c => c.value !== 'all').map((category) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={category.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: category.color }} />
                <Typography variant="body2">{category.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default EventCalendar;