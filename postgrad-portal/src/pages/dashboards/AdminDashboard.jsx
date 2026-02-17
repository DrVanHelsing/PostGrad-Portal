// ============================================
// Admin Dashboard – Analytics, Role Management, Export, Calendar widget
// ============================================

import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatCard, Card, CardHeader, CardBody, StatusBadge, EmptyState } from '../../components/common';
import CalendarWidget from '../../components/CalendarWidget';
import { STATUS_CONFIG, REQUEST_TYPE_LABELS, ROLE_LABELS } from '../../utils/constants';
import { formatDate, formatDateTime, formatRelativeTime, groupBy } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineArrowDownTray,
  HiOutlineWrenchScrewdriver,
} from 'react-icons/hi2';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { mockHDRequests, mockUsers, mockStudentProfiles, mockAuditLogs, exportToCSV, downloadCSV, getUserById } = useData();
  const navigate = useNavigate();

  const totalRequests = mockHDRequests.length;
  const pendingRequests = useMemo(() => mockHDRequests.filter(r => !['approved', 'recommended', 'referred_back'].includes(r.status)), [mockHDRequests]);
  const recentAudit = useMemo(() => [...mockAuditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6), [mockAuditLogs]);
  const requestsByType = useMemo(() => groupBy(mockHDRequests, 'type'), [mockHDRequests]);
  const requestsByStatus = useMemo(() => groupBy(mockHDRequests, 'status'), [mockHDRequests]);

  const [toast, setToast] = useState(null);
  const showToast = (msg, v = 'success') => { setToast({ msg, v }); setTimeout(() => setToast(null), 3000); };

  // Simple bar chart data
  const maxCount = Math.max(...Object.values(requestsByStatus).map(v => v.length), 1);

  const handleExport = () => {
    const data = mockHDRequests.map(r => ({ ID: r.id, Title: r.title, Student: r.studentName, Type: REQUEST_TYPE_LABELS[r.type], Status: r.status, Updated: formatDate(r.updatedAt) }));
    const csv = exportToCSV(data, ['ID', 'Title', 'Student', 'Type', 'Status', 'Updated']);
    downloadCSV(csv, 'all-requests.csv');
    showToast('Requests exported');
  };

  const handleExportStudents = () => {
    const data = mockStudentProfiles.map(s => {
      const sup = getUserById(s.supervisorId);
      const coSup = s.coSupervisorId ? getUserById(s.coSupervisorId) : null;
      return { 'Student Number': s.studentNumber, Name: getUserById(s.userId)?.name || '—', Programme: s.programme, Degree: s.degree, Supervisor: sup?.name || '—', 'Co-Supervisor': coSup?.name || '—', Status: s.status, 'Year': s.yearsRegistered };
    });
    const csv = exportToCSV(data, ['Student Number', 'Name', 'Programme', 'Degree', 'Supervisor', 'Co-Supervisor', 'Status', 'Year']);
    downloadCSV(csv, 'all-students.csv');
    showToast('Students exported');
  };

  const handleExportSupervisors = () => {
    const supervisors = mockUsers.filter(u => u.role === 'supervisor');
    const data = supervisors.map(s => {
      const studentCount = mockStudentProfiles.filter(p => p.supervisorId === s.id || p.coSupervisorId === s.id).length;
      return { Name: s.name, Email: s.email, 'Students Supervised': studentCount };
    });
    const csv = exportToCSV(data, ['Name', 'Email', 'Students Supervised']);
    downloadCSV(csv, 'all-supervisors.csv');
    showToast('Supervisors exported');
  };

  return (
    <div className="page-wrapper">
      {toast && <div className={`toast toast-${toast.v}`}>{toast.msg}</div>}

      <div className="dashboard-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Administration Dashboard</h1>
          <p>System Overview</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}><HiOutlineArrowDownTray /> Export Requests</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportStudents}><HiOutlineArrowDownTray /> Export Students</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportSupervisors}><HiOutlineArrowDownTray /> Export Supervisors</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/roles')}><HiOutlineWrenchScrewdriver /> Manage Roles</button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Requests" value={totalRequests} icon={<HiOutlineDocumentText />} color="var(--uwc-navy)" bg="rgba(0,51,102,0.06)" />
        <StatCard label="In Progress" value={pendingRequests.length} icon={<HiOutlineClock />} color="var(--status-warning)" bg="var(--status-warning-bg)" />
        <StatCard label="Total Users" value={mockUsers.length} icon={<HiOutlineUserGroup />} color="var(--status-info)" bg="var(--status-info-bg)" />
        <StatCard label="Students" value={mockStudentProfiles.length} icon={<HiOutlineAcademicCap />} color="var(--status-purple)" bg="var(--status-purple-bg)" />
      </div>

      <div className="content-grid">
        {/* Requests by Status - visual bar chart */}
        <Card>
          <CardHeader title="Requests by Status" icon={<HiOutlineChartBar />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)"
            action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics')}>Analytics <HiOutlineArrowRight /></button>} />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(requestsByStatus).map(([key, items]) => {
                const cfg = STATUS_CONFIG[key];
                const pct = (items.length / maxCount) * 100;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <StatusBadge status={key} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{items.length}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: cfg?.color || 'var(--uwc-navy)', borderRadius: 4, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Users by Role - moved up for better visual balance */}
        <Card>
          <CardHeader title="Users by Role" icon={<HiOutlineUserGroup />} iconBg="var(--status-purple-bg)" iconColor="var(--status-purple)"
            action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/roles')}>Manage <HiOutlineArrowRight /></button>} />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {Object.entries(groupBy(mockUsers, 'role')).map(([role, users]) => (
                <div key={role} className="committee-stat">
                  <span className="committee-stat-label">{ROLE_LABELS[role] || role}</span>
                  <span className="committee-stat-value">{users.length}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Request types */}
        <Card>
          <CardHeader title="Requests by Type" icon={<HiOutlineDocumentText />} iconBg="var(--uwc-gold-pale)" iconColor="var(--uwc-gold)"
            action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/requests')}>All requests <HiOutlineArrowRight /></button>} />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {Object.entries(requestsByType).map(([key, items]) => (
                <div key={key} className="committee-stat">
                  <span className="committee-stat-label">{REQUEST_TYPE_LABELS[key] || key}</span>
                  <span className="committee-stat-value">{items.length}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent Audit */}
        <Card>
          <CardHeader title="Recent Activity" icon={<HiOutlineShieldCheck />} iconBg="var(--status-teal-bg)" iconColor="var(--status-teal)"
            action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/audit')}>Audit log <HiOutlineArrowRight /></button>} />
          <CardBody flush>
            {recentAudit.map((log) => (
              <div key={log.id} className="request-list-item">
                <div className="request-list-info">
                  <div className="request-list-title">{log.action}</div>
                  <div className="request-list-meta">
                    <span>{log.userName}</span><span className="request-list-meta-sep" /><span>{log.details}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{formatDateTime(log.timestamp)}</div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Calendar widget with admin event management + user targeting */}
        <CalendarWidget showManage showTargetUsers />
      </div>
    </div>
  );
}
