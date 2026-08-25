import axios from 'axios';

const API_BASE_URL = 'https://selguudi-backend.onrender.com/api/';

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
    // Badilisha hapa kusoma token kutoka sessionStorage
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;