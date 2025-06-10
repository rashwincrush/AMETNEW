import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  ShareIcon,
  BookmarkIcon,
  VideoCameraIcon,
  BuildingOfficeIcon,
  CurrencyRupeeIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const EventDetails = () => {
  const { id } = useParams();
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [showAttendeeList, setShowAttendeeList] = useState(false);

  // Mock detailed event data
  const event = {
    id: 1,
    title: 'AMET Alumni Meetup 2024',
    description: 'Join us for the biggest alumni gathering of the year! This annual reunion brings together graduates from all batches for an evening of networking, nostalgia, and celebration of our maritime heritage.',
    longDescription: `
      <p>The AMET Alumni Meetup 2024 is more than just a reunion - it's a celebration of our shared journey and future aspirations in the maritime industry.</p>
      
      <h3>Event Highlights:</h3>
      <ul>
        <li>Welcome reception with refreshments</li>
        <li>Keynote speech by industry leaders</li>
        <li>Panel discussion on "Future of Maritime Industry"</li>
        <li>Networking sessions with batch-wise meetups</li>
        <li>Cultural program and entertainment</li>
        <li>Award ceremony recognizing outstanding alumni</li>
        <li>Dinner and fellowship</li>
      </ul>
      
      <h3>What to Expect:</h3>
      <p>This event offers a unique opportunity to reconnect with classmates, meet new people from different batches, and learn about the latest developments in the maritime sector. Whether you're a recent graduate or have decades of experience, there's something for everyone.</p>
      
      <h3>Dress Code:</h3>
      <p>Business casual recommended. Alumni are encouraged to wear AMET branded merchandise if available.</p>
    `,
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
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=300&h=200&fit=crop',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop'
    ],
    status: 'upcoming',
    tags: ['Networking', 'Alumni', 'Campus', 'Annual'],
    price: 'Free',
    organizers: [
      { 
        name: 'Dr. Sarah Johnson', 
        role: 'Alumni Director',
        email: 'sarah.johnson@amet.ac.in',
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=100&h=100&fit=crop&crop=face'
      },
      { 
        name: 'Prof. Rajesh Kumar', 
        role: 'Event Coordinator',
        email: 'rajesh.kumar@amet.ac.in',
        phone: '+91 98765 43211',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
      }
    ],
    agenda: [
      { time: '18:00', activity: 'Registration & Welcome Reception' },
      { time: '18:30', activity: 'Keynote Address by Chief Guest' },
      { time: '19:00', activity: 'Panel Discussion: Future of Maritime Industry' },
      { time: '19:45', activity: 'Networking Break' },
      { time: '20:00', activity: 'Alumni Awards Ceremony' },
      { time: '20:30', activity: 'Cultural Program' },
      { time: '21:00', activity: 'Dinner & Fellowship' }
    ],
    requirements: [
      'Valid ID for campus entry',
      'RSVP confirmation required',
      'Business casual dress code',
      'Alumni ID recommended'
    ],
    amenities: [
      'Free parking available',
      'Complimentary refreshments',
      'Wi-Fi access',
      'Photography services',
      'Live streaming for virtual attendees'
    ]
  };

  // Mock attendees data
  const attendees = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      batch: '2018',
      degree: 'B.Tech Naval Architecture',
      currentRole: 'Senior Marine Engineer',
      company: 'Ocean Shipping Ltd.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
    },
    {
      id: 2,
      name: 'Priya Sharma',
      batch: '2020',
      degree: 'B.Tech Marine Engineering',
      currentRole: 'Naval Architect',
      company: 'Maritime Solutions',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=50&h=50&fit=crop&crop=face'
    },
    {
      id: 3,
      name: 'Mohammed Ali',
      batch: '2015',
      degree: 'MBA Maritime Management',
      currentRole: 'Port Operations Manager',
      company: 'Indian Ports Authority',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'
    },
    // Add more mock attendees...
  ];

  const handleRSVP = () => {
    setIsRSVPed(!isRSVPed);
    // Mock RSVP logic
    console.log(isRSVPed ? 'Cancelled RSVP' : 'Registered for event');
  };

  const handleShare = () => {
    // Mock share functionality
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Event link copied to clipboard!');
    }
  };

  const getStatusBadge = () => {
    switch (event.status) {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Event Header */}
      <div className="glass-card rounded-lg overflow-hidden">
        {/* Cover Image */}
        <div className="relative">
          <img 
            src={event.image} 
            alt={event.title}
            className="w-full h-64 md:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge()}`}>
              {event.status}
            </span>
          </div>
          <div className="absolute top-4 right-4 flex space-x-2">
            <button 
              onClick={handleShare}
              className="p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
            <button className="p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-white hover:bg-opacity-30">
              <BookmarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Event Info */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <p className="text-gray-600 text-lg mb-4">{event.description}</p>

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <CalendarIcon className="w-5 h-5 text-ocean-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600">{event.time} - {event.endTime}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  {event.type === 'virtual' ? (
                    <VideoCameraIcon className="w-5 h-5 text-ocean-500 mr-3" />
                  ) : (
                    <MapPinIcon className="w-5 h-5 text-ocean-500 mr-3" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{event.location}</p>
                    <p className="text-sm text-gray-600">{event.address}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <UserGroupIcon className="w-5 h-5 text-ocean-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {event.currentAttendees}/{event.maxAttendees} Registered
                    </p>
                    <p className="text-sm text-gray-600">
                      {event.maxAttendees - event.currentAttendees} spots remaining
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <CurrencyRupeeIcon className="w-5 h-5 text-ocean-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{event.price}</p>
                    <p className="text-sm text-gray-600">Registration fee</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {event.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* RSVP Section */}
            <div className="lg:w-80 lg:ml-8">
              <div className="glass-card p-6 sticky top-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-ocean-600 mb-1">{event.price}</div>
                  <div className="text-sm text-gray-600">per person</div>
                </div>

                {event.status === 'upcoming' && (
                  <button 
                    onClick={handleRSVP}
                    className={`w-full py-3 px-4 rounded-lg font-medium mb-4 ${
                      isRSVPed 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'btn-ocean'
                    }`}
                  >
                    {isRSVPed ? 'Cancel Registration' : 'Register Now'}
                  </button>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available spots:</span>
                    <span className="font-medium">{event.maxAttendees - event.currentAttendees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registered:</span>
                    <span className="font-medium">{event.currentAttendees}</span>
                  </div>
                  {event.waitingList > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waiting list:</span>
                      <span className="font-medium text-orange-600">{event.waitingList}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => setShowAttendeeList(!showAttendeeList)}
                    className="w-full text-ocean-600 hover:text-ocean-700 text-sm font-medium"
                  >
                    {showAttendeeList ? 'Hide' : 'View'} Attendee List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Description */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
            <div 
              className="prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: event.longDescription }}
            />
          </div>

          {/* Event Agenda */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Agenda</h2>
            <div className="space-y-4">
              {event.agenda.map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-16 text-sm font-medium text-ocean-600 flex-shrink-0">
                    {item.time}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700">{item.activity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements & Amenities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
              <ul className="space-y-2">
                {event.requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-ocean-500 mr-2">•</span>
                    <span className="text-gray-700 text-sm">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h3>
              <ul className="space-y-2">
                {event.amenities.map((amenity, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700 text-sm">{amenity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="glass-card rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {event.gallery.map((image, index) => (
                <img 
                  key={index}
                  src={image} 
                  alt={`Event gallery ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organizers */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Organizers</h3>
            <div className="space-y-4">
              {event.organizers.map((organizer, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <img 
                    src={organizer.avatar} 
                    alt={organizer.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{organizer.name}</h4>
                    <p className="text-sm text-gray-600">{organizer.role}</p>
                    <div className="flex space-x-2 mt-2">
                      <a 
                        href={`mailto:${organizer.email}`}
                        className="text-ocean-600 hover:text-ocean-700"
                      >
                        <EnvelopeIcon className="w-4 h-4" />
                      </a>
                      <a 
                        href={`tel:${organizer.phone}`}
                        className="text-ocean-600 hover:text-ocean-700"
                      >
                        <PhoneIcon className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendee List */}
          {showAttendeeList && (
            <div className="glass-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Attendees ({event.currentAttendees})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center space-x-3">
                    <img 
                      src={attendee.avatar} 
                      alt={attendee.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attendee.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {attendee.batch} • {attendee.currentRole}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button className="text-ocean-600 hover:text-ocean-700 text-sm font-medium">
                  View All Attendees
                </button>
              </div>
            </div>
          )}

          {/* Related Events */}
          <div className="glass-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Events</h3>
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 text-sm">Career Workshop</h4>
                <p className="text-xs text-gray-600">April 20, 2024</p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 text-sm">Industry Networking</h4>
                <p className="text-xs text-gray-600">April 25, 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;