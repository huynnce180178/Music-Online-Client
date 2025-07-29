import axios from 'axios';
import { message } from 'antd';
import BASE_API_URL, { FALLBACK_URLS } from '../services/base.api.url';

// Create axios instance with default configuration
const apiClient = axios.create({
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      message.error('Request timeout. Please check your internet connection.');
    } else if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          message.error('Authentication failed. Please login again.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userName');
          localStorage.removeItem('roles');
          localStorage.removeItem('userId');
          window.location.href = '/';
          break;
        case 403:
          message.error('Access denied. You don\'t have permission for this action.');
          break;
        case 404:
          message.error('Resource not found. Please check the URL.');
          break;
        case 500:
          message.error('Server error. Please try again later.');
          break;
        default:
          message.error(data?.data || 'An error occurred. Please try again.');
      }
    } else if (error.request) {
      // Network error - no response received
      message.error('Server connection error. Please check your internet connection and try again.');
    } else {
      // Other errors
      message.error('An unexpected error occurred. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

// Function to test server connectivity
export const testServerConnection = async () => {
  const urls = [BASE_API_URL, ...FALLBACK_URLS];
  
  for (const url of urls) {
    try {
      const response = await axios.get(`${url}/api/v1/health`, { timeout: 5000 });
      if (response.status === 200) {
        console.log(`Server connection successful: ${url}`);
        return url;
      }
    } catch (error) {
      console.log(`Failed to connect to: ${url}`, error.message);
    }
  }
  
  throw new Error('No server connection available');
};

// Function to make API calls with retry logic
export const apiCall = async (method, endpoint, data = null, config = {}) => {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = `${BASE_API_URL}${endpoint}`;
      const response = await apiClient.request({
        method,
        url,
        data,
        ...config,
      });
      return response;
    } catch (error) {
      lastError = error;
      
      // If it's a network error and we haven't exhausted retries, try again
      if (error.code === 'ECONNABORTED' || error.message.includes('Network Error') || !error.response) {
        if (attempt < maxRetries) {
          console.log(`Attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
      }
      
      // For other errors, don't retry
      break;
    }
  }
  
  throw lastError;
};

// Convenience methods
export const apiGet = (endpoint, config = {}) => apiCall('GET', endpoint, null, config);
export const apiPost = (endpoint, data = null, config = {}) => apiCall('POST', endpoint, data, config);
export const apiPut = (endpoint, data = null, config = {}) => apiCall('PUT', endpoint, data, config);
export const apiPatch = (endpoint, data = null, config = {}) => apiCall('PATCH', endpoint, data, config);
export const apiDelete = (endpoint, config = {}) => apiCall('DELETE', endpoint, null, config);

export default apiClient; 