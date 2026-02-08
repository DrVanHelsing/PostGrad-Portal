/**
 * Full Database Re-seed Script
 * Wipes ALL Firestore collections and repopulates with rich demo data.
 *
 * Usage:  node scripts/reseed-firebase.mjs
 *
 * Auth users are NOT deleted (requires Admin SDK). They are re-used.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore, collection, getDocs, writeBatch, doc,
  Timestamp, deleteDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBu7YrBJg_eNGqUlXIGCzNltScSQKYLp28',
  authDomain: 'pg-portal1.firebaseapp.com',
  projectId: 'pg-portal1',
  storageBucket: 'pg-portal1.firebasestorage.app',
  messagingSenderId: '757138632732',
  appId: '1:757138632732:web:b564e133fba3a6f8862fd9',
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const ts = (d) => Timestamp.fromDate(new Date(d));
const now = () => Timestamp.now();

// ══════════════════════════════════════════════════════════════
// 1. USERS  (matches Auth accounts already created)
// ══════════════════════════════════════════════════════════════
const USERS = [
  {
    id: 'student-001', email: 'student@uwc.ac.za', name: 'Thabo Molefe',
    role: 'student', studentNumber: '3847291', department: 'Computer Science',
    avatarUrl: '', phone: '081-555-1001',
    notificationPrefs: { email: true, inApp: true, sms: false },
  },
  {
    id: 'student-002', email: 'student2@uwc.ac.za', name: 'Naledi Khumalo',
    role: 'student', studentNumber: '3892456', department: 'Computer Science',
    avatarUrl: '', phone: '081-555-1002',
    notificationPrefs: { email: true, inApp: true, sms: false },
  },
  {
    id: 'student-003', email: 'student3@uwc.ac.za', name: 'Sipho Dlamini',
    role: 'student', studentNumber: '3901234', department: 'Information Systems',
    avatarUrl: '', phone: '081-555-1003',
    notificationPrefs: { email: true, inApp: true, sms: false },
  },
  {
    id: 'supervisor-001', email: 'supervisor@uwc.ac.za', name: 'Prof. Sarah van der Berg',
    role: 'supervisor', department: 'Computer Science',
    phone: '021-959-3001',
    notificationPrefs: { email: true, inApp: true, sms: false },
  },
  {
    id: 'supervisor-002', email: 'supervisor2@uwc.ac.za', name: 'Dr. James Nkosi',
    role: 'supervisor', department: 'Computer Science',
    phone: '021-959-3002',
    notificationPrefs: { email: true, inApp: true, sms: false },
  },
  {
    id: 'coordinator-001', email: 'coordinator@uwc.ac.za', name: 'Dr. Fatima Patel',
    role: 'coordinator', department: 'Faculty of Natural Sciences',
    phone: '021-959-3010',
    notificationPrefs: { email: true, inApp: true, sms: false },
  },
  {
    id: 'admin-001', email: 'admin@uwc.ac.za', name: 'Linda Mkhize',
    role: 'admin', department: 'Postgraduate Administration',
    phone: '021-959-3050',
    notificationPrefs: { email: true, inApp: true, sms: true },
  },
];

// ══════════════════════════════════════════════════════════════
// 2. STUDENT PROFILES
// ══════════════════════════════════════════════════════════════
const STUDENT_PROFILES = [
  {
    id: 'sp-001', userId: 'student-001', studentNumber: '3847291',
    programme: 'PhD Computer Science', degree: 'Doctor of Philosophy',
    faculty: 'Natural Sciences', department: 'Computer Science',
    registrationDate: ts('2023-02-01'), expectedCompletion: ts('2026-12-31'),
    yearsRegistered: 3, supervisorId: 'supervisor-001',
    thesisTitle: 'Machine Learning Applications in Healthcare Diagnostics',
    status: 'active', fundingSource: 'NRF Scholarship',
    gpa: 78.5,
    supervisorHistory: [
      { supervisorId: 'supervisor-001', name: 'Prof. Sarah van der Berg', role: 'primary', from: ts('2023-02-01'), to: null },
    ],
  },
  {
    id: 'sp-002', userId: 'student-002', studentNumber: '3892456',
    programme: 'MSc Data Science', degree: 'Master of Science',
    faculty: 'Natural Sciences', department: 'Computer Science',
    registrationDate: ts('2024-02-01'), expectedCompletion: ts('2026-06-30'),
    yearsRegistered: 2, supervisorId: 'supervisor-002', coSupervisorId: 'supervisor-001',
    thesisTitle: 'Predictive Analytics for Urban Planning in Cape Town',
    status: 'active', fundingSource: 'UWC Postgraduate Bursary',
    gpa: 82.3,
    supervisorHistory: [
      { supervisorId: 'supervisor-002', name: 'Dr. James Nkosi', role: 'primary', from: ts('2024-02-01'), to: null },
      { supervisorId: 'supervisor-001', name: 'Prof. Sarah van der Berg', role: 'co-supervisor', from: ts('2024-06-01'), to: null },
    ],
  },
  {
    id: 'sp-003', userId: 'student-003', studentNumber: '3901234',
    programme: 'MSc Information Systems', degree: 'Master of Science',
    faculty: 'Natural Sciences', department: 'Information Systems',
    registrationDate: ts('2025-02-01'), expectedCompletion: ts('2027-06-30'),
    yearsRegistered: 1, supervisorId: 'supervisor-001',
    thesisTitle: 'Blockchain-based Academic Credential Verification',
    status: 'active', fundingSource: 'Self-funded',
    gpa: 71.0,
    supervisorHistory: [
      { supervisorId: 'supervisor-001', name: 'Prof. Sarah van der Berg', role: 'primary', from: ts('2025-02-01'), to: null },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// 3. HD REQUESTS  – 12 requests across all statuses
// ══════════════════════════════════════════════════════════════
const HD_REQUESTS = [
  // ── Student 1: Thabo Molefe (4 requests) ──────────

  // 1) Fully approved request
  {
    id: 'hdr-001', type: 'progress_report',
    title: 'Annual Progress Report 2025',
    status: 'approved', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2025-09-01'), updatedAt: ts('2025-12-15'),
    currentOwner: 'coordinator-001',
    fhdOutcome: 'approved', shdOutcome: 'approved',
    referenceNumber: 'FHD/2025/0234',
    finalPdfUrl: '/documents/hdr-001_final.pdf',
    description: 'Annual academic progress report for the 2025 academic year covering research milestones, publications, and methodology development.',
    documents: [
      { name: 'Progress_Report_2025.pdf', size: '1.8 MB', uploadedAt: ts('2025-09-01'), type: 'application/pdf' },
      { name: 'Supervisor_Feedback_Form.pdf', size: '340 KB', uploadedAt: ts('2025-09-20'), type: 'application/pdf' },
      { name: 'Publication_Evidence.pdf', size: '1.2 MB', uploadedAt: ts('2025-09-01'), type: 'application/pdf' },
    ],
    versions: [
      { version: 1, date: ts('2025-09-01'), action: 'Created', by: 'student-001' },
      { version: 2, date: ts('2025-09-10'), action: 'Submitted to supervisor', by: 'student-001' },
      { version: 3, date: ts('2025-09-20'), action: 'Supervisor approved', by: 'supervisor-001' },
      { version: 4, date: ts('2025-11-05'), action: 'Coordinator signed, forwarded to Faculty Board', by: 'coordinator-001' },
      { version: 5, date: ts('2025-11-28'), action: 'Faculty Board Approved (Ref: FHD/2025/0234)', by: 'coordinator-001' },
      { version: 6, date: ts('2025-12-15'), action: 'Senate Board Approved – Request complete', by: 'admin-001' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-001', name: 'Prof. Sarah van der Berg', date: ts('2025-09-20') },
      { role: 'coordinator', userId: 'coordinator-001', name: 'Dr. Fatima Patel', date: ts('2025-11-05') },
    ],
  },

  // 2) Title registration – in supervisor review
  {
    id: 'hdr-002', type: 'title_registration',
    title: 'PhD Title Registration – ML-Driven Diagnostic Imaging',
    status: 'supervisor_review', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-01-15'), updatedAt: ts('2026-02-01'),
    currentOwner: 'supervisor-001',
    accessCode: 'T7M4PK', accessCodeExpiry: ts('2026-02-12'),
    description: 'Formal registration of revised PhD title focusing on ML-driven diagnostic imaging algorithms for tuberculosis screening in resource-constrained settings.',
    documents: [
      { name: 'Research_Proposal_v3.pdf', size: '3.1 MB', uploadedAt: ts('2026-01-15'), type: 'application/pdf' },
      { name: 'Literature_Review_Summary.pdf', size: '1.5 MB', uploadedAt: ts('2026-01-15'), type: 'application/pdf' },
      { name: 'Ethics_Clearance_Application.pdf', size: '890 KB', uploadedAt: ts('2026-01-20'), type: 'application/pdf' },
    ],
    versions: [
      { version: 1, date: ts('2026-01-15'), action: 'Created', by: 'student-001' },
      { version: 2, date: ts('2026-01-28'), action: 'Submitted to supervisor', by: 'student-001' },
      { version: 3, date: ts('2026-02-01'), action: 'Access code validated – supervisor review started', by: 'supervisor-001' },
    ],
    signatures: [],
    timerStart: ts('2026-02-01'), timerHours: 48,
  },

  // 3) Draft extension request
  {
    id: 'hdr-003', type: 'extension',
    title: 'Request for 6-month Extension',
    status: 'draft', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-02-05'), updatedAt: ts('2026-02-05'),
    currentOwner: 'student-001',
    description: 'Extension request due to delays in data collection from partner hospitals (Tygerberg & Groote Schuur). The COVID backlog has significantly slowed IRB approvals.',
    documents: [
      { name: 'Extension_Motivation_Letter.pdf', size: '420 KB', uploadedAt: ts('2026-02-05'), type: 'application/pdf' },
    ],
    versions: [
      { version: 1, date: ts('2026-02-05'), action: 'Created', by: 'student-001' },
    ],
    signatures: [],
  },

  // 4) Referred back request
  {
    id: 'hdr-004', type: 'ethics_approval',
    title: 'Ethics Approval – Human Subject Research',
    status: 'referred_back', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2025-11-10'), updatedAt: ts('2026-01-08'),
    currentOwner: 'student-001',
    description: 'Ethics clearance application for research involving patient medical imaging data.',
    referredBackReason: 'The informed consent form needs to be revised. Please include provisions for minors (under 18) and clarify data anonymization procedures. The Ethics Committee requires a separate data management plan.',
    referredBackBy: 'coordinator-001',
    referredBackDate: ts('2026-01-08'),
    notes: 'Referred back from Faculty Board – consent form revisions needed.',
    documents: [
      { name: 'Ethics_Application_v1.pdf', size: '2.1 MB', uploadedAt: ts('2025-11-10'), type: 'application/pdf' },
      { name: 'Informed_Consent_Form.pdf', size: '380 KB', uploadedAt: ts('2025-11-10'), type: 'application/pdf' },
      { name: 'Data_Collection_Protocol.pdf', size: '560 KB', uploadedAt: ts('2025-11-10'), type: 'application/pdf' },
    ],
    versions: [
      { version: 1, date: ts('2025-11-10'), action: 'Created', by: 'student-001' },
      { version: 2, date: ts('2025-11-18'), action: 'Submitted to supervisor', by: 'student-001' },
      { version: 3, date: ts('2025-11-25'), action: 'Supervisor approved', by: 'supervisor-001' },
      { version: 4, date: ts('2025-12-02'), action: 'Coordinator signed, forwarded to Faculty Board', by: 'coordinator-001' },
      { version: 5, date: ts('2026-01-08'), action: 'Faculty Board Referred Back: consent form revisions', by: 'coordinator-001' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-001', name: 'Prof. Sarah van der Berg', date: ts('2025-11-25') },
      { role: 'coordinator', userId: 'coordinator-001', name: 'Dr. Fatima Patel', date: ts('2025-12-02') },
    ],
    timerStart: ts('2026-01-08'), timerHours: 24,
  },

  // ── Student 2: Naledi Khumalo (4 requests) ──────────

  // 5) Registration at coordinator review
  {
    id: 'hdr-005', type: 'registration',
    title: 'Masters Registration – Data Science 2026',
    status: 'coordinator_review', studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coSupervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-01-20'), updatedAt: ts('2026-02-03'),
    currentOwner: 'coordinator-001',
    description: 'Annual re-registration application for MSc Data Science programme – second year.',
    documents: [
      { name: 'Registration_Form_2026.pdf', size: '1.1 MB', uploadedAt: ts('2026-01-20'), type: 'application/pdf' },
      { name: 'Academic_Transcript.pdf', size: '680 KB', uploadedAt: ts('2026-01-20'), type: 'application/pdf' },
      { name: 'Financial_Clearance.pdf', size: '240 KB', uploadedAt: ts('2026-01-22'), type: 'application/pdf' },
    ],
    versions: [
      { version: 1, date: ts('2026-01-20'), action: 'Created', by: 'student-002' },
      { version: 2, date: ts('2026-01-23'), action: 'Submitted to supervisor', by: 'student-002' },
      { version: 3, date: ts('2026-01-28'), action: 'Supervisor approved', by: 'supervisor-002' },
      { version: 4, date: ts('2026-01-30'), action: 'Co-supervisor signed', by: 'supervisor-001' },
      { version: 5, date: ts('2026-02-03'), action: 'Forwarded to coordinator', by: 'supervisor-002' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-002', name: 'Dr. James Nkosi', date: ts('2026-01-28') },
      { role: 'co-supervisor', userId: 'supervisor-001', name: 'Prof. Sarah van der Berg', date: ts('2026-01-30') },
    ],
  },

  // 6) Thesis exam entry at FHD pending
  {
    id: 'hdr-006', type: 'examination_entry',
    title: 'Thesis Examination Entry – Urban Analytics',
    status: 'fhd_pending', studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coordinatorId: 'coordinator-001',
    createdAt: ts('2025-12-01'), updatedAt: ts('2026-02-01'),
    currentOwner: 'coordinator-001',
    locked: true,
    description: 'Submission of MSc thesis for examination and appointment of external examiners. Thesis title: "Predictive Analytics for Urban Planning in Cape Town".',
    documents: [
      { name: 'Thesis_Final_Draft.pdf', size: '8.2 MB', uploadedAt: ts('2025-12-01'), type: 'application/pdf' },
      { name: 'Turnitin_Report.pdf', size: '340 KB', uploadedAt: ts('2025-12-01'), type: 'application/pdf' },
      { name: 'Examiner_Nomination_Form.pdf', size: '190 KB', uploadedAt: ts('2025-12-05'), type: 'application/pdf' },
      { name: 'Language_Editing_Certificate.pdf', size: '120 KB', uploadedAt: ts('2025-12-10'), type: 'application/pdf' },
    ],
    versions: [
      { version: 1, date: ts('2025-12-01'), action: 'Created', by: 'student-002' },
      { version: 2, date: ts('2025-12-12'), action: 'Submitted to supervisor', by: 'student-002' },
      { version: 3, date: ts('2026-01-10'), action: 'Supervisor approved', by: 'supervisor-002' },
      { version: 4, date: ts('2026-01-20'), action: 'Coordinator signed, forwarded to Faculty Board', by: 'coordinator-001' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-002', name: 'Dr. James Nkosi', date: ts('2026-01-10') },
      { role: 'coordinator', userId: 'coordinator-001', name: 'Dr. Fatima Patel', date: ts('2026-01-20') },
    ],
  },

  // 7) Fully approved progress report (Naledi)
  {
    id: 'hdr-007', type: 'progress_report',
    title: 'Annual Progress Report 2025 – Naledi',
    status: 'approved', studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coordinatorId: 'coordinator-001',
    createdAt: ts('2025-08-15'), updatedAt: ts('2025-11-20'),
    currentOwner: 'coordinator-001',
    fhdOutcome: 'approved', shdOutcome: 'approved',
    referenceNumber: 'FHD/2025/0198',
    finalPdfUrl: '/documents/hdr-007_final.pdf',
    description: 'Year-end progress report documenting completion of coursework, research progress, and publication submissions.',
    documents: [
      { name: 'Progress_Report_NK_2025.pdf', size: '2.5 MB', uploadedAt: ts('2025-08-15'), type: 'application/pdf' },
      { name: 'Coursework_Transcript.pdf', size: '290 KB', uploadedAt: ts('2025-08-15'), type: 'application/pdf' },
    ],
    versions: [
      { version: 1, date: ts('2025-08-15'), action: 'Created', by: 'student-002' },
      { version: 2, date: ts('2025-08-25'), action: 'Submitted to supervisor', by: 'student-002' },
      { version: 3, date: ts('2025-09-05'), action: 'Supervisor approved', by: 'supervisor-002' },
      { version: 4, date: ts('2025-09-20'), action: 'Coordinator signed, forwarded to Faculty Board', by: 'coordinator-001' },
      { version: 5, date: ts('2025-10-15'), action: 'Faculty Board Approved (Ref: FHD/2025/0198)', by: 'coordinator-001' },
      { version: 6, date: ts('2025-11-20'), action: 'Senate Board Approved – Request complete', by: 'admin-001' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-002', name: 'Dr. James Nkosi', date: ts('2025-09-05') },
      { role: 'coordinator', userId: 'coordinator-001', name: 'Dr. Fatima Patel', date: ts('2025-09-20') },
    ],
  },

  // 8) Draft title change (Naledi)
  {
    id: 'hdr-008', type: 'title_change',
    title: 'Title Amendment – Urban Analytics Focus',
    status: 'draft', studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-02-06'), updatedAt: ts('2026-02-06'),
    currentOwner: 'student-002',
    description: 'Request to amend thesis title to better reflect the expanded scope to include Stellenbosch municipality data.',
    documents: [],
    versions: [
      { version: 1, date: ts('2026-02-06'), action: 'Created', by: 'student-002' },
    ],
    signatures: [],
  },

  // ── Student 3: Sipho Dlamini (4 requests) ──────────

  // 9) Leave of absence – submitted to supervisor
  {
    id: 'hdr-009', type: 'leave_of_absence',
    title: 'Leave of Absence – Medical Reasons',
    status: 'submitted_to_supervisor', studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-02-04'), updatedAt: ts('2026-02-04'),
    currentOwner: 'supervisor-001',
    accessCode: 'SD8K2X', accessCodeExpiry: ts('2026-02-10'),
    description: 'Request for one semester of leave due to medical reasons. Surgery and rehabilitation period expected to last 4 months.',
    documents: [
      { name: 'Medical_Certificate.pdf', size: '520 KB', uploadedAt: ts('2026-02-04'), type: 'application/pdf' },
      { name: 'Specialist_Report.pdf', size: '180 KB', uploadedAt: ts('2026-02-04'), type: 'application/pdf' },
    ],
    versions: [
      { version: 1, date: ts('2026-02-04'), action: 'Created and submitted', by: 'student-003' },
    ],
    signatures: [],
    timerStart: ts('2026-02-04'), timerHours: 48,
  },

  // 10) Supervisor change – referred back
  {
    id: 'hdr-010', type: 'supervisor_change',
    title: 'Change of Supervisor Request',
    status: 'referred_back', studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-002', coordinatorId: 'coordinator-001',
    createdAt: ts('2025-10-01'), updatedAt: ts('2025-11-20'),
    currentOwner: 'student-003',
    description: 'Request to change primary supervisor from Prof. van der Berg to Dr. Nkosi due to closer alignment with blockchain research expertise.',
    referredBackReason: 'Insufficient motivation provided. Please include written statements from both current and proposed supervisors, and a revised research timeline.',
    referredBackBy: 'coordinator-001',
    referredBackDate: ts('2025-11-20'),
    notes: 'Referred back by coordinator – additional documentation required.',
    documents: [
      { name: 'Supervisor_Change_Motivation.pdf', size: '310 KB', uploadedAt: ts('2025-10-01'), type: 'application/pdf' },
    ],
    versions: [
      { version: 1, date: ts('2025-10-01'), action: 'Created', by: 'student-003' },
      { version: 2, date: ts('2025-10-08'), action: 'Submitted to supervisor', by: 'student-003' },
      { version: 3, date: ts('2025-10-15'), action: 'Supervisor approved', by: 'supervisor-002' },
      { version: 4, date: ts('2025-10-28'), action: 'Coordinator signed, forwarded to Faculty Board', by: 'coordinator-001' },
      { version: 5, date: ts('2025-11-20'), action: 'Referred back by coordinator', by: 'coordinator-001' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-002', name: 'Dr. James Nkosi', date: ts('2025-10-15') },
    ],
    timerStart: ts('2025-11-20'), timerHours: 24,
  },

  // 11) SHD pending
  {
    id: 'hdr-011', type: 'title_registration',
    title: 'MSc Title Registration – Blockchain Credentials',
    status: 'shd_pending', studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2025-06-01'), updatedAt: ts('2026-01-20'),
    currentOwner: 'coordinator-001',
    fhdOutcome: 'recommended',
    referenceNumber: 'FHD/2026/0012',
    locked: true,
    description: 'Formal title registration for MSc thesis on blockchain-based academic credential verification systems.',
    documents: [
      { name: 'Title_Registration_Form.pdf', size: '980 KB', uploadedAt: ts('2025-06-01'), type: 'application/pdf' },
      { name: 'Research_Proposal_v2.pdf', size: '2.8 MB', uploadedAt: ts('2025-06-15'), type: 'application/pdf' },
      { name: 'Supervisor_Endorsement.pdf', size: '150 KB', uploadedAt: ts('2025-07-01'), type: 'application/pdf' },
    ],
    versions: [
      { version: 1, date: ts('2025-06-01'), action: 'Created', by: 'student-003' },
      { version: 2, date: ts('2025-06-20'), action: 'Submitted to supervisor', by: 'student-003' },
      { version: 3, date: ts('2025-07-01'), action: 'Supervisor approved', by: 'supervisor-001' },
      { version: 4, date: ts('2025-07-15'), action: 'Coordinator signed, forwarded to Faculty Board', by: 'coordinator-001' },
      { version: 5, date: ts('2026-01-20'), action: 'Faculty Board Recommended (Ref: FHD/2026/0012). Awaiting Senate Board.', by: 'coordinator-001' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-001', name: 'Prof. Sarah van der Berg', date: ts('2025-07-01') },
      { role: 'coordinator', userId: 'coordinator-001', name: 'Dr. Fatima Patel', date: ts('2025-07-15') },
    ],
  },

  // 12) Co-supervisor review stage (Sipho, new request)
  {
    id: 'hdr-012', type: 'progress_report',
    title: 'Semi-Annual Progress Report – Jan 2026',
    status: 'co_supervisor_review', studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-001', coSupervisorId: 'supervisor-002', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-01-05'), updatedAt: ts('2026-01-30'),
    currentOwner: 'supervisor-002',
    accessCode: 'PQ9W3E', accessCodeExpiry: ts('2026-02-05'),
    description: 'Mid-year progress report. Includes initial blockchain prototype demo results and literature review chapter draft.',
    documents: [
      { name: 'Progress_Report_Jan2026.pdf', size: '1.9 MB', uploadedAt: ts('2026-01-05'), type: 'application/pdf' },
      { name: 'Prototype_Demo_Screenshots.pdf', size: '4.3 MB', uploadedAt: ts('2026-01-05'), type: 'application/pdf' },
    ],
    versions: [
      { version: 1, date: ts('2026-01-05'), action: 'Created', by: 'student-003' },
      { version: 2, date: ts('2026-01-12'), action: 'Submitted to supervisor', by: 'student-003' },
      { version: 3, date: ts('2026-01-25'), action: 'Supervisor approved, forwarded to co-supervisor', by: 'supervisor-001' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-001', name: 'Prof. Sarah van der Berg', date: ts('2026-01-25') },
    ],
    timerStart: ts('2026-01-30'), timerHours: 48,
  },
];

// ══════════════════════════════════════════════════════════════
// 4. MILESTONES  – rich data for all students
// ══════════════════════════════════════════════════════════════
const MILESTONES = [
  // Thabo
  { id: 'ms-001', studentId: 'student-001', title: 'SAICSIT Conference Presentation',   type: 'conference',   date: ts('2025-10-15'), description: 'Presented peer-reviewed paper "ML Diagnostics in Low-Resource Settings" at SAICSIT 2025, Cape Town' },
  { id: 'ms-002', studentId: 'student-001', title: 'Python for Data Science Workshop',  type: 'workshop',     date: ts('2025-08-20'), description: 'Completed 3-day intensive workshop hosted by CSIR, Pretoria' },
  { id: 'ms-003', studentId: 'student-001', title: 'Department Journal Club – Lead',    type: 'journal_club', date: ts('2026-01-25'), description: 'Led discussion on "Attention Is All You Need" and its applications in medical imaging' },
  { id: 'ms-004', studentId: 'student-001', title: 'Ethics Clearance Obtained',         type: 'milestone',    date: ts('2025-05-10'), description: 'Received full ethics clearance from UWC BMREC (ref: BM25/3/12)' },
  { id: 'ms-005', studentId: 'student-001', title: 'Journal Paper Submitted',           type: 'publication',  date: ts('2025-12-01'), description: 'Submitted paper to SA Journal of Science – under review' },
  { id: 'ms-006', studentId: 'student-001', title: 'Research Data Collection – Phase 1',type: 'milestone',    date: ts('2025-07-15'), description: 'Collected 2,400 anonymized chest X-ray images from Tygerberg Hospital' },
  { id: 'ms-007', studentId: 'student-001', title: 'PhD Proposal Defense',              type: 'presentation', date: ts('2024-03-20'), description: 'Successfully defended PhD research proposal before departmental committee' },

  // Naledi
  { id: 'ms-008', studentId: 'student-002', title: 'Journal Publication Accepted',      type: 'publication',  date: ts('2025-12-01'), description: 'Paper "Urban Growth Prediction Using Satellite Data" accepted in SA Journal of Computer Science' },
  { id: 'ms-009', studentId: 'student-002', title: 'Data Ethics Training',              type: 'training',     date: ts('2025-09-10'), description: 'Completed POPIA & research data ethics online course (certification attached)' },
  { id: 'ms-010', studentId: 'student-002', title: 'City of Cape Town Data Partnership',type: 'milestone',    date: ts('2025-04-15'), description: 'Signed MoU with CoCT GIS department for access to urban planning datasets' },
  { id: 'ms-011', studentId: 'student-002', title: 'Coursework Completed',              type: 'milestone',    date: ts('2025-06-30'), description: 'Completed all required MSc coursework modules with distinction average (82.3%)' },
  { id: 'ms-012', studentId: 'student-002', title: 'IEEE AFRICON Poster Presentation',  type: 'conference',   date: ts('2025-09-25'), description: 'Presented research poster at IEEE AFRICON 2025, Nairobi' },
  { id: 'ms-013', studentId: 'student-002', title: 'GIS Workshop – Advanced Spatial',   type: 'workshop',     date: ts('2025-11-05'), description: 'Completed advanced spatial analytics workshop using QGIS and GeoPandas' },

  // Sipho
  { id: 'ms-014', studentId: 'student-003', title: 'Blockchain Prototype v1',           type: 'milestone',    date: ts('2025-11-01'), description: 'Completed first working prototype of credential verification smart contract on Ethereum testnet' },
  { id: 'ms-015', studentId: 'student-003', title: 'Department Seminar Talk',           type: 'presentation', date: ts('2025-10-20'), description: 'Presented "Blockchain in Education: A South African Perspective" at IS department seminar' },
  { id: 'ms-016', studentId: 'student-003', title: 'Solidity Development Course',       type: 'training',     date: ts('2025-08-01'), description: 'Completed Udemy certified Solidity development course (40 hours)' },
  { id: 'ms-017', studentId: 'student-003', title: 'Literature Review Draft',           type: 'milestone',    date: ts('2025-12-15'), description: 'Submitted first full draft of Chapter 2 (Literature Review) to supervisor' },
  { id: 'ms-018', studentId: 'student-003', title: 'SATNAC Conference Submission',      type: 'publication',  date: ts('2026-01-15'), description: 'Submitted abstract for SATNAC 2026 conference on credential verification' },
];

// ══════════════════════════════════════════════════════════════
// 5. CALENDAR EVENTS  – expanded
// ══════════════════════════════════════════════════════════════
const CALENDAR_EVENTS = [
  { id: 'evt-001', title: 'Faculty Board Meeting',                 date: ts('2026-02-15'), time: '10:00', endTime: '13:00', type: 'meeting',  scope: 'faculty',     description: 'Faculty Higher Degrees Committee meeting – agenda includes 4 new requests',       createdBy: 'coordinator-001' },
  { id: 'evt-002', title: 'Progress Report Deadline',              date: ts('2026-03-01'), time: '17:00', type: 'deadline', scope: 'all',         description: 'Annual progress reports due for all registered postgraduate students',            createdBy: 'admin-001' },
  { id: 'evt-003', title: 'Senate Board Meeting',                  date: ts('2026-02-25'), time: '14:00', endTime: '16:00', type: 'meeting',  scope: 'all',         description: 'Senate Higher Degrees Committee meeting – quarterly session',                      createdBy: 'admin-001' },
  { id: 'evt-004', title: 'Research Methodology Workshop',         date: ts('2026-02-20'), time: '09:00', endTime: '16:00', type: 'event',    scope: 'faculty',     description: 'Full-day workshop on advanced qualitative & mixed-methods research',              createdBy: 'coordinator-001' },
  { id: 'evt-005', title: 'Registration Deadline – 2026',          date: ts('2026-02-28'), time: '23:59', type: 'deadline', scope: 'all',         description: 'Final deadline for 2026 academic year registrations',                              createdBy: 'admin-001' },
  { id: 'evt-006', title: 'Departmental Seminar – UCT Guest',      date: ts('2026-03-05'), time: '11:00', endTime: '12:30', type: 'event',    scope: 'department',  description: 'Monthly research seminar – guest speaker Prof. Mtshali from UCT on AI ethics',    createdBy: 'coordinator-001' },
  { id: 'evt-007', title: 'Ethics Committee Meeting',              date: ts('2026-03-10'), time: '13:00', endTime: '15:00', type: 'meeting',  scope: 'faculty',     description: 'Ethics review meeting for 6 pending research proposals',                          createdBy: 'coordinator-001' },
  { id: 'evt-008', title: 'Thesis Writing Bootcamp',               date: ts('2026-03-15'), time: '09:00', endTime: '17:00', type: 'event',    scope: 'all',         description: '2-day intensive thesis writing workshop (Day 1). Academic writing centre.',        createdBy: 'admin-001' },
  { id: 'evt-009', title: 'Thesis Writing Bootcamp – Day 2',       date: ts('2026-03-16'), time: '09:00', endTime: '17:00', type: 'event',    scope: 'all',         description: '2-day intensive thesis writing workshop (Day 2). Peer review exercises.',          createdBy: 'admin-001' },
  { id: 'evt-010', title: 'NRF Funding Application Deadline',      date: ts('2026-04-01'), time: '23:59', type: 'deadline', scope: 'all',         description: 'National Research Foundation funding applications close',                          createdBy: 'admin-001' },
  { id: 'evt-011', title: 'Supervisor-Student Meetup',             date: ts('2026-02-12'), time: '14:00', endTime: '15:30', type: 'meeting',  scope: 'department',  description: 'Bi-weekly supervisor-student check-in – Computer Science department',             createdBy: 'supervisor-001' },
  { id: 'evt-012', title: 'CS Postgrad Social',                   date: ts('2026-02-14'), time: '17:00', endTime: '19:00', type: 'event',    scope: 'department',  description: 'Casual networking event for CS postgraduate students',                            createdBy: 'supervisor-002' },
];

// ══════════════════════════════════════════════════════════════
// 6. NOTIFICATIONS  – multiple per user, mix of read/unread
// ══════════════════════════════════════════════════════════════
const NOTIFICATIONS = [
  // ── Student 1: Thabo ──
  { id: 'notif-001', userId: 'student-001', title: 'Request Under Review',      message: 'Your title registration "ML-Driven Diagnostic Imaging" is being reviewed by Prof. van der Berg.',           type: 'info',    read: false, createdAt: ts('2026-02-01'), link: '/requests' },
  { id: 'notif-002', userId: 'student-001', title: 'Upcoming Deadline',         message: 'Progress Report deadline is 1 March 2026 – 3 weeks remaining.',                                            type: 'warning', read: false, createdAt: ts('2026-02-05'), link: '/calendar' },
  { id: 'notif-003', userId: 'student-001', title: 'Ethics Referred Back',      message: 'Your ethics approval request has been referred back. Please revise the consent form within 24 hours.',       type: 'error',   read: true,  createdAt: ts('2026-01-08'), link: '/requests' },
  { id: 'notif-004', userId: 'student-001', title: 'Progress Report Approved',  message: 'Your 2025 Annual Progress Report has been fully approved. Reference: FHD/2025/0234.',                       type: 'success', read: true,  createdAt: ts('2025-12-15'), link: '/tracker' },
  { id: 'notif-005', userId: 'student-001', title: 'Writing Workshop',          message: 'Thesis Writing Bootcamp – 15-16 March. Register now!',                                                     type: 'info',    read: false, createdAt: ts('2026-02-07'), link: '/calendar' },

  // ── Student 2: Naledi ──
  { id: 'notif-006', userId: 'student-002', title: 'Registration at Coordinator', message: 'Your 2026 Masters registration has been forwarded to the coordinator for review.',                        type: 'info',    read: false, createdAt: ts('2026-02-03'), link: '/tracker' },
  { id: 'notif-007', userId: 'student-002', title: 'Thesis at Faculty Board',     message: 'Your thesis examination entry is now with the Faculty Higher Degrees Committee.',                         type: 'info',    read: true,  createdAt: ts('2026-01-20'), link: '/tracker' },
  { id: 'notif-008', userId: 'student-002', title: 'Progress Report Approved',    message: 'Your 2025 progress report was approved. Reference: FHD/2025/0198.',                                      type: 'success', read: true,  createdAt: ts('2025-11-20'), link: '/tracker' },
  { id: 'notif-009', userId: 'student-002', title: 'Publication Congratulations', message: 'Congratulations! Your SA Journal of Computer Science paper has been published.',                          type: 'success', read: true,  createdAt: ts('2025-12-15') },
  { id: 'notif-010', userId: 'student-002', title: 'Upcoming Deadline',           message: 'Registration deadline is 28 February 2026. Ensure all documents are submitted.',                         type: 'warning', read: false, createdAt: ts('2026-02-06'), link: '/calendar' },

  // ── Student 3: Sipho ──
  { id: 'notif-011', userId: 'student-003', title: 'Leave Request Submitted',        message: 'Your leave of absence request has been submitted to Prof. van der Berg for review.',                  type: 'info',    read: false, createdAt: ts('2026-02-04'), link: '/requests' },
  { id: 'notif-012', userId: 'student-003', title: 'Supervisor Change Referred Back', message: 'Your supervisor change request was referred back. Additional motivation and supervisor statements needed.', type: 'error', read: true, createdAt: ts('2025-11-20'), link: '/requests' },
  { id: 'notif-013', userId: 'student-003', title: 'Title at Senate Board',           message: 'Your MSc title registration has been recommended by the Faculty Board (Ref: FHD/2026/0012) and is pending Senate Board approval.', type: 'info', read: false, createdAt: ts('2026-01-20'), link: '/tracker' },
  { id: 'notif-014', userId: 'student-003', title: 'Co-supervisor Review',            message: 'Your progress report is now being reviewed by co-supervisor Dr. Nkosi.',                             type: 'info',    read: false, createdAt: ts('2026-01-30'), link: '/requests' },

  // ── Supervisor 1: Prof. van der Berg ──
  { id: 'notif-015', userId: 'supervisor-001', title: 'Title Registration to Review',   message: 'Thabo Molefe submitted "ML-Driven Diagnostic Imaging" for your review. Access code: T7M4PK.',    type: 'info',    read: false, createdAt: ts('2026-02-01'), link: '/requests' },
  { id: 'notif-016', userId: 'supervisor-001', title: 'Leave Request to Review',        message: 'Sipho Dlamini submitted a leave of absence request. Access code: SD8K2X.',                         type: 'info',    read: false, createdAt: ts('2026-02-04'), link: '/requests' },
  { id: 'notif-017', userId: 'supervisor-001', title: 'Progress Report Completed',      message: "Thabo Molefe's 2025 progress report has been fully approved by Senate Board.",                     type: 'success', read: true,  createdAt: ts('2025-12-15'), link: '/requests' },
  { id: 'notif-018', userId: 'supervisor-001', title: 'Milestone: Conference Paper',    message: "Thabo Molefe presented at SAICSIT 2025 – update logged in milestones.",                            type: 'info',    read: true,  createdAt: ts('2025-10-16') },
  { id: 'notif-019', userId: 'supervisor-001', title: 'Faculty Board Meeting Reminder', message: 'Faculty Board meeting on 15 Feb at 10:00 – you have items on the agenda.',                         type: 'warning', read: false, createdAt: ts('2026-02-08'), link: '/calendar' },

  // ── Supervisor 2: Dr. Nkosi ──
  { id: 'notif-020', userId: 'supervisor-002', title: 'Co-supervisor Review Needed',    message: 'Sipho Dlamini\'s progress report requires your co-supervisor review. Code: PQ9W3E.',              type: 'info',    read: false, createdAt: ts('2026-01-30'), link: '/requests' },
  { id: 'notif-021', userId: 'supervisor-002', title: 'Naledi – Thesis at FHD',         message: "Naledi Khumalo's thesis examination entry is now at the Faculty Board.",                           type: 'info',    read: true,  createdAt: ts('2026-01-20'), link: '/requests' },
  { id: 'notif-022', userId: 'supervisor-002', title: 'Registration Forwarded',         message: "Naledi Khumalo's 2026 registration has been forwarded to the coordinator.",                        type: 'success', read: true,  createdAt: ts('2026-02-03') },

  // ── Coordinator: Dr. Patel ──
  { id: 'notif-023', userId: 'coordinator-001', title: 'Thesis Exam at Faculty Board',  message: "Naledi Khumalo's thesis examination entry is ready for the Faculty Board agenda.",                 type: 'warning', read: false, createdAt: ts('2026-01-20'), link: '/requests' },
  { id: 'notif-024', userId: 'coordinator-001', title: 'Registration for Review',       message: "Naledi Khumalo's 2026 masters registration requires coordinator review.",                          type: 'info',    read: false, createdAt: ts('2026-02-03'), link: '/requests' },
  { id: 'notif-025', userId: 'coordinator-001', title: 'Title at Senate Board',         message: "Sipho Dlamini's title registration (FHD/2026/0012) has been forwarded to Senate Board.",            type: 'info',    read: true,  createdAt: ts('2026-01-20') },
  { id: 'notif-026', userId: 'coordinator-001', title: 'Faculty Board Meeting',         message: 'Faculty Board meeting scheduled for 15 Feb 2026 – 4 items on agenda.',                             type: 'warning', read: false, createdAt: ts('2026-02-08'), link: '/calendar' },
  { id: 'notif-027', userId: 'coordinator-001', title: 'Ethics Referral Sent',          message: "Thabo Molefe's ethics approval was referred back – awaiting revised consent form.",                 type: 'info',    read: true,  createdAt: ts('2026-01-08') },

  // ── Admin: Linda Mkhize ──
  { id: 'notif-028', userId: 'admin-001', title: 'Senate Board Upcoming',          message: 'Senate Higher Degrees Committee meeting on 25 Feb at 14:00. Agenda preparation needed.',               type: 'warning', read: false, createdAt: ts('2026-02-06'), link: '/calendar' },
  { id: 'notif-029', userId: 'admin-001', title: 'System Usage Report',            message: 'Monthly system usage report for January 2026 has been generated.',                                      type: 'success', read: true,  createdAt: ts('2026-02-01') },
  { id: 'notif-030', userId: 'admin-001', title: '3 Requests at Senate Board',     message: 'Three HD requests are pending Senate Board decision. Review before 25 Feb meeting.',                    type: 'info',    read: false, createdAt: ts('2026-02-07'), link: '/requests' },
  { id: 'notif-031', userId: 'admin-001', title: 'New User Registrations',         message: '2 new supervisor accounts pending approval for the Mathematics department.',                             type: 'info',    read: false, createdAt: ts('2026-02-05') },
  { id: 'notif-032', userId: 'admin-001', title: 'Firestore Rules Updated',        message: 'Security rules were deployed successfully on 7 Feb 2026.',                                              type: 'success', read: true,  createdAt: ts('2026-02-07') },
];

// ══════════════════════════════════════════════════════════════
// 7. AUDIT LOGS  – comprehensive activity trail
// ══════════════════════════════════════════════════════════════
const AUDIT_LOGS = [
  // Newest first
  { id: 'audit-001', timestamp: ts('2026-02-07T15:30:00'), userId: 'admin-001',       userName: 'Linda Mkhize',              action: 'Deployed Security Rules', entityType: 'System', entityId: 'firestore-rules', details: 'Updated Firestore security rules to role-based access' },
  { id: 'audit-002', timestamp: ts('2026-02-06T11:00:00'), userId: 'student-002',     userName: 'Naledi Khumalo',            action: 'Created Request',         entityType: 'HDRequest', entityId: 'hdr-008', details: 'Created title amendment request – draft saved' },
  { id: 'audit-003', timestamp: ts('2026-02-05T09:20:00'), userId: 'student-001',     userName: 'Thabo Molefe',              action: 'Created Request',         entityType: 'HDRequest', entityId: 'hdr-003', details: 'Created 6-month extension request – draft saved' },
  { id: 'audit-004', timestamp: ts('2026-02-04T08:45:00'), userId: 'student-003',     userName: 'Sipho Dlamini',             action: 'Submitted Request',       entityType: 'HDRequest', entityId: 'hdr-009', details: 'Submitted leave of absence request to supervisor' },
  { id: 'audit-005', timestamp: ts('2026-02-03T14:15:00'), userId: 'supervisor-002',  userName: 'Dr. James Nkosi',           action: 'Forwarded Request',       entityType: 'HDRequest', entityId: 'hdr-005', details: 'Forwarded Naledi\'s registration to coordinator after co-supervisor signed' },
  { id: 'audit-006', timestamp: ts('2026-02-01T10:00:00'), userId: 'supervisor-001',  userName: 'Prof. Sarah van der Berg',  action: 'Opened Request',          entityType: 'HDRequest', entityId: 'hdr-002', details: 'Validated access code T7M4PK and opened title registration for review' },
  { id: 'audit-007', timestamp: ts('2026-01-30T16:00:00'), userId: 'supervisor-001',  userName: 'Prof. Sarah van der Berg',  action: 'Approved Request',        entityType: 'HDRequest', entityId: 'hdr-012', details: 'Approved Sipho\'s progress report and forwarded to co-supervisor Dr. Nkosi' },
  { id: 'audit-008', timestamp: ts('2026-01-28T09:30:00'), userId: 'student-001',     userName: 'Thabo Molefe',              action: 'Submitted Request',       entityType: 'HDRequest', entityId: 'hdr-002', details: 'Submitted title registration to Prof. van der Berg' },
  { id: 'audit-009', timestamp: ts('2026-01-20T11:00:00'), userId: 'coordinator-001', userName: 'Dr. Fatima Patel',          action: 'Faculty Board Decision',  entityType: 'HDRequest', entityId: 'hdr-011', details: 'Faculty Board recommended Sipho\'s title registration (Ref: FHD/2026/0012). Forwarded to Senate Board.' },
  { id: 'audit-010', timestamp: ts('2026-01-20T09:00:00'), userId: 'coordinator-001', userName: 'Dr. Fatima Patel',          action: 'Forwarded to Faculty Board', entityType: 'HDRequest', entityId: 'hdr-006', details: 'Signed and forwarded Naledi\'s thesis examination entry to Faculty Board' },
  { id: 'audit-011', timestamp: ts('2026-01-15T08:00:00'), userId: 'student-001',     userName: 'Thabo Molefe',              action: 'Created Request',         entityType: 'HDRequest', entityId: 'hdr-002', details: 'Created title registration – ML-Driven Diagnostic Imaging' },
  { id: 'audit-012', timestamp: ts('2026-01-12T10:30:00'), userId: 'student-003',     userName: 'Sipho Dlamini',             action: 'Submitted Request',       entityType: 'HDRequest', entityId: 'hdr-012', details: 'Submitted January 2026 progress report to supervisor' },
  { id: 'audit-013', timestamp: ts('2026-01-10T14:00:00'), userId: 'supervisor-002',  userName: 'Dr. James Nkosi',           action: 'Approved Request',        entityType: 'HDRequest', entityId: 'hdr-006', details: 'Approved Naledi\'s thesis examination entry and forwarded to coordinator' },
  { id: 'audit-014', timestamp: ts('2026-01-08T11:00:00'), userId: 'coordinator-001', userName: 'Dr. Fatima Patel',          action: 'Referred Back',           entityType: 'HDRequest', entityId: 'hdr-004', details: 'Faculty Board referred back ethics approval – consent form revisions required' },
  { id: 'audit-015', timestamp: ts('2025-12-15T13:30:00'), userId: 'admin-001',       userName: 'Linda Mkhize',              action: 'Final Approval',          entityType: 'HDRequest', entityId: 'hdr-001', details: 'Senate Board approved Thabo\'s 2025 progress report – fully approved' },
  { id: 'audit-016', timestamp: ts('2025-12-01T10:00:00'), userId: 'student-002',     userName: 'Naledi Khumalo',            action: 'Created Request',         entityType: 'HDRequest', entityId: 'hdr-006', details: 'Created thesis examination entry request' },
  { id: 'audit-017', timestamp: ts('2025-11-20T10:00:00'), userId: 'coordinator-001', userName: 'Dr. Fatima Patel',          action: 'Referred Back',           entityType: 'HDRequest', entityId: 'hdr-010', details: 'Supervisor change request referred back – additional motivation required' },
  { id: 'audit-018', timestamp: ts('2025-11-20T09:00:00'), userId: 'admin-001',       userName: 'Linda Mkhize',              action: 'Final Approval',          entityType: 'HDRequest', entityId: 'hdr-007', details: 'Senate Board approved Naledi\'s 2025 progress report – fully approved' },
  { id: 'audit-019', timestamp: ts('2025-11-05T14:00:00'), userId: 'coordinator-001', userName: 'Dr. Fatima Patel',          action: 'Forwarded to Faculty Board', entityType: 'HDRequest', entityId: 'hdr-001', details: 'Signed and forwarded Thabo\'s 2025 progress report to Faculty Board' },
  { id: 'audit-020', timestamp: ts('2025-10-15T09:00:00'), userId: 'supervisor-002',  userName: 'Dr. James Nkosi',           action: 'Approved Request',        entityType: 'HDRequest', entityId: 'hdr-010', details: 'Approved Sipho\'s supervisor change request – forwarded to coordinator' },
  { id: 'audit-021', timestamp: ts('2025-10-01T08:30:00'), userId: 'student-003',     userName: 'Sipho Dlamini',             action: 'Created Request',         entityType: 'HDRequest', entityId: 'hdr-010', details: 'Created supervisor change request' },
  { id: 'audit-022', timestamp: ts('2025-09-20T11:00:00'), userId: 'supervisor-001',  userName: 'Prof. Sarah van der Berg',  action: 'Approved Request',        entityType: 'HDRequest', entityId: 'hdr-001', details: 'Approved Thabo\'s 2025 progress report – forwarded to coordinator' },
  { id: 'audit-023', timestamp: ts('2025-09-10T10:00:00'), userId: 'student-001',     userName: 'Thabo Molefe',              action: 'Submitted Request',       entityType: 'HDRequest', entityId: 'hdr-001', details: 'Submitted Annual Progress Report 2025 to supervisor' },
  { id: 'audit-024', timestamp: ts('2025-09-01T08:00:00'), userId: 'student-001',     userName: 'Thabo Molefe',              action: 'Created Request',         entityType: 'HDRequest', entityId: 'hdr-001', details: 'Created Annual Progress Report 2025' },
  { id: 'audit-025', timestamp: ts('2025-08-15T09:30:00'), userId: 'student-002',     userName: 'Naledi Khumalo',            action: 'Created Request',         entityType: 'HDRequest', entityId: 'hdr-007', details: 'Created Annual Progress Report 2025' },
  { id: 'audit-026', timestamp: ts('2025-06-01T08:00:00'), userId: 'student-003',     userName: 'Sipho Dlamini',             action: 'Created Request',         entityType: 'HDRequest', entityId: 'hdr-011', details: 'Created MSc title registration – Blockchain Credentials' },
  { id: 'audit-027', timestamp: ts('2025-05-10T12:00:00'), userId: 'student-001',     userName: 'Thabo Molefe',              action: 'Added Milestone',         entityType: 'Milestone', entityId: 'ms-004', details: 'Logged ethics clearance from UWC BMREC' },
  { id: 'audit-028', timestamp: ts('2025-04-15T14:00:00'), userId: 'student-002',     userName: 'Naledi Khumalo',            action: 'Added Milestone',         entityType: 'Milestone', entityId: 'ms-010', details: 'Logged City of Cape Town data partnership MoU' },
  { id: 'audit-029', timestamp: ts('2026-02-08T08:00:00'), userId: 'admin-001',       userName: 'Linda Mkhize',              action: 'System Maintenance',      entityType: 'System', entityId: 'system', details: 'Scheduled database backup and cleanup completed' },
  { id: 'audit-030', timestamp: ts('2026-01-05T09:00:00'), userId: 'student-003',     userName: 'Sipho Dlamini',             action: 'Created Request',         entityType: 'HDRequest', entityId: 'hdr-012', details: 'Created semi-annual progress report for January 2026' },
];

// ══════════════════════════════════════════════════════════════
// COLLECTION MAP
// ══════════════════════════════════════════════════════════════
const ALL_COLLECTIONS = {
  users:           USERS,
  hdRequests:      HD_REQUESTS,
  calendarEvents:  CALENDAR_EVENTS,
  milestones:      MILESTONES,
  notifications:   NOTIFICATIONS,
  studentProfiles: STUDENT_PROFILES,
  auditLogs:       AUDIT_LOGS,
};

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

async function deleteCollection(colName) {
  const snap = await getDocs(collection(db, colName));
  if (snap.empty) return 0;
  // Firestore writeBatch supports max 500 ops
  const batches = [];
  let batch = writeBatch(db);
  let count = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    count++;
    if (count % 400 === 0) {
      batches.push(batch);
      batch = writeBatch(db);
    }
  }
  batches.push(batch);
  for (const b of batches) await b.commit();
  return count;
}

async function seedCollection(colName, items) {
  const batches = [];
  let batch = writeBatch(db);
  let count = 0;
  for (const item of items) {
    const { id, ...data } = item;
    batch.set(doc(db, colName, id), data);
    count++;
    if (count % 400 === 0) {
      batches.push(batch);
      batch = writeBatch(db);
    }
  }
  batches.push(batch);
  for (const b of batches) await b.commit();
  return count;
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   Re-seed Firebase – PostGrad Portal (Full)     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Authenticate as admin so security rules allow writes
  console.log('[0/3] Authenticating as admin...');
  try {
    await signInWithEmailAndPassword(auth, 'admin@uwc.ac.za', 'Portal@2026');
    console.log('  ✓ Signed in as admin@uwc.ac.za\n');
  } catch (err) {
    console.error('  ✗ Auth failed:', err.message);
    console.error('  Make sure auth users exist. Run: node scripts/seed-firebase.mjs first.\n');
    process.exit(1);
  }

  // Step 1: Delete all existing data
  console.log('[1/3] Clearing existing Firestore data...');
  for (const colName of Object.keys(ALL_COLLECTIONS)) {
    const deleted = await deleteCollection(colName);
    console.log(`  ✗ Deleted ${deleted} docs from ${colName}`);
  }
  console.log('  ✓ All collections cleared\n');

  // Step 2: Seed all collections
  console.log('[2/3] Seeding Firestore collections...');
  for (const [colName, items] of Object.entries(ALL_COLLECTIONS)) {
    const count = await seedCollection(colName, items);
    console.log(`  ✓ Seeded ${count} docs → ${colName}`);
  }
  console.log('');

  // Step 3: Summary
  console.log('[3/3] Summary');
  console.log('  ┌─────────────────────────┬───────┐');
  console.log('  │ Collection              │ Count │');
  console.log('  ├─────────────────────────┼───────┤');
  for (const [colName, items] of Object.entries(ALL_COLLECTIONS)) {
    console.log(`  │ ${colName.padEnd(24)}│ ${String(items.length).padStart(5)} │`);
  }
  console.log('  └─────────────────────────┴───────┘');

  const total = Object.values(ALL_COLLECTIONS).reduce((s, a) => s + a.length, 0);
  console.log(`\n✅ Re-seed complete! ${total} documents written.`);
  console.log('  All demo accounts use password: Portal@2026');
  console.log('  Login emails:');
  USERS.forEach(u => console.log(`    ${u.email} (${u.role})`));
  console.log('');

  process.exit(0);
}

main().catch(err => {
  console.error('✗ Re-seed failed:', err.message);
  process.exit(1);
});
