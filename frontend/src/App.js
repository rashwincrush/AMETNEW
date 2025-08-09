import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RealtimeProvider } from './utils/supabase';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Context
import { useAuth, AuthProvider } from './contexts/AuthContext';

// Common Components
import Logo from './components/common/Logo';

// Home Page
import HomePage from './components/Landing/HomePage';

// Notifications Component
import Notifications from './components/Notifications/Notifications';
import { NotificationProvider } from './components/common/NotificationCenter';
import FeedbackWidget from './components/common/FeedbackWidget';

// Layout Components
import Navigation from './components/Layout/Navigation';
import Header from './components/Layout/Header';
import EditEvent from './components/Events/EditEvent';
import CreateEvent from './components/Events/CreateEvent';
import EventFeedbackReport from './components/Admin/EventFeedbackReport';

// Auth Components
import Login from './components/Auth/Login';
import EnhancedRegister from './components/Auth/EnhancedRegister';
import Profile from './components/Auth/Profile';
import ForgotPassword from './components/Auth/ForgotPassword';
import UpdatePassword from './components/Auth/UpdatePassword';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AccessDenied from './components/Auth/AccessDenied';
import RejectionPage from './components/Auth/RejectionPage';

// Dashboard Components
import AlumniDashboard from './components/Dashboard/AlumniDashboard';
import AdminDashboard from './components/Admin/Dashboard';


// Feature Components
import AlumniDirectory from './components/Directory/AlumniDirectory';
import AlumniProfile from './components/Directory/AlumniProfile';
import EventsPage from './pages/EventsPage';
import GroupsPage from './pages/GroupsPage';
import JobListingsPage from './components/Jobs/JobListingsPage';
import JobDetails from './components/Jobs/JobDetails';
import BookmarkedJobs from './components/Jobs/BookmarkedJobs';
import UserProfilePage from './pages/UserProfilePage';
import CompanyProfile from './components/Companies/CompanyProfile';
import PublicCompanyProfile from './components/Companies/PublicCompanyProfile';
import CSVImportExport from './components/Admin/CSVImportExport';
import EditCompanyProfile from './components/Companies/EditCompanyProfile';
import MentorRegistrationForm from './components/Mentorship/MentorRegistrationForm';
import PostJob from './components/Jobs/PostJob';
import PostJobSelection from './components/Jobs/PostJobSelection';
import PostJobWithLink from './components/Jobs/PostJobWithLink';
import JobAlerts from './components/Jobs/JobAlerts';
import MessagesPage from './pages/MessagesPage';
import JobPostingForm from './components/Jobs/JobPostingForm';
import ResumeUploadForm from './components/Jobs/ResumeUploadForm';
import JobApplication from './components/Jobs/JobApplication';
import ApplicationTracking from './components/Jobs/ApplicationTracking';
import EditJob from './components/Jobs/EditJob';
import Mentorship from './components/Mentorship/Mentorship';
// import NetworkingGroups from './components/Networking/NetworkingGroups';
// import NetworkingGroupsDirectory from './components/NetworkingGroups/NetworkingGroupsDirectory';
// import NetworkingGroupDetail from './components/NetworkingGroups/NetworkingGroupDetail';
import BecomeMentorForm from './components/Mentorship/BecomeMentorForm';
import MentorProfile from './components/Mentorship/MentorProfile';
import MentorSettings from './components/Mentorship/MentorSettings';
import CreateGroup from './components/Networking/CreateGroup';
import GroupDetails from './components/Networking/GroupDetails';
import Messages from './components/Messages/Messages';
import Analytics from './components/Admin/Analytics';
import UserManagement from './components/Admin/UserManagement';

