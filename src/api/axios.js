import axios from 'axios';

const API_BASE_URL = 'https://selguudi-backend.onrender.com/api/';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. REQUEST INTERCEPTOR: Tumia localStorage badala ya sessionStorage
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

// 2. RESPONSE INTERCEPTOR: Safisha token chafu/zilizokufa kiotomatiki (Auto-Clear Cache)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('auth/login');
      
      if (!isLoginRequest) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;