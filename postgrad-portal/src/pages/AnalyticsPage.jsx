// ============================================
// Analytics Page – Charts & Metrics (Admin)
// ============================================

import { useMemo } from 'react';
import { useDataRefresh } from '../context/AuthContext';
import { Card, CardHeader, CardBody, StatusBadge } from '../components/common';
import { mockHDRequests, mockStudentProfiles, mockUsers, mockAuditLogs, exportToCSV, downloadCSV } from '../data/mockData';
import { STATUS_CONFIG, REQUEST_TYPE_LABELS, ROLE_LABELS } from '../utils/constants';
import { groupBy, formatDate } from '../utils/helpers';
import {
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';

function BarChart({ data, labelKey, valueKey, colorFn }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
            <span style={{ fontWeight: 600 }}>{d[labelKey]}</span>
            <span style={{ fontWeight: 700 }}>{d[valueKey]}</span>
          </div>
          <div style={{ height: 10, background: 'var(--bg-secondary)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${(d[valueKey] / max) * 100}%`, height: '100%', background: colorFn?.(d, i) || 'var(--uwc-navy)', borderRadius: 5, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const tick = useDataRefresh();

  const byStatus = useMemo(() =>
    Object.entries(groupBy(mockHDRequests, 'status')).map(([k, v]) => ({
      label: STATUS_CONFIG[k]?.label || k,
      count: v.length,
      color: STATUS_CONFIG[k]?.color || 'var(--uwc-navy)',
    })),
  [tick]);

  const byType = useMemo(() =>
    Object.entries(groupBy(mockHDRequests, 'type')).map(([k, v]) => ({
      label: REQUEST_TYPE_LABELS[k] || k,
      count: v.length,
    })),
  [tick]);

  const byRole = useMemo(() =>
    Object.entries(groupBy(mockUsers, 'role')).map(([k, v]) => ({
      label: ROLE_LABELS[k] || k,
      count: v.length,
    })),
  [tick]);

  const avgProcessingDays = useMemo(() => {
    const approved = mockHDRequests.filter(r => r.status === 'approved');
    if (!approved.length) return '—';
    const total = approved.reduce((sum, r) => sum + (new Date(r.updatedAt) - new Date(r.createdAt)) / (1000 * 60 * 60 * 24), 0);
    return (total / approved.length).toFixed(1);
  }, [tick]);

  const colors = ['var(--uwc-navy)', 'var(--uwc-gold)', 'var(--status-info)', 'var(--status-success)', 'var(--status-purple)', 'var(--status-warning)', 'var(--status-danger)', 'var(--status-teal)'];

  const handleExport = () => {
    const data = mockHDRequests.map(r => ({ ID: r.id, Title: r.title, Student: r.studentName, Type: REQUEST_TYPE_LABELS[r.type], Status: r.status, Created: formatDate(r.createdAt), Updated: formatDate(r.updatedAt) }));
    const csv = exportToCSV(data, ['ID', 'Title', 'Student', 'Type', 'Status', 'Created', 'Updated']);
    downloadCSV(csv, 'analytics-export.csv');
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Analytics</h1>
          <p>System metrics and reporting</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}><HiOutlineArrowDownTray /> Export Data</button>
      </div>

      {/* Summary cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--uwc-navy)', padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Total Requests</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--uwc-navy)' }}>{mockHDRequests.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--status-success)', padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Approved</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--status-success)' }}>{mockHDRequests.filter(r => r.status === 'approved').length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--status-warning)', padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Avg Processing</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--status-warning)' }}>{avgProcessingDays} <span style={{ fontSize: 14, fontWeight: 500 }}>days</span></div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--status-info)', padding: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700 }}>Active Students</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--status-info)' }}>{mockStudentProfiles.filter(s => s.status === 'active').length}</div>
        </div>
      </div>

      <div className="content-grid">
        <Card>
          <CardHeader title="Requests by Status" icon={<HiOutlineChartBar />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)" />
          <CardBody>
            <BarChart data={byStatus} labelKey="label" valueKey="count" colorFn={(d) => d.color} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Requests by Type" icon={<HiOutlineDocumentText />} iconBg="var(--uwc-gold-pale)" iconColor="var(--uwc-gold)" />
          <CardBody>
            <BarChart data={byType} labelKey="label" valueKey="count" colorFn={(_, i) => colors[i % colors.length]} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Users by Role" icon={<HiOutlineUserGroup />} iconBg="var(--status-purple-bg)" iconColor="var(--status-purple)" />
          <CardBody>
            <BarChart data={byRole} labelKey="label" valueKey="count" colorFn={(_, i) => colors[i % colors.length]} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Student Summary" icon={<HiOutlineAcademicCap />} iconBg="var(--status-teal-bg)" iconColor="var(--status-teal)" />
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {Object.entries(groupBy(mockStudentProfiles, 'status')).map(([k, v]) => (
                <div key={k} className="committee-stat">
                  <span className="committee-stat-label" style={{ textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
                  <span className="committee-stat-value">{v.length}</span>
                </div>
              ))}
              <div className="committee-stat">
                <span className="committee-stat-label">Total Audit Actions</span>
                <span className="committee-stat-value">{mockAuditLogs.length}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
