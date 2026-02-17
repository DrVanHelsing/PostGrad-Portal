// ============================================
// Settings Page – Profile & Preferences
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardBody, Avatar } from '../components/common';
import UserPicker from '../components/common/UserPicker';
import { ROLE_LABELS, PROGRAMME_OPTIONS, TITLE_OPTIONS, getDisplayName } from '../utils/constants';
import { formatDate } from '../utils/helpers';
import {
  HiOutlineUser,
  HiOutlineBell,
  HiOutlineShieldCheck,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';

export default function SettingsPage() {
  const { user, changePassword, refreshProfile, mustChangePassword, clearMustChangePassword } = useAuth();
  const { getStudentProfile, updateUserProfile, updateStudentProfile, mockUsers, getUsersByRole } = useData();
  const profile = user?.role === 'student' ? getStudentProfile(user.id) : null;
  const [activeTab, setActiveTab] = useState(mustChangePassword ? 'security' : 'profile');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeUserPicker, setActiveUserPicker] = useState(null);
  const showToast = (msg, v = 'success') => { setToast({ msg, v }); setTimeout(() => setToast(null), 3000); };

  const needsTitle = ['supervisor', 'coordinator', 'admin'].includes(user?.role);

  // Supervisor/coordinator lists for student profile
  const supervisors = useMemo(() => getUsersByRole('supervisor'), [getUsersByRole]);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || user?.name?.split(' ')[0] || '',
    surname: user?.surname || user?.name?.split(' ').slice(1).join(' ') || '',
    title: user?.title || '',
    researchTitle: user?.researchTitle || profile?.researchTitle || '',
    programme: user?.programme || profile?.programme || '',
  });

  // Student academic form
  const [academicForm, setAcademicForm] = useState({
    supervisorId: profile?.supervisorId || '',
    coSupervisorId: profile?.coSupervisorId || '',
    nominalSupervisorId: profile?.nominalSupervisorId || '',
    programme: profile?.programme || '',
    degree: profile?.degree || '',
  });

  // Sync when profile loads
  useEffect(() => {
    if (profile) {
      setAcademicForm(prev => ({
        ...prev,
        supervisorId: profile.supervisorId || '',
        coSupervisorId: profile.coSupervisorId || '',
        nominalSupervisorId: profile.nominalSupervisorId || '',
        programme: profile.programme || prev.programme,
        degree: profile.degree || prev.degree,
      }));
      setProfileForm(prev => ({
        ...prev,
        researchTitle: profile.researchTitle || prev.researchTitle,
        programme: profile.programme || prev.programme,
      }));
    }
  }, [profile]);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    statusChanges: true, deadlines: true, committee: true, newReviews: true,
  });
  useEffect(() => {
    if (user?.notificationPrefs) setNotifPrefs(prev => ({ ...prev, ...user.notificationPrefs }));
  }, [user?.notificationPrefs]);

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState('');

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const fullName = profileForm.title
        ? `${profileForm.title} ${profileForm.firstName} ${profileForm.surname}`.trim()
        : `${profileForm.firstName} ${profileForm.surname}`.trim();
      await updateUserProfile(user.id, {
        name: fullName,
        firstName: profileForm.firstName.trim(),
        surname: profileForm.surname.trim(),
        title: profileForm.title,
        researchTitle: profileForm.researchTitle.trim(),
        programme: profileForm.programme,
      });
      if (user.role === 'student' && profile) {
        await updateStudentProfile(user.id, {
          supervisorId: academicForm.supervisorId || null,
          coSupervisorId: academicForm.coSupervisorId || null,
          nominalSupervisorId: academicForm.nominalSupervisorId || null,
          programme: academicForm.programme || profileForm.programme,
          degree: academicForm.degree,
          researchTitle: profileForm.researchTitle.trim(),
        });
      }
      await refreshProfile();
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNotifSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user.id, { notificationPrefs: notifPrefs });
      await refreshProfile();
      showToast('Notification preferences saved');
    } catch (err) {
      showToast(err.message || 'Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwError('');
    if (!pwForm.current) { setPwError('Enter current password'); return; }
    if (pwForm.newPw.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    setSaving(true);
    try {
      const result = await changePassword(pwForm.current, pwForm.newPw);
      if (!result.success) {
        setPwError(result.error);
      } else {
        if (mustChangePassword) {
          await updateUserProfile(user.id, { mustChangePassword: false });
          clearMustChangePassword();
        }
        setPwForm({ current: '', newPw: '', confirm: '' });
        showToast('Password updated successfully');
      }
    } catch (err) {
      setPwError(err.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  const supervisorName = (id) => {
    const s = mockUsers.find(u => u.id === id);
    return s ? getDisplayName(s) : '';
  };

  const handlePickSupervisor = (pickedUser) => {
    if (!activeUserPicker || !pickedUser) return;
    if (activeUserPicker === 'supervisorId') {
      setAcademicForm(prev => ({
        ...prev,
        supervisorId: pickedUser.id,
        nominalSupervisorId: prev.nominalSupervisorId === pickedUser.id ? '' : prev.nominalSupervisorId,
      }));
    } else {
      setAcademicForm(prev => ({ ...prev, [activeUserPicker]: pickedUser.id }));
    }
    setActiveUserPicker(null);
  };

  const clearSupervisorField = (field) => {
    setAcademicForm(prev => ({ ...prev, [field]: '' }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <HiOutlineUser /> },
    { id: 'notifications', label: 'Notifications', icon: <HiOutlineBell /> },
    { id: 'security', label: 'Security', icon: <HiOutlineShieldCheck /> },
  ];

  return (
    <div className="page-wrapper">
      {toast && <div className={`toast toast-${toast.v}`}>{toast.msg}</div>}

      {/* First-login forced password change banner */}
      {mustChangePassword && (
        <div style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning)', padding: '14px 20px', borderRadius: 'var(--radius-lg)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14 }}>
          <HiOutlineExclamationTriangle style={{ fontSize: 22, flexShrink: 0 }} />
          You must change your temporary password before continuing. Please update your password in the Security tab below.
        </div>
      )}

      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account and profile</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabs.map((t) => (
            <button key={t.id} className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'profile' && (
            <>
              {/* ── Research Title Banner (students) ── */}
              {user?.role === 'student' && (
                <Card style={{ marginBottom: 'var(--space-lg)' }}>
                  <CardBody>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <HiOutlineDocumentText style={{ fontSize: 28, color: 'var(--uwc-navy)', flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Research Title</label>
                        <input
                          className="form-input"
                          placeholder="Title pending submission"
                          value={profileForm.researchTitle}
                          onChange={e => setProfileForm({ ...profileForm, researchTitle: e.target.value })}
                          style={{ fontSize: 15, fontWeight: 500 }}
                        />
                        {!profileForm.researchTitle && (
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, fontStyle: 'italic' }}>
                            Enter your research title once confirmed with your supervisor.
                          </div>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              <Card>
                <CardHeader title="Profile Information" icon={<HiOutlineUser />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)" />
                <CardBody>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                    <Avatar name={getDisplayName(user)} size="xl" />
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{getDisplayName(user)}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ROLE_LABELS[user?.role]}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{user?.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Title (for supervisors/coordinators/admins) */}
                    {needsTitle && (
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Title</label>
                        <select className="form-select" value={profileForm.title} onChange={e => setProfileForm({ ...profileForm, title: e.target.value })}>
                          <option value="">— Select —</option>
                          {TITLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input className="form-input" value={profileForm.firstName} onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Surname</label>
                      <input className="form-input" value={profileForm.surname} onChange={e => setProfileForm({ ...profileForm, surname: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" value={user?.email || ''} readOnly disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Email cannot be changed</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <input className="form-input" defaultValue={ROLE_LABELS[user?.role]} readOnly disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    </div>
                    {user?.studentNumber && (
                      <div className="form-group">
                        <label className="form-label">Student Number</label>
                        <input className="form-input" defaultValue={user.studentNumber} readOnly disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                      </div>
                    )}
                    {/* Programme for students */}
                    {user?.role === 'student' && (
                      <div className="form-group">
                        <label className="form-label">Programme</label>
                        <select className="form-select" value={profileForm.programme} onChange={e => setProfileForm({ ...profileForm, programme: e.target.value })}>
                          <option value="">— Select Programme —</option>
                          {PROGRAMME_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* ── Academic Details (students) ── */}
                  {user?.role === 'student' && profile && (
                    <div style={{ marginTop: 32 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HiOutlineAcademicCap /> Academic Details
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="form-group">
                          <label className="form-label">Supervisor</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'flex-start' }} onClick={() => setActiveUserPicker('supervisorId')}>
                              {academicForm.supervisorId ? supervisorName(academicForm.supervisorId) : 'Select Supervisor'}
                            </button>
                            {academicForm.supervisorId && (
                              <button className="btn btn-ghost" onClick={() => clearSupervisorField('supervisorId')}>Clear</button>
                            )}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Co-Supervisor</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'flex-start' }} onClick={() => setActiveUserPicker('coSupervisorId')}>
                              {academicForm.coSupervisorId ? supervisorName(academicForm.coSupervisorId) : 'Select Co-Supervisor'}
                            </button>
                            {academicForm.coSupervisorId && (
                              <button className="btn btn-ghost" onClick={() => clearSupervisorField('coSupervisorId')}>Clear</button>
                            )}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Nominal Supervisor</label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'flex-start' }} onClick={() => setActiveUserPicker('nominalSupervisorId')}>
                              {academicForm.nominalSupervisorId ? supervisorName(academicForm.nominalSupervisorId) : 'Select Nominal Supervisor'}
                            </button>
                            {academicForm.nominalSupervisorId && (
                              <button className="btn btn-ghost" onClick={() => clearSupervisorField('nominalSupervisorId')}>Clear</button>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            A nominal supervisor is assigned when the main supervisor is external.
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Degree</label>
                          <select className="form-select" value={academicForm.degree} onChange={e => setAcademicForm({ ...academicForm, degree: e.target.value })}>
                            <option value="">— Select —</option>
                            <option value="MSc">MSc</option>
                            <option value="PhD">PhD</option>
                            <option value="MA">MA</option>
                            <option value="MPhil">MPhil</option>
                            <option value="DPhil">DPhil</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Registration Date</label>
                          <input className="form-input" defaultValue={formatDate(profile.registrationDate)} readOnly disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Years Registered</label>
                          <input className="form-input" defaultValue={profile.yearsRegistered} readOnly disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 24 }}>
                    <button className="btn btn-primary" onClick={handleProfileSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader title="Notification Preferences" icon={<HiOutlineBell />} iconBg="var(--status-warning-bg)" iconColor="var(--status-warning)" />
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { key: 'statusChanges', label: 'Request status changes', desc: 'Get notified when your request moves to a new stage' },
                    { key: 'deadlines', label: 'Deadline reminders', desc: 'Receive reminders before upcoming deadlines' },
                    { key: 'committee', label: 'Committee decisions', desc: 'Notifications for Faculty Board / Senate Board outcomes' },
                    { key: 'newReviews', label: 'New review requests', desc: 'Alerts when new requests need your review' },
                  ].map((pref) => (
                    <label key={pref.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{pref.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{pref.desc}</div>
                      </div>
                      <input type="checkbox" checked={notifPrefs[pref.key]}
                        onChange={e => setNotifPrefs({ ...notifPrefs, [pref.key]: e.target.checked })}
                        style={{ width: 18, height: 18, accentColor: 'var(--uwc-navy)' }} />
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 24 }}>
                  <button className="btn btn-primary" onClick={handleNotifSave} disabled={saving}><HiOutlineCheckCircle /> {saving ? 'Saving…' : 'Save Preferences'}</button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader title="Security" icon={<HiOutlineShieldCheck />} iconBg="var(--status-success-bg)" iconColor="var(--status-success)" />
              <CardBody>
                {pwError && (
                  <div style={{ background: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 16 }}>
                    {pwError}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input className="form-input" type="password" placeholder="Enter current password" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input className="form-input" type="password" placeholder="Enter new password" value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} />
                    <div className="form-hint">Minimum 8 characters with at least one number and special character</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input className="form-input" type="password" placeholder="Confirm new password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
                  </div>
                  <div>
                    <button className="btn btn-primary" onClick={handlePasswordChange} disabled={saving}>{saving ? 'Updating…' : 'Update Password'}</button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {user?.role === 'student' && (
        <UserPicker
          isOpen={!!activeUserPicker}
          onClose={() => setActiveUserPicker(null)}
          onSelect={handlePickSupervisor}
          users={supervisors}
          title={
            activeUserPicker === 'supervisorId' ? 'Select Supervisor'
              : activeUserPicker === 'coSupervisorId' ? 'Select Co-Supervisor'
              : 'Select Nominal Supervisor'
          }
          roleFilter={['supervisor']}
          excludeIds={[
            ...(activeUserPicker === 'supervisorId' ? [academicForm.coSupervisorId, academicForm.nominalSupervisorId] : []),
            ...(activeUserPicker === 'coSupervisorId' ? [academicForm.supervisorId] : []),
            ...(activeUserPicker === 'nominalSupervisorId' ? [academicForm.supervisorId] : []),
          ].filter(Boolean)}
          selectedId={activeUserPicker ? academicForm[activeUserPicker] : null}
        />
      )}
    </div>
  );
}
