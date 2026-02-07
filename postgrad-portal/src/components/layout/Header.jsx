// ============================================
// Header Component
// ============================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials, formatRelativeTime } from '../../utils/helpers';
import { ROLE_LABELS, NOTIFICATION_TYPE_CONFIG } from '../../utils/constants';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineChevronDown,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

export default function Header() {
  const { user, notifications, unreadCount, markAllRead, markOneRead } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
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

        {/* User */}
        <div className="header-user">
          <div className="header-user-avatar">{getInitials(user?.name)}</div>
          <div className="header-user-info">
            <span className="header-user-name">{user?.name}</span>
            <span className="header-user-role">{ROLE_LABELS[user?.role]}</span>
          </div>
          <HiOutlineChevronDown style={{ fontSize: 14, color: 'var(--text-tertiary)' }} />
        </div>
      </div>
    </header>
  );
}
