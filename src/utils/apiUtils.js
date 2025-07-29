import axios from 'axios';
import { message } from 'antd';
import BASE_API_URL, { FALLBACK_URLS } from '../services/base.api.url';

// Default timeout for API requests
const DEFAULT_TIMEOUT = 10000;

// Request deduplication cache
const pendingRequests = new Map();

// Create axios instance with default config
export const apiClient = axios.create({
    timeout: DEFAULT_TIMEOUT,
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
        const { response } = error;
        
        if (response) {
            switch (response.status) {
                case 401:
                    message.error('Session expired. Please login again.');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('roles');
                    window.location.href = '/login';
                    break;
                case 403:
                    message.error('Access denied. You do not have permission to perform this action.');
                    break;
                case 404:
                    message.error('Resource not found.');
                    break;
                case 500:
                    message.error('Server error. Please try again later.');
                    break;
                default:
                    message.error(response.data?.message || 'An error occurred.');
            }
        } else if (error.code === 'ECONNABORTED') {
            message.error('Request timeout. Please check your connection and try again.');
        } else {
            message.error('Network error. Please check your connection.');
        }
        
        return Promise.reject(error);
    }
);

// Deduplicate requests to prevent spam
export const deduplicateRequest = (key, requestFn) => {
    if (pendingRequests.has(key)) {
        return pendingRequests.get(key);
    }
    
    const promise = requestFn().finally(() => {
        pendingRequests.delete(key);
    });
    
    pendingRequests.set(key, promise);
    return promise;
};

// Create a unique key for requests
export const createRequestKey = (url, params = {}) => {
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    return `${url}?${sortedParams}`;
};

// Utility function for paginated API calls with deduplication
export const fetchPaginatedData = async (url, params = {}) => {
    const requestKey = createRequestKey(url, params);
    
    return deduplicateRequest(requestKey, async () => {
        try {
            const response = await apiClient.get(url, { params });
            return {
                data: response.data.content || response.data.data || [],
                pagination: {
                    current: (response.data.number || 0) + 1,
                    pageSize: response.data.size || response.data.limit || 10,
                    total: response.data.totalElements || response.data.total || 0,
                },
                success: true,
            };
        } catch (error) {
            console.error('Error fetching paginated data:', error);
            return {
                data: [],
                pagination: {
                    current: 1,
                    pageSize: 10,
                    total: 0,
                },
                success: false,
                error: error.response?.data?.message || 'Failed to fetch data',
            };
        }
    });
};

// Utility function for API calls with loading state
export const withLoading = async (apiCall, setLoading, setError) => {
    setLoading(true);
    setError(null);
    
    try {
        const result = await apiCall();
        return result;
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'An error occurred';
        setError(errorMessage);
        throw error;
    } finally {
        setLoading(false);
    }
};

// Debounced search utility with request cancellation
export const createDebouncedSearch = (searchFunction, delay = 500) => {
    let timeoutId;
    let abortController = null;
    
    return (...args) => {
        clearTimeout(timeoutId);
        
        // Cancel previous request if it exists
        if (abortController) {
            abortController.abort();
        }
        
        // Create new abort controller
        abortController = new AbortController();
        
        timeoutId = setTimeout(() => {
            searchFunction(...args, abortController.signal);
        }, delay);
    };
};

// Cache utility for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const cachedApiCall = async (key, apiCall) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    
    const data = await apiCall();
    cache.set(key, {
        data,
        timestamp: Date.now(),
    });
    
    return data;
};

// Clear cache utility
export const clearCache = (key) => {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
};

// Clear pending requests
export const clearPendingRequests = () => {
    pendingRequests.clear();
};

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