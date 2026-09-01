import axios from 'axios';

const API_BASE_URL = 'https://selguudi-backend.onrender.com/api/';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tumia localStorage badala ya sessionStorage
apiClient.interceptors.request.use((config) => {
  const isAuthEndpoint = config.url.includes('auth/login') || config.url.includes('auth/register');
  
  if (!isAuthEndpoint) {
    // Tumia localStorage hapa badala ya sessionStorage
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