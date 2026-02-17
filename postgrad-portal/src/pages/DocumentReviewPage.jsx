// ============================================
// Document Review Page – Version Control System
// View documents, comment, provide feedback,
// and manage submission versions.
// ============================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardBody, StatusBadge, Modal, Avatar, EmptyState } from '../components/common';
import { STATUS_CONFIG, REQUEST_TYPE_LABELS, ROLE_LABELS, THESIS_ANNOTATION_REQUEST_TYPES } from '../utils/constants';
import { formatDate, formatRelativeTime } from '../utils/helpers';
import {
  subscribeToVersions, createVersion, addComment,
  addFeedback, updateVersionStatus, getNextVersionNumber,
} from '../firebase/documentVersions';
import { sendEmail } from '../services/emailService';
import {
  HiOutlineDocumentText, HiOutlineChatBubbleLeftRight,
  HiOutlineArrowUturnLeft, HiOutlineCheckCircle,
  HiOutlinePaperAirplane, HiOutlinePaperClip,
  HiOutlineClock, HiOutlineArrowPath,
  HiOutlineChevronLeft, HiOutlineArrowUpTray,
  HiOutlineEye, HiOutlineArrowDown,
  HiOutlineExclamationTriangle, HiOutlinePlusCircle,
  HiOutlineClipboardDocumentList, HiOutlineStar,
  HiOutlineXMark,
  HiOutlineDocumentArrowDown,
  HiOutlineTableCells,
  HiOutlinePhoto,
} from 'react-icons/hi2';
import { fetchAnnotationsForVersion } from '../firebase/annotations';
import AnnotatedDocViewer from '../components/AnnotatedDocViewer';
import './DocumentReviewPage.css';

/* ── Version status config ── */
const VERSION_STATUS = {
  submitted: { label: 'Submitted', color: 'var(--status-info)', bg: 'var(--status-info-bg)', icon: <HiOutlinePaperAirplane /> },
  under_review: { label: 'Under Review', color: 'var(--status-purple)', bg: 'var(--status-purple-bg)', icon: <HiOutlineEye /> },
  changes_requested: { label: 'Changes Requested', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)', icon: <HiOutlineArrowUturnLeft /> },
  approved: { label: 'Approved', color: 'var(--status-success)', bg: 'var(--status-success-bg)', icon: <HiOutlineCheckCircle /> },
  superseded: { label: 'Superseded', color: 'var(--text-tertiary)', bg: 'var(--bg-muted)', icon: <HiOutlineClock /> },
};

const FEEDBACK_CRITERIA = [
  { key: 'quality', label: 'Research Quality' },
  { key: 'writing', label: 'Academic Writing' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'completeness', label: 'Completeness' },
  { key: 'formatting', label: 'Formatting & Style' },
];

