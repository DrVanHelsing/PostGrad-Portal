// ============================================
// AnnotatedDocViewer – Full-screen document viewer
// with PDF text selection, inline annotation,
// and highlight/comment overlay.
// ============================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './AnnotatedDocViewer.css';
import {
  subscribeToAnnotations,
  createAnnotation,
  addAnnotationReply,
  toggleAnnotationResolved,
  deleteAnnotation,
  confirmAndSendAnnotations,
} from '../firebase/annotations';
import { useData } from '../context/DataContext';
import { sendEmail } from '../services/emailService';
import {
  HiOutlineXMark, HiOutlineArrowDown, HiOutlineChevronLeft,
  HiOutlineChevronRight, HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle, HiOutlinePencilSquare,
  HiOutlineTrash, HiOutlinePaperAirplane,
  HiOutlineBookmarkSquare, HiOutlineArrowPath,
  HiOutlineDocumentText, HiOutlineMinus, HiOutlinePlus,
  HiOutlineEyeSlash, HiOutlineEye,
} from 'react-icons/hi2';

// Configure pdf.js worker – use local copy from node_modules (Vite resolves this)
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/* ── Color palette for highlights ── */
const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#ffd43b' },
  { label: 'Green', value: '#69db7c' },
  { label: 'Blue', value: '#74c0fc' },
  { label: 'Pink', value: '#ffa8a8' },
  { label: 'Purple', value: '#d0bfff' },
  { label: 'Orange', value: '#ffc078' },
];

const ROLE_COLORS = {
  supervisor: { bg: '#eff6ff', color: '#1d4ed8', label: 'Supervisor' },
  coordinator: { bg: '#f0fdf4', color: '#15803d', label: 'Coordinator' },
  admin: { bg: '#fef3c7', color: '#b45309', label: 'Admin' },
  student: { bg: '#f5f3ff', color: '#7c3aed', label: 'Student' },
};

/* Color name → hex mapping (for embedded annotation seed data) */
const EMBED_COLOR_MAP = { yellow: '#ffd43b', green: '#69db7c', blue: '#74c0fc', red: '#ffa8a8', pink: '#ffc9c9', orange: '#ffa94d' };

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
  if (!targetName) return true;
  if (!annotationName) return true;  // No documentName → include (match all)
  const ann = normalizeDocName(annotationName);
  const tgt = normalizeDocName(targetName);
  if (!ann) return true;
  if (!tgt) return true;
  const annBase = toDocBase(annotationName);
  const tgtBase = toDocBase(targetName);

  return ann === tgt || annBase === tgtBase || (annBase && tgtBase && (ann.includes(tgtBase) || tgt.includes(annBase)));
}

