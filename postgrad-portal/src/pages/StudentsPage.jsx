// ============================================
// Students Page – with Edit Modal + Milestones view
// ============================================

import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardBody, StatusBadge, Avatar, EmptyState, Modal } from '../components/common';
import { STUDENT_STATUS_CONFIG, MILESTONE_TYPE_LABELS } from '../utils/constants';
import { formatDate } from '../utils/helpers';
import {
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
  HiOutlinePencilSquare,
  HiOutlineEye,
} from 'react-icons/hi2';

export default function StudentsPage() {
  const { user } = useAuth();
  const { mockStudentProfiles, mockUsers, getUserById, getRequestsByStudent, mockMilestones, updateStudentProfile, getStudentsForSupervisor } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({ thesisTitle: '', supervisorId: '', coSupervisorId: '', status: '' });
  const [toast, setToast] = useState(null);
  const showToast = (msg, v = 'success') => { setToast({ msg, v }); setTimeout(() => setToast(null), 3000); };

  const canEdit = user.role === 'coordinator' || user.role === 'admin';
  const supervisorUsers = mockUsers.filter(u => u.role === 'supervisor');

  const students = useMemo(() => {
    const base = user.role === 'supervisor' ? getStudentsForSupervisor(user.id) : mockStudentProfiles;
    return base
      .map((s) => {
        const u = getUserById(s.userId);
        const requests = getRequestsByStudent(s.userId);
        const supervisor = getUserById(s.supervisorId);
        const coSupervisor = s.coSupervisorId ? getUserById(s.coSupervisorId) : null;
        const milestones = mockMilestones.filter(m => m.studentId === s.userId);
        return { ...s, user: u, requests, supervisor, coSupervisor, milestones };
      })
      .filter((s) => {
        const matchSearch = !search || s.user?.name?.toLowerCase().includes(search.toLowerCase()) || s.studentNumber?.toLowerCase().includes(search.toLowerCase()) || s.programme?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchSearch && matchStatus;
      });
  }, [search, statusFilter, mockStudentProfiles, mockMilestones]);

  const openEdit = (s) => {
    setEditStudent(s);
    setEditForm({
      thesisTitle: s.thesisTitle || '',
      supervisorId: s.supervisorId || '',
      coSupervisorId: s.coSupervisorId || '',
      status: s.status || 'active',
    });
  };

  const handleSaveEdit = () => {
    if (!editStudent) return;
    const updates = { thesisTitle: editForm.thesisTitle };
    if (editForm.supervisorId && editForm.supervisorId !== editStudent.supervisorId) {
      updates.supervisorId = editForm.supervisorId;
    }
    updates.coSupervisorId = editForm.coSupervisorId || null;
    if (editForm.status !== editStudent.status) {
      updates.status = editForm.status;
    }
    updateStudentProfile(editStudent.userId, updates);
    setEditStudent(null);
    showToast('Student profile updated');
  };

  return (
    <div className="page-wrapper">
      {toast && <div className={`toast toast-${toast.v}`}>{toast.msg}</div>}

      <div className="page-header">
        <h1>Students</h1>
        <p>{students.length} postgraduate student{students.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="filter-bar">
        <div className="search-container" style={{ maxWidth: 280 }}>
          <HiOutlineMagnifyingGlass className="search-icon" />
          <input className="search-input" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {['all', 'active', 'on_leave', 'completed', 'discontinued'].map((s) => (
          <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : STUDENT_STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {students.length === 0 ? (
        <EmptyState icon={<HiOutlineUserGroup />} title="No students found" description="Try adjusting your search or filter" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--space-lg)' }}>
          {students.map((s) => {
            const cfg = STUDENT_STATUS_CONFIG[s.status];
            return (
              <Card key={s.userId}>
                <CardBody>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <Avatar name={s.user?.name} size="lg" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{s.user?.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.studentNumber}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <StatusBadge config={cfg} />
                          <button className="btn btn-ghost btn-sm" title="View details" onClick={() => setSelectedStudent(s)}><HiOutlineEye /></button>
                          {canEdit && <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEdit(s)}><HiOutlinePencilSquare /></button>}
                        </div>
                      </div>

                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginTop: 8 }}>
                        <HiOutlineAcademicCap style={{ verticalAlign: -2, marginRight: 4 }} />{s.programme}
                      </div>

                      {s.thesisTitle && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>{s.thesisTitle}</div>
                      )}

                      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><HiOutlineCalendarDays /> Year {s.yearsRegistered}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><HiOutlineDocumentText /> {s.requests.length} request{s.requests.length !== 1 ? 's' : ''}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><HiOutlineAcademicCap /> {s.milestones.length} milestone{s.milestones.length !== 1 ? 's' : ''}</div>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                        Supervisor: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.supervisor?.name || '—'}</span>
                        {s.coSupervisor && (<span> | Co-supervisor: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.coSupervisor.name}</span></span>)}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Student Detail Modal */}
      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title={selectedStudent?.user?.name || ''}>
        {selectedStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Student Number</span><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedStudent.studentNumber}</div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Programme</span><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedStudent.programme}</div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Department</span><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedStudent.department}</div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Year</span><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedStudent.yearsRegistered}</div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Registration</span><div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(selectedStudent.registrationDate)}</div></div>
              <div><span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Thesis</span><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedStudent.thesisTitle || '—'}</div></div>
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

            {selectedStudent.supervisorHistory && selectedStudent.supervisorHistory.length > 0 && (
              <>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>Supervisor History</h4>
                {selectedStudent.supervisorHistory.map((h, i) => (
                  <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
                    {h.name} ({formatDate(h.from)} – {h.to ? formatDate(h.to) : 'Present'})
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={!!editStudent} onClose={() => setEditStudent(null)} title={`Edit: ${editStudent?.user?.name || ''}`}
        footer={<><button className="btn btn-secondary" onClick={() => setEditStudent(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button></>}>
        {editStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Thesis Title</label>
              <input className="form-input" value={editForm.thesisTitle} onChange={e => setEditForm({ ...editForm, thesisTitle: e.target.value })} placeholder="Thesis title" />
            </div>
            <div className="form-group">
              <label className="form-label">Primary Supervisor</label>
              <select className="form-select" value={editForm.supervisorId} onChange={e => setEditForm({ ...editForm, supervisorId: e.target.value })}>
                <option value="">— Select —</option>
                {supervisorUsers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Co-Supervisor (optional)</label>
              <select className="form-select" value={editForm.coSupervisorId} onChange={e => setEditForm({ ...editForm, coSupervisorId: e.target.value })}>
                <option value="">— None —</option>
                {supervisorUsers.filter(s => s.id !== editForm.supervisorId).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="completed">Completed</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Student Number</label>
              <input className="form-input" value={editStudent.studentNumber} readOnly style={{ background: 'var(--bg-secondary)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Programme</label>
              <input className="form-input" value={editStudent.programme} readOnly style={{ background: 'var(--bg-secondary)' }} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
