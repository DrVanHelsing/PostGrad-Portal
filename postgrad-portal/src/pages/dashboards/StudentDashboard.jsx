// ============================================
// Student Dashboard – with Milestone CRUD + Progress link
// ============================================

import { useState, useMemo } from 'react';
import { useAuth, useDataRefresh } from '../../context/AuthContext';
import { StatCard, Card, CardHeader, CardBody, StatusBadge, EmptyState, Modal } from '../../components/common';
import { getRequestsByStudent, getStudentProfile, mockMilestones, mockCalendarEvents, addMilestone } from '../../data/mockData';
import { STATUS_CONFIG, REQUEST_TYPE_LABELS, MILESTONE_TYPE_LABELS } from '../../utils/constants';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlinePlusCircle,
  HiOutlineCalendarDays,
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineChartBarSquare,
} from 'react-icons/hi2';

export default function StudentDashboard() {
  const { user } = useAuth();
  const tick = useDataRefresh();
  const navigate = useNavigate();

  const requests = useMemo(() => getRequestsByStudent(user.id), [user.id, tick]);
  const profile = getStudentProfile(user.id);
  const milestones = useMemo(() => mockMilestones.filter((m) => m.studentId === user.id), [user.id, tick]);
  const upcomingEvents = useMemo(() =>
    mockCalendarEvents
      .filter((e) => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4),
  [tick]);

  const activeRequests = requests.filter((r) => !['approved', 'referred_back'].includes(r.status));
  const completedRequests = requests.filter((r) => r.status === 'approved');
  const referredBack = requests.filter((r) => r.status === 'referred_back');

  // -- Milestone CRUD --
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [msForm, setMsForm] = useState({ title: '', type: 'conference', date: '', description: '' });
  const [toast, setToast] = useState(null);

  const showToast = (msg, variant = 'success') => { setToast({ msg, variant }); setTimeout(() => setToast(null), 3000); };

  const handleAddMilestone = () => {
    if (!msForm.title || !msForm.date) return;
    addMilestone({ studentId: user.id, title: msForm.title, type: msForm.type, date: new Date(msForm.date), description: msForm.description });
    setShowMilestoneModal(false);
    setMsForm({ title: '', type: 'conference', date: '', description: '' });
    showToast('Milestone added');
  };

  return (
    <div className="page-wrapper">
      {/* Toast */}
      {toast && <div className={`toast toast-${toast.variant}`}>{toast.msg}</div>}

      {/* Welcome */}
      <div className="dashboard-welcome">
        <h1>Welcome back, {user.name.split(' ')[0]}</h1>
        <p>
          {profile ? `${profile.programme} – Year ${profile.yearsRegistered}` : 'Postgraduate Student'}
          {profile?.thesisTitle && ` | ${profile.thesisTitle}`}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Active Requests" value={activeRequests.length} icon={<HiOutlineDocumentText />} color="var(--status-info)" bg="var(--status-info-bg)" />
        <StatCard label="Completed" value={completedRequests.length} icon={<HiOutlineCheckCircle />} color="var(--status-success)" bg="var(--status-success-bg)" />
        <StatCard label="Referred Back" value={referredBack.length} icon={<HiOutlineExclamationTriangle />} color="var(--status-danger)" bg="var(--status-danger-bg)" />
        <StatCard label="Milestones" value={milestones.length} icon={<HiOutlineAcademicCap />} color="var(--status-purple)" bg="var(--status-purple-bg)" />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="quick-actions-grid">
          <div className="quick-action-card" onClick={() => navigate('/requests')}>
            <div className="quick-action-icon" style={{ background: 'var(--status-info-bg)', color: 'var(--status-info)' }}><HiOutlinePlusCircle /></div>
            <span className="quick-action-label">New Request</span>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/tracker')}>
            <div className="quick-action-icon" style={{ background: 'var(--status-purple-bg)', color: 'var(--status-purple)' }}><HiOutlineClock /></div>
            <span className="quick-action-label">Track Submission</span>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/calendar')}>
            <div className="quick-action-icon" style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}><HiOutlineCalendarDays /></div>
            <span className="quick-action-label">View Calendar</span>
          </div>
          <div className="quick-action-card" onClick={() => navigate('/progress')}>
            <div className="quick-action-icon" style={{ background: 'var(--status-teal-bg)', color: 'var(--status-teal)' }}><HiOutlineChartBarSquare /></div>
            <span className="quick-action-label">Academic Progress</span>
          </div>
        </div>
      </div>

      {/* Two column */}
      <div className="content-grid">
        {/* Recent Requests */}
        <Card>
          <CardHeader title="My Requests" icon={<HiOutlineDocumentText />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)"
            action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/requests')}>View all <HiOutlineArrowRight /></button>} />
          <CardBody flush>
            {requests.length === 0 ? (
              <EmptyState icon={<HiOutlineDocumentText />} title="No requests yet" description="Submit your first request to get started" />
            ) : (
              requests.slice(0, 5).map((r) => (
                <div key={r.id} className="request-list-item">
                  <div className="request-list-info">
                    <div className="request-list-title">{r.title}</div>
                    <div className="request-list-meta">
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

        {/* Upcoming Events */}
        <Card>
          <CardHeader title="Upcoming Events" icon={<HiOutlineCalendarDays />} iconBg="var(--status-warning-bg)" iconColor="var(--status-warning)"
            action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/calendar')}>Calendar <HiOutlineArrowRight /></button>} />
          <CardBody flush>
            {upcomingEvents.length === 0 ? (
              <EmptyState icon={<HiOutlineCalendarDays />} title="No upcoming events" />
            ) : (
              upcomingEvents.map((evt) => (
                <div key={evt.id} className="request-list-item">
                  <div className="request-list-info">
                    <div className="request-list-title">{evt.title}</div>
                    <div className="request-list-meta">
                      <span>{formatDate(evt.date)}</span>
                      {evt.time && (<><span className="request-list-meta-sep" /><span>{evt.time}</span></>)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Milestones with CRUD */}
        <Card>
          <CardHeader title="Academic Milestones" icon={<HiOutlineAcademicCap />} iconBg="var(--status-purple-bg)" iconColor="var(--status-purple)"
            action={<button className="btn btn-primary btn-sm" onClick={() => setShowMilestoneModal(true)}><HiOutlinePlusCircle /> Add</button>} />
          <CardBody>
            {milestones.length === 0 ? (
              <EmptyState icon={<HiOutlineAcademicCap />} title="No milestones yet" description="Track your academic progress by adding milestones" />
            ) : (
              milestones.map((ms) => (
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

        {/* Academic Profile */}
        {profile && (
          <Card>
            <CardHeader title="Academic Profile" icon={<HiOutlineAcademicCap />} iconBg="var(--uwc-gold-pale)" iconColor="var(--uwc-gold)" />
            <CardBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="committee-stat"><span className="committee-stat-label">Programme</span><span className="committee-stat-value" style={{ fontSize: 13 }}>{profile.programme}</span></div>
                <div className="committee-stat"><span className="committee-stat-label">Department</span><span className="committee-stat-value" style={{ fontSize: 13 }}>{profile.department}</span></div>
                <div className="committee-stat"><span className="committee-stat-label">Registration Date</span><span className="committee-stat-value" style={{ fontSize: 13 }}>{formatDate(profile.registrationDate)}</span></div>
                <div className="committee-stat"><span className="committee-stat-label">Years Registered</span><span className="committee-stat-value" style={{ fontSize: 13 }}>{profile.yearsRegistered}</span></div>
                <div className="committee-stat"><span className="committee-stat-label">Thesis</span><span className="committee-stat-value" style={{ fontSize: 13 }}>{profile.thesisTitle || '—'}</span></div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Add Milestone Modal */}
      <Modal isOpen={showMilestoneModal} onClose={() => setShowMilestoneModal(false)} title="Add Milestone"
        footer={<><button className="btn btn-secondary" onClick={() => setShowMilestoneModal(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={!msForm.title || !msForm.date} onClick={handleAddMilestone}>Add Milestone</button></>}>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" placeholder="e.g. Conference presentation at ICSE" value={msForm.title} onChange={e => setMsForm({ ...msForm, title: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={msForm.type} onChange={e => setMsForm({ ...msForm, type: e.target.value })}>
              {Object.entries(MILESTONE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={msForm.date} onChange={e => setMsForm({ ...msForm, date: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" rows={3} placeholder="Brief description..." value={msForm.description} onChange={e => setMsForm({ ...msForm, description: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
