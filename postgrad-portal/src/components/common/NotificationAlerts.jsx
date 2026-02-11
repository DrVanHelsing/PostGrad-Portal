// ============================================
// NotificationAlerts – Persistent alert banners
// for overdue requests and pending actions.
// ============================================

import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  HiOutlineExclamationTriangle,
  HiOutlineClock,
  HiOutlineBellAlert,
  HiOutlineXMark,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

/* Timer helper */
function hoursOverdue(request) {
  if (!request.timerStart || !request.timerHours) return 0;
  const end = new Date(request.timerStart).getTime() + request.timerHours * 3600000;
  const diff = Date.now() - end;
  return diff > 0 ? Math.round(diff / 3600000) : 0;
}

function hoursRemaining(request) {
  if (!request.timerStart || !request.timerHours) return null;
  const end = new Date(request.timerStart).getTime() + request.timerHours * 3600000;
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.round(diff / 3600000);
}

export default function NotificationAlerts({ onNavigate }) {
  const { user } = useAuth();
  const { mockHDRequests, getUserById } = useData();
  const [dismissed, setDismissed] = useState(new Set());

  const alerts = useMemo(() => {
    if (!user) return [];
    const items = [];

    for (const r of mockHDRequests) {
      if (dismissed.has(r.id)) continue;

      // Overdue alerts (request timer has expired)
      const overdue = hoursOverdue(r);
      if (overdue > 0 && r.currentOwner === user.id && !['approved', 'draft'].includes(r.status)) {
        items.push({
          id: `overdue-${r.id}`,
          requestId: r.id,
          type: 'danger',
          icon: <HiOutlineExclamationTriangle />,
          title: 'Overdue Request',
          message: `"${r.title}" is ${overdue}h overdue. Please take action immediately.`,
          dismissible: true,
        });
      }

      // Approaching deadline (< 6 hours remaining)
      const remaining = hoursRemaining(r);
      if (remaining !== null && remaining > 0 && remaining <= 6 && r.currentOwner === user.id && !['approved', 'draft'].includes(r.status)) {
        items.push({
          id: `deadline-${r.id}`,
          requestId: r.id,
          type: 'warning',
          icon: <HiOutlineClock />,
          title: 'Deadline Approaching',
          message: `"${r.title}" — ${remaining}h remaining to complete your action.`,
          dismissible: true,
        });
      }

      // Referred-back nudge (student sees referred back items)
      if (r.status === 'referred_back' && r.currentOwner === user.id) {
        items.push({
          id: `referback-${r.id}`,
          requestId: r.id,
          type: 'info',
          icon: <HiOutlineBellAlert />,
          title: 'Action Required',
          message: `"${r.title}" was referred back. Please revise and resubmit.`,
          dismissible: true,
        });
      }

      // Draft nudge (student has drafts older than 3 days)
      if (r.status === 'draft' && r.studentId === user.id) {
        const ageHours = (Date.now() - new Date(r.createdAt).getTime()) / 3600000;
        if (ageHours > 72) {
          items.push({
            id: `draft-${r.id}`,
            requestId: r.id,
            type: 'info',
            icon: <HiOutlineBellAlert />,
            title: 'Incomplete Draft',
            message: `"${r.title}" has been in draft for ${Math.round(ageHours / 24)} days. Don't forget to submit it.`,
            dismissible: true,
          });
        }
      }

      // Supervisor pending review nudge
      if (
        (r.status === 'submitted_to_supervisor' || r.status === 'supervisor_review') &&
        r.supervisorId === user.id
      ) {
        items.push({
          id: `pending-sup-${r.id}`,
          requestId: r.id,
          type: 'info',
          icon: <HiOutlineBellAlert />,
          title: 'Pending Review',
          message: `"${r.title}" from ${r.studentName} is awaiting your review.`,
          dismissible: true,
        });
      }
    }

    return items;
  }, [mockHDRequests, user, dismissed]);

  const dismiss = (alertId, requestId) => {
    setDismissed(prev => new Set([...prev, requestId]));
  };

  if (alerts.length === 0) return null;

  const typeStyles = {
    danger: {
      bg: 'var(--status-danger-bg)',
      border: 'var(--status-danger)',
      color: 'var(--status-danger)',
    },
    warning: {
      bg: 'var(--status-warning-bg)',
      border: 'var(--status-warning)',
      color: 'var(--status-warning)',
    },
    info: {
      bg: 'var(--status-info-bg)',
      border: 'var(--status-info)',
      color: 'var(--status-info)',
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
      {alerts.slice(0, 5).map(alert => {
        const style = typeStyles[alert.type] || typeStyles.info;
        return (
          <div
            key={alert.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 'var(--radius-md)',
              background: style.bg,
              borderLeft: `3px solid ${style.border}`,
              fontSize: 13,
              color: 'var(--text-primary)',
            }}
          >
            <span style={{ color: style.color, fontSize: 18, flexShrink: 0 }}>{alert.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ color: style.color }}>{alert.title}:</strong>{' '}
              <span>{alert.message}</span>
            </div>
            {onNavigate && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ flexShrink: 0, fontSize: 11 }}
                onClick={() => onNavigate(`/requests`)}
              >
                View <HiOutlineArrowRight />
              </button>
            )}
            {alert.dismissible && (
              <button
                onClick={() => dismiss(alert.id, alert.requestId)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 2, color: 'var(--text-tertiary)', flexShrink: 0,
                }}
                title="Dismiss"
              >
                <HiOutlineXMark />
              </button>
            )}
          </div>
        );
      })}
      {alerts.length > 5 && (
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-xs)' }}>
          + {alerts.length - 5} more alert{alerts.length - 5 !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
