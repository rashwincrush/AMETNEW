import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const localizer = momentLocalizer(moment);

const EventCalendar = () => {
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const subscriptionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
    
    // Set up real-time subscription for events
    const channel = supabase
      .channel('events-calendar-subscription')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          console.log('Real-time change received in calendar:', payload);
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
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*');

      if (fetchError) throw fetchError;
      
      // Format events for the calendar
      const formattedEvents = data.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_date),
        end: new Date(event.end_date),
        resource: {
          type: event.location.toLowerCase().includes('online') ? 'virtual' : 'in-person',
          category: event.event_type || 'general',
          location: event.location,
          description: event.description,
          organizer: event.organizer || 'AMET Alumni Association'
        }
      }));
      
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Sample events for when no events exist in the database
  const sampleEvents = [
    {
      id: 1,
      title: 'AMET Alumni Meetup 2024',
      start: new Date(2024, 3, 15, 18, 0), // April 15, 2024 6:00 PM
      end: new Date(2024, 3, 15, 21, 0),   // April 15, 2024 9:00 PM
      resource: {
        type: 'in-person',
        category: 'reunion',
        location: 'AMET Campus',
        attendees: 145,
        maxAttendees: 200,
        price: 'Free'
      }
    },
    {
      id: 2,
      title: 'Career Development Workshop',
      start: new Date(2024, 3, 20, 14, 0), // April 20, 2024 2:00 PM
      end: new Date(2024, 3, 20, 17, 0),   // April 20, 2024 5:00 PM
      resource: {
        type: 'virtual',
        category: 'workshop',
        location: 'Online',
        attendees: 78,
        maxAttendees: 100,
        price: '₹500'
      }
    },
    {
      id: 3,
      title: 'Industry Networking Session',
      start: new Date(2024, 3, 25, 17, 30), // April 25, 2024 5:30 PM
      end: new Date(2024, 3, 25, 20, 0),    // April 25, 2024 8:00 PM
      resource: {
        type: 'in-person',
        category: 'networking',
        location: 'Chennai Maritime Center',
        attendees: 45,
        maxAttendees: 80,
        price: '₹300'
      }
    },
    {
      id: 4,
      title: 'Technical Seminar: Green Shipping',
      start: new Date(2024, 4, 2, 10, 0), // May 2, 2024 10:00 AM
      end: new Date(2024, 4, 2, 16, 0),   // May 2, 2024 4:00 PM
      resource: {
        type: 'in-person',
        category: 'seminar',
        location: 'AMET Research Center',
        attendees: 38,
        maxAttendees: 60,
        price: '₹1000'
      }
    },
    {
      id: 5,
      title: 'Alumni Sports Tournament',
      start: new Date(2024, 4, 10, 9, 0), // May 10, 2024 9:00 AM
      end: new Date(2024, 4, 10, 18, 0),  // May 10, 2024 6:00 PM
      resource: {
        type: 'in-person',
        category: 'sports',
        location: 'AMET Sports Complex',
        attendees: 89,
        maxAttendees: 150,
        price: '₹200'
      }
    }
  ];

  const [filteredEvents, setFilteredEvents] = useState([]);
  
  // Update filtered events when events change
  useEffect(() => {
    if (selectedCategories.includes('all')) {
      setFilteredEvents(events.length > 0 ? events : sampleEvents);
    } else {
      setFilteredEvents(
        (events.length > 0 ? events : sampleEvents).filter(event => 
          selectedCategories.includes(event.resource.category)
        )
      );
    }
  }, [events, selectedCategories]);
  const [selectedCategories, setSelectedCategories] = useState(['all']);

  const categories = [
    { value: 'all', label: 'All Events', color: 'bg-gray-500' },
    { value: 'reunion', label: 'Reunions', color: 'bg-blue-500' },
    { value: 'workshop', label: 'Workshops', color: 'bg-green-500' },
    { value: 'networking', label: 'Networking', color: 'bg-purple-500' },
    { value: 'seminar', label: 'Seminars', color: 'bg-orange-500' },
    { value: 'sports', label: 'Sports', color: 'bg-red-500' },
    { value: 'cultural', label: 'Cultural', color: 'bg-pink-500' }
  ];

  const handleCategoryFilter = (category) => {
    if (category === 'all') {
      setSelectedCategories(['all']);
      setFilteredEvents(events);
    } else {
      let newCategories;
      if (selectedCategories.includes('all')) {
        newCategories = [category];
      } else if (selectedCategories.includes(category)) {
        newCategories = selectedCategories.filter(c => c !== category);
        if (newCategories.length === 0) {
          newCategories = ['all'];
        }
      } else {
        newCategories = [...selectedCategories, category];
      }
      
      setSelectedCategories(newCategories);
      
      if (newCategories.includes('all')) {
        setFilteredEvents(events);
      } else {
        setFilteredEvents(events.filter(event => 
          newCategories.includes(event.resource.category)
        ));
      }
    }
  };

  const eventStyleGetter = (event) => {
    const category = event.resource.category;
    const categoryObj = categories.find(c => c.value === category);
    
    let backgroundColor = '#3174ad'; // default blue
    
    switch (category) {
      case 'reunion':
        backgroundColor = '#3b82f6'; // blue
        break;
      case 'workshop':
        backgroundColor = '#10b981'; // green
        break;
      case 'networking':
        backgroundColor = '#8b5cf6'; // purple
        break;
      case 'seminar':
        backgroundColor = '#f59e0b'; // orange
        break;
      case 'sports':
        backgroundColor = '#ef4444'; // red
        break;
      case 'cultural':
        backgroundColor = '#ec4899'; // pink
        break;
      default:
        backgroundColor = '#6b7280'; // gray
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const EventComponent = ({ event }) => (
    <div className="p-1">
      <div className="font-medium text-xs truncate">{event.title}</div>
      <div className="text-xs opacity-75">
        {event.resource.type === 'virtual' ? '🌐' : '📍'} {event.resource.location}
      </div>
    </div>
  );

  const CustomToolbar = ({ label, onNavigate, onView, view }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 p-4 glass-card rounded-lg">
      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
        <h2 className="text-xl font-semibold text-gray-900">{label}</h2>
        <div className="flex space-x-1">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-2 hover:bg-ocean-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-2 text-sm font-medium text-ocean-600 hover:bg-ocean-100 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-2 hover:bg-ocean-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          {['month', 'week', 'day', 'agenda'].map((viewName) => (
            <button
              key={viewName}
              onClick={() => onView(viewName)}
              className={`px-3 py-2 text-sm font-medium capitalize ${
                view === viewName
                  ? 'bg-ocean-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {viewName}
            </button>
          ))}
        </div>
        
        <Link 
          to="/events/create"
          className="btn-ocean px-4 py-2 rounded-lg flex items-center ml-4"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Event
        </Link>
      </div>
    </div>
  );

  const handleSelectEvent = (event) => {
    navigate(`/events/${event.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Calendar</h1>
            <p className="text-gray-600">View and manage alumni events in calendar format</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/events" 
              className="btn-ocean-outline px-4 py-2 rounded-lg flex items-center"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              List View
            </Link>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Filter by Category:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryFilter(category.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                selectedCategories.includes(category.value) || selectedCategories.includes('all')
                  ? `${category.color} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="glass-card rounded-lg overflow-hidden">
        <style jsx global>{`
          .rbc-calendar {
            font-family: inherit;
          }
          .rbc-header {
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 8px;
            font-weight: 600;
            color: #374151;
          }
          .rbc-month-view {
            border: 1px solid #e2e8f0;
          }
          .rbc-day-bg {
            border-left: 1px solid #e2e8f0;
          }
          .rbc-date-cell {
            padding: 8px;
            text-align: right;
          }
          .rbc-today {
            background-color: #eff6ff;
          }
          .rbc-off-range-bg {
            background-color: #f9fafb;
          }
          .rbc-event {
            border-radius: 4px;
            padding: 2px 4px;
            margin: 1px 0;
          }
          .rbc-event:hover {
            opacity: 1 !important;
            transform: scale(1.02);
            transition: all 0.2s ease;
          }
          .rbc-slot-selection {
            background-color: rgba(14, 165, 233, 0.1);
          }
          .rbc-agenda-view {
            border: 1px solid #e2e8f0;
          }
          .rbc-agenda-date-cell,
          .rbc-agenda-time-cell {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .rbc-agenda-event-cell {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
        `}</style>
        
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
          popupOffset={{x: 30, y: 30}}
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({start, end}) => {
              return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
            },
            agendaTimeFormat: 'HH:mm',
            agendaTimeRangeFormat: ({start, end}) => {
              return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
            }
          }}
          messages={{
            today: 'Today',
            previous: 'Previous',
            next: 'Next',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            agenda: 'Agenda',
            date: 'Date',
            time: 'Time',
            event: 'Event',
            noEventsInRange: 'No events in this range',
            showMore: total => `+${total} more`
          }}
        />
      </div>

      {/* Legend */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Event Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.filter(c => c.value !== 'all').map((category) => (
            <div key={category.value} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${category.color}`}></div>
              <span className="text-sm text-gray-700">{category.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-ocean-600">{filteredEvents.length}</div>
          <div className="text-sm text-gray-600">Events This Month</div>
        </div>
        <div className="glass-card rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {filteredEvents.reduce((sum, event) => sum + event.resource.attendees, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Attendees</div>
        </div>
        <div className="glass-card rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {filteredEvents.filter(e => e.resource.type === 'virtual').length}
          </div>
          <div className="text-sm text-gray-600">Virtual Events</div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;