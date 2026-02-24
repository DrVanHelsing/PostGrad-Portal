// ============================================
// Submissions Page – All Non-HD-Request Submissions
// Handles thesis chapters, research proposals, literature reviews,
// progress reports, conference papers, and any document requiring
// supervisor feedback with annotations and version control.
// ============================================

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardBody, StatCard, StatusBadge, EmptyState, Modal, Avatar } from '../components/common';
import AnnotatedDocViewer from '../components/AnnotatedDocViewer';
import { getFileUrl } from '../firebase/storage';
import {
  HiOutlineDocumentText,
  HiOutlinePlusCircle,
  HiOutlineEye,
  HiOutlineStar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePaperAirplane,
  HiOutlineArrowUpTray,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocumentList,
  HiOutlineAcademicCap,
  HiOutlineXMark,
  HiOutlineBeaker,
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineNewspaper,
  HiOutlinePresentationChartBar,
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowsUpDown,
} from 'react-icons/hi2';
import './SubmissionsPage.css';

/* ── SUBMISSION TYPES (expanded beyond thesis) ── */
const SUBMISSION_TYPES = {
  draft_chapter: { label: 'Draft Chapter', icon: <HiOutlineDocumentText />, color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  full_thesis: { label: 'Full Thesis / Dissertation', icon: <HiOutlineAcademicCap />, color: 'var(--uwc-wine, #800000)', bg: 'rgba(128,0,0,0.08)' },
  research_proposal: { label: 'Research Proposal', icon: <HiOutlineBeaker />, color: 'var(--status-purple)', bg: 'var(--status-purple-bg)' },
  literature_review: { label: 'Literature Review', icon: <HiOutlineBookOpen />, color: 'var(--status-teal)', bg: 'var(--status-teal-bg)' },
  methodology: { label: 'Methodology Chapter', icon: <HiOutlineChartBar />, color: 'var(--status-indigo)', bg: 'var(--status-indigo-bg)' },
  conference_paper: { label: 'Conference Paper', icon: <HiOutlineNewspaper />, color: 'var(--status-orange)', bg: 'var(--status-orange-bg)' },
  journal_article: { label: 'Journal Article', icon: <HiOutlineNewspaper />, color: 'var(--status-pink)', bg: 'var(--status-pink-bg)' },
  progress_report_doc: { label: 'Progress Report (Document)', icon: <HiOutlinePresentationChartBar />, color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  data_analysis: { label: 'Data Analysis Report', icon: <HiOutlineDocumentMagnifyingGlass />, color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  ethics_application: { label: 'Ethics Application', icon: <HiOutlineShieldCheck />, color: 'var(--status-danger)', bg: 'var(--status-danger-bg)' },
  revision: { label: 'Revision', icon: <HiOutlineDocumentText />, color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  final_submission: { label: 'Final Submission', icon: <HiOutlineCheckCircle />, color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
};

const SUBMISSION_STATUS = {
  draft: { label: 'Draft', color: 'var(--text-tertiary)', bg: 'var(--bg-muted)' },
  submitted: { label: 'Submitted', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  under_review: { label: 'Under Review', color: 'var(--status-purple)', bg: 'var(--status-purple-bg)' },
  feedback_provided: { label: 'Feedback Provided', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  changes_requested: { label: 'Changes Requested', color: 'var(--status-orange)', bg: 'var(--status-orange-bg)' },
  approved: { label: 'Approved', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  rejected: { label: 'Rejected', color: 'var(--status-danger)', bg: 'var(--status-danger-bg)' },
};

const FEEDBACK_CRITERIA = [
  { key: 'research_quality', label: 'Research Quality' },
  { key: 'academic_writing', label: 'Academic Writing' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'completeness', label: 'Completeness' },
  { key: 'formatting', label: 'Formatting' },
];

const FEEDBACK_RECOMMENDATIONS = [
  { value: 'approve', label: 'Approve', color: 'var(--status-success)' },
  { value: 'changes_requested', label: 'Request Changes', color: 'var(--status-warning)' },
  { value: 'reject', label: 'Reject', color: 'var(--status-danger)' },
];

/* ── Helpers ── */
function Stars({ rating }) {
  return (
    <span className="sub-criterion-stars">
      {[1, 2, 3, 4, 5].map(s => (
        <HiOutlineStar key={s} className={rating >= s ? 'filled' : 'empty'} style={rating >= s ? { fill: 'currentColor' } : {}} />
      ))}
    </span>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = d?.toDate ? d.toDate() : new Date(d);
  return dt.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeDocName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function toDocBase(value) {
  return normalizeDocName(value).replace(/\.[a-z0-9]+$/i, '');
}

function isDocumentMatch(annotationName, targetName) {
  if (!targetName) return false;
  if (!annotationName) return false;
  const ann = normalizeDocName(annotationName);
  const tgt = normalizeDocName(targetName);
  if (!ann || !tgt) return false;
  const annBase = toDocBase(annotationName);
  const tgtBase = toDocBase(targetName);
  if (!annBase || !tgtBase) return false;

  return ann === tgt || annBase === tgtBase || ann.includes(tgtBase) || tgt.includes(annBase);
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export default function SubmissionsPage() {
  const { user } = useAuth();
  const {
    thesisSubmissions, getThesisSubmissionsByStudent, getThesisSubmissionsForSupervisor,
    getThesisSubmissionById, createThesisSubmission, updateThesisSubmission,
    addNotification, getStudentProfile,
  } = useData();

  const [view, setView] = useState('list');        // list | detail | new
  const [selectedId, setSelectedId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt'); // updatedAt | createdAt | title
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [showDocViewer, setShowDocViewer] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Submissions based on role ── */
  const mySubmissions = useMemo(() => {
    let all = [];
    if (user?.role === 'student') all = getThesisSubmissionsByStudent(user.id);
    else if (user?.role === 'supervisor') all = getThesisSubmissionsForSupervisor(user.id);
    else all = thesisSubmissions;

    // Apply filters
    return all.filter(s => {
      const matchType = typeFilter === 'all' || s.submissionType === typeFilter;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchSearch = !searchQuery ||
        (s.chapterTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.thesisTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.studentName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchStatus && matchSearch;
    }).sort((a, b) => {
      if (sortBy === 'title') return (a.chapterTitle || a.thesisTitle || '').localeCompare(b.chapterTitle || b.thesisTitle || '');
      const da = a[sortBy]?.toDate?.() || new Date(a[sortBy] || 0);
      const db = b[sortBy]?.toDate?.() || new Date(b[sortBy] || 0);
      return db - da;
    });
  }, [user, thesisSubmissions, getThesisSubmissionsByStudent, getThesisSubmissionsForSupervisor, typeFilter, statusFilter, searchQuery, sortBy]);

  const selected = selectedId ? getThesisSubmissionById(selectedId) : null;

  /* ── Stats ── */
  const stats = useMemo(() => {
    const all = user?.role === 'student' ? getThesisSubmissionsByStudent(user.id) :
      user?.role === 'supervisor' ? getThesisSubmissionsForSupervisor(user.id) : thesisSubmissions;
    const underReview = all.filter(t => ['under_review', 'submitted'].includes(t.status)).length;
    const needsAction = all.filter(t => t.status === 'feedback_provided' || t.status === 'changes_requested').length;
    const approved = all.filter(t => t.status === 'approved').length;
    return { total: all.length, underReview, needsAction, approved };
  }, [user, thesisSubmissions, getThesisSubmissionsByStudent, getThesisSubmissionsForSupervisor]);

  /* ── Open detail ── */
  const openDetail = useCallback((id) => {
    setSelectedId(id);
    setActiveVersionIdx(0);
    setView('detail');
    setCommentText('');
  }, []);

  if (!user) {
    return (
      <div className="page-wrapper">
        <Card>
          <CardBody>
            <EmptyState
              icon={<HiOutlineDocumentText />}
              title="Loading submissions"
              description="Please wait while your profile is loading."
            />
          </CardBody>
        </Card>
      </div>
    );
  }

  /* ── RENDER ── */
  if (view === 'new') return <NewSubmissionView user={user} getStudentProfile={getStudentProfile} createThesisSubmission={createThesisSubmission} addNotification={addNotification} onBack={() => setView('list')} showToast={showToast} toast={toast} />;
  if (view === 'detail' && selected) return <DetailView submission={selected} user={user} updateThesisSubmission={updateThesisSubmission} addNotification={addNotification} activeVersionIdx={activeVersionIdx} setActiveVersionIdx={setActiveVersionIdx} showDocViewer={showDocViewer} setShowDocViewer={setShowDocViewer} commentText={commentText} setCommentText={setCommentText} showFeedbackModal={showFeedbackModal} setShowFeedbackModal={setShowFeedbackModal} showUploadModal={showUploadModal} setShowUploadModal={setShowUploadModal} onBack={() => { setView('list'); setSelectedId(null); }} showToast={showToast} toast={toast} />;

  /* ── LIST VIEW ── */
  const pageTitle = user?.role === 'student' ? 'My Submissions' : user?.role === 'supervisor' ? 'Submissions for Review' : 'All Submissions';
  const pageDesc = user?.role === 'student'
    ? 'Submit and track your research documents, thesis chapters, and academic papers.'
    : user?.role === 'supervisor'
    ? 'Review submissions, provide feedback, and annotate documents.'
    : 'Overview of all student submissions across the system.';

  // Compute active type counts for filter chips
  const allUnfiltered = user?.role === 'student' ? getThesisSubmissionsByStudent(user.id) :
    user?.role === 'supervisor' ? getThesisSubmissionsForSupervisor(user.id) : thesisSubmissions;
  const typeCounts = allUnfiltered.reduce((counts, s) => {
    counts[s.submissionType] = (counts[s.submissionType] || 0) + 1;
    return counts;
  }, {});

  return (
    <div className="page-wrapper">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* ── Page Header ── */}
      <div className="sub-page-header">
        <div className="sub-page-header-text">
          <h1>{pageTitle}</h1>
          <p>{pageDesc}</p>
        </div>
        {user?.role === 'student' && (
          <button className="btn btn-primary" onClick={() => setView('new')}>
            <HiOutlinePlusCircle /> New Submission
          </button>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="sub-stats-grid">
        <StatCard label="Total" value={stats.total} icon={<HiOutlineDocumentText />} color="var(--uwc-blue)" bg="var(--status-info-bg)" />
        <StatCard label="Under Review" value={stats.underReview} icon={<HiOutlineEye />} color="var(--status-purple)" bg="var(--status-purple-bg)" />
        <StatCard label="Needs Action" value={stats.needsAction} icon={<HiOutlineExclamationTriangle />} color="var(--status-warning)" bg="var(--status-warning-bg)" />
        <StatCard label="Approved" value={stats.approved} icon={<HiOutlineCheckCircle />} color="var(--status-success)" bg="var(--status-success-bg)" />
      </div>

      {/* ── Search & Filters Bar ── */}
      <div className="sub-toolbar">
        <div className="sub-toolbar-left">
          <div className="search-container sub-search-container">
            <HiOutlineMagnifyingGlass className="search-icon" />
            <input className="search-input" placeholder="Search submissions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <select className="form-select sub-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            {Object.entries(SUBMISSION_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select className="form-select sub-filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="updatedAt">Recently Updated</option>
            <option value="createdAt">Date Created</option>
            <option value="title">Title (A–Z)</option>
          </select>
        </div>
      </div>

      {/* ── Type Filter Chips ── */}
      <div className="sub-type-filters">
        <button className={`sub-type-chip ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>
          All Types <span className="sub-chip-count">{allUnfiltered.length}</span>
        </button>
        {Object.entries(SUBMISSION_TYPES).filter(([key]) => typeCounts[key] > 0).map(([key, cfg]) => (
          <button key={key} className={`sub-type-chip ${typeFilter === key ? 'active' : ''}`} onClick={() => setTypeFilter(key)}>
            {cfg.icon} {cfg.label} <span className="sub-chip-count">{typeCounts[key]}</span>
          </button>
        ))}
      </div>

      {/* ── Submissions Table ── */}
      {mySubmissions.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<HiOutlineAcademicCap />}
              title="No Submissions Found"
              description={searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : user?.role === 'student'
                ? 'Click "New Submission" to submit a document for review.'
                : 'No submissions to review at this time.'}
            />
          </CardBody>
        </Card>
      ) : (
        <Card className="sub-table-card">
          <CardBody flush>
            <div className="table-wrapper">
              <table className="data-table sub-table">
                <colgroup>
                  {user?.role !== 'student' ? (
                    <>
                      <col style={{ width: '32%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '10%' }} />
                    </>
                  ) : (
                    <>
                      <col style={{ width: '35%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '9%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '14%' }} />
                    </>
                  )}
                </colgroup>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    {user?.role !== 'student' && <th>Student</th>}
                    <th>Status</th>
                    <th className="sub-col-version">Version</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {mySubmissions.map(sub => {
                    const typeCfg = SUBMISSION_TYPES[sub.submissionType] || SUBMISSION_TYPES.draft_chapter;
                    const statusCfg = SUBMISSION_STATUS[sub.status] || SUBMISSION_STATUS.submitted;
                    return (
                      <tr key={sub.id} className="sub-table-row" onClick={() => openDetail(sub.id)}>
                        <td>
                          <div className="sub-table-title-cell">
                            <div className="sub-table-icon" style={{ background: typeCfg.bg, color: typeCfg.color }}>{typeCfg.icon}</div>
                            <div>
                              <div className="sub-table-title">{sub.chapterTitle || sub.thesisTitle}</div>
                              {sub.chapterTitle && <div className="sub-table-subtitle">{sub.thesisTitle}</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="sub-type-badge" style={{ color: typeCfg.color, background: typeCfg.bg }}>{typeCfg.label}</span>
                        </td>
                        {user?.role !== 'student' && <td className="sub-table-meta">{sub.studentName}</td>}
                        <td><StatusBadge status={sub.status} config={statusCfg} /></td>
                        <td className="sub-table-meta sub-col-version">v{sub.currentVersion || 1}</td>
                        <td className="sub-table-meta">{fmtDate(sub.updatedAt)}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); openDetail(sub.id); }}>
                            <HiOutlineEye /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   DETAIL VIEW
   ════════════════════════════════════════════ */
function DetailView({ submission: sub, user, updateThesisSubmission, addNotification, activeVersionIdx, setActiveVersionIdx, showDocViewer, setShowDocViewer, commentText, setCommentText, showFeedbackModal, setShowFeedbackModal, showUploadModal, setShowUploadModal, onBack, showToast, toast }) {
  const typeCfg = SUBMISSION_TYPES[sub.submissionType] || SUBMISSION_TYPES.draft_chapter;
  const statusCfg = SUBMISSION_STATUS[sub.status] || SUBMISSION_STATUS.submitted;
  const versions = toArray(sub?.versions);
  const activeVersion = versions[activeVersionIdx] || null;
  const isSupervisor = user?.role === 'supervisor' && (sub.supervisorId === user.id || sub.coSupervisorId === user.id);
  const isStudent = user?.role === 'student' && sub.studentId === user.id;
  const allComments = useMemo(() => {
    const allC = [];
    versions.forEach(v => { toArray(v?.comments).forEach(c => allC.push({ ...c, versionLabel: `v${v.version}` })); });
    return allC.sort((a, b) => {
      const da = a.date?.toDate?.() || new Date(a.date || 0);
      const db = b.date?.toDate?.() || new Date(b.date || 0);
      return da - db;
    });
  }, [versions]);

  const annotations = useMemo(() => {
    const embedded = toArray(sub?.annotations).filter(a => activeVersion ? a.versionId === activeVersion.id : true);
    // Enrich embedded annotations that lack documentName:
    // If the annotation's version matches the active version, assign the first document's name
    const versionDocs = activeVersion ? toArray(activeVersion.documents) : [];
    return embedded.map(ann => {
      if (ann.documentName || ann.docName || ann.document || ann.fileName) return ann;
      // Embedded annotations without documentName → assign from version's documents
      const firstDoc = versionDocs[0];
      return firstDoc ? { ...ann, documentName: firstDoc.name } : ann;
    });
  }, [sub?.annotations, activeVersion]);

  const annotationCountByDocument = useMemo(() => {
    const map = new Map();
    annotations.forEach((ann) => {
      const docName = ann?.documentName || ann?.docName || ann?.document || ann?.fileName || '';
      const key = toDocBase(docName);
      if (!key) return;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [annotations]);

  const handleOpenDocument = useCallback(async (docItem) => {
    try {
      // Determine which path/url to resolve
      const rawPath = docItem?.path || docItem?.url || '';
      if (!rawPath) {
        showToast('Document path is missing.', 'error');
        return;
      }

      let resolvedUrl = rawPath;

      // Absolute URLs (http, https, blob, data) are used as-is
      if (/^(https?|blob|data):/.test(rawPath)) {
        resolvedUrl = rawPath;
      } else {
        // Relative/local paths go through the storage adapter
        const storagePath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
        resolvedUrl = await getFileUrl(storagePath);
      }

      // Validate that the resolved URL actually returns a PDF, not HTML
      if (resolvedUrl && !resolvedUrl.startsWith('blob:') && !resolvedUrl.startsWith('data:')) {
        try {
          const probe = await fetch(resolvedUrl, { method: 'HEAD' });
          const ct = probe.headers.get('content-type') || '';
          if (ct.includes('text/html')) {
            console.warn('Document URL returned HTML instead of PDF:', resolvedUrl);
            showToast('Document file not found on server.', 'error');
            return;
          }
        } catch { /* network error – let the viewer handle it */ }
      }

      setShowDocViewer({
        doc: { ...docItem, path: rawPath.replace(/^\//, ''), url: resolvedUrl },
        versionId: activeVersion?.id,
      });
    } catch (err) {
      console.error('Document open failed:', err);
      showToast('Unable to load document.', 'error');
    }
  }, [activeVersion?.id, setShowDocViewer, showToast]);

  /* ── Add comment ── */
  const handleAddComment = useCallback(async () => {
    if (!commentText.trim() || !activeVersion) return;
    const newComment = {
      id: `tc-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      text: commentText.trim(),
      date: new Date().toISOString(),
    };
    const updatedVersions = versions.map((v, i) => {
      if (i !== activeVersionIdx) return v;
      return { ...v, comments: [...(v.comments || []), newComment] };
    });
    await updateThesisSubmission(sub.id, { versions: updatedVersions });
    setCommentText('');
    showToast('Comment added.');
  }, [commentText, activeVersion, activeVersionIdx, versions, sub.id, user, updateThesisSubmission, setCommentText, showToast]);

  return (
    <div className="page-wrapper">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* Header */}
      <div className="sub-detail-header">
        <div className="sub-detail-header-left">
          <button className="btn btn-ghost" onClick={onBack}><HiOutlineChevronLeft /> Back</button>
          <div>
            <h1 className="sub-detail-title">{sub.chapterTitle || sub.thesisTitle}</h1>
            <div className="sub-detail-meta">
              <StatusBadge status={sub.status} config={statusCfg} />
              <span className="sub-detail-meta-text">
                <span className="sub-type-badge" style={{ color: typeCfg.color, background: typeCfg.bg }}>{typeCfg.label}</span>
                · v{sub.currentVersion || 1} · Updated {fmtDate(sub.updatedAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="sub-detail-actions">
          {isSupervisor && sub.status !== 'approved' && (
            <button className="btn btn-secondary" onClick={() => setShowFeedbackModal(true)}>
              <HiOutlineStar /> Provide Feedback
            </button>
          )}
          {isStudent && (sub.status === 'changes_requested' || sub.status === 'feedback_provided') && (
            <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
              <HiOutlineArrowUpTray /> Upload New Version
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="sub-detail-layout">
        {/* LEFT: Version Sidebar */}
        <aside className="sub-version-sidebar">
          <Card>
            <CardHeader title="Versions" icon={<HiOutlineClock />} iconBg="var(--bg-muted)" iconColor="var(--text-secondary)" />
            <CardBody>
              <div className="sub-version-list">
                {versions.map((v, idx) => {
                  const vStatus = SUBMISSION_STATUS[v.status] || SUBMISSION_STATUS.submitted;
                  return (
                    <div key={v.id || idx} className={`sub-version-item ${idx === activeVersionIdx ? 'active' : ''}`} onClick={() => setActiveVersionIdx(idx)}>
                      <div className="sub-version-dot" style={{ background: vStatus.color }} />
                      <div className="sub-version-info">
                        <div className="sub-version-label">Version {v.version}</div>
                        <div className="sub-version-date">{fmtDate(v.uploadedAt)}</div>
                        <StatusBadge status={v.status} config={vStatus} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Rating Summary (sidebar) */}
          {sub.rating && Number.isFinite(Number(sub.rating.overall)) && (
            <Card>
              <CardHeader title="Overall Rating" icon={<HiOutlineStar />} iconBg="var(--status-warning-bg)" iconColor="var(--status-warning)" />
              <CardBody>
                <div className="sub-rating-summary">
                  <div className="sub-rating-number">{Number(sub.rating.overall).toFixed(1)}</div>
                  <Stars rating={Math.round(Number(sub.rating.overall))} />
                </div>
                {sub.rating.criteria && (
                  <div className="sub-rating-criteria">
                    {FEEDBACK_CRITERIA.map(c => (
                      <div key={c.key} className="sub-criterion">
                        <span className="sub-criterion-label">{c.label}</span>
                        <Stars rating={sub.rating.criteria[c.key] || 0} />
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </aside>

        {/* RIGHT: Main Content */}
        <div className="sub-detail-main">
          {/* Active Version Details */}
          {activeVersion && (
            <Card>
              <CardHeader title={`Version ${activeVersion.version} Details`} icon={<HiOutlineDocumentText />} iconBg="var(--status-info-bg)" iconColor="var(--status-info)" />
              <CardBody>
                {activeVersion.changeNotes && (
                  <div className="sub-change-notes">
                    <strong>Change Notes:</strong>
                    <p>{activeVersion.changeNotes}</p>
                  </div>
                )}
                <div className="sub-doc-grid">
                  {toArray(activeVersion?.documents).map((doc, di) => (
                    <div key={di} className="sub-doc-card" onClick={() => handleOpenDocument(doc)}>
                      <div className="sub-doc-icon"><HiOutlineDocumentText /></div>
                      <div className="sub-doc-info">
                        <div className="sub-doc-name">{doc.name}</div>
                        <div className="sub-doc-size">{doc.size}</div>
                      </div>
                      {(() => {
                        const base = toDocBase(doc?.name || '');
                        const directCount = annotationCountByDocument.get(base) || 0;
                        const fallbackCount = directCount > 0
                          ? directCount
                          : annotations.filter(a => isDocumentMatch(a?.documentName || a?.docName || a?.document || a?.fileName, doc?.name)).length;
                        return fallbackCount > 0 ? (
                          <span className="sub-doc-annotation-badge" title={`${fallbackCount} annotation${fallbackCount === 1 ? '' : 's'}`}>
                            <HiOutlineClipboardDocumentList /> {fallbackCount}
                          </span>
                        ) : null;
                      })()}
                      <HiOutlineEye style={{ color: 'var(--text-tertiary)', fontSize: 16 }} />
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Feedback */}
          {toArray(activeVersion?.feedback).length > 0 && (
            <Card>
              <CardHeader title="Supervisor Feedback" icon={<HiOutlineStar />} iconBg="var(--status-warning-bg)" iconColor="var(--status-warning)" />
              <CardBody>
                {toArray(activeVersion?.feedback).map((fb) => (
                  <div key={fb.id} className="sub-feedback-card">
                    <div className="sub-feedback-header">
                      <Avatar name={fb.reviewerName} size={28} />
                      <div>
                        <div className="sub-feedback-name">{fb.reviewerName}</div>
                        <div className="sub-feedback-meta">{fb.reviewerRole} · {fmtDate(fb.date)}</div>
                      </div>
                      {fb.recommendation && (
                        <span className="sub-feedback-rec" style={{ color: fb.recommendation === 'approve' ? 'var(--status-success)' : fb.recommendation === 'reject' ? 'var(--status-danger)' : 'var(--status-warning)' }}>
                          {fb.recommendation === 'approve' ? '✓ Approved' : fb.recommendation === 'reject' ? '✗ Rejected' : '↺ Changes Requested'}
                        </span>
                      )}
                    </div>
                    {fb.criteria && (
                      <div className="sub-feedback-criteria">
                        {FEEDBACK_CRITERIA.map(c => (
                          <div key={c.key} className="sub-criterion">
                            <span className="sub-criterion-label">{c.label}</span>
                            <Stars rating={fb.criteria[c.key] || 0} />
                          </div>
                        ))}
                      </div>
                    )}
                    {fb.comments && <p className="sub-feedback-comments">{fb.comments}</p>}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {/* Comments / Discussion */}
          <Card>
            <CardHeader title="Discussion" icon={<HiOutlineChatBubbleLeftRight />} iconBg="var(--bg-muted)" iconColor="var(--text-secondary)" />
            <CardBody>
              {allComments.length === 0 ? (
                <p className="sub-no-comments">No comments yet. Start the discussion below.</p>
              ) : (
                <div className="sub-comments-list">
                  {allComments.map(c => (
                    <div key={c.id} className={`sub-comment ${c.replyTo ? 'reply' : ''}`}>
                      <Avatar name={c.authorName} size={28} />
                      <div className="sub-comment-body">
                        <div className="sub-comment-header">
                          <span className="sub-comment-author">{c.authorName}</span>
                          <span className="sub-comment-role">{c.authorRole}</span>
                          <span className="sub-comment-date">{c.versionLabel} · {fmtDate(c.date)}</span>
                        </div>
                        <div className="sub-comment-text">{c.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="sub-comment-input">
                <input className="form-input" placeholder="Write a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment()} style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={handleAddComment} disabled={!commentText.trim()}>
                  <HiOutlinePaperAirplane /> Send
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Annotated Doc Viewer */}
      {showDocViewer?.doc && (
        <Modal isOpen large onClose={() => setShowDocViewer(null)} title={showDocViewer?.doc?.name || 'Document Viewer'}>
          <AnnotatedDocViewer doc={showDocViewer.doc} versionId={showDocViewer.versionId} requestId={sub?.id} user={user} onClose={() => setShowDocViewer(null)} />
        </Modal>
      )}

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} submission={sub} user={user} activeVersion={activeVersion} updateThesisSubmission={updateThesisSubmission} addNotification={addNotification} showToast={showToast} />

      {/* Upload New Version Modal */}
      <UploadVersionModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} submission={sub} user={user} updateThesisSubmission={updateThesisSubmission} addNotification={addNotification} showToast={showToast} setActiveVersionIdx={setActiveVersionIdx} />
    </div>
  );
}

/* ════════════════════════════════════════════
   NEW SUBMISSION WIZARD
   ════════════════════════════════════════════ */
function NewSubmissionView({ user, getStudentProfile, createThesisSubmission, addNotification, onBack, showToast, toast }) {
  const profile = typeof getStudentProfile === 'function' && user?.id ? getStudentProfile(user.id) : null;
  const [step, setStep] = useState(1);
  const [submissionType, setSubmissionType] = useState('draft_chapter');
  const [thesisTitle, setThesisTitle] = useState(profile?.thesisTitle || '');
  const [chapterTitle, setChapterTitle] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const needsChapterTitle = ['draft_chapter', 'methodology', 'literature_review'].includes(submissionType);
  const canProceedStep2 = thesisTitle.trim() && (!needsChapterTitle || chapterTitle.trim());
  const canSubmit = files.length > 0;

  const handleFileAdd = (fileList) => {
    const arr = Array.from(fileList || []);
    setFiles(prev => [...prev, ...arr]);
  };

  const handleRemoveFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      showToast('User profile is not loaded yet. Please try again.', 'error');
      return;
    }
    if (!profile?.supervisorId) {
      showToast('Please assign a supervisor in Settings before submitting.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const docEntries = files.map(f => ({
        name: f.name,
        size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
        uploadedAt: new Date().toISOString(),
      }));
      const data = {
        studentId: user.id,
        studentName: user.name || user.email || 'Student',
        supervisorId: profile.supervisorId,
        coSupervisorId: profile.coSupervisorId || null,
        coordinatorId: profile.coordinatorId || null,
        thesisTitle: thesisTitle.trim(),
        submissionType,
        chapterTitle: needsChapterTitle ? chapterTitle.trim() : null,
        status: 'submitted',
        currentVersion: 1,
        documents: docEntries,
        versions: [{
          id: `tv-${Date.now()}`,
          version: 1,
          status: 'submitted',
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.id,
          documents: docEntries,
          changeNotes: changeNotes.trim() || 'Initial submission.',
          feedback: [],
          comments: [],
        }],
        annotations: [],
        rating: null,
      };
      await createThesisSubmission(data);
      if (profile.supervisorId) {
        await addNotification(
          profile.supervisorId,
          'New Submission',
          `${user.name || user.email || 'A student'} has submitted "${chapterTitle || thesisTitle}" for review.`,
          'info',
          '/submissions'
        );
      }
      showToast('Submission created successfully!');
      setTimeout(onBack, 800);
    } catch (err) {
      console.error('Submission failed:', err);
      showToast('Failed to create submission.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = [
    { num: 1, label: 'Type' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Upload' },
  ];

  return (
    <div className="page-wrapper">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <div className="sub-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button className="btn btn-ghost" onClick={onBack}><HiOutlineChevronLeft /> Back</button>
          <h1>New Submission</h1>
        </div>
      </div>

      {/* Wizard Steps */}
      <div className="sub-wizard-steps">
        {STEPS.map((s, i) => (
          <span key={s.num} style={{ display: 'contents' }}>
            <span className={`sub-wizard-step ${step === s.num ? 'active' : step > s.num ? 'completed' : ''}`}>
              {step > s.num ? <HiOutlineCheckCircle /> : <span>{s.num}</span>}
              <span>{s.label}</span>
            </span>
            {i < STEPS.length - 1 && <span className="sub-wizard-connector"><HiOutlineChevronRight /></span>}
          </span>
        ))}
      </div>

      <Card>
        <CardBody>
          {/* Step 1: Submission Type */}
          {step === 1 && (
            <div className="sub-wizard-content">
              <h3>What are you submitting?</h3>
              <div className="sub-type-grid">
                {Object.entries(SUBMISSION_TYPES).map(([key, cfg]) => (
                  <div key={key} onClick={() => setSubmissionType(key)} className={`sub-type-option ${submissionType === key ? 'selected' : ''}`}>
                    <div className="sub-type-option-icon" style={{ color: cfg.color }}>{cfg.icon}</div>
                    <div className="sub-type-option-label">{cfg.label}</div>
                  </div>
                ))}
              </div>
              <div className="sub-wizard-nav">
                <span />
                <button className="btn btn-primary" onClick={() => setStep(2)}>Next <HiOutlineChevronRight /></button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="sub-wizard-content" style={{ maxWidth: 600 }}>
              <h3>Submission Details</h3>
              <div className="form-group">
                <label className="form-label">Project / Thesis Title <span style={{ color: 'var(--status-danger)' }}>*</span></label>
                <input className="form-input" value={thesisTitle} onChange={e => setThesisTitle(e.target.value)} placeholder="Enter your full thesis or project title" />
              </div>
              {needsChapterTitle && (
                <div className="form-group">
                  <label className="form-label">Chapter / Section Title <span style={{ color: 'var(--status-danger)' }}>*</span></label>
                  <input className="form-input" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} placeholder="e.g. Chapter 3 – Methodology" />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-input" rows={3} value={changeNotes} onChange={e => setChangeNotes(e.target.value)} placeholder="Any notes for your supervisor..." />
              </div>
              <div className="sub-wizard-nav">
                <button className="btn btn-ghost" onClick={() => setStep(1)}><HiOutlineChevronLeft /> Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)} disabled={!canProceedStep2}>Next <HiOutlineChevronRight /></button>
              </div>
            </div>
          )}

          {/* Step 3: Upload */}
          {step === 3 && (
            <div className="sub-wizard-content">
              <h3>Upload Documents</h3>
              <p className="sub-wizard-hint">Upload your document(s). Accepted formats: PDF, DOCX. You can upload multiple files.</p>
              <label className="btn btn-secondary" style={{ justifySelf: 'start', cursor: 'pointer' }}>
                <HiOutlineArrowUpTray /> Choose Files
                <input type="file" accept=".pdf,.doc,.docx" multiple style={{ display: 'none' }} onChange={e => handleFileAdd(e.target.files)} />
              </label>
              {files.length > 0 && (
                <div className="sub-doc-grid">
                  {files.map((f, i) => (
                    <div key={i} className="sub-doc-card">
                      <div className="sub-doc-icon"><HiOutlineDocumentText /></div>
                      <div className="sub-doc-info">
                        <div className="sub-doc-name">{f.name}</div>
                        <div className="sub-doc-size">{f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveFile(i)} title="Remove"><HiOutlineXMark /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="sub-wizard-nav">
                <button className="btn btn-ghost" onClick={() => setStep(2)}><HiOutlineChevronLeft /> Back</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={!canSubmit || submitting}>
                  <HiOutlinePaperAirplane /> {submitting ? 'Submitting…' : 'Submit for Review'}
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════
   FEEDBACK MODAL (Supervisor)
   ════════════════════════════════════════════ */
function FeedbackModal({ isOpen, onClose, submission, user, activeVersion, updateThesisSubmission, addNotification, showToast }) {
  const [ratings, setRatings] = useState({});
  const [recommendation, setRecommendation] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !activeVersion) return null;

  const handleSubmitFeedback = async () => {
    if (!recommendation) { showToast('Please select a recommendation.', 'error'); return; }
    setSubmitting(true);
    try {
      const fb = {
        id: `fb-${Date.now()}`,
        reviewerId: user.id,
        reviewerName: user.name,
        reviewerRole: user.role,
        recommendation,
        date: new Date().toISOString(),
        criteria: ratings,
        comments: comments.trim(),
      };
      const updatedVersions = toArray(submission?.versions).map(v => {
        if (v.id !== activeVersion.id) return v;
        const newStatus = recommendation === 'approve' ? 'approved' : 'changes_requested';
        return { ...v, feedback: [...(v.feedback || []), fb], status: newStatus };
      });
      const overallStatus = recommendation === 'approve' ? 'approved' : recommendation === 'reject' ? 'rejected' : 'feedback_provided';
      const allCriteria = Object.values(ratings);
      const overall = allCriteria.length > 0 ? allCriteria.reduce((s, v) => s + v, 0) / allCriteria.length : null;
      const ratingObj = overall != null ? { overall, criteria: ratings } : submission.rating;
      await updateThesisSubmission(submission.id, { versions: updatedVersions, status: overallStatus, rating: ratingObj });
      await addNotification(
        submission.studentId,
        recommendation === 'approve' ? 'Submission Approved' : 'Submission Feedback',
        `${user.name} has ${recommendation === 'approve' ? 'approved' : 'provided feedback on'} "${submission.chapterTitle || submission.thesisTitle}".`,
        recommendation === 'approve' ? 'success' : 'info',
        '/submissions'
      );
      showToast('Feedback submitted successfully!');
      onClose();
    } catch (err) {
      console.error('Feedback submission failed:', err);
      showToast('Failed to submit feedback.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Provide Feedback" footer={
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmitFeedback} disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </button>
      </div>
    }>
      <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Reviewing <strong>Version {activeVersion.version}</strong> of "{submission.chapterTitle || submission.thesisTitle}"
        </p>

        {FEEDBACK_CRITERIA.map(c => (
          <div key={c.key} className="form-group">
            <label className="form-label">{c.label}</label>
            <div className="sub-star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={`star ${(ratings[c.key] || 0) >= star ? 'filled' : ''}`} onClick={() => setRatings(prev => ({ ...prev, [c.key]: star }))}>
                  <HiOutlineStar style={(ratings[c.key] || 0) >= star ? { fill: 'currentColor' } : {}} />
                </span>
              ))}
            </div>
          </div>
        ))}

        <div className="form-group">
          <label className="form-label">Recommendation <span style={{ color: 'var(--status-danger)' }}>*</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            {FEEDBACK_RECOMMENDATIONS.map(r => (
              <button key={r.value} className={`btn ${recommendation === r.value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRecommendation(r.value)} style={recommendation === r.value ? { background: r.color, borderColor: r.color } : {}}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Comments</label>
          <textarea className="form-input" rows={4} value={comments} onChange={e => setComments(e.target.value)} placeholder="Detailed feedback and suggestions..." />
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════
   UPLOAD NEW VERSION MODAL (Student)
   ════════════════════════════════════════════ */
function UploadVersionModal({ isOpen, onClose, submission, user, updateThesisSubmission, addNotification, showToast, setActiveVersionIdx }) {
  const [files, setFiles] = useState([]);
  const [changeNotes, setChangeNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const nextVersion = (submission.currentVersion || 1) + 1;
      const docEntries = files.map(f => ({
        name: f.name,
        size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
        uploadedAt: new Date().toISOString(),
      }));
      const updatedVersions = toArray(submission?.versions).map(v =>
        v.version === submission.currentVersion ? { ...v, status: 'superseded' } : v
      );
      const newVersion = {
        id: `tv-${Date.now()}`,
        version: nextVersion,
        status: 'submitted',
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.id,
        documents: docEntries,
        changeNotes: changeNotes.trim() || `Revision (version ${nextVersion})`,
        feedback: [],
        comments: [],
      };
      updatedVersions.push(newVersion);
      await updateThesisSubmission(submission.id, {
        versions: updatedVersions,
        currentVersion: nextVersion,
        documents: docEntries,
        status: 'submitted',
      });
      if (submission.supervisorId) {
        await addNotification(
          submission.supervisorId,
          'New Submission Version',
          `${user.name} has uploaded version ${nextVersion} of "${submission.chapterTitle || submission.thesisTitle}".`,
          'info',
          '/submissions'
        );
      }
      setActiveVersionIdx(updatedVersions.length - 1);
      showToast(`Version ${nextVersion} uploaded successfully!`);
      setFiles([]);
      setChangeNotes('');
      onClose();
    } catch (err) {
      console.error('Version upload failed:', err);
      showToast('Failed to upload new version.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Upload New Version" footer={
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleUpload} disabled={files.length === 0 || uploading}>
          {uploading ? 'Uploading…' : 'Upload Version'}
        </button>
      </div>
    }>
      <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
        <div className="form-group">
          <label className="form-label">Change Notes</label>
          <textarea className="form-input" rows={3} value={changeNotes} onChange={e => setChangeNotes(e.target.value)} placeholder="Describe what changed in this version..." />
        </div>
        <label className="btn btn-secondary" style={{ justifySelf: 'start', cursor: 'pointer' }}>
          <HiOutlineArrowUpTray /> Choose Files
          <input type="file" accept=".pdf,.doc,.docx" multiple style={{ display: 'none' }} onChange={e => setFiles(Array.from(e.target.files || []))} />
        </label>
        {files.length > 0 && (
          <div className="sub-doc-grid">
            {files.map((f, i) => (
              <div key={i} className="sub-doc-card">
                <div className="sub-doc-icon"><HiOutlineDocumentText /></div>
                <div className="sub-doc-info">
                  <div className="sub-doc-name">{f.name}</div>
                  <div className="sub-doc-size">{f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
