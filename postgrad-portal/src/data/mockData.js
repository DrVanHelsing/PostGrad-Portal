// ============================================
// PostGrad Portal – Mock Data Store (Mutable)
// ============================================

/* ── Tiny reactive store ── */
let _listeners = [];
export function subscribe(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter(l => l !== fn); }; }
function notify() { _listeners.forEach(fn => fn()); }

/* ──────────────────── USERS ──────────────────── */
export const mockUsers = [
  { id: 'student-001', email: 'student@uwc.ac.za', name: 'Thabo Molefe', role: 'student', studentNumber: '3847291', department: 'Computer Science' },
  { id: 'student-002', email: 'student2@uwc.ac.za', name: 'Naledi Khumalo', role: 'student', studentNumber: '3892456', department: 'Computer Science' },
  { id: 'student-003', email: 'student3@uwc.ac.za', name: 'Sipho Dlamini', role: 'student', studentNumber: '3901234', department: 'Information Systems' },
  { id: 'supervisor-001', email: 'supervisor@uwc.ac.za', name: 'Prof. Sarah van der Berg', role: 'supervisor', department: 'Computer Science' },
  { id: 'supervisor-002', email: 'supervisor2@uwc.ac.za', name: 'Dr. James Nkosi', role: 'supervisor', department: 'Computer Science' },
  { id: 'coordinator-001', email: 'coordinator@uwc.ac.za', name: 'Dr. Fatima Patel', role: 'coordinator', department: 'Faculty of Natural Sciences' },
  { id: 'admin-001', email: 'admin@uwc.ac.za', name: 'Linda Mkhize', role: 'admin', department: 'Postgraduate Administration' },
];

