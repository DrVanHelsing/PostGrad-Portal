// ============================================
// Dashboard Router – renders role-specific dash
// ============================================

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationAlerts from '../components/common/NotificationAlerts';
import StudentDashboard from './dashboards/StudentDashboard';
import SupervisorDashboard from './dashboards/SupervisorDashboard';
import CoordinatorDashboard from './dashboards/CoordinatorDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import './Dashboard.css';

const DASHBOARDS = {
  student: StudentDashboard,
  supervisor: SupervisorDashboard,
  coordinator: CoordinatorDashboard,
  admin: AdminDashboard,
  external: StudentDashboard,
  examiner: SupervisorDashboard,
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const DashComponent = DASHBOARDS[user?.role] || StudentDashboard;
  return (
    <>
      <NotificationAlerts onNavigate={(path) => navigate(path)} />
      <DashComponent />
    </>
  );
}
