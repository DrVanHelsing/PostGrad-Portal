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
  apiKey: 'AIzaSyBCy59swYINVaEgfPy2XqP6U5nLs8qbadY',
  authDomain: 'postgrad-portal.firebaseapp.com',
  projectId: 'postgrad-portal',
  storageBucket: 'postgrad-portal.firebasestorage.app',
  messagingSenderId: '1074199423382',
  appId: '1:1074199423382:web:1a93b580f2c268dfd955b7',
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
  { id: 'student-001', email: 'student@uwc.ac.za', name: 'Thabo Molefe', role: 'student', studentNumber: '3847291', department: 'Computer Science', localPassword: DEFAULT_PASSWORD },
  { id: 'student-002', email: 'student2@uwc.ac.za', name: 'Naledi Khumalo', role: 'student', studentNumber: '3892456', department: 'Computer Science', localPassword: DEFAULT_PASSWORD },
  { id: 'student-003', email: 'student3@uwc.ac.za', name: 'Sipho Dlamini', role: 'student', studentNumber: '3901234', department: 'Information Systems', localPassword: DEFAULT_PASSWORD },
  { id: 'supervisor-001', email: 'supervisor@uwc.ac.za', name: 'Prof. Sarah van der Berg', role: 'supervisor', department: 'Computer Science', localPassword: DEFAULT_PASSWORD },
  { id: 'supervisor-002', email: 'supervisor2@uwc.ac.za', name: 'Dr. James Nkosi', role: 'supervisor', department: 'Computer Science', localPassword: DEFAULT_PASSWORD },
  { id: 'coordinator-001', email: 'coordinator@uwc.ac.za', name: 'Dr. Fatima Patel', role: 'coordinator', department: 'Faculty of Natural Sciences', localPassword: DEFAULT_PASSWORD },
  { id: 'admin-001', email: 'admin@uwc.ac.za', name: 'Linda Mkhize', role: 'admin', department: 'Postgraduate Administration', localPassword: DEFAULT_PASSWORD },
];

