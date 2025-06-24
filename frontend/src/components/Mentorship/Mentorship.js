import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserGroupIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  MapPinIcon,
  BriefcaseIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const Mentorship = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('find-mentors');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    expertise: 'all',
    experience: 'all',
    location: 'all',
    availability: 'all'
  });

  // State for data from Supabase
  const [mentors, setMentors] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [myMentees, setMyMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Fetch mentors on component mount
  useEffect(() => {
    console.log('Mentorship component mounted, user:', user);
    fetchApprovedMentors();
  }, [location]); // Removed user from the dependency array to avoid re-fetching
  
  // Function to fetch approved mentors
  const fetchApprovedMentors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching approved mentors from Supabase...');
      
      // Only add user condition if user exists
      let query = supabase
        .from('mentors')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `);
        
      // Add filter condition only if user is available
      if (user && user.id) {
        query = query.or(`status.eq.approved,user_id.eq.${user.id}`);
      } else {
        query = query.eq('status', 'approved');
      }
      
      // Execute the query
      const { data: mentorsData, error: mentorsError } = await query;
      
      console.log('Supabase query result:', mentorsData, mentorsError);
      
      if (mentorsError) {
        throw mentorsError;
      }
      
      console.log('Fetched mentors:', mentorsData);
      
      // Transform data to match the expected structure for rendering
      const transformedMentors = mentorsData.map(mentor => ({
        id: mentor.id,
        user_id: mentor.user_id,
        name: mentor.profiles?.full_name || 'Anonymous Mentor',
        avatar: mentor.profiles?.avatar_url || '/default-avatar.png',
        title: 'Maritime Professional', // Default as we no longer fetch title
        company: 'AMET', // Default value
        location: 'Unknown', // Default value
        bio: mentor.mentoring_statement || '', // Use mentoring_statement as bio
        expertise: mentor.expertise || [],
        experience: `${mentor.mentoring_experience_years || 0} years`,
        responseTime: '48 hours',
        availability: 'Available',
        compatibilityScore: 85, // Placeholder compatibility score
        ratings: '5.0', // Default or can be calculated if you have ratings
        totalMentees: mentor.max_mentees || 0,
        isBookmarked: false // You can add logic to check if bookmarked by current user
      }));
      
      console.log('Transformed mentors:', transformedMentors);
      
      setMentors(transformedMentors);
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setError(err.message || 'Failed to load mentors');
      toast.error('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };
  

  const expertiseOptions = [
    { value: 'all', label: 'All Expertise Areas' },
    { value: 'marine-engineering', label: 'Marine Engineering' },
    { value: 'naval-architecture', label: 'Naval Architecture' },
    { value: 'port-management', label: 'Port Management' },
    { value: 'maritime-law', label: 'Maritime Law' },
    { value: 'ship-operations', label: 'Ship Operations' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'research', label: 'Research & Development' }
  ];

  const handleBookmark = (mentorId) => {
    console.log('Bookmark mentor:', mentorId);
  };

  const handleSendRequest = (mentorId) => {
    console.log('Send mentorship request to:', mentorId);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case 'Available':
        return 'text-green-600 bg-green-100';
      case 'Busy':
        return 'text-yellow-600 bg-yellow-100';
      case 'Limited':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mentor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         mentor.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesExpertise = filters.expertise === 'all' || 
                            mentor.expertise.some(exp => 
                              exp.toLowerCase().replace(/\s+/g, '-').includes(filters.expertise.replace('all', ''))
                            );
    
    return matchesSearch && matchesExpertise;
  });

  const MentorCard = ({ mentor }) => (
    <div className="glass-card rounded-lg p-6 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <img 
              src={mentor.avatar} 
              alt={mentor.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              mentor.availability === 'Available' ? 'bg-green-500' : 
              mentor.availability === 'Busy' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">{mentor.name}</h3>
            <p className="text-ocean-600 font-medium">{mentor.title}</p>
            <p className="text-gray-600 text-sm">{mentor.company}</p>
            <div className="flex items-center mt-1">
              <MapPinIcon className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-gray-600 text-sm">{mentor.location}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => handleBookmark(mentor.id)}
          className={`p-2 rounded-lg transition-colors ${
            mentor.isBookmarked 
              ? 'text-red-500 bg-red-50' 
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <HeartIcon className="w-5 h-5" />
        </button>
      </div>

      <p className="text-gray-700 text-sm mb-4 line-clamp-2">{mentor.bio}</p>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center">
          <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
          <span className="font-medium">{mentor.rating}</span>
          <span className="text-gray-600 ml-1">({mentor.totalMentees} mentees)</span>
        </div>
        <div className="flex items-center">
          <ClockIcon className="w-4 h-4 text-gray-400 mr-1" />
          <span className="text-gray-600">{mentor.experience}</span>
        </div>
        <div className="flex items-center">
          <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400 mr-1" />
          <span className="text-gray-600">{mentor.responseTime}</span>
        </div>
        <div className="flex items-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(mentor.availability)}`}>
            {mentor.availability}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Expertise</h4>
        <div className="flex flex-wrap gap-1">
          {mentor.expertise.slice(0, 3).map((skill, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-ocean-100 text-ocean-800 rounded text-xs"
            >
              {skill}
            </span>
          ))}
          {mentor.expertise.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              +{mentor.expertise.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Compatibility Score</span>
          <span className="font-medium text-ocean-600">{mentor.compatibilityScore}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div 
            className="bg-ocean-500 h-2 rounded-full" 
            style={{ width: `${mentor.compatibilityScore}%` }}
          ></div>
        </div>
      </div>

      <div className="flex space-x-2">
        <Link 
          to={`/mentorship/mentor/${mentor.user_id}`}
          className="flex-1 btn-ocean-outline py-2 px-3 rounded text-sm text-center"
        >
          View Profile
        </Link>
        <button 
          onClick={() => handleSendRequest(mentor.id)}
          className="flex-1 btn-ocean py-2 px-3 rounded text-sm"
        >
          Request Mentorship
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mentorship Program</h1>
            <p className="text-gray-600">Connect with experienced professionals and advance your maritime career</p>
          </div>
          <Link 
            to="/mentorship/become-mentor"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Become a Mentor
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'find-mentors', label: 'Find Mentors', icon: MagnifyingGlassIcon },
              { id: 'my-requests', label: 'My Requests', icon: UserGroupIcon },
              { id: 'my-mentoring', label: 'My Mentoring', icon: AcademicCapIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-6 py-4 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'text-ocean-600 border-b-2 border-ocean-600 bg-ocean-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Find Mentors Tab */}
          {activeTab === 'find-mentors' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input w-full pl-10 pr-4 py-2 rounded-lg"
                      placeholder="Search mentors by name, expertise, or company..."
                    />
                  </div>
                </div>
                
                <select
                  value={filters.expertise}
                  onChange={(e) => setFilters(prev => ({ ...prev, expertise: e.target.value }))}
                  className="form-input px-3 py-2 rounded-lg"
                >
                  {expertiseOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Results */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ocean-500"></div>
                  <h3 className="text-lg font-medium text-gray-700 mt-4">Loading mentors...</h3>
                </div>
              ) : error ? (
                <div className="bg-red-50 p-8 rounded-lg text-center">
                  <XCircleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load mentors</h3>
                  <p className="text-red-600 mb-6">{error}</p>
                  <button 
                    onClick={fetchApprovedMentors}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredMentors.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search criteria
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600">
                      Found <span className="font-medium">{filteredMentors.length}</span> mentors
                    </p>
                    <select className="form-input px-3 py-1 rounded text-sm">
                      <option>Sort by Compatibility</option>
                      <option>Sort by Rating</option>
                      <option>Sort by Experience</option>
                      <option>Sort by Availability</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredMentors.map((mentor) => (
                      <MentorCard key={mentor.id} mentor={mentor} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* My Requests Tab */}
          {activeTab === 'my-requests' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Mentorship Requests</h3>
              
              {mentorshipRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No mentorship requests yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start by requesting mentorship from experienced professionals
                  </p>
                  <button
                    onClick={() => setActiveTab('find-mentors')}
                    className="btn-ocean px-4 py-2 rounded-lg"
                  >
                    Find Mentors
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mentorshipRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <img 
                            src={request.mentorAvatar} 
                            alt={request.mentorName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{request.mentorName}</h4>
                            <p className="text-ocean-600 text-sm">{request.expertise}</p>
                            <p className="text-gray-600 text-sm mt-2">{request.message}</p>
                            
                            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                              <span>Requested: {new Date(request.requestedDate).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{request.sessionType}</span>
                              <span>•</span>
                              <span>{request.preferredDuration}</span>
                            </div>

                            {request.status === 'accepted' && request.scheduledDate && (
                              <div className="mt-2 p-3 bg-green-50 rounded-lg">
                                <p className="text-green-800 text-sm font-medium">
                                  Session scheduled for {new Date(request.scheduledDate).toLocaleDateString()} at {request.scheduledTime}
                                </p>
                              </div>
                            )}

                            {request.status === 'completed' && (
                              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                <p className="text-blue-800 text-sm font-medium">Session completed</p>
                                {request.feedback && (
                                  <p className="text-blue-700 text-sm mt-1">"{request.feedback}"</p>
                                )}
                                <div className="flex items-center mt-2">
                                  <span className="text-sm text-blue-700 mr-2">Your Rating:</span>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <StarIcon
                                        key={i}
                                        className={`w-4 h-4 ${i < request.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Mentoring Tab */}
          {activeTab === 'my-mentoring' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Mentees</h3>
              
              {myMentees.length === 0 ? (
                <div className="text-center py-12">
                  <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No mentees yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start mentoring and help fellow alumni advance their careers
                  </p>
                  <Link 
                    to="/mentorship/become-mentor"
                    className="btn-ocean px-4 py-2 rounded-lg"
                  >
                    Become a Mentor
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myMentees.map((mentee) => (
                    <div key={mentee.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <img 
                            src={mentee.avatar} 
                            alt={mentee.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{mentee.name}</h4>
                            <p className="text-ocean-600 text-sm">{mentee.program} • Class of {mentee.graduationYear}</p>
                            
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>Started: {new Date(mentee.requestDate).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{mentee.sessionsCompleted} sessions completed</span>
                              {mentee.nextSession && (
                                <>
                                  <span>•</span>
                                  <span>Next: {new Date(mentee.nextSession).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>

                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Goals:</h5>
                              <div className="flex flex-wrap gap-1">
                                {mentee.goals.map((goal, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                  >
                                    {goal}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="btn-ocean-outline px-3 py-1 rounded text-sm">
                            Schedule Session
                          </button>
                          <button className="btn-ocean px-3 py-1 rounded text-sm">
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mentorship;