// ============================================
// Header Component
// ============================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials, formatRelativeTime } from '../../utils/helpers';
import { ROLE_LABELS, NOTIFICATION_TYPE_CONFIG } from '../../utils/constants';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineChevronDown,
  HiOutlineCheckCircle,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineCog6Tooth,
  HiOutlineQuestionMarkCircle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUser,
} from 'react-icons/hi2';

export default function Header() {
  const { user, logout } = useAuth();
  const { mockNotifications: notifications, unreadCount, markAllRead, markOneRead } = useData();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotifClick = (n) => {
    markOneRead(n.id);
    if (n.link) { navigate(n.link); setShowNotifications(false); }
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-search">
          <HiOutlineMagnifyingGlass className="header-search-icon" />
          <input type="text" placeholder="Search requests, students, events..." />
        </div>
      </div>

      <div className="header-right">
        {/* Theme toggle */}
        <button
          className="header-icon-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <HiOutlineMoon /> : <HiOutlineSun />}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="header-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <HiOutlineBell />
            {unreadCount > 0 && <span className="header-notification-dot" />}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11, gap: 3 }}
                    onClick={markAllRead}
                  >
                    <HiOutlineCheckCircle /> Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => {
                    const cfg = NOTIFICATION_TYPE_CONFIG[n.type] || NOTIFICATION_TYPE_CONFIG.info;
                    return (
                      <div
                        key={n.id}
                        className={`notification-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => handleNotifClick(n)}
                        style={{ cursor: n.link ? 'pointer' : 'default' }}
                      >
                        <div
                          className="notification-dot-indicator"
                          style={{ background: !n.read ? cfg.color : 'transparent' }}
                        />
                        <div className="notification-text">
                          <div className="notification-title">{n.title}</div>
                          <div className="notification-message">{n.message}</div>
                          <div className="notification-time">{formatRelativeTime(n.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="notification-dropdown-footer">
                <button className="btn btn-ghost btn-sm" onClick={() => setShowNotifications(false)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <div className="header-user" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="header-user-avatar">{getInitials(user?.name)}</div>
            <div className="header-user-info">
              <span className="header-user-name">{user?.name}</span>
              <span className="header-user-role">{ROLE_LABELS[user?.role]}</span>
            </div>
            <HiOutlineChevronDown style={{ fontSize: 14, color: 'var(--text-tertiary)', transition: 'transform 0.2s', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)' }} />
          </div>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className="user-dropdown-avatar">{getInitials(user?.name)}</div>
                <div>
                  <div className="user-dropdown-name">{user?.name}</div>
                  <div className="user-dropdown-email">{user?.email}</div>
                </div>
              </div>
              <div className="user-dropdown-divider" />
              <button className="user-dropdown-item" onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                <HiOutlineUser /> My Profile
              </button>
              <button className="user-dropdown-item" onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                <HiOutlineCog6Tooth /> Settings
              </button>
              <button className="user-dropdown-item" onClick={() => { navigate('/help'); setShowUserMenu(false); }}>
                <HiOutlineQuestionMarkCircle /> Help & Docs
              </button>
              <div className="user-dropdown-divider" />
              <button className="user-dropdown-item user-dropdown-item-danger" onClick={logout}>
                <HiOutlineArrowRightOnRectangle /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
