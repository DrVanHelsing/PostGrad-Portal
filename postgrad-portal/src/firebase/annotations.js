// ============================================
// Annotations – Firestore CRUD
// Manages text-highlight annotations on documents
// within version-controlled submissions
// ============================================

import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, Timestamp, onSnapshot, orderBy,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';

/* ── Helpers ── */

function convertTimestamps(obj) {
  if (!obj) return obj;
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (val instanceof Timestamp) {
      result[key] = val.toDate();
    } else if (Array.isArray(val)) {
      result[key] = val.map(item =>
        typeof item === 'object' && item !== null ? convertTimestamps(item) : item
      );
    } else if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
      result[key] = convertTimestamps(val);
    }
  }
  return result;
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
  if (!targetName) return true;
  if (!annotationName) return true;  // No documentName on annotation → include it
  const ann = normalizeDocName(annotationName);
  const tgt = normalizeDocName(targetName);
  if (!ann) return true;  // Empty after normalize → include
  if (!tgt) return true;
  const annBase = toDocBase(annotationName);
  const tgtBase = toDocBase(targetName);

  return ann === tgt || annBase === tgtBase || (annBase && tgtBase && (ann.includes(tgtBase) || tgt.includes(annBase)));
}

/* ── Subscribe to annotations for a specific version + document ── */
export function subscribeToAnnotations(versionId, documentName, callback, onError) {
  const ref = collection(db, COLLECTIONS.ANNOTATIONS);
  const q = query(
    ref,
    where('versionId', '==', versionId)
  );
  return onSnapshot(q, (snapshot) => {
    const annotations = snapshot.docs
      .map(d => convertTimestamps({ id: d.id, ...d.data() }))
      .filter(a => isDocumentMatch(a.documentName, documentName))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    callback(annotations);
  }, (error) => {
    console.error('Error subscribing to annotations:', error);
    if (onError) onError(error);
  });
}

/* ── Create annotation (default draft status) ── */
export async function createAnnotation({
  versionId,
  requestId,
  documentName,
  selectedText,
  comment,
  pageNumber,
  authorId,
  authorName,
  authorRole,
  highlightColor = '#ffd43b',
  status = 'draft',
}) {
  const ref = collection(db, COLLECTIONS.ANNOTATIONS);
  const data = {
    versionId,
    requestId,
    documentName,
    selectedText,
    comment,
    pageNumber: pageNumber || null,
    authorId,
    authorName,
    authorRole,
    highlightColor,
    resolved: false,
    status,
    replies: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const docRef = await addDoc(ref, data);
  return { id: docRef.id, ...data };
}

/* ── Add reply to annotation ── */
export async function addAnnotationReply(annotationId, reply) {
  const ref = doc(db, COLLECTIONS.ANNOTATIONS, annotationId);
  const replyData = {
    id: `reply_${Date.now()}`,
    authorId: reply.authorId,
    authorName: reply.authorName,
    authorRole: reply.authorRole,
    text: reply.text,
    createdAt: Timestamp.now(),
  };
  // Use arrayUnion via updateDoc
  const snap = await getDocs(query(collection(db, COLLECTIONS.ANNOTATIONS), where('__name__', '==', annotationId)));
  if (!snap.empty) {
    const existing = snap.docs[0].data();
    const replies = existing.replies || [];
    replies.push(replyData);
    await updateDoc(ref, { replies, updatedAt: Timestamp.now() });
  }
  return replyData;
}

/* ── Resolve / unresolve annotation ── */
export async function toggleAnnotationResolved(annotationId, resolved) {
  const ref = doc(db, COLLECTIONS.ANNOTATIONS, annotationId);
  await updateDoc(ref, { resolved, updatedAt: Timestamp.now() });
}

/* ── Delete annotation ── */
export async function deleteAnnotation(annotationId) {
  const ref = doc(db, COLLECTIONS.ANNOTATIONS, annotationId);
  await deleteDoc(ref);
}

/* ── Fetch all annotations for a version ── */
export async function fetchAnnotationsForVersion(versionId) {
  const ref = collection(db, COLLECTIONS.ANNOTATIONS);
  const q = query(ref, where('versionId', '==', versionId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => convertTimestamps({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

/* ── Confirm and send all draft annotations for a version+document ── */
export async function confirmAndSendAnnotations(versionId, documentName) {
  const ref = collection(db, COLLECTIONS.ANNOTATIONS);
  const q = query(
    ref,
    where('versionId', '==', versionId),
    where('documentName', '==', documentName),
    where('status', '==', 'draft')
  );
  const snap = await getDocs(q);
  const updates = [];
  const sent = [];
  for (const d of snap.docs) {
    updates.push(updateDoc(doc(db, COLLECTIONS.ANNOTATIONS, d.id), { status: 'sent', updatedAt: Timestamp.now() }));
    sent.push({ id: d.id, ...d.data() });
  }
  await Promise.all(updates);
  return sent;
}

/* ── Confirm and send ALL draft annotations across all documents for a version ── */
export async function confirmAndSendAllAnnotations(versionId) {
  const ref = collection(db, COLLECTIONS.ANNOTATIONS);
  const q = query(
    ref,
    where('versionId', '==', versionId),
    where('status', '==', 'draft')
  );
  const snap = await getDocs(q);
  const updates = [];
  const sent = [];
  for (const d of snap.docs) {
    updates.push(updateDoc(doc(db, COLLECTIONS.ANNOTATIONS, d.id), { status: 'sent', updatedAt: Timestamp.now() }));
    sent.push({ id: d.id, ...d.data() });
  }
  await Promise.all(updates);
  return sent;
}
