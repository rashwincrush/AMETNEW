import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon,
  VideoCameraIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';

const Events = () => {
  const location = useLocation();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        console.log('Fetching events from Supabase...');
        
        // First check for any events at all (published or not)
        const { data: allEvents, error: allError } = await supabase
          .from('events')
          .select('*');
        
        console.log('All events (including unpublished):', allEvents);
        
        if (allError) {
          console.error('Error fetching all events:', allError);
          throw allError;
        }
        
        // Then fetch only published events (our normal query)
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_published', true)
          .order('start_date', { ascending: true });

        if (error) throw error;
        
        console.log('Published events received:', data);
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error(`Failed to fetch events: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [location]); // Re-run effect on location change

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.tags && event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      const eventDate = new Date(event.start_date);
      const now = new Date();
      const isUpcoming = eventDate > now;

      const matchesFilter = selectedFilter === 'all' || 
                           (selectedFilter === 'upcoming' && isUpcoming) ||
                           event.category === selectedFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [events, searchQuery, selectedFilter]);

  const categories = useMemo(() => [
    { value: 'all', label: 'All Events', count: events.length },
    { value: 'upcoming', label: 'Upcoming', count: events.filter(e => new Date(e.start_date) > new Date()).length },
    { value: 'reunion', label: 'Reunions', count: events.filter(e => e.category === 'reunion').length },
    { value: 'workshop', label: 'Workshops', count: events.filter(e => e.category === 'workshop').length },
    { value: 'networking', label: 'Networking', count: events.filter(e => e.category === 'networking').length },
    { value: 'seminar', label: 'Seminars', count: events.filter(e => e.category === 'seminar').length },
    { value: 'sports', label: 'Sports', count: events.filter(e => e.category === 'sports').length }
  ], [events]);

  const handleRSVP = (eventId) => {
    // Mock RSVP functionality
    console.log('RSVP for event:', eventId);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const EventCard = ({ event }) => (
    <div className="glass-card rounded-lg overflow-hidden card-hover">
      <div className="relative">
        <img 
          src={event.image_url || 'https://placehold.co/600x400/0077b6/FFFFFF?text=Event'}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(new Date(event.start_date) > new Date() ? 'upcoming' : 'completed')}`}>
            {new Date(event.start_date) > new Date() ? 'Upcoming' : 'Completed'}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-white bg-opacity-90 rounded-full text-xs font-medium text-gray-800">
            {event.event_type === 'virtual' ? 'Virtual' : 'In-Person'}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
          <span className="text-ocean-600 font-medium text-sm">{event.price > 0 ? `$${event.price}` : 'Free'}</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span>{new Date(event.start_date).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="w-4 h-4 mr-2" />
            <span>{new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            {event.event_type === 'virtual' ? (
              <VideoCameraIcon className="w-4 h-4 mr-2" />
            ) : (
              <MapPinIcon className="w-4 h-4 mr-2" />
            )}
            <span>{event.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <UserGroupIcon className="w-4 h-4 mr-2" />
            <span>{event.max_attendees ? `${event.max_attendees} spots available` : 'Unlimited spots'}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {event.tags && event.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-ocean-100 text-ocean-800 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex space-x-2">
          <Link 
            to={`/events/${event.id}`}
            className="flex-1 btn-ocean-outline py-2 px-4 rounded-lg text-center text-sm"
          >
            View Details
          </Link>
          {new Date(event.start_date) > new Date() && (
            <button 
              onClick={() => handleRSVP(event.id)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                event.isRSVPed 
                  ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                  : 'btn-ocean'
              }`}
            >
              {event.isRSVPed ? 'Cancel RSVP' : 'RSVP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const EventListItem = ({ event }) => {
    const isUpcoming = new Date(event.start_date) > new Date();
    
    return (
      <div className="glass-card rounded-lg overflow-hidden card-hover flex">
        <img 
          src={event.image_url || 'https://placehold.co/400x300/0077b6/FFFFFF?text=Event'}
          alt={event.title}
          className="w-32 h-32 md:w-48 md:h-auto object-cover"
        />
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 text-lg flex-1 mr-4 line-clamp-2">{event.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusBadge(isUpcoming ? 'upcoming' : 'completed')}`}>
              {isUpcoming ? 'Upcoming' : 'Completed'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{new Date(event.start_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center col-span-2">
              {event.event_type === 'virtual' ? <VideoCameraIcon className="w-4 h-4 mr-2 flex-shrink-0" /> : <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />}
              <span className="truncate">{event.location}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-auto pt-3">
            <div className="flex flex-wrap gap-1">
              {event.tags && event.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-ocean-100 text-ocean-800 rounded text-xs">{tag}</span>
              ))}
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <Link to={`/events/${event.id}`} className="btn-ocean-outline py-1 px-3 rounded text-sm">
                Details
              </Link>
              {isUpcoming && (
                <button onClick={() => handleRSVP(event.id)} className={`py-1 px-3 rounded text-sm font-medium ${event.isRSVPed ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'btn-ocean'}`}>
                  {event.isRSVPed ? 'Cancel' : 'RSVP'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Events</h1>
            <p className="text-gray-600">Discover and participate in alumni events</p>
          </div>
          <Link 
            to="/events/create" 
            className="btn-ocean px-4 py-2 rounded-lg flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Event
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input w-full pl-10 pr-4 py-2 rounded-lg"
                placeholder="Search events, topics, or tags..."
              />
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-ocean-500 text-white' : 'text-gray-600'}`}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-ocean-500 text-white' : 'text-gray-600'}`}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>

          <Link 
            to="/events/calendar" 
            className="btn-ocean-outline px-4 py-2 rounded-lg flex items-center"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendar View
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedFilter(category.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === category.value
                  ? 'bg-ocean-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-medium">{filteredEvents.length}</span> events
        </p>
        <select className="form-input px-3 py-1 rounded text-sm">
          <option>Sort by Date</option>
          <option>Sort by Popularity</option>
          <option>Sort by Price</option>
          <option>Sort by Location</option>
        </select>
      </div>

      {/* Events Grid/List */}
      {loading ? (
        <div className="text-center py-10">
          <p>Loading events...</p>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredEvents.map((event) => 
            viewMode === 'grid' 
              ? <EventCard key={event.id} event={event} />
              : <EventListItem key={event.id} event={event} />
          )}
        </div>
      ) : (
        <div className="text-center py-10 glass-card rounded-lg">
          <h3 className="text-lg font-semibold">No Events Found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Load More / Pagination */}
      <div className="text-center">
        <button className="btn-ocean-outline px-6 py-2 rounded-lg">
          Load More Events
        </button>
      </div>
    </div>
  );
};

export default Events;