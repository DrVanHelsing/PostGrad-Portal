import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRequestsByStudent, mockHDRequests } from '../data/mockData';
import {
  HiOutlineDocumentText,
  HiOutlinePlusCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineArrowRight,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineChevronDown,
} from 'react-icons/hi2';
import { format } from 'date-fns';
import type { HDRequestStatus, HDRequestType } from '../types';

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

const requestTypes: { value: HDRequestType; label: string }[] = [
  { value: 'registration', label: 'Registration' },
  { value: 'title_registration', label: 'Title Registration' },
  { value: 'progress_report', label: 'Progress Report' },
  { value: 'extension', label: 'Extension Request' },
  { value: 'leave_of_absence', label: 'Leave of Absence' },
  { value: 'supervisor_change', label: 'Supervisor Change' },
  { value: 'examination_entry', label: 'Examination Entry' },
  { value: 'other', label: 'Other' },
];

export default function HDRequestsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedType, setSelectedType] = useState<HDRequestType | ''>('');
  const [filterStatus, setFilterStatus] = useState<HDRequestStatus | ''>('');

  const requests =
    user?.role === 'student'
      ? getRequestsByStudent(user.id)
      : mockHDRequests;

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">HD Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage your Higher Degree requests</p>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#003366] to-[#004080] text-white rounded-xl text-sm font-semibold hover:from-[#002851] hover:to-[#003366] active:scale-[0.99] shadow-lg shadow-[#003366]/15 transition-all"
        >
          <HiOutlinePlusCircle className="w-4.5 h-4.5" />
          New Request
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 group-focus-within:text-[#003366] transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requests..."
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50/80 border border-gray-100 rounded-xl text-sm placeholder-gray-400 focus:bg-white focus:border-[#003366]/20 focus:ring-2 focus:ring-[#003366]/8 focus:shadow-sm"
            />
          </div>
          <div className="relative">
            <HiOutlineFunnel className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as HDRequestStatus | '')}
              className="pl-12 pr-10 py-2.5 bg-gray-50/80 border border-gray-100 rounded-xl appearance-none text-sm text-gray-700 focus:bg-white focus:border-[#003366]/20 focus:ring-2 focus:ring-[#003366]/8 focus:shadow-sm"
            >
              <option value="">All Status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <HiOutlineChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl border border-gray-100/80 shadow-sm shadow-gray-100/50 overflow-hidden">
        <div className="divide-y divide-gray-50/80">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <div key={request.id} className="px-6 py-4.5 hover:bg-gray-50/40 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ring-black/[0.04] ${
                      request.status === 'approved' ? 'bg-emerald-50' : request.status === 'referred_back' ? 'bg-red-50' : 'bg-blue-50'
                    }`}>
                      {request.status === 'approved' ? (
                        <HiOutlineCheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                      ) : request.status === 'referred_back' ? (
                        <HiOutlineExclamationCircle className="w-4.5 h-4.5 text-red-600" />
                      ) : (
                        <HiOutlineDocumentText className="w-4.5 h-4.5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-gray-800 truncate">{request.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {request.type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} — Created {format(request.createdAt, 'MMM d, yyyy')}
                      </p>
                      {request.referenceNumber && (
                        <p className="text-[11px] text-gray-400 mt-0.5">Ref: {request.referenceNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusColors[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <HiOutlineEye className="w-4 h-4 text-gray-400" />
                    </button>
                    {request.status === 'draft' && (
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <HiOutlinePencilSquare className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2.5 ml-[52px]">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <HiOutlineClock className="w-3.5 h-3.5" />
                    Last updated {format(request.updatedAt, 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HiOutlineDocumentText className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">No requests found</h3>
              <p className="text-xs text-gray-500 mb-5">
                {searchQuery || filterStatus ? 'Try adjusting your filters' : 'Get started by creating your first HD request'}
              </p>
              <button
                onClick={() => setShowNewRequest(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#003366] to-[#004080] text-white rounded-xl text-sm font-semibold hover:from-[#002851] hover:to-[#003366] shadow-lg shadow-[#003366]/15 transition-all"
              >
                <HiOutlinePlusCircle className="w-4 h-4" />
                Create Request
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="modal-content bg-white rounded-2xl max-w-lg w-full p-7 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Create New HD Request</h2>
            <p className="text-sm text-gray-500 mb-7">Select the type of request you want to create</p>

            <div className="grid grid-cols-2 gap-3 mb-7">
              {requestTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`p-4 border rounded-xl text-left text-sm transition-all ${
                    selectedType === type.value
                      ? 'border-[#003366] bg-[#003366]/[0.04] text-[#003366] font-semibold ring-1 ring-[#003366]/20 shadow-sm'
                      : 'border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50/80'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => { setShowNewRequest(false); setSelectedType(''); }}
                className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!selectedType}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#003366] to-[#004080] text-white rounded-xl text-sm font-semibold hover:from-[#002851] hover:to-[#003366] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#003366]/15 transition-all"
              >
                Continue
                <HiOutlineArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
