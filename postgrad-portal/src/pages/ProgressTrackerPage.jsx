// ============================================
// Progress Tracker Page – combined Submission Tracker + Academic Progress
// Concurrent timeline view, filter-based navigation, 48hr referral alerts
// ============================================

import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardBody, StatusBadge, EmptyState, Modal } from '../components/common';
import { REQUEST_TYPE_LABELS, MILESTONE_TYPE_LABELS, WORKFLOW_STATES } from '../utils/constants';
import { formatDate, formatRelativeTime } from '../utils/helpers';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
  HiOutlineChartBarSquare,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineUser,
  HiOutlineLockClosed,
  HiCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { STATUS_CONFIG } from '../utils/constants';
import './SubmissionTracker.css';

/* ── Workflow Helpers ── */
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
  if (!hasCosupervisor) steps = steps.filter(s => s !== 'co_supervisor_review');

  const currentIdx = steps.indexOf(status);
  const isReferred = status === 'referred_back' || status === 'recommended';

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
        if (isReferred) state = 'referred';
        else if (i < currentIdx) state = 'completed';
        else if (i === currentIdx) state = 'current';
        return (
          <div key={step} className={`workflow-step ${state}`}>
            <div className="workflow-step-dot">
              {state === 'completed' ? <HiCheck /> : state === 'referred' && i === currentIdx ? <HiOutlineExclamationTriangle style={{ fontSize: 12 }} /> : i + 1}
            </div>
            <div className="workflow-step-label">{STEP_LABELS[step]}</div>
            {stepDates[step] && <div className="workflow-step-date">{formatDate(stepDates[step])}</div>}
            {i < steps.length - 1 && <div className="workflow-step-connector" />}
          </div>
        );
      })}
    </div>
  );
}

/* ── Filter options ── */
const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'approved', label: 'Approved' },
  { key: 'referred_back', label: 'Referred Back' },
];

const STAGE_ROWS = [
  ['submitted_to_supervisor', 'Submitted', 'var(--status-info)'],
  ['supervisor_review', 'Supervisor', 'var(--uwc-navy)'],
  ['co_supervisor_review', 'Co-Supervisor', 'var(--status-purple)'],
  ['coordinator_review', 'Coordinator', 'var(--uwc-gold)'],
  ['fhd_pending', 'Faculty Board', 'var(--status-teal)'],
  ['shd_pending', 'Senate Board', 'var(--status-indigo)'],
  ['approved', 'Approved', 'var(--status-success)'],
  ['referred_back', 'Referred Back', 'var(--status-danger)'],
];

function WorkflowBar({ stageCounts, milestoneCounts, attentionCount }) {
  const maxStage = Math.max(...STAGE_ROWS.map(([k]) => stageCounts[k] || 0), 1);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18 }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Workflow Load</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {STAGE_ROWS.map(([key, label, color]) => {
            const count = stageCounts[key] || 0;
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontWeight: 700, color: count > 0 ? color : 'var(--text-tertiary)' }}>{count}</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(count / maxStage) * 100}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s ease', minWidth: count > 0 ? 4 : 0 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Milestone Mix</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(milestoneCounts).length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No milestones recorded.</div>
          ) : (
            Object.entries(milestoneCounts).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{MILESTONE_TYPE_LABELS[type] || type}</span>
                <strong style={{ fontSize: 12 }}>{count}</strong>
              </div>
            ))
          )}
          <div style={{ marginTop: 8, fontSize: 12, color: attentionCount > 0 ? 'var(--status-warning)' : 'var(--status-success)', fontWeight: 600 }}>
            {attentionCount > 0 ? `${attentionCount} item(s) currently require attention` : 'No immediate bottlenecks detected'}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityPulsePanel({ requests, milestones }) {
  const stageCounts = useMemo(() => {
    const counts = Object.fromEntries(WORKFLOW_STATES.map(s => [s, 0]));
    counts.referred_back = 0;
    requests.forEach((r) => {
      if (r.status === 'referred_back') counts.referred_back += 1;
      else if (counts[r.status] !== undefined) counts[r.status] += 1;
    });
    return counts;
  }, [requests]);

  const milestoneCounts = useMemo(() => {
    const counts = {};
    milestones.forEach((m) => {
      counts[m.type] = (counts[m.type] || 0) + 1;
    });
    return counts;
  }, [milestones]);

  const attentionCount = (stageCounts.referred_back || 0) + (stageCounts.supervisor_review || 0) + (stageCounts.coordinator_review || 0);

  return (
    <div style={{ marginBottom: 'var(--space-xl)' }}>
      <Card>
      <CardHeader title="Lifecycle Overview" icon={<HiOutlineSparkles />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)" />
      <CardBody>
        <WorkflowBar stageCounts={stageCounts} milestoneCounts={milestoneCounts} attentionCount={attentionCount} />
      </CardBody>
      </Card>
    </div>
  );
}

