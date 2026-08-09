import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Token kwenye request ISIPOKUWA kama ni Login au Register
apiClient.interceptors.request.use((config) => {
  const isAuthEndpoint = config.url.includes('auth/login') || config.url.includes('auth/register');
  
  if (!isAuthEndpoint) {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;