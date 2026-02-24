// ============================================
// FormAnnotationsPanel – Full annotation list
// Slide-in panel showing ALL threads for a
// submission, with filter and summary.
// ============================================
import { useState } from 'react';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiXMark,
  HiOutlinePaperAirplane,
  HiOutlineArrowUturnLeft,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import './FormAnnotations.css';

const ROLE_COLORS = {
  student: 'var(--status-info)',
  supervisor: 'var(--status-success)',
  co_supervisor: 'var(--status-teal)',
  coordinator: 'var(--status-purple)',
  admin: 'var(--uwc-navy)',
};

const ROLE_LABELS = {
  student: 'Student',
  supervisor: 'Supervisor',
  co_supervisor: 'Co-Supervisor',
  coordinator: 'Coordinator',
  admin: 'Admin',
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
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function Avatar({ name, role, size = 28 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
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
 * @param {boolean}  isOpen
 * @param {Function} onClose
 * @param {Array}    annotations      – all annotation objects for the submission
 * @param {Object}   currentUser      – { id, name, role }
 * @param {boolean}  canAnnotate      – supervisor/coordinator/admin
 * @param {boolean}  canResolve       – supervisor/coordinator/admin
 * @param {Function} onReply(id, text)
 * @param {Function} onResolve(id)
 * @param {Function} onReopen(id)
 * @param {string}   formTitle        – name of the form template
 */
export default function FormAnnotationsPanel({
  isOpen,
  onClose,
  annotations = [],
  currentUser,
  canAnnotate = false,
  canResolve = false,
  onReply,
  onResolve,
  onReopen,
  formTitle = 'Form',
}) {
  const [filter, setFilter] = useState('open'); // 'all' | 'open' | 'resolved'
  const [replyTexts, setReplyTexts] = useState({});
  const [submitting, setSubmitting] = useState(null);
  const [expandedThreads, setExpandedThreads] = useState({}); // { [annotationId]: true }

  const COLLAPSE_THRESHOLD = 100; // chars – threads with text shorter than this AND 0 replies show fully
  const isLongThread = (ann) => (ann.text?.length || 0) > COLLAPSE_THRESHOLD || (ann.replies?.length || 0) > 0;
  const isExpanded = (ann) => expandedThreads[ann.id] || !isLongThread(ann);
  const toggleExpanded = (id) => setExpandedThreads(prev => ({ ...prev, [id]: !prev[id] }));

  const open = annotations.filter(a => !a.resolved);
  const resolved = annotations.filter(a => a.resolved);
  const displayed = filter === 'all' ? annotations : filter === 'open' ? open : resolved;

  const handleReply = async (annotationId) => {
    const text = (replyTexts[annotationId] || '').trim();
    if (!text) return;
    setSubmitting(annotationId);
    try {
      await onReply?.(annotationId, text);
      setReplyTexts(prev => ({ ...prev, [annotationId]: '' }));
    } finally {
      setSubmitting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fap-overlay" onClick={onClose}>
      <aside className="fap-panel" onClick={(e) => e.stopPropagation()}>
        {/* Panel header */}
        <div className="fap-header">
          <HiOutlineChatBubbleLeftRight className="fap-header-icon" />
          <div className="fap-header-info">
            <div className="fap-header-title">Form Discussion</div>
            <div className="fap-header-sub">{formTitle}</div>
          </div>
          <div className="fap-header-stats">
            {open.length > 0 && (
              <span className="fap-badge fap-badge-open">{open.length} open</span>
            )}
            {resolved.length > 0 && (
              <span className="fap-badge fap-badge-resolved">{resolved.length} resolved</span>
            )}
          </div>
          <button className="fap-close" onClick={onClose}><HiXMark /></button>
        </div>

        {/* Filter tabs */}
        <div className="fap-filters">
          {[
            { id: 'open', label: `Open (${open.length})` },
            { id: 'resolved', label: `Resolved (${resolved.length})` },
            { id: 'all', label: `All (${annotations.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              className={`fap-filter-btn ${filter === tab.id ? 'active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Thread list */}
        <div className="fap-threads">
          {displayed.length === 0 && (
            <div className="fap-empty">
              {filter === 'open'
                ? 'No open discussions — the form looks good!'
                : filter === 'resolved'
                  ? 'No resolved threads yet.'
                  : 'No comments on this form yet.'}
            </div>
          )}

          {displayed.map((ann) => {
            const expanded = isExpanded(ann);
            const long = isLongThread(ann);
            const replyCount = ann.replies?.length || 0;

            return (
            <div
              key={ann.id}
              className={`fap-thread ${ann.resolved ? 'fap-thread-resolved' : ''} ${!expanded ? 'fap-thread-collapsed' : ''}`}
              onClick={() => { if (!expanded) toggleExpanded(ann.id); }}
            >
              {/* Thread location */}
              <div
                className="fap-thread-target fap-thread-target-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  const fieldId = ann.highlightFieldId || ann.targetId;
                  const el = document.querySelector(`[data-field-id="${fieldId}"]`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  if (!expanded) toggleExpanded(ann.id);
                }}
                title="Click to scroll to field"
              >
                {ann.resolved
                  ? <HiOutlineCheckCircle className="fap-target-icon fap-target-resolved" />
                  : <HiOutlineExclamationCircle className="fap-target-icon fap-target-open" />
                }
                <span className="fap-target-label">{ann.targetLabel || ann.targetId}</span>
                <span className="fap-target-type">
                  {ann.targetType === 'section' ? 'section' : ann.targetType === 'highlight' ? 'highlight' : 'field'}
                </span>
                {long && (
                  <span className={`fap-expand-indicator ${expanded ? 'expanded' : ''}`}>
                    {expanded ? '▾' : '▸'}
                    {!expanded && replyCount > 0 && (
                      <span className="fap-reply-count">{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                    )}
                  </span>
                )}
              </div>

              {/* Highlighted text snippet */}
              {ann.highlightText && (
                <div className="fap-highlight-snippet">
                  <mark className="fap-highlight-mark">&ldquo;{ann.highlightText}&rdquo;</mark>
                </div>
              )}

              {/* Root message — always visible but truncated when collapsed */}
              <div className="fap-message">
                <Avatar name={ann.authorName} role={ann.authorRole} />
                <div className="fap-message-body">
                  <div className="fap-message-meta">
                    <span className="fap-message-author">{ann.authorName}</span>
                    <span className="fap-message-role"
                      style={{ background: (ROLE_COLORS[ann.authorRole] || 'var(--uwc-navy)') + '18', color: ROLE_COLORS[ann.authorRole] || 'var(--uwc-navy)' }}>
                      {ROLE_LABELS[ann.authorRole] || ann.authorRole}
                    </span>
                    <span className="fap-message-time">{timeSince(ann.createdAt)}</span>
                  </div>
                  <div className={`fap-message-text ${!expanded ? 'fap-message-text-collapsed' : ''}`}>
                    {ann.text}
                  </div>
                  {!expanded && long && (
                    <button className="fap-expand-btn" onClick={(e) => { e.stopPropagation(); toggleExpanded(ann.id); }}>
                      Show more{replyCount > 0 ? ` + ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}` : ''}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded content: replies, reply input, actions */}
              {expanded && (
                <>
                  {/* Replies */}
                  {ann.replies?.map((r) => (
                    <div key={r.id} className="fap-message fap-message-reply">
                      <Avatar name={r.authorName} role={r.authorRole} size={22} />
                      <div className="fap-message-body">
                        <div className="fap-message-meta">
                          <span className="fap-message-author">{r.authorName}</span>
                          <span className="fap-message-role"
                            style={{ background: (ROLE_COLORS[r.authorRole] || 'var(--uwc-navy)') + '18', color: ROLE_COLORS[r.authorRole] || 'var(--uwc-navy)' }}>
                            {ROLE_LABELS[r.authorRole] || r.authorRole}
                          </span>
                          <span className="fap-message-time">{timeSince(r.createdAt)}</span>
                        </div>
                        <div className="fap-message-text">{r.text}</div>
                      </div>
                    </div>
                  ))}

                  {/* Reply input — shown if thread is open */}
                  {!ann.resolved && (
                    <div className="fap-reply-input">
                      <Avatar name={currentUser?.name} role={currentUser?.role} size={22} />
                      <input
                        className="fap-reply-text"
                        placeholder="Reply…"
                        value={replyTexts[ann.id] || ''}
                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [ann.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(ann.id); }
                        }}
                      />
                      <button
                        className="fap-reply-send"
                        onClick={() => handleReply(ann.id)}
                        disabled={!replyTexts[ann.id]?.trim() || submitting === ann.id}
                      >
                        <HiOutlinePaperAirplane />
                      </button>
                    </div>
                  )}

                  {/* Resolve / Reopen */}
                  {canResolve && (
                    <div className="fap-thread-actions">
                      {!ann.resolved ? (
                        <button className="fap-action-btn fap-action-resolve" onClick={() => onResolve?.(ann.id)}>
                          <HiOutlineCheckCircle /> Mark resolved
                        </button>
                      ) : (
                        <button className="fap-action-btn fap-action-reopen" onClick={() => onReopen?.(ann.id)}>
                          <HiOutlineArrowUturnLeft /> Reopen
                        </button>
                      )}
                      {ann.resolved && ann.resolvedBy && (
                        <span className="fap-resolved-note">
                          <HiOutlineLockClosed /> Resolved
                        </span>
                      )}
                    </div>
                  )}

                  {/* Collapse button at bottom */}
                  {long && (
                    <button className="fap-collapse-btn" onClick={(e) => { e.stopPropagation(); toggleExpanded(ann.id); }}>
                      Show less
                    </button>
                  )}
                </>
              )}
            </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
