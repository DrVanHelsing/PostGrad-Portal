// ============================================
// Firestore – Form Template & Submission CRUD
// ============================================

import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, setDoc,
  deleteDoc, query, where, orderBy, Timestamp, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';

/* ── Timestamp helpers (reuse pattern from firestore.js) ── */

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

function convertDates(obj) {
  if (!obj) return obj;
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (val instanceof Date) {
      result[key] = Timestamp.fromDate(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map(item =>
        typeof item === 'object' && item !== null && !(item instanceof Date)
          ? convertDates(item)
          : item instanceof Date ? Timestamp.fromDate(item) : item
      );
    } else if (typeof val === 'object' && val !== null && !(val instanceof Timestamp)) {
      result[key] = convertDates(val);
    }
  }
  return result;
}

/* ══════════════════════════════════════════════════
   REAL-TIME SUBSCRIPTIONS
   ══════════════════════════════════════════════════ */

/** Subscribe to all published form templates */
export function subscribeToFormTemplates(callback) {
  const ref = collection(db, COLLECTIONS.FORM_TEMPLATES);
  return onSnapshot(ref, (snapshot) => {
    const docs = snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
    callback(docs);
  }, (error) => {
    console.error('Error subscribing to formTemplates:', error);
  });
}

/** Subscribe to form submissions relevant to a user */
export function subscribeToFormSubmissions(callback) {
  const ref = collection(db, COLLECTIONS.FORM_SUBMISSIONS);
  return onSnapshot(ref, (snapshot) => {
    const docs = snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
    callback(docs);
  }, (error) => {
    console.error('Error subscribing to formSubmissions:', error);
  });
}

/* ══════════════════════════════════════════════════
   FORM TEMPLATE CRUD (Admin only)
   ══════════════════════════════════════════════════ */

/** Create a new form template */
export async function createFormTemplate(data) {
  const now = new Date();
  const template = {
    name: data.name,
    slug: data.slug,
    version: 1,
    status: data.status || 'draft',
    category: data.category || 'other',
    description: data.description || '',
    initiatorRoles: data.initiatorRoles || ['student'],
    layout: data.layout || {},
    sections: data.sections || [],
    requiredAttachments: data.requiredAttachments || [],
    linkedForms: data.linkedForms || [],
    exportConfig: data.exportConfig || {},
    isPrebuilt: data.isPrebuilt || false,
    sourceDocx: data.sourceDocx || '',
    createdAt: now,
    updatedAt: now,
    createdBy: data.createdBy || 'system',
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.FORM_TEMPLATES), convertDates(template));
  return { id: docRef.id, ...template };
}

/** Create a template with a specific ID (for seeding prebuilt templates) */
export async function setFormTemplate(id, data) {
  const now = new Date();
  const template = {
    name: data.name,
    slug: data.slug,
    version: data.version || 1,
    status: data.status || 'published',
    category: data.category || 'other',
    description: data.description || '',
    initiatorRoles: data.initiatorRoles || ['student'],
    layout: data.layout || {},
    sections: data.sections || [],
    requiredAttachments: data.requiredAttachments || [],
    linkedForms: data.linkedForms || [],
    exportConfig: data.exportConfig || {},
    isPrebuilt: data.isPrebuilt || false,
    sourceDocx: data.sourceDocx || '',
    createdAt: now,
    updatedAt: now,
    createdBy: data.createdBy || 'system',
  };
  await setDoc(doc(db, COLLECTIONS.FORM_TEMPLATES, id), convertDates(template));
  return { id, ...template };
}

/** Update an existing form template */
export async function updateFormTemplate(templateId, updates) {
  const docRef = doc(db, COLLECTIONS.FORM_TEMPLATES, templateId);
  await updateDoc(docRef, convertDates({ ...updates, updatedAt: new Date() }));
}

/** Publish a template (increment version, set status) */
export async function publishFormTemplate(templateId) {
  const docRef = doc(db, COLLECTIONS.FORM_TEMPLATES, templateId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Template not found');
  const current = convertTimestamps({ id: snap.id, ...snap.data() });
  await updateDoc(docRef, convertDates({
    status: 'published',
    version: (current.version || 0) + 1,
    updatedAt: new Date(),
  }));
}

/** Archive a template */
export async function archiveFormTemplate(templateId) {
  await updateDoc(doc(db, COLLECTIONS.FORM_TEMPLATES, templateId), convertDates({
    status: 'archived',
    updatedAt: new Date(),
  }));
}

/** Duplicate a template */
export async function duplicateFormTemplate(templateId, newName) {
  const snap = await getDoc(doc(db, COLLECTIONS.FORM_TEMPLATES, templateId));
  if (!snap.exists()) throw new Error('Template not found');
  const original = convertTimestamps({ id: snap.id, ...snap.data() });
  delete original.id;
  return createFormTemplate({
    ...original,
    name: newName || `${original.name} (Copy)`,
    slug: `${original.slug}_copy_${Date.now()}`,
    status: 'draft',
    isPrebuilt: false,
    version: 1,
  });
}

/** Fetch a single template by ID */
export async function fetchFormTemplate(templateId) {
  const snap = await getDoc(doc(db, COLLECTIONS.FORM_TEMPLATES, templateId));
  if (!snap.exists()) return null;
  return convertTimestamps({ id: snap.id, ...snap.data() });
}

/** Fetch a template by slug */
export async function fetchFormTemplateBySlug(slug) {
  const ref = collection(db, COLLECTIONS.FORM_TEMPLATES);
  const q = query(ref, where('slug', '==', slug), where('status', '==', 'published'));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return convertTimestamps({ id: snap.docs[0].id, ...snap.docs[0].data() });
}

/* ══════════════════════════════════════════════════
   FORM SUBMISSION CRUD
   ══════════════════════════════════════════════════ */

/** Create a new form submission (when user starts filling a form) */
export async function createFormSubmission(data) {
  const now = new Date();

  // Build initial sectionStatus map
  const sectionStatus = {};
  if (data.sections) {
    data.sections.forEach((sec, idx) => {
      sectionStatus[sec.id] = {
        status: idx === 0 ? 'in_progress' : 'pending',
        completedBy: null,
        completedAt: null,
        signatureData: null,
        signatureName: null,
        referralNote: null,
      };
    });
  }

  const submission = {
    templateId: data.templateId,
    templateVersion: data.templateVersion || 1,
    templateSlug: data.templateSlug,
    templateName: data.templateName,
    hdRequestId: data.hdRequestId || null,
    studentId: data.studentId,
    studentName: data.studentName,
    supervisorId: data.supervisorId,
    coSupervisorId: data.coSupervisorId || null,
    coordinatorId: data.coordinatorId || 'coordinator-001',
    sectionStatus,
    data: data.formData || {},
    attachments: {},
    linkedSubmissionIds: [],
    parentSubmissionId: data.parentSubmissionId || null,
    status: 'draft',
    currentOwner: data.studentId,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.FORM_SUBMISSIONS), convertDates(submission));
  return { id: docRef.id, ...submission };
}

