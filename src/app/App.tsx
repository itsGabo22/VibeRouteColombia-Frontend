import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../ui/pages/LoginPage';
import { AdminDashboardPage } from '../ui/pages/AdminDashboardPage';
import { ManagerDashboardPage } from '../ui/pages/ManagerDashboardPage';
import { DriverDashboardPage } from '../ui/pages/DriverDashboardPage';
import { SuperAdminDashboardPage } from '../ui/pages/SuperAdminDashboardPage';
import { useAuthStore } from './store/authStore';

const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { token, user } = useAuthStore();
  
  if (!token) return <Navigate to="/" />;
  
  if (allowedRoles && !allowedRoles.includes(user?.role || '')) {
     if (user?.role === 'SUPER_ADMIN') return <Navigate to="/arch-console" />;
     if (user?.role === 'ADMIN') return <Navigate to="/admin" />;
     if (user?.role === 'LOGISTICS') return <Navigate to="/manager" />;
     if (user?.role === 'DRIVER') return <Navigate to="/operational" />;
  }
  
  return children;
};

const App: React.FC = () => {
  const { token, user } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          token ? (
            user?.role === 'SUPER_ADMIN' ? <Navigate to="/arch-console" /> :
            user?.role === 'ADMIN' ? <Navigate to="/admin" /> :
            user?.role === 'LOGISTICS' ? <Navigate to="/manager" /> :
            <Navigate to="/operational" />
          ) : (
            <LoginPage />
          )
        } />

        <Route path="/arch-console" element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminDashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/manager" element={
          <ProtectedRoute allowedRoles={['LOGISTICS']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/operational" element={
          <ProtectedRoute allowedRoles={['DRIVER']}>
            <DriverDashboardPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
