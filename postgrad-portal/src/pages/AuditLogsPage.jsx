// ============================================
// Audit Logs Page – with date filter + export
// ============================================

import { useState, useMemo } from 'react';
import { useDataRefresh } from '../context/AuthContext';
import { Card, CardBody, EmptyState } from '../components/common';
import { mockAuditLogs, exportToCSV, downloadCSV } from '../data/mockData';
import { formatDateTime, formatDate } from '../utils/helpers';
import {
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';

const ACTION_COLORS = {
  'Created Request': 'var(--status-info)',
  'Submitted Request': 'var(--status-purple)',
  'Opened Request': 'var(--status-warning)',
  'Advanced Request': 'var(--status-teal)',
  'Final Approval': 'var(--status-success)',
  'Referred Back': 'var(--status-danger)',
  'Forwarded to Faculty Board': 'var(--status-orange)',
  'Faculty Board Approved': 'var(--status-success)',
  'Faculty Board Recommended': 'var(--status-teal)',
  'Faculty Board Referred Back': 'var(--status-danger)',
  'Senate Board Referred Back': 'var(--status-danger)',
};

export default function AuditLogsPage() {
  const tick = useDataRefresh();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const actions = useMemo(() => [...new Set(mockAuditLogs.map((l) => l.action))], [tick]);

  const logs = useMemo(() => {
    return mockAuditLogs
      .filter((l) => {
        const matchSearch =
          !search ||
          l.userName.toLowerCase().includes(search.toLowerCase()) ||
          l.action.toLowerCase().includes(search.toLowerCase()) ||
          l.details?.toLowerCase().includes(search.toLowerCase());
        const matchAction = actionFilter === 'all' || l.action === actionFilter;
        const logDate = new Date(l.timestamp);
        const matchFrom = !dateFrom || logDate >= new Date(dateFrom);
        const matchTo = !dateTo || logDate <= new Date(dateTo + 'T23:59:59');
        return matchSearch && matchAction && matchFrom && matchTo;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [search, actionFilter, dateFrom, dateTo, tick]);

  const handleExport = () => {
    const data = logs.map(l => ({
      Timestamp: formatDateTime(l.timestamp),
      User: l.userName,
      Action: l.action,
      Entity: `${l.entityType}:${l.entityId}`,
      Details: l.details,
    }));
    const csv = exportToCSV(data, ['Timestamp', 'User', 'Action', 'Entity', 'Details']);
    downloadCSV(csv, 'audit-logs.csv');
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Audit Logs</h1>
          <p>System activity log – {logs.length} entries</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}>
          <HiOutlineArrowDownTray /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ flexWrap: 'wrap' }}>
        <div className="search-container" style={{ maxWidth: 280 }}>
          <HiOutlineMagnifyingGlass className="search-icon" />
          <input className="search-input" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ width: 'auto', minWidth: 180 }}>
          <option value="all">All actions</option>
          {actions.map((a) => (<option key={a} value={a}>{a}</option>))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <label style={{ color: 'var(--text-secondary)' }}>From</label>
          <input className="form-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }} />
          <label style={{ color: 'var(--text-secondary)' }}>To</label>
          <input className="form-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }} />
          {(dateFrom || dateTo) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear</button>
          )}
        </div>
      </div>

      <Card>
        <CardBody flush>
          {logs.length === 0 ? (
            <EmptyState icon={<HiOutlineShieldCheck />} title="No audit logs found" description="Try adjusting your search or filter" />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => {
                    const color = ACTION_COLORS[l.action] || 'var(--text-secondary)';
                    return (
                      <tr key={l.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }}>{formatDateTime(l.timestamp)}</td>
                        <td><span style={{ fontWeight: 600 }}>{l.userName}</span></td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600, color: color, background: `color-mix(in srgb, ${color} 8%, transparent)` }}>
                            {l.action}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{l.entityType}:{l.entityId}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 300 }}>{l.details}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
