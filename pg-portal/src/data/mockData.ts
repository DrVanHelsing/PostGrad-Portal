import type { User, HDRequest, CalendarEvent, Milestone, Notification, StudentProfile, AuditLogEntry } from '../types';

// Mock users for login
export const mockUsers: User[] = [
  {
    id: 'student-001',
    email: 'student@uwc.ac.za',
    name: 'Thabo Molefe',
    role: 'student',
    studentNumber: '3847291',
    department: 'Computer Science',
  },
  {
    id: 'student-002',
    email: 'student2@uwc.ac.za',
    name: 'Naledi Khumalo',
    role: 'student',
    studentNumber: '3892456',
    department: 'Computer Science',
  },
  {
    id: 'supervisor-001',
    email: 'supervisor@uwc.ac.za',
    name: 'Prof. Sarah van der Berg',
    role: 'supervisor',
    department: 'Computer Science',
  },
  {
    id: 'supervisor-002',
    email: 'supervisor2@uwc.ac.za',
    name: 'Dr. James Nkosi',
    role: 'supervisor',
    department: 'Computer Science',
  },
  {
    id: 'coordinator-001',
    email: 'coordinator@uwc.ac.za',
    name: 'Dr. Fatima Patel',
    role: 'coordinator',
    department: 'Faculty of Natural Sciences',
  },
  {
    id: 'admin-001',
    email: 'admin@uwc.ac.za',
    name: 'Linda Mkhize',
    role: 'admin',
    department: 'Postgraduate Administration',
  },
];

// Mock HD Requests
export const mockHDRequests: HDRequest[] = [
  {
    id: 'hdr-001',
    type: 'title_registration',
    title: 'PhD Title Registration - Machine Learning in Healthcare',
    status: 'supervisor_review',
    studentId: 'student-001',
    studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001',
    coordinatorId: 'coordinator-001',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-02-01'),
    currentOwner: 'supervisor-001',
    accessCode: 'ABC123',
    accessCodeExpiry: new Date('2026-02-10'),
  },
  {
    id: 'hdr-002',
    type: 'progress_report',
    title: 'Annual Progress Report 2025',
    status: 'approved',
    studentId: 'student-001',
    studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001',
    coordinatorId: 'coordinator-001',
    createdAt: new Date('2025-11-01'),
    updatedAt: new Date('2025-12-15'),
    currentOwner: 'coordinator-001',
    fhdOutcome: 'approved',
    shdOutcome: 'approved',
    referenceNumber: 'FHD/2025/0234',
  },
  {
    id: 'hdr-003',
    type: 'extension',
    title: 'Request for 6-month Extension',
    status: 'draft',
    studentId: 'student-001',
    studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001',
    coordinatorId: 'coordinator-001',
    createdAt: new Date('2026-02-05'),
    updatedAt: new Date('2026-02-05'),
    currentOwner: 'student-001',
  },
  {
    id: 'hdr-004',
    type: 'registration',
    title: 'Masters Registration - Data Science',
    status: 'coordinator_review',
    studentId: 'student-002',
    studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002',
    coSupervisorId: 'supervisor-001',
    coordinatorId: 'coordinator-001',
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-02-03'),
    currentOwner: 'coordinator-001',
  },
  {
    id: 'hdr-005',
    type: 'examination_entry',
    title: 'Thesis Examination Entry',
    status: 'fhd_pending',
    studentId: 'student-002',
    studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002',
    coordinatorId: 'coordinator-001',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-02-01'),
    currentOwner: 'coordinator-001',
  },
];

// Mock calendar events
export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'evt-001',
    title: 'FHD Meeting',
    date: new Date('2026-02-15'),
    type: 'meeting',
    scope: 'faculty',
    description: 'Faculty Higher Degrees Committee Meeting',
  },
  {
    id: 'evt-002',
    title: 'Progress Report Deadline',
    date: new Date('2026-03-01'),
    type: 'deadline',
    scope: 'all',
    description: 'Annual progress reports due for all registered postgraduate students',
  },
  {
    id: 'evt-003',
    title: 'SHD Meeting',
    date: new Date('2026-02-25'),
    type: 'meeting',
    scope: 'all',
    description: 'Senate Higher Degrees Committee Meeting',
  },
  {
    id: 'evt-004',
    title: 'Research Methodology Workshop',
    date: new Date('2026-02-20'),
    type: 'event',
    scope: 'faculty',
    description: 'Workshop on advanced research methodologies',
  },
  {
    id: 'evt-005',
    title: 'Registration Deadline',
    date: new Date('2026-02-28'),
    type: 'deadline',
    scope: 'all',
    description: 'Final deadline for 2026 registrations',
  },
];

