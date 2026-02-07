import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getRequestsByStudent,
  getStudentProfile,
  mockCalendarEvents,
  mockMilestones,
} from '../../data/mockData';
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineCalendarDays,
  HiOutlineTrophy,
  HiOutlineArrowRight,
  HiOutlinePlusCircle,
  HiOutlineArrowTrendingUp,
} from 'react-icons/hi2';
import { format } from 'date-fns';
import type { HDRequestStatus } from '../../types';

const statusColors: Record<HDRequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted_to_supervisor: 'bg-blue-50 text-blue-700',
  supervisor_review: 'bg-amber-50 text-amber-700',
  co_supervisor_review: 'bg-orange-50 text-orange-700',
  coordinator_review: 'bg-violet-50 text-violet-700',
  fhd_pending: 'bg-indigo-50 text-indigo-700',
  shd_pending: 'bg-pink-50 text-pink-700',
  approved: 'bg-emerald-50 text-emerald-700',
  recommended: 'bg-teal-50 text-teal-700',
  referred_back: 'bg-red-50 text-red-700',
};

const statusLabels: Record<HDRequestStatus, string> = {
  draft: 'Draft',
  submitted_to_supervisor: 'Submitted',
  supervisor_review: 'Supervisor Review',
  co_supervisor_review: 'Co-Supervisor Review',
  coordinator_review: 'Coordinator Review',
  fhd_pending: 'FHD Pending',
  shd_pending: 'SHD Pending',
  approved: 'Approved',
  recommended: 'Recommended',
  referred_back: 'Referred Back',
};

export default function StudentDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const requests = getRequestsByStudent(user.id);
  const profile = getStudentProfile(user.id);
  const milestones = mockMilestones.filter((m) => m.studentId === user.id);
  const upcomingEvents = mockCalendarEvents
    .filter((e) => e.date > new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  const activeRequests = requests.filter(
    (r) => !['approved', 'recommended'].includes(r.status)
  );
  const completedRequests = requests.filter((r) =>
    ['approved', 'recommended'].includes(r.status)
  );

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {profile?.programme} — Year {profile?.yearsRegistered} — {profile?.department}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Active Requests', value: activeRequests.length, icon: HiOutlineClock, color: 'text-blue-600 bg-blue-50', accent: 'from-blue-500 to-blue-600' },
          { label: 'Completed', value: completedRequests.length, icon: HiOutlineCheckCircle, color: 'text-emerald-600 bg-emerald-50', accent: 'from-emerald-500 to-emerald-600' },
          { label: 'Milestones', value: milestones.length, icon: HiOutlineTrophy, color: 'text-violet-600 bg-violet-50', accent: 'from-violet-500 to-violet-600' },
          { label: 'Years Registered', value: profile?.yearsRegistered || 0, icon: HiOutlineArrowTrendingUp, color: 'text-amber-600 bg-amber-50', accent: 'from-amber-500 to-amber-600' },
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
        {/* Active Submissions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                <HiOutlineDocumentText className="w-4 h-4 text-gray-500" />
              </div>
              Current Submissions
            </h2>
            <Link to="/hd-requests" className="text-xs font-semibold text-[#003366] hover:text-[#004d99] flex items-center gap-1 px-2.5 py-1.5 hover:bg-[#003366]/[0.04] rounded-lg transition-colors">
              View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50/80">
            {activeRequests.length > 0 ? (
              activeRequests.slice(0, 4).map((request) => (
                <div key={request.id} className="px-6 py-4 hover:bg-gray-50/40 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-gray-800 truncate">{request.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted {format(request.createdAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusColors[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <HiOutlineDocumentText className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">No active submissions</p>
                <p className="text-xs text-gray-400 mt-0.5">Get started by creating your first request</p>
                <Link to="/hd-requests" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#003366] hover:text-[#004d99] bg-[#003366]/[0.04] hover:bg-[#003366]/[0.08] px-4 py-2 rounded-lg transition-colors">
                  <HiOutlinePlusCircle className="w-4 h-4" />
                  Create new request
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                <HiOutlineCalendarDays className="w-4 h-4 text-gray-500" />
              </div>
              Upcoming Deadlines
            </h2>
            <Link to="/calendar" className="text-xs font-semibold text-[#003366] hover:text-[#004d99] px-2.5 py-1.5 hover:bg-[#003366]/[0.04] rounded-lg transition-colors">Calendar</Link>
          </div>
          <div className="divide-y divide-gray-50/80">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="px-6 py-4 hover:bg-gray-50/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-black/[0.04] ${
                    event.type === 'deadline' ? 'bg-red-50' : event.type === 'meeting' ? 'bg-blue-50' : 'bg-emerald-50'
                  }`}>
                    {event.type === 'deadline' ? (
                      <HiOutlineExclamationCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <HiOutlineCalendarDays className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-medium text-gray-800">{event.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{format(event.date, 'EEEE, MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { to: '/hd-requests', label: 'New HD Request', icon: HiOutlinePlusCircle, color: 'text-[#003366] bg-[#003366]/[0.04] hover:bg-[#003366]/[0.08] ring-1 ring-[#003366]/[0.06]' },
            { to: '/progress', label: 'Track Submissions', icon: HiOutlineClock, color: 'text-violet-600 bg-violet-50/80 hover:bg-violet-100/80 ring-1 ring-violet-100' },
            { to: '/milestones', label: 'View Progress', icon: HiOutlineArrowTrendingUp, color: 'text-emerald-600 bg-emerald-50/80 hover:bg-emerald-100/80 ring-1 ring-emerald-100' },
            { to: '/calendar', label: 'View Calendar', icon: HiOutlineCalendarDays, color: 'text-amber-600 bg-amber-50/80 hover:bg-amber-100/80 ring-1 ring-amber-100' },
          ].map((action) => (
            <Link key={action.to} to={action.to} className={`flex flex-col items-center gap-2.5 p-5 rounded-xl transition-all hover:scale-[1.02] ${action.color}`}>
              <action.icon className="w-5.5 h-5.5" />
              <span className="text-xs font-semibold">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
