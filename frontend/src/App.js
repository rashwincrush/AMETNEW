import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

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

// Mock user for demonstration
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@amet.ac.in',
  role: 'alumni', // alumni, admin, employer
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  isAuthenticated: false
};

function App() {
  const [user, setUser] = useState(mockUser);

  const login = (userData) => {
    setUser({
      ...userData,
      isAuthenticated: true
    });
  };

  const logout = () => {
    setUser({
      ...mockUser,
      isAuthenticated: false
    });
  };

  const getDashboardComponent = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'employer':
        return <EmployerDashboard user={user} />;
      default:
        return <AlumniDashboard user={user} />;
    }
  };

  return (
    <div className="App">
      <Router>
        {user.isAuthenticated ? (
          <div className="flex h-screen bg-ocean-50">
            <Navigation user={user} onLogout={logout} />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header user={user} />
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-ocean-50 to-blue-50 p-6">
                <Routes>
                  <Route path="/" element={getDashboardComponent()} />
                  <Route path="/dashboard" element={getDashboardComponent()} />
                  <Route path="/profile" element={<Profile user={user} />} />
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
                  {user.role === 'admin' && (
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
              <Route path="/login" element={<Login onLogin={login} />} />
              <Route path="/register" element={<Register onLogin={login} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </div>
        )}
      </Router>
    </div>
  );
}

export default App;