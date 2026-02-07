// ============================================
// Sidebar Component
// ============================================

import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import { ROLE_LABELS } from '../../utils/constants';
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineClipboardDocumentList,
  HiOutlineCalendarDays,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineChartBarSquare,
  HiOutlineWrenchScrewdriver,
} from 'react-icons/hi2';

const NAV_ITEMS = {
  student: [
    { section: 'Main' },
    { to: '/dashboard', icon: <HiOutlineHome />, label: 'Dashboard' },
    { to: '/requests', icon: <HiOutlineDocumentText />, label: 'My Requests' },
    { to: '/tracker', icon: <HiOutlineClipboardDocumentList />, label: 'Submission Tracker' },
    { section: 'Resources' },
    { to: '/calendar', icon: <HiOutlineCalendarDays />, label: 'Calendar' },
    { to: '/progress', icon: <HiOutlineChartBarSquare />, label: 'Academic Progress' },
    { to: '/settings', icon: <HiOutlineCog6Tooth />, label: 'Settings' },
  ],
  supervisor: [
    { section: 'Main' },
    { to: '/dashboard', icon: <HiOutlineHome />, label: 'Dashboard' },
    { to: '/requests', icon: <HiOutlineDocumentText />, label: 'Review Requests' },
    { to: '/students', icon: <HiOutlineAcademicCap />, label: 'My Students' },
    { to: '/tracker', icon: <HiOutlineClipboardDocumentList />, label: 'Submission Tracker' },
    { section: 'Resources' },
    { to: '/calendar', icon: <HiOutlineCalendarDays />, label: 'Calendar' },
    { to: '/settings', icon: <HiOutlineCog6Tooth />, label: 'Settings' },
  ],
  coordinator: [
    { section: 'Main' },
    { to: '/dashboard', icon: <HiOutlineHome />, label: 'Dashboard' },
    { to: '/requests', icon: <HiOutlineDocumentText />, label: 'All Requests' },
    { to: '/students', icon: <HiOutlineUserGroup />, label: 'Students' },
    { section: 'Committee' },
    { to: '/calendar', icon: <HiOutlineCalendarDays />, label: 'Calendar' },
    { to: '/tracker', icon: <HiOutlineChartBar />, label: 'Submission Tracker' },
    { to: '/audit', icon: <HiOutlineShieldCheck />, label: 'Audit Logs' },
    { section: 'Admin' },
    { to: '/settings', icon: <HiOutlineCog6Tooth />, label: 'Settings' },
  ],
  admin: [
    { section: 'Main' },
    { to: '/dashboard', icon: <HiOutlineHome />, label: 'Dashboard' },
    { to: '/requests', icon: <HiOutlineDocumentText />, label: 'All Requests' },
    { to: '/students', icon: <HiOutlineUserGroup />, label: 'All Students' },
    { section: 'System' },
    { to: '/calendar', icon: <HiOutlineCalendarDays />, label: 'Calendar' },
    { to: '/audit', icon: <HiOutlineShieldCheck />, label: 'Audit Logs' },
    { to: '/analytics', icon: <HiOutlineChartBar />, label: 'Analytics' },
    { to: '/roles', icon: <HiOutlineWrenchScrewdriver />, label: 'Role Management' },
    { to: '/settings', icon: <HiOutlineCog6Tooth />, label: 'Settings' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS[user?.role] || NAV_ITEMS.student;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <div className="sidebar-brand-icon">UWC</div>
          <div>
            <h1>PostGrad Portal</h1>
            <span>University of the Western Cape</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {items.map((item, i) =>
          item.section ? (
            <div key={`s-${i}`} className="sidebar-section-label">{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-link-badge">{item.badge}</span>}
            </NavLink>
          )
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar">{getInitials(user?.name)}</div>
        <div className="sidebar-footer-info">
          <div className="sidebar-footer-name">{user?.name}</div>
          <div className="sidebar-footer-role">{ROLE_LABELS[user?.role] || 'User'}</div>
        </div>
        <button className="sidebar-logout-btn" onClick={logout} title="Sign out">
          <HiOutlineArrowRightOnRectangle />
        </button>
      </div>
    </aside>
  );
}
