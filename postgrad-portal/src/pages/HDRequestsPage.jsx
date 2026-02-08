// ============================================
// HD Requests Page – Fully Functional
// ============================================

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardBody, StatusBadge, EmptyState, Modal } from '../components/common';
import SignaturePad from '../components/common/SignaturePad';
import { STATUS_CONFIG, REQUEST_TYPE_LABELS } from '../utils/constants';
import { formatDate, formatRelativeTime } from '../utils/helpers';
import { uploadRequestFiles, getFileUrl } from '../firebase/storage';
import { generateRequestPdf } from '../services/pdfService';
import { uploadPdfBlob } from '../firebase/storage';
import { sendRequestSubmittedEmail, sendRequestApprovedEmail, sendReferredBackEmail, sendFinalApprovalEmail, sendNudgeEmail } from '../services/emailService';
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
    mockHDRequests, getRequestsByStudent, getRequestsForSupervisor,
    getRequestsForCoordinator, getUserById, createHDRequest,
    submitToSupervisor, validateAccessCode, supervisorApprove,
    coSupervisorSign, referBack, forwardToFHD, recordFHDOutcome,
    recordSHDOutcome, resubmitRequest, getStudentProfile,
    updateRequestDocUrls, updateDraftRequest,
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
    showToast('Request submitted to supervisor. Access code generated.');
    // Email: notify supervisor
    const supervisor = getUserById(selectedRequest.supervisorId);
    if (supervisor) {
      sendRequestSubmittedEmail(supervisor.email, supervisor.name, selectedRequest.title, user.name).catch(() => {});
    }
  };

  const handleResubmit = async () => {
    await resubmitRequest(selectedRequest.id, user.id);
    showToast('Request resubmitted to supervisor.');
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
    } else if (signatureAction === 'coSupervisorSign') {
      await coSupervisorSign(selectedRequest.id, user.id, sigData.name);
      showToast('Co-supervisor signature applied. Forwarded to coordinator.');
    } else if (signatureAction === 'coordinatorForward') {
      await forwardToFHD(selectedRequest.id, user.id, sigData.name);
      showToast('Signed and forwarded to the Faculty Board.');
    }
    setSignatureAction(null);
  };

  const handleFHDOutcome = async () => {
    if (!fhdForm.outcome) return;
    await recordFHDOutcome(selectedRequest.id, user.id, fhdForm.outcome, fhdForm.referenceNumber, fhdForm.reason);
    setShowFHDOutcomeModal(false);
    setFhdForm({ outcome: '', referenceNumber: '', reason: '' });
    showToast(`Faculty Board outcome recorded: ${fhdForm.outcome}`);
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
        const pdfUrl = await uploadPdfBlob(pdfBlob, pdfPath);
        await updateRequestDocUrls(selectedRequest.id, { finalPdfUrl: pdfUrl });
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
        const downloadUrl = await getFileUrl(url);
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
      </div>

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

            {/* Review Documents & Version Control button */}
            <div className="request-detail-section" style={{ marginTop: 'var(--space-lg)' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => { setSelectedRequest(null); navigate(`/requests/${selectedRequest.id}/review`); }}
              >
                <HiOutlineClipboardDocumentList /> Review Documents & Version History
              </button>
            </div>

            {/* Supervisor/Coordinator review file upload */}
            {((user.role === 'supervisor' && ['supervisor_review'].includes(selectedRequest.status))
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

      {/* ── New Request Modal ── */}
      <NewRequestModal isOpen={showNewRequestModal} onClose={() => setShowNewRequestModal(false)} user={user} onCreated={(r) => showToast(`Request "${r.title}" created.`)} />
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
          <HiOutlinePaperAirplane /> Submit to Supervisor
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

/* ── New Request Modal ── */
function NewRequestModal({ isOpen, onClose, user, onCreated }) {
  const { createHDRequest, getStudentProfile } = useData();
  const [selectedType, setSelectedType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [creating, setCreating] = useState(false);

  const requestTypes = [
    { key: 'title_registration', label: 'Title Registration', icon: <HiOutlineDocumentText /> },
    { key: 'registration', label: 'Registration', icon: <HiOutlinePlusCircle /> },
    { key: 'progress_report', label: 'Progress Report', icon: <HiOutlineArrowPath /> },
    { key: 'extension', label: 'Extension', icon: <HiOutlineClock /> },
    { key: 'leave_of_absence', label: 'Leave of Absence', icon: <HiOutlineClock /> },
    { key: 'examination_entry', label: 'Examination Entry', icon: <HiOutlineCheckCircle /> },
    { key: 'supervisor_change', label: 'Supervisor Change', icon: <HiOutlinePencilSquare /> },
  ];

  const handleClose = () => { setSelectedType(''); setTitle(''); setDescription(''); setFiles([]); onClose(); };

  const handleCreate = async () => {
    if (!selectedType || !title.trim() || creating) return;
    setCreating(true);
    try {
      const profile = getStudentProfile(user.id);

      // Upload files to Firebase Storage first
      let uploadedDocs = [];
      if (files.length > 0) {
        const tempId = `temp_${Date.now()}`;
        const uploadedFiles = await uploadRequestFiles(files, tempId, 'documents');
        uploadedDocs = uploadedFiles.map(f => ({
          name: f.name,
          size: `${(f.size / 1024).toFixed(0)} KB`,
          url: f.url,
          path: f.path,
          uploadedAt: new Date(),
        }));
      }

      const req = await createHDRequest({
        type: selectedType, title, description,
        studentId: user.id,
        studentName: user.name,
        supervisorId: profile?.supervisorId || 'supervisor-001',
        coordinatorId: 'coordinator-001',
        documents: uploadedDocs,
      });
      onCreated?.(req);
      handleClose();
    } catch (err) {
      console.error('Create request error:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Higher Degrees Request" large
      footer={
        <>
          <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!selectedType || !title.trim() || creating} onClick={handleCreate}>
            <HiOutlinePlusCircle /> {creating ? 'Creating…' : 'Create Request'}
          </button>
        </>
      }
    >
      <div>
        <div className="form-label" style={{ marginBottom: 12 }}>Select request type</div>
        <div className="new-request-type-grid">
          {requestTypes.map((t) => (
            <div key={t.key} className={`new-request-type-card ${selectedType === t.key ? 'selected' : ''}`} onClick={() => setSelectedType(t.key)}>
              <div style={{ fontSize: 24, color: selectedType === t.key ? 'var(--uwc-navy)' : 'var(--text-tertiary)' }}>{t.icon}</div>
              <h4>{t.label}</h4>
            </div>
          ))}
        </div>
        <div className="form-group">
          <label className="form-label">Request Title</label>
          <input className="form-input" placeholder="Enter a descriptive title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" placeholder="Provide details for your request..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Supporting Documents</label>
          <FileUploadZone files={files} onChange={setFiles} hint="Upload research proposals, ethics clearance, progress reports, or other supporting documents" />
        </div>
      </div>
    </Modal>
  );
}
