import React, { useState, useEffect } from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const UserApprovalDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending-employers');
  const [users, setUsers] = useState([]);
  const [mentorshipApplications, setMentorshipApplications] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Mock data - replace with actual API calls
  const mockPendingEmployers = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@oceanshipping.com',
      company: 'Ocean Shipping Ltd.',
      jobTitle: 'HR Director',
      industry: 'Shipping & Logistics',
      companySize: '201-1000',
      website: 'https://oceanshipping.com',
      linkedin: 'https://linkedin.com/in/johnsmith',
      registeredAt: '2024-01-15T10:30:00Z',
      status: 'pending_approval'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@maritimeconsult.com',
      company: 'Maritime Consulting Group',
      jobTitle: 'Senior Consultant',
      industry: 'Maritime Consulting',
      companySize: '51-200',
      website: 'https://maritimeconsult.com',
      registeredAt: '2024-01-14T15:45:00Z',
      status: 'pending_approval'
    }
  ];

  const mockMentorshipApplications = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      role: 'mentor',
      graduationYear: 2018,
      experienceYears: 6,
      currentPosition: 'Senior Marine Engineer',
      company: 'Shipping Corp India',
      skills: ['Marine Engineering', 'Project Management', 'Leadership'],
      interests: ['Career Development', 'Technical Skills'],
      goals: 'Help young engineers develop technical and leadership skills',
      appliedAt: '2024-01-10T09:00:00Z',
      status: 'pending_review'
    },
    {
      id: '2',
      name: 'Priya Sharma',
      email: 'priya.sharma@student.amet.ac.in',
      role: 'mentee',
      graduationYear: 2024,
      experienceYears: 0,
      degree: 'B.Tech Naval Architecture',
      skills: ['Naval Architecture', 'AutoCAD'],
      interests: ['Career Development', 'International Markets'],
      goals: 'Guidance for career transition into offshore industry',
      appliedAt: '2024-01-12T14:20:00Z',
      status: 'pending_review'
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'm.chen@email.com',
      role: 'both',
      graduationYear: 2020,
      experienceYears: 4,
      currentPosition: 'Naval Architect',
      company: 'Shipyard Technologies',
      skills: ['Naval Architecture', 'Design Software', 'Project Management'],
      interests: ['Technical Skills', 'Leadership Training'],
      goals: 'Mentor students while learning about business development',
      appliedAt: '2024-01-11T11:15:00Z',
      status: 'pending_review'
    }
  ];

  useEffect(() => {
    // Load data based on active tab
    if (activeTab === 'pending-employers') {
      setUsers(mockPendingEmployers);
    } else {
      setMentorshipApplications(mockMentorshipApplications);
    }
  }, [activeTab]);

  const handleApprove = async (userId, type) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (type === 'employer') {
        setUsers(prev => prev.filter(user => user.id !== userId));
        // Here you would update user status in Supabase
        console.log(`Approved employer: ${userId}`);
      } else {
        setMentorshipApplications(prev => prev.filter(app => app.id !== userId));
        // Here you would update mentorship application status
        console.log(`Approved mentorship application: ${userId}`);
      }
      
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (userId, type) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (type === 'employer') {
        setUsers(prev => prev.filter(user => user.id !== userId));
        console.log(`Rejected employer: ${userId}`);
      } else {
        setMentorshipApplications(prev => prev.filter(app => app.id !== userId));
        console.log(`Rejected mentorship application: ${userId}`);
      }
      
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = (user, type) => {
    setSelectedUser({ ...user, type });
    setShowModal(true);
  };

  const tabs = [
    {
      id: 'pending-employers',
      name: 'Pending Employers',
      icon: BriefcaseIcon,
      count: mockPendingEmployers.length
    },
    {
      id: 'mentorship-applications',
      name: 'Mentorship Applications',
      icon: AcademicCapIcon,
      count: mockMentorshipApplications.length
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Review and approve user registrations and mentorship applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{mockPendingEmployers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <AcademicCapIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mentorship Applications</p>
              <p className="text-2xl font-bold text-gray-900">{mockMentorshipApplications.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <UserGroupIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Registered Users</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'pending-employers' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Employer Registrations</h3>
              
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending employer registrations</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{user.name}</h4>
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Pending Review
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Email:</strong> {user.email}</p>
                              <p><strong>Company:</strong> {user.company}</p>
                              <p><strong>Position:</strong> {user.jobTitle}</p>
                            </div>
                            <div>
                              <p><strong>Industry:</strong> {user.industry}</p>
                              <p><strong>Company Size:</strong> {user.companySize}</p>
                              <p><strong>Registered:</strong> {new Date(user.registeredAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => openUserModal(user, 'employer')}
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleApprove(user.id, 'employer')}
                            disabled={loading}
                            className="p-2 text-green-600 hover:text-green-700 rounded-full hover:bg-green-50 disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(user.id, 'employer')}
                            disabled={loading}
                            className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50 disabled:opacity-50"
                            title="Reject"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'mentorship-applications' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Mentorship Program Applications</h3>
              
              {mentorshipApplications.length === 0 ? (
                <div className="text-center py-8">
                  <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending mentorship applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mentorshipApplications.map((application) => (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{application.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              application.role === 'mentor' ? 'bg-blue-100 text-blue-800' :
                              application.role === 'mentee' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {application.role === 'both' ? 'Mentor & Mentee' : application.role}
                            </span>
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Pending Review
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Email:</strong> {application.email}</p>
                              <p><strong>Graduation:</strong> {application.graduationYear}</p>
                              <p><strong>Experience:</strong> {application.experienceYears} years</p>
                            </div>
                            <div>
                              {application.currentPosition && (
                                <p><strong>Position:</strong> {application.currentPosition}</p>
                              )}
                              {application.company && (
                                <p><strong>Company:</strong> {application.company}</p>
                              )}
                              <p><strong>Applied:</strong> {new Date(application.appliedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-sm text-gray-600">
                              <strong>Skills:</strong> {application.skills.join(', ')}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Goals:</strong> {application.goals}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => openUserModal(application, 'mentorship')}
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleApprove(application.id, 'mentorship')}
                            disabled={loading}
                            className="p-2 text-green-600 hover:text-green-700 rounded-full hover:bg-green-50 disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(application.id, 'mentorship')}
                            disabled={loading}
                            className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50 disabled:opacity-50"
                            title="Reject"
                          >
                            <XMarkIcon className="w-5 h-5" />
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

      {/* Modal for viewing details */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedUser.type === 'employer' ? 'Employer Details' : 'Mentorship Application Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {selectedUser.type === 'employer' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <p className="text-sm text-gray-900">{selectedUser.company}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Job Title</label>
                      <p className="text-sm text-gray-900">{selectedUser.jobTitle}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Industry</label>
                      <p className="text-sm text-gray-900">{selectedUser.industry}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Size</label>
                      <p className="text-sm text-gray-900">{selectedUser.companySize}</p>
                    </div>
                  </div>
                  
                  {selectedUser.website && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      <a href={selectedUser.website} target="_blank" rel="noopener noreferrer" 
                         className="text-sm text-blue-600 hover:text-blue-700">
                        {selectedUser.website}
                      </a>
                    </div>
                  )}
                  
                  {selectedUser.linkedin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                      <a href={selectedUser.linkedin} target="_blank" rel="noopener noreferrer"
                         className="text-sm text-blue-600 hover:text-blue-700">
                        {selectedUser.linkedin}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedUser.role}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experience</label>
                      <p className="text-sm text-gray-900">{selectedUser.experienceYears} years</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Skills</label>
                    <p className="text-sm text-gray-900">{selectedUser.skills.join(', ')}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interests</label>
                    <p className="text-sm text-gray-900">{selectedUser.interests.join(', ')}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Goals</label>
                    <p className="text-sm text-gray-900">{selectedUser.goals}</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => handleReject(selectedUser.id, selectedUser.type)}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => handleApprove(selectedUser.id, selectedUser.type)}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserApprovalDashboard;