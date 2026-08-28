import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({
    show_profit_to_cashier: false,
    allow_cashier_debts: true,
    allow_cashier_custom_price: true,
    show_buying_price_to_cashier: false
  });
  const [loading, setLoading] = useState(true);

  // Pakua Taarifa za Business Permissions
  const fetchPermissions = async () => {
    try {
      const res = await apiClient.get('auth/business-permissions/');
      if (res.data) {
        setPermissions(res.data);
      }
    } catch (err) {
      console.error("Error fetching permissions in AuthContext:", err);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    const storedUser = sessionStorage.getItem('user_info');
    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchPermissions();
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('auth/login/', { username, password });
      const { access, refresh, business_name, role, username: uname } = response.data;

      sessionStorage.setItem('access_token', access);
      sessionStorage.setItem('refresh_token', refresh);
      
      const userData = { username: uname, business_name, role };
      sessionStorage.setItem('user_info', JSON.stringify(userData));
      
      setUser(userData);
      await fetchPermissions();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.detail || 'Login imeshindikana!' 
      };
    }
  };

  // FUNCTION MPYA: KUSASISHA TAARIFA ZA USER (KAMA JINA LA DUKA) BILA KULOGOUT
  const updateUser = (newUserData) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...newUserData };
      sessionStorage.setItem('user_info', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const logout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_info');
    sessionStorage.clear();
    
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, permissions, fetchPermissions, updateUser, login, logout, loading }}>
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