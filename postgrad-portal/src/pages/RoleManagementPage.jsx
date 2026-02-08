// ============================================
// Role Management Page – Admin CRUD
// ============================================

import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardBody, Avatar, EmptyState, Modal } from '../components/common';
import { ROLE_LABELS } from '../utils/constants';
import { firebaseConfig } from '../firebase/config';
import {
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlinePlusCircle,
  HiOutlineTrash,
} from 'react-icons/hi2';

export default function RoleManagementPage() {
  const { mockUsers, updateUserRole, createUserDoc, deleteUserDoc } = useData();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'student', department: '' });
  const showToast = (msg, v = 'success') => { setToast({ msg, v }); setTimeout(() => setToast(null), 3000); };

  const users = useMemo(() =>
    mockUsers.filter(u => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    }),
  [search, roleFilter, mockUsers]);

  const handleRoleChange = async (userId, newRole) => {
    await updateUserRole(userId, newRole);
    showToast(`Role updated to ${ROLE_LABELS[newRole]}`);
  };

  /* Create user via Firebase Auth REST API (does not affect admin session) */
  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) return;
    setCreating(true);
    try {
      // 1. Create Auth account via REST API
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: createForm.email, password: createForm.password, returnSecureToken: false }),
        }
      );
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);

      // 2. Create Firestore user doc
      await createUserDoc(data.localId, {
        name: createForm.name,
        email: createForm.email,
        role: createForm.role,
        department: createForm.department || 'General',
      });

      showToast(`User ${createForm.name} created successfully`);
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'student', department: '' });
    } catch (err) {
      console.error('Create user error:', err);
      const msg = err.message?.includes('EMAIL_EXISTS') ? 'Email already exists' : err.message || 'Failed to create user';
      showToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from the system? This will delete their user profile (Firestore doc). Note: Their Auth account can only be deleted from the Firebase Console.`)) return;
    try {
      await deleteUserDoc(userId);
      showToast(`User ${userName} removed from system`);
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Role Management</h1>
          <p>{mockUsers.length} users in the system</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <HiOutlinePlusCircle /> Create User
        </button>
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
                    <th></th>
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
                      <td>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--status-danger)' }} onClick={() => handleDeleteUser(u.id, u.name)} title="Remove user">
                          <HiOutlineTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New User"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!createForm.name || !createForm.email || !createForm.password || creating} onClick={handleCreateUser}>
              <HiOutlinePlusCircle /> {creating ? 'Creating…' : 'Create User'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Full Name <span style={{ color: 'red' }}>*</span></label>
          <input className="form-input" placeholder="e.g. John Doe" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Email <span style={{ color: 'red' }}>*</span></label>
          <input className="form-input" type="email" placeholder="e.g. john@uwc.ac.za" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Password <span style={{ color: 'red' }}>*</span></label>
          <input className="form-input" type="password" placeholder="Minimum 6 characters" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-input" placeholder="e.g. Computer Science" value={createForm.department} onChange={e => setCreateForm({ ...createForm, department: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
