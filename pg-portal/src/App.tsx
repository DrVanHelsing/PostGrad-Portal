import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import HDRequestsPage from './pages/HDRequestsPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="hd-requests" element={<HDRequestsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="settings" element={<SettingsPage />} />
            
            {/* Placeholder routes - redirect to dashboard for now */}
            <Route path="progress" element={<Dashboard />} />
            <Route path="milestones" element={<Dashboard />} />
            <Route path="students" element={<Dashboard />} />
            <Route path="reviews" element={<Dashboard />} />
            <Route path="pipeline" element={<Dashboard />} />
            <Route path="committee" element={<Dashboard />} />
            <Route path="users" element={<Dashboard />} />
            <Route path="audit-logs" element={<Dashboard />} />
          </Route>
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
