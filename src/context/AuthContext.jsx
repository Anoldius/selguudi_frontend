import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({
    show_profit_to_cashier: false,
    allow_cashier_debts: true,
    allow_cashier_custom_price: true,
    show_buying_price_to_cashier: false,
    show_stock_summary_cards: true
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
    // SULUHISHO: Tumia localStorage badala ya sessionStorage
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_info');
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchPermissions();
      } catch (e) {
        console.error("Error parsing stored user info:", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('auth/login/', { username, password });
      
      // Chukua taarifa zote kutoka kwenye response ya backend
      const { 
        access, 
        refresh, 
        business_name, 
        business_type,
        role, 
        username: uname,
        days_left_in_trial,
        has_active_access,
        permissions: userPerms
      } = response.data;

      // HIFADHI KWENYE LOCALSTORAGE
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      const userData = { 
        username: uname, 
        business_name, 
        business_type,
        role,
        days_left_in_trial: days_left_in_trial ?? 30,
        has_active_access: has_active_access ?? true
      };
      
      localStorage.setItem('user_info', JSON.stringify(userData));
      
      setUser(userData);
      
      if (userPerms) {
        setPermissions(userPerms);
      } else {
        await fetchPermissions();
      }

      return { success: true };
    } catch (error) {
      console.error("Login Error Details:", error.response?.data || error.message);
      
      let errorMsg = 'Login imeshindikana!';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') errorMsg = data;
        else if (data.detail) errorMsg = data.detail;
        else if (data.message) errorMsg = data.message;
        else if (data.non_field_errors) errorMsg = data.non_field_errors[0];
      }

      return { 
        success: false, 
        message: errorMsg 
      };
    }
  };

  // FUNCTION YA KUSASISHA TAARIFA ZA USER BILA KULOGOUT
  const updateUser = (newUserData) => {
    setUser((prevUser) => {
      const updatedUser = { ...prevUser, ...newUserData };
      localStorage.setItem('user_info', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.clear();
    
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