export default function ProgressTrackerPage() {
  const { user } = useAuth();
  const { mockHDRequests, getRequestsByStudent, getUserById, mockMilestones } = useData();
  const [tab, setTab] = useState('overview'); // overview | submissions | milestones
  const [statusFilter, setStatusFilter] = useState('all');
  const [milestoneFilter, setMilestoneFilter] = useState('all');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const requests = useMemo(() => {
    if (user.role === 'student') return getRequestsByStudent(user.id);
    if (user.role === 'coordinator' || user.role === 'admin') return [...mockHDRequests];
    return mockHDRequests.filter(r => r.supervisorId === user.id || r.coSupervisorId === user.id);
  }, [user, mockHDRequests, getRequestsByStudent]);

  const filteredRequests = useMemo(() => {
    let base = [...requests];
    if (statusFilter === 'active') base = base.filter(r => !['approved', 'recommended', 'referred_back'].includes(r.status));
    else if (statusFilter === 'approved') base = base.filter(r => r.status === 'approved');
    else if (statusFilter === 'referred_back') base = base.filter(r => r.status === 'referred_back');
    return base.sort((a, b) => {
      const aActive = !['approved', 'recommended'].includes(a.status);
      const bActive = !['approved', 'recommended'].includes(b.status);
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [requests, statusFilter]);

  const milestones = useMemo(() => {
    if (user.role === 'student') return mockMilestones.filter(m => m.studentId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    return [...mockMilestones].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [user, mockMilestones]);

  const milestoneFilterOptions = useMemo(() => {
    const types = Array.from(new Set(milestones.map((m) => m.type))).filter(Boolean);
    return [{ key: 'all', label: 'All' }, ...types.map((type) => ({ key: type, label: MILESTONE_TYPE_LABELS[type] || type }))];
  }, [milestones]);

  const filteredMilestones = useMemo(() => {
    if (milestoneFilter === 'all') return milestones;
    return milestones.filter((m) => m.type === milestoneFilter);
  }, [milestones, milestoneFilter]);

  // Stats
  const approved = requests.filter(r => r.status === 'approved').length;
  const pending = requests.filter(r => !['approved', 'referred_back', 'recommended'].includes(r.status)).length;
  const referred = requests.filter(r => r.status === 'referred_back').length;

  // 48hr referral alert
  const referralAlerts = useMemo(() =>
    requests.filter(r => {
      if (r.status !== 'referred_back') return false;
      const referredAt = r.referredBackAt || r.updatedAt;
      if (!referredAt) return false;
      const elapsed = Date.now() - new Date(referredAt).getTime();
      return elapsed > 48 * 3600000;
    }),
  [requests]);

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Progress Tracker</h1>
          <p>{user.role === 'student' ? 'Track your submissions and academic milestones' : 'Monitor submission progress across the workflow'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowHistoryModal(true)}>
          <HiOutlineDocumentText style={{ verticalAlign: -2, marginRight: 4 }} /> Request History
        </button>
      </div>

      {/* Summary stats strip */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--status-success)', padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Approved</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--status-success)' }}>{approved}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--status-warning)', padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>In Progress</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--status-warning)' }}>{pending}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--status-danger)', padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Referred Back</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--status-danger)' }}>{referred}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--status-purple)', padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Milestones</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--status-purple)' }}>{milestones.length}</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="filter-bar" style={{ marginBottom: 'var(--space-xl)' }}>
        <button className={`filter-chip ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
          <HiOutlineSparkles style={{ verticalAlign: -2, marginRight: 4 }} /> Overview
        </button>
        <button className={`filter-chip ${tab === 'submissions' ? 'active' : ''}`} onClick={() => setTab('submissions')}>
          <HiOutlineClipboardDocumentList style={{ verticalAlign: -2, marginRight: 4 }} /> Submissions
        </button>
        <button className={`filter-chip ${tab === 'milestones' ? 'active' : ''}`} onClick={() => setTab('milestones')}>
          <HiOutlineAcademicCap style={{ verticalAlign: -2, marginRight: 4 }} /> Milestones
        </button>

        {/* Status filter (submissions tab only) */}
        {tab === 'submissions' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {STATUS_FILTERS.map(f => (
              <button key={f.key} className={`filter-chip ${statusFilter === f.key ? 'active' : ''}`} onClick={() => setStatusFilter(f.key)} style={{ fontSize: 11 }}>
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'overview' && (
        <>
          {referralAlerts.length > 0 && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              {referralAlerts.map(r => (
                <div key={r.id} className="tracker-referred-note" style={{ marginBottom: 8 }}>
                  <HiOutlineExclamationTriangle />
                  <span><strong>{r.title}</strong> has been referred back for over 48 hours. Please address the feedback promptly.</span>
                </div>
              ))}
            </div>
          )}

          <ActivityPulsePanel
            requests={requests}
            milestones={milestones}
          />
        </>
      )}

      {/* ── SUBMISSIONS TAB ── */}
      {tab === 'submissions' && (
        <>
          {filteredRequests.length === 0 ? (
            <EmptyState icon={<HiOutlineClipboardDocumentList />} title="No submissions to track" description="Requests will appear here once created" />
          ) : (
            <div className="tracker-card-list">
              {filteredRequests.map(r => {
                const owner = getUserById(r.currentOwner);
                const timer = timerRemaining(r);
                return (
                  <div key={r.id} className="tracker-request-card">
                    <div className="tracker-request-header">
                      <div>
                        <div className="tracker-request-title">
                          {r.title}
                          {r.locked && <HiOutlineLockClosed style={{ color: 'var(--text-tertiary)', marginLeft: 6, fontSize: 14, verticalAlign: -2 }} title="Locked" />}
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
        </>
      )}

      {/* ── MILESTONES TAB ── */}
      {tab === 'milestones' && (
        <>
          {/* Horizontal milestone filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--space-lg)' }}>
            {milestoneFilterOptions.map((f) => (
              <button key={f.key} className={`filter-chip ${milestoneFilter === f.key ? 'active' : ''}`} onClick={() => setMilestoneFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Milestones timeline */}
          <Card>
            <CardHeader title={`Milestones ${milestoneFilter !== 'all' ? 'Timeline' : 'List'}`} icon={<HiOutlineChartBarSquare />} iconBg="var(--status-purple-bg)" iconColor="var(--status-purple)" />
            <CardBody>
              {filteredMilestones.length === 0 ? (
                <EmptyState icon={<HiOutlineAcademicCap />} title="No milestones recorded" description="Add milestones from your dashboard" />
              ) : milestoneFilter === 'all' ? (
                <div>
                  {filteredMilestones.map(ms => (
                    <div key={ms.id} className="request-list-item">
                      <div className="request-list-info">
                        <div className="request-list-title">{ms.title}</div>
                        <div className="request-list-meta">
                          <span>{MILESTONE_TYPE_LABELS[ms.type] || ms.type}</span>
                          <span className="request-list-meta-sep" />
                          <span>{formatDate(ms.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                filteredMilestones.map(ms => (
                  <div key={ms.id} className="timeline-item">
                    <div className="timeline-dot" style={{ background: 'var(--status-purple)' }} />
                    <div className="timeline-content">
                      <div className="timeline-title">{ms.title}</div>
                      <div className="timeline-desc">{MILESTONE_TYPE_LABELS[ms.type]} – {ms.description}</div>
                      <div className="timeline-date">{formatDate(ms.date)}</div>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* ── Request History Popup ── */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Request History" large>
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
          {requests.length === 0 ? (
            <EmptyState icon={<HiOutlineDocumentText />} title="No requests yet" description="Requests will appear here once created" />
          ) : (
            <div className="history-timeline-vertical">
              {[...requests].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map((r, idx) => (
                <div key={r.id} className="history-timeline-entry" style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: 24, paddingLeft: 28 }}>
                  {/* Vertical connector line */}
                  {idx < requests.length - 1 && (
                    <div style={{ position: 'absolute', left: 9, top: 24, width: 2, bottom: 0, background: 'var(--border-color)' }} />
                  )}
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: 0, top: 4,
                    width: 20, height: 20, borderRadius: '50%',
                    background: r.status === 'approved' ? 'var(--status-success)' : r.status === 'referred_back' ? 'var(--status-danger)' : 'var(--uwc-navy)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 10, fontWeight: 700,
                  }}>
                    {r.status === 'approved' ? <HiCheck /> : r.status === 'referred_back' ? <HiOutlineExclamationTriangle style={{ fontSize: 10 }} /> : (idx + 1)}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          <span>{REQUEST_TYPE_LABELS[r.type] || r.type}</span>
                          <span className="request-list-meta-sep" />
                          <span>{formatDate(r.createdAt)}</span>
                          {r.fhdOutcome && (<><span className="request-list-meta-sep" /><span>Faculty Board: {r.fhdOutcome}</span></>)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          Updated {formatRelativeTime(r.updatedAt)}
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    {/* Version history mini-timeline */}
                    {r.versions && r.versions.length > 0 && (
                      <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid var(--border-light)' }}>
                        {[...r.versions].reverse().slice(0, 3).map((v, vi) => (
                          <div key={vi} style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0' }}>
                            <span style={{ fontWeight: 500 }}>{v.action}</span>
                            <span style={{ color: 'var(--text-tertiary)', marginLeft: 6 }}>{formatDate(v.date)}</span>
                          </div>
                        ))}
                        {r.versions.length > 3 && (
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>+{r.versions.length - 3} more actions</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
