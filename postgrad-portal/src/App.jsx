// ============================================
// PostGrad Portal – App Root with Routing
// ============================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { TourProvider } from './context/GuidedTour';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import HDRequestsPage from './pages/HDRequestsPage';
import SubmissionTracker from './pages/SubmissionTracker';
import CalendarPage from './pages/CalendarPage';
import StudentsPage from './pages/StudentsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RoleManagementPage from './pages/RoleManagementPage';
import AcademicProgressPage from './pages/AcademicProgressPage';
import DocumentReviewPage from './pages/DocumentReviewPage';
import HelpPage from './pages/HelpPage';
import SeedPage from './pages/SeedPage';
import FormBuilderPage from './pages/FormBuilderPage';

function AuthLoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>PostGrad Portal</div>
        <div style={{ color: 'var(--text-secondary)' }}>Loading…</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) return <AuthLoadingScreen />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/seed" element={<SeedPage />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Full-screen Form Builder (outside Layout – no sidebar/header) */}
      <Route
        path="/form-builder"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <FormBuilderPage />
          </ProtectedRoute>
        }
      />

      {/* Protected layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/requests" element={<HDRequestsPage />} />
        <Route path="/requests/:requestId/review" element={<DocumentReviewPage />} />
        <Route path="/tracker" element={<SubmissionTracker />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={['supervisor', 'coordinator', 'admin']}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <AcademicProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute allowedRoles={['admin', 'coordinator']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RoleManagementPage />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <TourProvider>
              <AppRoutes />
            </TourProvider>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
