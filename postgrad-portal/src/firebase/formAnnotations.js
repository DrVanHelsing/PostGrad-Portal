// ============================================
// Form Annotations – Firebase CRUD
// Threaded inline comments on HD request form
// fields and sections during review stages.
// ============================================

import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, Timestamp, arrayUnion,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.FORM_ANNOTATIONS;

/* ── Timestamp normaliser ── */
function normaliseAnnotation(d) {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt || new Date()),
    resolvedAt: data.resolvedAt instanceof Timestamp ? data.resolvedAt.toDate() : data.resolvedAt ?? null,
    replies: (data.replies || []).map((r) => ({
      ...r,
      createdAt: r.createdAt instanceof Timestamp ? r.createdAt.toDate() : (r.createdAt || new Date()),
    })),
  };
}

/**
 * Subscribe to all annotations for a given form submission (real-time).
 * @returns {Function} unsubscribe
 */
export function subscribeToFormAnnotations(submissionId, callback) {
  if (!submissionId) return () => {};
  const q = query(
    collection(db, COL),
    where('submissionId', '==', submissionId),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(normaliseAnnotation));
  });
}

/**
 * Add a brand-new annotation thread on a field or section.
 */
export async function addFormAnnotation({
  submissionId,
  requestId,
  targetType, // 'field' | 'section'
  targetId,
  targetLabel,
  authorId,
  authorName,
  authorRole,
  text,
}) {
  const ref = await addDoc(collection(db, COL), {
    submissionId,
    requestId: requestId || null,
    targetType,
    targetId,
    targetLabel,
    authorId,
    authorName,
    authorRole,
    text,
    createdAt: serverTimestamp(),
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
    replies: [],
  });
  return ref.id;
}

/**
 * Append a reply to an existing annotation thread.
 */
export async function replyToFormAnnotation(annotationId, { authorId, authorName, authorRole, text }) {
  const reply = {
    id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    authorId,
    authorName,
    authorRole,
    text,
    createdAt: Timestamp.now(),
  };
  await updateDoc(doc(db, COL, annotationId), {
    replies: arrayUnion(reply),
  });
  return reply.id;
}

/**
 * Mark an annotation thread as resolved.
 */
export async function resolveFormAnnotation(annotationId, userId) {
  await updateDoc(doc(db, COL, annotationId), {
    resolved: true,
    resolvedBy: userId,
    resolvedAt: serverTimestamp(),
  });
}

/**
 * Re-open a resolved annotation thread.
 */
export async function reopenFormAnnotation(annotationId) {
  await updateDoc(doc(db, COL, annotationId), {
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
  });
}
