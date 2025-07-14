import axios from 'axios';

/**
 * Axios instance configured for backend API communication
 * This client is configured to send requests to the backend API under the /api path
 */
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Set the authorization token for all future requests
 * @param {string} token - JWT token to be included in Authorization header
 */
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
