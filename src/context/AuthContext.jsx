import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Angalia kama mteja ana session kwenye tab hii
    const token = sessionStorage.getItem('access_token');
    const storedUser = sessionStorage.getItem('user_info');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('auth/login/', { username, password });
      const { access, refresh, business_name, role, username: uname } = response.data;

      // Hifadhi kwenye sessionStorage (Inafutika tab ikifungwa)
      sessionStorage.setItem('access_token', access);
      sessionStorage.setItem('refresh_token', refresh);
      
      const userData = { username: uname, business_name, role };
      sessionStorage.setItem('user_info', JSON.stringify(userData));
      
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
    // Safisha session data yote
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_info');
    sessionStorage.clear();
    
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