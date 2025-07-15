import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

// Context
import { useAuth } from './contexts/AuthContext';

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

// Auth Components
import Login from './components/Auth/Login';
import EnhancedRegister from './components/Auth/EnhancedRegister';
import Profile from './components/Auth/Profile';
import ForgotPassword from './components/Auth/ForgotPassword';
import UpdatePassword from './components/Auth/UpdatePassword';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Dashboard Components
import AlumniDashboard from './components/Dashboard/AlumniDashboard';
import AdminDashboard from './components/Admin/Dashboard';
import EmployerDashboard from './components/Dashboard/EmployerDashboard';

// Feature Components
import AlumniDirectory from './components/Directory/AlumniDirectory';
import AlumniProfile from './components/Directory/AlumniProfile';
import EventsPage from './pages/EventsPage';
import GroupsPage from './pages/GroupsPage';
import JobListingsPage from './components/Jobs/JobListingsPage';
import JobDetails from './components/Jobs/JobDetails';
import UserProfilePage from './pages/UserProfilePage';
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
  const { user, profile, loading, getUserRole } = useAuth();

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
        return <EmployerDashboard user={profile || user} />;
      default:
        return <AlumniDashboard user={profile || user} />;
    }
  };

  return user ? (
    <div className="flex h-screen bg-ocean-50">
      <Navigation user={profile || user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={profile || user} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-ocean-50 to-blue-50 p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={getDashboardComponent()} />
            <Route path="/profile" element={<Profile user={profile || user} />} />
            <Route path="/directory" element={<AlumniDirectory />} />
            <Route path="/directory/:id" element={<AlumniProfile />} />
            <Route path="/events/*" element={<EventsPage />} />
                        <Route path="/jobs" element={<JobListingsPage />} />
            <Route path="/jobs/alerts" element={<JobAlerts />} />
                        <Route path="/jobs/post" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'super_admin']}><PostJob /></ProtectedRoute>} />
            <Route path="/jobs/post/select" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'super_admin']}><PostJobSelection /></ProtectedRoute>} />
            <Route path="/jobs/post/link" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'super_admin']}><PostJobWithLink /></ProtectedRoute>} />
            <Route path="/jobs/create" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'super_admin']}><JobPostingForm /></ProtectedRoute>} />
            <Route path="/jobs/applications" element={<ApplicationTracking />} />
            <Route path="/jobs/applications/:id" element={<ApplicationTracking />} />
            <Route path="/jobs/:jobId/apply" element={<JobApplication />} />
            <Route path="/jobs/:jobId/application-success" element={<Navigate to="/jobs/applications" />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/jobs/:jobId/manage" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'super_admin']}><ManageJobApplications /></ProtectedRoute>} />
            <Route path="/my-applications" element={<ProtectedRoute><JobApplicationStatus /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<UserProfilePage />} />
            
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/mentorship/become-mentor" element={<MentorRegistrationForm />} />
            <Route path="/mentorship/become-mentee" element={<MenteeRegistrationForm />} />
            <Route path="/mentorship" element={<Mentorship />} />
            <Route path="/mentorship/dashboard" element={<ProtectedRoute><MentorshipDashboard /></ProtectedRoute>} />
            <Route path="/mentorship/directory" element={<ProtectedRoute><MentorDirectory /></ProtectedRoute>} />
            <Route path="/mentorship/requests" element={<ProtectedRoute><MentorshipStatus /></ProtectedRoute>} />
            <Route path="/mentorship/chat/:requestId" element={<ProtectedRoute><MentorshipChat /></ProtectedRoute>} />
            <Route path="/mentorship/matching" element={<ProtectedRoute><MentorMatching /></ProtectedRoute>} />
            <Route path="/mentorship/mentor/:id" element={<MentorProfile />} />
            <Route path="/mentorship/mentor-settings" element={<MentorRegistrationForm />} />
            <Route path="/groups/*" element={<GroupsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><Analytics /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminSettings /></ProtectedRoute>} />
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
      <Route path="/directory" element={<HomePage />} />
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
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <Router>
          <AppContent />
          <FeedbackWidget />
        </Router>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;
