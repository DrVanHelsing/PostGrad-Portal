// ============================================
// HD Requests Page – Fully Functional
// ============================================

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardBody, StatusBadge, EmptyState, Modal } from '../components/common';
import { DynamicFormRenderer } from '../components/forms';
import SignaturePad from '../components/common/SignaturePad';
import { STATUS_CONFIG, REQUEST_TYPE_LABELS, FORM_TYPE_LABELS, FORMS_REQUIRING_ATTACHMENTS } from '../utils/constants';
import { formatDate, formatRelativeTime } from '../utils/helpers';
import { uploadRequestFiles, getFileUrl } from '../firebase/storage';
import { generateRequestPdf } from '../services/pdfService';
import { uploadPdfBlob } from '../firebase/storage';
import {
  sendRequestSubmittedEmail, sendRequestApprovedEmail, sendReferredBackEmail,
  sendFinalApprovalEmail, sendNudgeEmail, sendSectionHandoffEmail,
  sendSectionReferBackEmail, sendFormCompletionEmail, sendEscalationEmail,
} from '../services/emailService';
import UserPicker from '../components/common/UserPicker';
import NotificationAlerts from '../components/common/NotificationAlerts';
import { ALL_PREBUILT_TEMPLATES } from '../firebase/prebuiltTemplates';
import {
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlinePlusCircle,
  HiOutlineEye,
  HiOutlineKey,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineArrowUturnLeft,
  HiOutlineClock,
  HiOutlinePaperAirplane,
  HiOutlineArrowUpTray,
  HiOutlineTrash,
  HiOutlinePaperClip,
  HiOutlineLockClosed,
  HiOutlineClipboardDocumentList,
  HiOutlinePencilSquare,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import './HDRequestsPage.css';

/* ── helper: compute timer remaining ── */
function timerRemaining(request) {
  if (!request.timerStart || !request.timerHours) return null;
  const end = new Date(request.timerStart).getTime() + request.timerHours * 3600000;
  const diff = end - Date.now();
  if (diff <= 0) return { expired: true, text: 'Overdue' };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return { expired: false, text: `${h}h ${m}m remaining` };
}

export default function HDRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    mockHDRequests, mockUsers, getRequestsByStudent, getRequestsForSupervisor,
    getRequestsForCoordinator, getUserById, createHDRequest,
    submitToSupervisor, validateAccessCode, supervisorApprove,
    coSupervisorSign, referBack, forwardToFHD, recordFHDOutcome,
    recordSHDOutcome, resubmitRequest, getStudentProfile,
    updateRequestDocUrls, updateDraftRequest,
    formTemplates, formSubmissions,
    createFormSubmission, updateFormSubmissionData,
    updateFormSubmissionAttachments,
    completeFormSection, referBackFormSection,
    updateFormSubmissionStatus, linkFormSubmission,
    getFormSubmissionsForRequest,
    getFormTemplateBySlug,
    exportToCSV, downloadCSV,
  } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stalledFilter, setStalledFilter] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');
  const [reviewFiles, setReviewFiles] = useState([]);
  const [showReferBackModal, setShowReferBackModal] = useState(false);
  const [referBackReason, setReferBackReason] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureAction, setSignatureAction] = useState(null); // 'supervisorApprove' | 'coSupervisorSign' | 'coordinatorForward'
  const [showFHDOutcomeModal, setShowFHDOutcomeModal] = useState(false);
  const [showSHDOutcomeModal, setShowSHDOutcomeModal] = useState(false);
  const [fhdForm, setFhdForm] = useState({ outcome: '', referenceNumber: '', reason: '' });
  const [shdForm, setShdForm] = useState({ outcome: '', reason: '' });
  const [showVersions, setShowVersions] = useState(false);
  const [toast, setToast] = useState(null);
  const [tick, setTick] = useState(0); // for timer auto-refresh
  const [showEditDraftModal, setShowEditDraftModal] = useState(false);
  const [editDraftForm, setEditDraftForm] = useState({ title: '', description: '' });

  /* ── New Form System state ── */
  const [showFormSelectModal, setShowFormSelectModal] = useState(false);
  const [activeFormSubmission, setActiveFormSubmission] = useState(null);
  const [activeFormTemplate, setActiveFormTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [formSectionStatuses, setFormSectionStatuses] = useState({});
  const [formSignatures, setFormSignatures] = useState({});
  const [formValidationErrors, setFormValidationErrors] = useState({});
  const [showFormPreview, setShowFormPreview] = useState(false);
  const [previewFormTemplate, setPreviewFormTemplate] = useState(null);
  const [previewFormData, setPreviewFormData] = useState({});
  const [formFullscreen, setFormFullscreen] = useState(false);
  const [formRequiredAttachments, setFormRequiredAttachments] = useState({});

  /* ── UserPicker state (for supervisor/coordinator selection) ── */
  const [showSupervisorPicker, setShowSupervisorPicker] = useState(false);
  const [showCoordinatorPicker, setShowCoordinatorPicker] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Timer auto-refresh: force re-render every 60 seconds to update countdown displays
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Refresh selected request from store
  useEffect(() => {
    if (selectedRequest) {
      const fresh = mockHDRequests.find(r => r.id === selectedRequest.id);
      if (fresh) setSelectedRequest({ ...fresh });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockHDRequests]);

  // Get requests based on role
  const requests = useMemo(() => {
    if (user.role === 'student') return getRequestsByStudent(user.id);
    if (user.role === 'supervisor') return [...getRequestsForSupervisor(user.id), ...mockHDRequests.filter(r => (r.supervisorId === user.id || r.coSupervisorId === user.id) && !['submitted_to_supervisor', 'supervisor_review', 'co_supervisor_review'].includes(r.status))];
    if (user.role === 'coordinator' || user.role === 'admin') return [...mockHDRequests];
    // External / Examiner: show requests where they're the current owner or assigned
    if (user.role === 'external' || user.role === 'examiner') return mockHDRequests.filter(r => r.currentOwner === user.id || r.examinerId === user.id);
    return mockHDRequests;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mockHDRequests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.studentName?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      const matchStalled = !stalledFilter || (r.timerStart && r.timerHours && (new Date(r.timerStart).getTime() + r.timerHours * 3600000 < Date.now()));
      return matchSearch && matchStatus && matchType && matchStalled;
    });
  }, [requests, search, statusFilter, typeFilter, stalledFilter]);

  const statuses = [...new Set(requests.map((r) => r.status))];
  const types = [...new Set(requests.map((r) => r.type))];
  const roleLabel = user.role === 'student' ? 'My Requests' : user.role === 'supervisor' ? 'Requests for Review' : 'All Requests';

  /* ── ACTION HANDLERS ── */
  const handleSubmitToSupervisor = async () => {
    await submitToSupervisor(selectedRequest.id, user.id);
    showToast('Request submitted. Access code generated.');
    // Email: notify supervisor
    const supervisor = getUserById(selectedRequest.supervisorId);
    if (supervisor) {
      sendRequestSubmittedEmail(supervisor.email, supervisor.name, selectedRequest.title, user.name).catch(() => {});
    }
  };

  const handleResubmit = async () => {
    await resubmitRequest(selectedRequest.id, user.id);
    showToast('Request resubmitted.');
    const supervisor = getUserById(selectedRequest.supervisorId);
    if (supervisor) {
      sendRequestSubmittedEmail(supervisor.email, supervisor.name, selectedRequest.title, user.name).catch(() => {});
    }
  };

  const handleValidateAccessCode = () => {
    setAccessCodeError('');
    const result = validateAccessCode(selectedRequest.id, accessCodeInput);
    if (result.valid) {
      showToast('Access code validated. You can now review this request.');
      setAccessCodeInput('');
    } else {
      setAccessCodeError(result.error);
    }
  };

  const handleReferBack = async () => {
    if (!referBackReason.trim()) return;
    await referBack(selectedRequest.id, user.id, referBackReason);
    setShowReferBackModal(false);
    setReferBackReason('');
    showToast('Request referred back to student.');
    // Email: notify student
    const student = getUserById(selectedRequest.studentId);
    if (student) {
      sendReferredBackEmail(student.email, student.name, selectedRequest.title, referBackReason, user.name).catch(() => {});
    }
    // Email: notify supervisor (if the refer-back is from coordinator)
    if (user.role === 'coordinator' && selectedRequest.supervisorId !== user.id) {
      const sup = getUserById(selectedRequest.supervisorId);
      if (sup) {
        sendSectionReferBackEmail(sup.email, sup.name, selectedRequest.title, 'Request', user.name, referBackReason).catch(() => {});
      }
    }
  };

  const openSignature = (action) => {
    setSignatureAction(action);
    setShowSignatureModal(true);
  };

  const handleSignatureComplete = async (sigData) => {
    setShowSignatureModal(false);
    if (signatureAction === 'supervisorApprove') {
      await supervisorApprove(selectedRequest.id, user.id, sigData.name);
      showToast('Request approved and forwarded.');
      // Email: notify student of approval
      const student = getUserById(selectedRequest.studentId);
      if (student) {
        sendRequestApprovedEmail(student.email, student.name, selectedRequest.title, 'Supervisor', user.name).catch(() => {});
      }
      // Email: notify co-supervisor if applicable
      if (selectedRequest.coSupervisorId) {
        const coSup = getUserById(selectedRequest.coSupervisorId);
        if (coSup) {
          sendSectionHandoffEmail(coSup.email, coSup.name, selectedRequest.title, 'Co-Supervisor Review', user.name).catch(() => {});
        }
      } else {
        // No co-supervisor → notify coordinator
        const coord = getUserById(selectedRequest.coordinatorId);
        if (coord) {
          sendSectionHandoffEmail(coord.email, coord.name, selectedRequest.title, 'Coordinator Review', user.name).catch(() => {});
        }
      }
    } else if (signatureAction === 'coSupervisorSign') {
      await coSupervisorSign(selectedRequest.id, user.id, sigData.name);
      showToast('Co-supervisor signature applied. Forwarded to coordinator.');
      // Email: notify coordinator
      const coord = getUserById(selectedRequest.coordinatorId);
      if (coord) {
        sendSectionHandoffEmail(coord.email, coord.name, selectedRequest.title, 'Coordinator Review', user.name).catch(() => {});
      }
      // Email: notify student
      const student = getUserById(selectedRequest.studentId);
      if (student) {
        sendRequestApprovedEmail(student.email, student.name, selectedRequest.title, 'Co-Supervisor', user.name).catch(() => {});
      }
    } else if (signatureAction === 'coordinatorForward') {
      await forwardToFHD(selectedRequest.id, user.id, sigData.name);
      showToast('Signed and forwarded to the Faculty Board.');
      // Email: notify student that request is at Faculty Board
      const student = getUserById(selectedRequest.studentId);
      if (student) {
        sendRequestApprovedEmail(student.email, student.name, selectedRequest.title, 'Coordinator (forwarded to Faculty Board)', user.name).catch(() => {});
      }
    }
    setSignatureAction(null);
  };

  const handleFHDOutcome = async () => {
    if (!fhdForm.outcome) return;
    await recordFHDOutcome(selectedRequest.id, user.id, fhdForm.outcome, fhdForm.referenceNumber, fhdForm.reason);
    setShowFHDOutcomeModal(false);
    showToast(`Faculty Board outcome recorded: ${fhdForm.outcome}`);
    // Email: notify student of FHD outcome
    const student = getUserById(selectedRequest.studentId);
    if (student) {
      if (fhdForm.outcome === 'approved') {
        sendRequestApprovedEmail(student.email, student.name, selectedRequest.title, 'Faculty Board', user.name).catch(() => {});
      } else if (fhdForm.outcome === 'referred_back') {
        sendReferredBackEmail(student.email, student.name, selectedRequest.title, fhdForm.reason || 'Faculty Board decision', user.name).catch(() => {});
      }
    }
    // Email: notify supervisor of FHD referral
    if (fhdForm.outcome === 'referred_back') {
      const sup = getUserById(selectedRequest.supervisorId);
      if (sup) {
        sendReferredBackEmail(sup.email, sup.name, selectedRequest.title, fhdForm.reason || 'Faculty Board decision', 'Faculty Board').catch(() => {});
      }
    }
    setFhdForm({ outcome: '', referenceNumber: '', reason: '' });
  };

  const handleSHDOutcome = async () => {
    if (!shdForm.outcome) return;
    await recordSHDOutcome(selectedRequest.id, user.id, shdForm.outcome, shdForm.reason);
    setShowSHDOutcomeModal(false);

    if (shdForm.outcome === 'approved') {
      // Generate and upload final PDF
      try {
        showToast('Generating final PDF...');
        const studentProfile = getStudentProfile(selectedRequest.studentId);
        const freshReq = mockHDRequests.find(r => r.id === selectedRequest.id) || selectedRequest;
        const pdfBlob = await generateRequestPdf(freshReq, { getUserById, studentProfile });
        const pdfPath = `requests/${selectedRequest.id}/final_approved.pdf`;
        const uploaded = await uploadPdfBlob(pdfBlob, pdfPath);
        await updateRequestDocUrls(selectedRequest.id, { finalPdfUrl: uploaded.url, finalPdfPath: uploaded.path });
        showToast('Request fully approved — PDF generated.');
      } catch (err) {
        console.error('PDF generation error:', err);
        showToast('Approved but PDF generation failed', 'error');
      }
      // Email: notify student of final approval
      const student = getUserById(selectedRequest.studentId);
      if (student) {
        sendFinalApprovalEmail(student.email, student.name, selectedRequest.title).catch(() => {});
      }
    } else {
      showToast(`Senate Board outcome recorded: ${shdForm.outcome}`);
    }
    setShdForm({ outcome: '', reason: '' });
  };

  const handleDownloadPdf = async (url) => {
    try {
      // If it's a Firebase Storage path/url, open it directly
      if (url.startsWith('http')) {
        window.open(url, '_blank');
      } else {
        const storagePath = url.startsWith('/') ? url.slice(1) : url;
        const downloadUrl = await getFileUrl(storagePath);
        window.open(downloadUrl, '_blank');
      }
    } catch (err) {
      showToast('Failed to download PDF', 'error');
    }
  };

  const openEditDraft = () => {
    if (!selectedRequest) return;
    setEditDraftForm({ title: selectedRequest.title || '', description: selectedRequest.description || '' });
    setShowEditDraftModal(true);
  };

  const handleSaveEditDraft = async () => {
    if (!editDraftForm.title.trim()) return;
    try {
      await updateDraftRequest(selectedRequest.id, {
        title: editDraftForm.title.trim(),
        description: editDraftForm.description.trim(),
      });
      setShowEditDraftModal(false);
      showToast('Draft updated.');
    } catch (err) {
      showToast(err.message || 'Failed to update draft', 'error');
    }
  };

  return (
    <div className="page-wrapper">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Higher Degrees Requests</h1>
          <p>{roleLabel} – {filtered.length} request{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {user.role === 'student' && (
          <button className="btn btn-primary" onClick={() => setShowNewRequestModal(true)}>
            <HiOutlinePlusCircle /> New Request
          </button>
        )}
        {(user.role === 'supervisor' || user.role === 'admin' || user.role === 'coordinator' || user.role === 'external' || user.role === 'examiner') && (
          <button className="btn btn-primary" onClick={() => setShowNewRequestModal(true)}>
            <HiOutlinePlusCircle /> New Form
          </button>
        )}
      </div>

      {/* Alert banners for overdue / pending actions */}
      <NotificationAlerts onNavigate={null} />

      {/* Toolbar */}
      <div className="requests-toolbar">
        <div className="requests-toolbar-left">
          <div className="search-container" style={{ maxWidth: 280 }}>
            <HiOutlineMagnifyingGlass className="search-icon" />
            <input className="search-input" placeholder="Search requests..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
            <option value="all">All statuses</option>
            {statuses.map((s) => (<option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>))}
          </select>
          <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
            <option value="all">All types</option>
            {types.map((t) => (<option key={t} value={t}>{REQUEST_TYPE_LABELS[t] || t}</option>))}
          </select>
          {(user.role === 'admin' || user.role === 'coordinator') && (
            <button
              className={`filter-chip ${stalledFilter ? 'active' : ''}`}
              onClick={() => setStalledFilter(v => !v)}
              style={stalledFilter ? { background: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderColor: 'var(--status-danger)' } : {}}
            >
              <HiOutlineExclamationTriangle style={{ verticalAlign: -2, marginRight: 4 }} />
              Overdue Only
            </button>
          )}
          {/* Export CSV for staff roles */}
          {['supervisor', 'coordinator', 'admin'].includes(user.role) && filtered.length > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const csv = exportToCSV(filtered, [
                  { label: 'Title', accessor: 'title' },
                  { label: 'Type', accessor: r => REQUEST_TYPE_LABELS[r.type] || r.type },
                  { label: 'Student', accessor: 'studentName' },
                  { label: 'Status', accessor: r => STATUS_CONFIG[r.status]?.label || r.status },
                  { label: 'Owner', accessor: r => getUserById(r.currentOwner)?.name || '—' },
                  { label: 'Created', accessor: r => r.createdAt instanceof Date ? r.createdAt.toISOString().slice(0, 10) : '' },
                  { label: 'Updated', accessor: r => r.updatedAt instanceof Date ? r.updatedAt.toISOString().slice(0, 10) : '' },
                ]);
                downloadCSV(csv, `hd-requests-${new Date().toISOString().slice(0, 10)}.csv`);
                showToast('CSV exported');
              }}
            >
              <HiOutlineArrowUpTray style={{ verticalAlign: -2, marginRight: 4 }} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardBody flush>
          {filtered.length === 0 ? (
            <EmptyState icon={<HiOutlineDocumentText />} title="No requests found" description="Try adjusting your filters or search term" />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    {user.role !== 'student' && <th>Student</th>}
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const owner = getUserById(r.currentOwner);
                    const timer = timerRemaining(r);
                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.title}</div>
                          {r.referenceNumber && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{r.referenceNumber}</div>}
                        </td>
                        <td>{REQUEST_TYPE_LABELS[r.type]}</td>
                        {user.role !== 'student' && <td>{r.studentName}</td>}
                        <td>
                          <StatusBadge status={r.status} />
                          {timer && (
                            <span className={`timer-badge ${timer.expired ? 'timer-expired' : ''}`}>
                              <HiOutlineClock /> {timer.text}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{owner?.name || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 12 }}>{formatRelativeTime(r.updatedAt)}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedRequest({ ...r }); setAccessCodeInput(''); setAccessCodeError(''); setReviewFiles([]); }}>
                            <HiOutlineEye /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Detail Modal ── */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {selectedRequest?.title || 'Request Details'}
            {selectedRequest?.locked && <HiOutlineLockClosed style={{ color: 'var(--text-tertiary)' }} title="Document locked" />}
          </span>
        }
        large
        footer={selectedRequest && (
          <RequestModalActions
            request={selectedRequest}
            userRole={user.role}
            userId={user.id}
            onClose={() => setSelectedRequest(null)}
            onSubmit={handleSubmitToSupervisor}
            onResubmit={handleResubmit}
            onReferBack={() => setShowReferBackModal(true)}
            onSignApprove={() => openSignature('supervisorApprove')}
            onCoSign={() => openSignature('coSupervisorSign')}
            onCoordinatorForward={() => openSignature('coordinatorForward')}
            onRecordFHD={() => { setFhdForm({ outcome: '', referenceNumber: '', reason: '' }); setShowFHDOutcomeModal(true); }}
            onRecordSHD={() => { setShdForm({ outcome: '', reason: '' }); setShowSHDOutcomeModal(true); }}
            onEditDraft={openEditDraft}
          />
        )}
      >
        {selectedRequest && (
          <div>
            <div className="request-detail-grid">
              <DetailField label="Type" value={REQUEST_TYPE_LABELS[selectedRequest.type]} />
              <DetailField label="Status" value={<StatusBadge status={selectedRequest.status} />} />
              <DetailField label="Student" value={selectedRequest.studentName} />
              <DetailField label="Supervisor" value={getUserById(selectedRequest.supervisorId)?.name || '—'} />
              {selectedRequest.coSupervisorId && <DetailField label="Co-Supervisor" value={getUserById(selectedRequest.coSupervisorId)?.name || '—'} />}
              <DetailField label="Current Owner" value={getUserById(selectedRequest.currentOwner)?.name || '—'} />
              <DetailField label="Created" value={formatDate(selectedRequest.createdAt)} />
              <DetailField label="Last Updated" value={formatDate(selectedRequest.updatedAt)} />
            </div>

            {/* Timer display */}
            {(() => {
              const timer = timerRemaining(selectedRequest);
              return timer ? (
                <div className={`detail-timer-bar ${timer.expired ? 'timer-expired' : ''}`}>
                  <HiOutlineClock /> {timer.expired ? 'Response deadline has passed' : `Review deadline: ${timer.text}`}
                </div>
              ) : null;
            })()}

            {selectedRequest.description && (
              <div className="request-detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="request-detail-label">Description</div>
                <div className="request-detail-value">{selectedRequest.description}</div>
              </div>
            )}

            {selectedRequest.referenceNumber && (
              <div className="request-detail-section">
                <div className="request-detail-label">Reference Number</div>
                <div className="request-detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{selectedRequest.referenceNumber}</div>
              </div>
            )}

            {/* Referred-back reason display */}
            {selectedRequest.referredBackReason && (
              <div className="referred-back-banner">
                <HiOutlineExclamationTriangle />
                <div>
                  <strong>Referred Back</strong>
                  <div>{selectedRequest.referredBackReason}</div>
                  {selectedRequest.referredBackDate && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>on {formatDate(selectedRequest.referredBackDate)} by {getUserById(selectedRequest.referredBackBy)?.name || 'Unknown'}</div>}
                </div>
              </div>
            )}

            {/* Access code display (student) */}
            {selectedRequest.accessCode && user.role === 'student' && ['submitted_to_supervisor', 'co_supervisor_review'].includes(selectedRequest.status) && (
              <div className="request-detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="request-detail-label">Access Code</div>
                <div className="access-code-container">
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Share this code with your supervisor to give them access</div>
                  <div className="access-code-value">{selectedRequest.accessCode}</div>
                  {selectedRequest.accessCodeExpiry && <div className="access-code-expiry">Expires: {formatDate(selectedRequest.accessCodeExpiry)}</div>}
                </div>
              </div>
            )}

            {/* Access code input (supervisor, when submitted) */}
            {user.role === 'supervisor' && selectedRequest.status === 'submitted_to_supervisor' && (
              <div className="request-detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="request-detail-label">Enter Access Code</div>
                <div className="access-code-input-group">
                  <input className="access-code-input" placeholder="ABC123" value={accessCodeInput} onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())} maxLength={6} />
                  <button className="btn btn-primary" onClick={handleValidateAccessCode}><HiOutlineKey /> Validate</button>
                </div>
                {accessCodeError && <div className="access-code-error">{accessCodeError}</div>}
              </div>
            )}

            {/* Existing documents */}
            {selectedRequest.documents && selectedRequest.documents.length > 0 && (
              <div className="request-detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="request-detail-label">Attached Documents</div>
                <div className="file-list">
                  {selectedRequest.documents.map((doc, i) => (
                    <div key={i} className="file-list-item">
                      <HiOutlinePaperClip className="file-list-icon" />
                      <div className="file-list-info">
                        <span className="file-list-name">{doc.name}</span>
                        <span className="file-list-meta">{doc.size} {doc.uploadedAt && `· ${formatDate(doc.uploadedAt)}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View Form Preview button — show for any request with a linked form submission OR a matching template */}
            {(() => {
              const linkedSubs = getFormSubmissionsForRequest(selectedRequest.id);
              const linkedSub = linkedSubs?.[0];
              const template = linkedSub
                ? (formTemplates.find(t => t.id === linkedSub.templateId) || ALL_PREBUILT_TEMPLATES.find(t => t.slug === selectedRequest.type))
                : ALL_PREBUILT_TEMPLATES.find(t => t.slug === selectedRequest.type);
              if (!template) return null;
              return (
                <div className="request-detail-section" style={{ marginTop: 'var(--space-lg)' }}>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={() => { setPreviewFormTemplate(template); setPreviewFormData(linkedSub?.data || {}); setShowFormPreview(true); }}
                  >
                    <HiOutlineClipboardDocumentList /> {linkedSub ? 'View Submitted Form' : 'View Form Template'}
                  </button>
                </div>
              );
            })()}

            {/* Supervisor/Coordinator review file upload - only for form types requiring attachments */}
            {FORMS_REQUIRING_ATTACHMENTS.includes(selectedRequest.type) &&
              ((user.role === 'supervisor' && ['supervisor_review'].includes(selectedRequest.status))
              || (user.role === 'coordinator' && selectedRequest.status === 'coordinator_review')) && (
              <div className="request-detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="request-detail-label">Attach Review Documents</div>
                <FileUploadZone files={reviewFiles} onChange={setReviewFiles}
                  hint={user.role === 'supervisor' ? 'Upload signed feedback, assessment reports, or recommendation letters' : 'Upload committee minutes, decision letters, or supporting documentation'} />
              </div>
            )}

            {/* Signatures */}
            {selectedRequest.signatures?.length > 0 && (
              <div className="request-detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="request-detail-label">Signatures</div>
                <div className="signatures-list">
                  {selectedRequest.signatures.map((s, i) => (
                    <div key={i} className="signature-entry">
                      <HiOutlinePencilSquare className="signature-icon" />
                      <div>
                        <strong>{s.name}</strong> <span className="signature-role">({s.role})</span>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatDate(s.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedRequest.notes && !selectedRequest.referredBackReason && (
              <div className="request-detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="request-detail-label">Notes</div>
                <div className="request-notes">{selectedRequest.notes}</div>
              </div>
            )}

            {/* Outcomes */}
            {(selectedRequest.fhdOutcome || selectedRequest.shdOutcome) && (
              <div className="request-detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="request-detail-label">Committee Outcomes</div>
                <div className="request-detail-grid" style={{ marginTop: 8 }}>
                  {selectedRequest.fhdOutcome && (
                    <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Faculty Board:</span>{' '}<StatusBadge status={selectedRequest.fhdOutcome} /></div>
                  )}
                  {selectedRequest.shdOutcome && (
                    <div><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Senate Board:</span>{' '}<StatusBadge status={selectedRequest.shdOutcome} /></div>
                  )}
                </div>
              </div>
            )}

            {/* Final PDF / Drive link (approved) */}
            {selectedRequest.status === 'approved' && (selectedRequest.finalPdfUrl || selectedRequest.googleDriveUrl) && (
              <div className="request-detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="request-detail-label">Final Documents</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                  {selectedRequest.finalPdfUrl && <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadPdf(selectedRequest.finalPdfUrl)}>Download PDF</button>}
                </div>
              </div>
            )}

            {/* Version History toggle */}
            {selectedRequest.versions?.length > 0 && (
              <div className="request-detail-section" style={{ marginTop: 'var(--space-xl)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowVersions(v => !v)} style={{ marginBottom: 8 }}>
                  <HiOutlineClipboardDocumentList /> {showVersions ? 'Hide' : 'Show'} Version History ({selectedRequest.versions.length})
                </button>
                {showVersions && (
                  <div className="version-history">
                    {[...selectedRequest.versions].reverse().map((v, i) => (
                      <div key={i} className="version-entry">
                        <div className="version-dot" />
                        <div>
                          <div style={{ fontWeight: 500 }}>{v.action}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                            {formatDate(v.date)} · {getUserById(v.by)?.name || v.by}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Refer Back Modal ── */}
      <Modal isOpen={showReferBackModal} onClose={() => setShowReferBackModal(false)} title="Refer Back Request"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowReferBackModal(false)}>Cancel</button>
            <button className="btn btn-danger" disabled={!referBackReason.trim()} onClick={handleReferBack}>
              <HiOutlineArrowUturnLeft /> Refer Back
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Reason for referring back <span style={{ color: 'red' }}>*</span></label>
          <textarea className="form-textarea" rows={4} placeholder="Please provide clear feedback explaining what changes are needed..."
            value={referBackReason} onChange={(e) => setReferBackReason(e.target.value)} />
        </div>
      </Modal>

      {/* ── Signature Modal ── */}
      <Modal isOpen={showSignatureModal} onClose={() => setShowSignatureModal(false)} title="Digital Signature">
        <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
          By signing, you confirm you have reviewed this request and {signatureAction === 'supervisorApprove' ? 'approve it for forwarding' : signatureAction === 'coSupervisorSign' ? 'provide your co-supervisor endorsement' : 'forward it to the Faculty Higher Degrees Committee'}.
        </p>
        <SignaturePad signerName={user?.name} onSign={handleSignatureComplete} />
      </Modal>

      {/* ── FHD Outcome Modal ── */}
      <Modal isOpen={showFHDOutcomeModal} onClose={() => setShowFHDOutcomeModal(false)} title="Record Faculty Board Outcome"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowFHDOutcomeModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!fhdForm.outcome} onClick={handleFHDOutcome}>Record Outcome</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Outcome</label>
          <select className="form-select" value={fhdForm.outcome} onChange={(e) => setFhdForm({ ...fhdForm, outcome: e.target.value })}>
            <option value="">Select outcome...</option>
            <option value="approved">Approved</option>
            <option value="recommended">Recommended to Senate Board</option>
            <option value="referred_back">Referred Back</option>
          </select>
        </div>
        {(fhdForm.outcome === 'approved' || fhdForm.outcome === 'recommended') && (
          <div className="form-group">
            <label className="form-label">Reference Number</label>
            <input className="form-input" placeholder="e.g. FHD/2026/0001" value={fhdForm.referenceNumber} onChange={(e) => setFhdForm({ ...fhdForm, referenceNumber: e.target.value })} />
          </div>
        )}
        {fhdForm.outcome === 'approved' && (
          <div className="fhd-auto-note">
            <HiOutlineCheckCircle /> Per policy, the Senate Board checkbox will be auto-checked upon Faculty Board approval.
          </div>
        )}
        {fhdForm.outcome === 'referred_back' && (
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-textarea" rows={3} value={fhdForm.reason} onChange={(e) => setFhdForm({ ...fhdForm, reason: e.target.value })} placeholder="Reason the Faculty Board is referring this back..." />
          </div>
        )}
      </Modal>

      {/* ── SHD Outcome Modal ── */}
      <Modal isOpen={showSHDOutcomeModal} onClose={() => setShowSHDOutcomeModal(false)} title="Record Senate Board Outcome"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowSHDOutcomeModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!shdForm.outcome} onClick={handleSHDOutcome}>Record Outcome</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Outcome</label>
          <select className="form-select" value={shdForm.outcome} onChange={(e) => setShdForm({ ...shdForm, outcome: e.target.value })}>
            <option value="">Select outcome...</option>
            <option value="approved">Approved</option>
            <option value="referred_back">Referred Back</option>
          </select>
        </div>
        {shdForm.outcome === 'referred_back' && (
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-textarea" rows={3} value={shdForm.reason} onChange={(e) => setShdForm({ ...shdForm, reason: e.target.value })} placeholder="Reason the Senate Board is referring this back..." />
          </div>
        )}
      </Modal>

      {/* ── Edit Draft Modal ── */}
      <Modal isOpen={showEditDraftModal} onClose={() => setShowEditDraftModal(false)} title="Edit Draft Request"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEditDraftModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!editDraftForm.title.trim()} onClick={handleSaveEditDraft}>Save Changes</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" value={editDraftForm.title} onChange={(e) => setEditDraftForm({ ...editDraftForm, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" rows={4} value={editDraftForm.description} onChange={(e) => setEditDraftForm({ ...editDraftForm, description: e.target.value })} />
        </div>
      </Modal>

      {/* ── Form Preview Modal (read-only view of submitted form) ── */}
      <Modal
        isOpen={showFormPreview && !!previewFormTemplate}
        onClose={() => { setShowFormPreview(false); setPreviewFormTemplate(null); setPreviewFormData({}); }}
        title="Submitted Form Preview"
        large
      >
        {previewFormTemplate && (
          <DynamicFormRenderer
            template={previewFormTemplate}
            formData={previewFormData}
            readOnly
            bypassRoleLocking
          />
        )}
      </Modal>

      {/* ── New Request Modal – Template Selection ── */}
      <TemplateSelectionModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        user={user}
        formTemplates={formTemplates}
        onSelectTemplate={(template) => {
          const studentProfile = getStudentProfile(user.id);
          setActiveFormTemplate(template);
          setFormData({});
          setFormSectionStatuses({});
          setFormSignatures({});
          setFormValidationErrors({});
          setFormRequiredAttachments({});
          setShowNewRequestModal(false);
          // Pre-populate auto fields will happen in DynamicFormRenderer
        }}
      />

      {/* ── Form Fill Modal ── */}
      <Modal
        isOpen={!!activeFormTemplate}
        onClose={() => { setActiveFormTemplate(null); setActiveFormSubmission(null); setFormFullscreen(false); setSelectedSupervisor(null); setSelectedCoordinator(null); setFormRequiredAttachments({}); }}
        title={activeFormTemplate?.layout?.header?.formTitle || activeFormTemplate?.name || 'Form'}
        large
        fullscreen={formFullscreen}
        onToggleFullscreen={() => setFormFullscreen(f => !f)}
      >
        {activeFormTemplate && (
          <>
            {/* ── Auto-prefilled Supervisor / Coordinator Info ── */}
            {(() => {
              const prof = getStudentProfile(user.id);
              const supId = prof?.supervisorId;
              const coordId = mockUsers.find(u => u.role === 'coordinator')?.id;
              const sup = supId ? getUserById(supId) : null;
              const coord = coordId ? getUserById(coordId) : null;
              return (
                <div style={{
                  display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)',
                  padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-muted)', border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supervisor</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: sup ? 'var(--text-primary)' : 'var(--status-danger)' }}>
                      {sup ? (<><HiOutlineCheckCircle style={{ color: 'var(--status-success)', verticalAlign: -2, marginRight: 4 }} />{sup.name}</>) : 'Not assigned — update your profile'}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coordinator</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {coord ? (<><HiOutlineCheckCircle style={{ color: 'var(--status-success)', verticalAlign: -2, marginRight: 4 }} />{coord.name}</>) : 'Auto-assigned'}
                    </div>
                  </div>
                  {!sup && (
                    <div style={{ width: '100%', marginTop: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/settings')}>Go to Profile to assign supervisor</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {(() => {
              const requiredAttachments = (activeFormTemplate.requiredAttachments || []).filter(a => a.required);
              if (requiredAttachments.length === 0) return null;

              return (
                <RequiredAttachmentFields
                  requiredAttachments={requiredAttachments}
                  filesByKey={formRequiredAttachments}
                  onChange={setFormRequiredAttachments}
                />
              );
            })()}

            <DynamicFormRenderer
            template={activeFormTemplate}
            formData={formData}
            sectionStatuses={formSectionStatuses}
            signatures={formSignatures}
            currentUserRole={user.role}
            currentUser={user}
            studentProfile={getStudentProfile(user.id)}
            onFieldChange={(fieldId, value) => {
              setFormData(prev => ({ ...prev, [fieldId]: value }));
              // Clear validation error on change
              if (formValidationErrors[fieldId]) {
                setFormValidationErrors(prev => { const next = { ...prev }; delete next[fieldId]; return next; });
              }
              // Persist to Firestore if we have a submission
              if (activeFormSubmission?.id) {
                updateFormSubmissionData(activeFormSubmission.id, fieldId, value).catch(console.error);
              }
            }}
            onSectionSign={(sectionId, sigData) => {
              setFormSignatures(prev => ({ ...prev, [sectionId]: sigData }));
            }}
            onSectionComplete={async (sectionId) => {
              setFormSectionStatuses(prev => ({ ...prev, [sectionId]: 'completed' }));
              if (activeFormSubmission?.id) {
                await completeFormSection(activeFormSubmission.id, sectionId, user.id, formSignatures[sectionId]).catch(console.error);
              }
            }}
            onSectionReferBack={async (sectionId, comment) => {
              setFormSectionStatuses(prev => ({ ...prev, [sectionId]: 'referred_back' }));
              if (activeFormSubmission?.id) {
                await referBackFormSection(activeFormSubmission.id, sectionId, user.id, comment).catch(console.error);
              }
            }}
            onSubmit={async () => {
              try {
                // Resolve supervisor and coordinator from profile (auto-prefilled)
                const profile = getStudentProfile(user.id);
                const supervisorId = profile?.supervisorId;
                const coordinatorId = mockUsers.find(u => u.role === 'coordinator')?.id;
                const requiredAttachments = (activeFormTemplate.requiredAttachments || []).filter(a => a.required);
                const missingRequired = requiredAttachments.filter((attachment, index) => {
                  const key = attachment.id || attachment.key || attachment.label || `required_${index}`;
                  return !formRequiredAttachments[key];
                });

                if (missingRequired.length > 0) {
                  showToast(
                    `Please attach required document(s): ${missingRequired.map((d) => d.label).join(', ')}`,
                    'error'
                  );
                  return;
                }

                if (!supervisorId) {
                  showToast('Please assign a supervisor in your profile Settings before submitting.', 'error');
                  return;
                }

                // Create submission if not yet created
                let submissionId = activeFormSubmission?.id;
                if (!submissionId) {
                  const sub = await createFormSubmission({
                    templateId: activeFormTemplate.slug,
                    templateName: activeFormTemplate.name,
                    initiatorId: user.id,
                    initiatorName: user.name,
                    studentId: user.role === 'student' ? user.id : null,
                    data: formData,
                    sectionStatuses: formSectionStatuses,
                    signatures: formSignatures,
                  });
                  submissionId = sub.id;
                  setActiveFormSubmission(sub);
                } else {
                  await updateFormSubmissionStatus(submissionId, 'submitted');
                }

                // Also create a legacy HD request for workflow tracking
                const req = await createHDRequest({
                  type: activeFormTemplate.slug,
                  title: `${activeFormTemplate.name} – ${user.name}`,
                  description: `Form submission for ${activeFormTemplate.name}`,
                  studentId: user.id,
                  studentName: user.name,
                  supervisorId: supervisorId,
                  coordinatorId: coordinatorId || 'coordinator-001',
                  studentDepartment: profile?.department,
                  studentFaculty: profile?.faculty,
                  studentProgramme: profile?.programme,
                  formSubmissionId: submissionId,
                });

                if (requiredAttachments.length > 0) {
                  const attachmentPairs = requiredAttachments.map((attachment, index) => {
                    const key = attachment.id || attachment.key || attachment.label || `required_${index}`;
                    return { key, label: attachment.label, file: formRequiredAttachments[key] };
                  }).filter((entry) => !!entry.file);

                  const uploaded = await uploadRequestFiles(attachmentPairs.map((entry) => entry.file), req.id, 'submission');
                  const labeledUploads = uploaded.map((fileMeta, index) => ({
                    ...fileMeta,
                    requiredField: attachmentPairs[index].key,
                    requiredLabel: attachmentPairs[index].label,
                  }));

                  await updateRequestDocUrls(req.id, { documents: labeledUploads });
                  await updateFormSubmissionAttachments(submissionId, {
                    requiredDocuments: labeledUploads,
                  });
                }

                // Link submission to request
                await linkFormSubmission(submissionId, req.id);

                // Email: notify supervisor of new form submission
                const supervisor = getUserById(supervisorId);
                if (supervisor?.email) {
                  sendRequestSubmittedEmail(supervisor.email, supervisor.name, activeFormTemplate.name, user.name).catch(() => {});
                }

                showToast(`"${activeFormTemplate.name}" submitted successfully.`);
                setActiveFormTemplate(null);
                setActiveFormSubmission(null);
                setSelectedSupervisor(null);
                setSelectedCoordinator(null);
                setFormRequiredAttachments({});
              } catch (err) {
                console.error('Form submission error:', err);
                showToast('Failed to submit form', 'error');
              }
            }}
            validationErrors={formValidationErrors}
          />
          </>
        )}
      </Modal>

      {/* Supervisor/Coordinator are now auto-prefilled from profile – no picker modals needed */}
    </div>
  );
}

/* ── Detail field pair ── */
function DetailField({ label, value }) {
  return (
    <div className="request-detail-section">
      <div className="request-detail-label">{label}</div>
      <div className="request-detail-value">{value}</div>
    </div>
  );
}

/* ── Request action buttons ── */
function RequestModalActions({ request, userRole, userId, onClose, onSubmit, onResubmit, onReferBack, onSignApprove, onCoSign, onCoordinatorForward, onRecordFHD, onRecordSHD, onEditDraft }) {
  if (!request) return null;

  // Student: draft → edit & submit
  if (userRole === 'student' && request.status === 'draft') {
    return (
      <>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button className="btn btn-ghost" onClick={onEditDraft}>
          <HiOutlinePencilSquare /> Edit
        </button>
        <button className="btn btn-primary" onClick={onSubmit}>
          <HiOutlinePaperAirplane /> Submit
        </button>
      </>
    );
  }

  // Student: referred_back → resubmit
  if (userRole === 'student' && request.status === 'referred_back') {
    return (
      <>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={onResubmit}>
          <HiOutlineArrowPath /> Resubmit
        </button>
      </>
    );
  }

  // Supervisor: in review
  if (userRole === 'supervisor' && request.status === 'supervisor_review' && request.supervisorId === userId) {
    return (
      <>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button className="btn btn-danger btn-sm" onClick={onReferBack}><HiOutlineArrowUturnLeft /> Refer Back</button>
        <button className="btn btn-success" onClick={onSignApprove}><HiOutlineCheckCircle /> Approve & Sign</button>
      </>
    );
  }

  // Co-supervisor review
  if (userRole === 'supervisor' && request.status === 'co_supervisor_review' && request.coSupervisorId === userId) {
    return (
      <>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button className="btn btn-danger btn-sm" onClick={onReferBack}><HiOutlineArrowUturnLeft /> Refer Back</button>
        <button className="btn btn-success" onClick={onCoSign}><HiOutlineCheckCircle /> Sign & Forward</button>
      </>
    );
  }

  // Coordinator: review
  if (userRole === 'coordinator' && request.status === 'coordinator_review') {
    return (
      <>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button className="btn btn-danger btn-sm" onClick={onReferBack}><HiOutlineArrowUturnLeft /> Refer Back</button>
        <button className="btn btn-primary" onClick={onCoordinatorForward}><HiOutlineArrowPath /> Sign & Forward to Faculty Board</button>
      </>
    );
  }

  // Coordinator / Admin: FHD pending
  if ((userRole === 'coordinator' || userRole === 'admin') && request.status === 'fhd_pending' && !request.fhdOutcome) {
    return (
      <>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={onRecordFHD}>Record Faculty Board Outcome</button>
      </>
    );
  }

  // Admin: SHD pending
  if ((userRole === 'coordinator' || userRole === 'admin') && request.status === 'shd_pending' && !request.shdOutcome) {
    return (
      <>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button className="btn btn-primary" onClick={onRecordSHD}>Record Senate Board Outcome</button>
      </>
    );
  }

  return <button className="btn btn-secondary" onClick={onClose}>Close</button>;
}

/* ── Reusable File Upload Zone ── */
function FileUploadZone({ files, onChange, hint, accept }) {
  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    onChange([...files, ...selected]);
    e.target.value = '';
  };

  const removeFile = (index) => onChange(files.filter((_, i) => i !== index));

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="file-upload-zone-wrapper">
      <label className="file-upload-zone">
        <input type="file" multiple className="file-upload-input" onChange={handleFileSelect}
          accept={accept || '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png'} />
        <HiOutlineArrowUpTray className="file-upload-icon" />
        <span className="file-upload-text">Click to browse or drag files here</span>
        {hint && <span className="file-upload-hint">{hint}</span>}
        <span className="file-upload-formats">PDF, Word, Excel, Images, ZIP – max 10 MB per file</span>
      </label>
      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, i) => (
            <div key={i} className="file-list-item">
              <HiOutlinePaperClip className="file-list-icon" />
              <div className="file-list-info">
                <span className="file-list-name">{file.name}</span>
                <span className="file-list-meta">{formatFileSize(file.size)}</span>
              </div>
              <button className="file-list-remove" onClick={() => removeFile(i)} title="Remove file"><HiOutlineTrash /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RequiredAttachmentFields({ requiredAttachments, filesByKey, onChange }) {
  const setFileForKey = (key, fileList) => {
    const [selected] = Array.from(fileList || []);
    onChange((prev) => ({ ...prev, [key]: selected || null }));
  };

  const clearFileForKey = (key) => {
    onChange((prev) => ({ ...prev, [key]: null }));
  };

  return (
    <div style={{
      marginBottom: 'var(--space-lg)',
      padding: 'var(--space-md)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-muted)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
        Required Attachments
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
        Each required document has a designated upload field.
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {requiredAttachments.map((attachment, index) => {
          const key = attachment.id || attachment.key || attachment.label || `required_${index}`;
          const selectedFile = filesByKey[key];
          const accept = Array.isArray(attachment.fileTypes) ? attachment.fileTypes.join(',') : undefined;

          return (
            <div key={key} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                {attachment.label} <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <HiOutlineArrowUpTray /> Upload
                  <input
                    type="file"
                    accept={accept}
                    style={{ display: 'none' }}
                    onChange={(e) => setFileForKey(key, e.target.files)}
                  />
                </label>
                {selectedFile ? (
                  <>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedFile.name}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => clearFileForKey(key)} title="Remove file">
                      <HiOutlineTrash />
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No file selected</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Template Selection Modal ── */
function TemplateSelectionModal({ isOpen, onClose, user, formTemplates, onSelectTemplate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Combine Firestore templates with prebuilt ones (prebuilt as fallback)
  const allTemplates = useMemo(() => {
    const fsMap = new Map(formTemplates.map(t => [t.slug, t]));
    const combined = [];
    // Firestore templates take priority
    formTemplates.forEach(t => combined.push(t));
    // Add prebuilt templates not in Firestore
    ALL_PREBUILT_TEMPLATES.forEach(t => {
      if (!fsMap.has(t.slug)) combined.push(t);
    });
    return combined;
  }, [formTemplates]);

  // Filter by role – only show templates this role can initiate
  const available = useMemo(() => {
    return allTemplates.filter(t => {
      if (!t.initiatorRoles?.includes(user.role) && user.role !== 'admin') return false;
      const matchSearch = !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [allTemplates, user.role, searchTerm, selectedCategory]);

  const categories = [...new Set(allTemplates.map(t => t.category).filter(Boolean))];

  const handleClose = () => { setSearchTerm(''); setSelectedCategory('all'); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Select Form Template" large>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div className="search-container" style={{ flex: 1 }}>
            <HiOutlineMagnifyingGlass className="search-icon" />
            <input className="search-input" placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="form-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: 'auto', minWidth: 150 }}>
            <option value="all">All categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="new-request-type-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {available.length === 0 ? (
          <EmptyState icon={<HiOutlineDocumentText />} title="No templates available" description="No form templates match your search or role." />
        ) : (
          available.map((t) => (
            <div
              key={t.slug}
              className="new-request-type-card"
              onClick={() => { onSelectTemplate(t); handleClose(); }}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ fontSize: 24, color: 'var(--uwc-navy)' }}><HiOutlineDocumentText /></div>
              <h4 style={{ fontSize: 13, margin: '6px 0 2px' }}>{t.name}</h4>
              {t.description && <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>{t.description}</p>}
              {t.category && (
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'var(--bg-muted)', color: 'var(--text-tertiary)', marginTop: 4, display: 'inline-block' }}>
                  {t.category}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
