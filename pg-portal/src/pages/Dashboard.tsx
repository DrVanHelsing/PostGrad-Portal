import { useAuth } from '../context/AuthContext';
import StudentDashboard from './dashboards/StudentDashboard';
import SupervisorDashboard from './dashboards/SupervisorDashboard';
import CoordinatorDashboard from './dashboards/CoordinatorDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    case 'coordinator':
      return <CoordinatorDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <div>Unknown role</div>;
  }
}
