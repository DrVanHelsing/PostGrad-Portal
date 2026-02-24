// ============================================
// Academic Progress Page – Student historical view
// ============================================

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardBody, StatusBadge, EmptyState } from '../components/common';
import { STATUS_CONFIG, REQUEST_TYPE_LABELS, MILESTONE_TYPE_LABELS } from '../utils/constants';
import { formatDate } from '../utils/helpers';
import {
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineChartBarSquare,
} from 'react-icons/hi2';

export default function AcademicProgressPage() {
  const { user } = useAuth();
  const { getRequestsByStudent, getStudentProfile, mockMilestones } = useData();
  const profile = getStudentProfile(user.id);
  const requests = useMemo(() => getRequestsByStudent(user.id), [user.id, getRequestsByStudent]);
  const milestones = useMemo(() => mockMilestones.filter(m => m.studentId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date)), [user.id, mockMilestones]);

  const approved = requests.filter(r => r.status === 'approved');
  const pending = requests.filter(r => !['approved', 'referred_back'].includes(r.status));
  const referred = requests.filter(r => r.status === 'referred_back');

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Academic Progress</h1>
        <p>Your complete academic history and milestones</p>
      </div>

      {/* Summary strip */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--status-success)', padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Approved Requests</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-success)' }}>{approved.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--status-warning)', padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>In Progress</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-warning)' }}>{pending.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--status-danger)', padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Referred Back</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-danger)' }}>{referred.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--status-purple)', padding: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Milestones</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-purple)' }}>{milestones.length}</div>
        </div>
      </div>

      {profile && (
        <Card>
          <CardHeader title="Registration Details" icon={<HiOutlineAcademicCap />} iconBg="var(--uwc-gold-pale)" iconColor="var(--uwc-gold)" />
          <CardBody>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16 }}>
              <div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Programme</div><div style={{ fontSize: 13, fontWeight: 600 }}>{profile.programme}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Department</div><div style={{ fontSize: 13, fontWeight: 600 }}>{profile.department}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Years Registered</div><div style={{ fontSize: 13, fontWeight: 600 }}>{profile.yearsRegistered}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Registration Date</div><div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(profile.registrationDate)}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Thesis</div><div style={{ fontSize: 13, fontWeight: 600 }}>{profile.thesisTitle || '—'}</div></div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="content-grid">
        {/* All Requests History */}
        <Card>
          <CardHeader title="Request History" icon={<HiOutlineDocumentText />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)" />
          <CardBody flush>
            {requests.length === 0 ? (
              <EmptyState icon={<HiOutlineDocumentText />} title="No requests yet" />
            ) : (
              requests.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map(r => (
                <div key={r.id} className="request-list-item">
                  <div className="request-list-info">
                    <div className="request-list-title">{r.title}</div>
                    <div className="request-list-meta">
                      <span>{REQUEST_TYPE_LABELS[r.type]}</span>
                      <span className="request-list-meta-sep" />
                      <span>{formatDate(r.createdAt)}</span>
                      {r.fhdOutcome && (<><span className="request-list-meta-sep" /><span>Faculty Board: {r.fhdOutcome}</span></>)}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Milestones Timeline */}
        <Card>
          <CardHeader title="Milestones Timeline" icon={<HiOutlineChartBarSquare />} iconBg="var(--status-purple-bg)" iconColor="var(--status-purple)" />
          <CardBody>
            {milestones.length === 0 ? (
              <EmptyState icon={<HiOutlineAcademicCap />} title="No milestones recorded" description="Add milestones from your dashboard" />
            ) : (
              milestones.map(ms => (
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
      </div>
    </div>
  );
}
