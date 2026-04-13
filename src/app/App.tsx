import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../ui/pages/LoginPage';
import { DashboardPage } from '../ui/pages/DashboardPage';
import { LogisticDashboardPage } from '../ui/pages/LogisticDashboardPage';
import { useAuthStore } from './store/authStore';

// Componente para proteger rutas según el rol
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { token, user } = useAuthStore();
  
  if (!token) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(user?.role || '')) {
     // Redirigir al dashboard que le corresponde si intenta entrar a uno prohibido
     return <Navigate to={user?.role === 'DRIVER' ? '/operational' : '/dashboard'} />;
  }
  
  return children;
};

const App: React.FC = () => {
  const { token, user } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* Login Unificado */}
        <Route path="/" element={
          token ? (
            <Navigate to={user?.role === 'DRIVER' ? '/operational' : '/dashboard'} />
          ) : (
            <LoginPage />
          )
        } />

        {/* Dashboard Administrativo (Admin & Logística) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Portal Operativo (Logística Operativa) */}
        <Route 
          path="/operational" 
          element={
            <ProtectedRoute allowedRoles={['DRIVER']}>
              <LogisticDashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
