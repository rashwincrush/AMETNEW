import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service object
const apiService = {
  // Health check
  healthCheck: () => api.get('/api/health'),

  // User management
  getUsers: () => api.get('/api/users'),
  getUser: (userId) => api.get(`/api/users/${userId}`),
  createUser: (userData) => api.post('/api/users', userData),

  // Dashboard
  getDashboardStats: () => api.get('/api/dashboard/stats'),

  // Jobs
  getJobs: () => api.get('/api/jobs'),
  getJob: (jobId) => api.get(`/api/jobs/${jobId}`),
  createJob: (jobData) => api.post('/api/jobs', jobData),

  // Job Applications
  getJobApplications: () => api.get('/api/job-applications'),
  getPendingApplications: () => api.get('/api/job-applications/pending'),
  createJobApplication: (applicationData) => api.post('/api/job-applications', applicationData),
  reviewJobApplication: (applicationId, reviewData) => 
    api.put(`/api/job-applications/${applicationId}/review`, reviewData),

  // Messages
  sendMessage: (messageData) => api.post('/api/messages', messageData),
  getConversation: (userId) => api.get(`/api/messages/conversations/${userId}`),
  getRecentConversations: () => api.get('/api/messages/recent'),
};

export default apiService;