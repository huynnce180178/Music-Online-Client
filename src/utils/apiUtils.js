import axios from 'axios';
import { message } from 'antd';
import i18n from '../i18n';
import BASE_API_URL from '../services/base.api.url';

const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

const getTranslation = (key) => {
  return i18n.t(key);
};

const extractErrorMessage = (data) => {
  if (!data) return getTranslation('common.api.generic_error');
  
  if (typeof data === 'string') {
    return data;
  } else if (data.data) {
    return data.data;
  } else if (data.message) {
    return data.message;
  } else if (data.error) {
    return data.error;
  } else if (data.detail) {
    return data.detail;
  } else if (typeof data === 'object' && Object.keys(data).length > 0) {
    const possibleKeys = ['message', 'error', 'detail', 'description', 'reason'];
    for (const key of possibleKeys) {
      if (data[key]) {
        return data[key];
      }
    }
  }
  
  return getTranslation('common.api.generic_error');
};

const handleAutoLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userName');
  localStorage.removeItem('roles');
  localStorage.removeItem('userId');
  localStorage.removeItem('avatarUrl');
  localStorage.removeItem('songCount');

  message.warning(getTranslation('common.api.token_expired'));

  window.location.href = '/';
};

const apiClient = axios.create({
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    if (token && isTokenExpired(token)) {
      handleAutoLogout();
      return Promise.reject(new Error(getTranslation('common.api.token_expired_error')));
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      message.error(getTranslation('common.api.request_timeout'));
    } else if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          handleAutoLogout();
          break;
        case 403:
          message.error(getTranslation('common.api.access_denied'));
          break;
        case 404:
          message.error(getTranslation('common.api.resource_not_found'));
          break;
        case 500:
          message.error(getTranslation('common.api.server_error'));
          break;
        default:
          const errorMessage = extractErrorMessage(data);
          message.error(errorMessage);
      }
    } else if (error.request) {
      message.error(getTranslation('common.api.network_error'));
    } else {
      message.error(getTranslation('common.api.unexpected_error'));
    }

    return Promise.reject(error);
  }
);

export const testServerConnection = async () => {
  try {
    const response = await axios.get(`${BASE_API_URL}/api/v1/health`, { timeout: 5000 });
    if (response.status === 200) {
      console.log(`Server connection successful: ${BASE_API_URL}`);
      return BASE_API_URL;
    }
  } catch (error) {
    console.log(`Failed to connect to: ${BASE_API_URL}`, error.message);
  }

  throw new Error('No server connection available');
};

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

      if (error.code === 'ECONNABORTED' || error.message.includes('Network Error') || !error.response) {
        if (attempt < maxRetries) {
          console.log(`Attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }

      break;
    }
  }

  throw lastError;
};

export const apiGet = (endpoint, config = {}) => apiCall('GET', endpoint, null, config);
export const apiPost = (endpoint, data = null, config = {}) => apiCall('POST', endpoint, data, config);
export const apiPut = (endpoint, data = null, config = {}) => apiCall('PUT', endpoint, data, config);
export const apiPatch = (endpoint, data = null, config = {}) => apiCall('PATCH', endpoint, data, config);
export const apiDelete = (endpoint, config = {}) => apiCall('DELETE', endpoint, null, config);

export { handleAutoLogout, isTokenExpired, getTranslation, extractErrorMessage };

export default apiClient; 