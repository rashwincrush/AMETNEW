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
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const Events = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRSVPs, setUserRSVPs] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [totalEvents, setTotalEvents] = useState(0);
  const [sortBy, setSortBy] = useState('start_date,asc');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        let query = supabase
          .from('events')
          .select('*', { count: 'exact' })
          .eq('is_published', true);

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{\"${searchQuery}\"}`);
        }

        if (selectedFilter === 'upcoming') {
          const now = new Date();
          const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000).toISOString();
          query = query.gt('start_date', utcNow);
        } else if (selectedFilter !== 'all') {
          query = query.eq('category', selectedFilter);
        }

        const [sortField, sortOrder] = sortBy.split(',');
        query = query.order(sortField, { ascending: sortOrder === 'asc' });

        const { data, error, count } = await query.range(from, to);

        if (error) throw error;

        setEvents(data || []);
        setTotalEvents(count || 0);

        if (user && data) {
          const eventIds = data.map(event => event.id);
          const { data: rsvpData, error: rsvpError } = await supabase
            .from('event_attendees')
            .select('event_id, status')
            .eq('user_id', user.id)
            .in('event_id', eventIds);

          if (rsvpError) {
            console.error('Error fetching user RSVPs:', rsvpError);
          } else {
            const rsvps = {};
            rsvpData.forEach(rsvp => {
              rsvps[rsvp.event_id] = rsvp.status;
            });
            setUserRSVPs(rsvps);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(`Failed to fetch events: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user, currentPage, itemsPerPage, searchQuery, selectedFilter, sortBy]);

  const categories = [
    { value: 'all', label: 'All Events' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'reunion', label: 'Reunions' },
    { value: 'workshop', label: 'Workshops' },
    { value: 'networking', label: 'Networking' },
    { value: 'seminar', label: 'Seminars' },
    { value: 'sports', label: 'Sports' }
  ];

  const totalPages = Math.ceil(totalEvents / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleRSVP = async (eventId) => {
    if (!user) {
      toast.error('Please sign in to RSVP for events');
      return;
    }

    const isRSVPed = userRSVPs[eventId] === 'registered';
    
    try {
      if (isRSVPed) {
        // Cancel RSVP
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setUserRSVPs(prev => {
          const newRSVPs = {...prev};
          delete newRSVPs[eventId];
          return newRSVPs;
        });
        
        toast.success('RSVP cancelled successfully');
      } else {
        // Create RSVP
        const { error } = await supabase
          .from('event_attendees')
          .upsert({
            event_id: eventId,
            user_id: user.id,
            status: 'registered'
          }, {
            onConflict: 'event_id,user_id'
          });
          
        if (error) throw error;
        
        setUserRSVPs(prev => ({
          ...prev,
          [eventId]: 'registered'
        }));
        
        toast.success('Successfully RSVP\'d to the event!');
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error(`Failed to update RSVP: ${error.message}`);
    }
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
                userRSVPs[event.id]
                  ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                  : 'btn-ocean'
              }`}
            >
              {userRSVPs[event.id] ? 'Cancel RSVP' : 'RSVP'}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentPage(1);
                    setSearchQuery(searchTerm);
                  }
                }}
                className="form-input w-full pl-10 pr-24 py-2 rounded-lg"
                placeholder="Search events, topics, or tags..."
              />
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setSearchQuery(searchTerm);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-ocean px-3 py-1 rounded-md text-sm"
              >
                Search
              </button>
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
              onClick={() => {
                setSelectedFilter(category.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === category.value
                  ? 'bg-ocean-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-medium">{events.length}</span> of <span className="font-medium">{totalEvents}</span> events
        </p>
        <select 
          className="form-input px-3 py-1 rounded text-sm"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="start_date,asc">Sort by Date (Upcoming)</option>
          <option value="start_date,desc">Sort by Date (Recent)</option>
          <option value="title,asc">Sort by Title (A-Z)</option>
          <option value="title,desc">Sort by Title (Z-A)</option>
        </select>
      </div>

      {/* Events Grid/List */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      ) : events.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {events.map((event) => 
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 border border-gray-300 rounded-lg text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => paginate(pageNum)}
                className={`px-3 py-2 ${currentPage === pageNum 
                  ? 'bg-ocean-500 text-white' 
                  : 'border border-gray-300 hover:bg-gray-50'} rounded-lg text-sm`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 border border-gray-300 rounded-lg text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Events;