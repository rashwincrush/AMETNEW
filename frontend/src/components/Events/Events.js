import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
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
import { formatInIST } from '../../utils/timezone';
import { logActivity } from '../../utils/activityLogger';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { toFriendlyToast } from '../../utils/errors';

const Events = () => {
  const { user, isAdmin, userRole } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'upcoming'); // all | upcoming | past
  const [selectedEventType, setSelectedEventType] = useState(searchParams.get('type') || 'all');
  const [customEventType, setCustomEventType] = useState(searchParams.get('type') === 'other' ? (searchParams.get('other') || '') : '');

  // List/pagination/sort
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRSVPs, setUserRSVPs] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [totalEvents, setTotalEvents] = useState(0);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'start_date,desc');

  // Debounce search term -> searchQuery (250ms)
  useEffect(() => {
    const id = setTimeout(() => {
      setSearchQuery(searchTerm.trim());
    }, 250);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Initialize search from URL on first mount
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchTerm(q);
      setSearchQuery(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('status', selectedStatus);
    if (searchQuery) params.set('q', searchQuery); else params.delete('q');
    if (selectedEventType) params.set('type', selectedEventType);
    if (selectedEventType === 'other' && customEventType) params.set('other', customEventType); else params.delete('other');
    if (sortBy) params.set('sort', sortBy);
    setSearchParams(params, { replace: true });
  }, [selectedStatus, searchQuery, selectedEventType, customEventType, sortBy]);

  // Log filter/view changes
  useEffect(() => {
    logActivity({
      action: 'events_list_view',
      meta: {
        status: selectedStatus,
        type: selectedEventType,
        other: selectedEventType === 'other' ? customEventType : null,
        sort: sortBy,
        q: searchQuery || null,
      }
    });
  }, [selectedStatus, selectedEventType, customEventType, sortBy, searchQuery]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        let query = supabase
          .from('events')
          .select('*', { count: 'exact' });

        // Visibility rules
        if (!isAdmin) {
          query = query.eq('is_published', true).eq('approval_status', 'approved');
        }

        // Search across specific columns
        if (searchQuery) {
          const sq = searchQuery.replace(/%/g, '\\%').replace(/_/g, '\\_');
          query = query.or(
            `title.ilike.%${sq}%,short_description.ilike.%${sq}%,long_description.ilike.%${sq}%,location.ilike.%${sq}%`
          );
        }

        // Status time boundary using UTC
        const nowIso = new Date().toISOString();
        if (selectedStatus === 'upcoming') {
          query = query.gte('start_date', nowIso);
        } else if (selectedStatus === 'past') {
          query = query.lt('start_date', nowIso);
        }

        // Type filter
        if (selectedEventType !== 'all') {
          if (selectedEventType === 'other' && customEventType.trim()) {
            query = query.eq('event_type', customEventType.trim());
          } else if (selectedEventType !== 'other') {
            query = query.eq('event_type', selectedEventType);
          }
        }

        // Sorting
        const [sortField, sortOrder] = (sortBy || 'start_date,desc').split(',');
        query = query.order(sortField, { ascending: sortOrder === 'asc' });

        const { data, error, count } = await query.range(from, to);
        if (error) throw error;

        setEvents(data || []);
        setTotalEvents(count || 0);

        // User RSVPs for visible items
        if (user && data && data.length) {
          const eventIds = data.map((e) => e.id);
          const { data: rsvpData, error: rsvpError } = await supabase
            .from('event_attendees')
            .select('event_id, status')
            .eq('user_id', user.id)
            .in('event_id', eventIds);
          if (!rsvpError && rsvpData) {
            const rsvps = {};
            rsvpData.forEach((r) => { rsvps[r.event_id] = r.status; });
            setUserRSVPs(rsvps);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toFriendlyToast(toast, error, 'Failed to fetch events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user, isAdmin, currentPage, itemsPerPage, searchQuery, selectedStatus, selectedEventType, customEventType, sortBy]);

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
  ];

  const eventTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'in-person', label: 'In-Person' },
    { value: 'virtual', label: 'Virtual' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'other', label: 'Other' },
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
      toFriendlyToast(toast, error, 'Failed to update RSVP. Please try again.');
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

  const getApprovalMeta = (approvalStatus, isPublished) => {
    if (!isPublished) {
      return { label: 'Draft', className: 'bg-yellow-100 text-yellow-800' };
    }
    switch (approvalStatus) {
      case 'approved':
        return { label: 'Approved', className: 'bg-green-100 text-green-800' };
      case 'pending':
        return { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' };
      case 'rejected':
        return { label: 'Rejected', className: 'bg-red-100 text-red-800' };
      default:
        return null;
    }
  };

  const EventCard = ({ event }) => {
    const approval = getApprovalMeta(event.approval_status, event.is_published);
    const priceLabel = event.price > 0 ? `$${event.price}` : 'Free';
    return (
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
          <div className="flex flex-col items-end space-y-1">
            <span className="text-ocean-600 font-medium text-sm">{priceLabel}</span>
            {isAdmin && approval && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${approval.className}`}>
                {approval.label}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.short_description || event.long_description || ''}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span>{formatInIST(event.start_date, 'MMMM d, yyyy')}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="w-4 h-4 mr-2" />
            <span>{formatInIST(event.start_date, 'h:mm a')}</span>
          </div>
          
          {event.location && (
            <div className="flex items-center text-sm text-gray-600">
              {event.event_type === 'virtual' ? (
                <VideoCameraIcon className="w-4 h-4 mr-2" />
              ) : (
                <MapPinIcon className="w-4 h-4 mr-2" />
              )}
              <span>{event.location}</span>
            </div>
          )}
          
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
  };

  const EventListItem = ({ event }) => {
    const isUpcoming = new Date(event.start_date) > new Date();
    const approval = getApprovalMeta(event.approval_status, event.is_published);
    
    return (
      <div className="glass-card rounded-lg overflow-hidden card-hover flex">
        <img 
          src={event.image_url || 'https://placehold.co/400x300/0077b6/FFFFFF?text=Event'}
          alt={event.title}
          className="w-32 h-32 md:w-48 md:h-auto object-cover"
        />
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 mr-4">
              <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{event.title}</h3>
              {isAdmin && approval && (
                <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${approval.className}`}>
                  {approval.label}
                </span>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusBadge(isUpcoming ? 'upcoming' : 'completed')}`}>
              {isUpcoming ? 'Upcoming' : 'Completed'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{formatInIST(event.start_date, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{formatInIST(event.start_date, 'h:mm a')}</span>
            </div>
            {event.location && (
              <div className="flex items-center col-span-2">
                {event.event_type === 'virtual' ? <VideoCameraIcon className="w-4 h-4 mr-2 flex-shrink-0" /> : <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />}
                <span className="truncate">{event.location}</span>
              </div>
            )}
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
                <button onClick={() => handleRSVP(event.id)} className={`py-1 px-3 rounded text-sm font-medium ${userRSVPs[event.id] ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'btn-ocean'}`}>
                  {userRSVPs[event.id] ? 'Cancel' : 'RSVP'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main id="main-content" className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Events</h1>
            <p className="text-gray-600">Discover and participate in alumni events</p>
          </div>
          {userRole !== 'student' && (
            <Link 
              to="/events/create" 
              className="btn-ocean px-4 py-2 rounded-lg flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          )}
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
                className="form-input w-full pl-10 pr-24 py-2 rounded-lg"
                placeholder="Search title, description, or location..."
                aria-label="Search events"
              />
              <button
                onClick={() => {
                  setCurrentPage(1);
                  setSearchQuery(searchTerm.trim());
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

        {/* Status Filter */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Status</h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Event status filter">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSelectedStatus(opt.value); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedStatus === opt.value ? 'bg-ocean-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={selectedStatus === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Event Type Filters */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Event Format</h3>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setSelectedEventType(type.value);
                  if (type.value !== 'other') setCustomEventType('');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedEventType === type.value
                    ? 'bg-ocean-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
            {selectedEventType === 'other' && (
              <input
                type="text"
                value={customEventType}
                onChange={(e) => setCustomEventType(e.target.value)}
                placeholder="Specify type"
                className="form-input px-3 py-1 rounded text-sm"
                aria-label="Custom event type"
              />
            )}
          </div>
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
          <option value="start_date,desc">Sort by Date (Recent)</option>
          <option value="start_date,asc">Sort by Date (Oldest)</option>
          <option value="title,asc">Sort by Title (A-Z)</option>
          <option value="title,desc">Sort by Title (Z-A)</option>
        </select>
      </div>

      {/* Events Grid/List */}
      {loading ? (
        <div className="text-center py-10" role="status" aria-live="polite">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
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
        <div className="text-center py-12 glass-card rounded-lg">
          <div className="w-16 h-16 bg-ocean-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-ocean-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-4 mt-8">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
            className="inline-flex items-center min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border-2 border-ocean-300 text-ocean-700 hover:bg-ocean-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 transition-colors duration-200"
          >
            Previous
          </button>
          
          <span aria-current="page" className="min-h-[44px] px-4 py-2 rounded-lg bg-ocean-600 text-white font-medium flex items-center">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
            className="inline-flex items-center min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border-2 border-ocean-300 text-ocean-700 hover:bg-ocean-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 transition-colors duration-200"
          >
            Next
          </button>
        </nav>
      )}
      </div>
    </main>
  );
};

export default Events;