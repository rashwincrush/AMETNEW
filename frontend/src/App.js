import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layout Components
import Navigation from './components/Layout/Navigation';
import Header from './components/Layout/Header';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Profile from './components/Auth/Profile';

// Dashboard Components
import AlumniDashboard from './components/Dashboard/AlumniDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import EmployerDashboard from './components/Dashboard/EmployerDashboard';

// Feature Components
import AlumniDirectory from './components/Directory/AlumniDirectory';
import AlumniProfile from './components/Directory/AlumniProfile';
import Events from './components/Events/Events';
import EventDetails from './components/Events/EventDetails';
import CreateEvent from './components/Events/CreateEvent';
import EventCalendar from './components/Events/EventCalendar';
import Jobs from './components/Jobs/Jobs';
import JobDetails from './components/Jobs/JobDetails';
import PostJob from './components/Jobs/PostJob';
import JobAlerts from './components/Jobs/JobAlerts';
import Mentorship from './components/Mentorship/Mentorship';
import NetworkingGroups from './components/Networking/NetworkingGroups';
import Messages from './components/Messages/Messages';
import Analytics from './components/Admin/Analytics';
import UserManagement from './components/Admin/UserManagement';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-500 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto">
            <div className="w-10 h-10 bg-ocean-gradient rounded-lg flex items-center justify-center ocean-wave">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          </div>
          <div className="text-white text-lg">Loading AMET Alumni Portal...</div>
        </div>
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

  return (
    <div className="App">
      <Router>
        {user ? (
          <div className="flex h-screen bg-ocean-50">
            <Navigation user={profile || user} />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header user={profile || user} />
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-ocean-50 to-blue-50 p-6">
                <Routes>
                  <Route path="/" element={getDashboardComponent()} />
                  <Route path="/dashboard" element={getDashboardComponent()} />
                  <Route path="/profile" element={<Profile user={profile || user} />} />
                  <Route path="/directory" element={<AlumniDirectory />} />
                  <Route path="/directory/:id" element={<AlumniProfile />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/calendar" element={<EventCalendar />} />
                  <Route path="/events/:id" element={<EventDetails />} />
                  <Route path="/events/create" element={<CreateEvent />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/jobs/alerts" element={<JobAlerts />} />
                  <Route path="/jobs/:id" element={<JobDetails />} />
                  <Route path="/jobs/post" element={<PostJob />} />
                  <Route path="/mentorship" element={<Mentorship />} />
                  <Route path="/networking" element={<NetworkingGroups />} />
                  <Route path="/messages" element={<Messages />} />
                  {getUserRole() === 'admin' && (
                    <>
                      <Route path="/admin/analytics" element={<Analytics />} />
                      <Route path="/admin/users" element={<UserManagement />} />
                    </>
                  )}
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </main>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-ocean-500 to-blue-800">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        )}
      </Router>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;