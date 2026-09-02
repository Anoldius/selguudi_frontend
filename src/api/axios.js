import axios from 'axios';

const API_BASE_URL = 'https://selguudi-backend.onrender.com/api/';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. REQUEST INTERCEPTOR: Ongeza token kwenye kila ombi lisilokuwa la login/register
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

// 2. RESPONSE INTERCEPTOR: ZUIA AUTO-LOGOUT YA MAKOSA
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      
      const isLoginRequest = requestUrl.includes('auth/login');
      const isPermissionsRequest = requestUrl.includes('business-permissions');

      // Hakikisha haileti auto-logout kama kosa limetokea wakati wa login au kuomba permissions
      if (!isLoginRequest && !isPermissionsRequest) {
        console.warn("Session expired or invalid token. Redirecting to login...");
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