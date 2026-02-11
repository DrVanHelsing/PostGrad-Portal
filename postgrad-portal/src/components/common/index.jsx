// ============================================
// Common Components – Barrel Export
// ============================================

import './common.css';
import { createPortal } from 'react-dom';
import { STATUS_CONFIG, REQUEST_TYPE_LABELS } from '../../utils/constants';
import { getInitials } from '../../utils/helpers';
import { HiXMark, HiArrowsPointingOut, HiArrowsPointingIn } from 'react-icons/hi2';

/* ── StatusBadge ── */
export function StatusBadge({ status, config }) {
  const cfg = config || STATUS_CONFIG[status] || { label: status, color: 'var(--text-secondary)', bg: 'var(--bg-muted)' };
  return (
    <span className="status-badge" style={{ background: cfg.bg, color: cfg.color }}>
      <span className="status-badge-dot" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

/* ── StatCard ── */
export function StatCard({ label, value, icon, color, bg, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ color, background: bg }}>
        {icon}
      </div>
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {trend && <div className="stat-card-trend" style={{ color: trend.color }}>{trend.text}</div>}
      </div>
    </div>
  );
}

/* ── Card ── */
export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function CardHeader({ title, icon, iconBg, iconColor, action, children }) {
  return (
    <div className="card-header">
      <div className="card-header-title">
        {icon && (
          <div className="card-header-icon" style={{ background: iconBg, color: iconColor }}>
            {icon}
          </div>
        )}
        <h3>{title}</h3>
      </div>
      {action && <div>{action}</div>}
      {children}
    </div>
  );
}

export function CardBody({ flush, children, className = '' }) {
  return (
    <div className={`${flush ? 'card-body-flush' : 'card-body'} ${className}`}>
      {children}
    </div>
  );
}

/* ── Modal ── */
export function Modal({ isOpen, onClose, title, children, footer, large, fullscreen, onToggleFullscreen }) {
  if (!isOpen) return null;
  const cls = ['modal'];
  if (large) cls.push('modal-lg');
  if (fullscreen) cls.push('modal-fullscreen');
  return createPortal(
    <div className={`modal-overlay ${fullscreen ? 'modal-overlay-fullscreen' : ''}`} onClick={onClose}>
      <div className={cls.join(' ')} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <div className="modal-header-actions">
            {onToggleFullscreen && (
              <button className="modal-close" onClick={onToggleFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'} title={fullscreen ? 'Exit full screen' : 'Full screen'}>
                {fullscreen ? <HiArrowsPointingIn /> : <HiArrowsPointingOut />}
              </button>
            )}
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <HiXMark />
            </button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Avatar ── */
export function Avatar({ name, size = 'md', color, bg }) {
  const isNumeric = typeof size === 'number';
  const sizeClass = isNumeric ? '' : `avatar-${size}`;
  const inlineSize = isNumeric
    ? { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }
    : {};
  return (
    <div
      className={`avatar ${sizeClass}`}
      style={{
        color: color || 'var(--text-inverse)',
        background: bg || 'var(--uwc-navy)',
        ...inlineSize,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

/* ── EmptyState ── */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h4>{title}</h4>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
