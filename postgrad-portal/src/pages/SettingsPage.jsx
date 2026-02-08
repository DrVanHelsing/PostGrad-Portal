// ============================================
// Settings Page – Functional forms
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardBody, Avatar } from '../components/common';
import { ROLE_LABELS } from '../utils/constants';
import { formatDate } from '../utils/helpers';
import {
  HiOutlineCog6Tooth,
  HiOutlineUser,
  HiOutlineBell,
  HiOutlineShieldCheck,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

export default function SettingsPage() {
  const { user, changePassword, refreshProfile } = useAuth();
  const { getStudentProfile, updateUserProfile } = useData();
  const profile = user?.role === 'student' ? getStudentProfile(user.id) : null;
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const showToast = (msg, v = 'success') => { setToast({ msg, v }); setTimeout(() => setToast(null), 3000); };

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', department: user?.department || '' });

  // Notification prefs – loaded from user doc
  const [notifPrefs, setNotifPrefs] = useState({
    statusChanges: true, deadlines: true, committee: true, newReviews: true,
  });

  // Load saved notification prefs from user doc
  useEffect(() => {
    if (user?.notificationPrefs) {
      setNotifPrefs(prev => ({ ...prev, ...user.notificationPrefs }));
    }
  }, [user?.notificationPrefs]);

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState('');

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        name: profileForm.name.trim(),
        department: profileForm.department.trim(),
      });
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
        setPwForm({ current: '', newPw: '', confirm: '' });
        showToast('Password updated successfully');
      }
    } catch (err) {
      setPwError(err.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <HiOutlineUser /> },
    { id: 'notifications', label: 'Notifications', icon: <HiOutlineBell /> },
    { id: 'security', label: 'Security', icon: <HiOutlineShieldCheck /> },
  ];

  return (
    <div className="page-wrapper">
      {toast && <div className={`toast toast-${toast.v}`}>{toast.msg}</div>}

      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences</p>
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
            <Card>
              <CardHeader title="Profile Information" icon={<HiOutlineUser />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)" />
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                  <Avatar name={user?.name} size="xl" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ROLE_LABELS[user?.role]}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{user?.email}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={profileForm.department} onChange={e => setProfileForm({ ...profileForm, department: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <input className="form-input" defaultValue={ROLE_LABELS[user?.role]} readOnly style={{ background: 'var(--bg-secondary)' }} />
                  </div>
                  {user?.studentNumber && (
                    <div className="form-group">
                      <label className="form-label">Student Number</label>
                      <input className="form-input" defaultValue={user.studentNumber} readOnly style={{ background: 'var(--bg-secondary)' }} />
                    </div>
                  )}
                </div>

                {profile && (
                  <div style={{ marginTop: 32 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HiOutlineAcademicCap /> Academic Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div className="form-group">
                        <label className="form-label">Programme</label>
                        <input className="form-input" defaultValue={profile.programme} readOnly style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Degree</label>
                        <input className="form-input" defaultValue={profile.degree} readOnly style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Registration Date</label>
                        <input className="form-input" defaultValue={formatDate(profile.registrationDate)} readOnly style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Years Registered</label>
                        <input className="form-input" defaultValue={profile.yearsRegistered} readOnly style={{ background: 'var(--bg-secondary)' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 24 }}>
                  <button className="btn btn-primary" onClick={handleProfileSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </CardBody>
            </Card>
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
    </div>
  );
}