/* ──────────────────── HD REQUESTS ──────────────────── */
export const mockHDRequests = [
  {
    id: 'hdr-001', type: 'title_registration',
    title: 'PhD Title Registration – Machine Learning in Healthcare',
    status: 'supervisor_review', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: new Date('2026-01-15'), updatedAt: new Date('2026-02-01'),
    currentOwner: 'supervisor-001',
    accessCode: 'ABC123', accessCodeExpiry: new Date('2026-02-10'),
    description: 'Application for PhD title registration in the field of machine learning applications for healthcare diagnostics.',
    documents: [{ name: 'Research_Proposal_v2.pdf', size: '2.4 MB', uploadedAt: new Date('2026-01-15') }],
    versions: [
      { version: 1, date: new Date('2026-01-15'), action: 'Created', by: 'student-001' },
      { version: 2, date: new Date('2026-01-28'), action: 'Submitted to supervisor', by: 'student-001' },
    ],
    signatures: [],
    timerStart: new Date('2026-02-01'), timerHours: 48,
  },
  {
    id: 'hdr-002', type: 'progress_report',
    title: 'Annual Progress Report 2025',
    status: 'approved', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: new Date('2025-11-01'), updatedAt: new Date('2025-12-15'),
    currentOwner: 'coordinator-001',
    fhdOutcome: 'approved', shdOutcome: 'approved', referenceNumber: 'FHD/2025/0234',
    description: 'Annual academic progress report for the 2025 academic year.',
    documents: [
      { name: 'Progress_Report_2025.pdf', size: '1.8 MB', uploadedAt: new Date('2025-11-01') },
      { name: 'Supervisor_Feedback.pdf', size: '340 KB', uploadedAt: new Date('2025-11-15') },
    ],
    versions: [
      { version: 1, date: new Date('2025-11-01'), action: 'Created', by: 'student-001' },
      { version: 2, date: new Date('2025-11-10'), action: 'Submitted to supervisor', by: 'student-001' },
      { version: 3, date: new Date('2025-11-15'), action: 'Supervisor approved', by: 'supervisor-001' },
      { version: 4, date: new Date('2025-12-01'), action: 'Faculty Board approved', by: 'coordinator-001' },
      { version: 5, date: new Date('2025-12-15'), action: 'Senate Board approved', by: 'admin-001' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-001', name: 'Prof. Sarah van der Berg', date: new Date('2025-11-15') },
      { role: 'coordinator', userId: 'coordinator-001', name: 'Dr. Fatima Patel', date: new Date('2025-12-01') },
    ],
  },
  {
    id: 'hdr-003', type: 'extension',
    title: 'Request for 6-month Extension',
    status: 'draft', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: new Date('2026-02-05'), updatedAt: new Date('2026-02-05'),
    currentOwner: 'student-001',
    description: 'Extension request due to delays in data collection from partner hospitals.',
    documents: [], versions: [
      { version: 1, date: new Date('2026-02-05'), action: 'Created', by: 'student-001' },
    ], signatures: [],
  },
  {
    id: 'hdr-004', type: 'registration',
    title: 'Masters Registration – Data Science',
    status: 'coordinator_review', studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coSupervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: new Date('2026-01-20'), updatedAt: new Date('2026-02-03'),
    currentOwner: 'coordinator-001',
    description: 'Initial registration application for MSc Data Science programme.',
    documents: [{ name: 'Registration_Form.pdf', size: '1.1 MB', uploadedAt: new Date('2026-01-20') }],
    versions: [
      { version: 1, date: new Date('2026-01-20'), action: 'Created', by: 'student-002' },
      { version: 2, date: new Date('2026-01-25'), action: 'Submitted to supervisor', by: 'student-002' },
      { version: 3, date: new Date('2026-01-30'), action: 'Supervisor approved', by: 'supervisor-002' },
      { version: 4, date: new Date('2026-02-01'), action: 'Co-supervisor signed', by: 'supervisor-001' },
      { version: 5, date: new Date('2026-02-03'), action: 'Forwarded to coordinator', by: 'supervisor-002' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-002', name: 'Dr. James Nkosi', date: new Date('2026-01-30') },
      { role: 'co-supervisor', userId: 'supervisor-001', name: 'Prof. Sarah van der Berg', date: new Date('2026-02-01') },
    ],
  },
  {
    id: 'hdr-005', type: 'examination_entry',
    title: 'Thesis Examination Entry',
    status: 'fhd_pending', studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coordinatorId: 'coordinator-001',
    createdAt: new Date('2026-01-10'), updatedAt: new Date('2026-02-01'),
    currentOwner: 'coordinator-001',
    description: 'Submission of thesis for examination and appointment of external examiners.',
    documents: [{ name: 'Thesis_Final.pdf', size: '8.2 MB', uploadedAt: new Date('2026-01-10') }],
    versions: [
      { version: 1, date: new Date('2026-01-10'), action: 'Created', by: 'student-002' },
      { version: 2, date: new Date('2026-01-18'), action: 'Submitted to supervisor', by: 'student-002' },
      { version: 3, date: new Date('2026-01-25'), action: 'Supervisor approved', by: 'supervisor-002' },
      { version: 4, date: new Date('2026-02-01'), action: 'Coordinator forwarded to Faculty Board', by: 'coordinator-001' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-002', name: 'Dr. James Nkosi', date: new Date('2026-01-25') },
      { role: 'coordinator', userId: 'coordinator-001', name: 'Dr. Fatima Patel', date: new Date('2026-02-01') },
    ],
  },
  {
    id: 'hdr-006', type: 'leave_of_absence',
    title: 'Leave of Absence – Medical Reasons',
    status: 'submitted_to_supervisor', studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: new Date('2026-02-10'), updatedAt: new Date('2026-02-10'),
    currentOwner: 'supervisor-001',
    accessCode: 'XYZ789', accessCodeExpiry: new Date('2026-02-13'),
    description: 'Request for a semester of leave due to medical reasons. Supporting documentation attached.',
    documents: [{ name: 'Medical_Certificate.pdf', size: '520 KB', uploadedAt: new Date('2026-02-10') }],
    versions: [
      { version: 1, date: new Date('2026-02-10'), action: 'Created and submitted', by: 'student-003' },
    ],
    signatures: [],
    timerStart: new Date('2026-02-10'), timerHours: 48,
  },
  {
    id: 'hdr-007', type: 'supervisor_change',
    title: 'Change of Supervisor Request',
    status: 'referred_back', studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-002', coordinatorId: 'coordinator-001',
    createdAt: new Date('2025-10-01'), updatedAt: new Date('2025-11-20'),
    currentOwner: 'student-003',
    description: 'Request to change primary supervisor. Referred back for additional motivation.',
    notes: 'Please provide a more detailed motivation for the supervisor change, including consultation with both current and proposed supervisors.',
    referredBackReason: 'Insufficient motivation provided. Please include written statements from both current and proposed supervisors.',
    referredBackBy: 'coordinator-001',
    referredBackDate: new Date('2025-11-20'),
    documents: [], versions: [
      { version: 1, date: new Date('2025-10-01'), action: 'Created', by: 'student-003' },
      { version: 2, date: new Date('2025-10-15'), action: 'Supervisor approved', by: 'supervisor-002' },
      { version: 3, date: new Date('2025-11-20'), action: 'Referred back by coordinator', by: 'coordinator-001' },
    ],
    signatures: [],
  },
];

/* ──────────────────── CALENDAR EVENTS ──────────────────── */
export const mockCalendarEvents = [
  { id: 'evt-001', title: 'Faculty Board Meeting', date: new Date('2026-02-15'), time: '10:00', type: 'meeting', scope: 'faculty', description: 'Faculty Higher Degrees Committee meeting', createdBy: 'coordinator-001' },
  { id: 'evt-002', title: 'Progress Report Deadline', date: new Date('2026-03-01'), time: '17:00', type: 'deadline', scope: 'all', description: 'Annual progress reports due for all registered postgraduate students', createdBy: 'admin-001' },
  { id: 'evt-003', title: 'Senate Board Meeting', date: new Date('2026-02-25'), time: '14:00', type: 'meeting', scope: 'all', description: 'Senate Higher Degrees Committee meeting', createdBy: 'admin-001' },
  { id: 'evt-004', title: 'Research Methodology Workshop', date: new Date('2026-02-20'), time: '09:00', type: 'event', scope: 'faculty', description: 'Workshop on advanced research methodologies for postgraduate students', createdBy: 'coordinator-001' },
  { id: 'evt-005', title: 'Registration Deadline', date: new Date('2026-02-28'), time: '23:59', type: 'deadline', scope: 'all', description: 'Final deadline for 2026 registrations', createdBy: 'admin-001' },
  { id: 'evt-006', title: 'Departmental Seminar', date: new Date('2026-03-05'), time: '11:00', type: 'event', scope: 'department', description: 'Monthly research seminar series – guest speaker from UCT', createdBy: 'coordinator-001' },
  { id: 'evt-007', title: 'Ethics Committee Meeting', date: new Date('2026-03-10'), time: '13:00', type: 'meeting', scope: 'faculty', description: 'Ethics review meeting for pending research proposals', createdBy: 'coordinator-001' },
];

/* ──────────────────── MILESTONES ──────────────────── */
export const mockMilestones = [
  { id: 'ms-001', studentId: 'student-001', title: 'SAICSIT Conference Presentation', type: 'conference', date: new Date('2025-10-15'), description: 'Presented paper on ML in healthcare diagnostics' },
  { id: 'ms-002', studentId: 'student-001', title: 'Python for Data Science Workshop', type: 'workshop', date: new Date('2025-08-20'), description: 'Completed 3-day intensive workshop' },
  { id: 'ms-003', studentId: 'student-001', title: 'Department Journal Club', type: 'journal_club', date: new Date('2026-01-25'), description: 'Led discussion on recent Nature paper' },
  { id: 'ms-004', studentId: 'student-002', title: 'Journal Publication Accepted', type: 'publication', date: new Date('2025-12-01'), description: 'Paper accepted in SA Journal of Computer Science' },
  { id: 'ms-005', studentId: 'student-002', title: 'Data Ethics Training', type: 'training', date: new Date('2025-09-10'), description: 'Completed online training in research data ethics' },
];

/* ──────────────────── NOTIFICATIONS ──────────────────── */
export const mockNotifications = [
  { id: 'notif-001', userId: 'student-001', title: 'Request Under Review', message: 'Your title registration request is being reviewed by Prof. van der Berg', type: 'info', read: false, createdAt: new Date('2026-02-01'), link: '/requests' },
  { id: 'notif-002', userId: 'student-001', title: 'Upcoming Deadline', message: 'Progress Report deadline is in 3 weeks', type: 'warning', read: false, createdAt: new Date('2026-02-05'), link: '/calendar' },
  { id: 'notif-003', userId: 'supervisor-001', title: 'New Request for Review', message: 'Thabo Molefe has submitted a title registration for your review', type: 'info', read: false, createdAt: new Date('2026-02-01'), link: '/requests' },
  { id: 'notif-004', userId: 'supervisor-001', title: 'Leave Request Submitted', message: 'Sipho Dlamini has submitted a leave of absence request', type: 'info', read: true, createdAt: new Date('2026-02-10'), link: '/requests' },
  { id: 'notif-005', userId: 'coordinator-001', title: 'Request Awaiting Committee', message: 'Thesis examination entry from Naledi Khumalo is ready for the Faculty Board', type: 'warning', read: false, createdAt: new Date('2026-02-02'), link: '/requests' },
  { id: 'notif-006', userId: 'coordinator-001', title: 'New Request for Review', message: 'Masters registration from Naledi Khumalo requires coordinator review', type: 'info', read: false, createdAt: new Date('2026-02-03'), link: '/requests' },
  { id: 'notif-007', userId: 'admin-001', title: 'System Report Generated', message: 'Monthly system usage report is ready for download', type: 'success', read: true, createdAt: new Date('2026-02-01') },
  { id: 'notif-008', userId: 'admin-001', title: 'New User Registration', message: '3 new student accounts pending approval', type: 'info', read: false, createdAt: new Date('2026-02-06') },
];

/* ──────────────────── STUDENT PROFILES ──────────────────── */
export const mockStudentProfiles = [
  {
    userId: 'student-001', studentNumber: '3847291', programme: 'PhD Computer Science', degree: 'Doctor of Philosophy',
    faculty: 'Natural Sciences', department: 'Computer Science', registrationDate: new Date('2023-02-01'),
    expectedCompletion: new Date('2026-12-31'), yearsRegistered: 3, supervisorId: 'supervisor-001',
    thesisTitle: 'Machine Learning Applications in Healthcare Diagnostics', status: 'active',
    supervisorHistory: [
      { supervisorId: 'supervisor-001', name: 'Prof. Sarah van der Berg', role: 'primary', from: new Date('2023-02-01'), to: null },
    ],
  },
  {
    userId: 'student-002', studentNumber: '3892456', programme: 'MSc Data Science', degree: 'Master of Science',
    faculty: 'Natural Sciences', department: 'Computer Science', registrationDate: new Date('2024-02-01'),
    expectedCompletion: new Date('2026-06-30'), yearsRegistered: 2, supervisorId: 'supervisor-002', coSupervisorId: 'supervisor-001',
    thesisTitle: 'Predictive Analytics for Urban Planning', status: 'active',
    supervisorHistory: [
      { supervisorId: 'supervisor-002', name: 'Dr. James Nkosi', role: 'primary', from: new Date('2024-02-01'), to: null },
      { supervisorId: 'supervisor-001', name: 'Prof. Sarah van der Berg', role: 'co-supervisor', from: new Date('2024-06-01'), to: null },
    ],
  },
  {
    userId: 'student-003', studentNumber: '3901234', programme: 'MSc Information Systems', degree: 'Master of Science',
    faculty: 'Natural Sciences', department: 'Information Systems', registrationDate: new Date('2025-02-01'),
    expectedCompletion: new Date('2027-06-30'), yearsRegistered: 1, supervisorId: 'supervisor-001',
    thesisTitle: 'Blockchain-based Academic Credential Verification', status: 'active',
    supervisorHistory: [
      { supervisorId: 'supervisor-001', name: 'Prof. Sarah van der Berg', role: 'primary', from: new Date('2025-02-01'), to: null },
    ],
  },
];

/* ──────────────────── AUDIT LOGS ──────────────────── */
export const mockAuditLogs = [
  { id: 'audit-001', timestamp: new Date('2026-02-10T09:15:00'), userId: 'student-003', userName: 'Sipho Dlamini', action: 'Submitted Request', entityType: 'HDRequest', entityId: 'hdr-006', details: 'Submitted leave of absence request to supervisor' },
  { id: 'audit-002', timestamp: new Date('2026-02-05T10:30:00'), userId: 'student-001', userName: 'Thabo Molefe', action: 'Created Request', entityType: 'HDRequest', entityId: 'hdr-003', details: 'Created extension request – draft saved' },
  { id: 'audit-003', timestamp: new Date('2026-02-03T11:00:00'), userId: 'coordinator-001', userName: 'Dr. Fatima Patel', action: 'Advanced Request', entityType: 'HDRequest', entityId: 'hdr-004', details: 'Moved registration to coordinator review stage' },
  { id: 'audit-004', timestamp: new Date('2026-02-01T14:15:00'), userId: 'student-001', userName: 'Thabo Molefe', action: 'Submitted Request', entityType: 'HDRequest', entityId: 'hdr-001', details: 'Submitted title registration to supervisor with access code generated' },
  { id: 'audit-005', timestamp: new Date('2026-02-01T16:00:00'), userId: 'supervisor-001', userName: 'Prof. Sarah van der Berg', action: 'Opened Request', entityType: 'HDRequest', entityId: 'hdr-001', details: 'Validated access code and opened request for review' },
  { id: 'audit-006', timestamp: new Date('2026-01-20T08:45:00'), userId: 'student-002', userName: 'Naledi Khumalo', action: 'Created Request', entityType: 'HDRequest', entityId: 'hdr-004', details: 'Created masters registration application' },
  { id: 'audit-007', timestamp: new Date('2025-12-15T13:30:00'), userId: 'admin-001', userName: 'Linda Mkhize', action: 'Final Approval', entityType: 'HDRequest', entityId: 'hdr-002', details: 'Progress report received Senate Board approval – marked as approved' },
  { id: 'audit-008', timestamp: new Date('2025-11-20T10:00:00'), userId: 'coordinator-001', userName: 'Dr. Fatima Patel', action: 'Referred Back', entityType: 'HDRequest', entityId: 'hdr-007', details: 'Supervisor change request referred back – additional motivation required' },
];

/* ══════════════════════════════════════════════════
   QUERY FUNCTIONS
   ══════════════════════════════════════════════════ */

export const getRequestsByStudent = (studentId) =>
  mockHDRequests.filter((r) => r.studentId === studentId);

export const getRequestsForSupervisor = (supervisorId) =>
  mockHDRequests.filter(
    (r) =>
      (r.supervisorId === supervisorId || r.coSupervisorId === supervisorId) &&
      ['submitted_to_supervisor', 'supervisor_review', 'co_supervisor_review'].includes(r.status)
  );

export const getRequestsForCoordinator = () =>
  mockHDRequests.filter((r) =>
    ['coordinator_review', 'fhd_pending', 'shd_pending'].includes(r.status)
  );

export const getNotificationsForUser = (userId) =>
  mockNotifications.filter((n) => n.userId === userId);

export const getStudentProfile = (userId) =>
  mockStudentProfiles.find((p) => p.userId === userId);

export const getStudentsForSupervisor = (supervisorId) =>
  mockStudentProfiles.filter(
    (p) => p.supervisorId === supervisorId || p.coSupervisorId === supervisorId
  );

export const getUserById = (userId) =>
  mockUsers.find((u) => u.id === userId);

export const generateAccessCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

let _idCounter = 100;
const nextId = (prefix) => `${prefix}-${++_idCounter}`;

/* ══════════════════════════════════════════════════
   MUTATION FUNCTIONS (mock backend actions)
   ══════════════════════════════════════════════════ */

/* ── Add audit log helper ── */
function addAuditLog(userId, action, entityType, entityId, details) {
  const user = getUserById(userId);
  mockAuditLogs.unshift({
    id: nextId('audit'),
    timestamp: new Date(),
    userId, userName: user?.name || userId,
    action, entityType, entityId, details,
  });
}

/* ── Add notification helper ── */
export function addNotification(userId, title, message, type = 'info', link) {
  mockNotifications.unshift({
    id: nextId('notif'), userId, title, message, type,
    read: false, createdAt: new Date(), link,
  });
  notify();
}

/* ── Mark notifications read ── */
export function markNotificationsRead(userId) {
  mockNotifications.forEach(n => { if (n.userId === userId) n.read = true; });
  notify();
}

export function markNotificationRead(notifId) {
  const n = mockNotifications.find(x => x.id === notifId);
  if (n) n.read = true;
  notify();
}

/* ── Create HD Request ── */
export function createHDRequest({ type, title, description, studentId, studentName, supervisorId, coordinatorId, documents = [] }) {
  const id = nextId('hdr');
  const now = new Date();
  const request = {
    id, type, title, description, status: 'draft',
    studentId, studentName, supervisorId, coordinatorId,
    createdAt: now, updatedAt: now, currentOwner: studentId,
    documents, versions: [{ version: 1, date: now, action: 'Created', by: studentId }],
    signatures: [],
  };
  mockHDRequests.push(request);
  addAuditLog(studentId, 'Created Request', 'HDRequest', id, `Created ${title}`);
  notify();
  return request;
}

/* ── Submit to Supervisor ── */
export function submitToSupervisor(requestId, userId) {
  const r = mockHDRequests.find(x => x.id === requestId);
  if (!r) return;
  const code = generateAccessCode();
  r.status = 'submitted_to_supervisor';
  r.currentOwner = r.supervisorId;
  r.accessCode = code;
  r.accessCodeExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
  r.timerStart = new Date();
  r.timerHours = 48;
  r.updatedAt = new Date();
  r.versions.push({ version: r.versions.length + 1, date: new Date(), action: 'Submitted to supervisor', by: userId });
  addAuditLog(userId, 'Submitted Request', 'HDRequest', requestId, `Submitted ${r.title} to supervisor`);
  const sup = getUserById(r.supervisorId);
  addNotification(r.supervisorId, 'New Request for Review', `${r.studentName} has submitted "${r.title}" for your review. Access code: ${code}`, 'info', '/requests');
  addNotification(r.studentId, 'Request Submitted', `Your request "${r.title}" has been submitted to ${sup?.name}`, 'success', '/tracker');
  notify();
}

/* ── Validate access code ── */
export function validateAccessCode(requestId, code) {
  const r = mockHDRequests.find(x => x.id === requestId);
  if (!r || !r.accessCode) return { valid: false, error: 'No access code set' };
  if (r.accessCode !== code.toUpperCase()) return { valid: false, error: 'Invalid access code' };
  if (r.accessCodeExpiry && new Date() > new Date(r.accessCodeExpiry)) return { valid: false, error: 'Access code has expired' };
  if (r.status === 'submitted_to_supervisor') {
    r.status = 'supervisor_review';
    r.updatedAt = new Date();
    r.versions.push({ version: r.versions.length + 1, date: new Date(), action: 'Access code validated – supervisor review started', by: r.currentOwner });
    addAuditLog(r.currentOwner, 'Opened Request', 'HDRequest', requestId, 'Validated access code and opened request for review');
    notify();
  }
  return { valid: true };
}

/* ── Supervisor Approve & Forward ── */
export function supervisorApprove(requestId, userId, signatureName) {
  const r = mockHDRequests.find(x => x.id === requestId);
  if (!r) return;
  r.signatures.push({ role: 'supervisor', userId, name: signatureName || getUserById(userId)?.name, date: new Date() });
  if (r.coSupervisorId && !r.signatures.find(s => s.role === 'co-supervisor')) {
    r.status = 'co_supervisor_review';
    r.currentOwner = r.coSupervisorId;
    const newCode = generateAccessCode();
    r.accessCode = newCode;
    r.accessCodeExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
    r.timerStart = new Date();
    r.timerHours = 48;
    r.versions.push({ version: r.versions.length + 1, date: new Date(), action: 'Supervisor approved, forwarded to co-supervisor', by: userId });
    addAuditLog(userId, 'Approved Request', 'HDRequest', requestId, `Approved and forwarded to co-supervisor`);
    addNotification(r.coSupervisorId, 'Co-Supervisor Review Required', `"${r.title}" requires your review and signature. Code: ${newCode}`, 'info', '/requests');
  } else {
    r.status = 'coordinator_review';
    r.currentOwner = r.coordinatorId;
    r.accessCode = null;
    r.versions.push({ version: r.versions.length + 1, date: new Date(), action: 'Supervisor approved, forwarded to coordinator', by: userId });
    addAuditLog(userId, 'Approved Request', 'HDRequest', requestId, `Approved and forwarded to coordinator`);
    addNotification(r.coordinatorId, 'Request Awaiting Review', `"${r.title}" from ${r.studentName} is ready for coordinator review`, 'info', '/requests');
  }
  r.updatedAt = new Date();
  addNotification(r.studentId, 'Request Approved by Supervisor', `Your request "${r.title}" has been approved and forwarded`, 'success', '/tracker');
  notify();
}

/* ── Co-Supervisor Sign ── */
export function coSupervisorSign(requestId, userId, signatureName) {
  const r = mockHDRequests.find(x => x.id === requestId);
  if (!r) return;
  r.signatures.push({ role: 'co-supervisor', userId, name: signatureName || getUserById(userId)?.name, date: new Date() });
  r.status = 'coordinator_review';
  r.currentOwner = r.coordinatorId;
  r.accessCode = null;
  r.updatedAt = new Date();
  r.versions.push({ version: r.versions.length + 1, date: new Date(), action: 'Co-supervisor signed, forwarded to coordinator', by: userId });
  addAuditLog(userId, 'Co-Supervisor Signed', 'HDRequest', requestId, 'Co-supervisor signed and forwarded to coordinator');
  addNotification(r.coordinatorId, 'Request Ready for Review', `"${r.title}" has been signed by all supervisors and is ready for coordinator review`, 'info', '/requests');
  addNotification(r.studentId, 'Co-Supervisor Signed', `Your request "${r.title}" has been signed by the co-supervisor`, 'success', '/tracker');
  notify();
}

/* ── Refer Back ── */
export function referBack(requestId, userId, reason) {
  const r = mockHDRequests.find(x => x.id === requestId);
  if (!r) return;
  r.status = 'referred_back';
  r.currentOwner = r.studentId;
  r.referredBackReason = reason;
  r.referredBackBy = userId;
  r.referredBackDate = new Date();
  r.notes = reason;
  r.accessCode = null;
  r.timerStart = new Date();
  r.timerHours = 24;
  r.updatedAt = new Date();
  r.versions.push({ version: r.versions.length + 1, date: new Date(), action: `Referred back: ${reason}`, by: userId });
  addAuditLog(userId, 'Referred Back', 'HDRequest', requestId, `Request referred back: ${reason}`);
  addNotification(r.studentId, 'Request Referred Back', `Your request "${r.title}" has been referred back: ${reason}`, 'error', '/requests');
  if (r.supervisorId !== userId) {
    addNotification(r.supervisorId, 'Request Referred Back', `"${r.title}" for ${r.studentName} has been referred back`, 'warning', '/requests');
  }
  notify();
}

/* ── Coordinator Forward to FHD ── */
export function forwardToFHD(requestId, userId, signatureName) {
  const r = mockHDRequests.find(x => x.id === requestId);
  if (!r) return;
  r.signatures.push({ role: 'coordinator', userId, name: signatureName || getUserById(userId)?.name, date: new Date() });
  r.status = 'fhd_pending';
  r.currentOwner = r.coordinatorId;
  r.locked = true;
  r.updatedAt = new Date();
  r.versions.push({ version: r.versions.length + 1, date: new Date(), action: 'Coordinator signed, forwarded to Faculty Board', by: userId });
  addAuditLog(userId, 'Forwarded to Faculty Board', 'HDRequest', requestId, 'Signed and forwarded to Faculty Higher Degrees Committee');
  addNotification('admin-001', 'Request Forwarded to Faculty Board', `"${r.title}" from ${r.studentName} has been forwarded to the Faculty Board`, 'info', '/requests');
  addNotification(r.studentId, 'Request at Faculty Board', `Your request "${r.title}" is now with the Faculty Higher Degrees Committee`, 'info', '/tracker');
  notify();
}

/* ── Record FHD Outcome ── */
export function recordFHDOutcome(requestId, userId, outcome, referenceNumber, reason) {
  const r = mockHDRequests.find(x => x.id === requestId);
  if (!r) return;
  r.fhdOutcome = outcome;
  r.referenceNumber = referenceNumber || r.referenceNumber;
  r.updatedAt = new Date();
  if (outcome === 'approved') {
    r.status = 'shd_pending';
    r.shdOutcome = 'approved'; // auto-checked per spec 5.2
    r.versions.push({ version: r.versions.length + 1, date: new Date(), action: `Faculty Board Approved (Ref: ${referenceNumber}). Senate Board auto-approved.`, by: userId });
    addAuditLog(userId, 'Faculty Board Approved', 'HDRequest', requestId, `Faculty Board approved with reference ${referenceNumber}. Senate Board auto-checked.`);
  } else if (outcome === 'recommended') {
    r.status = 'shd_pending';
    r.versions.push({ version: r.versions.length + 1, date: new Date(), action: `Faculty Board Recommended (Ref: ${referenceNumber}). Awaiting Senate Board.`, by: userId });
    addAuditLog(userId, 'Faculty Board Recommended', 'HDRequest', requestId, `Faculty Board recommended with reference ${referenceNumber}. Awaiting Senate Board decision.`);
  } else if (outcome === 'referred_back') {
    r.status = 'referred_back';
    r.currentOwner = r.supervisorId;
    r.referredBackReason = reason;
    r.referredBackBy = userId;
    r.referredBackDate = new Date();
    r.notes = reason;
    r.versions.push({ version: r.versions.length + 1, date: new Date(), action: `Faculty Board Referred Back: ${reason}`, by: userId });
    addAuditLog(userId, 'Faculty Board Referred Back', 'HDRequest', requestId, `Referred back from Faculty Board: ${reason}`);
    r.timerStart = new Date();
    r.timerHours = 24;
    addNotification(r.supervisorId, 'Faculty Board Referred Back', `"${r.title}" has been referred back by the Faculty Board. 24 hours to amend.`, 'error', '/requests');
  }
  addNotification(r.studentId, 'Faculty Board Decision', `Faculty Board outcome for "${r.title}": ${outcome.replace('_', ' ')}`, outcome === 'referred_back' ? 'error' : 'success', '/tracker');
  notify();
}

/* ── Record SHD Outcome ── */
export function recordSHDOutcome(requestId, userId, outcome, reason) {
  const r = mockHDRequests.find(x => x.id === requestId);
  if (!r) return;
  r.shdOutcome = outcome;
  r.updatedAt = new Date();
  if (outcome === 'approved') {
    r.status = 'approved';
    r.locked = true;
    r.versions.push({ version: r.versions.length + 1, date: new Date(), action: 'Senate Board Approved – Request complete', by: userId });
    addAuditLog(userId, 'Final Approval', 'HDRequest', requestId, `Senate Board approved – request fully approved`);
    addNotification(r.studentId, 'Request Approved', `Your request "${r.title}" has been fully approved by the Senate Board`, 'success', '/tracker');
    // Mock: generate PDF link
    r.finalPdfUrl = `/documents/${r.id}_final.pdf`;
    r.googleDriveUrl = `https://drive.google.com/mock/${r.id}`;
  } else {
    r.status = 'referred_back';
    r.currentOwner = r.supervisorId;
    r.referredBackReason = reason;
    r.referredBackBy = userId;
    r.referredBackDate = new Date();
    r.versions.push({ version: r.versions.length + 1, date: new Date(), action: `Senate Board Referred Back: ${reason}`, by: userId });
    addAuditLog(userId, 'Senate Board Referred Back', 'HDRequest', requestId, `Referred back from Senate Board: ${reason}`);
    r.timerStart = new Date();
    r.timerHours = 24;
    addNotification(r.supervisorId, 'Senate Board Referred Back', `"${r.title}" referred back by the Senate Board. 24 hours to amend.`, 'error', '/requests');
    addNotification(r.studentId, 'Senate Board Referred Back', `The Senate Board referred back "${r.title}": ${reason}`, 'error', '/tracker');
  }
  notify();
}

/* ── Resubmit (after referred back) ── */
export function resubmitRequest(requestId, userId) {
  const r = mockHDRequests.find(x => x.id === requestId);
  if (!r) return;
  r.status = 'submitted_to_supervisor';
  r.currentOwner = r.supervisorId;
  r.referredBackReason = null;
  r.notes = null;
  const code = generateAccessCode();
  r.accessCode = code;
  r.accessCodeExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
  r.timerStart = new Date();
  r.timerHours = 48;
  r.updatedAt = new Date();
  r.versions.push({ version: r.versions.length + 1, date: new Date(), action: 'Resubmitted after referral', by: userId });
  addAuditLog(userId, 'Resubmitted Request', 'HDRequest', requestId, `Resubmitted "${r.title}" after referral`);
  addNotification(r.supervisorId, 'Request Resubmitted', `${r.studentName} has resubmitted "${r.title}". Code: ${code}`, 'info', '/requests');
  notify();
}

/* ── Nudge Student ── */
export function nudgeStudent(studentId, supervisorId, message) {
  const sup = getUserById(supervisorId);
  addNotification(studentId, 'Reminder from Supervisor', message || `${sup?.name} is requesting your attention on pending items.`, 'warning', '/requests');
  addAuditLog(supervisorId, 'Nudged Student', 'User', studentId, `Sent reminder to student`);
  notify();
}

/* ── Add Calendar Event ── */
export function addCalendarEvent({ title, date, time, type, scope, description, createdBy }) {
  const evt = { id: nextId('evt'), title, date: new Date(date), time, type, scope, description, createdBy };
  mockCalendarEvents.push(evt);
  addAuditLog(createdBy, 'Created Calendar Event', 'CalendarEvent', evt.id, `Created event: ${title}`);
  notify();
  return evt;
}

/* ── Update Calendar Event ── */
export function updateCalendarEvent(eventId, updates) {
  const evt = mockCalendarEvents.find(e => e.id === eventId);
  if (!evt) return;
  Object.assign(evt, updates);
  notify();
}

/* ── Delete Calendar Event ── */
export function deleteCalendarEvent(eventId) {
  const idx = mockCalendarEvents.findIndex(e => e.id === eventId);
  if (idx > -1) mockCalendarEvents.splice(idx, 1);
  notify();
}

/* ── Add Milestone ── */
export function addMilestone({ studentId, title, type, date, description }) {
  const ms = { id: nextId('ms'), studentId, title, type, date: new Date(date), description };
  mockMilestones.push(ms);
  addAuditLog(studentId, 'Added Milestone', 'Milestone', ms.id, `Added milestone: ${title}`);
  notify();
  return ms;
}

/* ── Update Student Profile ── */
export function updateStudentProfile(userId, updates) {
  const p = mockStudentProfiles.find(x => x.userId === userId);
  if (!p) return;
  if (updates.thesisTitle !== undefined) p.thesisTitle = updates.thesisTitle;
  if (updates.supervisorId !== undefined) {
    const oldSup = p.supervisorId;
    p.supervisorId = updates.supervisorId;
    if (p.supervisorHistory) {
      const curr = p.supervisorHistory.find(h => h.supervisorId === oldSup && !h.to);
      if (curr) curr.to = new Date();
      p.supervisorHistory.push({ supervisorId: updates.supervisorId, name: getUserById(updates.supervisorId)?.name, role: 'primary', from: new Date(), to: null });
    }
  }
  if (updates.coSupervisorId !== undefined) p.coSupervisorId = updates.coSupervisorId || null;
  if (updates.status !== undefined) p.status = updates.status;
  notify();
}

/* ── Update User Role ── */
export function updateUserRole(userId, newRole) {
  const u = mockUsers.find(x => x.id === userId);
  if (!u) return;
  u.role = newRole;
  addAuditLog('admin-001', 'Role Changed', 'User', userId, `Changed role to ${newRole}`);
  notify();
}

/* ── Send Mock Email (console log + audit) ── */
export function sendMockEmail(to, subject, body, triggeredBy) {
  console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${body}`);
  addAuditLog(triggeredBy || 'system', 'Email Sent (Mock)', 'Email', to, `Subject: ${subject}`);
}

/* ── Export to CSV (generate string) ── */
export function exportToCSV(data, columns) {
  // Support both string columns and {label, accessor} objects
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
