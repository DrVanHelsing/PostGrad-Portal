// ============================================
// Submission Tracker Page – Enhanced
// ============================================

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StatusBadge, EmptyState } from '../components/common';
import { STATUS_CONFIG, REQUEST_TYPE_LABELS, WORKFLOW_STATES } from '../utils/constants';
import { formatDate, formatRelativeTime } from '../utils/helpers';
import {
  HiOutlineClipboardDocumentList,
  HiCheck,
  HiOutlineExclamationTriangle,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import './SubmissionTracker.css';

const STEP_LABELS = {
  draft: 'Draft',
  submitted_to_supervisor: 'Submitted',
  supervisor_review: 'Supervisor',
  co_supervisor_review: 'Co-Supervisor',
  coordinator_review: 'Coordinator',
  fhd_pending: 'Faculty Board',
  shd_pending: 'Senate Board',
  approved: 'Approved',
};

function timerRemaining(request) {
  if (!request.timerStart || !request.timerHours) return null;
  const end = new Date(request.timerStart).getTime() + request.timerHours * 3600000;
  const diff = end - Date.now();
  if (diff <= 0) return { expired: true, text: 'Overdue' };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return { expired: false, text: `${h}h ${m}m remaining` };
}

function WorkflowProgress({ request, hasCosupervisor }) {
  const { status, versions = [] } = request;
  let steps = [...WORKFLOW_STATES];
  if (!hasCosupervisor) {
    steps = steps.filter((s) => s !== 'co_supervisor_review');
  }

  const currentIdx = steps.indexOf(status);
  const isReferred = status === 'referred_back' || status === 'recommended';

  // Build timestamp map from versions
  const stepDates = {};
  versions.forEach(v => {
    const action = v.action.toLowerCase();
    if (action.includes('created')) stepDates['draft'] = v.date;
    if (action.includes('submitted to supervisor')) stepDates['submitted_to_supervisor'] = v.date;
    if (action.includes('supervisor approved') || action.includes('access code validated')) stepDates['supervisor_review'] = v.date;
    if (action.includes('co-supervisor')) stepDates['co_supervisor_review'] = v.date;
    if (action.includes('coordinator') || action.includes('forwarded to coordinator')) stepDates['coordinator_review'] = v.date;
    if (action.includes('fhd')) stepDates['fhd_pending'] = v.date;
    if (action.includes('shd')) stepDates['shd_pending'] = v.date;
    if (action.includes('approved') && action.includes('shd')) stepDates['approved'] = v.date;
  });

  return (
    <div className="workflow-steps">
      {steps.map((step, i) => {
        let state = 'pending';
        if (isReferred) {
          state = 'referred';
        } else if (i < currentIdx) {
          state = 'completed';
        } else if (i === currentIdx) {
          state = 'current';
        }

        return (
          <div key={step} className={`workflow-step ${state}`}>
            <div className="workflow-step-dot">
              {state === 'completed' ? <HiCheck /> : state === 'referred' && i === currentIdx ? <HiOutlineExclamationTriangle style={{ fontSize: 12 }} /> : i + 1}
            </div>
            <div className="workflow-step-label">{STEP_LABELS[step]}</div>
            {stepDates[step] && (
              <div className="workflow-step-date">{formatDate(stepDates[step])}</div>
            )}
            {i < steps.length - 1 && <div className="workflow-step-connector" />}
          </div>
        );
      })}
    </div>
  );
}

export default function SubmissionTracker() {
  const { user } = useAuth();
  const { mockHDRequests, getRequestsByStudent, getUserById } = useData();

  const requests = useMemo(() => {
    if (user.role === 'student') return getRequestsByStudent(user.id);
    if (user.role === 'coordinator' || user.role === 'admin') return [...mockHDRequests];
    return mockHDRequests.filter(r => r.supervisorId === user.id || r.coSupervisorId === user.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mockHDRequests]);

  const sorted = useMemo(() => {
    return [...requests].sort((a, b) => {
      const aActive = !['approved', 'recommended'].includes(a.status);
      const bActive = !['approved', 'recommended'].includes(b.status);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [requests]);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Submission Tracker</h1>
        <p>Track the progress of your requests through the approval workflow</p>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={<HiOutlineClipboardDocumentList />} title="No submissions to track" description="Requests will appear here once created" />
      ) : (
        <div className="tracker-card-list">
          {sorted.map((r) => {
            const owner = getUserById(r.currentOwner);
            const timer = timerRemaining(r);
            return (
              <div key={r.id} className="tracker-request-card">
                <div className="tracker-request-header">
                  <div>
                    <div className="tracker-request-title">
                      {r.title}
                      {r.locked && <HiOutlineLockClosed style={{ color: 'var(--text-tertiary)', marginLeft: 6, fontSize: 14, verticalAlign: -2 }} title="Document locked" />}
                    </div>
                    <div className="tracker-request-meta">
                      <span>{REQUEST_TYPE_LABELS[r.type]}</span>
                      <span className="request-list-meta-sep" />
                      <span>{r.studentName}</span>
                      <span className="request-list-meta-sep" />
                      <span>Updated {formatRelativeTime(r.updatedAt)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <StatusBadge status={r.status} />
                    {owner && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                        <HiOutlineUser /> {owner.name}
                      </div>
                    )}
                    {timer && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: timer.expired ? 'var(--status-error)' : 'var(--status-info)' }}>
                        <HiOutlineClock /> {timer.text}
                      </div>
                    )}
                  </div>
                </div>

                <WorkflowProgress request={r} hasCosupervisor={!!r.coSupervisorId} />

                {r.referredBackReason && (
                  <div className="tracker-referred-note">
                    <HiOutlineExclamationTriangle /> {r.referredBackReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
