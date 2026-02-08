// ============================================
// Document Versions – Firestore CRUD
// Manages version-controlled document submissions
// with comments and structured feedback
// ============================================

import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, arrayUnion, onSnapshot,
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

function toTimestamp(d) {
  return d instanceof Date ? Timestamp.fromDate(d) : Timestamp.now();
}

/* ── Real-time subscription ── */

export function subscribeToVersions(requestId, callback, onError) {
  const ref = collection(db, COLLECTIONS.DOCUMENT_VERSIONS);
  // Use only where() – no orderBy to avoid needing a composite index.
  // Sorting is done client-side after fetching.
  const q = query(ref, where('requestId', '==', requestId));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs
      .map(d => convertTimestamps({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.version || 0) - (b.version || 0));
    callback(docs);
  }, (error) => {
    console.error('Error subscribing to document versions:', error);
    if (onError) onError(error);
  });
}

/* ── Fetch all versions for a request ── */

export async function fetchVersionsForRequest(requestId) {
  const ref = collection(db, COLLECTIONS.DOCUMENT_VERSIONS);
  const q = query(ref, where('requestId', '==', requestId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => convertTimestamps({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.version || 0) - (b.version || 0));
}

/* ── Create a new version ── */

export async function createVersion({
  requestId,
  version,
  documents,
  submittedBy,
  submitterName,
  submitterRole,
  changeNotes,
}) {
  const data = {
    requestId,
    version,
    documents: documents || [],
    comments: [],
    feedback: [],
    status: 'submitted',
    submittedBy,
    submitterName,
    submitterRole: submitterRole || 'student',
    changeNotes: changeNotes || '',
    submittedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.DOCUMENT_VERSIONS), data);
  return { id: docRef.id, ...data };
}

/* ── Add a comment to a version ── */

export async function addComment(versionId, {
  authorId,
  authorName,
  authorRole,
  text,
  documentName,
  parentCommentId,
}) {
  const comment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    authorId,
    authorName,
    authorRole,
    text,
    documentName: documentName || null,
    parentCommentId: parentCommentId || null,
    createdAt: new Date().toISOString(),
    edited: false,
  };
  const ref = doc(db, COLLECTIONS.DOCUMENT_VERSIONS, versionId);
  await updateDoc(ref, {
    comments: arrayUnion(comment),
    updatedAt: Timestamp.now(),
  });
  return comment;
}

/* ── Add structured feedback (supervisor/coordinator) ── */

export async function addFeedback(versionId, {
  authorId,
  authorName,
  authorRole,
  recommendation,
  text,
  criteria,
}) {
  const feedback = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    authorId,
    authorName,
    authorRole,
    recommendation, // 'approve' | 'request_changes' | 'refer_back'
    text,
    criteria: criteria || [],
    createdAt: new Date().toISOString(),
  };
  const ref = doc(db, COLLECTIONS.DOCUMENT_VERSIONS, versionId);
  await updateDoc(ref, {
    feedback: arrayUnion(feedback),
    updatedAt: Timestamp.now(),
  });
  return feedback;
}

/* ── Update version status ── */

export async function updateVersionStatus(versionId, status) {
  const ref = doc(db, COLLECTIONS.DOCUMENT_VERSIONS, versionId);
  await updateDoc(ref, { status, updatedAt: Timestamp.now() });
}

/* ── Get next version number for a request ── */

export async function getNextVersionNumber(requestId) {
  const versions = await fetchVersionsForRequest(requestId);
  if (versions.length === 0) return 1;
  return Math.max(...versions.map(v => v.version)) + 1;
}