function prefersVersionMatch(annotation, versionId) {
  if (!versionId) return true;
  if (!annotation?.versionId) return true;
  return annotation.versionId === versionId;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

/* ══════════════════════════════════════════
   MAIN COMPONENT: AnnotatedDocViewer
   ══════════════════════════════════════════ */
export default function AnnotatedDocViewer({
  doc,
  versionId,
  requestId,
  user,
  onClose,
}) {
  const { addNotification, getUserById, mockHDRequests, getThesisSubmissionById } = useData();

  // Log all props on mount for debugging
  useEffect(() => {
    console.warn('[AnnotatedDocViewer] MOUNTED with props:', {
      docName: doc?.name,
      docUrl: doc?.url?.slice(0, 60),
      versionId,
      requestId,
      userRole: user?.role,
      userId: user?.id,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pdfError, setPdfError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [textLayerRendered, setTextLayerRendered] = useState(0);

  // Annotations
  const [firestoreAnnotations, setFirestoreAnnotations] = useState([]);
  const [annotationsError, setAnnotationsError] = useState(null);
  const [activeAnnotation, setActiveAnnotation] = useState(null);
  const [focusedAnnotation, setFocusedAnnotation] = useState(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('annotations'); // 'annotations' | 'new'

  // Selection / new annotation
  const [selectedText, setSelectedText] = useState('');
  const [selectionPage, setSelectionPage] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [highlightColor, setHighlightColor] = useState('#ffd43b');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSelectionPopover, setShowSelectionPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  // Batch confirm/send state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const requestFallbackTriedRef = useRef(false);

  const viewerRef = useRef(null);
  const pdfContainerRef = useRef(null);

  const focusAnnotationInView = useCallback((rect) => {
    if (!rect || !pdfContainerRef.current) return;
    pdfContainerRef.current.scrollTo({
      top: Math.max(0, rect.top - 120),
      left: Math.max(0, rect.left - 40),
      behavior: 'smooth',
    });
  }, []);

  const handleSelectAnnotation = useCallback((annotation) => {
    const next = annotation.id === activeAnnotation ? null : annotation.id;
    setActiveAnnotation(next);
    if (next) {
      setFocusedAnnotation(annotation.id);
      if (annotation.pageNumber && annotation.pageNumber !== currentPage) {
        setCurrentPage(annotation.pageNumber);
      }
    }
  }, [activeAnnotation, currentPage]);

  useEffect(() => {
    if (!focusedAnnotation) return;
    const timer = setTimeout(() => setFocusedAnnotation(null), 1500);
    return () => clearTimeout(timer);
  }, [focusedAnnotation]);

  const ext = doc.name?.split('.').pop()?.toLowerCase();
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);

  const canAnnotate = user?.role === 'supervisor' || user?.role === 'coordinator' || user?.role === 'admin';

  // Validated PDF URL — ensures we never feed HTML to pdf.js
  const [validatedPdfUrl, setValidatedPdfUrl] = useState(null);

  useEffect(() => {
    if (!isPdf || !doc.url) return;
    let cancelled = false;

    (async () => {
      try {
        // blob: and data: URLs are already in-memory, pass through
        if (doc.url.startsWith('blob:') || doc.url.startsWith('data:')) {
          if (!cancelled) setValidatedPdfUrl(doc.url);
          return;
        }

        const resp = await fetch(doc.url);
        const ct = resp.headers.get('content-type') || '';

        // If the server returned HTML, the file probably doesn't exist
        if (ct.includes('text/html')) {
          console.warn('[AnnotatedDocViewer] URL returned HTML instead of PDF:', doc.url);
          if (!cancelled) {
            setPdfError('Document file not found on server.');
            setPdfLoading(false);
          }
          return;
        }

        // Convert to blob URL so react-pdf doesn't re-fetch
        const blob = await resp.blob();
        if (!cancelled) setValidatedPdfUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error('[AnnotatedDocViewer] Failed to pre-fetch PDF:', err);
        // Fall back to letting react-pdf attempt the URL directly
        if (!cancelled) setValidatedPdfUrl(doc.url);
      }
    })();

    return () => { cancelled = true; };
  }, [doc.url, isPdf]);

  /* ── Subscribe to annotations from Firestore 'annotations' collection ── */
  useEffect(() => {
    if (!versionId || !doc.name) {
      console.warn('[Annotations] Subscription skipped — missing:', { versionId, docName: doc.name });
      return;
    }
    requestFallbackTriedRef.current = false;
    console.warn('[Annotations] Subscribing →', { versionId, docName: doc.name });
    setAnnotationsError(null);
    let unsub;
    let receivedSnapshot = false;
    let cancelled = false;

    const tryRequestIdFallback = async () => {
      if (requestFallbackTriedRef.current || !requestId || !doc.name || cancelled) return;
      requestFallbackTriedRef.current = true;
      try {
        const { collection: fbCollection, query: fbQuery, where: fbWhere, getDocs: fbGetDocs } = await import('firebase/firestore');
        const { db: fbDb } = await import('../firebase/config');
        const rq = fbQuery(
          fbCollection(fbDb, 'annotations'),
          fbWhere('requestId', '==', requestId)
        );
        const reqSnap = await fbGetDocs(rq);
        const reqMatches = reqSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(a => isDocumentMatch(a.documentName, doc.name))
          .filter(a => prefersVersionMatch(a, versionId));

        console.warn('[Annotations] requestId fallback →', reqMatches.length, 'annotations');
        if (!cancelled && reqMatches.length > 0) {
          setFirestoreAnnotations(reqMatches);
        }
      } catch (fallbackErr) {
        console.error('[Annotations] requestId fallback failed →', fallbackErr);
      }
    };

    try {
      unsub = subscribeToAnnotations(
        versionId,
        doc.name,
        (anns) => {
          receivedSnapshot = true;
          console.warn('[Annotations] Firestore snapshot →', anns.length, 'annotations');
          setFirestoreAnnotations(anns);
          if (anns.length === 0) {
            void tryRequestIdFallback();
          }
        },
        (err) => {
          receivedSnapshot = true;
          console.error('[Annotations] Subscription error →', err);
          setAnnotationsError(err.message || String(err));
        }
      );
    } catch (err) {
      console.error('[Annotations] Subscription setup failed →', err);
      setAnnotationsError(err.message || String(err));
    }

    // Fallback: If onSnapshot hasn't called back within 3s, try one-shot getDocs
    const fallbackTimer = setTimeout(async () => {
      if (receivedSnapshot) return;
      console.warn('[Annotations] onSnapshot fallback — trying getDocs...');
      try {
        const { collection: fbCollection, query: fbQuery, where: fbWhere, getDocs: fbGetDocs } = await import('firebase/firestore');
        const { db: fbDb } = await import('../firebase/config');
        const q = fbQuery(
          fbCollection(fbDb, 'annotations'),
          fbWhere('versionId', '==', versionId)
        );
        const snap = await fbGetDocs(q);
        const results = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(a => isDocumentMatch(a.documentName, doc.name));
        console.warn('[Annotations] getDocs fallback →', results.length, 'annotations');
        if (results.length > 0) {
          setFirestoreAnnotations(results);
        } else {
          await tryRequestIdFallback();
        }
      } catch (fbErr) {
        console.error('[Annotations] getDocs fallback failed →', fbErr);
        await tryRequestIdFallback();
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      if (unsub) unsub();
    };
  }, [versionId, doc.name, requestId]);

  /* ── Merge Firestore annotations with embedded annotations from the submission ── */
  const annotations = useMemo(() => {
    // Start with Firestore annotations (these have properly mapped fields)
    const merged = new Map();
    for (const a of firestoreAnnotations) merged.set(a.id, a);

    // Look up embedded annotations from the thesis submission
    let embeddedFound = 0;
    if (requestId && getThesisSubmissionById) {
      const sub = getThesisSubmissionById(requestId);
      if (sub?.annotations && Array.isArray(sub.annotations)) {
        // Build a lookup: versionId → first document name for enriching embedded annotations
        const versionDocNameMap = {};
        toArray(sub.versions).forEach(v => {
          const docs = toArray(v.documents);
          if (docs.length > 0) {
            versionDocNameMap[v.id] = docs[0].name;
          }
        });

        for (const raw of sub.annotations) {
          // Only include annotations for the current versionId
          if (versionId && raw.versionId && raw.versionId !== versionId) continue;
          embeddedFound++;
          // Skip if we already have this from Firestore (Firestore wins)
          if (merged.has(raw.id)) continue;

          // Determine document name: use explicit field, else lookup from version, else current doc
          const resolvedDocName = raw.documentName || raw.docName || versionDocNameMap[raw.versionId] || doc.name;

          // Map field names:  page → pageNumber,  color → highlightColor
          merged.set(raw.id, {
            ...raw,
            pageNumber: raw.pageNumber || raw.page || 1,
            highlightColor: raw.highlightColor || (raw.color?.startsWith('#') ? raw.color : EMBED_COLOR_MAP[raw.color] || '#ffd43b'),
            resolved: raw.resolved ?? (raw.status === 'resolved'),
            documentName: resolvedDocName,
            requestId: raw.requestId || requestId,
            replies: raw.replies || [],
          });
        }
      }
      console.warn('[Annotations] Merge →', {
        firestoreCount: firestoreAnnotations.length,
        embeddedForVersion: embeddedFound,
        totalMerged: merged.size,
        requestId,
        subFound: !!sub,
        subAnnotationsCount: sub?.annotations?.length || 0,
      });
    } else {
      console.warn('[Annotations] Merge → no requestId or getThesisSubmissionById', { requestId, hasFn: !!getThesisSubmissionById });
    }

    return Array.from(merged.values())
      .sort((a, b) => {
        const da = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const db2 = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return da - db2;
      });
  }, [firestoreAnnotations, requestId, versionId, doc.name, getThesisSubmissionById]);

  /* ── PDF load handlers ── */
  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n);
    setPdfLoading(false);
    setPdfError(null);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error('PDF load error:', error);
    setPdfError(error.message || 'Failed to load PDF');
    setPdfLoading(false);
  }, []);

  /* ── Text selection handler ── */
  const handleTextSelection = useCallback(() => {
    if (!canAnnotate) {
      console.warn('[Annotations] Text selection ignored — canAnnotate is false (role:', user?.role, ')');
      return;
    }
    const selection = window.getSelection();
    const text = selection?.toString()?.trim();
    if (!text || text.length < 2) {
      setShowSelectionPopover(false);
      return;
    }
    console.warn('[Annotations] Text selected:', text.slice(0, 40), '...');
    setSelectedText(text);

    // Determine which page the selection is in
    const anchorNode = selection.anchorNode;
    let pageEl = anchorNode?.parentElement;
    while (pageEl && !pageEl.classList?.contains('react-pdf__Page')) {
      pageEl = pageEl.parentElement;
    }
    const pageNum = pageEl ? parseInt(pageEl.getAttribute('data-page-number'), 10) : currentPage;
    setSelectionPage(pageNum || currentPage);

    // Calculate popover position
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = pdfContainerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    setPopoverPosition({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 10,
    });
    setShowSelectionPopover(true);
  }, [canAnnotate, currentPage]);

  /* ── Listen for mouseup on PDF container ── */
  useEffect(() => {
    const container = pdfContainerRef.current;
    if (!container || !isPdf) return;
    container.addEventListener('mouseup', handleTextSelection);
    return () => container.removeEventListener('mouseup', handleTextSelection);
  }, [handleTextSelection, isPdf]);

  /* ── Dismiss popover on click outside ── */
  useEffect(() => {
    const handleClick = (e) => {
      if (showSelectionPopover && !e.target.closest('.selection-popover')) {
        setShowSelectionPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSelectionPopover]);

  /* ── Create annotation ── */
  const handleCreateAnnotation = async () => {
    if (!selectedText || !newComment.trim()) return;
    setIsSubmitting(true);
    console.warn('[Annotations] Creating annotation →', { versionId, requestId, docName: doc.name, selectedText: selectedText.slice(0, 30), pageNumber: selectionPage });
    try {
      await createAnnotation({
        versionId,
        requestId,
        documentName: doc.name,
        selectedText,
        comment: newComment.trim(),
        pageNumber: selectionPage,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        highlightColor,
      });
      console.warn('[Annotations] Annotation created successfully');
      setSelectedText('');
      setNewComment('');
      setShowSelectionPopover(false);
      setSidebarTab('annotations');
    } catch (err) {
      console.error('Create annotation error:', err);
      setAnnotationsError('Failed to save annotation: ' + (err.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Submit from popover (quick) ── */
  const handlePopoverAnnotate = () => {
    setSidebarTab('new');
    setShowSelectionPopover(false);
    setShowAnnotations(true);
  };

  /* ── Reply to annotation ── */
  const handleReply = async (annotationId) => {
    if (!replyText.trim()) return;
    try {
      await addAnnotationReply(annotationId, {
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        text: replyText.trim(),
      });
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Reply error:', err);
    }
  };

  /* ── Toggle resolved ── */
  const handleToggleResolved = async (annotation) => {
    try {
      await toggleAnnotationResolved(annotation.id, !annotation.resolved);
    } catch (err) {
      console.error('Toggle resolved error:', err);
    }
  };

  /* ── Delete annotation ── */
  const handleDelete = async (annotationId) => {
    try {
      await deleteAnnotation(annotationId);
      if (activeAnnotation === annotationId) setActiveAnnotation(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  /* ── Page annotations (filtered by current page) ── */
  const pageAnnotations = useMemo(
    () => annotations.filter(a => !a.pageNumber || a.pageNumber === currentPage),
    [annotations, currentPage]
  );

  const unresolvedCount = annotations.filter(a => !a.resolved).length;
  const draftCount = annotations.filter(a => a.status === 'draft').length;

  /* ── Confirm & Send all draft annotations ── */
  const handleConfirmSend = async () => {
    setIsSending(true);
    try {
      const sent = await confirmAndSendAnnotations(versionId, doc.name);
      if (sent.length > 0) {
        // Find the student associated with this request
        const hdRequest = mockHDRequests.find(r => r.id === requestId);
        const studentId = hdRequest?.studentId || 'student-001';
        const student = getUserById(studentId);

        const studentNotifTitle = 'New Annotations on Your Document';
        const studentNotifMsg = `${user.name} has added ${sent.length} annotation${sent.length !== 1 ? 's' : ''} on "${doc.name}". Please review and address the feedback.`;

        addNotification(studentId, studentNotifTitle, studentNotifMsg, 'info', `/requests/${requestId}/review`);

        // Send email notification
        if (student?.email) {
          await sendEmail({
            toEmail: student.email,
            toName: student.name || hdRequest?.studentName || 'Student',
            subject: `New Annotations: ${doc.name}`,
            message: `${user.name} (${user.role}) has sent ${sent.length} annotation${sent.length !== 1 ? 's' : ''} on "${doc.name}" for request ${requestId}.\n\nPlease log in to the PostGrad Portal to review the feedback and address any comments.`,
            actionUrl: `${window.location.origin}/requests/${requestId}/review`,
            actionText: 'Review Annotations',
          });
        }
      }
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Confirm send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  /* ── Key handlers ── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentPage > 1) setCurrentPage(p => p - 1);
      if (e.key === 'ArrowRight' && numPages && currentPage < numPages) setCurrentPage(p => p + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, currentPage, numPages]);

  /* ── Render ── */
  const content = (
    <div className="adv-overlay" ref={viewerRef}>
      {/* Header */}
      <div className="adv-header">
        <div className="adv-header-left">
          <h3 className="adv-title">{doc.name}</h3>
          {isPdf && numPages && (
            <span className="adv-page-info">
              Page {currentPage} of {numPages}
            </span>
          )}
          {annotations.length > 0 && (
            <span className="adv-annotation-badge">
              <HiOutlineBookmarkSquare /> {unresolvedCount} annotation{unresolvedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="adv-header-actions">
          {isPdf && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setScale(s => Math.max(0.5, s - 0.2))} title="Zoom out">
                <HiOutlineMinus />
              </button>
              <span className="adv-zoom-label">{Math.round(scale * 100)}%</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setScale(s => Math.min(3, s + 0.2))} title="Zoom in">
                <HiOutlinePlus />
              </button>
            </>
          )}
          <button
            className={`btn btn-ghost btn-sm ${showAnnotations ? 'active' : ''}`}
            onClick={() => setShowAnnotations(!showAnnotations)}
            title={showAnnotations ? 'Hide annotations panel' : 'Show annotations panel'}
          >
            {showAnnotations ? <HiOutlineEyeSlash /> : <HiOutlineChatBubbleLeftRight />}
          </button>
          {doc.url && (
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" title="Download">
              <HiOutlineArrowDown />
            </a>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose} title="Close (Esc)">
            <HiOutlineXMark />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="adv-body">
        {/* Document area */}
        <div className="adv-document" ref={pdfContainerRef}>
          {isPdf ? (
            <>
              {pdfLoading && (
                <div className="adv-loading">
                  <div className="adv-spinner" />
                  <p>Loading document...</p>
                </div>
              )}
              {pdfError ? (
                <div className="adv-error">
                  <HiOutlineDocumentText style={{ fontSize: 48 }} />
                  <p>Cannot preview this PDF</p>
                  <span className="adv-error-detail">{pdfError}</span>
                  {doc.url && (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                      <HiOutlineArrowDown /> Download Instead
                    </a>
                  )}
                </div>
              ) : validatedPdfUrl ? (
                <Document
                  file={validatedPdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading=""
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    onRenderTextLayerSuccess={() => setTextLayerRendered(c => c + 1)}
                  />
                </Document>
              ) : null}

              {/* Selection popover */}
              {showSelectionPopover && (
                <div
                  className="selection-popover"
                  style={{ left: popoverPosition.x, top: popoverPosition.y }}
                >
                  <button className="selection-popover-btn" onClick={handlePopoverAnnotate}>
                    <HiOutlinePencilSquare /> Annotate
                  </button>
                </div>
              )}

              {/* Page navigation */}
              {numPages && numPages > 1 && (
                <div className="adv-page-nav">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <HiOutlineChevronLeft />
                  </button>
                  <input
                    type="number"
                    className="adv-page-input"
                    value={currentPage}
                    min={1}
                    max={numPages}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (v >= 1 && v <= numPages) setCurrentPage(v);
                    }}
                  />
                  <span className="adv-page-sep">/ {numPages}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                    disabled={currentPage >= numPages}
                  >
                    <HiOutlineChevronRight />
                  </button>
                </div>
              )}

              {/* Highlight overlays on text layer */}
              {showAnnotations && pageAnnotations.map(ann => (
                <HighlightOverlay
                  key={ann.id}
                  annotation={ann}
                  isActive={activeAnnotation === ann.id}
                  isFocused={focusedAnnotation === ann.id}
                  onFocusRect={focusAnnotationInView}
                  onClick={() => handleSelectAnnotation(ann)}
                  containerRef={pdfContainerRef}
                  textLayerRendered={textLayerRendered}
                />
              ))}
            </>
          ) : isImage ? (
            <div className="adv-image-container">
              <img src={doc.url} alt={doc.name} className="adv-image" />
            </div>
          ) : (
            <div className="adv-fallback">
              <HiOutlineDocumentText style={{ fontSize: 64, color: 'var(--text-tertiary)' }} />
              <p>Preview not available for .{ext} files</p>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
                Download the file to view and annotate it
              </span>
              {doc.url && (
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <HiOutlineArrowDown /> Download to View
                </a>
              )}
            </div>
          )}
        </div>

        {/* Annotations sidebar */}
        {showAnnotations && (
          <div className="adv-sidebar">
            {/* Sidebar tabs */}
            <div className="adv-sidebar-tabs">
              <button
                className={`adv-sidebar-tab ${sidebarTab === 'annotations' ? 'active' : ''}`}
                onClick={() => setSidebarTab('annotations')}
              >
                <HiOutlineChatBubbleLeftRight /> Annotations ({annotations.length})
                {draftCount > 0 && <span className="adv-draft-count">{draftCount}</span>}
              </button>
              {canAnnotate && (
                <button
                  className={`adv-sidebar-tab ${sidebarTab === 'new' ? 'active' : ''}`}
                  onClick={() => setSidebarTab('new')}
                >
                  <HiOutlinePencilSquare /> New
                </button>
              )}
            </div>

            <div className="adv-sidebar-content">
              {/* Show Firestore errors prominently */}
              {annotationsError && (
                <div style={{ padding: '8px 10px', margin: '0 0 8px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12, color: '#dc2626' }}>
                  <strong>⚠ Annotation Error:</strong> {annotationsError}
                </div>
              )}

              {/* Debug diagnostics (dev only) */}
              {import.meta.env.DEV && (
                <details style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--text-tertiary)' }}>
                  <summary style={{ cursor: 'pointer', padding: '4px 0' }}>🔍 Debug Info</summary>
                  <div style={{ padding: '6px 8px', background: 'var(--bg-muted, #f9fafb)', borderRadius: 4, lineHeight: 1.6 }}>
                    <div><strong>versionId:</strong> {versionId || '(none)'}</div>
                    <div><strong>doc.name:</strong> {doc.name || '(none)'}</div>
                    <div><strong>requestId:</strong> {requestId || '(none)'}</div>
                    <div><strong>Firestore:</strong> {firestoreAnnotations.length} annotations</div>
                    <div><strong>Merged:</strong> {annotations.length} total</div>
                    <div><strong>canAnnotate:</strong> {canAnnotate ? 'Yes' : `No (role: ${user?.role})`}</div>
                    <div><strong>Page:</strong> {currentPage} / {numPages || '?'}</div>
                    <div><strong>Error:</strong> {annotationsError || 'none'}</div>
                    <button
                      style={{ marginTop: 4, fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}
                      onClick={async () => {
                        try {
                          const { collection: c, getDocs: gd } = await import('firebase/firestore');
                          const { db: d } = await import('../firebase/config');
                          const snap = await gd(c(d, 'annotations'));
                          const all = snap.docs.map(x => ({ id: x.id, vId: x.data().versionId, dn: x.data().documentName }));
                          console.warn('[DEBUG] ALL annotations in Firestore:', all);
                          alert(`Firestore has ${all.length} total annotations.\nCheck console for details.\n\nLooking for versionId="${versionId}" + docName="${doc.name}":\n→ ${all.filter(a => a.vId === versionId && a.dn === doc.name).length} matches`);
                        } catch (e) {
                          alert('Firestore test FAILED: ' + e.message);
                          console.error('[DEBUG] Firestore test error:', e);
                        }
                      }}
                    >
                      🧪 Test Firestore Query
                    </button>
                  </div>
                </details>
              )}

              {sidebarTab === 'annotations' ? (
                annotations.length === 0 ? (
                  <div className="adv-empty-annotations">
                    <HiOutlineBookmarkSquare style={{ fontSize: 36, color: 'var(--text-tertiary)' }} />
                    <p>No annotations yet</p>
                    {canAnnotate && (
                      <span>Select text in the PDF to add annotations</span>
                    )}
                  </div>
                ) : (
                  <div className="adv-annotation-list">
                    {annotations.map(ann => (
                      <AnnotationCard
                        key={ann.id}
                        annotation={ann}
                        isActive={activeAnnotation === ann.id}
                        canAnnotate={canAnnotate}
                        currentUserId={user?.id}
                        onClick={() => {
                          handleSelectAnnotation(ann);
                        }}
                        onReply={() => setReplyingTo(ann.id)}
                        onToggleResolved={() => handleToggleResolved(ann)}
                        onDelete={() => handleDelete(ann.id)}
                        replyingTo={replyingTo}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        onSubmitReply={() => handleReply(ann.id)}
                      />
                    ))}
                  </div>
                )
              ) : (
                /* New annotation form */
                <div className="adv-new-annotation">
                  {selectedText ? (
                    <>
                      <div className="adv-selected-quote">
                        <span className="adv-quote-label">Selected text:</span>
                        <blockquote className="adv-quote-text" style={{ borderLeftColor: highlightColor }}>
                          {selectedText.length > 200 ? selectedText.slice(0, 200) + '…' : selectedText}
                        </blockquote>
                        {selectionPage && (
                          <span className="adv-quote-page">Page {selectionPage}</span>
                        )}
                      </div>

                      <div className="adv-color-picker">
                        <span className="adv-color-label">Highlight color:</span>
                        <div className="adv-color-options">
                          {HIGHLIGHT_COLORS.map(c => (
                            <button
                              key={c.value}
                              className={`adv-color-swatch ${highlightColor === c.value ? 'active' : ''}`}
                              style={{ background: c.value }}
                              onClick={() => setHighlightColor(c.value)}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="adv-comment-input-group">
                        <label className="adv-comment-label">Your comment:</label>
                        <textarea
                          className="adv-comment-textarea"
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          placeholder="Add your feedback about this text..."
                          rows={4}
                        />
                      </div>

                      <div className="adv-new-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => { setSelectedText(''); setNewComment(''); }}
                        >
                          Clear
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleCreateAnnotation}
                          disabled={!newComment.trim() || isSubmitting}
                        >
                          {isSubmitting ? <HiOutlineArrowPath className="spin" /> : <HiOutlinePaperAirplane />}
                          {isSubmitting ? 'Saving...' : 'Add Annotation'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="adv-no-selection">
                      <HiOutlinePencilSquare style={{ fontSize: 36, color: 'var(--text-tertiary)' }} />
                      <p>Select text in the document</p>
                      <span>Highlight a passage of text in the PDF to create an annotation. Your comment will be linked to the selected text.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Review & Send footer */}
            {canAnnotate && draftCount > 0 && (
              <div className="adv-sidebar-footer">
                <button
                  className="adv-send-all-btn"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSending}
                >
                  <HiOutlinePaperAirplane />
                  Review &amp; Send ({draftCount} draft{draftCount !== 1 ? 's' : ''})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm send modal */}
      {showConfirmModal && (
        <div className="adv-confirm-overlay" onClick={() => !isSending && setShowConfirmModal(false)}>
          <div className="adv-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="adv-confirm-title">
              <HiOutlinePaperAirplane /> Send Annotations to Student
            </h3>
            <p className="adv-confirm-desc">
              You have <strong>{draftCount}</strong> draft annotation{draftCount !== 1 ? 's' : ''} on <strong>{doc.name}</strong>.
              Sending will notify the student via in-app notification and email.
            </p>
            <div className="adv-confirm-list">
              {annotations.filter(a => a.status === 'draft').map(ann => (
                <div className="adv-confirm-item" key={ann.id}>
                  <span className="adv-confirm-item-quote">
                    &ldquo;{ann.selectedText?.length > 80 ? ann.selectedText.slice(0, 80) + '…' : ann.selectedText}&rdquo;
                  </span>
                  <span className="adv-confirm-item-comment">{ann.comment}</span>
                  {ann.pageNumber && <span className="adv-confirm-item-page">p.{ann.pageNumber}</span>}
                </div>
              ))}
            </div>
            <div className="adv-confirm-actions">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleConfirmSend}
                disabled={isSending}
              >
                {isSending ? <HiOutlineArrowPath className="spin" /> : <HiOutlinePaperAirplane />}
                {isSending ? 'Sending…' : `Confirm & Send (${draftCount})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render as a portal to avoid stacking context issues
  return createPortal(content, document.body);
}


/* ══════════════════════════════════════════
   SUB-COMPONENT: AnnotationCard
   ══════════════════════════════════════════ */
function AnnotationCard({
  annotation,
  isActive,
  canAnnotate,
  currentUserId,
  onClick,
  onReply,
  onToggleResolved,
  onDelete,
  replyingTo,
  replyText,
  setReplyText,
  onSubmitReply,
}) {
  const roleStyle = ROLE_COLORS[annotation.authorRole] || ROLE_COLORS.student;
  const isOwn = annotation.authorId === currentUserId;
  const timeStr = annotation.createdAt instanceof Date
    ? annotation.createdAt.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className={`adv-annotation-card ${isActive ? 'active' : ''} ${annotation.resolved ? 'resolved' : ''} ${annotation.status === 'draft' ? 'draft' : ''}`}
      onClick={onClick}
    >
      <div className="adv-ann-header">
        <div className="adv-ann-author">
          <span className="adv-ann-avatar" style={{ background: roleStyle.bg, color: roleStyle.color }}>
            {annotation.authorName?.charAt(0)}
          </span>
          <div>
            <span className="adv-ann-name">{annotation.authorName}</span>
            <span className="adv-ann-role" style={{ color: roleStyle.color }}>{roleStyle.label}</span>
          </div>
        </div>
        <div className="adv-ann-badges">
          {annotation.status === 'draft' && (
            <span className="adv-ann-draft-badge"><HiOutlinePencilSquare /> Draft</span>
          )}
          {annotation.resolved && (
            <span className="adv-ann-resolved-badge"><HiOutlineCheckCircle /> Resolved</span>
          )}
        </div>
      </div>

      <blockquote className="adv-ann-quote" style={{ borderLeftColor: annotation.highlightColor || '#ffd43b' }}>
        {annotation.selectedText?.length > 120
          ? annotation.selectedText.slice(0, 120) + '…'
          : annotation.selectedText}
      </blockquote>

      <p className="adv-ann-comment">{annotation.comment}</p>

      <div className="adv-ann-meta">
        <span>{timeStr}</span>
        {annotation.pageNumber && <span>Page {annotation.pageNumber}</span>}
      </div>

      {/* Replies */}
      {annotation.replies?.length > 0 && (
        <div className="adv-ann-replies">
          {annotation.replies.map(reply => {
            const rStyle = ROLE_COLORS[reply.authorRole] || ROLE_COLORS.student;
            const rTime = reply.createdAt instanceof Date
              ? reply.createdAt.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : '';
            return (
              <div key={reply.id} className="adv-ann-reply">
                <div className="adv-ann-reply-header">
                  <span className="adv-ann-avatar sm" style={{ background: rStyle.bg, color: rStyle.color }}>
                    {reply.authorName?.charAt(0)}
                  </span>
                  <span className="adv-ann-reply-name">{reply.authorName}</span>
                  <span className="adv-ann-reply-time">{rTime}</span>
                </div>
                <p className="adv-ann-reply-text">{reply.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      {isActive && (
        <div className="adv-ann-actions" onClick={e => e.stopPropagation()}>
          <button className="adv-ann-action-btn" onClick={onReply} title="Reply">
            <HiOutlineChatBubbleLeftRight /> Reply
          </button>
          {canAnnotate && (
            <button className="adv-ann-action-btn" onClick={onToggleResolved} title={annotation.resolved ? 'Unresolve' : 'Resolve'}>
              <HiOutlineCheckCircle /> {annotation.resolved ? 'Reopen' : 'Resolve'}
            </button>
          )}
          {(isOwn || canAnnotate) && (
            <button className="adv-ann-action-btn danger" onClick={onDelete} title="Delete">
              <HiOutlineTrash />
            </button>
          )}
        </div>
      )}

      {/* Reply input */}
      {replyingTo === annotation.id && (
        <div className="adv-ann-reply-input" onClick={e => e.stopPropagation()}>
          <textarea
            className="adv-comment-textarea sm"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            autoFocus
          />
          <div className="adv-ann-reply-actions">
            <button className="btn btn-ghost btn-xs" onClick={() => { setReplyText(''); onReply(); }}>Cancel</button>
            <button className="btn btn-primary btn-xs" onClick={onSubmitReply} disabled={!replyText.trim()}>
              <HiOutlinePaperAirplane /> Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════
   SUB-COMPONENT: HighlightOverlay
   Searches for matching text in the PDF text
   layer and draws a colored highlight box.
   ══════════════════════════════════════════ */
function HighlightOverlay({ annotation, isActive, isFocused, onFocusRect, onClick, containerRef, textLayerRendered }) {
  const [rects, setRects] = useState([]);

  useEffect(() => {
    if (!containerRef.current || !annotation.selectedText) return;

    const findAndHighlight = () => {
      // Try both class names for react-pdf text layer compatibility
      const textLayer = containerRef.current.querySelector(
        `.react-pdf__Page[data-page-number="${annotation.pageNumber || 1}"] .react-pdf__Page__textContent`
      ) || containerRef.current.querySelector(
        `.react-pdf__Page[data-page-number="${annotation.pageNumber || 1}"] .textLayer`
      );
      if (!textLayer) return false;

      const normalizeWithMap = (value) => {
        let normalized = '';
        const map = [];
        let lastWasSpace = false;
        for (let i = 0; i < value.length; i += 1) {
          const raw = value[i];
          const next = /\s/.test(raw) ? ' ' : raw.toLowerCase();
          if (next === ' ') {
            if (lastWasSpace) continue;
            lastWasSpace = true;
          } else {
            lastWasSpace = false;
          }
          normalized += next;
          map.push(i);
        }
        return { normalized: normalized.trim(), map };
      };

      // Find matching text spans
      const spans = textLayer.querySelectorAll('span');
      if (spans.length === 0) return false;
      const { normalized: searchText } = normalizeWithMap(annotation.selectedText || '');
      let foundRects = [];

      // Build a concatenation of all span texts to find the match
      let fullText = '';
      const spanMap = []; // { spanIdx, charStart, charEnd }
      spans.forEach((span, idx) => {
        const start = fullText.length;
        const txt = span.textContent || '';
        fullText += txt;
        spanMap.push({ idx, start, end: start + txt.length, span });
      });

      const { normalized: normalizedFull, map: normalizedMap } = normalizeWithMap(fullText);
      const matchIdx = normalizedFull.indexOf(searchText);
      if (matchIdx !== -1 && searchText.length > 0) {
        // Find which spans overlap with the match
        const matchEnd = matchIdx + searchText.length - 1;
        const rawStart = normalizedMap[matchIdx] ?? 0;
        const rawEnd = (normalizedMap[matchEnd] ?? rawStart) + 1;
        const containerRect = containerRef.current.getBoundingClientRect();
        spanMap.forEach(({ start, end, span }) => {
          if (start < rawEnd && end > rawStart) {
            const r = span.getBoundingClientRect();
            foundRects.push({
              left: r.left - containerRect.left + containerRef.current.scrollLeft,
              top: r.top - containerRect.top + containerRef.current.scrollTop,
              width: r.width,
              height: r.height,
            });
          }
        });
      }
      setRects(foundRects);
      if (isActive && foundRects.length > 0) {
        onFocusRect?.(foundRects[0]);
      }
      return true;
    };

    // Short delay after text layer render signal, then retry if needed
    const timer = setTimeout(() => {
      if (!findAndHighlight()) {
        // Retry a few times in case the text layer is still settling
        let retries = 0;
        const retryInterval = setInterval(() => {
          retries++;
          if (findAndHighlight() || retries >= 10) {
            clearInterval(retryInterval);
          }
        }, 200);
        // Clean up retry interval after max wait
        setTimeout(() => clearInterval(retryInterval), 2200);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [annotation, containerRef, isActive, onFocusRect, textLayerRendered]);

  if (rects.length === 0) return null;

  return (
    <>
      {rects.map((rect, i) => (
        <div
          key={i}
          className={`adv-highlight ${isActive ? 'active' : ''}`}
          style={{
            position: 'absolute',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            background: annotation.highlightColor || '#ffd43b',
            opacity: isFocused ? 0.65 : isActive ? 0.5 : 0.3,
            borderRadius: 2,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            pointerEvents: 'all',
            zIndex: 5,
            boxShadow: isFocused ? `0 0 0 2px ${annotation.highlightColor || '#ffd43b'}` : 'none',
          }}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          title={`${annotation.authorName}: ${annotation.comment?.slice(0, 60)}...`}
        />
      ))}
    </>
  );
}
