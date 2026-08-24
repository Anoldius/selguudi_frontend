import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check kama mteja alilogin kabla
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_info');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // MULTI-TAB LOGOUT & LOGIN SYNC
  useEffect(() => {
    const handleStorageChange = (event) => {
      // 1. Kama mteja amejilogout kwenye tab nyingine
      if (event.key === 'logout_event' || (event.key === 'access_token' && !event.newValue)) {
        setUser(null);
      }
      
      // 2. Kama mteja amejilogin kwenye tab nyingine
      if (event.key === 'user_info' && event.newValue) {
        setUser(JSON.parse(event.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('auth/login/', { username, password });
      const { access, refresh, business_name, role, username: uname } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      const userData = { username: uname, business_name, role };
      localStorage.setItem('user_info', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.detail || 'Login imeshindikana!' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    
    // Tuma signal kwa tabs zingine zote kupitia localStorage event
    localStorage.setItem('logout_event', Date.now().toString());
    
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth lazima itumiwe ndani ya AuthProvider');
  }
  return context;
};