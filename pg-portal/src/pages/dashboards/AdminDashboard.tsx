import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  mockUsers,
  mockStudentProfiles,
  mockHDRequests,
  mockAuditLogs,
} from '../../data/mockData';
import {
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlineArrowRight,
  HiOutlineArrowDownTray,
  HiOutlineShieldCheck,
  HiOutlineFolderOpen,
  HiOutlineBell,
  HiOutlineUserCircle,
  HiOutlineServerStack,
} from 'react-icons/hi2';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const totalUsers = mockUsers.length;
  const totalStudents = mockStudentProfiles.length;
  const totalSubmissions = mockHDRequests.length;
  const pendingSubmissions = mockHDRequests.filter(
    (r) => !['approved', 'recommended'].includes(r.status)
  ).length;
  const recentAuditLogs = mockAuditLogs.slice(0, 5);

  const usersByRole = {
    students: mockUsers.filter((u) => u.role === 'student').length,
    supervisors: mockUsers.filter((u) => u.role === 'supervisor').length,
    coordinators: mockUsers.filter((u) => u.role === 'coordinator').length,
    admins: mockUsers.filter((u) => u.role === 'admin').length,
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">System Overview — {user.department}</p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50/80 border border-emerald-100/60 rounded-xl shadow-sm shadow-emerald-100/30">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700">System Operational</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Users', value: totalUsers, icon: HiOutlineUserGroup, color: 'text-blue-600 bg-blue-50' },
          { label: 'PG Students', value: totalStudents, icon: HiOutlineUserCircle, color: 'text-violet-600 bg-violet-50' },
          { label: 'Total Submissions', value: totalSubmissions, icon: HiOutlineDocumentText, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Active Workflows', value: pendingSubmissions, icon: HiOutlineChartBar, color: 'text-amber-600 bg-amber-50' },
        ].map((stat) => (
          <div key={stat.label} className="stat-card card-hover bg-white rounded-2xl border border-gray-100/80 p-5 shadow-sm shadow-gray-100/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1.5">{stat.value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color} ring-1 ring-black/[0.04]`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Log */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                <HiOutlineChartBar className="w-4 h-4 text-gray-500" />
              </div>
              Recent Audit Log
            </h2>
            <Link to="/audit-logs" className="text-xs font-semibold text-[#003366] hover:text-[#004d99] flex items-center gap-1 px-2.5 py-1.5 hover:bg-[#003366]/[0.04] rounded-lg transition-colors">
              View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50/80">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-gray-50/40 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{log.action}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {log.userName} — {log.entityType}
                    </p>
                    {log.details && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{log.details}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {format(log.timestamp, 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* User Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100/60">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                  <HiOutlineUserGroup className="w-4 h-4 text-gray-500" />
                </div>
                Users by Role
              </h2>
            </div>
            <div className="p-6 space-y-3.5">
              {[
                { label: 'Students', value: usersByRole.students },
                { label: 'Supervisors', value: usersByRole.supervisors },
                { label: 'Coordinators', value: usersByRole.coordinators },
                { label: 'Admins', value: usersByRole.admins },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-600 font-medium">{item.label}</span>
                  <span className="text-[13px] font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100/60">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                  <HiOutlineCog6Tooth className="w-4 h-4 text-gray-500" />
                </div>
                Quick Actions
              </h2>
            </div>
            <div className="p-3 space-y-0.5">
              {[
                { to: '/users', label: 'Manage Users', icon: HiOutlineUserCircle, color: 'text-blue-500' },
                { to: '/pipeline', label: 'Export Data', icon: HiOutlineArrowDownTray, color: 'text-emerald-500' },
                { to: '/reviews', label: 'Notification Settings', icon: HiOutlineBell, color: 'text-amber-500' },
                { to: '/hd-requests', label: 'Document Repository', icon: HiOutlineFolderOpen, color: 'text-violet-500' },
                { to: '/settings', label: 'Security Settings', icon: HiOutlineShieldCheck, color: 'text-red-500' },
              ].map((action) => (
                <Link key={action.to + action.label} to={action.to} className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-gray-50 rounded-xl transition-colors">
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                  <span className="text-[13px] text-gray-700">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 p-6">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5 mb-5">
          <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
            <HiOutlineServerStack className="w-4 h-4 text-gray-500" />
          </div>
          System Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Database', 'API', 'Google Drive', 'Email Service'].map((service) => (
            <div key={service} className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-xl">
              <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-wider">{service}</p>
              <p className="text-sm font-bold text-emerald-800 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Healthy
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
