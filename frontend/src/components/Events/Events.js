import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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

const Events = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock events data
  const events = [
    {
      id: 1,
      title: 'AMET Alumni Meetup 2024',
      description: 'Annual reunion for all AMET alumni. Join us for networking, discussions about industry trends, and reconnecting with fellow graduates.',
      date: '2024-04-15',
      time: '18:00',
      endTime: '21:00',
      location: 'AMET Campus Auditorium',
      address: 'East Coast Road, Kanathur, Chennai - 603112',
      type: 'in-person',
      category: 'reunion',
      organizer: 'AMET Alumni Association',
      maxAttendees: 200,
      currentAttendees: 145,
      registeredAttendees: 145,
      waitingList: 0,
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=200&fit=crop',
      status: 'upcoming',
      isRSVPed: false,
      tags: ['Networking', 'Alumni', 'Campus'],
      price: 'Free',
      organizers: [
        { name: 'Dr. Sarah Johnson', role: 'Alumni Director' },
        { name: 'Prof. Rajesh Kumar', role: 'Event Coordinator' }
      ]
    },
    {
      id: 2,
      title: 'Career Development Workshop',
      description: 'Interactive workshop on resume building, interview skills, and career advancement strategies for maritime professionals.',
      date: '2024-04-20',
      time: '14:00',
      endTime: '17:00',
      location: 'Online',
      address: 'Zoom Meeting',
      type: 'virtual',
      category: 'workshop',
      organizer: 'Career Services',
      maxAttendees: 100,
      currentAttendees: 78,
      registeredAttendees: 78,
      waitingList: 5,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
      status: 'upcoming',
      isRSVPed: true,
      tags: ['Career', 'Professional Development', 'Workshop'],
      price: '₹500',
      organizers: [
        { name: 'Ms. Priya Sharma', role: 'Career Counselor' }
      ]
    },
    {
      id: 3,
      title: 'Industry Networking Session',
      description: 'Connect with industry leaders and explore new opportunities in the maritime sector. Panel discussion on future trends.',
      date: '2024-04-25',
      time: '17:30',
      endTime: '20:00',
      location: 'Chennai Maritime Center',
      address: 'Marina Beach Road, Chennai - 600013',
      type: 'in-person',
      category: 'networking',
      organizer: 'Maritime Industry Council',
      maxAttendees: 80,
      currentAttendees: 45,
      registeredAttendees: 45,
      waitingList: 2,
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=200&fit=crop',
      status: 'upcoming',
      isRSVPed: false,
      tags: ['Networking', 'Industry', 'Panel Discussion'],
      price: '₹300',
      organizers: [
        { name: 'Capt. Mohammed Ali', role: 'Industry Expert' }
      ]
    },
    {
      id: 4,
      title: 'Technical Seminar: Green Shipping',
      description: 'Explore the latest developments in sustainable shipping technologies and environmental regulations.',
      date: '2024-05-02',
      time: '10:00',
      endTime: '16:00',
      location: 'AMET Research Center',
      address: 'AMET Campus, Chennai',
      type: 'in-person',
      category: 'seminar',
      organizer: 'Research Department',
      maxAttendees: 60,
      currentAttendees: 38,
      registeredAttendees: 38,
      waitingList: 0,
      image: 'https://images.unsplash.com/photo-1581093458791-9f3c3250e3b4?w=400&h=200&fit=crop',
      status: 'upcoming',
      isRSVPed: false,
      tags: ['Technology', 'Environment', 'Research'],
      price: '₹1000',
      organizers: [
        { name: 'Dr. Kavitha Menon', role: 'Research Director' }
      ]
    },
    {
      id: 5,
      title: 'Alumni Sports Tournament',
      description: 'Annual sports tournament featuring cricket, football, and badminton. Open to all alumni and their families.',
      date: '2024-05-10',
      time: '09:00',
      endTime: '18:00',
      location: 'AMET Sports Complex',
      address: 'AMET Campus, Chennai',
      type: 'in-person',
      category: 'sports',
      organizer: 'Alumni Sports Committee',
      maxAttendees: 150,
      currentAttendees: 89,
      registeredAttendees: 89,
      waitingList: 3,
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=200&fit=crop',
      status: 'upcoming',
      isRSVPed: true,
      tags: ['Sports', 'Recreation', 'Family'],
      price: '₹200',
      organizers: [
        { name: 'Mr. Arjun Nair', role: 'Sports Coordinator' }
      ]
    },
    {
      id: 6,
      title: 'Maritime Law & Regulations Update',
      description: 'Important updates on international maritime laws and regulations affecting the shipping industry.',
      date: '2024-03-20',
      time: '15:00',
      endTime: '17:00',
      location: 'Online',
      address: 'Webinar',
      type: 'virtual',
      category: 'seminar',
      organizer: 'Legal Affairs',
      maxAttendees: 120,
      currentAttendees: 95,
      registeredAttendees: 95,
      waitingList: 0,
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=200&fit=crop',
      status: 'completed',
      isRSVPed: true,
      tags: ['Legal', 'Regulations', 'Updates'],
      price: '₹750'
    }
  ];

  const categories = [
    { value: 'all', label: 'All Events', count: events.length },
    { value: 'upcoming', label: 'Upcoming', count: events.filter(e => e.status === 'upcoming').length },
    { value: 'reunion', label: 'Reunions', count: events.filter(e => e.category === 'reunion').length },
    { value: 'workshop', label: 'Workshops', count: events.filter(e => e.category === 'workshop').length },
    { value: 'networking', label: 'Networking', count: events.filter(e => e.category === 'networking').length },
    { value: 'seminar', label: 'Seminars', count: events.filter(e => e.category === 'seminar').length },
    { value: 'sports', label: 'Sports', count: events.filter(e => e.category === 'sports').length }
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'upcoming' && event.status === 'upcoming') ||
                         event.category === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

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
          src={event.image} 
          alt={event.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(event.status)}`}>
            {event.status}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-white bg-opacity-90 rounded-full text-xs font-medium text-gray-800">
            {event.type === 'virtual' ? 'Virtual' : 'In-Person'}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
          <span className="text-ocean-600 font-medium text-sm">{event.price}</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            {event.type === 'virtual' ? (
              <VideoCameraIcon className="w-4 h-4 mr-2" />
            ) : (
              <MapPinIcon className="w-4 h-4 mr-2" />
            )}
            <span>{event.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <UserGroupIcon className="w-4 h-4 mr-2" />
            <span>{event.currentAttendees}/{event.maxAttendees} attending</span>
            {event.waitingList > 0 && (
              <span className="ml-2 text-orange-600">({event.waitingList} waiting)</span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {event.tags.slice(0, 3).map((tag, index) => (
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
          {event.status === 'upcoming' && (
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

  const EventListItem = ({ event }) => (
    <div className="glass-card rounded-lg p-6 card-hover">
      <div className="flex items-start space-x-4">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{event.description}</p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(event.status)}`}>
                {event.status}
              </span>
              <span className="text-ocean-600 font-medium text-sm">{event.price}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
            </div>
            <div className="flex items-center">
              {event.type === 'virtual' ? (
                <VideoCameraIcon className="w-4 h-4 mr-1" />
              ) : (
                <MapPinIcon className="w-4 h-4 mr-1" />
              )}
              <span>{event.location}</span>
            </div>
            <div className="flex items-center">
              <UserGroupIcon className="w-4 h-4 mr-1" />
              <span>{event.currentAttendees}/{event.maxAttendees}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex flex-wrap gap-1">
              {event.tags.slice(0, 4).map((tag, index) => (
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
                className="btn-ocean-outline py-1 px-3 rounded text-sm"
              >
                View Details
              </Link>
              {event.status === 'upcoming' && (
                <button 
                  onClick={() => handleRSVP(event.id)}
                  className={`py-1 px-3 rounded text-sm font-medium ${
                    event.isRSVPed 
                      ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                      : 'btn-ocean'
                  }`}
                >
                  {event.isRSVPed ? 'Cancel' : 'RSVP'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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