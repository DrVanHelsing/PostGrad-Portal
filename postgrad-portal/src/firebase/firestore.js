// ============================================
// Firestore Service – All CRUD Operations
// Mirrors the mockData.js API for Firestore
// ============================================

import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, setDoc,
  deleteDoc, writeBatch, query, where, orderBy, Timestamp,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './collections';

/* ── Helpers ── */

/** Convert Firestore Timestamps to JS Dates in an object */
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

/** Convert JS Dates to Firestore Timestamps in an object */
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

export function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function resolveCoordinatorId(allUsers, requestedCoordinatorId, context = {}) {
  if (requestedCoordinatorId && allUsers?.some(u => u.id === requestedCoordinatorId)) {
    return requestedCoordinatorId;
  }

  const coordinators = (allUsers || []).filter(u => u.role === 'coordinator');
  if (coordinators.length === 0) return requestedCoordinatorId || 'coordinator-001';
  if (coordinators.length === 1) return coordinators[0].id;

  const normalize = (value) => String(value || '').trim().toLowerCase();
  const department = normalize(context.studentDepartment);
  const faculty = normalize(context.studentFaculty);
  const programme = normalize(context.studentProgramme);

  const scored = coordinators.map((coordinator) => {
    const coordDept = normalize(coordinator.department);
    const coordProgramme = normalize(coordinator.programme);
    let score = 0;
    if (department && coordDept && department === coordDept) score += 4;
    if (faculty && coordDept && coordDept.includes(faculty)) score += 2;
    if (programme && coordProgramme && programme === coordProgramme) score += 3;
    return { coordinator, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.coordinator?.id || coordinators[0].id;
}

/* ══════════════════════════════════════════════════
   REAL-TIME SUBSCRIPTION HELPERS
   Subscribe to a collection; returns unsubscribe fn
   ══════════════════════════════════════════════════ */

export function subscribeToCollection(collectionName, callback, queryConstraints = []) {
  const ref = collection(db, collectionName);
  const q = queryConstraints.length > 0 ? query(ref, ...queryConstraints) : ref;
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
    callback(docs);
  }, (error) => {
    console.error(`Error subscribing to ${collectionName}:`, error);
  });
}

export function subscribeToUserNotifications(userId, callback) {
  const ref = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(ref, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
    callback(docs);
  }, (error) => {
    console.error('Error subscribing to user notifications:', error);
    callback([]);
  });
}

/* ══════════════════════════════════════════════════
   QUERY FUNCTIONS (one-shot)
   ══════════════════════════════════════════════════ */

export async function fetchCollection(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }));
}

export async function fetchDocById(collectionName, docId) {
  const snap = await getDoc(doc(db, collectionName, docId));
  return snap.exists() ? convertTimestamps({ id: snap.id, ...snap.data() }) : null;
}

/* ══════════════════════════════════════════════════
   AUDIT LOG HELPER
   ══════════════════════════════════════════════════ */

async function addAuditLog(userId, userName, action, entityType, entityId, details) {
  await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), convertDates({
    timestamp: new Date(),
    userId,
    userName: userName || userId,
    action,
    entityType,
    entityId,
    details,
  }));
}

/* ══════════════════════════════════════════════════
   NOTIFICATION HELPERS
   ══════════════════════════════════════════════════ */

export async function addNotificationDoc(userId, title, message, type = 'info', link = null) {
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), convertDates({
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date(),
    link,
  }));
}

export async function markNotificationsRead(userId) {
  const ref = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(ref, where('userId', '==', userId), where('read', '==', false));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function markNotificationRead(notifId) {
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notifId), { read: true });
}

/* ══════════════════════════════════════════════════
   USER FUNCTIONS
   ══════════════════════════════════════════════════ */

export async function getUserByEmail(email) {
  const ref = collection(db, COLLECTIONS.USERS);
  const q = query(ref, where('email', '==', email.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return convertTimestamps({ id: d.id, ...d.data() });
}

export async function getUserDocById(userId) {
  return fetchDocById(COLLECTIONS.USERS, userId);
}

export async function updateUserRole(userId, newRole, allUsers) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), { role: newRole });
  const u = allUsers?.find(x => x.id === userId);
  await addAuditLog(u?.id || 'admin', u?.name || 'Admin', 'Role Changed', 'User', userId, `Changed role to ${newRole}`);
}

