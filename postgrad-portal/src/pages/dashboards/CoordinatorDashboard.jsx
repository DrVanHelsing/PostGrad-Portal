// ============================================
// Coordinator Dashboard – Export, FHD/SHD links, Calendar widget
// ============================================

import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatCard, Card, CardHeader, CardBody, StatusBadge, EmptyState } from '../../components/common';
import CalendarWidget from '../../components/CalendarWidget';
import { STATUS_CONFIG, REQUEST_TYPE_LABELS } from '../../utils/constants';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineArrowRight,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const { getRequestsForCoordinator, mockHDRequests, mockStudentProfiles, exportToCSV, downloadCSV, getUserById } = useData();
  const navigate = useNavigate();

  const coordinatorRequests = useMemo(() => getRequestsForCoordinator(), [getRequestsForCoordinator]);
  const fhdPending = useMemo(() => mockHDRequests.filter((r) => r.status === 'fhd_pending'), [mockHDRequests]);
  const shdPending = useMemo(() => mockHDRequests.filter((r) => r.status === 'shd_pending'), [mockHDRequests]);
  const totalStudents = mockStudentProfiles.length;

  const [toast, setToast] = useState(null);
  const showToast = (msg, v = 'success') => { setToast({ msg, v }); setTimeout(() => setToast(null), 3000); };

  const handleExportFHD = () => {
    const items = fhdPending.map(r => {
      const profile = mockStudentProfiles.find(p => p.userId === r.studentId);
      const sup = getUserById(r.supervisorId);
      return { Title: r.title, Student: r.studentName, 'Student Number': profile?.studentNumber || '—', Degree: profile?.degree || '—', Supervisor: sup?.name || '—', Type: REQUEST_TYPE_LABELS[r.type], 'Submitted At': formatDate(r.updatedAt), Status: r.status };
    });
    const csv = exportToCSV(items, ['Title', 'Student', 'Student Number', 'Degree', 'Supervisor', 'Type', 'Submitted At', 'Status']);
    downloadCSV(csv, 'faculty-board-agenda.csv');
    showToast('Faculty Board agenda exported');
  };

  const handleExportSHD = () => {
    const items = shdPending.map(r => {
      const profile = mockStudentProfiles.find(p => p.userId === r.studentId);
      const sup = getUserById(r.supervisorId);
      return { Title: r.title, Student: r.studentName, 'Student Number': profile?.studentNumber || '—', Degree: profile?.degree || '—', Supervisor: sup?.name || '—', Type: REQUEST_TYPE_LABELS[r.type], 'Submitted At': formatDate(r.updatedAt), Status: r.status };
    });
    const csv = exportToCSV(items, ['Title', 'Student', 'Student Number', 'Degree', 'Supervisor', 'Type', 'Submitted At', 'Status']);
    downloadCSV(csv, 'senate-board-agenda.csv');
    showToast('Senate Board agenda exported');
  };

  return (
    <div className="page-wrapper">
      {toast && <div className={`toast toast-${toast.v}`}>{toast.msg}</div>}

      <div className="dashboard-welcome">
        <h1>Welcome, {user.name}</h1>
        <p>Postgraduate Coordinator</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Awaiting Review" value={coordinatorRequests.length} icon={<HiOutlineClock />} color="var(--status-warning)" bg="var(--status-warning-bg)" />
        <StatCard label="Faculty Board Pending" value={fhdPending.length} icon={<HiOutlineClipboardDocumentList />} color="var(--status-orange)" bg="var(--status-orange-bg)" />
        <StatCard label="Senate Board Pending" value={shdPending.length} icon={<HiOutlineDocumentText />} color="var(--status-pink)" bg="var(--status-pink-bg)" />
        <StatCard label="Total Students" value={totalStudents} icon={<HiOutlineUserGroup />} color="var(--status-info)" bg="var(--status-info-bg)" />
      </div>

      <div className="content-grid">
        {/* Pending Requests */}
        <Card>
          <CardHeader title="Requests Awaiting Action" icon={<HiOutlineDocumentText />} iconBg="var(--status-warning-bg)" iconColor="var(--status-warning)"
            action={<button className="btn btn-ghost btn-sm" onClick={() => navigate('/requests')}>View all <HiOutlineArrowRight /></button>} />
          <CardBody flush>
            {coordinatorRequests.length === 0 ? (
              <EmptyState icon={<HiOutlineDocumentText />} title="No pending requests" />
            ) : (
              coordinatorRequests.map((r) => (
                <div key={r.id} className="request-list-item">
                  <div className="request-list-info">
                    <div className="request-list-title">{r.title}</div>
                    <div className="request-list-meta">
                      <span>{r.studentName}</span><span className="request-list-meta-sep" />
                      <span>{REQUEST_TYPE_LABELS[r.type]}</span><span className="request-list-meta-sep" />
                      <span>{formatRelativeTime(r.updatedAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Committee Preparation */}
        <Card>
          <CardHeader title="Committee Preparation" icon={<HiOutlineClipboardDocumentList />} iconBg="var(--status-purple-bg)" iconColor="var(--status-purple)" />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="committee-stat">
                <span className="committee-stat-label">Faculty Board Agenda Items</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="committee-stat-value">{fhdPending.length}</span>
                  {fhdPending.length > 0 && <button className="btn btn-ghost btn-sm" onClick={handleExportFHD} title="Export Faculty Board agenda"><HiOutlineArrowDownTray /></button>}
                </div>
              </div>
              <div className="committee-stat">
                <span className="committee-stat-label">Senate Board Agenda Items</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="committee-stat-value">{shdPending.length}</span>
                  {shdPending.length > 0 && <button className="btn btn-ghost btn-sm" onClick={handleExportSHD} title="Export Senate Board agenda"><HiOutlineArrowDownTray /></button>}
                </div>
              </div>
              <div className="committee-stat">
                <span className="committee-stat-label">Total Under Review</span>
                <span className="committee-stat-value">{coordinatorRequests.length}</span>
              </div>
              <div className="committee-stat">
                <span className="committee-stat-label">Approved This Year</span>
                <span className="committee-stat-value">{mockHDRequests.filter((r) => r.status === 'approved').length}</span>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/requests')}>
                <HiOutlineClipboardDocumentList /> Record Outcomes
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Calendar widget with event management */}
        <CalendarWidget showManage />
      </div>
    </div>
  );
}