// Mock milestones
export const mockMilestones: Milestone[] = [
  {
    id: 'ms-001',
    studentId: 'student-001',
    title: 'SAICSIT Conference Presentation',
    type: 'conference',
    date: new Date('2025-10-15'),
    description: 'Presented paper on ML in healthcare diagnostics',
  },
  {
    id: 'ms-002',
    studentId: 'student-001',
    title: 'Python for Data Science Workshop',
    type: 'workshop',
    date: new Date('2025-08-20'),
    description: 'Completed 3-day intensive workshop',
  },
  {
    id: 'ms-003',
    studentId: 'student-001',
    title: 'Department Journal Club',
    type: 'journal_club',
    date: new Date('2026-01-25'),
    description: 'Led discussion on recent Nature paper',
  },
];

// Mock notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    userId: 'student-001',
    title: 'Request Under Review',
    message: 'Your title registration request is being reviewed by Prof. van der Berg',
    type: 'info',
    read: false,
    createdAt: new Date('2026-02-01'),
    link: '/requests/hdr-001',
  },
  {
    id: 'notif-002',
    userId: 'student-001',
    title: 'Upcoming Deadline',
    message: 'Progress Report deadline is in 3 weeks',
    type: 'warning',
    read: false,
    createdAt: new Date('2026-02-05'),
  },
  {
    id: 'notif-003',
    userId: 'supervisor-001',
    title: 'New Request for Review',
    message: 'Thabo Molefe has submitted a title registration for your review',
    type: 'info',
    read: false,
    createdAt: new Date('2026-02-01'),
    link: '/review/hdr-001',
  },
];

// Mock student profiles
export const mockStudentProfiles: StudentProfile[] = [
  {
    userId: 'student-001',
    studentNumber: '3847291',
    programme: 'PhD Computer Science',
    degree: 'Doctor of Philosophy',
    faculty: 'Natural Sciences',
    department: 'Computer Science',
    registrationDate: new Date('2023-02-01'),
    yearsRegistered: 3,
    supervisorId: 'supervisor-001',
    thesisTitle: 'Machine Learning Applications in Healthcare Diagnostics',
    status: 'active',
  },
  {
    userId: 'student-002',
    studentNumber: '3892456',
    programme: 'MSc Data Science',
    degree: 'Master of Science',
    faculty: 'Natural Sciences',
    department: 'Computer Science',
    registrationDate: new Date('2024-02-01'),
    yearsRegistered: 2,
    supervisorId: 'supervisor-002',
    coSupervisorId: 'supervisor-001',
    thesisTitle: 'Predictive Analytics for Urban Planning',
    status: 'active',
  },
];

// Mock audit logs
export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: new Date('2026-02-05T10:30:00'),
    userId: 'student-001',
    userName: 'Thabo Molefe',
    action: 'Created HD Request',
    entityType: 'HDRequest',
    entityId: 'hdr-003',
    details: 'Created extension request',
  },
  {
    id: 'audit-002',
    timestamp: new Date('2026-02-01T14:15:00'),
    userId: 'student-001',
    userName: 'Thabo Molefe',
    action: 'Submitted HD Request',
    entityType: 'HDRequest',
    entityId: 'hdr-001',
    details: 'Submitted to supervisor for review',
  },
  {
    id: 'audit-003',
    timestamp: new Date('2026-02-01T16:00:00'),
    userId: 'supervisor-001',
    userName: 'Prof. Sarah van der Berg',
    action: 'Opened HD Request',
    entityType: 'HDRequest',
    entityId: 'hdr-001',
    details: 'Access code validated',
  },
];

// Helper function to get requests by student
export const getRequestsByStudent = (studentId: string) =>
  mockHDRequests.filter((r) => r.studentId === studentId);

// Helper function to get requests for supervisor review
export const getRequestsForSupervisor = (supervisorId: string): HDRequest[] =>
  mockHDRequests.filter(
    (r) =>
      (r.supervisorId === supervisorId || r.coSupervisorId === supervisorId) &&
      ['submitted_to_supervisor', 'supervisor_review', 'co_supervisor_review'].includes(r.status)
  );

// Helper function to get all requests for coordinator
export const getRequestsForCoordinator = (): HDRequest[] =>
  mockHDRequests.filter((r) =>
    ['coordinator_review', 'fhd_pending', 'shd_pending'].includes(r.status)
  );

// Helper function to get notifications for user
export const getNotificationsForUser = (userId: string): Notification[] =>
  mockNotifications.filter((n) => n.userId === userId);

// Helper function to get student profile
export const getStudentProfile = (userId: string): StudentProfile | undefined =>
  mockStudentProfiles.find((p) => p.userId === userId);

// Helper function to get students for supervisor
export const getStudentsForSupervisor = (supervisorId: string): StudentProfile[] =>
  mockStudentProfiles.filter(
    (p) => p.supervisorId === supervisorId || p.coSupervisorId === supervisorId
  );