/* ══════════════════════════════════════════════════
   HD REQUEST FUNCTIONS
   ══════════════════════════════════════════════════ */

export async function createHDRequest({
  type,
  title,
  description,
  studentId,
  studentName,
  supervisorId,
  coordinatorId,
  documents = [],
  studentDepartment,
  studentFaculty,
  studentProgramme,
}, allUsers) {
  const now = new Date();
  const resolvedCoordinatorId = resolveCoordinatorId(allUsers, coordinatorId, {
    studentDepartment,
    studentFaculty,
    studentProgramme,
  });
  const data = {
    type, title, description, status: 'draft',
    studentId, studentName, supervisorId, coordinatorId: resolvedCoordinatorId,
    createdAt: now, updatedAt: now, currentOwner: studentId,
    documents,
    versions: [{ version: 1, date: now, action: 'Created', by: studentId }],
    signatures: [],
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.HD_REQUESTS), convertDates(data));
  const user = allUsers?.find(u => u.id === studentId);
  await addAuditLog(studentId, user?.name, 'Created Request', 'HDRequest', docRef.id, `Created ${title}`);
  return { id: docRef.id, ...data };
}

async function addWorkflowMilestone(request, type, title, description) {
  if (!request?.studentId) return;
  try {
    await addMilestoneDoc({
      studentId: request.studentId,
      title,
      type,
      date: new Date(),
      description,
    });
  } catch {
    // Do not block workflow transitions on milestone automation failures
  }
}