/** Update form field data */
export async function updateFormSubmissionData(submissionId, fieldData) {
  const docRef = doc(db, COLLECTIONS.FORM_SUBMISSIONS, submissionId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Submission not found');
  const current = convertTimestamps({ id: snap.id, ...snap.data() });

  const mergedData = { ...current.data, ...fieldData };
  await updateDoc(docRef, convertDates({
    data: mergedData,
    updatedAt: new Date(),
  }));
}

/** Complete a section (mark done, lock, optionally add signature) */
export async function completeFormSection(submissionId, sectionId, userId, signatureData = null) {
  const docRef = doc(db, COLLECTIONS.FORM_SUBMISSIONS, submissionId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Submission not found');
  const current = convertTimestamps({ id: snap.id, ...snap.data() });
  const now = new Date();

  const sectionStatus = { ...current.sectionStatus };
  sectionStatus[sectionId] = {
    ...sectionStatus[sectionId],
    status: 'completed',
    completedBy: userId,
    completedAt: now,
    signatureData: signatureData?.data || null,
    signatureName: signatureData?.name || null,
  };

  // Find the next pending section and set it to in_progress
  const template = current._cachedTemplate; // we'll look up sections from submission
  const sectionIds = Object.keys(sectionStatus);
  let foundCurrent = false;
  for (const sid of sectionIds) {
    if (sid === sectionId) { foundCurrent = true; continue; }
    if (foundCurrent && sectionStatus[sid].status === 'pending') {
      sectionStatus[sid] = { ...sectionStatus[sid], status: 'in_progress' };
      break;
    }
  }

  await updateDoc(docRef, convertDates({
    sectionStatus,
    updatedAt: now,
  }));

  return sectionStatus;
}

/** Refer back a specific section */
export async function referBackFormSection(submissionId, sectionId, note) {
  const docRef = doc(db, COLLECTIONS.FORM_SUBMISSIONS, submissionId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Submission not found');
  const current = convertTimestamps({ id: snap.id, ...snap.data() });

  const sectionStatus = { ...current.sectionStatus };
  sectionStatus[sectionId] = {
    ...sectionStatus[sectionId],
    status: 'referred_back',
    referralNote: note,
    completedBy: null,
    completedAt: null,
    signatureData: null,
    signatureName: null,
  };

  await updateDoc(docRef, convertDates({
    sectionStatus,
    status: 'referred_back',
    updatedAt: new Date(),
  }));
}

/** Update the overall submission status and currentOwner */
export async function updateFormSubmissionStatus(submissionId, status, currentOwner, extras = {}) {
  await updateDoc(doc(db, COLLECTIONS.FORM_SUBMISSIONS, submissionId), convertDates({
    status,
    currentOwner,
    ...extras,
    updatedAt: new Date(),
  }));
}

/** Update attachments on a submission */
export async function updateFormSubmissionAttachments(submissionId, attachments) {
  await updateDoc(doc(db, COLLECTIONS.FORM_SUBMISSIONS, submissionId), convertDates({
    attachments,
    updatedAt: new Date(),
  }));
}

/** Fetch a single submission */
export async function fetchFormSubmission(submissionId) {
  const snap = await getDoc(doc(db, COLLECTIONS.FORM_SUBMISSIONS, submissionId));
  if (!snap.exists()) return null;
  return convertTimestamps({ id: snap.id, ...snap.data() });
}

/** Link a child submission to a parent */
export async function linkFormSubmission(parentId, childId) {
  const docRef = doc(db, COLLECTIONS.FORM_SUBMISSIONS, parentId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const current = convertTimestamps({ id: snap.id, ...snap.data() });
  const linked = [...(current.linkedSubmissionIds || []), childId];
  await updateDoc(docRef, { linkedSubmissionIds: linked });
}

/** Delete a draft submission */
export async function deleteFormSubmission(submissionId) {
  const docRef = doc(db, COLLECTIONS.FORM_SUBMISSIONS, submissionId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const current = convertTimestamps({ id: snap.id, ...snap.data() });
  if (current.status !== 'draft') throw new Error('Can only delete draft submissions');
  await deleteDoc(docRef);
}
