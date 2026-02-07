import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  mockStudentProfiles,
  mockHDRequests,
  mockCalendarEvents,
  mockUsers,
} from '../../data/mockData';
import {
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineCalendarDays,
  HiOutlineArrowRight,
  HiOutlineArrowDownTray,
  HiOutlineChartBar,
  HiOutlineDocumentChartBar,
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

export default function CoordinatorDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const allStudents = mockStudentProfiles;
  const pipelineRequests = mockHDRequests.filter((r) =>
    ['coordinator_review', 'fhd_pending', 'shd_pending'].includes(r.status)
  );
  const upcomingEvents = mockCalendarEvents
    .filter((e) => e.date > new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4);

  const pipelineStats = {
    coordinatorReview: mockHDRequests.filter((r) => r.status === 'coordinator_review').length,
    fhdPending: mockHDRequests.filter((r) => r.status === 'fhd_pending').length,
    shdPending: mockHDRequests.filter((r) => r.status === 'shd_pending').length,
    referredBack: mockHDRequests.filter((r) => r.status === 'referred_back').length,
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Coordinator Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{user.department} — {allStudents.length} postgraduate students</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { label: 'Total Students', value: allStudents.length, icon: HiOutlineUserGroup, color: 'text-blue-600 bg-blue-50' },
          { label: 'My Review', value: pipelineStats.coordinatorReview, icon: HiOutlineDocumentText, color: 'text-violet-600 bg-violet-50' },
          { label: 'FHD Pending', value: pipelineStats.fhdPending, icon: HiOutlineClock, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'SHD Pending', value: pipelineStats.shdPending, icon: HiOutlineClock, color: 'text-pink-600 bg-pink-50' },
          { label: 'Referred Back', value: pipelineStats.referredBack, icon: HiOutlineExclamationTriangle, color: 'text-red-600 bg-red-50' },
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
        {/* HD Pipeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                <HiOutlineChartBar className="w-4 h-4 text-gray-500" />
              </div>
              HD Pipeline
            </h2>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors">
                <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                Export
              </button>
              <Link to="/pipeline" className="text-xs font-semibold text-[#003366] hover:text-[#004d99] flex items-center gap-1 px-2.5 py-1.5 hover:bg-[#003366]/[0.04] rounded-lg transition-colors">
                View all <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-50/80">
            {pipelineRequests.length > 0 ? (
              pipelineRequests.slice(0, 5).map((request) => {
                const supervisor = mockUsers.find((u) => u.id === request.supervisorId);
                return (
                  <div key={request.id} className="px-6 py-4 hover:bg-gray-50/40 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-gray-800">{request.studentName}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">{request.title}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Supervisor: {supervisor?.name} — {format(request.updatedAt, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusColors[request.status]}`}>
                        {request.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <HiOutlineCheckCircle className="w-7 h-7 text-emerald-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">Pipeline is clear</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Committee Prep */}
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100/60">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                  <HiOutlineDocumentChartBar className="w-4 h-4 text-gray-500" />
                </div>
                Committee Preparation
              </h2>
            </div>
            <div className="p-4 space-y-2.5">
              <Link to="/committee" className="flex items-center justify-between p-3.5 bg-indigo-50/50 border border-indigo-100/50 rounded-xl hover:bg-indigo-50 transition-colors">
                <span className="text-xs font-semibold text-indigo-700">Next FHD Meeting</span>
                <span className="text-[11px] text-indigo-500 font-medium">Feb 15</span>
              </Link>
              <Link to="/committee" className="flex items-center justify-between p-3.5 bg-pink-50/50 border border-pink-100/50 rounded-xl hover:bg-pink-50 transition-colors">
                <span className="text-xs font-semibold text-pink-700">Next SHD Meeting</span>
                <span className="text-[11px] text-pink-500 font-medium">Feb 25</span>
              </Link>
              <button className="w-full flex items-center justify-center gap-2 p-3.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-xs text-gray-600 font-semibold">
                <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                Export Committee Report
              </button>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100/60 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                  <HiOutlineCalendarDays className="w-4 h-4 text-gray-500" />
                </div>
                Upcoming Events
              </h2>
              <Link to="/calendar" className="text-xs font-semibold text-[#003366] hover:text-[#004d99] px-2.5 py-1.5 hover:bg-[#003366]/[0.04] rounded-lg transition-colors">Manage</Link>
            </div>
            <div className="divide-y divide-gray-50/80">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="px-6 py-3.5 hover:bg-gray-50/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      event.type === 'deadline' ? 'bg-red-500' : event.type === 'meeting' ? 'bg-blue-500' : 'bg-emerald-500'
                    }`} />
                    <h3 className="text-[13px] font-medium text-gray-800">{event.title}</h3>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 ml-3.5">{format(event.date, 'EEEE, MMM d')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