export async function submitToSupervisor(requestId, userId, allUsers) {
  const docRef = doc(db, COLLECTIONS.HD_REQUESTS, requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const r = convertTimestamps({ id: snap.id, ...snap.data() });

  const code = generateAccessCode();
  const now = new Date();
  const versions = [...(r.versions || []), { version: (r.versions?.length || 0) + 1, date: now, action: 'Submitted to supervisor', by: userId }];

  await updateDoc(docRef, convertDates({
    status: 'submitted_to_supervisor',
    currentOwner: r.supervisorId,
    accessCode: code,
    accessCodeExpiry: new Date(Date.now() + 72 * 60 * 60 * 1000),
    timerStart: now,
    timerHours: 48,
    updatedAt: now,
    versions,
  }));

  const user = allUsers?.find(u => u.id === userId);
  const sup = allUsers?.find(u => u.id === r.supervisorId);
  await addAuditLog(userId, user?.name, 'Submitted Request', 'HDRequest', requestId, `Submitted ${r.title} to supervisor`);
  await addNotificationDoc(r.supervisorId, 'New Request for Review', `${r.studentName} has submitted "${r.title}" for your review. Access code: ${code}`, 'info', '/requests');
  await addNotificationDoc(r.studentId, 'Request Submitted', `Your request "${r.title}" has been submitted to ${sup?.name}`, 'success', '/progress-tracker');
  await addWorkflowMilestone(r, 'submission', `${r.title} submitted`, 'Request submitted to supervisor for review.');
}

export async function validateAccessCode(requestId, code) {
  const docRef = doc(db, COLLECTIONS.HD_REQUESTS, requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { valid: false, error: 'Request not found' };
  const r = convertTimestamps({ id: snap.id, ...snap.data() });

  if (!r.accessCode) return { valid: false, error: 'No access code set' };
  if (r.accessCode !== code.toUpperCase()) return { valid: false, error: 'Invalid access code' };
  if (r.accessCodeExpiry && new Date() > new Date(r.accessCodeExpiry)) return { valid: false, error: 'Access code has expired' };

  if (r.status === 'submitted_to_supervisor') {
    const now = new Date();
    const versions = [...(r.versions || []), { version: (r.versions?.length || 0) + 1, date: now, action: 'Access code validated – supervisor review started', by: r.currentOwner }];
    await updateDoc(docRef, convertDates({ status: 'supervisor_review', updatedAt: now, versions }));
    await addAuditLog(r.currentOwner, null, 'Opened Request', 'HDRequest', requestId, 'Validated access code and opened request for review');
  }
  return { valid: true };
}

export async function supervisorApprove(requestId, userId, signatureName, allUsers) {
  const docRef = doc(db, COLLECTIONS.HD_REQUESTS, requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const r = convertTimestamps({ id: snap.id, ...snap.data() });
  const user = allUsers?.find(u => u.id === userId);
  const now = new Date();

  const signatures = [...(r.signatures || []), { role: 'supervisor', userId, name: signatureName || user?.name, date: now }];
  const versions = [...(r.versions || [])];

  if (r.coSupervisorId && !r.signatures?.find(s => s.role === 'co-supervisor')) {
    const newCode = generateAccessCode();
    versions.push({ version: versions.length + 1, date: now, action: 'Supervisor approved, forwarded to co-supervisor', by: userId });
    await updateDoc(docRef, convertDates({
      status: 'co_supervisor_review',
      currentOwner: r.coSupervisorId,
      accessCode: newCode,
      accessCodeExpiry: new Date(Date.now() + 72 * 60 * 60 * 1000),
      timerStart: now, timerHours: 48,
      updatedAt: now, signatures, versions,
    }));
    await addAuditLog(userId, user?.name, 'Approved Request', 'HDRequest', requestId, 'Approved and forwarded to co-supervisor');
    await addNotificationDoc(r.coSupervisorId, 'Co-Supervisor Review Required', `"${r.title}" requires your review and signature. Code: ${newCode}`, 'info', '/requests');
  } else {
    versions.push({ version: versions.length + 1, date: now, action: 'Supervisor approved, forwarded to coordinator', by: userId });
    await updateDoc(docRef, convertDates({
      status: 'coordinator_review',
      currentOwner: r.coordinatorId,
      accessCode: null,
      updatedAt: now, signatures, versions,
    }));
    await addAuditLog(userId, user?.name, 'Approved Request', 'HDRequest', requestId, 'Approved and forwarded to coordinator');
    await addNotificationDoc(r.coordinatorId, 'Request Awaiting Review', `"${r.title}" from ${r.studentName} is ready for coordinator review`, 'info', '/requests');
  }
  await addNotificationDoc(r.studentId, 'Request Approved by Supervisor', `Your request "${r.title}" has been approved and forwarded`, 'success', '/progress-tracker');
  await addWorkflowMilestone(r, 'review', `${r.title} approved by supervisor`, 'Supervisor approval recorded and request forwarded to next stage.');
}

export async function coSupervisorSign(requestId, userId, signatureName, allUsers) {
  const docRef = doc(db, COLLECTIONS.HD_REQUESTS, requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const r = convertTimestamps({ id: snap.id, ...snap.data() });
  const user = allUsers?.find(u => u.id === userId);
  const now = new Date();

  const signatures = [...(r.signatures || []), { role: 'co-supervisor', userId, name: signatureName || user?.name, date: now }];
  const versions = [...(r.versions || []), { version: (r.versions?.length || 0) + 1, date: now, action: 'Co-supervisor signed, forwarded to coordinator', by: userId }];

  await updateDoc(docRef, convertDates({
    status: 'coordinator_review',
    currentOwner: r.coordinatorId,
    accessCode: null,
    updatedAt: now, signatures, versions,
  }));

  await addAuditLog(userId, user?.name, 'Co-Supervisor Signed', 'HDRequest', requestId, 'Co-supervisor signed and forwarded to coordinator');
  await addNotificationDoc(r.coordinatorId, 'Request Ready for Review', `"${r.title}" has been signed by all supervisors and is ready for coordinator review`, 'info', '/requests');
  await addNotificationDoc(r.studentId, 'Co-Supervisor Signed', `Your request "${r.title}" has been signed by the co-supervisor`, 'success', '/progress-tracker');
  await addWorkflowMilestone(r, 'review', `${r.title} signed by co-supervisor`, 'Co-supervisor approval recorded.');
}

export async function referBack(requestId, userId, reason, allUsers) {
  const docRef = doc(db, COLLECTIONS.HD_REQUESTS, requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const r = convertTimestamps({ id: snap.id, ...snap.data() });
  const user = allUsers?.find(u => u.id === userId);
  const now = new Date();

  const versions = [...(r.versions || []), { version: (r.versions?.length || 0) + 1, date: now, action: `Referred back: ${reason}`, by: userId }];

  await updateDoc(docRef, convertDates({
    status: 'referred_back',
    currentOwner: r.studentId,
    referredBackReason: reason,
    referredBackBy: userId,
    referredBackDate: now,
    notes: reason,
    accessCode: null,
    timerStart: now, timerHours: 24,
    updatedAt: now, versions,
  }));

  await addAuditLog(userId, user?.name, 'Referred Back', 'HDRequest', requestId, `Request referred back: ${reason}`);
  await addNotificationDoc(r.studentId, 'Request Referred Back', `Your request "${r.title}" has been referred back: ${reason}`, 'error', '/requests');
  if (r.supervisorId !== userId) {
    await addNotificationDoc(r.supervisorId, 'Request Referred Back', `"${r.title}" for ${r.studentName} has been referred back`, 'warning', '/requests');
  }
  await addWorkflowMilestone(r, 'review', `${r.title} referred back`, reason || 'Request referred back for revisions.');
}

export async function forwardToFHD(requestId, userId, signatureName, allUsers) {
  const docRef = doc(db, COLLECTIONS.HD_REQUESTS, requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const r = convertTimestamps({ id: snap.id, ...snap.data() });
  const user = allUsers?.find(u => u.id === userId);
  const now = new Date();

  const signatures = [...(r.signatures || []), { role: 'coordinator', userId, name: signatureName || user?.name, date: now }];
  const versions = [...(r.versions || []), { version: (r.versions?.length || 0) + 1, date: now, action: 'Coordinator signed, forwarded to Faculty Board', by: userId }];

  await updateDoc(docRef, convertDates({
    status: 'fhd_pending',
    currentOwner: r.coordinatorId,
    locked: true,
    updatedAt: now, signatures, versions,
  }));

  await addAuditLog(userId, user?.name, 'Forwarded to Faculty Board', 'HDRequest', requestId, 'Signed and forwarded to Faculty Higher Degrees Committee');
  await addNotificationDoc('admin-001', 'Request Forwarded to Faculty Board', `"${r.title}" from ${r.studentName} has been forwarded to the Faculty Board`, 'info', '/requests');
  await addNotificationDoc(r.studentId, 'Request at Faculty Board', `Your request "${r.title}" is now with the Faculty Higher Degrees Committee`, 'info', '/progress-tracker');
  await addWorkflowMilestone(r, 'review', `${r.title} sent to Faculty Board`, 'Coordinator signed and forwarded request to FHD.');
}

export async function recordFHDOutcome(requestId, userId, outcome, referenceNumber, reason, allUsers) {
  const docRef = doc(db, COLLECTIONS.HD_REQUESTS, requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const r = convertTimestamps({ id: snap.id, ...snap.data() });
  const user = allUsers?.find(u => u.id === userId);
  const now = new Date();
  const versions = [...(r.versions || [])];
  const updates = { fhdOutcome: outcome, updatedAt: now };

  if (referenceNumber) updates.referenceNumber = referenceNumber;

  if (outcome === 'approved') {
    updates.status = 'shd_pending';
    updates.shdOutcome = 'approved';
    versions.push({ version: versions.length + 1, date: now, action: `Faculty Board Approved (Ref: ${referenceNumber}). Senate Board auto-approved.`, by: userId });
    await addAuditLog(userId, user?.name, 'Faculty Board Approved', 'HDRequest', requestId, `Faculty Board approved with reference ${referenceNumber}. Senate Board auto-checked.`);
  } else if (outcome === 'recommended') {
    updates.status = 'shd_pending';
    versions.push({ version: versions.length + 1, date: now, action: `Faculty Board Recommended (Ref: ${referenceNumber}). Awaiting Senate Board.`, by: userId });
    await addAuditLog(userId, user?.name, 'Faculty Board Recommended', 'HDRequest', requestId, `Faculty Board recommended with reference ${referenceNumber}. Awaiting Senate Board decision.`);
  } else if (outcome === 'referred_back') {
    updates.status = 'referred_back';
    updates.currentOwner = r.supervisorId;
    updates.referredBackReason = reason;
    updates.referredBackBy = userId;
    updates.referredBackDate = now;
    updates.notes = reason;
    updates.timerStart = now;
    updates.timerHours = 24;
    versions.push({ version: versions.length + 1, date: now, action: `Faculty Board Referred Back: ${reason}`, by: userId });
    await addAuditLog(userId, user?.name, 'Faculty Board Referred Back', 'HDRequest', requestId, `Referred back from Faculty Board: ${reason}`);
    await addNotificationDoc(r.supervisorId, 'Faculty Board Referred Back', `"${r.title}" has been referred back by the Faculty Board. 24 hours to amend.`, 'error', '/requests');
  }

  updates.versions = versions;
  await updateDoc(docRef, convertDates(updates));
  await addNotificationDoc(r.studentId, 'Faculty Board Decision', `Faculty Board outcome for "${r.title}": ${outcome.replace('_', ' ')}`, outcome === 'referred_back' ? 'error' : 'success', '/progress-tracker');
  if (outcome === 'approved' || outcome === 'recommended') {
    await addWorkflowMilestone(r, 'review', `${r.title} decided by Faculty Board`, `Outcome: ${outcome.replace('_', ' ')}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''}.`);
  } else {
    await addWorkflowMilestone(r, 'review', `${r.title} referred back by Faculty Board`, reason || 'Faculty Board requested revisions.');
  }
}

export async function recordSHDOutcome(requestId, userId, outcome, reason, allUsers) {
  const docRef = doc(db, COLLECTIONS.HD_REQUESTS, requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const r = convertTimestamps({ id: snap.id, ...snap.data() });
  const user = allUsers?.find(u => u.id === userId);
  const now = new Date();
  const versions = [...(r.versions || [])];
  const updates = { shdOutcome: outcome, updatedAt: now };

  if (outcome === 'approved') {
    updates.status = 'approved';
    updates.locked = true;
    versions.push({ version: versions.length + 1, date: now, action: 'Senate Board Approved – Request complete', by: userId });
    await addAuditLog(userId, user?.name, 'Final Approval', 'HDRequest', requestId, 'Senate Board approved – request fully approved');
    await addNotificationDoc(r.studentId, 'Request Approved', `Your request "${r.title}" has been fully approved by the Senate Board`, 'success', '/progress-tracker');
  } else {
    updates.status = 'referred_back';
    updates.currentOwner = r.supervisorId;
    updates.referredBackReason = reason;
    updates.referredBackBy = userId;
    updates.referredBackDate = now;
    updates.timerStart = now;
    updates.timerHours = 24;
    versions.push({ version: versions.length + 1, date: now, action: `Senate Board Referred Back: ${reason}`, by: userId });
    await addAuditLog(userId, user?.name, 'Senate Board Referred Back', 'HDRequest', requestId, `Referred back from Senate Board: ${reason}`);
    await addNotificationDoc(r.supervisorId, 'Senate Board Referred Back', `"${r.title}" referred back by the Senate Board. 24 hours to amend.`, 'error', '/requests');
    await addNotificationDoc(r.studentId, 'Senate Board Referred Back', `The Senate Board referred back "${r.title}": ${reason}`, 'error', '/progress-tracker');
  }

  updates.versions = versions;
  await updateDoc(docRef, convertDates(updates));
  if (outcome === 'approved') {
    await addWorkflowMilestone(r, 'completion', `${r.title} fully approved`, 'Senate Board final approval recorded.');
  } else {
    await addWorkflowMilestone(r, 'review', `${r.title} referred back by Senate Board`, reason || 'Senate Board requested revisions.');
  }
}

export async function resubmitRequest(requestId, userId, allUsers) {
  const docRef = doc(db, COLLECTIONS.HD_REQUESTS, requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const r = convertTimestamps({ id: snap.id, ...snap.data() });
  const user = allUsers?.find(u => u.id === userId);
  const now = new Date();
  const code = generateAccessCode();

  const versions = [...(r.versions || []), { version: (r.versions?.length || 0) + 1, date: now, action: 'Resubmitted after referral', by: userId }];

  await updateDoc(docRef, convertDates({
    status: 'submitted_to_supervisor',
    currentOwner: r.supervisorId,
    referredBackReason: null,
    notes: null,
    accessCode: code,
    accessCodeExpiry: new Date(Date.now() + 72 * 60 * 60 * 1000),
    timerStart: now, timerHours: 48,
    updatedAt: now, versions,
  }));

  await addAuditLog(userId, user?.name, 'Resubmitted Request', 'HDRequest', requestId, `Resubmitted "${r.title}" after referral`);
  await addNotificationDoc(r.supervisorId, 'Request Resubmitted', `${r.studentName} has resubmitted "${r.title}". Code: ${code}`, 'info', '/requests');
  await addWorkflowMilestone(r, 'submission', `${r.title} resubmitted`, 'Student resubmitted request after referral.');
}

/* ══════════════════════════════════════════════════
   STUDENT / SUPERVISOR FUNCTIONS
   ══════════════════════════════════════════════════ */

export async function nudgeStudent(studentId, supervisorId, message, allUsers) {
  const sup = allUsers?.find(u => u.id === supervisorId);
  await addNotificationDoc(studentId, 'Reminder from Supervisor', message || `${sup?.name} is requesting your attention on pending items.`, 'warning', '/requests');
  await addAuditLog(supervisorId, sup?.name, 'Nudged Student', 'User', studentId, 'Sent reminder to student');
}

export async function updateStudentProfile(userId, updates) {
  const ref = collection(db, COLLECTIONS.STUDENT_PROFILES);
  const q = query(ref, where('userId', '==', userId));
  const snap = await getDocs(q);
  if (snap.empty) return;
  const profileDoc = snap.docs[0];
  const profile = convertTimestamps({ id: profileDoc.id, ...profileDoc.data() });

  const updateFields = {};
  if (updates.thesisTitle !== undefined) updateFields.thesisTitle = updates.thesisTitle;
  if (updates.status !== undefined) updateFields.status = updates.status;
  if (updates.coSupervisorId !== undefined) updateFields.coSupervisorId = updates.coSupervisorId || null;
  if (updates.nominalSupervisorId !== undefined) updateFields.nominalSupervisorId = updates.nominalSupervisorId || null;
  if (updates.programme !== undefined) updateFields.programme = updates.programme;
  if (updates.degree !== undefined) updateFields.degree = updates.degree;
  if (updates.researchTitle !== undefined) updateFields.researchTitle = updates.researchTitle;

  if (updates.supervisorId !== undefined) {
    updateFields.supervisorId = updates.supervisorId;
    const history = [...(profile.supervisorHistory || [])];
    const curr = history.find(h => h.supervisorId === profile.supervisorId && !h.to);
    if (curr) curr.to = new Date();
    history.push({ supervisorId: updates.supervisorId, name: updates.supervisorName || updates.supervisorId, role: 'primary', from: new Date(), to: null });
    updateFields.supervisorHistory = convertDates({ h: history }).h;
  }

  await updateDoc(profileDoc.ref, convertDates(updateFields));
}

/* ══════════════════════════════════════════════════
   STUDENT PROFILE – Create (for new student seeding)
   ══════════════════════════════════════════════════ */

export async function createStudentProfile(profileData) {
  const data = {
    userId: profileData.userId,
    studentNumber: profileData.studentNumber || '',
    programme: profileData.programme || '',
    degree: profileData.degree || '',
    registrationDate: profileData.registrationDate || new Date(),
    yearsRegistered: profileData.yearsRegistered || 1,
    status: profileData.status || 'active',
    supervisorId: profileData.supervisorId || null,
    coSupervisorId: profileData.coSupervisorId || null,
    nominalSupervisorId: profileData.nominalSupervisorId || null,
    thesisTitle: profileData.thesisTitle || '',
    researchTitle: profileData.researchTitle || '',
    supervisorHistory: profileData.supervisorHistory || [],
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.STUDENT_PROFILES), convertDates(data));
  return { id: docRef.id, ...data };
}

/* ══════════════════════════════════════════════════
   CALENDAR FUNCTIONS
   ══════════════════════════════════════════════════ */

export async function addCalendarEventDoc({ title, date, time, type, scope, description, createdBy, targetUserIds }) {
  const data = { title, date: new Date(date), time, type, scope, description, createdBy };
  // targetUserIds: array of user IDs this event is assigned to (for admin adding events to specific user calendars)
  if (targetUserIds?.length) data.targetUserIds = targetUserIds;
  const docRef = await addDoc(collection(db, COLLECTIONS.CALENDAR_EVENTS), convertDates(data));
  await addAuditLog(createdBy, null, 'Created Calendar Event', 'CalendarEvent', docRef.id, `Created event: ${title}`);
  // Notify target users if event is assigned to specific users
  if (targetUserIds?.length) {
    for (const uid of targetUserIds) {
      if (uid !== createdBy) {
        await addNotificationDoc(uid, 'New Calendar Event', `A new event "${title}" has been added to your calendar.`, 'info', '/dashboard');
      }
    }
  }
  return { id: docRef.id, ...data };
}

export async function updateCalendarEventDoc(eventId, updates) {
  await updateDoc(doc(db, COLLECTIONS.CALENDAR_EVENTS, eventId), convertDates(updates));
}

export async function deleteCalendarEventDoc(eventId) {
  await deleteDoc(doc(db, COLLECTIONS.CALENDAR_EVENTS, eventId));
}

/* ══════════════════════════════════════════════════
   MILESTONE FUNCTIONS
   ══════════════════════════════════════════════════ */

export async function addMilestoneDoc({ studentId, title, type, date, description }) {
  const data = { studentId, title, type, date: new Date(date), description };
  const docRef = await addDoc(collection(db, COLLECTIONS.MILESTONES), convertDates(data));
  await addAuditLog(studentId, null, 'Added Milestone', 'Milestone', docRef.id, `Added milestone: ${title}`);
  return { id: docRef.id, ...data };
}

export async function updateMilestoneDoc(milestoneId, updates) {
  await updateDoc(doc(db, COLLECTIONS.MILESTONES, milestoneId), convertDates(updates));
}

export async function deleteMilestoneDoc(milestoneId) {
  await deleteDoc(doc(db, COLLECTIONS.MILESTONES, milestoneId));
}

/* ══════════════════════════════════════════════════
   HD REQUEST – Draft Editing
   ══════════════════════════════════════════════════ */

export async function updateDraftRequest(requestId, updates, allUsers) {
  const docRef = doc(db, COLLECTIONS.HD_REQUESTS, requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const r = convertTimestamps({ id: snap.id, ...snap.data() });
  if (r.status !== 'draft') throw new Error('Can only edit draft requests');

  const now = new Date();
  const versions = [...(r.versions || []), {
    version: (r.versions?.length || 0) + 1,
    date: now,
    action: 'Edited draft',
    by: r.studentId,
  }];

  const fields = { updatedAt: now, versions };
  if (updates.title !== undefined) fields.title = updates.title;
  if (updates.description !== undefined) fields.description = updates.description;
  if (updates.type !== undefined) fields.type = updates.type;
  if (updates.documents !== undefined) fields.documents = updates.documents;

  await updateDoc(docRef, convertDates(fields));
  const user = allUsers?.find(u => u.id === r.studentId);
  await addAuditLog(r.studentId, user?.name, 'Edited Draft', 'HDRequest', requestId, `Edited draft "${fields.title || r.title}"`);
}

/* ══════════════════════════════════════════════════
   USER PROFILE UPDATES (Settings page)
   ══════════════════════════════════════════════════ */

export async function updateUserProfile(userId, updates) {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  const fields = {};
  if (updates.name !== undefined) fields.name = updates.name;
  if (updates.firstName !== undefined) fields.firstName = updates.firstName;
  if (updates.surname !== undefined) fields.surname = updates.surname;
  if (updates.title !== undefined) fields.title = updates.title;
  if (updates.programme !== undefined) fields.programme = updates.programme;
  if (updates.researchTitle !== undefined) fields.researchTitle = updates.researchTitle;
  if (updates.notificationPrefs !== undefined) fields.notificationPrefs = updates.notificationPrefs;
  if (updates.mustChangePassword !== undefined) fields.mustChangePassword = updates.mustChangePassword;
  await updateDoc(docRef, fields);
}

/* ══════════════════════════════════════════════════
   ADMIN – Create & Delete Users
   ══════════════════════════════════════════════════ */

export async function createUserDoc({ id, email, name, role, studentNumber, firstName, surname, title, permissions, generatedPassword, mustChangePassword, organization }) {
  const data = { email: email.toLowerCase(), name, role };
  if (studentNumber) data.studentNumber = studentNumber;
  if (firstName) data.firstName = firstName;
  if (surname) data.surname = surname;
  if (title) data.title = title;
  if (permissions?.length) data.permissions = permissions;
  if (generatedPassword) data.generatedPassword = generatedPassword;
  if (mustChangePassword !== undefined) data.mustChangePassword = mustChangePassword;
  if (organization) data.organization = organization;
  data.createdAt = serverTimestamp();
  await setDoc(doc(db, COLLECTIONS.USERS, id), data);
  await addAuditLog(id, 'Admin', 'Created User', 'User', id, `Created user: ${name} (${email})`);
  return { id, ...data };
}

export async function updateUserDoc(userId, updates, adminUser) {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  const fields = {};
  const allowedKeys = ['name', 'email', 'role', 'firstName', 'surname', 'title', 'permissions', 'studentNumber', 'organization', 'notificationPrefs', 'mustChangePassword', 'generatedPassword', 'programme', 'researchTitle'];
  for (const key of allowedKeys) {
    if (updates[key] !== undefined) fields[key] = updates[key];
  }
  await updateDoc(docRef, fields);
  const adminName = adminUser?.name || 'Admin';
  const adminId = adminUser?.id || 'system';
  await addAuditLog(adminId, adminName, 'Updated User', 'User', userId, `Updated user: ${userId}`);
}

export async function deleteUserDoc(userId, adminUser) {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  const adminName = adminUser?.name || 'Admin';
  const adminId = adminUser?.id || 'system';
  await addAuditLog(adminId, adminName, 'Deleted User', 'User', userId, `Deleted user ${userId}`);
}

/* ══════════════════════════════════════════════════
   HD REQUEST – Update document URLs (for PDF/Storage)
   ══════════════════════════════════════════════════ */

export async function updateRequestDocUrls(requestId, updates) {
  await updateDoc(doc(db, COLLECTIONS.HD_REQUESTS, requestId), convertDates(updates));
}

/* ══════════════════════════════════════════════════
   DEADLINE REMINDER CHECK (client-side)
   ══════════════════════════════════════════════════ */

export async function checkOverdueRequests(allRequests, allUsers) {
  const now = Date.now();
  const overdueItems = [];
  for (const r of allRequests) {
    if (!r.timerStart || !r.timerHours) continue;
    const end = new Date(r.timerStart).getTime() + r.timerHours * 3600000;
    if (now > end && !['approved', 'draft'].includes(r.status)) {
      overdueItems.push(r);
    }
  }
  return overdueItems;
}

/* ══════════════════════════════════════════════════
   48-HOUR REFERRAL NOTIFICATION CHECK
   ══════════════════════════════════════════════════ */

/**
 * Check for requests referred back > 48 hours ago without resubmission.
 * Creates notifications for affected students and their supervisors.
 */
export async function checkReferralNotifications(allRequests, allUsers) {
  const REFERRAL_HOURS = 48;
  const now = Date.now();
  const alerts = [];

  for (const r of allRequests) {
    // Only check requests in referred_back status
    if (r.status !== 'referred_back') continue;
    const referredAt = r.referredBackAt || r.updatedAt;
    if (!referredAt) continue;
    const referredTime = referredAt instanceof Date ? referredAt.getTime() : new Date(referredAt).getTime();
    const elapsed = (now - referredTime) / 3600000;
    if (elapsed >= REFERRAL_HOURS) {
      alerts.push({
        requestId: r.id,
        studentId: r.studentId,
        title: r.title,
        hoursElapsed: Math.round(elapsed),
        referredAt: new Date(referredTime),
      });
    }
  }

  // Create notifications for each overdue referral
  for (const alert of alerts) {
    const student = allUsers.find(u => u.id === alert.studentId);
    if (student) {
      await addNotificationDoc(
        alert.studentId,
        'Referral Pending Action',
        `Your request "${alert.title}" was referred back ${alert.hoursElapsed} hours ago and still needs attention.`,
        'warning',
        '/requests'
      );
    }
    // Notify supervisor if assigned
    const request = allRequests.find(rq => rq.id === alert.requestId);
    if (request?.supervisorId) {
      await addNotificationDoc(
        request.supervisorId,
        'Student Referral Overdue',
        `${student?.name || 'A student'}'s request "${alert.title}" has been pending referral action for ${alert.hoursElapsed} hours.`,
        'warning',
        '/requests'
      );
    }
  }

  return alerts;
}

/* ══════════════════════════════════════════════════
   PASSWORD GENERATION UTILITY
   ══════════════════════════════════════════════════ */

export function generateTemporaryPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/* ══════════════════════════════════════════════════
   CSV EXPORT (client-side, no Firestore needed)
   ══════════════════════════════════════════════════ */

export function exportToCSV(data, columns) {
  const cols = columns.map(c => typeof c === 'string' ? { label: c, accessor: c } : c);
  const header = cols.map(c => `"${String(c.label).replace(/"/g, '""')}"`).join(',');
  const rows = data.map(row => cols.map(c => {
    let val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
    if (val instanceof Date) val = val.toISOString().slice(0, 10);
    val = String(val ?? '').replace(/"/g, '""');
    return `"${val}"`;
  }).join(','));
  return [header, ...rows].join('\n');
}

export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
