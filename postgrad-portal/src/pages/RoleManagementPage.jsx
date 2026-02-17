// ============================================
// Role Management Page – Full Admin CRUD
// ============================================

import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardBody, Avatar, EmptyState, Modal } from '../components/common';
import { ROLE_LABELS, CREATABLE_ROLES, TITLE_OPTIONS, PERMISSION_LABELS, getDisplayName } from '../utils/constants';
import { firebaseConfig } from '../firebase/config';
import {
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineClipboardDocument,
  HiOutlineEnvelopeOpen,
  HiOutlineArrowUpTray,
  HiOutlineDocumentArrowDown,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
} from 'react-icons/hi2';

const EMPTY_CREATE = { firstName: '', surname: '', email: '', role: 'student', title: '', permissions: [], organization: '', studentNumber: '' };
const EMPTY_EDIT = { firstName: '', surname: '', email: '', role: '', title: '', permissions: [], organization: '', studentNumber: '' };

export default function RoleManagementPage() {
  const { mockUsers, updateUserRole, createUserDoc, deleteUserDoc, updateUserDoc, generateTemporaryPassword } = useData();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE });
  const [generatedPwd, setGeneratedPwd] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ ...EMPTY_EDIT });
  const [editingUserId, setEditingUserId] = useState(null);
  const [saving, setSaving] = useState(false);

  // CSV import state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvParsed, setCsvParsed] = useState(null);       // { headers, rows, errors }
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResults, setCsvResults] = useState(null);      // { success:[], failed:[] }
  const [csvProgress, setCsvProgress] = useState({ current: 0, total: 0 });

  const showToast = (msg, v = 'success') => { setToast({ msg, v }); setTimeout(() => setToast(null), 3500); };

  const users = useMemo(() =>
    mockUsers.filter(u => {
      const name = getDisplayName(u);
      const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    }),
  [search, roleFilter, mockUsers]);

  const needsNameFields = (role) => ['supervisor', 'coordinator', 'admin'].includes(role);
  const isExternalRole = (role) => ['external', 'examiner'].includes(role);

  /* ── Generate password ── */
  const handleGeneratePassword = () => {
    const pwd = generateTemporaryPassword(12);
    setGeneratedPwd(pwd);
  };

  /* ── Copy to clipboard ── */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'));
  };

  /* ── CSV Helpers ── */
  const CSV_REQUIRED = ['firstname', 'surname', 'email', 'role'];
  const CSV_OPTIONAL = ['title', 'studentnumber', 'organization'];
  const VALID_ROLES = Object.keys(CREATABLE_ROLES);

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { headers: [], rows: [], errors: ['CSV must have a header row and at least one data row.'] };

    // Parse header
    const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
    const errors = [];

    // Check required headers
    const missing = CSV_REQUIRED.filter(r => !rawHeaders.includes(r));
    if (missing.length) errors.push(`Missing required columns: ${missing.join(', ')}`);

    if (errors.length) return { headers: rawHeaders, rows: [], errors };

    // Parse rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim());
      if (vals.length < rawHeaders.length) {
        errors.push(`Row ${i}: has ${vals.length} columns, expected ${rawHeaders.length}`);
        continue;
      }
      const row = {};
      rawHeaders.forEach((h, idx) => { row[h] = vals[idx] || ''; });

      // Validate row
      const rowErrors = [];
      if (!row.firstname) rowErrors.push('firstName is required');
      if (!row.surname) rowErrors.push('surname is required');
      if (!row.email) rowErrors.push('email is required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) rowErrors.push('email is invalid');
      if (!row.role) rowErrors.push('role is required');
      else if (!VALID_ROLES.includes(row.role.toLowerCase())) rowErrors.push(`role "${row.role}" is not valid (${VALID_ROLES.join(', ')})`);

      // Check for duplicate emails within CSV
      if (row.email && rows.some(r => r.data.email === row.email.toLowerCase())) {
        rowErrors.push('duplicate email within CSV');
      }

      rows.push({
        line: i + 1,
        data: {
          firstName: row.firstname,
          surname: row.surname,
          email: row.email?.toLowerCase(),
          role: row.role?.toLowerCase(),
          title: row.title || '',
          studentNumber: row.studentnumber || '',
          organization: row.organization || '',
        },
        errors: rowErrors,
      });
    }

    return { headers: rawHeaders, rows, errors };
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvResults(null);
    setCsvProgress({ current: 0, total: 0 });

    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      setCsvParsed(parsed);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (!csvParsed || csvImporting) return;
    const validRows = csvParsed.rows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) return;

    setCsvImporting(true);
    setCsvProgress({ current: 0, total: validRows.length });
    const success = [];
    const failed = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const d = row.data;
      const pwd = generateTemporaryPassword(12);
      const fullName = needsNameFields(d.role)
        ? `${d.title ? d.title + ' ' : ''}${d.firstName} ${d.surname}`.trim()
        : `${d.firstName} ${d.surname}`.trim();

      try {
        // 1. Create Auth account
        const resp = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: d.email, password: pwd, returnSecureToken: false }),
          }
        );
        const authData = await resp.json();
        if (authData.error) throw new Error(authData.error.message);

        // 2. Create Firestore doc
        const userDocData = {
          name: fullName,
          email: d.email,
          role: d.role,
          firstName: d.firstName,
          surname: d.surname,
          mustChangePassword: true,
          generatedPassword: pwd,
        };
        if (d.title) userDocData.title = d.title;
        if (isExternalRole(d.role)) userDocData.organization = d.organization;
        if (d.role === 'student' && d.studentNumber) userDocData.studentNumber = d.studentNumber;

        await createUserDoc(authData.localId, userDocData);
        success.push({ ...d, tempPassword: pwd, line: row.line });
      } catch (err) {
        const msg = err.message?.includes('EMAIL_EXISTS') ? 'Email already exists' : err.message || 'Unknown error';
        failed.push({ ...d, error: msg, line: row.line });
      }

      setCsvProgress({ current: i + 1, total: validRows.length });
    }

    setCsvResults({ success, failed });
    setCsvImporting(false);
    if (success.length) showToast(`${success.length} user(s) created successfully${failed.length ? `, ${failed.length} failed` : ''}`, failed.length ? 'warning' : 'success');
  };

  const resetCsvModal = () => {
    setShowCsvModal(false);
    setCsvFile(null);
    setCsvParsed(null);
    setCsvResults(null);
    setCsvProgress({ current: 0, total: 0 });
  };

  const downloadCsvTemplate = () => {
    const header = 'firstName,surname,email,role,title,studentNumber,organization';
    const example1 = 'John,Doe,john.doe@uwc.ac.za,student,,,3847562,';
    const example2 = 'Jane,Smith,jane.smith@uwc.ac.za,supervisor,Dr.,,';
    const example3 = 'External,Reviewer,reviewer@uct.ac.za,examiner,Prof.,,University of Cape Town';
    const csv = [header, example1, example2, example3].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Create user ── */
  const handleCreateUser = async () => {
    const fullName = needsNameFields(createForm.role)
      ? `${createForm.title ? createForm.title + ' ' : ''}${createForm.firstName} ${createForm.surname}`.trim()
      : `${createForm.firstName} ${createForm.surname}`.trim();
    if (!createForm.firstName || !createForm.surname || !createForm.email || !generatedPwd) return;
    setCreating(true);
    try {
      // 1. Create Auth account via REST API
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: createForm.email, password: generatedPwd, returnSecureToken: false }),
        }
      );
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);

      // 2. Create Firestore user doc
      const userDocData = {
        name: fullName,
        email: createForm.email,
        role: createForm.role,
        firstName: createForm.firstName,
        surname: createForm.surname,
        mustChangePassword: true,
        generatedPassword: generatedPwd,
      };
      if (createForm.title) userDocData.title = createForm.title;
      if (createForm.permissions?.length) userDocData.permissions = createForm.permissions;
      if (isExternalRole(createForm.role)) userDocData.organization = createForm.organization || '';
      if (createForm.role === 'student' && createForm.studentNumber) userDocData.studentNumber = createForm.studentNumber;

      await createUserDoc(data.localId, userDocData);

      showToast(`User "${fullName}" created. Temp password generated.`);
      setShowCreateModal(false);
      setCreateForm({ ...EMPTY_CREATE });
      setGeneratedPwd('');
    } catch (err) {
      console.error('Create user error:', err);
      const msg = err.message?.includes('EMAIL_EXISTS') ? 'Email already exists' : err.message || 'Failed to create user';
      showToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  /* ── Edit user ── */
  const openEditModal = (u) => {
    setEditingUserId(u.id);
    setEditForm({
      firstName: u.firstName || u.name?.split(' ')[0] || '',
      surname: u.surname || u.name?.split(' ').slice(1).join(' ') || '',
      email: u.email || '',
      role: u.role || 'student',
      title: u.title || '',
      permissions: u.permissions || [],
      organization: u.organization || '',
      studentNumber: u.studentNumber || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUserId) return;
    setSaving(true);
    try {
      const fullName = needsNameFields(editForm.role)
        ? `${editForm.title ? editForm.title + ' ' : ''}${editForm.firstName} ${editForm.surname}`.trim()
        : `${editForm.firstName} ${editForm.surname}`.trim();
      const updates = {
        name: fullName,
        firstName: editForm.firstName,
        surname: editForm.surname,
        role: editForm.role,
        title: editForm.title || '',
        permissions: editForm.permissions || [],
      };
      if (isExternalRole(editForm.role)) updates.organization = editForm.organization;
      if (editForm.role === 'student') updates.studentNumber = editForm.studentNumber;

      await updateUserDoc(editingUserId, updates);
      showToast('User updated successfully');
      setShowEditModal(false);
      setEditingUserId(null);
    } catch (err) {
      showToast(err.message || 'Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete user ── */
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName}? This deletes their profile. Their Auth account can only be removed from the Firebase Console.`)) return;
    try {
      await deleteUserDoc(userId);
      showToast(`User ${userName} removed`);
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  /* ── Permission toggle helper ── */
  const togglePermission = (formSetter, form, perm) => {
    const perms = form.permissions || [];
    const updated = perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm];
    formSetter({ ...form, permissions: updated });
  };

  /* ── Render permission checkboxes ── */
  const renderPermissions = (form, formSetter) => (
    <div className="form-group">
      <label className="form-label">Additional Permissions</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
        {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.permissions?.includes(key) || false} onChange={() => togglePermission(formSetter, form, key)} />
            {label}
          </label>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
        Grant capabilities beyond the primary role.
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>User Management</h1>
          <p>{mockUsers.length} users in the system</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary" onClick={() => { resetCsvModal(); setShowCsvModal(true); }}>
            <HiOutlineArrowUpTray /> Import CSV
          </button>
          <button className="btn btn-primary" onClick={() => { setShowCreateModal(true); setGeneratedPwd(''); setCreateForm({ ...EMPTY_CREATE }); }}>
            <HiOutlinePlusCircle /> Create User
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-container" style={{ maxWidth: 280 }}>
          <HiOutlineMagnifyingGlass className="search-icon" />
          <input className="search-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', ...Object.keys(ROLE_LABELS)].map(r => (
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
                    <th>Role</th>
                    <th>Permissions</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={getDisplayName(u)} size="sm" />
                          <div>
                            <span style={{ fontWeight: 600, display: 'block' }}>{getDisplayName(u)}</span>
                            {u.studentNumber && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{u.studentNumber}</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: isExternalRole(u.role) ? 'var(--status-teal)' : 'var(--uwc-navy)',
                          background: isExternalRole(u.role) ? 'var(--status-teal-bg)' : 'rgba(0,51,102,0.06)',
                        }}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {u.permissions?.length ? u.permissions.map(p => PERMISSION_LABELS[p] || p).join(', ') : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(u)} title="Edit user">
                            <HiOutlinePencilSquare />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--status-danger)' }} onClick={() => handleDeleteUser(u.id, getDisplayName(u))} title="Remove user">
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Create User Modal ── */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New User"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!createForm.firstName || !createForm.surname || !createForm.email || !generatedPwd || creating} onClick={handleCreateUser}>
              <HiOutlinePlusCircle /> {creating ? 'Creating…' : 'Create User'}
            </button>
          </>
        }
      >
        {/* Title (for sup/coord/admin) */}
        {needsNameFields(createForm.role) && (
          <div className="form-group">
            <label className="form-label">Title</label>
            <select className="form-select" value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })}>
              <option value="">— Select —</option>
              {TITLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">First Name <span style={{ color: 'red' }}>*</span></label>
            <input className="form-input" placeholder="First name" value={createForm.firstName} onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Surname <span style={{ color: 'red' }}>*</span></label>
            <input className="form-input" placeholder="Surname" value={createForm.surname} onChange={e => setCreateForm({ ...createForm, surname: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email <span style={{ color: 'red' }}>*</span></label>
          <input className="form-input" type="email" placeholder="e.g. john@uwc.ac.za" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
              {Object.entries(CREATABLE_ROLES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {createForm.role === 'student' && (
            <div className="form-group">
              <label className="form-label">Student Number</label>
              <input className="form-input" placeholder="e.g. 3847562" value={createForm.studentNumber} onChange={e => setCreateForm({ ...createForm, studentNumber: e.target.value })} />
            </div>
          )}
        </div>

        {isExternalRole(createForm.role) && (
          <div className="form-group">
            <label className="form-label">Organization / Affiliation</label>
            <input className="form-input" placeholder="e.g. University of Stellenbosch" value={createForm.organization} onChange={e => setCreateForm({ ...createForm, organization: e.target.value })} />
          </div>
        )}

        {renderPermissions(createForm, setCreateForm)}

        {/* Password generation */}
        <div className="form-group" style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiOutlineShieldCheck /> Generated Password
          </label>
          {generatedPwd ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{ flex: 1, padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: 14, letterSpacing: 1 }}>{generatedPwd}</code>
              <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(generatedPwd)} title="Copy"><HiOutlineClipboardDocument /></button>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '4px 0' }}>Click below to generate a temporary password.</p>
          )}
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={handleGeneratePassword}>
            {generatedPwd ? 'Regenerate' : 'Generate Password'}
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
            User will be required to change this password on first login.
          </div>
        </div>
      </Modal>

      {/* ── Edit User Modal ── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!editForm.firstName || !editForm.surname || saving} onClick={handleSaveEdit}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      >
        {needsNameFields(editForm.role) && (
          <div className="form-group">
            <label className="form-label">Title</label>
            <select className="form-select" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}>
              <option value="">— Select —</option>
              {TITLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">First Name <span style={{ color: 'red' }}>*</span></label>
            <input className="form-input" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Surname <span style={{ color: 'red' }}>*</span></label>
            <input className="form-input" value={editForm.surname} onChange={e => setEditForm({ ...editForm, surname: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={editForm.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Email cannot be changed (linked to Firebase Auth).
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {editForm.role === 'student' && (
            <div className="form-group">
              <label className="form-label">Student Number</label>
              <input className="form-input" value={editForm.studentNumber} onChange={e => setEditForm({ ...editForm, studentNumber: e.target.value })} />
            </div>
          )}
        </div>

        {isExternalRole(editForm.role) && (
          <div className="form-group">
            <label className="form-label">Organization / Affiliation</label>
            <input className="form-input" value={editForm.organization} onChange={e => setEditForm({ ...editForm, organization: e.target.value })} />
          </div>
        )}

        {renderPermissions(editForm, setEditForm)}
      </Modal>

      {/* ── CSV Import Modal ── */}
      <Modal isOpen={showCsvModal} onClose={resetCsvModal} title="Import Users from CSV"
        footer={
          <>
            <button className="btn btn-secondary" onClick={resetCsvModal}>
              {csvResults ? 'Close' : 'Cancel'}
            </button>
            {!csvResults && (
              <button
                className="btn btn-primary"
                disabled={!csvParsed || csvParsed.errors?.length > 0 || csvParsed.rows?.filter(r => r.errors.length === 0).length === 0 || csvImporting}
                onClick={handleCsvImport}
              >
                <HiOutlineArrowUpTray /> {csvImporting ? `Importing ${csvProgress.current}/${csvProgress.total}…` : 'Import Users'}
              </button>
            )}
          </>
        }
      >
        {/* Instructions */}
        <div style={{ marginBottom: 'var(--space-md)', fontSize: 13, color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 8 }}>Upload a CSV file to create multiple users at once. Each user receives a temporary password.</p>
          <p style={{ marginBottom: 4 }}><strong>Required columns:</strong> firstName, surname, email, role</p>
          <p style={{ marginBottom: 8 }}><strong>Optional columns:</strong> title, studentNumber, organization</p>
          <p style={{ marginBottom: 4 }}><strong>Valid roles:</strong> {VALID_ROLES.join(', ')}</p>
          <button className="btn btn-ghost btn-sm" onClick={downloadCsvTemplate} style={{ marginTop: 4 }}>
            <HiOutlineDocumentArrowDown /> Download CSV Template
          </button>
        </div>

        {/* File input */}
        <div className="form-group">
          <label className="form-label">Select CSV File</label>
          <input
            type="file"
            accept=".csv,text/csv"
            className="form-input"
            onChange={handleCsvFileChange}
            disabled={csvImporting}
            style={{ padding: '8px' }}
          />
        </div>

        {/* Parse errors */}
        {csvParsed?.errors?.length > 0 && (
          <div style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', fontSize: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 6 }}>
              <HiOutlineXCircle /> CSV Format Errors
            </div>
            {csvParsed.errors.map((e, i) => <div key={i}>• {e}</div>)}
          </div>
        )}

        {/* Preview parsed rows */}
        {csvParsed && csvParsed.errors?.length === 0 && !csvResults && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              Preview: {csvParsed.rows.length} row(s) found
              {csvParsed.rows.filter(r => r.errors.length > 0).length > 0 && (
                <span style={{ color: 'var(--status-warning)', fontWeight: 400, fontSize: 12 }}>
                  — {csvParsed.rows.filter(r => r.errors.length > 0).length} with errors (will be skipped)
                </span>
              )}
            </div>
            <div className="table-wrapper" style={{ maxHeight: 250, overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {csvParsed.rows.map((row, i) => (
                    <tr key={i} style={row.errors.length ? { background: 'var(--status-danger-bg)' } : {}}>
                      <td>{row.line}</td>
                      <td>{row.data.firstName} {row.data.surname}</td>
                      <td>{row.data.email}</td>
                      <td>{CREATABLE_ROLES[row.data.role] || row.data.role}</td>
                      <td>
                        {row.errors.length > 0 ? (
                          <span style={{ color: 'var(--status-danger)', fontSize: 11 }} title={row.errors.join('; ')}>
                            <HiOutlineExclamationTriangle /> {row.errors[0]}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--status-success)', fontSize: 11 }}><HiOutlineCheckCircle /> Valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import progress bar */}
            {csvImporting && (
              <div style={{ marginTop: 'var(--space-md)' }}>
                <div style={{ fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Creating user {csvProgress.current} of {csvProgress.total}…
                </div>
                <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-full)', height: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: `${csvProgress.total ? (csvProgress.current / csvProgress.total) * 100 : 0}%`,
                    height: '100%',
                    background: 'var(--uwc-blue)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import results */}
        {csvResults && (
          <div>
            {csvResults.success.length > 0 && (
              <div style={{ background: 'var(--status-success-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--status-success)', marginBottom: 8, fontSize: 13 }}>
                  <HiOutlineCheckCircle /> {csvResults.success.length} User(s) Created Successfully
                </div>
                <div className="table-wrapper" style={{ maxHeight: 200, overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Temp Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvResults.success.map((u, i) => (
                        <tr key={i}>
                          <td>{u.firstName} {u.surname}</td>
                          <td>{u.email}</td>
                          <td>{CREATABLE_ROLES[u.role] || u.role}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <code style={{ fontSize: 11, fontFamily: 'monospace' }}>{u.tempPassword}</code>
                              <button className="btn btn-ghost btn-sm" style={{ padding: 2 }} onClick={() => copyToClipboard(u.tempPassword)} title="Copy">
                                <HiOutlineClipboardDocument style={{ width: 12, height: 12 }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {csvResults.failed.length > 0 && (
              <div style={{ background: 'var(--status-danger-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--status-danger)', marginBottom: 8, fontSize: 13 }}>
                  <HiOutlineXCircle /> {csvResults.failed.length} User(s) Failed
                </div>
                <div style={{ fontSize: 12 }}>
                  {csvResults.failed.map((u, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>
                      <strong>{u.firstName} {u.surname}</strong> ({u.email}): {u.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
