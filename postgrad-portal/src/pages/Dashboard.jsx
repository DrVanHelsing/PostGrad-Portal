// ============================================
// Dashboard Router – renders role-specific dash
// ============================================

import { useAuth } from '../context/AuthContext';
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
};

export default function Dashboard() {
  const { user } = useAuth();
  const DashComponent = DASHBOARDS[user?.role] || StudentDashboard;
  return <DashComponent />;
}