const SEED_HD_REQUESTS = [
  {
    id: 'hdr-001', type: 'title_registration',
    title: 'Title Registration – Machine Learning in Healthcare',
    status: 'supervisor_review', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-01-15'), updatedAt: ts('2026-02-01'),
    currentOwner: 'supervisor-001',
    accessCode: 'ABC123', accessCodeExpiry: ts('2026-02-10'),
    description: 'Title registration for PhD research in machine learning applications for healthcare diagnostics.',
    formSubmissionId: 'fs-001',
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
    title: 'Progress Report – Thabo Molefe',
    status: 'approved', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2025-11-01'), updatedAt: ts('2025-12-15'),
    currentOwner: 'coordinator-001',
    fhdOutcome: 'approved', shdOutcome: 'approved', referenceNumber: 'FHD/2025/0234',
    description: 'Annual academic progress report for the 2025 academic year.',
    formSubmissionId: 'fs-002',
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
    id: 'hdr-003', type: 'leave_of_absence',
    title: 'Leave of Absence – Thabo Molefe',
    status: 'draft', studentId: 'student-001', studentName: 'Thabo Molefe',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-02-05'), updatedAt: ts('2026-02-05'),
    currentOwner: 'student-001',
    description: 'Request for leave of absence due to personal reasons. Draft in progress.',
    formSubmissionId: 'fs-003',
    documents: [], versions: [
      { version: 1, date: ts('2026-02-05'), action: 'Created', by: 'student-001' },
    ], signatures: [],
  },
  {
    id: 'hdr-004', type: 'intention_to_submit',
    title: 'Intention to Submit – Naledi Khumalo',
    status: 'coordinator_review', studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coSupervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-01-20'), updatedAt: ts('2026-02-03'),
    currentOwner: 'coordinator-001',
    description: 'Notification of intention to submit thesis for examination within the next 3 months.',
    formSubmissionId: 'fs-004',
    documents: [],
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
    id: 'hdr-005', type: 'appointment_of_examiners',
    title: 'Appointment of Examiners – Naledi Khumalo',
    status: 'fhd_pending', studentId: 'student-002', studentName: 'Naledi Khumalo',
    supervisorId: 'supervisor-002', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-01-10'), updatedAt: ts('2026-02-01'),
    currentOwner: 'coordinator-001',
    description: 'Nomination of external and internal examiners for MSc thesis examination.',
    formSubmissionId: 'fs-005',
    documents: [{ name: 'Examiner_CVs.pdf', size: '3.2 MB', uploadedAt: ts('2026-01-10') }],
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
    id: 'hdr-006', type: 'change_of_thesis_title',
    title: 'Change of Thesis Title – Sipho Dlamini',
    status: 'submitted_to_supervisor', studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-001', coordinatorId: 'coordinator-001',
    createdAt: ts('2026-02-10'), updatedAt: ts('2026-02-10'),
    currentOwner: 'supervisor-001',
    accessCode: 'XYZ789', accessCodeExpiry: ts('2026-02-13'),
    description: 'Request to change thesis title to better reflect refined research scope.',
    formSubmissionId: 'fs-006',
    documents: [],
    versions: [
      { version: 1, date: ts('2026-02-10'), action: 'Created and submitted', by: 'student-003' },
    ],
    signatures: [],
    timerStart: ts('2026-02-10'), timerHours: 48,
  },
  {
    id: 'hdr-007', type: 'change_of_supervisor',
    title: 'Change of Supervisor – Sipho Dlamini',
    status: 'referred_back', studentId: 'student-003', studentName: 'Sipho Dlamini',
    supervisorId: 'supervisor-002', coordinatorId: 'coordinator-001',
    createdAt: ts('2025-10-01'), updatedAt: ts('2025-11-20'),
    currentOwner: 'student-003',
    description: 'Request to change primary supervisor. Referred back for additional motivation.',
    formSubmissionId: 'fs-007',
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

// ── Form Submissions – prefilled form data linked to HD Requests ──
const SEED_FORM_SUBMISSIONS = [
  {
    id: 'fs-001',
    templateId: 'title_registration',
    templateName: 'Title Registration',
    initiatorId: 'student-001',
    initiatorName: 'Thabo Molefe',
    studentId: 'student-001',
    linkedRequestId: 'hdr-001',
    status: 'submitted',
    createdAt: ts('2026-01-15'),
    updatedAt: ts('2026-02-01'),
    data: {
      student_number: '3847291',
      surname: 'Molefe',
      first_names: 'Thabo',
      degree: 'Doctor of Philosophy',
      programme: 'PhD Computer Science',
      proposed_title: 'Machine Learning Applications in Healthcare Diagnostics: A South African Perspective',
      keywords: ['machine learning', 'healthcare', 'diagnostics', 'deep learning', 'South Africa'],
      research_description: 'This research investigates the application of machine learning algorithms, particularly deep learning architectures, for improving healthcare diagnostic accuracy in resource-constrained settings in South Africa. The study will focus on developing models for early detection of tuberculosis and HIV-related conditions using medical imaging data from partner hospitals in the Western Cape. The methodology combines transfer learning with locally collected datasets to ensure models are calibrated for the local population. Expected outputs include a validated diagnostic tool and peer-reviewed publications.',
      student_date: '2026-01-15',
    },
    sectionStatuses: {
      student_details: 'completed',
      research_details: 'completed',
      supervisor_review: 'in_progress',
    },
    signatures: {},
  },
  {
    id: 'fs-002',
    templateId: 'progress_report',
    templateName: 'Progress Report',
    initiatorId: 'student-001',
    initiatorName: 'Thabo Molefe',
    studentId: 'student-001',
    linkedRequestId: 'hdr-002',
    status: 'approved',
    createdAt: ts('2025-11-01'),
    updatedAt: ts('2025-12-15'),
    data: {
      student_number: '3847291',
      surname: 'Molefe',
      first_names: 'Thabo',
      degree: 'Doctor of Philosophy',
      programme: 'PhD Computer Science',
      reporting_period: '2025-01-01 to 2025-10-31',
      research_progress_summary: 'Completed literature review of 127 papers on ML in healthcare. Collected dataset of 15,000 chest X-ray images from Tygerberg Hospital. Trained initial CNN model achieving 89.3% accuracy on TB detection. Presented preliminary results at SAICSIT 2025 conference. One journal paper submitted to SA Journal of Science.',
      milestones_achieved: 'Literature review complete; dataset collection complete; baseline model trained; conference paper presented; journal paper submitted.',
      challenges_encountered: 'Data collection from partner hospitals was delayed by 2 months due to ethics approval processes. GPU compute resources were limited, requiring cloud computing budget extension.',
      planned_activities: 'Refine model architecture using attention mechanisms. Collect additional data from Groote Schuur Hospital. Write second journal paper. Complete chapters 3 and 4 of thesis.',
      publications: 'Molefe, T. & van der Berg, S. (2025). Preliminary Results on ML-based TB Detection. Proc. SAICSIT 2025.',
      sup_recommendation: 'supported',
      sup_comments: 'Mr. Molefe has made excellent progress this year. The research is on track for timely completion. The conference presentation was well-received.',
      sup_name: 'Prof. Sarah van der Berg',
      sup_date: '2025-11-15',
      coord_recommendation: 'supported',
      coord_comments: 'Strong progress report. Student is meeting all milestones.',
      coord_name: 'Dr. Fatima Patel',
      coord_date: '2025-12-01',
    },
    sectionStatuses: {
      student_details: 'completed',
      progress_summary: 'completed',
      supervisor_review: 'completed',
      coordinator_review: 'completed',
    },
    signatures: {
      supervisor_review: { name: 'Prof. Sarah van der Berg', date: '2025-11-15' },
      coordinator_review: { name: 'Dr. Fatima Patel', date: '2025-12-01' },
    },
  },
  {
    id: 'fs-003',
    templateId: 'leave_of_absence',
    templateName: 'Leave of Absence',
    initiatorId: 'student-001',
    initiatorName: 'Thabo Molefe',
    studentId: 'student-001',
    linkedRequestId: 'hdr-003',
    status: 'draft',
    createdAt: ts('2026-02-05'),
    updatedAt: ts('2026-02-05'),
    data: {
      student_number: '3847291',
      surname: 'Molefe',
      first_names: 'Thabo',
      degree: 'Doctor of Philosophy',
      programme: 'PhD Computer Science',
      leave_type: 'personal',
      leave_start: '2026-04-01',
      leave_end: '2026-06-30',
      reason_for_leave: 'Need to attend to family matters that require my presence in Limpopo for an extended period. I have discussed this with my supervisor and we have agreed on a plan to continue minimal research activities remotely during this period.',
      impact_on_studies: 'The leave period falls during a planned data analysis phase. I have arranged to complete the bulk of data collection before departure and will work on analysis remotely where possible.',
    },
    sectionStatuses: {
      student_details: 'completed',
      leave_details: 'in_progress',
    },
    signatures: {},
  },
  {
    id: 'fs-004',
    templateId: 'intention_to_submit',
    templateName: 'Intention to Submit',
    initiatorId: 'student-002',
    initiatorName: 'Naledi Khumalo',
    studentId: 'student-002',
    linkedRequestId: 'hdr-004',
    status: 'submitted',
    createdAt: ts('2026-01-20'),
    updatedAt: ts('2026-02-03'),
    data: {
      student_number: '3892456',
      surname: 'Khumalo',
      first_names: 'Naledi',
      degree: 'Master of Science',
      programme: 'MSc Data Science',
      thesis_title: 'Predictive Analytics for Urban Planning in South African Municipalities',
      intended_submission_date: '2026-05-15',
      thesis_type: 'dissertation',
      word_count_estimate: '45000',
      confirmation_statement: 'I confirm that I intend to submit my thesis/dissertation for examination within the next 3 months and that all required coursework has been completed.',
      sup_recommendation: 'supported',
      sup_comments: 'Ms. Khumalo has made excellent progress and is well on track for submission by the intended date. All chapters are in advanced draft form.',
      sup_name: 'Dr. James Nkosi',
      sup_date: '2026-01-30',
    },
    sectionStatuses: {
      student_details: 'completed',
      submission_details: 'completed',
      supervisor_review: 'completed',
      coordinator_review: 'in_progress',
    },
    signatures: {
      submission_details: { name: 'Naledi Khumalo', date: '2026-01-20' },
      supervisor_review: { name: 'Dr. James Nkosi', date: '2026-01-30' },
    },
  },
  {
    id: 'fs-005',
    templateId: 'appointment_of_examiners',
    templateName: 'Appointment of Examiners',
    initiatorId: 'student-002',
    initiatorName: 'Naledi Khumalo',
    studentId: 'student-002',
    linkedRequestId: 'hdr-005',
    status: 'submitted',
    createdAt: ts('2026-01-10'),
    updatedAt: ts('2026-02-01'),
    data: {
      student_number: '3892456',
      surname: 'Khumalo',
      first_names: 'Naledi',
      degree: 'Master of Science',
      programme: 'MSc Data Science',
      thesis_title: 'Predictive Analytics for Urban Planning in South African Municipalities',
      external_examiner_1_name: 'Prof. David Osei',
      external_examiner_1_institution: 'University of Cape Town',
      external_examiner_1_department: 'School of IT',
      external_examiner_1_email: 'd.osei@uct.ac.za',
      external_examiner_1_expertise: 'Data Science, Urban Computing, Geospatial Analysis',
      internal_examiner_name: 'Dr. Andile Mthembu',
      internal_examiner_department: 'Information Systems',
      internal_examiner_email: 'a.mthembu@uwc.ac.za',
      internal_examiner_expertise: 'Machine Learning, Statistical Modelling',
      sup_recommendation: 'supported',
      sup_comments: 'Both proposed examiners are well-qualified. Prof. Osei has published extensively in the field of urban data analytics.',
      sup_name: 'Dr. James Nkosi',
      sup_date: '2026-01-25',
      coord_recommendation: 'supported',
      coord_comments: 'Examiner nominations are appropriate. Forwarded to Faculty Board for approval.',
      coord_name: 'Dr. Fatima Patel',
      coord_date: '2026-02-01',
    },
    sectionStatuses: {
      student_details: 'completed',
      examiner_nominations: 'completed',
      supervisor_review: 'completed',
      coordinator_review: 'completed',
    },
    signatures: {
      supervisor_review: { name: 'Dr. James Nkosi', date: '2026-01-25' },
      coordinator_review: { name: 'Dr. Fatima Patel', date: '2026-02-01' },
    },
  },
  {
    id: 'fs-006',
    templateId: 'change_of_thesis_title',
    templateName: 'Change of Thesis Title',
    initiatorId: 'student-003',
    initiatorName: 'Sipho Dlamini',
    studentId: 'student-003',
    linkedRequestId: 'hdr-006',
    status: 'submitted',
    createdAt: ts('2026-02-10'),
    updatedAt: ts('2026-02-10'),
    data: {
      student_number: '3901234',
      surname: 'Dlamini',
      first_names: 'Sipho',
      degree: 'Master of Science',
      programme: 'MSc Information Systems',
      current_title: 'Blockchain-based Academic Credential Verification',
      proposed_title: 'Decentralized Identity and Credential Verification Using Distributed Ledger Technology in South African Higher Education',
      reason_for_change: 'After completing my literature review and initial research, my focus has broadened to include decentralized identity systems beyond blockchain specifically. The new title better reflects the scope of the research including newer DLT approaches such as Directed Acyclic Graphs (DAGs) and the specific application context of South African higher education institutions.',
      student_date: '2026-02-10',
    },
    sectionStatuses: {
      student_details: 'completed',
      title_change_details: 'completed',
      supervisor_review: 'pending',
    },
    signatures: {
      title_change_details: { name: 'Sipho Dlamini', date: '2026-02-10' },
    },
  },
  {
    id: 'fs-007',
    templateId: 'change_of_supervisor',
    templateName: 'Change of Supervisor',
    initiatorId: 'student-003',
    initiatorName: 'Sipho Dlamini',
    studentId: 'student-003',
    linkedRequestId: 'hdr-007',
    status: 'referred_back',
    createdAt: ts('2025-10-01'),
    updatedAt: ts('2025-11-20'),
    data: {
      student_number: '3901234',
      surname: 'Dlamini',
      first_names: 'Sipho',
      degree: 'Master of Science',
      programme: 'MSc Information Systems',
      current_supervisor: 'Dr. James Nkosi',
      proposed_supervisor: 'Prof. Sarah van der Berg',
      reason_for_change: 'Dr. Nkosi is relocating to another institution and will not be available to continue supervision from 2026.',
      student_date: '2025-10-01',
    },
    sectionStatuses: {
      student_details: 'completed',
      change_details: 'completed',
      supervisor_review: 'completed',
      coordinator_review: 'referred_back',
    },
    signatures: {
      change_details: { name: 'Sipho Dlamini', date: '2025-10-01' },
      supervisor_review: { name: 'Dr. James Nkosi', date: '2025-10-15' },
    },
  },
];

// ── Thesis Submissions – separate entity for thesis workflow ──
const SEED_THESIS_SUBMISSIONS = [
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
  // ── NEW: Varied submission types for broader submissions page ──
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
  // ── Student 3 (Sipho) submissions ──
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
  FORM_SUBMISSIONS: 'formSubmissions',
  THESIS_SUBMISSIONS: 'thesisSubmissions',
  CALENDAR_EVENTS: 'calendarEvents',
  MILESTONES: 'milestones',
  NOTIFICATIONS: 'notifications',
  STUDENT_PROFILES: 'studentProfiles',
  AUDIT_LOGS: 'auditLogs',
  ANNOTATIONS: 'annotations',
};

// ── Functions ──

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
 * Extract embedded annotations from thesis submissions and
 * convert them into proper annotation documents for the separate
 * 'annotations' Firestore collection.
 */
function extractAnnotations(submissions) {
  const results = [];
  for (const sub of submissions) {
    if (!Array.isArray(sub.annotations) || sub.annotations.length === 0) continue;
    // Build a lookup of versionId → first document name
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
  await seedCollection(COLLECTIONS.FORM_SUBMISSIONS, SEED_FORM_SUBMISSIONS);
  await seedCollection(COLLECTIONS.THESIS_SUBMISSIONS, SEED_THESIS_SUBMISSIONS);

  // Extract and seed annotations from embedded thesis submission data
  const extractedAnnotations = extractAnnotations(SEED_THESIS_SUBMISSIONS);
  if (extractedAnnotations.length > 0) {
    await seedCollection(COLLECTIONS.ANNOTATIONS, extractedAnnotations);
  }

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
