import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword'; 
import ResetPassword from './pages/ResetPassword';   
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Debts from './pages/Debts';
import Settings from './pages/Settings';
import Users from './pages/Users';
import BillingSuccess from './pages/BillingSuccess';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Component ya maalum ya ku-wrap Routes ili kuwezesha Animation
const AnimatedAnimatedRoutes = () => {
  const location = useLocation();

  // Variant ya Slide Animation
  const pageVariants = {
    initial: (custom) => ({
      x: custom === '/register' ? '100%' : '-100%',
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
    exit: (custom) => ({
      x: custom === '/register' ? '-100%' : '100%',
      opacity: 0,
      transition: { duration: 0.4, ease: 'easeInOut' },
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={location.pathname}>
      <Routes location={location} key={location.pathname}>
        {/* Public Routes yenye Sliding Animations */}
        <Route
          path="/login"
          element={
            <motion.div
              custom={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <Login />
            </motion.div>
          }
        />

        <Route
          path="/register"
          element={
            <motion.div
              custom={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              <Register />
            </motion.div>
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <Layout>
                <POS />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Layout>
                <Expenses />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/debts"
          element={
            <ProtectedRoute>
              <Layout>
                <Debts />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing/success"
          element={
            <ProtectedRoute>
              <BillingSuccess />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </AnimatePresence>
  );
};

const RootRedirect = () => {
  const token = sessionStorage.getItem('access_token');
  return token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedAnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}