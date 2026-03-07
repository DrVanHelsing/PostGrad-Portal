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
  apiKey: 'AIzaSyBCy59swYINVaEgfPy2XqP6U5nLs8qbadY',
  authDomain: 'postgrad-portal.firebaseapp.com',
  projectId: 'postgrad-portal',
  storageBucket: 'postgrad-portal.firebasestorage.app',
  messagingSenderId: '1074199423382',
  appId: '1:1074199423382:web:1a93b580f2c268dfd955b7',
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
// THESIS SUBMISSIONS
// ══════════════════════════════════════════════════════════════
const THESIS_SUBMISSIONS = [
  {
    id: 'thesis-001',
    studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coSupervisorId: null,
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Machine Learning Applications in Healthcare Diagnostics: A South African Perspective',
    submissionType: 'draft_chapter',
    chapterTitle: 'Chapter 3 – Methodology',
    status: 'feedback_provided',
    createdAt: ts('2026-01-20'), updatedAt: ts('2026-02-05'),
    currentVersion: 2,
    documents: [
      { name: 'Chapter3_Methodology_v2.pdf', size: '1.2 MB', uploadedAt: ts('2026-02-01'), path: '/documents/hdr-002/Progress_Report_2025.pdf' },
    ],
    versions: [
      {
        id: 'tv-001', version: 1, status: 'changes_requested',
        uploadedAt: ts('2026-01-20'), uploadedBy: 'student-001',
        documents: [{ name: 'Chapter3_Methodology_v1.pdf', size: '980 KB', path: '/documents/hdr-003/Extension_Motivation_Letter.pdf' }],
        changeNotes: 'Initial draft of methodology chapter covering research design, data collection, and analysis framework.',
        feedback: [
          {
            id: 'fb-001', reviewerId: 'supervisor-001', reviewerName: 'Prof. Sarah van der Berg', reviewerRole: 'supervisor',
            recommendation: 'changes_requested', date: ts('2026-01-25'),
            criteria: { research_quality: 4, academic_writing: 3, methodology: 3, completeness: 3, formatting: 4 },
            comments: 'Good overall structure but the sampling methodology needs more rigorous justification. Please expand the ethics considerations section and add details about data preprocessing steps.',
          },
        ],
        comments: [
          { id: 'tc-001', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', text: 'Section 3.2 needs stronger justification for the choice of CNN architecture over traditional ML approaches.', date: ts('2026-01-25') },
          { id: 'tc-002', authorId: 'student-001', authorName: 'Thabo Molefe', authorRole: 'student', text: 'Thank you, I will add a comparative analysis section to justify the architectural choice.', date: ts('2026-01-26'), replyTo: 'tc-001' },
        ],
      },
      {
        id: 'tv-002', version: 2, status: 'under_review',
        uploadedAt: ts('2026-02-01'), uploadedBy: 'student-001',
        documents: [{ name: 'Chapter3_Methodology_v2.pdf', size: '1.2 MB', path: '/documents/hdr-002/Progress_Report_2025.pdf' }],
        changeNotes: 'Revised methodology with expanded ethics section, added CNN architecture justification, and improved data preprocessing description.',
        feedback: [],
        comments: [
          { id: 'tc-003', authorId: 'student-001', authorName: 'Thabo Molefe', authorRole: 'student', text: 'I have addressed all the feedback. Added Section 3.2.1 for architecture comparison and expanded Section 3.4 on ethics.', date: ts('2026-02-01') },
        ],
      },
    ],
    annotations: [
      { id: 'ann-001', versionId: 'tv-001', documentName: 'Chapter3_Methodology_v1.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 5, selectedText: 'convenience sampling approach', comment: 'This needs to be changed to stratified sampling to ensure representativeness across hospital types.', color: 'yellow', status: 'resolved', createdAt: ts('2026-01-25') },
      { id: 'ann-002', versionId: 'tv-001', documentName: 'Chapter3_Methodology_v1.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 8, selectedText: 'ethical approval is pending', comment: 'Update this to reflect the approved ethics number (HS-2025-0847).', color: 'green', status: 'resolved', createdAt: ts('2026-01-25') },
      { id: 'ann-003', versionId: 'tv-002', documentName: 'Chapter3_Methodology_v2.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 3, selectedText: 'deep learning architectures', comment: 'Consider citing the recent survey by Chen et al. (2025) here.', color: 'blue', status: 'active', createdAt: ts('2026-02-03') },
    ],
    rating: { overall: 3.5, criteria: { research_quality: 4, academic_writing: 3, methodology: 3, completeness: 3, formatting: 4 } },
  },
  {
    id: 'thesis-002',
    studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coSupervisorId: null,
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Machine Learning Applications in Healthcare Diagnostics: A South African Perspective',
    submissionType: 'draft_chapter',
    chapterTitle: 'Chapter 2 – Literature Review',
    status: 'approved',
    createdAt: ts('2025-09-15'), updatedAt: ts('2025-11-10'),
    currentVersion: 3,
    documents: [
      { name: 'Chapter2_LitReview_v3.pdf', size: '2.1 MB', uploadedAt: ts('2025-11-01'), path: '/documents/hdr-002/Publication_Evidence.pdf' },
    ],
    versions: [
      {
        id: 'tv-003', version: 1, status: 'superseded',
        uploadedAt: ts('2025-09-15'), uploadedBy: 'student-001',
        documents: [{ name: 'Chapter2_LitReview_v1.pdf', size: '1.4 MB', path: '/documents/hdr-011/Title_Registration_Form.pdf' }],
        changeNotes: 'First draft covering 87 papers.',
        feedback: [{ id: 'fb-002', reviewerId: 'supervisor-001', reviewerName: 'Prof. Sarah van der Berg', reviewerRole: 'supervisor', recommendation: 'changes_requested', date: ts('2025-09-25'), criteria: { research_quality: 3, academic_writing: 3, methodology: 3, completeness: 2, formatting: 3 }, comments: 'Need to include more recent papers from 2024-2025. The thematic organization is good but coverage of African context is insufficient.' }],
        comments: [],
      },
      {
        id: 'tv-004', version: 2, status: 'superseded',
        uploadedAt: ts('2025-10-10'), uploadedBy: 'student-001',
        documents: [{ name: 'Chapter2_LitReview_v2.pdf', size: '1.8 MB', path: '/documents/hdr-007/Progress_Report_NK_2025.pdf' }],
        changeNotes: 'Added 40 more papers, expanded African context section.',
        feedback: [{ id: 'fb-003', reviewerId: 'supervisor-001', reviewerName: 'Prof. Sarah van der Berg', reviewerRole: 'supervisor', recommendation: 'changes_requested', date: ts('2025-10-20'), criteria: { research_quality: 4, academic_writing: 3, methodology: 4, completeness: 4, formatting: 3 }, comments: 'Much improved. Fix formatting inconsistencies in reference list and improve the synthesis paragraph at the end of each section.' }],
        comments: [],
      },
      {
        id: 'tv-005', version: 3, status: 'approved',
        uploadedAt: ts('2025-11-01'), uploadedBy: 'student-001',
        documents: [{ name: 'Chapter2_LitReview_v3.pdf', size: '2.1 MB', path: '/documents/hdr-002/Publication_Evidence.pdf' }],
        changeNotes: 'Final version with formatted references and synthesis paragraphs.',
        feedback: [{ id: 'fb-004', reviewerId: 'supervisor-001', reviewerName: 'Prof. Sarah van der Berg', reviewerRole: 'supervisor', recommendation: 'approve', date: ts('2025-11-10'), criteria: { research_quality: 5, academic_writing: 4, methodology: 5, completeness: 5, formatting: 4 }, comments: 'Excellent literature review. Ready for inclusion in the thesis.' }],
        comments: [
          { id: 'tc-004', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', text: 'This chapter is now at a very high standard. Well done!', date: ts('2025-11-10') },
        ],
      },
    ],
    annotations: [
      { id: 'ann-009', versionId: 'tv-003', documentName: 'Chapter2_LitReview_v1.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 3, selectedText: 'systematic review methodology', comment: 'Clarify whether you followed PRISMA or another systematic review framework.', color: 'yellow', status: 'resolved', createdAt: ts('2025-09-22') },
      { id: 'ann-010', versionId: 'tv-004', documentName: 'Chapter2_LitReview_v2.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 15, selectedText: 'limited African research context', comment: 'Good improvement — the new African case studies strengthen this section significantly.', color: 'green', status: 'resolved', createdAt: ts('2025-10-18') },
    ],
    rating: { overall: 4.6, criteria: { research_quality: 5, academic_writing: 4, methodology: 5, completeness: 5, formatting: 4 } },
  },
  {
    id: 'thesis-003',
    studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coSupervisorId: 'supervisor-001',
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Predictive Analytics for Urban Planning in South African Municipalities',
    submissionType: 'full_thesis',
    chapterTitle: null,
    status: 'under_review',
    createdAt: ts('2026-02-01'), updatedAt: ts('2026-02-12'),
    currentVersion: 1,
    documents: [
      { name: 'Khumalo_MSc_Thesis_Full_v1.pdf', size: '8.4 MB', uploadedAt: ts('2026-02-01'), path: '/documents/hdr-005/Progress_Report_2025_Dlamini.pdf' },
      { name: 'Turnitin_Report_Khumalo.pdf', size: '340 KB', uploadedAt: ts('2026-02-01'), path: '/documents/hdr-006/Turnitin_Report.pdf' },
    ],
    versions: [
      {
        id: 'tv-006', version: 1, status: 'under_review',
        uploadedAt: ts('2026-02-01'), uploadedBy: 'student-002',
        documents: [
          { name: 'Khumalo_MSc_Thesis_Full_v1.pdf', size: '8.4 MB', path: '/documents/hdr-005/Progress_Report_2025_Dlamini.pdf' },
          { name: 'Turnitin_Report_Khumalo.pdf', size: '340 KB', path: '/documents/hdr-006/Turnitin_Report.pdf' },
        ],
        changeNotes: 'Complete thesis submission for supervisor review. Turnitin similarity: 12%.',
        feedback: [],
        comments: [
          { id: 'tc-005', authorId: 'student-002', authorName: 'Naledi Khumalo', authorRole: 'student', text: 'Submitting full thesis for first review. All chapters have been previously reviewed individually.', date: ts('2026-02-01') },
          { id: 'tc-006', authorId: 'supervisor-002', authorName: 'Dr. James Nkosi', authorRole: 'supervisor', text: 'Thank you, Naledi. I will begin the full review this week.', date: ts('2026-02-03') },
          { id: 'tc-007', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', text: 'I will also review the methodology and results chapters from a co-supervisor perspective.', date: ts('2026-02-04') },
        ],
      },
    ],
    annotations: [
      { id: 'ann-004', versionId: 'tv-006', documentName: 'Khumalo_MSc_Thesis_Full_v1.pdf', authorId: 'supervisor-002', authorName: 'Dr. James Nkosi', authorRole: 'supervisor', page: 12, selectedText: 'urban growth prediction model', comment: 'Consider adding a comparison with the Cellular Automata approach used by Verburg et al.', color: 'yellow', status: 'active', createdAt: ts('2026-02-08') },
      { id: 'ann-005', versionId: 'tv-006', documentName: 'Khumalo_MSc_Thesis_Full_v1.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 45, selectedText: 'random forest regression', comment: 'The feature importance analysis should be presented as a separate table rather than inline text.', color: 'pink', status: 'active', createdAt: ts('2026-02-10') },
    ],
    rating: null,
  },
  {
    id: 'thesis-004',
    studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coSupervisorId: 'supervisor-001',
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Predictive Analytics for Urban Planning in South African Municipalities',
    submissionType: 'draft_chapter',
    chapterTitle: 'Chapter 4 – Results and Discussion',
    status: 'approved',
    createdAt: ts('2025-12-01'), updatedAt: ts('2026-01-15'),
    currentVersion: 2,
    documents: [
      { name: 'Chapter4_Results_v2.pdf', size: '3.2 MB', uploadedAt: ts('2026-01-05'), path: '/documents/hdr-004/Data_Collection_Protocol.pdf' },
    ],
    versions: [
      {
        id: 'tv-007', version: 1, status: 'superseded',
        uploadedAt: ts('2025-12-01'), uploadedBy: 'student-002',
        documents: [{ name: 'Chapter4_Results_v1.pdf', size: '2.8 MB', path: '/documents/hdr-004/Ethics_Application_v1.pdf' }],
        changeNotes: 'First draft with preliminary results from 3 municipalities.',
        feedback: [{ id: 'fb-005', reviewerId: 'supervisor-002', reviewerName: 'Dr. James Nkosi', reviewerRole: 'supervisor', recommendation: 'changes_requested', date: ts('2025-12-15'), criteria: { research_quality: 4, academic_writing: 4, methodology: 3, completeness: 3, formatting: 4 }, comments: 'Results are promising but the discussion section needs to connect findings more strongly to the literature. Add confidence intervals to all predictions.' }],
        comments: [],
      },
      {
        id: 'tv-008', version: 2, status: 'approved',
        uploadedAt: ts('2026-01-05'), uploadedBy: 'student-002',
        documents: [{ name: 'Chapter4_Results_v2.pdf', size: '3.2 MB', path: '/documents/hdr-004/Data_Collection_Protocol.pdf' }],
        changeNotes: 'Added confidence intervals, strengthened discussion, included all 5 municipalities.',
        feedback: [{ id: 'fb-006', reviewerId: 'supervisor-002', reviewerName: 'Dr. James Nkosi', reviewerRole: 'supervisor', recommendation: 'approve', date: ts('2026-01-15'), criteria: { research_quality: 5, academic_writing: 5, methodology: 4, completeness: 5, formatting: 5 }, comments: 'Excellent chapter. The discussion is now well-grounded in the literature.' }],
        comments: [
          { id: 'tc-008', authorId: 'supervisor-002', authorName: 'Dr. James Nkosi', authorRole: 'supervisor', text: 'This is ready. Strong work, Naledi.', date: ts('2026-01-15') },
        ],
      },
    ],
    annotations: [
      { id: 'ann-011', versionId: 'tv-007', documentName: 'Chapter4_Results_v1.pdf', authorId: 'supervisor-002', authorName: 'Dr. James Nkosi', authorRole: 'supervisor', page: 7, selectedText: 'confidence interval of 95%', comment: 'Add confidence intervals to ALL prediction tables, not just Table 4.1.', color: 'yellow', status: 'resolved', createdAt: ts('2025-12-12') },
      { id: 'ann-012', versionId: 'tv-007', documentName: 'Chapter4_Results_v1.pdf', authorId: 'supervisor-002', authorName: 'Dr. James Nkosi', authorRole: 'supervisor', page: 14, selectedText: 'discussion of findings', comment: 'Connect these findings back to the theoretical framework in Chapter 2.', color: 'pink', status: 'resolved', createdAt: ts('2025-12-13') },
    ],
    rating: { overall: 4.8, criteria: { research_quality: 5, academic_writing: 5, methodology: 4, completeness: 5, formatting: 5 } },
  },
  {
    id: 'thesis-005',
    studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coSupervisorId: null,
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Machine Learning Applications in Healthcare Diagnostics: A South African Perspective',
    submissionType: 'research_proposal',
    chapterTitle: 'Research Proposal – ML in SA Healthcare',
    status: 'approved',
    createdAt: ts('2025-05-10'), updatedAt: ts('2025-06-20'),
    currentVersion: 2,
    documents: [
      { name: 'Research_Proposal_Molefe_v2.pdf', size: '1.5 MB', uploadedAt: ts('2025-06-15'), path: '/documents/hdr-001/Title_Registration_Form.pdf' },
    ],
    versions: [
      {
        id: 'tv-009', version: 1, status: 'superseded',
        uploadedAt: ts('2025-05-10'), uploadedBy: 'student-001',
        documents: [{ name: 'Research_Proposal_Molefe_v1.pdf', size: '1.1 MB', path: '/documents/hdr-001/Title_Registration_Form.pdf' }],
        changeNotes: 'Initial research proposal submission.',
        feedback: [{ id: 'fb-007', reviewerId: 'supervisor-001', reviewerName: 'Prof. Sarah van der Berg', reviewerRole: 'supervisor', recommendation: 'changes_requested', date: ts('2025-05-25'), criteria: { research_quality: 4, academic_writing: 3, methodology: 3, completeness: 3, formatting: 4 }, comments: 'Solid research questions but the scope is too broad. Narrow down to 2-3 specific diagnostic areas. Budget section is incomplete.' }],
        comments: [],
      },
      {
        id: 'tv-010', version: 2, status: 'approved',
        uploadedAt: ts('2025-06-15'), uploadedBy: 'student-001',
        documents: [{ name: 'Research_Proposal_Molefe_v2.pdf', size: '1.5 MB', path: '/documents/hdr-001/Title_Registration_Form.pdf' }],
        changeNotes: 'Narrowed scope to tuberculosis and diabetic retinopathy diagnostics. Added budget breakdown.',
        feedback: [{ id: 'fb-008', reviewerId: 'supervisor-001', reviewerName: 'Prof. Sarah van der Berg', reviewerRole: 'supervisor', recommendation: 'approve', date: ts('2025-06-20'), criteria: { research_quality: 5, academic_writing: 4, methodology: 5, completeness: 4, formatting: 4 }, comments: 'Well-focused proposal. Approved for submission to faculty committee.' }],
        comments: [
          { id: 'tc-009', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', text: 'Excellent revision, Thabo. The narrowed scope will allow for more depth.', date: ts('2025-06-20') },
        ],
      },
    ],
    annotations: [
      { id: 'ann-013', versionId: 'tv-009', documentName: 'Research_Proposal_Molefe_v1.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 2, selectedText: 'broad scope of machine learning', comment: 'The scope is too broad. Narrow down to 2-3 specific diagnostic areas for feasibility.', color: 'yellow', status: 'resolved', createdAt: ts('2025-05-22') },
      { id: 'ann-014', versionId: 'tv-009', documentName: 'Research_Proposal_Molefe_v1.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 6, selectedText: 'budget allocation', comment: 'Budget section is incomplete. Please add estimated costs for data collection, computing resources, and travel.', color: 'red', status: 'resolved', createdAt: ts('2025-05-23') },
      { id: 'ann-015', versionId: 'tv-010', documentName: 'Research_Proposal_Molefe_v2.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 4, selectedText: 'tuberculosis and diabetic retinopathy', comment: 'Good focus areas. This is much more feasible now.', color: 'green', status: 'resolved', createdAt: ts('2025-06-18') },
    ],
    rating: { overall: 4.4, criteria: { research_quality: 5, academic_writing: 4, methodology: 5, completeness: 4, formatting: 4 } },
  },
  {
    id: 'thesis-006',
    studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coSupervisorId: null,
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Machine Learning Applications in Healthcare Diagnostics: A South African Perspective',
    submissionType: 'ethics_application',
    chapterTitle: 'Ethics Application – Human Subjects Research',
    status: 'approved',
    createdAt: ts('2025-07-01'), updatedAt: ts('2025-07-28'),
    currentVersion: 1,
    documents: [
      { name: 'Ethics_Application_Molefe.pdf', size: '890 KB', uploadedAt: ts('2025-07-01'), path: '/documents/hdr-004/Ethics_Application_v1.pdf' },
    ],
    versions: [
      {
        id: 'tv-011', version: 1, status: 'approved',
        uploadedAt: ts('2025-07-01'), uploadedBy: 'student-001',
        documents: [{ name: 'Ethics_Application_Molefe.pdf', size: '890 KB', path: '/documents/hdr-004/Ethics_Application_v1.pdf' }],
        changeNotes: 'Ethics application for clinical data collection at Tygerberg Hospital.',
        feedback: [{ id: 'fb-009', reviewerId: 'supervisor-001', reviewerName: 'Prof. Sarah van der Berg', reviewerRole: 'supervisor', recommendation: 'approve', date: ts('2025-07-28'), criteria: { research_quality: 4, academic_writing: 4, methodology: 5, completeness: 5, formatting: 4 }, comments: 'Comprehensive ethics application. Consent forms are well designed. Ready for committee submission.' }],
        comments: [],
      },
    ],
    annotations: [],
    rating: { overall: 4.4, criteria: { research_quality: 4, academic_writing: 4, methodology: 5, completeness: 5, formatting: 4 } },
  },
  {
    id: 'thesis-007',
    studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coSupervisorId: 'supervisor-001',
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Predictive Analytics for Urban Planning in South African Municipalities',
    submissionType: 'literature_review',
    chapterTitle: 'Systematic Literature Review – Urban Analytics Models',
    status: 'approved',
    createdAt: ts('2025-08-01'), updatedAt: ts('2025-09-20'),
    currentVersion: 2,
    documents: [
      { name: 'SLR_UrbanAnalytics_Khumalo_v2.pdf', size: '2.3 MB', uploadedAt: ts('2025-09-10'), path: '/documents/hdr-007/Progress_Report_NK_2025.pdf' },
    ],
    versions: [
      {
        id: 'tv-012', version: 1, status: 'superseded',
        uploadedAt: ts('2025-08-01'), uploadedBy: 'student-002',
        documents: [{ name: 'SLR_UrbanAnalytics_Khumalo_v1.pdf', size: '1.9 MB', path: '/documents/hdr-007/Progress_Report_NK_2025.pdf' }],
        changeNotes: 'First draft of systematic literature review covering 120 papers on urban analytics models.',
        feedback: [{ id: 'fb-010', reviewerId: 'supervisor-002', reviewerName: 'Dr. James Nkosi', reviewerRole: 'supervisor', recommendation: 'changes_requested', date: ts('2025-08-20'), criteria: { research_quality: 4, academic_writing: 3, methodology: 4, completeness: 3, formatting: 3 }, comments: 'Good coverage but missing African case studies. Please also improve the PRISMA flow diagram and add keyword co-occurrence analysis.' }],
        comments: [],
      },
      {
        id: 'tv-013', version: 2, status: 'approved',
        uploadedAt: ts('2025-09-10'), uploadedBy: 'student-002',
        documents: [{ name: 'SLR_UrbanAnalytics_Khumalo_v2.pdf', size: '2.3 MB', path: '/documents/hdr-007/Progress_Report_NK_2025.pdf' }],
        changeNotes: 'Added 25 African case studies, improved PRISMA diagram, added bibliometric analysis.',
        feedback: [{ id: 'fb-011', reviewerId: 'supervisor-002', reviewerName: 'Dr. James Nkosi', reviewerRole: 'supervisor', recommendation: 'approve', date: ts('2025-09-20'), criteria: { research_quality: 5, academic_writing: 4, methodology: 5, completeness: 5, formatting: 4 }, comments: 'Excellent systematic review. Ready for thesis inclusion.' }],
        comments: [
          { id: 'tc-010', authorId: 'supervisor-002', authorName: 'Dr. James Nkosi', authorRole: 'supervisor', text: 'Great improvement. Consider publishing this as a standalone review paper.', date: ts('2025-09-20') },
        ],
      },
    ],
    annotations: [
      { id: 'ann-016', versionId: 'tv-012', documentName: 'SLR_UrbanAnalytics_Khumalo_v1.pdf', authorId: 'supervisor-002', authorName: 'Dr. James Nkosi', authorRole: 'supervisor', page: 8, selectedText: 'search string construction', comment: 'Add the keyword co-occurrence analysis to validate your search strategy.', color: 'yellow', status: 'resolved', createdAt: ts('2025-08-18') },
      { id: 'ann-017', versionId: 'tv-012', documentName: 'SLR_UrbanAnalytics_Khumalo_v1.pdf', authorId: 'supervisor-002', authorName: 'Dr. James Nkosi', authorRole: 'supervisor', page: 11, selectedText: 'no African case studies were found', comment: 'There are several African case studies — check Amoako (2022) and Odendaal (2021).', color: 'red', status: 'resolved', createdAt: ts('2025-08-19') },
      { id: 'ann-018', versionId: 'tv-013', documentName: 'SLR_UrbanAnalytics_Khumalo_v2.pdf', authorId: 'supervisor-002', authorName: 'Dr. James Nkosi', authorRole: 'supervisor', page: 5, selectedText: 'PRISMA flow diagram', comment: 'Much improved PRISMA diagram. Ready for thesis.', color: 'green', status: 'resolved', createdAt: ts('2025-09-18') },
    ],
    rating: { overall: 4.6, criteria: { research_quality: 5, academic_writing: 4, methodology: 5, completeness: 5, formatting: 4 } },
  },
  {
    id: 'thesis-008',
    studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coSupervisorId: 'supervisor-001',
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Predictive Analytics for Urban Planning in South African Municipalities',
    submissionType: 'conference_paper',
    chapterTitle: 'Conference Paper – SAICSIT 2026',
    status: 'feedback_provided',
    createdAt: ts('2026-01-25'), updatedAt: ts('2026-02-10'),
    currentVersion: 1,
    documents: [
      { name: 'SAICSIT_2026_Khumalo_Draft.pdf', size: '720 KB', uploadedAt: ts('2026-01-25'), path: '/documents/hdr-005/Progress_Report_2025_Dlamini.pdf' },
    ],
    versions: [
      {
        id: 'tv-014', version: 1, status: 'changes_requested',
        uploadedAt: ts('2026-01-25'), uploadedBy: 'student-002',
        documents: [{ name: 'SAICSIT_2026_Khumalo_Draft.pdf', size: '720 KB', path: '/documents/hdr-005/Progress_Report_2025_Dlamini.pdf' }],
        changeNotes: 'Draft conference paper for SAICSIT 2026. Submission deadline: March 15.',
        feedback: [{ id: 'fb-012', reviewerId: 'supervisor-002', reviewerName: 'Dr. James Nkosi', reviewerRole: 'supervisor', recommendation: 'changes_requested', date: ts('2026-02-10'), criteria: { research_quality: 4, academic_writing: 3, methodology: 4, completeness: 3, formatting: 3 }, comments: 'Paper is too long for conference format. Reduce to 8 pages max. Condense the results section and move detailed tables to appendix.' }],
        comments: [
          { id: 'tc-011', authorId: 'supervisor-002', authorName: 'Dr. James Nkosi', authorRole: 'supervisor', text: 'Also check the IEEE format requirements — the margins look off.', date: ts('2026-02-10') },
        ],
      },
    ],
    annotations: [
      { id: 'ann-006', versionId: 'tv-014', documentName: 'SAICSIT_2026_Khumalo_Draft.pdf', authorId: 'supervisor-002', authorName: 'Dr. James Nkosi', authorRole: 'supervisor', page: 2, selectedText: 'our novel approach', comment: 'Avoid using "novel" — let the reviewers decide if it\'s novel. Use "proposed" instead.', color: 'yellow', status: 'active', createdAt: ts('2026-02-10') },
    ],
    rating: { overall: 3.4, criteria: { research_quality: 4, academic_writing: 3, methodology: 4, completeness: 3, formatting: 3 } },
  },
  {
    id: 'thesis-009',
    studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-001', coSupervisorId: null,
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Blockchain-Based Academic Credential Verification Systems',
    submissionType: 'research_proposal',
    chapterTitle: 'Research Proposal – Blockchain Credentials',
    status: 'approved',
    createdAt: ts('2025-06-01'), updatedAt: ts('2025-07-10'),
    currentVersion: 1,
    documents: [
      { name: 'Research_Proposal_Dlamini.pdf', size: '1.2 MB', uploadedAt: ts('2025-06-01'), path: '/documents/hdr-009/Progress_Report_SD_2025.pdf' },
    ],
    versions: [
      {
        id: 'tv-015', version: 1, status: 'approved',
        uploadedAt: ts('2025-06-01'), uploadedBy: 'student-003',
        documents: [{ name: 'Research_Proposal_Dlamini.pdf', size: '1.2 MB', path: '/documents/hdr-009/Progress_Report_SD_2025.pdf' }],
        changeNotes: 'Research proposal for MSc Information Systems thesis on blockchain credential verification.',
        feedback: [{ id: 'fb-013', reviewerId: 'supervisor-001', reviewerName: 'Prof. Sarah van der Berg', reviewerRole: 'supervisor', recommendation: 'approve', date: ts('2025-07-10'), criteria: { research_quality: 4, academic_writing: 4, methodology: 4, completeness: 4, formatting: 4 }, comments: 'Well-structured proposal with clear research questions and feasible methodology. Approved.' }],
        comments: [
          { id: 'tc-012', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', text: 'Good start, Sipho. Consider connecting with the university\'s ICT department for potential implementation partnership.', date: ts('2025-07-10') },
        ],
      },
    ],
    annotations: [],
    rating: { overall: 4.0, criteria: { research_quality: 4, academic_writing: 4, methodology: 4, completeness: 4, formatting: 4 } },
  },
  {
    id: 'thesis-010',
    studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-001', coSupervisorId: null,
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Blockchain-Based Academic Credential Verification Systems',
    submissionType: 'draft_chapter',
    chapterTitle: 'Chapter 2 – Literature Review',
    status: 'feedback_provided',
    createdAt: ts('2025-11-01'), updatedAt: ts('2025-12-15'),
    currentVersion: 1,
    documents: [
      { name: 'Chapter2_LitReview_Dlamini_v1.pdf', size: '1.6 MB', uploadedAt: ts('2025-11-01'), path: '/documents/hdr-009/Progress_Report_SD_2025.pdf' },
    ],
    versions: [
      {
        id: 'tv-016', version: 1, status: 'changes_requested',
        uploadedAt: ts('2025-11-01'), uploadedBy: 'student-003',
        documents: [{ name: 'Chapter2_LitReview_Dlamini_v1.pdf', size: '1.6 MB', path: '/documents/hdr-009/Progress_Report_SD_2025.pdf' }],
        changeNotes: 'First draft covering blockchain fundamentals, credential verification, and South African higher education context.',
        feedback: [{ id: 'fb-014', reviewerId: 'supervisor-001', reviewerName: 'Prof. Sarah van der Berg', reviewerRole: 'supervisor', recommendation: 'changes_requested', date: ts('2025-12-15'), criteria: { research_quality: 3, academic_writing: 3, methodology: 3, completeness: 3, formatting: 3 }, comments: 'Decent start but too much focus on blockchain technology basics. Assume the reader has fundamental knowledge. Expand the section on existing credential verification systems in South African universities.' }],
        comments: [
          { id: 'tc-013', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', text: 'Also, look at the SAQA framework for qualification verification — this is essential context.', date: ts('2025-12-15') },
        ],
      },
    ],
    annotations: [
      { id: 'ann-007', versionId: 'tv-016', documentName: 'Chapter2_LitReview_Dlamini_v1.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 4, selectedText: 'blockchain is a distributed ledger', comment: 'This paragraph reads like a tutorial. Cut it down — your readers will be academics familiar with the basics.', color: 'yellow', status: 'active', createdAt: ts('2025-12-15') },
      { id: 'ann-008', versionId: 'tv-016', documentName: 'Chapter2_LitReview_Dlamini_v1.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 12, selectedText: 'no existing South African studies', comment: 'This is incorrect. See Ngwenya (2023) and van Zyl (2024) for SA-specific work in this area.', color: 'red', status: 'active', createdAt: ts('2025-12-15') },
    ],
    rating: { overall: 3.0, criteria: { research_quality: 3, academic_writing: 3, methodology: 3, completeness: 3, formatting: 3 } },
  },
  {
    id: 'thesis-011',
    studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-001', coSupervisorId: null,
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Blockchain-Based Academic Credential Verification Systems',
    submissionType: 'methodology',
    chapterTitle: 'Chapter 3 – Design Science Methodology',
    status: 'submitted',
    createdAt: ts('2026-02-08'), updatedAt: ts('2026-02-08'),
    currentVersion: 1,
    documents: [
      { name: 'Chapter3_Methodology_Dlamini.pdf', size: '1.1 MB', uploadedAt: ts('2026-02-08'), path: '/documents/hdr-009/Progress_Report_SD_2025.pdf' },
    ],
    versions: [
      {
        id: 'tv-017', version: 1, status: 'submitted',
        uploadedAt: ts('2026-02-08'), uploadedBy: 'student-003',
        documents: [{ name: 'Chapter3_Methodology_Dlamini.pdf', size: '1.1 MB', path: '/documents/hdr-009/Progress_Report_SD_2025.pdf' }],
        changeNotes: 'Methodology chapter using Design Science Research approach with Hevner\'s framework.',
        feedback: [],
        comments: [
          { id: 'tc-014', authorId: 'student-003', authorName: 'Sipho Dlamini', authorRole: 'student', text: 'Prof, I\'ve used the Design Science Research methodology as we discussed. Please review when you have a chance.', date: ts('2026-02-08') },
        ],
      },
    ],
    annotations: [],
    rating: null,
  },
  {
    id: 'thesis-012',
    studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-001', coSupervisorId: null,
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Blockchain-Based Academic Credential Verification Systems',
    submissionType: 'progress_report_doc',
    chapterTitle: 'Progress Report – Q4 2025',
    status: 'approved',
    createdAt: ts('2025-10-01'), updatedAt: ts('2025-10-20'),
    currentVersion: 1,
    documents: [
      { name: 'Progress_Report_Q4_Dlamini.pdf', size: '580 KB', uploadedAt: ts('2025-10-01'), path: '/documents/hdr-009/Progress_Report_SD_2025.pdf' },
    ],
    versions: [
      {
        id: 'tv-018', version: 1, status: 'approved',
        uploadedAt: ts('2025-10-01'), uploadedBy: 'student-003',
        documents: [{ name: 'Progress_Report_Q4_Dlamini.pdf', size: '580 KB', path: '/documents/hdr-009/Progress_Report_SD_2025.pdf' }],
        changeNotes: 'Quarterly progress report detailing research milestones achieved and next steps.',
        feedback: [{ id: 'fb-015', reviewerId: 'supervisor-001', reviewerName: 'Prof. Sarah van der Berg', reviewerRole: 'supervisor', recommendation: 'approve', date: ts('2025-10-20'), criteria: { research_quality: 4, academic_writing: 4, methodology: 4, completeness: 4, formatting: 4 }, comments: 'Good progress. On track with the project timeline.' }],
        comments: [],
      },
    ],
    annotations: [],
    rating: { overall: 4.0, criteria: { research_quality: 4, academic_writing: 4, methodology: 4, completeness: 4, formatting: 4 } },
  },
  {
    id: 'thesis-013',
    studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coSupervisorId: null,
    coordinatorId: 'coordinator-001',
    thesisTitle: 'Machine Learning Applications in Healthcare Diagnostics: A South African Perspective',
    submissionType: 'data_analysis',
    chapterTitle: 'Data Analysis Report – TB Chest X-ray Dataset',
    status: 'submitted',
    createdAt: ts('2026-02-10'), updatedAt: ts('2026-02-10'),
    currentVersion: 1,
    documents: [
      { name: 'Data_Analysis_Report_TB_Molefe.pdf', size: '4.2 MB', uploadedAt: ts('2026-02-10'), path: '/documents/hdr-002/Progress_Report_2025.pdf' },
      { name: 'Statistical_Appendix_Molefe.pdf', size: '1.1 MB', uploadedAt: ts('2026-02-10'), path: '/documents/hdr-002/Publication_Evidence.pdf' },
    ],
    versions: [
      {
        id: 'tv-019', version: 1, status: 'submitted',
        uploadedAt: ts('2026-02-10'), uploadedBy: 'student-001',
        documents: [
          { name: 'Data_Analysis_Report_TB_Molefe.pdf', size: '4.2 MB', path: '/documents/hdr-002/Progress_Report_2025.pdf' },
          { name: 'Statistical_Appendix_Molefe.pdf', size: '1.1 MB', path: '/documents/hdr-002/Publication_Evidence.pdf' },
        ],
        changeNotes: 'Complete data analysis report from TB X-ray classification dataset. Includes confusion matrices, ROC curves, and feature importance analysis.',
        feedback: [],
        comments: [
          { id: 'tc-015', authorId: 'student-001', authorName: 'Thabo Molefe', authorRole: 'student', text: 'Prof, the model achieved 94.2% accuracy on the test set. The full statistical appendix is also attached.', date: ts('2026-02-10') },
        ],
      },
    ],
    annotations: [
      { id: 'ann-019', versionId: 'tv-019', documentName: 'Data_Analysis_Report_TB_Molefe.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 3, selectedText: 'classification accuracy of 94.2%', comment: 'Impressive results. Please also report sensitivity and specificity for the TB class specifically.', color: 'blue', status: 'active', createdAt: ts('2026-02-12') },
      { id: 'ann-020', versionId: 'tv-019', documentName: 'Statistical_Appendix_Molefe.pdf', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor', page: 1, selectedText: 'confusion matrix', comment: 'Label the axes more clearly — include class names not just numbers.', color: 'yellow', status: 'active', createdAt: ts('2026-02-12') },
    ],
    rating: null,
  },
];

/* ── Color name → hex mapping ── */
const COLOR_MAP = {
  yellow: '#ffd43b', green: '#69db7c', blue: '#74c0fc',
  red: '#ffa8a8', pink: '#ffc9c9', orange: '#ffa94d',
};
function mapColor(c) {
  if (!c) return '#ffd43b';
  if (c.startsWith('#')) return c;
  return COLOR_MAP[c.toLowerCase()] || '#ffd43b';
}

/**
 * Extract embedded annotations from thesis submissions and convert them into
 * proper annotation documents for the separate 'annotations' Firestore collection.
 */
function extractAnnotations(submissions) {
  const results = [];
  for (const sub of submissions) {
    if (!Array.isArray(sub.annotations) || sub.annotations.length === 0) continue;
    const versionDocMap = {};
    for (const v of (sub.versions || [])) {
      const docs = v.documents || [];
      if (docs.length > 0) versionDocMap[v.id] = docs[0].name;
    }
    for (const ann of sub.annotations) {
      const documentName = versionDocMap[ann.versionId] || (sub.documents?.[0]?.name) || 'unknown.pdf';
      results.push({
        id: ann.id,
        versionId: ann.versionId,
        requestId: sub.id,
        documentName,
        selectedText: ann.selectedText || '',
        comment: ann.comment || '',
        pageNumber: ann.page || ann.pageNumber || 1,
        authorId: ann.authorId,
        authorName: ann.authorName,
        authorRole: ann.authorRole,
        highlightColor: mapColor(ann.color || ann.highlightColor),
        status: ann.status || 'active',
        resolved: ann.status === 'resolved' || ann.resolved === true,
        replies: ann.replies || [],
        createdAt: ann.createdAt || ts('2026-01-01'),
        updatedAt: ann.updatedAt || ann.createdAt || ts('2026-01-01'),
      });
    }
  }
  return results;
}

const ANNOTATIONS = extractAnnotations(THESIS_SUBMISSIONS);

// ══════════════════════════════════════════════════════════════
// COLLECTION MAP
// ══════════════════════════════════════════════════════════════
const ALL_COLLECTIONS = {
  users:             USERS,
  hdRequests:        HD_REQUESTS,
  calendarEvents:    CALENDAR_EVENTS,
  milestones:        MILESTONES,
  notifications:     NOTIFICATIONS,
  studentProfiles:   STUDENT_PROFILES,
  auditLogs:         AUDIT_LOGS,
  thesisSubmissions: THESIS_SUBMISSIONS,
  annotations:       ANNOTATIONS,
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
    console.warn(`  ⚠ Auth skipped (${err.code || err.message}) — continuing with dev fallback rules\n`);
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
