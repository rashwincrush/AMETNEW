import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { Link } from 'react-router-dom';
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
  console.log('AlumniDashboard: Component mounted/rendered');
  const { user, profile, loading: authLoading } = useAuth(); // Get user and profile from AuthContext
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

  useEffect(() => {
    console.log('AlumniDashboard: useEffect for data fetching triggered.');
    console.log('AlumniDashboard: Auth state:', { authLoading, user: !!user, userId: user?.id });
    // Wait for authLoading to be false and user to be available
    if (authLoading) {
      console.log('AlumniDashboard: Auth is loading, returning early.');
      return;
    }
    if (!user || !user.id) {
      console.log('AlumniDashboard: User or user.id is not available, returning early.');
      setLoading(false);
      toast.error('User information is not available.');
      return;
    }

    const fetchDashboardData = async () => {
      console.log('AlumniDashboard: fetchDashboardData started.');
      setLoading(true);
      console.log('AlumniDashboard: setLoading(true)');
      try {
        const today = new Date().toISOString();

        // 1. Personal Connections - count connections where user is requester or recipient and status is accepted
        const { count: personalConnections, error: personalConnectionsError } = await supabase
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .eq('status', 'accepted');
        if (personalConnectionsError) {
          console.error('AlumniDashboard: Error fetching personal connections:', personalConnectionsError);
          throw new Error(`Personal Connections: ${personalConnectionsError.message}`);
        }
        console.log('AlumniDashboard: Fetched personal connections:', personalConnections);
        
        // 2. Total Alumni - count all profiles, matching the logic in AlumniDirectory.js
        const { count: totalAlumni, error: totalAlumniError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });
        if (totalAlumniError) {
          console.error('AlumniDashboard: Error fetching total alumni:', totalAlumniError);
          throw new Error(`Total Alumni: ${totalAlumniError.message}`);
        }
        console.log('AlumniDashboard: Fetched total alumni:', totalAlumni);

        // 3. Upcoming Events Count & List
        const { count: eventsCount, error: eventsError } = await supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .gte('start_date', today) // Use start_date
          .eq('is_published', true); // Assuming only published events should be counted
        if (eventsError) {
          console.error('AlumniDashboard: Error fetching upcoming events count:', eventsError);
          throw new Error(`Upcoming Events Count: ${eventsError.message}`);
        }
        console.log('AlumniDashboard: Fetched upcoming events count:', eventsCount);
        
        const { data: eventsList, error: eventsListError } = await supabase
          .from('events')
          // Removed attendees_count subquery as event_registrations table doesn't exist
          .select('id, title, start_date, end_date, location, virtual_link, event_type') 
          .gte('start_date', today)
          .eq('is_published', true)
          .order('start_date', { ascending: true })
          .limit(3);
        if (eventsListError) {
          console.error('AlumniDashboard: Error fetching upcoming events list:', eventsListError);
          throw new Error(`Upcoming Events List: ${eventsListError.message}`);
        }
        console.log('AlumniDashboard: Fetched upcoming events list:', eventsList);

        // 4. Job Opportunities Count & List
        const { count: jobsCount, error: jobsError } = await supabase
          .from('jobs')
          .select('id', { count: 'exact', head: true })
          .gte('deadline', today) // Use deadline
          .eq('is_active', true); // Use is_active (boolean)
        if (jobsError) {
          console.error('AlumniDashboard: Error fetching job opportunities count:', jobsError);
          throw new Error(`Job Opportunities Count: ${jobsError.message}`);
        }
        console.log('AlumniDashboard: Fetched job opportunities count:', jobsCount);

        const { data: jobsList, error: jobsListError } = await supabase
          .from('jobs')
          .select('id, title, company_name, location, salary_range, created_at, job_type') // Use created_at for posted_at
          .gte('deadline', today)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(3);
        if (jobsListError) {
          console.error('AlumniDashboard: Error fetching job opportunities list:', jobsListError);
          throw new Error(`Job Opportunities List: ${jobsListError.message}`);
        }
        console.log('AlumniDashboard: Fetched job opportunities list:', jobsList);

        // 5. Unread Messages Count
        const { count: messagesCount, error: messagesError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id) // Use recipient_id
          .eq('is_read', false); // Use is_read (boolean)
        if (messagesError) {
          console.error('AlumniDashboard: Error fetching unread messages count:', messagesError);
          throw new Error(`Unread Messages: ${messagesError.message}`);
        }
        console.log('AlumniDashboard: Fetched unread messages count:', messagesCount);

        // 5. Recent Activity List - COMMENTED OUT (activity_log table doesn't exist yet)
        // Keep the fetch commented out until the activity_log table is created
        // const { data: activityList, error: activityError } = await supabase
        //   .from('activity_log') 
        //   .select('id, activity_type, description, created_at, status, entity_type, entity_id, entity_title')
           console.log('AlumniDashboard: Fetched job recommendations:', jobsList);

        console.log('AlumniDashboard: Successfully fetched all data, updating state.');
        setDashboardData(prevData => ({
          ...prevData,
          personalConnections: personalConnections || 0,
          totalAlumni: totalAlumni || 0,
          upcomingEventsCount: eventsCount || 0,
          jobOpportunitiesCount: jobsCount || 0,
          unreadMessagesCount: messagesCount || 0,
          // recentActivities: recentActivitiesData || [], // Keep commented out
          upcomingEventsList: eventsList || [],
          jobRecommendationsList: jobsList || [],
        }));

      } catch (error) {
        console.error('AlumniDashboard: Error in fetchDashboardData:', error.message);
        toast.error(`Failed to load dashboard: ${error.message}`);
      } finally {
        console.log('AlumniDashboard: fetchDashboardData finished, setLoading(false)');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, authLoading]); // Re-run effect when user or auth state changes

  const dynamicQuickStats = [
    { title: 'Alumni Connections', value: `${dashboardData.personalConnections}/${dashboardData.totalAlumni}`, icon: UsersIcon, color: 'bg-blue-500', path: '/directory' },
    { title: 'Upcoming Events', value: dashboardData.upcomingEventsCount, icon: CalendarIcon, color: 'bg-green-500', path: '/events' },
    { title: 'Job Opportunities', value: dashboardData.jobOpportunitiesCount, icon: BriefcaseIcon, color: 'bg-purple-500', path: '/jobs' },
    { title: 'Unread Messages', value: dashboardData.unreadMessagesCount, icon: ChatBubbleLeftRightIcon, color: 'bg-orange-500', path: '/messages' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 glass-card rounded-lg p-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 glass-card rounded-lg p-6"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 glass-card rounded-lg p-6"></div>
          <div className="space-y-6">
            <div className="h-48 glass-card rounded-lg p-6"></div>
            <div className="h-48 glass-card rounded-lg p-6"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // userName is already declared above within the component scope.

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userName}! 🌊</h1>
            <p className="text-gray-600 mt-1">
              Stay connected with your AMET alumni network
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-ocean-gradient rounded-full flex items-center justify-center ocean-wave">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v4.8l-2.787 5.574A1 1 0 003.68 15h7.84a.25.25 0 01.192.41l-.056.084-.808 1.212A3 3 0 0110 18h4a3 3 0 01-.857-1.294l-.808-1.212a.25.25 0 01.192-.494h7.84a1 1 0 00.467-1.626L18 7.8V3h-3v1.5a.5.5 0 01-.5.5h-6a.5.5 0 01-.5-.5V3H6zm.75 11a.75.75 0 100-1.5.75.75 0 000 1.5zm10.5 0a.75.75 0 100-1.5.75.75 0 000 1.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards Section */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatSkeletonCard />
          <StatSkeletonCard />
          <StatSkeletonCard />
          <StatSkeletonCard />
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dynamicQuickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link to={stat.path} key={index} className="block glass-card rounded-lg p-6 card-hover no-underline">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      )} {/* Closes the ternary operator for stat cards loading state */}

      {/* Main Content Area: Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          // Skeleton for the entire 3-column section
          <React.Fragment>
            <div className="lg:col-span-2">
              <SkeletonCard className="h-64" /> {/* Skeleton for Recent Activity */}
            </div>
            <div className="space-y-6"> {/* Skeleton for Events & Jobs column */}
              <SkeletonCard className="h-48" />
              <SkeletonCard className="h-48" />
            </div>
          </React.Fragment>
        ) : (
          // Actual content for the 3-column section
          <React.Fragment>
            {/* Column 1 & 2: Recent Activity */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <ArrowTrendingUpIcon className="w-5 h-5 text-ocean-500" />
                </div>
                <p className="text-gray-500 text-center py-4">Activity feed will be available soon.</p>
                <div className="mt-4 text-center">
                  <Link 
                    to="/activity" 
                    className="text-ocean-600 hover:text-ocean-700 text-sm font-medium"
                  >
                    Activity Center →
                  </Link>
                </div>
              </div>
            </div>

            {/* Column 3: Quick Actions (Upcoming Events & Job Recommendations) */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <div className="glass-card rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                <div className="space-y-3">
                  {dashboardData.upcomingEventsList.length > 0 ? dashboardData.upcomingEventsList.map((event) => (
                    <Link to={`/events/${event.id}`} key={event.id} className="block p-3 bg-ocean-50 rounded-lg hover:bg-ocean-100">
                      <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                      <p className="text-xs text-gray-600">{formatEventDateTime(event.start_date, null)}</p>
                      <p className="text-xs text-gray-500 capitalize">{event.event_type} {event.location ? `- ${event.location}` : (event.virtual_link ? '- Virtual' : '')}</p>
                    </Link>
                  )) :                   <div className="text-center py-4">
                    <div className="w-12 h-12 bg-ocean-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CalendarIcon className="w-6 h-6 text-ocean-400" />
                    </div>
                    <h4 className="text-md font-semibold text-gray-700">No Upcoming Events</h4>
                    <p className="text-sm text-gray-500 mt-1">Check back later or create one.</p>
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