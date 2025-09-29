import React, { useState, useEffect, useRef } from 'react';
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
  HeartIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

import ApprovedGuard from '../guards/ApprovedGuard';
import RequestMentorshipButton from './RequestMentorshipButton';

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
  const [showOnlyAccepting, setShowOnlyAccepting] = useState(true);

  // State for data from Supabase
  const [mentors, setMentors] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [mentorRequests, setMentorRequests] = useState([]); // requests received (as mentor)
  const [mentorReqLoading, setMentorReqLoading] = useState(false);
  const [myMentees, setMyMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCurrentUserMentor, setIsCurrentUserMentor] = useState(false);
  const [isMentorApproved, setIsMentorApproved] = useState(false);
  const [isMentorPending, setIsMentorPending] = useState(false);
  const { user, profile, getUserRole } = useAuth();
  const hasFetched = useRef(false);
  const isStudentUnapproved = ((getUserRole ? getUserRole() : '') .toLowerCase() === 'student') && !(profile?.is_approved || profile?.approval_status === 'approved');

  
  // Fetch mentors on component mount
  useEffect(() => {
    console.log('Mentorship component mounted, user:', user);
    if (!hasFetched.current) {
      fetchApprovedMentors();
      checkCurrentUserMentor();
      hasFetched.current = true;
    }
  }, [location]); // Removed user from the dependency array to avoid re-fetching

  // When page becomes visible again (e.g., after toggling in Admin), refetch mentors once
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        fetchApprovedMentors();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  
  // Check if the current user is already a mentor
  const checkCurrentUserMentor = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('status, user_id')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is not found error
        console.error('Error checking mentor status:', error);
        return;
      }
      
      setIsCurrentUserMentor(!!data);
      setIsMentorApproved(data?.status === 'approved');
      setIsMentorPending(data?.status === 'pending');
    } catch (err) {
      console.error('Error checking if user is mentor:', err);
    }
  };
  
  // Function to fetch approved mentors who are available
  const fetchApprovedMentors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching approved mentors from Supabase...');
      
      // Only list approved mentors; hydrate identity from alumni_directory_public
      const { data: mentorsRows, error: mentorsError } = await supabase
        .from('mentors')
        .select('*')
        .eq('status', 'approved');
      
      console.log('Supabase query result:', mentorsRows, mentorsError);
      
      if (mentorsError) {
        throw mentorsError;
      }
      
      console.log('Fetched mentors:', mentorsRows);

      // Hydrate public identity
      const userIds = (mentorsRows || []).map(m => m.user_id).filter(Boolean);
      let identityMap = new Map();
      if (userIds.length > 0) {
        const { data: pubRows } = await supabase
          .from('alumni_directory_public')
          .select('id, full_name, avatar_url, current_job_title, company_name, location_city, location_country')
          .in('id', userIds);
        (pubRows || []).forEach(r => identityMap.set(r.id, r));
      }

      // Read accepting flags from mentor_profiles
      let acceptingMap = new Map();
      if (userIds.length > 0) {
        const { data: mpRows, error: mpErr } = await supabase
          .from('mentor_profiles')
          .select('user_id, is_accepting_mentees')
          .in('user_id', userIds);
        if (!mpErr) {
          (mpRows || []).forEach(r => acceptingMap.set(r.user_id, !!r.is_accepting_mentees));
        }
      }

      // Transform data to match rendering needs
      const transformedMentors = (mentorsRows || []).map(mentor => {
        const ident = identityMap.get(mentor.user_id) || {};
        const title = ident.current_job_title || 'Maritime Professional';
        const company = ident.company_name || 'AMET';
        const location = [ident.location_city, ident.location_country].filter(Boolean).join(', ') || 'Unknown';
        // Acceptance flag from mentor_profiles; default to true when unknown so directory isn't empty
        const acceptingFlag = acceptingMap.has(mentor.user_id)
          ? acceptingMap.get(mentor.user_id) === true
          : true;
        return {
          id: mentor.id,
          user_id: mentor.user_id,
          name: ident.full_name || 'Anonymous Mentor',
          avatar: ident.avatar_url || '/default-avatar.png',
          title,
          company,
          location,
          bio: mentor.mentoring_statement || '',
          expertise: mentor.expertise || [],
          experience: `${mentor.mentoring_experience_years || 0} years`,
          responseTime: '48 hours',
          // Use mentor_profiles flag for accepting-only (fallback to true if unknown)
          profileAvailable: acceptingFlag,
          accepting: acceptingFlag,
          availability: 'Available',
          compatibilityScore: 85,
          ratings: '5.0',
          totalMentees: mentor.max_mentees || 0,
          preferences: mentor.mentoring_preferences || {},
          isBookmarked: false,
        };
      });
      
      console.log('Transformed mentors:', transformedMentors);
      // Show all approved mentors. Request button will be disabled if unavailable.
      setMentors(transformedMentors);
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setError(err.message || 'Failed to load mentors');
      toast.error('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };
  

  // Fetch requests received by the current user as mentor
  const fetchMentorRequests = async () => {
    if (!user?.id || !isMentorApproved) return;
    try {
      setMentorReqLoading(true);
      const { data: rows, error } = await supabase
        .from('mentorship_requests')
        .select('id, mentor_id, mentee_id, status, message, goals, created_at')
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const menteeIds = Array.from(new Set((rows || []).map(r => r.mentee_id).filter(Boolean)));
      let idMap = new Map();
      if (menteeIds.length) {
        const { data: pubs } = await supabase
          .from('alumni_directory_public')
          .select('id, full_name, avatar_url')
          .in('id', menteeIds);
        (pubs || []).forEach(p => idMap.set(p.id, p));
        const missing = menteeIds.filter(id => !idMap.has(id));
        if (missing.length) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', missing);
          (profs || []).forEach(p => idMap.set(p.id, p));
        }
      }

      const hydrated = (rows || []).map(r => ({
        ...r,
        mentee: idMap.get(r.mentee_id) || { id: r.mentee_id, full_name: 'Mentee', avatar_url: null }
      }));
      setMentorRequests(hydrated);
    } catch (e) {
      console.error('Error fetching mentor-side requests:', e);
      toast.error('Failed to load requests received');
    } finally {
      setMentorReqLoading(false);
    }
  
  };

  // Load mentor-side requests when user is an approved mentor
  useEffect(() => {
    if (isMentorApproved) fetchMentorRequests();
  }, [isMentorApproved, user?.id]);

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

  const handleSendRequest = async (mentorObj) => {
    try {
      if (!user) {
        toast.error('Please sign in to request mentorship.');
        return;
      }

    const role = getUserRole ? getUserRole() : undefined;
    const isApproved = !!(profile?.is_approved || profile?.approval_status === 'approved');
    if (role && role.toLowerCase() === 'student' && !isApproved) {
      toast.error('Your profile is not approved. Kindly contact administrator.');
      return;
    }

      const menteeId = profile?.id || user.id; // profiles.id equals auth user id in this schema
      const mentorId = mentorObj?.user_id;
      if (!mentorId) {
        toast.error('Unable to determine mentor profile.');
        return;
      }

      // Prevent duplicate requests (since no unique constraint in DB)
      const { data: existing, error: existingErr } = await supabase
        .from('mentorship_requests')
        .select('id, status')
        .eq('mentor_id', mentorId)
        .eq('mentee_id', menteeId)
        .in('status', ['pending', 'accepted']);
      if (existingErr) {
        console.error('Duplicate check failed:', existingErr);
      } else if (existing && existing.length > 0) {
        toast('You already have a pending or accepted request with this mentor.', { icon: 'ℹ️' });
        setActiveTab('my-requests');
        return;
      }

      // Basic prompts for message/goals (kept simple for basic mode)
      const message = window.prompt('Write a short message to the mentor (why you want mentorship):', '');
      if (message === null) return; // user cancelled
      const goals = window.prompt('Optionally describe your goals (optional):', '') || '';

      const payload = {
        mentee_id: menteeId,
        mentor_id: mentorId,
        message: message || '',
        goals,
        status: 'pending'
      };

      const { error } = await supabase
        .from('mentorship_requests')
        .insert([payload]);

      if (error) {
        console.error('Failed to create mentorship request:', error);
        toast.error(`Failed to send request: ${error.message}`);
        return;
      }

      toast.success('Mentorship request sent!');
      // Optionally, switch to My Requests tab
      setActiveTab('my-requests');
    } catch (e) {
      console.error(e);
      toast.error('Something went wrong while sending the request.');
    }
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
    const matchesAccepting = showOnlyAccepting;
    return matchesSearch && matchesExpertise && matchesAccepting;
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

      {mentor.preferences && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Preferences</h4>
          <div className="flex flex-wrap gap-1 text-xs">
            {mentor.preferences.communication && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Comm: {mentor.preferences.communication}</span>
            )}
            {mentor.preferences.format && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Format: {mentor.preferences.format}</span>
            )}
            {mentor.preferences.duration && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Duration: {mentor.preferences.duration}</span>
            )}
          </div>
        </div>
      )}

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
        <ApprovedGuard require="approved-mentee">
          <RequestMentorshipButton mentorId={mentor.user_id} disabled={!mentor.profileAvailable} />
        </ApprovedGuard>
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
          <div className="flex items-center gap-2">
            <Link 
              to="/mentorship/me"
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-150 ease-in-out"
            >
              My Mentorship
            </Link>
            {/* Secondary CTA based on role/status */}
            {isMentorApproved ? (
              <Link 
                to="/mentorship/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
              >
                <AcademicCapIcon className="w-5 h-5 mr-2" />
                Open Mentor Dashboard
              </Link>
            ) : isMentorPending ? (
              <div className="px-3 py-2 rounded-lg bg-yellow-100 text-yellow-800 text-sm font-semibold">
                Mentor application pending
              </div>
            ) : (
              (() => {
                const role = getUserRole ? getUserRole() : undefined;
                // Hide Become a Mentor for students; show for alumni/admin
                if (role && role.toLowerCase() === 'student') return null;
                return (
                  <Link 
                    to="/mentorship/become-mentor"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Become a Mentor
                  </Link>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {(() => {
              const tabs = [
                { id: 'find-mentors', label: 'Find Mentors', icon: MagnifyingGlassIcon },
                { id: 'my-requests', label: 'My Requests', icon: UserGroupIcon },
              ];
              if (isMentorApproved) tabs.push({ id: 'my-mentoring', label: 'Mentor Dashboard', icon: AcademicCapIcon });
              return tabs;
            })().map((tab) => {
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

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={showOnlyAccepting}
                    onChange={(e) => setShowOnlyAccepting(e.target.checked)}
                  />
                  Show mentors
                </label>
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
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Mentor Dashboard</h3>

              {/* Requests Received */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900">Requests Received</h4>
                  <button onClick={fetchMentorRequests} className="text-sm text-ocean-600 hover:underline">Refresh</button>
                </div>
                {mentorReqLoading ? (
                  <p className="text-gray-500">Loading requests…</p>
                ) : mentorRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <AcademicCapIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-700">No requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mentorRequests.map((r) => (
                      <div key={r.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <img src={r.mentee?.avatar_url || '/default-avatar.png'} alt={r.mentee?.full_name || 'Mentee'} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <div className="font-medium text-gray-900">{r.mentee?.full_name || 'Mentee'}</div>
                            <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
                            {r.message && <div className="text-sm text-gray-700 mt-1">{r.message}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(r.status)}`}>{r.status}</span>
                          {r.status === 'pending' && (
                            <>
                              <button
                                onClick={async () => {
                                  const { error } = await supabase.from('mentorship_requests').update({ status: 'accepted' }).eq('id', r.id);
                                  if (!error) { toast.success('Request accepted'); fetchMentorRequests(); }
                                  else toast.error('Failed');
                                }}
                                className="btn-ocean px-3 py-1 rounded text-sm"
                              >
                                Accept
                              </button>
                              <button
                                onClick={async () => {
                                  const { error } = await supabase.from('mentorship_requests').update({ status: 'rejected' }).eq('id', r.id);
                                  if (!error) { toast('Request rejected', { icon: '🙇' }); fetchMentorRequests(); }
                                  else toast.error('Failed');
                                }}
                                className="btn-ocean-outline px-3 py-1 rounded text-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mentorship;