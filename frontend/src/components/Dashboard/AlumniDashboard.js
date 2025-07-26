import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification'; // Import useAuth
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase'; // Assuming supabase client is here
import toast from 'react-hot-toast'; // For error notifications
import { 
  UsersIcon, 
  CalendarIcon, 
  BriefcaseIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon,
  DocumentIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';


// Skeleton Card Component for loading states
const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-gray-200 animate-pulse rounded-lg p-6 ${className}`}>
    <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
    <div className="h-10 bg-gray-300 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-full"></div>
  </div>
);

const StatSkeletonCard = ({ className = '' }) => (
  <div className={`bg-gray-200 animate-pulse rounded-lg p-4 ${className}`}>
    <div className="flex items-center">
      <div className="h-8 w-8 bg-gray-300 rounded-full mr-3"></div>
      <div>
        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
        <div className="h-6 bg-gray-300 rounded w-12"></div>
      </div>
    </div>
  </div>
);

// Helper function to format relative time (simplified)
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
};

// Helper function to format event date and time
const formatEventDateTime = (dateString, timeString) => {
  const date = new Date(dateString);
  if (timeString) {
    const [hours, minutes] = timeString.split(':');
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AlumniDashboard = () => {
  const { showInfo } = useNotification();
  const { user, profile, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    personalConnections: 0,
    totalAlumni: 0,
    upcomingEventsCount: 0,
    jobOpportunitiesCount: 0,
    unreadMessagesCount: 0,
    recentActivities: [],
    upcomingEventsList: [],
    jobRecommendationsList: [],
  });
  const [loading, setLoading] = useState(true);
  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Alumni';
  const hasFetched = useRef(false);

  // Improved promiseWithTimeout with retry capability
  const promiseWithTimeout = useCallback((promise, ms, maxRetries = 2, timeoutError = new Error('Request timed out')) => {
    // First check if the input is a promise
    if (!promise || typeof promise.then !== 'function') {
      console.error('Invalid promise passed to promiseWithTimeout:', promise);
      return Promise.resolve(promise); // Return a resolved promise with the value
    }
    
    // Function to create a timeout promise
    const createTimeout = () => new Promise((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(timeoutError);
      }, ms);
    });
    
    // Function to attempt the promise with timeout and retry logic
    const attemptWithRetry = (retriesLeft) => {
      // Log retries
      if (maxRetries - retriesLeft > 0) {
        console.log(`Retrying API call, attempt ${maxRetries - retriesLeft + 1} of ${maxRetries + 1}`);
      }
      
      return Promise.race([
        // Add catch handler safely to the promise to avoid unhandled rejections
        promise.then(result => result, err => {
          // If we have retries left and this is a network error or 429 (too many requests)
          if (retriesLeft > 0 && (err.message?.includes('network') || err.status === 429)) {
            console.warn('Request failed, retrying...', err);
            // Exponential backoff - wait longer for each retry
            const backoffTime = 1000 * Math.pow(2, maxRetries - retriesLeft);
            return new Promise(resolve => {
              setTimeout(() => resolve(attemptWithRetry(retriesLeft - 1)), backoffTime);
            });
          }
          console.error('Promise error:', err);
          throw err;
        }),
        createTimeout()
      ]);
    };
    
    return attemptWithRetry(maxRetries);
  }, []);

  const fetchConnectionsCount = useCallback(async (userId) => {
    if (!userId) return 0;
    try {
      const { data, error } = await supabase.rpc('get_connections_count', { p_user_id: userId });
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('RPC get_connections_count failed, falling back to manual count:', error.message);
      const { count, error: countError } = await supabase
        .from('connections')
        .select('id', { count: 'exact', head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'connected');
      
      if (countError) {
        console.error('Error counting connections fallback:', countError);
        return 0;
      }
      return count;
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    console.log('AlumniDashboard: fetchDashboardData started.');
    setLoading(true);
    
    // Track which data items have been loaded successfully
    const dataStatus = {
      eventsCount: false,
      jobsCount: false,
      events: false,
      jobs: false,
      alumni: false,
      connections: false
    };
    try {
      // Format today's date in a way that's compatible with Supabase queries
      const today = new Date();
      // Format ISO string properly to avoid Bad Request errors
      const todayStart = today.toISOString();
      // Define the promises with better error handling
      const promises = [
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('start_date', todayStart).eq('is_published', true)
          .then(result => {
            if (result.error) console.error('Error fetching event count:', result.error);
            return result;
          }),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).gte('deadline', todayStart).eq('is_active', true)
          .then(result => {
            if (result.error) console.error('Error fetching job count:', result.error);
            return result;
          }),
        supabase.from('events').select('id, title, start_date, address, event_type').gte('start_date', todayStart).eq('is_published', true).order('start_date', { ascending: true }).limit(3)
          .then(result => {
            if (result.error) console.error('Error fetching upcoming events:', result.error);
            return result;
          }),
        supabase.from('jobs').select('id, title, company_name, location, created_at').gte('deadline', todayStart).eq('is_active', true).order('created_at', { ascending: false }).limit(3)
          .then(result => {
            if (result.error) console.error('Error fetching job recommendations:', result.error);
            return result;
          }),
      ];
      
      // Fetch each piece of data individually to prevent all-or-nothing failures
      let dashboardUpdates = {};
      
      try {
        // Fetch profile count with explicit promise creation and better error handling
        // This avoids issues with the promiseWithTimeout function
        const fetchProfileCount = async () => {
          try {
            // Use explicit promise that will be properly caught if it fails
            const { count, error } = await supabase
              .from('profiles')
              .select('id', { count: 'exact', head: true });
            
            if (error) throw error;
            return { count, error: null };
          } catch (err) {
            console.warn('Profile count query failed, will retry:', err);
            throw err;
          }
        };
        
        // Use the promiseWithTimeout with our explicit promise function
        const profilesResult = await promiseWithTimeout(
          fetchProfileCount(), 
          20000, // Increased to 20 seconds
          3     // Increased to 3 retries
        );
        
        if (profilesResult && !profilesResult.error) {
          dashboardUpdates.totalAlumni = profilesResult.count || 0;
          dataStatus.alumni = true;
        } else if (profilesResult && profilesResult.error) {
          console.error('Error in profiles query response:', profilesResult.error);
        }
      } catch (error) {
        console.error('Error fetching profiles count:', error);
        // Set a fallback value so the UI doesn't break
        dashboardUpdates.totalAlumni = 0;
        dataStatus.alumni = true; // Mark as done to avoid blocking other components
      }
      
      // Then fetch connections count
      try {
        const connectionsCount = await fetchConnectionsCount(user.id);
        dashboardUpdates.personalConnections = connectionsCount;
        dataStatus.connections = true;
      } catch (error) {
        console.error('Error fetching connections count:', error);
        dashboardUpdates.personalConnections = 0;
      }
      
      // Update dashboard with whatever data we have so far
      if (Object.keys(dashboardUpdates).length > 0) {
        setDashboardData(prev => ({
          ...prev,
          ...dashboardUpdates
        }));
      }
      
      // Reset for next batch
      dashboardUpdates = {};
      
      // Now try fetching events data
      try {
        const today = new Date();
        const todayStart = today.toISOString();
        
        // Get event count with increased timeout and retries
        const eventsCountResult = await promiseWithTimeout(
          supabase.from('events').select('id', { count: 'exact', head: true })
            .gte('start_date', todayStart)
            .eq('is_published', true), 
          15000, // Increased from 8000ms to 15000ms
          2     // Allow up to 2 retries
        );
        
        if (!eventsCountResult.error) {
          dashboardUpdates.upcomingEventsCount = eventsCountResult.count || 0;
          dataStatus.eventsCount = true;
        }
        
        // Get event list with increased timeout and retries
        const eventsListResult = await promiseWithTimeout(
          supabase.from('events')
            .select('id, title, start_date, address, event_type')
            .gte('start_date', todayStart)
            .eq('is_published', true)
            .order('start_date', { ascending: true })
            .limit(3),
          15000, // Increased from 8000ms to 15000ms
          2     // Allow up to 2 retries
        );
        
        if (!eventsListResult.error) {
          dashboardUpdates.upcomingEventsList = eventsListResult.data || [];
          dataStatus.events = true;
        }
      } catch (error) {
        console.error('Error fetching events data:', error);
      }
      
      // Update dashboard with events data
      if (Object.keys(dashboardUpdates).length > 0) {
        setDashboardData(prev => ({
          ...prev,
          ...dashboardUpdates
        }));
      }
      
      // Reset for next batch
      dashboardUpdates = {};
      
      // Finally try fetching jobs data
      try {
        const today = new Date();
        const todayStart = today.toISOString();
        
        // Get jobs count with increased timeout and retries
        const jobsCountResult = await promiseWithTimeout(
          supabase.from('jobs')
            .select('id', { count: 'exact', head: true })
            .gte('deadline', todayStart)
            .eq('is_active', true),
          15000, // Increased from 8000ms to 15000ms
          2     // Allow up to 2 retries
        );
        
        if (!jobsCountResult.error) {
          dashboardUpdates.jobOpportunitiesCount = jobsCountResult.count || 0;
          dataStatus.jobsCount = true;
        }
        
        // Get jobs list with increased timeout and retries
        const jobsListResult = await promiseWithTimeout(
          supabase.from('jobs')
            .select('id, title, company_name, location, created_at')
            .gte('deadline', todayStart)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(3),
          15000, // Increased from 8000ms to 15000ms
          2     // Allow up to 2 retries
        );
        
        if (!jobsListResult.error) {
          dashboardUpdates.jobRecommendationsList = jobsListResult.data || [];
          dataStatus.jobs = true;
        }
      } catch (error) {
        console.error('Error fetching jobs data:', error);
      }
      
      // Final update with jobs data
      if (Object.keys(dashboardUpdates).length > 0) {
        setDashboardData(prev => ({
          ...prev,
          ...dashboardUpdates
        }));
      }
      
      // Log which data was successfully loaded
      console.log('Dashboard data load status:', dataStatus);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // More helpful error messages based on error type
      if (error.message && error.message.includes('timeout')) {
        toast.error('Dashboard data is taking longer than expected to load. Some features may be limited.');
      } else if (error.message && error.message.includes('network')) {
        toast.error('Network issue detected. Please check your connection and try again.');
      } else {
        toast.error('Failed to load some dashboard data. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, promiseWithTimeout, fetchConnectionsCount]);

  const checkEventReminders = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const lastCheck = localStorage.getItem(`lastEventCheck_${userId}`);
      const now = new Date();
      if (lastCheck && now.toDateString() === new Date(lastCheck).toDateString()) {
        return;
      }

      const { data: registrations, error: regError } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('attendee_id', userId);

      if (regError) throw regError;
      if (!registrations || registrations.length === 0) {
        return;
      }

      const eventIds = registrations.map(reg => reg.event_id);

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, start_date, start_time')
        .in('id', eventIds);

      if (eventsError) throw eventsError;

      const upcomingEvents = events.filter(event => {
        if (!event) return false;
        const eventDate = new Date(`${event.start_date}T${event.start_time || '00:00:00'}`);
        const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 24;
      });

      if (upcomingEvents.length > 0) {
        const eventTitles = upcomingEvents.map(e => e.title).join(', ');
        const message = `Reminder: You have upcoming events within 24 hours: ${eventTitles}.`;
        showInfo(message, {
          duration: 10000,
          onClick: () => navigate('/events/my-registrations'),
          className: 'cursor-pointer',
        });
      }

      localStorage.setItem(`lastEventCheck_${userId}`, now.toISOString());
    } catch (error) {
      console.error('Error checking event reminders:', error);
    }
  }, [showInfo, navigate]);

  useEffect(() => {
    if (user?.id && !authLoading && !hasFetched.current) {
      hasFetched.current = true;
      fetchDashboardData();
      checkEventReminders(user.id);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user?.id, authLoading, fetchDashboardData, checkEventReminders]);

  useEffect(() => {
    if (location.state?.showToast) {
      toast.success(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (authLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse mb-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatSkeletonCard />
            <StatSkeletonCard />
            <StatSkeletonCard />
            <StatSkeletonCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SkeletonCard className="h-48" />
              <SkeletonCard className="h-64" />
            </div>
            <div className="space-y-6">
              <SkeletonCard className="h-64" />
              <SkeletonCard className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome back, {userName}!</h1>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatSkeletonCard />
            <StatSkeletonCard />
            <StatSkeletonCard />
            <StatSkeletonCard />
          </div>
        ) : (
          <React.Fragment>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Alumni */}
              <div className="glass-card rounded-lg p-4 flex items-center">
                <div className="bg-blue-100 rounded-full p-3 mr-4">
                  <UsersIcon className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Alumni</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.totalAlumni}</p>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="glass-card rounded-lg p-4 flex items-center">
                <div className="bg-green-100 rounded-full p-3 mr-4">
                  <CalendarIcon className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Upcoming Events</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.upcomingEventsCount}</p>
                </div>
              </div>

              {/* Job Opportunities */}
              <div className="glass-card rounded-lg p-4 flex items-center">
                <div className="bg-orange-100 rounded-full p-3 mr-4">
                  <BriefcaseIcon className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Job Opportunities</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.jobOpportunitiesCount}</p>
                </div>
              </div>

              {/* Personal Connections */}
              <div className="glass-card rounded-lg p-4 flex items-center">
                <div className="bg-purple-100 rounded-full p-3 mr-4">
                  <UsersIcon className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Connections</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.personalConnections}</p>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Left Column: News/Updates and My Groups */}
              <div className="lg:col-span-2 space-y-6">
                {/* My Groups - Placeholder */}
                <div className="glass-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">My Networking Groups</h3>
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h4 className="text-md font-semibold text-gray-700">No Groups Joined</h4>
                    <p className="text-sm text-gray-500 mt-1">Join a group to start networking with peers.</p>
                    <Link 
                      to="/networking"
                      className="mt-4 inline-block btn-ocean-fill text-sm py-2 px-4 rounded-lg"
                    >
                      Explore Groups
                    </Link>
                  </div>
                </div>

                {/* Recent Activity - Placeholder */}
                <div className="glass-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ArrowTrendingUpIcon className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h4 className="text-md font-semibold text-gray-700">No Recent Activity</h4>
                    <p className="text-sm text-gray-500 mt-1">Updates from your network will appear here.</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Upcoming Events and Job Recommendations */}
              <div className="space-y-6">
                {/* Upcoming Events */}
                <div className="glass-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                  <div className="space-y-3">
                    {dashboardData.upcomingEventsList.length > 0 ? dashboardData.upcomingEventsList.map((event) => (
                      <Link to={`/events/${event.id}`} key={event.id} className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100">
                        <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                        <p className="text-xs text-gray-600">{event.location}</p>
                        <p className="text-xs text-blue-600 font-medium">{formatEventDateTime(event.start_date, event.start_time)}</p>
                      </Link>
                    )) : 
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CalendarIcon className="w-6 h-6 text-blue-400" />
                      </div>
                      <h4 className="text-md font-semibold text-gray-700">No Upcoming Events</h4>
                      <p className="text-sm text-gray-500 mt-1">Check the events page for new listings.</p>
                    </div>}
                  </div>
                  <div className="mt-4">
                    <Link 
                      to="/events" 
                      className="btn-ocean-outline w-full py-2 px-4 rounded-lg text-center block text-sm"
                    >
                      View All Events
                    </Link>
                  </div>
                </div>

                {/* Job Recommendations */}
                <div className="glass-card rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Jobs</h3>
                  <div className="space-y-3">
                    {dashboardData.jobRecommendationsList.length > 0 ? dashboardData.jobRecommendationsList.map((job) => (
                      <Link to={`/jobs/${job.id}`} key={job.id} className="block p-3 bg-green-50 rounded-lg hover:bg-green-100">
                        <h4 className="font-medium text-gray-900 text-sm">{job.title}</h4>
                        <p className="text-xs text-gray-600">{job.company_name} - {job.location}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-green-600 font-medium">{job.salary_range || 'Not specified'}</p>
                          <p className="text-xs text-gray-500">{formatRelativeTime(job.created_at)}</p>
                        </div>
                      </Link>
                    )) :                   <div className="text-center py-4">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BriefcaseIcon className="w-6 h-6 text-green-400" />
                      </div>
                      <h4 className="text-md font-semibold text-gray-700">No Recommended Jobs</h4>
                      <p className="text-sm text-gray-500 mt-1">Explore the job portal for opportunities.</p>
                    </div>}
                  </div>
                  <div className="mt-4 flex flex-col space-y-2">
                    <Link 
                      to="/jobs" 
                      className="btn-ocean-outline w-full py-2 px-4 rounded-lg text-center block text-sm"
                    >
                      Browse All Jobs
                    </Link>
                    <Link 
                      to="/jobs/applications" 
                      className="text-ocean-600 hover:text-ocean-800 text-center block text-sm"
                    >
                      View My Applications
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        )}
      </div> {/* This closes the main grid <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> */}
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/directory" className="glass-card rounded-lg p-4 text-center card-hover">
          <UsersIcon className="w-8 h-8 text-ocean-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Find Alumni</p>
        </Link>
        <Link to="/events/create" className="glass-card rounded-lg p-4 text-center card-hover">
          <CalendarIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Create Event</p>
        </Link>

        <Link to="/jobs/applications" className="glass-card rounded-lg p-4 text-center card-hover">
          <ClipboardDocumentCheckIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">My Applications</p>
        </Link>
        <Link to="/mentorship" className="glass-card rounded-lg p-4 text-center card-hover">
          <AcademicCapIcon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Find Mentor</p>
        </Link>
        <Link to="/networking" className="glass-card rounded-lg p-4 text-center card-hover">
          <ChatBubbleLeftRightIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Join Groups</p>
        </Link>
      </div>
    </div>
  );
};

export default AlumniDashboard;