// ============================================
// PostGrad Portal – Data Context (Firebase)
// Provides real-time Firestore data to all components
// ============================================

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { COLLECTIONS } from '../firebase/collections';
import {
  subscribeToFormTemplates,
  subscribeToFormSubmissions,
  createFormSubmission as fsCreateFormSubmission,
  updateFormSubmissionData as fsUpdateFormSubmissionData,
  completeFormSection as fsCompleteFormSection,
  referBackFormSection as fsReferBackFormSection,
  updateFormSubmissionStatus as fsUpdateFormSubmissionStatus,
  linkFormSubmission as fsLinkFormSubmission,
  setFormTemplate as fsSetFormTemplate,
  updateFormTemplate as fsUpdateFormTemplate,
  publishFormTemplate as fsPublishFormTemplate,
  archiveFormTemplate as fsArchiveFormTemplate,
  duplicateFormTemplate as fsDuplicateFormTemplate,
} from '../firebase/formTemplates';
import {
  subscribeToCollection,
  subscribeToUserNotifications,
  // Mutations
  createHDRequest as fsCreateHDRequest,
  submitToSupervisor as fsSubmitToSupervisor,
  validateAccessCode as fsValidateAccessCode,
  supervisorApprove as fsSupervisorApprove,
  coSupervisorSign as fsCoSupervisorSign,
  referBack as fsReferBack,
  forwardToFHD as fsForwardToFHD,
  recordFHDOutcome as fsRecordFHDOutcome,
  recordSHDOutcome as fsRecordSHDOutcome,
  resubmitRequest as fsResubmitRequest,
  nudgeStudent as fsNudgeStudent,
  updateStudentProfile as fsUpdateStudentProfile,
  updateUserRole as fsUpdateUserRole,
  updateDraftRequest as fsUpdateDraftRequest,
  updateUserProfile as fsUpdateUserProfile,
  updateMilestoneDoc as fsUpdateMilestone,
  deleteMilestoneDoc as fsDeleteMilestone,
  createUserDoc as fsCreateUserDoc,
  deleteUserDoc as fsDeleteUserDoc,
  updateRequestDocUrls as fsUpdateRequestDocUrls,
  checkOverdueRequests,
  addCalendarEventDoc,
  updateCalendarEventDoc,
  deleteCalendarEventDoc,
  addMilestoneDoc,
  addNotificationDoc,
  markNotificationsRead as fsMarkNotificationsRead,
  markNotificationRead as fsMarkNotificationRead,
  // Utilities
  generateAccessCode,
  exportToCSV,
  downloadCSV,
} from '../firebase/firestore';
import { orderBy } from 'firebase/firestore';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();

  /* ── Live collection state ── */
  const [users, setUsers] = useState([]);
  const [hdRequests, setHDRequests] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [studentProfiles, setStudentProfiles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ── Subscribe to collections on mount ── */
  useEffect(() => {
    const unsubs = [];
    let snapCount = 0;
    const totalSnaps = 8; // number of collection subscriptions
    const markReady = () => { snapCount++; if (snapCount >= totalSnaps) setLoading(false); };

    unsubs.push(subscribeToCollection(COLLECTIONS.USERS, (d) => { setUsers(d); markReady(); }));
    unsubs.push(subscribeToCollection(COLLECTIONS.HD_REQUESTS, (d) => { setHDRequests(d); markReady(); }));
    unsubs.push(subscribeToCollection(COLLECTIONS.CALENDAR_EVENTS, (d) => { setCalendarEvents(d); markReady(); }));
    unsubs.push(subscribeToCollection(COLLECTIONS.MILESTONES, (d) => { setMilestones(d); markReady(); }));
    unsubs.push(subscribeToCollection(COLLECTIONS.STUDENT_PROFILES, (d) => { setStudentProfiles(d); markReady(); }));
    unsubs.push(subscribeToCollection(COLLECTIONS.AUDIT_LOGS, (d) => { setAuditLogs(d); markReady(); }, [orderBy('timestamp', 'desc')]));
    unsubs.push(subscribeToFormTemplates((d) => { setFormTemplates(d); markReady(); }));
    unsubs.push(subscribeToFormSubmissions((d) => { setFormSubmissions(d); markReady(); }));

    // Fallback – if snapshots haven't all arrived in 5s, show the app anyway
    const fallback = setTimeout(() => setLoading(false), 5000);

    return () => {
      unsubs.forEach(fn => fn());
      clearTimeout(fallback);
    };
  }, []);

  /* ── Subscribe to user-specific notifications ── */
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    const unsub = subscribeToUserNotifications(user.id, setNotifications);
    return unsub;
  }, [user?.id]);

  /* ── Query helpers (derived from live state) ── */
  const getRequestsByStudent = useCallback(
    (studentId) => hdRequests.filter(r => r.studentId === studentId),
    [hdRequests]
  );

  const getRequestsForSupervisor = useCallback(
    (supervisorId) => hdRequests.filter(r =>
      (r.supervisorId === supervisorId || r.coSupervisorId === supervisorId) &&
      ['submitted_to_supervisor', 'supervisor_review', 'co_supervisor_review'].includes(r.status)
    ),
    [hdRequests]
  );

  const getRequestsForCoordinator = useCallback(
    () => hdRequests.filter(r =>
      ['coordinator_review', 'fhd_pending', 'shd_pending'].includes(r.status)
    ),
    [hdRequests]
  );

  const getNotificationsForUser = useCallback(
    (userId) => notifications.filter(n => n.userId === userId),
    [notifications]
  );

  const getStudentProfile = useCallback(
    (userId) => studentProfiles.find(p => p.userId === userId),
    [studentProfiles]
  );

  const getStudentsForSupervisor = useCallback(
    (supervisorId) => studentProfiles.filter(p =>
      p.supervisorId === supervisorId || p.coSupervisorId === supervisorId
    ),
    [studentProfiles]
  );

  const getUserById = useCallback(
    (userId) => users.find(u => u.id === userId),
    [users]
  );

  const getUsersByRole = useCallback(
    (...roles) => users.filter(u => roles.includes(u.role)),
    [users]
  );

  /* ── Mutation wrappers (pass allUsers for audit/notification) ── */
  const createHDRequest = useCallback(
    (data) => fsCreateHDRequest(data, users),
    [users]
  );
  const submitToSupervisor = useCallback(
    (requestId, userId) => fsSubmitToSupervisor(requestId, userId, users),
    [users]
  );
  const validateAccessCode = useCallback(
    (requestId, code) => fsValidateAccessCode(requestId, code),
    []
  );
  const supervisorApprove = useCallback(
    (requestId, userId, signatureName) => fsSupervisorApprove(requestId, userId, signatureName, users),
    [users]
  );
  const coSupervisorSign = useCallback(
    (requestId, userId, signatureName) => fsCoSupervisorSign(requestId, userId, signatureName, users),
    [users]
  );
  const referBack = useCallback(
    (requestId, userId, reason) => fsReferBack(requestId, userId, reason, users),
    [users]
  );
  const forwardToFHD = useCallback(
    (requestId, userId, signatureName) => fsForwardToFHD(requestId, userId, signatureName, users),
    [users]
  );
  const recordFHDOutcome = useCallback(
    (requestId, userId, outcome, refNum, reason) => fsRecordFHDOutcome(requestId, userId, outcome, refNum, reason, users),
    [users]
  );
  const recordSHDOutcome = useCallback(
    (requestId, userId, outcome, reason) => fsRecordSHDOutcome(requestId, userId, outcome, reason, users),
    [users]
  );
  const resubmitRequest = useCallback(
    (requestId, userId) => fsResubmitRequest(requestId, userId, users),
    [users]
  );
  const nudgeStudentFn = useCallback(
    (studentId, supervisorId, message) => fsNudgeStudent(studentId, supervisorId, message, users),
    [users]
  );
  const updateStudentProfileFn = useCallback(
    (userId, updates) => fsUpdateStudentProfile(userId, updates),
    []
  );
  const updateUserRoleFn = useCallback(
    (userId, newRole) => fsUpdateUserRole(userId, newRole, users),
    [users]
  );
  const addCalendarEvent = useCallback(
    (data) => addCalendarEventDoc(data),
    []
  );
  const updateCalendarEvent = useCallback(
    (eventId, updates) => updateCalendarEventDoc(eventId, updates),
    []
  );
  const deleteCalendarEvent = useCallback(
    (eventId) => deleteCalendarEventDoc(eventId),
    []
  );
  const addMilestone = useCallback(
    (data) => addMilestoneDoc(data),
    []
  );
  const addNotification = useCallback(
    (userId, title, message, type, link) => addNotificationDoc(userId, title, message, type, link),
    []
  );
  const markAllNotificationsRead = useCallback(
    () => { if (user?.id) return fsMarkNotificationsRead(user.id); },
    [user?.id]
  );
  const markOneNotificationRead = useCallback(
    (notifId) => fsMarkNotificationRead(notifId),
    []
  );

  // ── New mutations ──
  const updateDraftRequest = useCallback(
    (requestId, updates) => fsUpdateDraftRequest(requestId, updates, users),
    [users]
  );
  const updateUserProfileFn = useCallback(
    (userId, updates) => fsUpdateUserProfile(userId, updates),
    []
  );
  const updateMilestone = useCallback(
    (milestoneId, updates) => fsUpdateMilestone(milestoneId, updates),
    []
  );
  const deleteMilestone = useCallback(
    (milestoneId) => fsDeleteMilestone(milestoneId),
    []
  );
  const createUserDoc = useCallback(
    (userId, data) => fsCreateUserDoc({ id: userId, ...data }),
    []
  );
  const deleteUserDoc = useCallback(
    (userId) => fsDeleteUserDoc(userId),
    []
  );
  const updateRequestDocUrls = useCallback(
    (requestId, updates) => fsUpdateRequestDocUrls(requestId, updates),
    []
  );

  /* ── Form Template & Submission mutations ── */
  const createFormSubmission = useCallback(
    (data) => fsCreateFormSubmission(data),
    []
  );
  const updateFormSubmissionData = useCallback(
    (submissionId, fieldId, value) => fsUpdateFormSubmissionData(submissionId, fieldId, value),
    []
  );
  const completeFormSection = useCallback(
    (submissionId, sectionId, userId, signatureData) => fsCompleteFormSection(submissionId, sectionId, userId, signatureData),
    []
  );
  const referBackFormSection = useCallback(
    (submissionId, sectionId, userId, comment) => fsReferBackFormSection(submissionId, sectionId, userId, comment),
    []
  );
  const updateFormSubmissionStatus = useCallback(
    (submissionId, status) => fsUpdateFormSubmissionStatus(submissionId, status),
    []
  );
  const linkFormSubmission = useCallback(
    (submissionId, requestId) => fsLinkFormSubmission(submissionId, requestId),
    []
  );
  const setFormTemplate = useCallback(
    (templateId, data) => fsSetFormTemplate(templateId, data),
    []
  );
  const updateFormTemplate = useCallback(
    (templateId, updates) => fsUpdateFormTemplate(templateId, updates),
    []
  );
  const publishFormTemplate = useCallback(
    (templateId) => fsPublishFormTemplate(templateId),
    []
  );
  const archiveFormTemplate = useCallback(
    (templateId) => fsArchiveFormTemplate(templateId),
    []
  );
  const duplicateFormTemplate = useCallback(
    (templateId) => fsDuplicateFormTemplate(templateId),
    []
  );

  const getFormTemplateBySlug = useCallback(
    (slug) => formTemplates.find(t => t.slug === slug),
    [formTemplates]
  );

  const getFormSubmissionsForRequest = useCallback(
    (requestId) => formSubmissions.filter(s => s.linkedRequestId === requestId),
    [formSubmissions]
  );

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  /* ── Auto deadline reminders (fires once per session when data loads) ── */
  const reminderChecked = useRef(false);
  useEffect(() => {
    if (loading || reminderChecked.current || !user?.id || hdRequests.length === 0) return;
    reminderChecked.current = true;
    (async () => {
      try {
        const overdue = await checkOverdueRequests(hdRequests, users);
        for (const item of overdue) {
          // Only create notification if user is owner
          if (item.currentOwner === user.id) {
            await addNotificationDoc(
              user.id,
              'Overdue Deadline',
              `Request "${item.title}" deadline has passed (was due ${item.hoursOverdue}h ago).`,
              'warning',
              '/requests'
            );
          }
        }
      } catch (err) {
        console.error('Deadline reminder check failed:', err);
      }
    })();
  }, [loading, user?.id, hdRequests, users]);

  const value = useMemo(() => ({
    // Loading state
    loading,

    // Live data arrays (named to match mockData exports)
    mockUsers: users,
    mockHDRequests: hdRequests,
    mockCalendarEvents: calendarEvents,
    mockMilestones: milestones,
    mockNotifications: notifications,
    mockStudentProfiles: studentProfiles,
    mockAuditLogs: auditLogs,
    formTemplates,
    formSubmissions,

    // Query functions
    getRequestsByStudent,
    getRequestsForSupervisor,
    getRequestsForCoordinator,
    getNotificationsForUser,
    getStudentProfile,
    getStudentsForSupervisor,
    getUserById,
    getUsersByRole,

    // Notification state
    unreadCount,

    // Mutations
    createHDRequest,
    submitToSupervisor,
    validateAccessCode,
    supervisorApprove,
    coSupervisorSign,
    referBack,
    forwardToFHD,
    recordFHDOutcome,
    recordSHDOutcome,
    resubmitRequest,
    nudgeStudent: nudgeStudentFn,
    updateStudentProfile: updateStudentProfileFn,
    updateUserRole: updateUserRoleFn,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    addMilestone,
    addNotification,
    markAllRead: markAllNotificationsRead,
    markOneRead: markOneNotificationRead,
    markNotificationsRead: markAllNotificationsRead,
    markNotificationRead: markOneNotificationRead,

    // Named to match old mockData notification exports
    markNotificationsReadFn: markAllNotificationsRead,
    markNotificationReadFn: markOneNotificationRead,

    // New mutations
    updateDraftRequest,
    updateUserProfile: updateUserProfileFn,
    updateMilestone,
    deleteMilestone,
    createUserDoc,
    deleteUserDoc,
    updateRequestDocUrls,
    checkOverdueRequests: (reqs) => checkOverdueRequests(reqs, users),

    // Form template & submission operations
    createFormSubmission,
    updateFormSubmissionData,
    completeFormSection,
    referBackFormSection,
    updateFormSubmissionStatus,
    linkFormSubmission,
    setFormTemplate,
    updateFormTemplate,
    publishFormTemplate,
    archiveFormTemplate,
    duplicateFormTemplate,
    getFormTemplateBySlug,
    getFormSubmissionsForRequest,

    // Utilities
    generateAccessCode,
    exportToCSV,
    downloadCSV,
  }), [
    loading, users, hdRequests, calendarEvents, milestones, notifications,
    studentProfiles, auditLogs, unreadCount,
    formTemplates, formSubmissions,
    getRequestsByStudent, getRequestsForSupervisor, getRequestsForCoordinator,
    getNotificationsForUser, getStudentProfile, getStudentsForSupervisor, getUserById, getUsersByRole,
    createHDRequest, submitToSupervisor, validateAccessCode,
    supervisorApprove, coSupervisorSign, referBack, forwardToFHD,
    recordFHDOutcome, recordSHDOutcome, resubmitRequest,
    nudgeStudentFn, updateStudentProfileFn, updateUserRoleFn,
    addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
    addMilestone, addNotification,
    markAllNotificationsRead, markOneNotificationRead,
    updateDraftRequest, updateUserProfileFn, updateMilestone, deleteMilestone,
    createUserDoc, deleteUserDoc, updateRequestDocUrls,
    createFormSubmission, updateFormSubmissionData, completeFormSection,
    referBackFormSection, updateFormSubmissionStatus, linkFormSubmission,
    setFormTemplate, updateFormTemplate, publishFormTemplate,
    archiveFormTemplate, duplicateFormTemplate,
    getFormTemplateBySlug, getFormSubmissionsForRequest,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}

export default DataContext;
