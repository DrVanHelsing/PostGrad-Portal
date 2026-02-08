/**
 * Firebase Seed Script (Node.js)
 * Creates Auth users and populates Firestore collections.
 * Uses the Firebase client SDK (works in Node.js).
 *
 * Usage:  node scripts/seed-firebase.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocs, collection, writeBatch, Timestamp } from 'firebase/firestore';

// Firebase config (same as src/firebase/config.js)
const firebaseConfig = {
  apiKey: 'AIzaSyBu7YrBJg_eNGqUlXIGCzNltScSQKYLp28',
  authDomain: 'pg-portal1.firebaseapp.com',
  projectId: 'pg-portal1',
  storageBucket: 'pg-portal1.firebasestorage.app',
  messagingSenderId: '757138632732',
  appId: '1:757138632732:web:b564e133fba3a6f8862fd9',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_PASSWORD = 'Portal@2026';

function ts(date) {
  return Timestamp.fromDate(date instanceof Date ? date : new Date(date));
}

// ── Seed Data ──

const SEED_USERS = [
  { id: 'student-001', email: 'student@uwc.ac.za', name: 'Thabo Molefe', role: 'student', studentNumber: '3847291', department: 'Computer Science' },
  { id: 'student-002', email: 'student2@uwc.ac.za', name: 'Naledi Khumalo', role: 'student', studentNumber: '3892456', department: 'Computer Science' },
  { id: 'student-003', email: 'student3@uwc.ac.za', name: 'Sipho Dlamini', role: 'student', studentNumber: '3901234', department: 'Information Systems' },
  { id: 'supervisor-001', email: 'supervisor@uwc.ac.za', name: 'Prof. Sarah van der Berg', role: 'supervisor', department: 'Computer Science' },
  { id: 'supervisor-002', email: 'supervisor2@uwc.ac.za', name: 'Dr. James Nkosi', role: 'supervisor', department: 'Computer Science' },
  { id: 'coordinator-001', email: 'coordinator@uwc.ac.za', name: 'Dr. Fatima Patel', role: 'coordinator', department: 'Faculty of Natural Sciences' },
  { id: 'admin-001', email: 'admin@uwc.ac.za', name: 'Linda Mkhize', role: 'admin', department: 'Postgraduate Administration' },
];

const SEED_HD_REQUESTS = [
  {
    id: 'hdr-001', type: 'title_registration',
    title: 'PhD Title Registration – Machine Learning in Healthcare',
    status: 'supervisor_review', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-01-15'), updatedAt: ts('2026-02-01'),
    currentOwner: 'supervisor-001',
    accessCode: 'ABC123', accessCodeExpiry: ts('2026-02-10'),
    description: 'Application for PhD title registration in the field of machine learning applications for healthcare diagnostics.',
    documents: [{ name: 'Research_Proposal_v2.pdf', size: '2.4 MB', uploadedAt: ts('2026-01-15') }],
    versions: [
      { version: 1, date: ts('2026-01-15'), action: 'Created', by: 'student-001' },
      { version: 2, date: ts('2026-01-28'), action: 'Submitted to supervisor', by: 'student-001' },
    ],
    signatures: [],
    timerStart: ts('2026-02-01'), timerHours: 48,
  },
  {
    id: 'hdr-002', type: 'progress_report',
    title: 'Annual Progress Report 2025',
    status: 'approved', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2025-11-01'), updatedAt: ts('2025-12-15'),
    currentOwner: 'coordinator-001',
    fhdOutcome: 'approved', shdOutcome: 'approved', referenceNumber: 'FHD/2025/0234',
    description: 'Annual academic progress report for the 2025 academic year.',
    documents: [
      { name: 'Progress_Report_2025.pdf', size: '1.8 MB', uploadedAt: ts('2025-11-01') },
      { name: 'Supervisor_Feedback.pdf', size: '340 KB', uploadedAt: ts('2025-11-15') },
    ],
    versions: [
      { version: 1, date: ts('2025-11-01'), action: 'Created', by: 'student-001' },
      { version: 2, date: ts('2025-11-10'), action: 'Submitted to supervisor', by: 'student-001' },
      { version: 3, date: ts('2025-11-15'), action: 'Supervisor approved', by: 'supervisor-001' },
      { version: 4, date: ts('2025-12-01'), action: 'Faculty Board approved', by: 'coordinator-001' },
      { version: 5, date: ts('2025-12-15'), action: 'Senate Board approved', by: 'admin-001' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-001', name: 'Prof. Sarah van der Berg', date: ts('2025-11-15') },
      { role: 'coordinator', userId: 'coordinator-001', name: 'Dr. Fatima Patel', date: ts('2025-12-01') },
    ],
  },
  {
    id: 'hdr-003', type: 'extension',
    title: 'Request for 6-month Extension',
    status: 'draft', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-02-05'), updatedAt: ts('2026-02-05'),
    currentOwner: 'student-001',
    description: 'Extension request due to delays in data collection from partner hospitals.',
    documents: [], versions: [
      { version: 1, date: ts('2026-02-05'), action: 'Created', by: 'student-001' },
    ], signatures: [],
  },
  {
    id: 'hdr-004', type: 'registration',
    title: 'Masters Registration – Data Science',
    status: 'coordinator_review', studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coSupervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-01-20'), updatedAt: ts('2026-02-03'),
    currentOwner: 'coordinator-001',
    description: 'Initial registration application for MSc Data Science programme.',
    documents: [{ name: 'Registration_Form.pdf', size: '1.1 MB', uploadedAt: ts('2026-01-20') }],
    versions: [
      { version: 1, date: ts('2026-01-20'), action: 'Created', by: 'student-002' },
      { version: 2, date: ts('2026-01-25'), action: 'Submitted to supervisor', by: 'student-002' },
      { version: 3, date: ts('2026-01-30'), action: 'Supervisor approved', by: 'supervisor-002' },
      { version: 4, date: ts('2026-02-01'), action: 'Co-supervisor signed', by: 'supervisor-001' },
      { version: 5, date: ts('2026-02-03'), action: 'Forwarded to coordinator', by: 'supervisor-002' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-002', name: 'Dr. James Nkosi', date: ts('2026-01-30') },
      { role: 'co-supervisor', userId: 'supervisor-001', name: 'Prof. Sarah van der Berg', date: ts('2026-02-01') },
    ],
  },
  {
    id: 'hdr-005', type: 'examination_entry',
    title: 'Thesis Examination Entry',
    status: 'fhd_pending', studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-01-10'), updatedAt: ts('2026-02-01'),
    currentOwner: 'coordinator-001',
    description: 'Submission of thesis for examination and appointment of external examiners.',
    documents: [{ name: 'Thesis_Final.pdf', size: '8.2 MB', uploadedAt: ts('2026-01-10') }],
    versions: [
      { version: 1, date: ts('2026-01-10'), action: 'Created', by: 'student-002' },
      { version: 2, date: ts('2026-01-18'), action: 'Submitted to supervisor', by: 'student-002' },
      { version: 3, date: ts('2026-01-25'), action: 'Supervisor approved', by: 'supervisor-002' },
      { version: 4, date: ts('2026-02-01'), action: 'Coordinator forwarded to Faculty Board', by: 'coordinator-001' },
    ],
    signatures: [
      { role: 'supervisor', userId: 'supervisor-002', name: 'Dr. James Nkosi', date: ts('2026-01-25') },
      { role: 'coordinator', userId: 'coordinator-001', name: 'Dr. Fatima Patel', date: ts('2026-02-01') },
    ],
  },
  {
    id: 'hdr-006', type: 'leave_of_absence',
    title: 'Leave of Absence – Medical Reasons',
    status: 'submitted_to_supervisor', studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-02-10'), updatedAt: ts('2026-02-10'),
    currentOwner: 'supervisor-001',
    accessCode: 'XYZ789', accessCodeExpiry: ts('2026-02-13'),
    description: 'Request for a semester of leave due to medical reasons. Supporting documentation attached.',
    documents: [{ name: 'Medical_Certificate.pdf', size: '520 KB', uploadedAt: ts('2026-02-10') }],
    versions: [
      { version: 1, date: ts('2026-02-10'), action: 'Created and submitted', by: 'student-003' },
    ],
    signatures: [],
    timerStart: ts('2026-02-10'), timerHours: 48,
  },
  {
    id: 'hdr-007', type: 'supervisor_change',
    title: 'Change of Supervisor Request',
    status: 'referred_back', studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-002', coordinatorId: 'coordinator-001',
    createdAt: ts('2025-10-01'), updatedAt: ts('2025-11-20'),
    currentOwner: 'student-003',
    description: 'Request to change primary supervisor. Referred back for additional motivation.',
    notes: 'Please provide a more detailed motivation for the supervisor change, including consultation with both current and proposed supervisors.',
    referredBackReason: 'Insufficient motivation provided. Please include written statements from both current and proposed supervisors.',
    referredBackBy: 'coordinator-001',
    referredBackDate: ts('2025-11-20'),
    documents: [], versions: [
      { version: 1, date: ts('2025-10-01'), action: 'Created', by: 'student-003' },
      { version: 2, date: ts('2025-10-15'), action: 'Supervisor approved', by: 'supervisor-002' },
      { version: 3, date: ts('2025-11-20'), action: 'Referred back by coordinator', by: 'coordinator-001' },
    ],
    signatures: [],
  },
];

const SEED_CALENDAR_EVENTS = [
  { id: 'evt-001', title: 'Faculty Board Meeting', date: ts('2026-02-15'), time: '10:00', type: 'meeting', scope: 'faculty', description: 'Faculty Higher Degrees Committee meeting', createdBy: 'coordinator-001' },
  { id: 'evt-002', title: 'Progress Report Deadline', date: ts('2026-03-01'), time: '17:00', type: 'deadline', scope: 'all', description: 'Annual progress reports due for all registered postgraduate students', createdBy: 'admin-001' },
  { id: 'evt-003', title: 'Senate Board Meeting', date: ts('2026-02-25'), time: '14:00', type: 'meeting', scope: 'all', description: 'Senate Higher Degrees Committee meeting', createdBy: 'admin-001' },
  { id: 'evt-004', title: 'Research Methodology Workshop', date: ts('2026-02-20'), time: '09:00', type: 'event', scope: 'faculty', description: 'Workshop on advanced research methodologies for postgraduate students', createdBy: 'coordinator-001' },
  { id: 'evt-005', title: 'Registration Deadline', date: ts('2026-02-28'), time: '23:59', type: 'deadline', scope: 'all', description: 'Final deadline for 2026 registrations', createdBy: 'admin-001' },
  { id: 'evt-006', title: 'Departmental Seminar', date: ts('2026-03-05'), time: '11:00', type: 'event', scope: 'department', description: 'Monthly research seminar series – guest speaker from UCT', createdBy: 'coordinator-001' },
  { id: 'evt-007', title: 'Ethics Committee Meeting', date: ts('2026-03-10'), time: '13:00', type: 'meeting', scope: 'faculty', description: 'Ethics review meeting for pending research proposals', createdBy: 'coordinator-001' },
];

const SEED_MILESTONES = [
  { id: 'ms-001', studentId: 'student-001', title: 'SAICSIT Conference Presentation', type: 'conference', date: ts('2025-10-15'), description: 'Presented paper on ML in healthcare diagnostics' },
  { id: 'ms-002', studentId: 'student-001', title: 'Python for Data Science Workshop', type: 'workshop', date: ts('2025-08-20'), description: 'Completed 3-day intensive workshop' },
  { id: 'ms-003', studentId: 'student-001', title: 'Department Journal Club', type: 'journal_club', date: ts('2026-01-25'), description: 'Led discussion on recent Nature paper' },
  { id: 'ms-004', studentId: 'student-002', title: 'Journal Publication Accepted', type: 'publication', date: ts('2025-12-01'), description: 'Paper accepted in SA Journal of Computer Science' },
  { id: 'ms-005', studentId: 'student-002', title: 'Data Ethics Training', type: 'training', date: ts('2025-09-10'), description: 'Completed online training in research data ethics' },
];

const SEED_NOTIFICATIONS = [
  { id: 'notif-001', userId: 'student-001', title: 'Request Under Review', message: 'Your title registration request is being reviewed by Prof. van der Berg', type: 'info', read: false, createdAt: ts('2026-02-01'), link: '/requests' },
  { id: 'notif-002', userId: 'student-001', title: 'Upcoming Deadline', message: 'Progress Report deadline is in 3 weeks', type: 'warning', read: false, createdAt: ts('2026-02-05'), link: '/calendar' },
  { id: 'notif-003', userId: 'supervisor-001', title: 'New Request for Review', message: 'Thabo Molefe has submitted a title registration for your review', type: 'info', read: false, createdAt: ts('2026-02-01'), link: '/requests' },
  { id: 'notif-004', userId: 'supervisor-001', title: 'Leave Request Submitted', message: 'Sipho Dlamini has submitted a leave of absence request', type: 'info', read: true, createdAt: ts('2026-02-10'), link: '/requests' },
  { id: 'notif-005', userId: 'coordinator-001', title: 'Request Awaiting Committee', message: 'Thesis examination entry from Naledi Khumalo is ready for the Faculty Board', type: 'warning', read: false, createdAt: ts('2026-02-02'), link: '/requests' },
  { id: 'notif-006', userId: 'coordinator-001', title: 'New Request for Review', message: 'Masters registration from Naledi Khumalo requires coordinator review', type: 'info', read: false, createdAt: ts('2026-02-03'), link: '/requests' },
  { id: 'notif-007', userId: 'admin-001', title: 'System Report Generated', message: 'Monthly system usage report is ready for download', type: 'success', read: true, createdAt: ts('2026-02-01') },
  { id: 'notif-008', userId: 'admin-001', title: 'New User Registration', message: '3 new student accounts pending approval', type: 'info', read: false, createdAt: ts('2026-02-06') },
];

const SEED_STUDENT_PROFILES = [
  {
    id: 'sp-001', userId: 'student-001', studentNumber: '3847291', programme: 'PhD Computer Science', degree: 'Doctor of Philosophy',
    faculty: 'Natural Sciences', department: 'Computer Science', registrationDate: ts('2023-02-01'),
    expectedCompletion: ts('2026-12-31'), yearsRegistered: 3, supervisorId: 'supervisor-001',
    thesisTitle: 'Machine Learning Applications in Healthcare Diagnostics', status: 'active',
    supervisorHistory: [
      { supervisorId: 'supervisor-001', name: 'Prof. Sarah van der Berg', role: 'primary', from: ts('2023-02-01'), to: null },
    ],
  },
  {
    id: 'sp-002', userId: 'student-002', studentNumber: '3892456', programme: 'MSc Data Science', degree: 'Master of Science',
    faculty: 'Natural Sciences', department: 'Computer Science', registrationDate: ts('2024-02-01'),
    expectedCompletion: ts('2026-06-30'), yearsRegistered: 2, supervisorId: 'supervisor-002', coSupervisorId: 'supervisor-001',
    thesisTitle: 'Predictive Analytics for Urban Planning', status: 'active',
    supervisorHistory: [
      { supervisorId: 'supervisor-002', name: 'Dr. James Nkosi', role: 'primary', from: ts('2024-02-01'), to: null },
      { supervisorId: 'supervisor-001', name: 'Prof. Sarah van der Berg', role: 'co-supervisor', from: ts('2024-06-01'), to: null },
    ],
  },
  {
    id: 'sp-003', userId: 'student-003', studentNumber: '3901234', programme: 'MSc Information Systems', degree: 'Master of Science',
    faculty: 'Natural Sciences', department: 'Information Systems', registrationDate: ts('2025-02-01'),
    expectedCompletion: ts('2027-06-30'), yearsRegistered: 1, supervisorId: 'supervisor-001',
    thesisTitle: 'Blockchain-based Academic Credential Verification', status: 'active',
    supervisorHistory: [
      { supervisorId: 'supervisor-001', name: 'Prof. Sarah van der Berg', role: 'primary', from: ts('2025-02-01'), to: null },
    ],
  },
];

const SEED_AUDIT_LOGS = [
  { id: 'audit-001', timestamp: ts('2026-02-10T09:15:00'), userId: 'student-003', userName: 'Sipho Dlamini', action: 'Submitted Request', entityType: 'HDRequest', entityId: 'hdr-006', details: 'Submitted leave of absence request to supervisor' },
  { id: 'audit-002', timestamp: ts('2026-02-05T10:30:00'), userId: 'student-001', userName: 'Thabo Molefe', action: 'Created Request', entityType: 'HDRequest', entityId: 'hdr-003', details: 'Created extension request – draft saved' },
  { id: 'audit-003', timestamp: ts('2026-02-03T11:00:00'), userId: 'coordinator-001', userName: 'Dr. Fatima Patel', action: 'Advanced Request', entityType: 'HDRequest', entityId: 'hdr-004', details: 'Moved registration to coordinator review stage' },
  { id: 'audit-004', timestamp: ts('2026-02-01T14:15:00'), userId: 'student-001', userName: 'Thabo Molefe', action: 'Submitted Request', entityType: 'HDRequest', entityId: 'hdr-001', details: 'Submitted title registration to supervisor with access code generated' },
  { id: 'audit-005', timestamp: ts('2026-02-01T16:00:00'), userId: 'supervisor-001', userName: 'Prof. Sarah van der Berg', action: 'Opened Request', entityType: 'HDRequest', entityId: 'hdr-001', details: 'Validated access code and opened request for review' },
  { id: 'audit-006', timestamp: ts('2026-01-20T08:45:00'), userId: 'student-002', userName: 'Naledi Khumalo', action: 'Created Request', entityType: 'HDRequest', entityId: 'hdr-004', details: 'Created masters registration application' },
  { id: 'audit-007', timestamp: ts('2025-12-15T13:30:00'), userId: 'admin-001', userName: 'Linda Mkhize', action: 'Final Approval', entityType: 'HDRequest', entityId: 'hdr-002', details: 'Progress report received Senate Board approval – marked as approved' },
  { id: 'audit-008', timestamp: ts('2025-11-20T10:00:00'), userId: 'coordinator-001', userName: 'Dr. Fatima Patel', action: 'Referred Back', entityType: 'HDRequest', entityId: 'hdr-007', details: 'Supervisor change request referred back – additional motivation required' },
];

const COLLECTIONS = {
  USERS: 'users',
  HD_REQUESTS: 'hdRequests',
  CALENDAR_EVENTS: 'calendarEvents',
  MILESTONES: 'milestones',
  NOTIFICATIONS: 'notifications',
  STUDENT_PROFILES: 'studentProfiles',
  AUDIT_LOGS: 'auditLogs',
};

// ── Functions ──

async function checkCollectionCount(colName) {
  const snap = await getDocs(collection(db, colName));
  return snap.size;
}

async function seedCollection(name, items) {
  const batch = writeBatch(db);
  for (const item of items) {
    const { id, ...data } = item;
    batch.set(doc(db, name, id), data);
  }
  await batch.commit();
  console.log(`  ✓ Seeded ${items.length} docs → ${name}`);
}

async function createAuthUsers() {
  let created = 0;
  let skipped = 0;
  for (const u of SEED_USERS) {
    try {
      await createUserWithEmailAndPassword(auth, u.email, DEFAULT_PASSWORD);
      created++;
      console.log(`  ✓ Created auth user: ${u.email}`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        skipped++;
        console.log(`  – Skipped (exists): ${u.email}`);
      } else {
        console.error(`  ✗ Auth error for ${u.email}: ${err.message}`);
      }
    }
  }
  console.log(`  Auth users: ${created} created, ${skipped} already existed`);
}

// ── Main ──

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Seed Firebase – PostGrad Portal              ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Step 1: Check existing data
  console.log('[1/3] Checking existing Firestore data...');
  let totalDocs = 0;
  for (const [key, colName] of Object.entries(COLLECTIONS)) {
    const count = await checkCollectionCount(colName);
    console.log(`  ${colName}: ${count} documents`);
    totalDocs += count;
  }

  if (totalDocs > 0) {
    console.log(`\n⚠ Database already has ${totalDocs} documents. Aborting seed to prevent duplicates.`);
    console.log('  To re-seed, delete all collections in Firebase Console first.\n');
    process.exit(0);
  }
  console.log('  ✓ Database is empty\n');

  // Step 2: Create Auth users
  console.log('[2/3] Creating Firebase Auth users...');
  await createAuthUsers();
  console.log('');

  // Step 3: Seed Firestore collections
  console.log('[3/3] Seeding Firestore collections...');
  await seedCollection(COLLECTIONS.USERS, SEED_USERS);
  await seedCollection(COLLECTIONS.HD_REQUESTS, SEED_HD_REQUESTS);
  await seedCollection(COLLECTIONS.CALENDAR_EVENTS, SEED_CALENDAR_EVENTS);
  await seedCollection(COLLECTIONS.MILESTONES, SEED_MILESTONES);
  await seedCollection(COLLECTIONS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  await seedCollection(COLLECTIONS.STUDENT_PROFILES, SEED_STUDENT_PROFILES);
  await seedCollection(COLLECTIONS.AUDIT_LOGS, SEED_AUDIT_LOGS);

  console.log('\n✅ Seed complete!');
  console.log('  All demo accounts use password: Portal@2026');
  console.log('  Login emails:');
  SEED_USERS.forEach(u => console.log(`    ${u.email} (${u.role})`));
  console.log('');

  process.exit(0);
}

main().catch(err => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
