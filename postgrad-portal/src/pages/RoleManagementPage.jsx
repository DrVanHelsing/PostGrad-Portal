// ============================================
// Role Management Page – Admin CRUD
// ============================================

import { useState, useMemo } from 'react';
import { useDataRefresh } from '../context/AuthContext';
import { Card, CardBody, Avatar, EmptyState } from '../components/common';
import { mockUsers, updateUserRole } from '../data/mockData';
import { ROLE_LABELS } from '../utils/constants';
import {
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';

export default function RoleManagementPage() {
  const tick = useDataRefresh();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const showToast = (msg, v = 'success') => { setToast({ msg, v }); setTimeout(() => setToast(null), 3000); };

  const users = useMemo(() =>
    mockUsers.filter(u => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    }),
  [search, roleFilter, tick]);

  const handleRoleChange = (userId, newRole) => {
    updateUserRole(userId, newRole);
    showToast(`Role updated to ${ROLE_LABELS[newRole]}`);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Role Management</h1>
        <p>{mockUsers.length} users in the system</p>
      </div>

      <div className="filter-bar">
        <div className="search-container" style={{ maxWidth: 280 }}>
          <HiOutlineMagnifyingGlass className="search-icon" />
          <input className="search-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'student', 'supervisor', 'coordinator', 'admin'].map(r => (
          <button key={r} className={`filter-chip ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
            {r === 'all' ? 'All' : ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      {toast && <div className={`toast toast-${toast.v}`}>{toast.msg}</div>}

      <Card>
        <CardBody flush>
          {users.length === 0 ? (
            <EmptyState icon={<HiOutlineUserGroup />} title="No users found" />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Current Role</th>
                    <th>Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={u.name} size="sm" />
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ fontSize: 12 }}>{u.department}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--uwc-navy)',
                          background: 'rgba(0,51,102,0.06)',
                        }}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ width: 'auto', minWidth: 140, fontSize: 12, padding: '4px 8px' }}
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                        >
                          {Object.entries(ROLE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