export default function DocumentReviewPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mockHDRequests, getUserById, addNotification } = useData();

  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentDocFilter, setCommentDocFilter] = useState('all');
  const [replyTo, setReplyTo] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocViewer, setShowDocViewer] = useState(null);
  const [toast, setToast] = useState(null);
  const [annotationCounts, setAnnotationCounts] = useState({});
  const commentInputRef = useRef(null);

  // Find the request
  const request = useMemo(
    () => mockHDRequests.find(r => r.id === requestId),
    [mockHDRequests, requestId]
  );

  // Subscribe to versions
  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    setLoadError(null);
    const unsub = subscribeToVersions(
      requestId,
      (v) => {
        setVersions(v);
        setLoading(false);
        // Default to latest version
        if (v.length > 0 && !activeVersionId) {
          setActiveVersionId(v[v.length - 1].id);
        }
      },
      (error) => {
        console.error('Version subscription error:', error);
        setLoadError(error.message || 'Failed to load versions');
        setLoading(false);
      }
    );
    return unsub;
  }, [requestId]);

  const activeVersion = useMemo(
    () => versions.find(v => v.id === activeVersionId),
    [versions, activeVersionId]
  );

  const annotationsEnabled = useMemo(
    () => THESIS_ANNOTATION_REQUEST_TYPES.includes(request?.type),
    [request?.type]
  );

  // Fetch annotation counts per document for the active version
  useEffect(() => {
    if (!activeVersion?.id || !annotationsEnabled) {
      setAnnotationCounts({});
      return;
    }
    let cancelled = false;
    fetchAnnotationsForVersion(activeVersion.id)
      .then(annotations => {
        if (cancelled) return;
        const counts = {};
        annotations.forEach(a => {
          counts[a.documentName] = (counts[a.documentName] || 0) + 1;
        });
        setAnnotationCounts(counts);
      })
      .catch(err => console.error('Failed to fetch annotation counts:', err));
    return () => { cancelled = true; };
  }, [activeVersion?.id, annotationsEnabled]);

  const userRole = user?.role;
  const isStudent = userRole === 'student';
  const isSupervisor = userRole === 'supervisor';
  const isCoordinator = userRole === 'coordinator';
  const isAdmin = userRole === 'admin';
  const canComment = true; // All authenticated users can comment
  const canFeedback = isSupervisor || isCoordinator;
  const canUploadNewVersion = isStudent && activeVersion?.status === 'changes_requested';
  const canRequestChanges = isSupervisor || isCoordinator;
  const canApproveVersion = isSupervisor || isCoordinator;

  // Toast helper
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Add comment ── */
  const handleAddComment = async () => {
    if (!commentText.trim() || !activeVersion) return;
    try {
      await addComment(activeVersion.id, {
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        text: commentText.trim(),
        documentName: commentDocFilter !== 'all' ? commentDocFilter : null,
        parentCommentId: replyTo?.id || null,
      });

      // Notify relevant parties about the comment
      const notifyTargets = [];
      if (!isStudent && request?.studentId) {
        notifyTargets.push(request.studentId);
      }
      if (!isSupervisor && request?.supervisorId) {
        notifyTargets.push(request.supervisorId);
      }
      notifyTargets.forEach(targetId => {
        addNotification(targetId, 'New Comment', `${user.name} commented on review for "${request.title}": "${commentText.trim().slice(0, 80)}…"`, 'info', `/requests/${requestId}/review`);
      });
      // Send email to student if commenter is NOT the student
      if (!isStudent && request?.studentId) {
        const student = getUserById(request.studentId);
        if (student?.email) {
          sendEmail({
            toEmail: student.email,
            toName: student.name || request.studentName,
            subject: `New Comment on "${request.title}"`,
            message: `${user.name} (${user.role}) commented on your submission "${request.title}":\n\n"${commentText.trim().slice(0, 200)}"\n\nPlease log in to the PostGrad Portal to view the comment and respond.`,
            actionUrl: `${window.location.origin}/requests/${requestId}/review`,
            actionText: 'View Comment',
          }).catch(console.error);
        }
      }

      setCommentText('');
      setReplyTo(null);
      showToast('Comment added');
    } catch (err) {
      console.error('Add comment error:', err);
      showToast('Failed to add comment');
    }
  };

  /* ── Request changes ── */
  const handleRequestChanges = async () => {
    if (!activeVersion) return;
    try {
      await updateVersionStatus(activeVersion.id, 'changes_requested');

      // Notify student
      if (request?.studentId) {
        addNotification(request.studentId, 'Changes Requested', `${user.name} has requested changes on "${request.title}". Please review the feedback and submit a revised version.`, 'warning', `/requests/${requestId}/review`);
        const student = getUserById(request.studentId);
        if (student?.email) {
          sendEmail({
            toEmail: student.email,
            toName: student.name || request.studentName,
            subject: `Changes Requested: "${request.title}"`,
            message: `${user.name} (${user.role}) has requested changes on your submission "${request.title}".\n\nPlease log in to the PostGrad Portal to review the feedback and submit a revised version.`,
            actionUrl: `${window.location.origin}/requests/${requestId}/review`,
            actionText: 'View Feedback',
          }).catch(console.error);
        }
      }

      showToast('Changes requested - student will be notified');
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Approve version ── */
  const handleApproveVersion = async () => {
    if (!activeVersion) return;
    try {
      await updateVersionStatus(activeVersion.id, 'approved');

      // Notify student
      if (request?.studentId) {
        addNotification(request.studentId, 'Version Approved', `${user.name} has approved your submission "${request.title}". Congratulations!`, 'success', `/requests/${requestId}/review`);
        const student = getUserById(request.studentId);
        if (student?.email) {
          sendEmail({
            toEmail: student.email,
            toName: student.name || request.studentName,
            subject: `Submission Approved: "${request.title}"`,
            message: `Great news! ${user.name} (${user.role}) has approved your submission "${request.title}".\n\nPlease log in to the PostGrad Portal for more details.`,
            actionUrl: `${window.location.origin}/requests/${requestId}/review`,
            actionText: 'View Approval',
          }).catch(console.error);
        }
      }
      // Notify coordinator if supervisor approved
      if (isSupervisor && request?.coordinatorId) {
        addNotification(request.coordinatorId, 'Version Approved by Supervisor', `${user.name} approved "${request.title}" for ${request.studentName}.`, 'info', `/requests/${requestId}/review`);
      }

      showToast('Version approved');
    } catch (err) {
      console.error(err);
    }
  };

  /* ── Mark under review ── */
  const handleStartReview = async () => {
    if (!activeVersion || activeVersion.status !== 'submitted') return;
    try {
      await updateVersionStatus(activeVersion.id, 'under_review');

      // Notify student that review has started
      if (request?.studentId) {
        addNotification(request.studentId, 'Review Started', `${user.name} has started reviewing your submission "${request.title}".`, 'info', `/requests/${requestId}/review`);
        const student = getUserById(request.studentId);
        if (student?.email) {
          sendEmail({
            toEmail: student.email,
            toName: student.name || request.studentName,
            subject: `Review Started: "${request.title}"`,
            message: `${user.name} (${user.role}) has started reviewing your submission "${request.title}".\n\nYou will be notified once feedback is available.`,
            actionUrl: `${window.location.origin}/requests/${requestId}/review`,
            actionText: 'View Status',
          }).catch(console.error);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered comments for active version
  const filteredComments = useMemo(() => {
    if (!activeVersion?.comments) return [];
    let comments = [...activeVersion.comments];
    if (commentDocFilter !== 'all') {
      comments = comments.filter(c => c.documentName === commentDocFilter || !c.documentName);
    }
    return comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [activeVersion, commentDocFilter]);

  // All documents across this version
  const versionDocuments = activeVersion?.documents || [];

  if (!request) {
    return (
      <div className="docreview-page">
        <EmptyState icon={<HiOutlineDocumentText />} title="Request Not Found" description="This request does not exist or you don't have access." />
      </div>
    );
  }

  return (
    <div className="docreview-page">
      {/* Toast */}
      {toast && <div className="docreview-toast">{toast}</div>}

      {/* ── Header ── */}
      <div className="docreview-header">
        <div className="docreview-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/requests')}>
            <HiOutlineChevronLeft /> Back to Requests
          </button>
          <div className="docreview-header-info">
            <h1 className="docreview-title">{request.title}</h1>
            <div className="docreview-meta">
              <StatusBadge status={request.status} />
              <span className="docreview-meta-item">{REQUEST_TYPE_LABELS[request.type] || request.type}</span>
              <span className="docreview-meta-item">by {request.studentName}</span>
              <span className="docreview-meta-item">{versions.length} version{versions.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <div className="docreview-header-actions">
          {(isSupervisor || isCoordinator) && activeVersion?.status === 'submitted' && (
            <button className="btn btn-secondary btn-sm" onClick={handleStartReview}>
              <HiOutlineEye /> Start Review
            </button>
          )}
          {canRequestChanges && activeVersion && ['submitted', 'under_review'].includes(activeVersion.status) && (
            <button className="btn btn-warning btn-sm" onClick={handleRequestChanges}>
              <HiOutlineArrowUturnLeft /> Request Changes
            </button>
          )}
          {canApproveVersion && activeVersion && ['submitted', 'under_review'].includes(activeVersion.status) && (
            <button className="btn btn-success btn-sm" onClick={handleApproveVersion}>
              <HiOutlineCheckCircle /> Approve
            </button>
          )}
          {canFeedback && activeVersion && activeVersion.status !== 'superseded' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowFeedbackModal(true)}>
              <HiOutlineStar /> Add Feedback
            </button>
          )}
          {isStudent && activeVersion?.status === 'changes_requested' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowUploadModal(true)}>
              <HiOutlineArrowUpTray /> Submit New Version
            </button>
          )}
        </div>
      </div>

      {/* ── Main Grid: Timeline + Content ── */}
      <div className="docreview-grid">
        {/* Left: Version Timeline */}
        <div className="docreview-sidebar">
          <Card>
            <CardHeader title="Versions" icon={<HiOutlineClipboardDocumentList />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)" />
            <CardBody flush>
              {loading ? (
                <div className="docreview-skeleton-sidebar">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-version-item">
                      <div className="skeleton-dot" />
                      <div className="skeleton-lines">
                        <div className="skeleton-line w60" />
                        <div className="skeleton-line w40" />
                        <div className="skeleton-line w80" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : versions.length === 0 ? (
                <div className="docreview-empty-versions">
                  <HiOutlineDocumentText style={{ fontSize: 32, color: 'var(--text-tertiary)' }} />
                  <p>No versions yet</p>
                  {isStudent && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowUploadModal(true)}>
                      <HiOutlinePlusCircle /> Create First Version
                    </button>
                  )}
                </div>
              ) : (
                <div className="version-timeline">
                  {versions.map((v, idx) => {
                    const statusCfg = VERSION_STATUS[v.status] || VERSION_STATUS.submitted;
                    const isActive = v.id === activeVersionId;
                    const isLatest = idx === versions.length - 1;
                    return (
                      <div
                        key={v.id}
                        className={`version-timeline-item ${isActive ? 'active' : ''} ${v.status}`}
                        onClick={() => setActiveVersionId(v.id)}
                      >
                        <div className="version-timeline-dot" style={{ background: statusCfg.color }} />
                        {idx < versions.length - 1 && <div className="version-timeline-line" />}
                        <div className="version-timeline-content">
                          <div className="version-timeline-header">
                            <span className="version-number">v{v.version}</span>
                            {isLatest && <span className="version-latest-badge">Latest</span>}
                          </div>
                          <div className="version-timeline-status" style={{ color: statusCfg.color }}>
                            {statusCfg.icon} {statusCfg.label}
                          </div>
                          <div className="version-timeline-meta">
                            {v.submitterName} &middot; {formatRelativeTime(v.submittedAt)}
                          </div>
                          <div className="version-timeline-stats">
                            <span>{v.documents?.length || 0} doc{(v.documents?.length || 0) !== 1 ? 's' : ''}</span>
                            <span>{v.comments?.length || 0} comment{(v.comments?.length || 0) !== 1 ? 's' : ''}</span>
                            <span>{v.feedback?.length || 0} feedback</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right: Active version content */}
        <div className="docreview-content">
          {activeVersion ? (
            <>
              {/* Version Header */}
              <div className="version-header-bar">
                <div>
                  <h2 className="version-title">Version {activeVersion.version}</h2>
                  <div className="version-subtitle">
                    Submitted by {activeVersion.submitterName} on {formatDate(activeVersion.submittedAt)}
                    {activeVersion.changeNotes && (
                      <span className="version-change-notes"> &mdash; {activeVersion.changeNotes}</span>
                    )}
                  </div>
                </div>
                <VersionStatusBadge status={activeVersion.status} />
              </div>

              {/* Documents */}
              <Card className="docreview-section">
                <CardHeader title={`Documents (${versionDocuments.length})`} icon={<HiOutlinePaperClip />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)" />
                <CardBody>
                  {versionDocuments.length === 0 ? (
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No documents in this version.</p>
                  ) : (
                    <div className="docreview-documents-grid">
                      {versionDocuments.map((doc, i) => (
                        <DocumentCard
                          key={i}
                          doc={doc}
                          canAnnotate={annotationsEnabled}
                          onView={() => setShowDocViewer(doc)}
                          commentCount={(activeVersion.comments || []).filter(c => c.documentName === doc.name).length}
                          annotationCount={annotationCounts[doc.name] || 0}
                          onFilterComments={() => {
                            setCommentDocFilter(doc.name);
                            commentInputRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Feedback Section */}
              {(activeVersion.feedback?.length > 0 || canFeedback) && (
                <Card className="docreview-section">
                  <CardHeader title="Feedback" icon={<HiOutlineStar />} iconBg="var(--status-warning-bg)" iconColor="var(--status-warning)" />
                  <CardBody>
                    {activeVersion.feedback?.length > 0 ? (
                      <div className="feedback-list">
                        {activeVersion.feedback.map((fb) => (
                          <FeedbackEntry key={fb.id} feedback={fb} />
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No feedback yet for this version.</p>
                    )}
                  </CardBody>
                </Card>
              )}

              {/* Comments Section */}
              <Card className="docreview-section" id="comments-section">
                <CardHeader
                  title={`Comments (${filteredComments.length})`}
                  icon={<HiOutlineChatBubbleLeftRight />}
                  iconBg="var(--status-purple-bg)"
                  iconColor="var(--status-purple)"
                  action={
                    versionDocuments.length > 0 && (
                      <select
                        className="comment-filter-select"
                        value={commentDocFilter}
                        onChange={(e) => setCommentDocFilter(e.target.value)}
                      >
                        <option value="all">All Comments</option>
                        {versionDocuments.map((d, i) => (
                          <option key={i} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    )
                  }
                />
                <CardBody>
                  {/* Comment thread */}
                  <div className="comment-thread">
                    {filteredComments.length === 0 ? (
                      <p className="comment-empty">No comments yet. Be the first to provide feedback.</p>
                    ) : (
                      filteredComments.map((comment) => (
                        <CommentEntry
                          key={comment.id}
                          comment={comment}
                          onReply={() => {
                            setReplyTo(comment);
                            commentInputRef.current?.focus();
                          }}
                          currentUserId={user.id}
                        />
                      ))
                    )}
                  </div>

                  {/* Comment input */}
                  {canComment && activeVersion.status !== 'superseded' && (
                    <div className="comment-input-area" ref={commentInputRef}>
                      {replyTo && (
                        <div className="comment-reply-indicator">
                          Replying to <strong>{replyTo.authorName}</strong>
                          <button className="comment-reply-cancel" onClick={() => setReplyTo(null)}>
                            <HiOutlineXMark />
                          </button>
                        </div>
                      )}
                      <div className="comment-input-row">
                        <Avatar name={user.name} size="sm" />
                        <textarea
                          className="comment-textarea"
                          placeholder={replyTo ? `Reply to ${replyTo.authorName}...` : 'Write a comment...'}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment();
                          }}
                        />
                        <button
                          className="btn btn-primary btn-sm comment-send-btn"
                          disabled={!commentText.trim()}
                          onClick={handleAddComment}
                          title="Send (Ctrl+Enter)"
                        >
                          <HiOutlinePaperAirplane />
                        </button>
                      </div>
                      <div className="comment-input-hint">Press Ctrl+Enter to send</div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </>
          ) : loading ? (
            <div className="docreview-skeleton-content">
              {/* Skeleton header */}
              <div className="skeleton-header-bar">
                <div className="skeleton-lines" style={{ flex: 1 }}>
                  <div className="skeleton-line w60" style={{ height: 20 }} />
                  <div className="skeleton-line w40" />
                </div>
                <div className="skeleton-badge" />
              </div>
              {/* Skeleton documents */}
              <Card className="docreview-section">
                <CardHeader title="Documents" icon={<HiOutlinePaperClip />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)" />
                <CardBody>
                  <div className="docreview-documents-grid">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="doc-card skeleton-doc-card">
                        <div className="skeleton-doc-icon" />
                        <div className="skeleton-lines" style={{ flex: 1 }}>
                          <div className="skeleton-line w80" />
                          <div className="skeleton-line w40" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
              {/* Skeleton comments */}
              <Card className="docreview-section">
                <CardHeader title="Comments" icon={<HiOutlineChatBubbleLeftRight />} iconBg="var(--status-purple-bg)" iconColor="var(--status-purple)" />
                <CardBody>
                  {[1, 2].map(i => (
                    <div key={i} className="skeleton-comment">
                      <div className="skeleton-avatar" />
                      <div className="skeleton-lines" style={{ flex: 1 }}>
                        <div className="skeleton-line w40" />
                        <div className="skeleton-line w100" />
                        <div className="skeleton-line w60" />
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          ) : loadError ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon={<HiOutlineExclamationTriangle />}
                  title="Failed to Load Versions"
                  description={`Something went wrong: ${loadError}`}
                  action={
                    <button className="btn btn-primary" onClick={() => { setLoading(true); setLoadError(null); }}>
                      <HiOutlineArrowPath /> Retry
                    </button>
                  }
                />
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <EmptyState
                  icon={<HiOutlineDocumentText />}
                  title="No Versions Yet"
                  description={isStudent ? 'Upload your first document submission to get started.' : 'The student has not submitted any versions yet.'}
                  action={isStudent ? (
                    <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                      <HiOutlineArrowUpTray /> Upload First Version
                    </button>
                  ) : null}
                />
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* ── Feedback Modal ── */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        versionId={activeVersion?.id}
        user={user}
        onSubmitted={() => {
          showToast('Feedback submitted');
          // Notify student about new feedback
          if (request?.studentId) {
            addNotification(request.studentId, 'New Feedback Received', `${user.name} submitted feedback on "${request.title}". Please review the detailed ratings and recommendations.`, 'info', `/requests/${requestId}/review`);
            const student = getUserById(request.studentId);
            if (student?.email) {
              sendEmail({
                toEmail: student.email,
                toName: student.name || request.studentName,
                subject: `New Feedback: "${request.title}"`,
                message: `${user.name} (${user.role}) has submitted formal feedback on your submission "${request.title}".\n\nPlease log in to the PostGrad Portal to review the detailed ratings and recommendations.`,
                actionUrl: `${window.location.origin}/requests/${requestId}/review`,
                actionText: 'View Feedback',
              }).catch(console.error);
            }
          }
        }}
      />

      {/* ── Upload New Version Modal ── */}
      <UploadVersionModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        requestId={requestId}
        request={request}
        user={user}
        currentVersions={versions}
        onCreated={(v) => {
          setActiveVersionId(v.id);
          showToast(`Version ${v.version} created`);
        }}
      />

      {/* ── Annotated Document Viewer (thesis-only) ── */}
      {showDocViewer && annotationsEnabled && (
        <AnnotatedDocViewer
          doc={showDocViewer}
          versionId={activeVersion?.id}
          requestId={requestId}
          user={user}
          onClose={() => setShowDocViewer(null)}
        />
      )}

    </div>
  );
}
/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

/* ── Version Status Badge ── */
function VersionStatusBadge({ status }) {
  const cfg = VERSION_STATUS[status] || VERSION_STATUS.submitted;
  return (
    <span className="version-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

/* ── Document Card ── */
function DocumentCard({ doc, canAnnotate, onView, commentCount, annotationCount, onFilterComments }) {
  const ext = doc.name?.split('.').pop()?.toLowerCase() || '';
  const iconMap = {
    pdf: { icon: <HiOutlineDocumentText />, color: '#e74c3c' },
    docx: { icon: <HiOutlineDocumentArrowDown />, color: '#2980b9' },
    doc: { icon: <HiOutlineDocumentArrowDown />, color: '#2980b9' },
    xlsx: { icon: <HiOutlineTableCells />, color: '#27ae60' },
    xls: { icon: <HiOutlineTableCells />, color: '#27ae60' },
    pptx: { icon: <HiOutlineClipboardDocumentList />, color: '#e67e22' },
    jpg: { icon: <HiOutlinePhoto />, color: '#8e44ad' },
    jpeg: { icon: <HiOutlinePhoto />, color: '#8e44ad' },
    png: { icon: <HiOutlinePhoto />, color: '#8e44ad' },
  };
  const { icon, color } = iconMap[ext] || { icon: <HiOutlinePaperClip />, color: '#7f8c8d' };

  return (
    <div className="doc-card">
      <div className="doc-card-icon" style={{ color }}>{icon}</div>
      <div className="doc-card-info">
        <div className="doc-card-name">{doc.name}</div>
        <div className="doc-card-meta">{doc.size} {doc.type && `- ${ext.toUpperCase()}`}</div>
      </div>
      <div className="doc-card-actions">
        {annotationCount > 0 && (
          <button className="doc-card-badge doc-card-badge--annotation" onClick={onView} title={`${annotationCount} annotation(s)`}>
            <HiOutlineEye /> {annotationCount}
          </button>
        )}
        {commentCount > 0 && (
          <button className="doc-card-badge" onClick={onFilterComments} title={`${commentCount} comment(s)`}>
            <HiOutlineChatBubbleLeftRight /> {commentCount}
          </button>
        )}
        {doc.url && (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs" title="Download">
            <HiOutlineArrowDown />
          </a>
        )}
        {canAnnotate && annotationCount === 0 && (
          <button className="btn btn-ghost btn-xs" onClick={onView} title="Open Annotated Viewer">
            <HiOutlineEye />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Comment Entry ── */
function CommentEntry({ comment, onReply, currentUserId }) {
  const isOwn = comment.authorId === currentUserId;
  const roleStyles = {
    student: { color: 'var(--status-info)', bg: 'var(--status-info-bg)', avatarBg: '#3b82f6' },
    supervisor: { color: 'var(--status-purple)', bg: 'var(--status-purple-bg)', avatarBg: '#8b5cf6' },
    coordinator: { color: 'var(--status-orange)', bg: 'var(--status-orange-bg)', avatarBg: '#f59e0b' },
    admin: { color: 'var(--status-danger)', bg: 'var(--status-danger-bg)', avatarBg: '#ef4444' },
  };
  const style = roleStyles[comment.authorRole] || roleStyles.student;

  return (
    <div className={`comment-entry ${isOwn ? 'own' : ''} ${comment.parentCommentId ? 'reply' : ''}`}>
      <Avatar name={comment.authorName} size="sm" bg={style.avatarBg} />
      <div className="comment-body">
        <div className="comment-header">
          <span className="comment-author">{comment.authorName}</span>
          <span className="comment-role" style={{ background: style.bg, color: style.color }}>
            {ROLE_LABELS[comment.authorRole] || comment.authorRole}
          </span>
          {comment.documentName && (
            <span className="comment-doc-tag">
              <HiOutlinePaperClip /> {comment.documentName}
            </span>
          )}
          <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <div className="comment-text">{comment.text}</div>
        <button className="comment-reply-btn" onClick={onReply}>Reply</button>
      </div>
    </div>
  );
}

/* ── Feedback Entry ── */
function FeedbackEntry({ feedback }) {
  const recCfg = {
    approve: { label: 'Approved', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
    request_changes: { label: 'Changes Requested', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
    refer_back: { label: 'Referred Back', color: 'var(--status-danger)', bg: 'var(--status-danger-bg)' },
  }[feedback.recommendation] || { label: feedback.recommendation, color: 'var(--text-secondary)', bg: 'var(--bg-muted)' };

  return (
    <div className="feedback-entry">
      <div className="feedback-entry-header">
        <Avatar name={feedback.authorName} size="sm" />
        <div>
          <div className="feedback-author">{feedback.authorName}</div>
          <div className="feedback-role-time">
            <span style={{ color: 'var(--status-purple)' }}>{ROLE_LABELS[feedback.authorRole]}</span>
            <span> &middot; {formatRelativeTime(feedback.createdAt)}</span>
          </div>
        </div>
        <span className="feedback-recommendation" style={{ color: recCfg.color, background: recCfg.bg }}>
          {recCfg.label}
        </span>
      </div>
      {feedback.criteria?.length > 0 && (
        <div className="feedback-criteria">
          {feedback.criteria.map((c, i) => (
            <div key={i} className="feedback-criterion">
              <span className="feedback-criterion-label">{c.label}</span>
              <span className="feedback-criterion-rating">{renderStars(c.rating)}</span>
            </div>
          ))}
        </div>
      )}
      {feedback.text && <div className="feedback-text">{feedback.text}</div>}
    </div>
  );
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>★</span>
  ));
}

/* ── Feedback Modal ── */
function FeedbackModal({ isOpen, onClose, versionId, user, onSubmitted }) {
  const [recommendation, setRecommendation] = useState('');
  const [text, setText] = useState('');
  const [criteria, setCriteria] = useState(FEEDBACK_CRITERIA.map(c => ({ ...c, rating: 0 })));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!recommendation || !text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addFeedback(versionId, {
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        recommendation,
        text: text.trim(),
        criteria: criteria.filter(c => c.rating > 0),
      });
      setRecommendation('');
      setText('');
      setCriteria(FEEDBACK_CRITERIA.map(c => ({ ...c, rating: 0 })));
      onClose();
      onSubmitted?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Feedback"
      large
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!recommendation || !text.trim() || submitting} onClick={handleSubmit}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </>
      }
    >
      <div className="feedback-form">
        <div className="form-group">
          <label className="form-label">Recommendation <span style={{ color: 'red' }}>*</span></label>
          <div className="feedback-rec-options">
            {[
              { value: 'approve', label: 'Approve', icon: <HiOutlineCheckCircle />, color: 'var(--status-success)' },
              { value: 'request_changes', label: 'Request Changes', icon: <HiOutlineArrowUturnLeft />, color: 'var(--status-warning)' },
              { value: 'refer_back', label: 'Refer Back', icon: <HiOutlineExclamationTriangle />, color: 'var(--status-danger)' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`feedback-rec-btn ${recommendation === opt.value ? 'selected' : ''}`}
                style={recommendation === opt.value ? { borderColor: opt.color, color: opt.color } : {}}
                onClick={() => setRecommendation(opt.value)}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Assessment Criteria (optional)</label>
          <div className="feedback-criteria-form">
            {criteria.map((c, i) => (
              <div key={c.key} className="feedback-criterion-row">
                <span>{c.label}</span>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      className={`star-btn ${star <= c.rating ? 'filled' : ''}`}
                      onClick={() => {
                        const updated = [...criteria];
                        updated[i] = { ...c, rating: star === c.rating ? 0 : star };
                        setCriteria(updated);
                      }}
                    >★</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Detailed Feedback <span style={{ color: 'red' }}>*</span></label>
          <textarea
            className="form-textarea"
            rows={5}
            placeholder="Provide detailed comments on the submission, areas for improvement, and specific changes required..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}

/* ── Upload New Version Modal ── */
function UploadVersionModal({ isOpen, onClose, requestId, request, user, currentVersions, onCreated }) {
  const [changeNotes, setChangeNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Reuse the request's existing documents for this POC (students would upload new files)
  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const nextVersion = currentVersions.length > 0
        ? Math.max(...currentVersions.map(v => v.version)) + 1
        : 1;

      // Mark previous latest as superseded
      if (currentVersions.length > 0) {
        const latest = currentVersions[currentVersions.length - 1];
        if (latest.status !== 'approved') {
          await updateVersionStatus(latest.id, 'superseded');
        }
      }

      const version = await createVersion({
        requestId,
        version: nextVersion,
        documents: request.documents || [],
        submittedBy: user.id,
        submitterName: user.name,
        submitterRole: user.role,
        changeNotes: changeNotes.trim(),
      });

      setChangeNotes('');
      onClose();
      onCreated?.(version);
    } catch (err) {
      console.error('Create version error:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentVersions.length === 0 ? 'Submit First Version' : 'Submit New Version'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={creating} onClick={handleCreate}>
            <HiOutlineArrowUpTray /> {creating ? 'Creating...' : currentVersions.length === 0 ? 'Submit Version 1' : `Submit Version ${(currentVersions.length > 0 ? Math.max(...currentVersions.map(v => v.version)) : 0) + 1}`}
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Documents</label>
        <div className="upload-doc-preview">
          {(request.documents || []).length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No documents attached to this request. Documents from the request will be included automatically.</p>
          ) : (
            <div className="file-list">
              {request.documents.map((doc, i) => (
                <div key={i} className="file-list-item">
                  <HiOutlinePaperClip className="file-list-icon" />
                  <div className="file-list-info">
                    <span className="file-list-name">{doc.name}</span>
                    <span className="file-list-meta">{doc.size}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Change Notes {currentVersions.length > 0 && '(describe what changed)'}</label>
        <textarea
          className="form-textarea"
          rows={3}
          placeholder={currentVersions.length === 0 ? 'Initial submission notes (optional)...' : 'Describe the changes made since the last version...'}
          value={changeNotes}
          onChange={(e) => setChangeNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
}
