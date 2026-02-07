import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getStudentsForSupervisor,
  getRequestsForSupervisor,
  mockUsers,
  mockCalendarEvents,
} from '../../data/mockData';
import {
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineCalendarDays,
  HiOutlineArrowRight,
  HiOutlineBell,
  HiOutlineEye,
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
  submitted_to_supervisor: 'Awaiting Review',
  supervisor_review: 'In Review',
  co_supervisor_review: 'Co-Supervisor Review',
  coordinator_review: 'With Coordinator',
  fhd_pending: 'FHD Pending',
  shd_pending: 'SHD Pending',
  approved: 'Approved',
  recommended: 'Recommended',
  referred_back: 'Referred Back',
};

export default function SupervisorDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const students = getStudentsForSupervisor(user.id);
  const pendingReviews = getRequestsForSupervisor(user.id);
  const upcomingEvents = mockCalendarEvents
    .filter((e) => e.date > new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Good day, {user.name.split(' ').slice(-1)[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {user.department} — {students.length} student{students.length !== 1 ? 's' : ''} assigned
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'My Students', value: students.length, icon: HiOutlineUserGroup, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Reviews', value: pendingReviews.length, icon: HiOutlineClock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Needs Attention', value: pendingReviews.filter((r) => r.status === 'referred_back').length, icon: HiOutlineExclamationTriangle, color: 'text-red-600 bg-red-50' },
          { label: 'Approved This Month', value: 3, icon: HiOutlineCheckCircle, color: 'text-emerald-600 bg-emerald-50' },
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
        {/* Pending Reviews */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                <HiOutlineDocumentText className="w-4 h-4 text-gray-500" />
              </div>
              Requests Awaiting Review
            </h2>
            <Link to="/reviews" className="text-xs font-semibold text-[#003366] hover:text-[#004d99] flex items-center gap-1 px-2.5 py-1.5 hover:bg-[#003366]/[0.04] rounded-lg transition-colors">
              View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50/80">
            {pendingReviews.length > 0 ? (
              pendingReviews.slice(0, 4).map((request) => (
                <div key={request.id} className="px-6 py-4 hover:bg-gray-50/40 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-gray-800 truncate">{request.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {request.studentName} — {format(request.updatedAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusColors[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <HiOutlineEye className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  {request.accessCode && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] text-gray-400 font-medium">Access Code:</span>
                      <code className="text-[11px] bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-md font-mono text-gray-600 tracking-wide">
                        {request.accessCode}
                      </code>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <HiOutlineCheckCircle className="w-7 h-7 text-emerald-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">No pending reviews</p>
                <p className="text-xs text-gray-400 mt-0.5">You are all caught up</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* My Students */}
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100/60 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                  <HiOutlineUserGroup className="w-4 h-4 text-gray-500" />
                </div>
                My Students
              </h2>
              <Link to="/students" className="text-xs font-semibold text-[#003366] hover:text-[#004d99] px-2.5 py-1.5 hover:bg-[#003366]/[0.04] rounded-lg transition-colors">View all</Link>
            </div>
            <div className="divide-y divide-gray-50/80">
              {students.slice(0, 3).map((student) => {
                const studentUser = mockUsers.find((u) => u.id === student.userId);
                return (
                  <div key={student.userId} className="px-6 py-3.5 flex items-center gap-3 hover:bg-gray-50/40 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#003366] to-[#004d99] flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#003366]/10">
                      <span className="text-white text-[10px] font-semibold">
                        {studentUser?.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-800 truncate">{studentUser?.name}</p>
                      <p className="text-[11px] text-gray-500">{student.programme}</p>
                    </div>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <HiOutlineBell className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100/60">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                  <HiOutlineCalendarDays className="w-4 h-4 text-gray-500" />
                </div>
                Upcoming Events
              </h2>
            </div>
            <div className="divide-y divide-gray-50/80">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="px-6 py-3.5 hover:bg-gray-50/40 transition-colors">
                  <h3 className="text-[13px] font-medium text-gray-800">{event.title}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">{format(event.date, 'EEEE, MMM d')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