import AdminSettings from './components/Admin/AdminSettings';
import FeedbackReport from './components/Admin/FeedbackReport';
import MenteeRegistrationForm from './components/Mentorship/MenteeRegistrationForm';
import JobApplicationStatus from './components/Jobs/JobApplicationStatus';
import ManageJobApplications from './components/Jobs/ManageJobApplications';
import MentorshipDashboard from './components/Mentorship/MentorshipDashboard';
import MentorDirectory from './components/Mentorship/MentorDirectory';
import MentorshipStatus from './components/Mentorship/MentorshipStatus';
import MentorshipChat from './components/Mentorship/MentorshipChat';
import MentorMatching from './components/Mentorship/MentorMatching';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function AppContent() {
  const { user, profile, loading, getUserRole, rejectionStatus } = useAuth();

  useEffect(() => {
    console.log('App state:', { 
      loading, 
      hasUser: !!user, 
      hasProfile: !!profile,
      userRole: getUserRole()
    });
  }, [loading, user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner message="Initializing application..." />
      </div>
    );
  }

  const getDashboardComponent = () => {
    const role = getUserRole();
    switch (role) {
      case 'admin':
        return <AdminDashboard user={profile || user} />;
      case 'employer':
        return <Navigate to="/profile" />;
      default:
        return <AlumniDashboard user={profile || user} />;
    }
  };

  // Check if user is rejected - if so, we'll only render the RejectionPage
  const { isRejected } = rejectionStatus;

  // Special handling for rejection page - no navigation, header or main app
  if (user && isRejected) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/rejection" />} />
        <Route path="/rejection" element={<RejectionPage />} />
      </Routes>
    );
  }

  return user ? (
    <div className="flex h-screen bg-ocean-50">
      <Navigation user={profile || user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={profile || user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-ocean-50 to-blue-50 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<ProtectedRoute requiredPermission="access:dashboard">{getDashboardComponent()}</ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute requiredPermission="access:profile_settings"><Profile user={profile || user} /></ProtectedRoute>} />
            <Route path="/companies/:id" element={<PublicCompanyProfile />} />
            <Route path="/company/edit" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'super_admin']}><EditCompanyProfile user={profile || user} /></ProtectedRoute>} />
            <Route path="/events/*" element={<ProtectedRoute requiredPermission="access:events"><EventsPage /></ProtectedRoute>} />
            <Route path="/events/edit/:id" element={<ProtectedRoute requiredPermission="access:events"><EditEvent /></ProtectedRoute>} />
            <Route path="/events/create" element={<ProtectedRoute requiredPermission="access:events"><CreateEvent /></ProtectedRoute>} />
            <Route path="/admin/events/:id/feedback" element={<ProtectedRoute requiredPermission="access:all"><EventFeedbackReport /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute requiredPermission="view:jobs"><JobListingsPage /></ProtectedRoute>} />
            <Route path="/jobs/alerts" element={<ProtectedRoute requiredPermission="view:jobs"><JobAlerts /></ProtectedRoute>} />
            <Route path="/jobs/post" element={<ProtectedRoute requiredPermission="post:jobs"><PostJob /></ProtectedRoute>} />
            <Route path="/jobs/post/select" element={<ProtectedRoute requiredPermission="post:jobs"><PostJobSelection /></ProtectedRoute>} />
            <Route path="/jobs/post/link" element={<ProtectedRoute requiredPermission="post:jobs"><PostJobWithLink /></ProtectedRoute>} />
            <Route path="/jobs/create" element={<ProtectedRoute requiredPermission="post:jobs"><JobPostingForm /></ProtectedRoute>} />
            <Route path="/jobs/applications" element={<ProtectedRoute requiredPermission="apply:jobs"><ApplicationTracking /></ProtectedRoute>} />
            <Route path="/jobs/applications/:id" element={<ProtectedRoute requiredPermission="apply:jobs"><ApplicationTracking /></ProtectedRoute>} />
            <Route path="/jobs/:jobId/apply" element={<JobApplication />} />
            <Route path="/jobs/:jobId/application-success" element={<Navigate to="/jobs/applications" />} />
            <Route path="/jobs/:id" element={<ProtectedRoute requiredPermission="view:jobs"><JobDetails /></ProtectedRoute>} />
            <Route path="/jobs/edit/:id" element={<ProtectedRoute requiredPermission="post:jobs"><EditJob /></ProtectedRoute>} />

            <Route path="/jobs/:jobId/manage" element={<ProtectedRoute requiredPermission="view:job_applications"><ManageJobApplications /></ProtectedRoute>} />
            <Route path="/my-applications" element={<ProtectedRoute><JobApplicationStatus /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute requiredPermission="view:alumni_directory"><UserProfilePage /></ProtectedRoute>} />
            <Route path="/directory" element={<ProtectedRoute requiredPermission="view:alumni_directory"><AlumniDirectory /></ProtectedRoute>} />
            <Route path="/directory/:id" element={<ProtectedRoute requiredPermission="view:alumni_directory"><AlumniProfile /></ProtectedRoute>} />
            
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/mentorship/become-mentor" element={<ProtectedRoute requiredPermission="manage:mentor_profile"><MentorRegistrationForm /></ProtectedRoute>} />
            <Route path="/mentorship/become-mentee" element={<ProtectedRoute requiredPermission="request:mentorship"><MenteeRegistrationForm /></ProtectedRoute>} />
            <Route path="/mentorship" element={<ProtectedRoute requiredPermission="request:mentorship"><Mentorship /></ProtectedRoute>} />
            <Route path="/mentorship/dashboard" element={<ProtectedRoute requiredPermission="request:mentorship"><MentorshipDashboard /></ProtectedRoute>} />
            <Route path="/mentorship/directory" element={<ProtectedRoute requiredPermission="request:mentorship"><MentorDirectory /></ProtectedRoute>} />
            <Route path="/mentorship/requests" element={<ProtectedRoute requiredPermission="manage:mentee_requests"><MentorshipStatus /></ProtectedRoute>} />
            <Route path="/mentorship/chat/:requestId" element={<ProtectedRoute requiredPermission="chat:mentees"><MentorshipChat /></ProtectedRoute>} />
            <Route path="/mentorship/matching" element={<ProtectedRoute requiredPermission="request:mentorship"><MentorMatching /></ProtectedRoute>} />
            <Route path="/mentorship/mentor/:id" element={<ProtectedRoute requiredPermission="view:alumni_directory"><MentorProfile /></ProtectedRoute>} />
            <Route path="/mentorship/mentor-settings" element={<ProtectedRoute requiredPermission="manage:mentor_profile"><MentorRegistrationForm /></ProtectedRoute>} />
            <Route path="/groups/*" element={<ProtectedRoute requiredPermission="join:groups"><GroupsPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute requiredPermission="message:users"><MessagesPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin/analytics" element={<ProtectedRoute requiredPermission="access:all"><Analytics /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredPermission="access:all"><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredPermission="access:all"><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/csv" element={<ProtectedRoute requiredPermission="access:all"><CSVImportExport /></ProtectedRoute>} />
            <Route path="/admin/events/:id/feedback" element={<ProtectedRoute requiredPermission="access:all"><EventFeedbackReport /></ProtectedRoute>} />
            <Route path="/admin/feedback" element={<ProtectedRoute isSuperAdminOnly={true}><FeedbackReport /></ProtectedRoute>} />
            <Route path="/rejection" element={<RejectionPage />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </div>
  ) : (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<EnhancedRegister />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/directory" element={<Navigate to="/login" />} />
      <Route path="/events" element={<HomePage />} />
      <Route path="/jobs" element={<HomePage />} />
      <Route path="/mentorship" element={<HomePage />} />
      <Route path="/about" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RealtimeProvider>
            <NotificationProvider>
              <AppContent />
              <FeedbackWidget />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#333',
                  },
                  success: {
                    style: {
                      background: '#e6f7e6',
                      border: '1px solid #c3e6cb',
                    },
                  },
                  error: {
                    style: {
                      background: '#f8d7da',
                      border: '1px solid #f5c6cb',
                    },
                    duration: 5000,
                  },
                }}
              />
            </NotificationProvider>
          </RealtimeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
