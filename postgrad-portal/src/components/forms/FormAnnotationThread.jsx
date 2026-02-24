// ============================================
// FormAnnotationThread – Single field/section
// annotation thread with replies and resolve.
// ============================================
import { useState } from 'react';
import {
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineCheckCircle,
  HiOutlineArrowUturnLeft,
  HiOutlinePaperAirplane,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import './FormAnnotations.css';

const ROLE_LABELS = {
  student: 'Student',
  supervisor: 'Supervisor',
  co_supervisor: 'Co-Supervisor',
  coordinator: 'Coordinator',
  admin: 'Admin',
};

const ROLE_COLORS = {
  student: 'var(--status-info)',
  supervisor: 'var(--status-success)',
  co_supervisor: 'var(--status-teal)',
  coordinator: 'var(--status-purple)',
  admin: 'var(--uwc-navy)',
};

function timeSince(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ name, role, size = 28 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="fat-avatar" style={{
      width: size, height: size, borderRadius: '50%',
      background: ROLE_COLORS[role] || 'var(--uwc-navy)',
      color: '#fff', fontSize: size * 0.38, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/**
 * @param {Object}   annotation         – null means no annotation yet; non-null = existing thread
 * @param {Object}   currentUser        – { id, name, role }
 * @param {boolean}  canAnnotate        – can add NEW threads (supervisor/coord/admin)
 * @param {boolean}  canResolve         – can mark thread resolved
 * @param {Function} onAdd(text)        – add brand-new annotation
 * @param {Function} onReply(id, text)  – add reply to existing
 * @param {Function} onResolve(id)      – mark resolved
 * @param {Function} onReopen(id)       – reopen resolved
 * @param {Function} onClose            – dismiss the thread panel
 */
export default function FormAnnotationThread({
  annotation,
  currentUser,
  canAnnotate = false,
  canResolve = false,
  onAdd,
  onReply,
  onResolve,
  onReopen,
  onClose,
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      if (annotation) {
        await onReply?.(annotation.id, trimmed);
      } else {
        await onAdd?.(trimmed);
      }
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  const isResolved = annotation?.resolved;

  return (
    <div className={`fat-thread ${isResolved ? 'fat-thread-resolved' : ''}`}>
      {/* Header */}
      <div className="fat-thread-header">
        <HiOutlineChatBubbleLeftEllipsis className="fat-thread-icon" />
        <span className="fat-thread-title">
          {isResolved ? 'Resolved thread' : annotation ? 'Discussion' : 'Add a comment'}
        </span>
        <div className="fat-thread-header-actions">
          {annotation && canResolve && !isResolved && (
            <button
              className="fat-btn fat-btn-resolve"
              onClick={() => onResolve?.(annotation.id)}
              title="Mark as resolved"
            >
              <HiOutlineCheckCircle /> Resolve
            </button>
          )}
          {annotation && canResolve && isResolved && (
            <button
              className="fat-btn fat-btn-reopen"
              onClick={() => onReopen?.(annotation.id)}
              title="Reopen this thread"
            >
              <HiOutlineArrowUturnLeft /> Reopen
            </button>
          )}
          <button className="fat-btn fat-btn-ghost" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      {/* Resolved banner */}
      {isResolved && (
        <div className="fat-resolved-banner">
          <HiOutlineLockClosed /> Thread resolved
        </div>
      )}

      {/* Message list */}
      {annotation && (
        <div className="fat-messages">
          {/* Root message */}
          <div className="fat-message">
            <Avatar name={annotation.authorName} role={annotation.authorRole} />
            <div className="fat-message-body">
              <div className="fat-message-meta">
                <span className="fat-message-author">{annotation.authorName}</span>
                <span className="fat-message-role"
                  style={{ background: ROLE_COLORS[annotation.authorRole] + '18', color: ROLE_COLORS[annotation.authorRole] }}>
                  {ROLE_LABELS[annotation.authorRole] || annotation.authorRole}
                </span>
                <span className="fat-message-time">{timeSince(annotation.createdAt)}</span>
              </div>
              <div className="fat-message-text">{annotation.text}</div>
              {/* Highlighted text snippet */}
              {annotation.highlightText && (
                <div className="fat-highlight-snippet">
                  <span className="fat-highlight-snippet-label">Highlighted:</span>
                  <mark className="fat-highlight-mark">&ldquo;{annotation.highlightText}&rdquo;</mark>
                </div>
              )}
            </div>
          </div>

          {/* Replies */}
          {annotation.replies?.map((r) => (
            <div key={r.id} className="fat-message fat-message-reply">
              <Avatar name={r.authorName} role={r.authorRole} size={24} />
              <div className="fat-message-body">
                <div className="fat-message-meta">
                  <span className="fat-message-author">{r.authorName}</span>
                  <span className="fat-message-role"
                    style={{ background: ROLE_COLORS[r.authorRole] + '18', color: ROLE_COLORS[r.authorRole] }}>
                    {ROLE_LABELS[r.authorRole] || r.authorRole}
                  </span>
                  <span className="fat-message-time">{timeSince(r.createdAt)}</span>
                </div>
                <div className="fat-message-text">{r.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      {(!isResolved || (isResolved && canResolve)) && (canAnnotate || annotation) && (
        <div className="fat-input-area">
          <Avatar name={currentUser?.name} role={currentUser?.role} size={24} />
          <div className="fat-input-group">
            <textarea
              className="fat-textarea"
              placeholder={annotation ? 'Write a reply…' : 'Add a comment on this field…'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
              }}
            />
            <button
              className="fat-btn fat-btn-send"
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              title="Send (Ctrl+Enter)"
            >
              <HiOutlinePaperAirplane />
            </button>
          </div>
        </div>
      )}

      {isResolved && !canResolve && (
        <div className="fat-resolved-footer">This discussion has been resolved.</div>
      )}
    </div>
  );
}
