// ============================================
// Supervisor Dashboard – with Nudge + Historical view
// ============================================

import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatCard, Card, CardHeader, CardBody, StatusBadge, Avatar, EmptyState, Modal } from '../../components/common';
import { STATUS_CONFIG, REQUEST_TYPE_LABELS, STUDENT_STATUS_CONFIG, MILESTONE_TYPE_LABELS } from '../../utils/constants';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineBellAlert,
  HiOutlineEye,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const { getRequestsForSupervisor, getStudentsForSupervisor, mockHDRequests, nudgeStudent, getUserById, mockMilestones } = useData();
  const navigate = useNavigate();

  const pendingReviews = useMemo(() => getRequestsForSupervisor(user.id), [user.id, getRequestsForSupervisor]);
  const students = useMemo(() => getStudentsForSupervisor(user.id), [user.id, getStudentsForSupervisor]);
  const allMyRequests = useMemo(() => mockHDRequests.filter(r => r.supervisorId === user.id || r.coSupervisorId === user.id), [user.id, mockHDRequests]);
  const completedCount = allMyRequests.filter((r) => r.status === 'approved').length;
  const awaitingAction = pendingReviews.filter((r) => r.currentOwner === user.id);

  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [nudgeTarget, setNudgeTarget] = useState(null);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [showHistorical, setShowHistorical] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, v = 'success') => { setToast({ msg, v }); setTimeout(() => setToast(null), 3000); };

  const historicalRequests = useMemo(() =>
    allMyRequests.filter(r => ['approved', 'recommended'].includes(r.status)),
  [allMyRequests]);

  const handleNudge = () => {
    if (!nudgeTarget) return;
    nudgeStudent(nudgeTarget.userId, user.id, nudgeMessage || 'Your supervisor is requesting an update on your progress.');
    setShowNudgeModal(false);
    setNudgeMessage('');
    showToast(`Nudge sent to ${nudgeTarget.studentNumber}`);
  };

  const openStudentDetail = (s) => {
    const u = getUserById(s.userId);
    const ms = mockMilestones.filter(m => m.studentId === s.userId);
    const reqs = mockHDRequests.filter(r => r.studentId === s.userId);
    setSelectedStudent({ ...s, user: u, milestones: ms, requests: reqs });
  };

  return (
    <div className="page-wrapper">
      {toast && <div className={`toast toast-${toast.v}`}>{toast.msg}</div>}

      <div className="dashboard-welcome">
        <h1>Welcome, {user.name}</h1>
        <p>{user.department} | Supervising {students.length} student{students.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Pending Reviews" value={pendingReviews.length} icon={<HiOutlineClock />} color="var(--status-warning)" bg="var(--status-warning-bg)" />
        <StatCard label="Awaiting My Action" value={awaitingAction.length} icon={<HiOutlineExclamationTriangle />} color="var(--status-danger)" bg="var(--status-danger-bg)" />
        <StatCard label="My Students" value={students.length} icon={<HiOutlineAcademicCap />} color="var(--status-info)" bg="var(--status-info-bg)" />
        <StatCard label="Approved Requests" value={completedCount} icon={<HiOutlineCheckCircle />} color="var(--status-success)" bg="var(--status-success-bg)" />
      </div>

      <div className="content-grid">
        {/* Requests needing review */}
        <Card>
          <CardHeader title="Requests for Review" icon={<HiOutlineDocumentText />} iconBg="var(--status-warning-bg)" iconColor="var(--status-warning)"
            action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/requests')}>View all <HiOutlineArrowRight /></button>} />
          <CardBody flush>
            {pendingReviews.length === 0 ? (
              <EmptyState icon={<HiOutlineDocumentText />} title="No pending reviews" description="You're all caught up" />
            ) : (
              pendingReviews.map((r) => (
                <div key={r.id} className="request-list-item">
                  <div className="request-list-info">
                    <div className="request-list-title">{r.title}</div>
                    <div className="request-list-meta">
                      <span>{r.studentName}</span>
                      <span className="request-list-meta-sep" />
                      <span>{REQUEST_TYPE_LABELS[r.type]}</span>
                      <span className="request-list-meta-sep" />
                      <span>{formatRelativeTime(r.updatedAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* My Students */}
        <Card>
          <CardHeader title="My Students" icon={<HiOutlineAcademicCap />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)"
            action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/students')}>View all <HiOutlineArrowRight /></button>} />
          <CardBody>
            {students.length === 0 ? (
              <EmptyState icon={<HiOutlineAcademicCap />} title="No students assigned" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {students.map((s) => {
                  const u = getUserById(s.userId);
                  const cfg = STUDENT_STATUS_CONFIG[s.status];
                  return (
                    <div key={s.userId} className="student-card" style={{ position: 'relative' }}>
                      <Avatar name={u?.name} size="md" />
                      <div className="student-card-info" style={{ flex: 1 }}>
                        <div className="student-card-name">{u?.name || s.studentNumber}</div>
                        <div className="student-card-programme">{s.programme}</div>
                        <div className="student-card-meta">
                          <span>Year {s.yearsRegistered}</span>
                          <span style={{ color: cfg?.color }}>{cfg?.label}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" title="View details" onClick={() => openStudentDetail(s)}><HiOutlineEye /> Details</button>
                        <button className="btn btn-sm" title="Send a reminder to this student"
                          style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning)', border: '1px solid var(--status-warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={() => { setNudgeTarget(s); setShowNudgeModal(true); }}>
                          <HiOutlineBellAlert /> Nudge
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Historical Submissions */}
        <Card>
          <CardHeader title="Historical Submissions" icon={<HiOutlineArrowPath />} iconBg="var(--status-success-bg)" iconColor="var(--status-success)"
            action={<button className="btn btn-ghost btn-sm" onClick={() => setShowHistorical(true)}>View all <HiOutlineArrowRight /></button>} />
          <CardBody flush>
            {historicalRequests.length === 0 ? (
              <EmptyState icon={<HiOutlineCheckCircle />} title="No completed submissions yet" />
            ) : (
              historicalRequests.slice(0, 5).map(r => (
                <div key={r.id} className="request-list-item">
                  <div className="request-list-info">
                    <div className="request-list-title">{r.title}</div>
                    <div className="request-list-meta">
                      <span>{r.studentName}</span><span className="request-list-meta-sep" />
                      <span>{formatDate(r.updatedAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Nudge Modal */}
      <Modal isOpen={showNudgeModal} onClose={() => setShowNudgeModal(false)} title={`Send Reminder to ${nudgeTarget?.studentNumber || 'Student'}`}
        footer={<><button className="btn btn-secondary" onClick={() => setShowNudgeModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleNudge}><HiOutlineBellAlert /> Send Nudge</button></>}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Send a reminder notification to this student about their submission progress.
        </p>
        <div className="form-group">
          <label className="form-label">Message (optional)</label>
          <textarea className="form-textarea" rows={3} value={nudgeMessage} onChange={e => setNudgeMessage(e.target.value)}
            placeholder="Your supervisor is requesting an update on your progress." />
        </div>
      </Modal>

      {/* Student Detail Modal */}
      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.user?.name || selectedStudent?.studentNumber || ''}>
        {selectedStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Programme</span><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedStudent.programme}</div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Year</span><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedStudent.yearsRegistered}</div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Thesis</span><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedStudent.thesisTitle || '—'}</div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Status</span><div><StatusBadge config={STUDENT_STATUS_CONFIG[selectedStudent.status]} /></div></div>
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>Requests ({selectedStudent.requests.length})</h4>
            {selectedStudent.requests.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: 13 }}>{r.title}</div>
                <StatusBadge status={r.status} />
              </div>
            ))}
            <h4 style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>Milestones ({selectedStudent.milestones.length})</h4>
            {selectedStudent.milestones.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No milestones recorded</div>
            ) : selectedStudent.milestones.map(ms => (
              <div key={ms.id} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontWeight: 600 }}>{ms.title}</span> · {MILESTONE_TYPE_LABELS[ms.type]} · {formatDate(ms.date)}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Historical Full View */}
      <Modal isOpen={showHistorical} onClose={() => setShowHistorical(false)} title="All Completed Submissions">
        {historicalRequests.map(r => (
          <div key={r.id} className="request-list-item" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <div className="request-list-info">
              <div className="request-list-title">{r.title}</div>
              <div className="request-list-meta">
                <span>{r.studentName}</span><span className="request-list-meta-sep" />
                <span>{REQUEST_TYPE_LABELS[r.type]}</span><span className="request-list-meta-sep" />
                <span>{formatDate(r.updatedAt)}</span>
              </div>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
        {historicalRequests.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 20 }}>No completed submissions</div>}
      </Modal>
    </div>
  );
}
