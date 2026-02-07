import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUser,
  HiOutlineBellAlert,
  HiOutlineShieldCheck,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

type SettingsTab = 'profile' | 'notifications' | 'security';

const tabs: { key: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'profile', label: 'Profile', icon: HiOutlineUser },
  { key: 'notifications', label: 'Notifications', icon: HiOutlineBellAlert },
  { key: 'security', label: 'Security', icon: HiOutlineShieldCheck },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Navigation */}
        <div className="md:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] font-medium ${
                    activeTab === tab.key
                      ? 'bg-[#003366]/[0.06] text-[#003366]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-50">
                <h2 className="text-sm font-semibold text-gray-800">Profile Information</h2>
                <p className="text-xs text-gray-500 mt-0.5">Update your personal details</p>
              </div>
              <div className="p-6 space-y-5">
                {/* Avatar Section */}
                <div className="flex items-center gap-4 pb-5 border-b border-gray-50">
                  <div className="w-16 h-16 rounded-xl bg-[#003366] flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {user?.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{user?.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{user?.role?.replace('_', ' ')}</p>
                    {user?.department && (
                      <p className="text-xs text-gray-400 mt-0.5">{user.department}</p>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-medium text-gray-500 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        defaultValue={user?.name}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-[#003366]/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-medium text-gray-500 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        defaultValue={user?.email}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-[#003366]/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-medium text-gray-500 mb-1.5">
                      Phone
                    </label>
                    <div className="relative">
                      <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="+27 XX XXX XXXX"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-[#003366]/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-medium text-gray-500 mb-1.5">
                      Department
                    </label>
                    <div className="relative">
                      <HiOutlineAcademicCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        defaultValue={user?.department || ''}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-800 focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-[#003366]/10"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-50 flex justify-end gap-3">
                <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#00264d] active:scale-[0.99]"
                >
                  {saved ? (
                    <>
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-50">
                <h2 className="text-sm font-semibold text-gray-800">Notification Preferences</h2>
                <p className="text-xs text-gray-500 mt-0.5">Choose what notifications you receive</p>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { label: 'Email Notifications', desc: 'Receive email updates for request status changes', default: true },
                  { label: 'Submission Confirmations', desc: 'Get confirmation when your request is submitted', default: true },
                  { label: 'Review Reminders', desc: 'Reminders for pending reviews and approvals', default: true },
                  { label: 'Deadline Alerts', desc: 'Notifications for upcoming deadlines', default: true },
                  { label: 'System Announcements', desc: 'General system updates and maintenance notices', default: false },
                ].map((pref, idx) => (
                  <div key={idx} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm text-gray-800 font-medium">{pref.label}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{pref.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={pref.default}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#003366] peer-focus:ring-2 peer-focus:ring-[#003366]/20 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-50 flex justify-end">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#00264d] active:scale-[0.99]"
                >
                  {saved ? (
                    <>
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-50">
                <h2 className="text-sm font-semibold text-gray-800">Security Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage your password and security options</p>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-medium text-gray-500 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full max-w-md px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-[#003366]/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-medium text-gray-500 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full max-w-md px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-[#003366]/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-medium text-gray-500 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full max-w-md px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm placeholder-gray-400 focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-[#003366]/10"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-50 flex justify-end gap-3">
                <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#00264d] active:scale-[0.99]"
                >
                  {saved ? (
                    <>
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
