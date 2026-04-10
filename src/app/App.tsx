
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { LoginPage } from '../ui/pages/LoginPage';
import { DashboardPage } from '../ui/pages/DashboardPage';
import { AdminLoginPage } from '../ui/pages/auth/AdminLoginPage';
import { LogisticsLoginPage } from '../ui/pages/auth/LogisticsLoginPage';
import { DriverLoginPage } from '../ui/pages/auth/DriverLoginPage';
import { useAuthStore } from './store/authStore';

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/login/admin" element={<AdminLoginPage />} />
        <Route path="/login/logistics" element={<LogisticsLoginPage />} />
        <Route path="/login/driver" element={<DriverLoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Default redirect to dashboard if authenticated */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
        
        {/* Catch all to login if no route matches */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
