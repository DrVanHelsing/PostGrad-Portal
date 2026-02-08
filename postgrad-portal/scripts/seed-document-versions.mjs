// =============================================
// Seed Document Versions, Comments & Feedback
// Creates realistic version history for HD requests
// =============================================

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';

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

function ts(dateStr) { return Timestamp.fromDate(new Date(dateStr)); }

const VERSIONS = [
  // ──────────────────────────────────────────────
  // hdr-001: Approved progress report  – 3 versions (initial → revision → final approved)
  // ──────────────────────────────────────────────
  {
    id: 'dv-001-v1',
    requestId: 'hdr-001',
    version: 1,
    status: 'superseded',
    submittedBy: 'student-001',
    submitterName: 'Thabo Molefe',
    submitterRole: 'student',
    changeNotes: 'Initial submission of the annual progress report.',
    submittedAt: ts('2025-09-01T09:00:00'),
    updatedAt: ts('2025-09-12T14:00:00'),
    documents: [
      { name: 'Progress_Report_2025.pdf', size: '1.8 MB', url: '/documents/hdr-001/Progress_Report_2025.pdf', type: 'application/pdf' },
      { name: 'Publication_Evidence.pdf', size: '1.2 MB', url: '/documents/hdr-001/Publication_Evidence.pdf', type: 'application/pdf' },
    ],
    comments: [
      {
        id: 'cmt_001_01', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor',
        text: 'Good overall structure Thabo. However, the methodology section needs more detail on your sampling strategy for the imaging dataset. Please also address the limitations more explicitly.',
        documentName: 'Progress_Report_2025.pdf', parentCommentId: null, createdAt: ts('2025-09-05T10:30:00'),
      },
      {
        id: 'cmt_001_02', authorId: 'student-001', authorName: 'Thabo Molefe', authorRole: 'student',
        text: 'Thank you Professor. I will expand the sampling methodology section and add a dedicated limitations subsection. Should I also include the preliminary results from the pilot study?',
        documentName: 'Progress_Report_2025.pdf', parentCommentId: 'cmt_001_01', createdAt: ts('2025-09-05T14:15:00'),
      },
      {
        id: 'cmt_001_03', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor',
        text: 'Yes, please include the pilot results with appropriate statistical tests. Also update the publication evidence to include the SAICSIT conference paper acceptance.',
        documentName: null, parentCommentId: 'cmt_001_02', createdAt: ts('2025-09-06T08:45:00'),
      },
      {
        id: 'cmt_001_04', authorId: 'coordinator-001', authorName: 'Dr. Fatima Patel', authorRole: 'coordinator',
        text: 'I have reviewed the document at a high level. Please ensure the formatting follows the 2025 Faculty template before final submission.',
        documentName: 'Progress_Report_2025.pdf', parentCommentId: null, createdAt: ts('2025-09-07T09:00:00'),
      },
    ],
    feedback: [
      {
        id: 'fb_001_01', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor',
        recommendation: 'request_changes',
        text: 'The report shows good progress in the first year, but the methodology section needs strengthening. The sampling strategy must detail the dataset size, inclusion/exclusion criteria, and the data augmentation approach. Please also add a clearer timeline for Year 2.',
        criteria: [
          { key: 'quality', label: 'Research Quality', rating: 4 },
          { key: 'writing', label: 'Academic Writing', rating: 3 },
          { key: 'methodology', label: 'Methodology', rating: 2 },
          { key: 'completeness', label: 'Completeness', rating: 3 },
          { key: 'formatting', label: 'Formatting & Style', rating: 4 },
        ],
        createdAt: ts('2025-09-08T11:00:00'),
      },
    ],
  },
  {
    id: 'dv-001-v2',
    requestId: 'hdr-001',
    version: 2,
    status: 'superseded',
    submittedBy: 'student-001',
    submitterName: 'Thabo Molefe',
    submitterRole: 'student',
    changeNotes: 'Expanded methodology section with sampling details, added pilot results, included SAICSIT paper evidence, updated formatting to 2025 Faculty template.',
    submittedAt: ts('2025-09-12T14:00:00'),
    updatedAt: ts('2025-09-20T10:00:00'),
    documents: [
      { name: 'Progress_Report_2025.pdf', size: '2.3 MB', url: '/documents/hdr-001/Progress_Report_2025.pdf', type: 'application/pdf' },
      { name: 'Publication_Evidence.pdf', size: '1.5 MB', url: '/documents/hdr-001/Publication_Evidence.pdf', type: 'application/pdf' },
      { name: 'Supervisor_Feedback_Form.pdf', size: '340 KB', url: '/documents/hdr-001/Supervisor_Feedback_Form.pdf', type: 'application/pdf' },
    ],
    comments: [
      {
        id: 'cmt_002_01', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor',
        text: 'Excellent revisions, Thabo. The methodology is now much stronger, and the pilot results are well-presented. I am happy to approve this version.',
        documentName: 'Progress_Report_2025.pdf', parentCommentId: null, createdAt: ts('2025-09-15T09:30:00'),
      },
      {
        id: 'cmt_002_02', authorId: 'student-001', authorName: 'Thabo Molefe', authorRole: 'student',
        text: 'Thank you, Professor van der Berg. I appreciate the detailed feedback on the first version.',
        documentName: null, parentCommentId: 'cmt_002_01', createdAt: ts('2025-09-15T11:00:00'),
      },
    ],
    feedback: [
      {
        id: 'fb_002_01', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor',
        recommendation: 'approve',
        text: 'The revised report addresses all my previous concerns comprehensively. The methodology section now provides sufficient detail for replication. The pilot study results are promising and well-analysed. I recommend approval.',
        criteria: [
          { key: 'quality', label: 'Research Quality', rating: 5 },
          { key: 'writing', label: 'Academic Writing', rating: 4 },
          { key: 'methodology', label: 'Methodology', rating: 4 },
          { key: 'completeness', label: 'Completeness', rating: 5 },
          { key: 'formatting', label: 'Formatting & Style', rating: 5 },
        ],
        createdAt: ts('2025-09-18T14:00:00'),
      },
    ],
  },
  {
    id: 'dv-001-v3',
    requestId: 'hdr-001',
    version: 3,
    status: 'approved',
    submittedBy: 'student-001',
    submitterName: 'Thabo Molefe',
    submitterRole: 'student',
    changeNotes: 'Final version submitted after supervisor approval. No content changes, only coordinator formatting comments addressed.',
    submittedAt: ts('2025-09-20T10:00:00'),
    updatedAt: ts('2025-12-15T16:00:00'),
    documents: [
      { name: 'Progress_Report_2025.pdf', size: '2.3 MB', url: '/documents/hdr-001/Progress_Report_2025.pdf', type: 'application/pdf' },
      { name: 'Publication_Evidence.pdf', size: '1.5 MB', url: '/documents/hdr-001/Publication_Evidence.pdf', type: 'application/pdf' },
      { name: 'Supervisor_Feedback_Form.pdf', size: '340 KB', url: '/documents/hdr-001/Supervisor_Feedback_Form.pdf', type: 'application/pdf' },
    ],
    comments: [
      {
        id: 'cmt_003_01', authorId: 'coordinator-001', authorName: 'Dr. Fatima Patel', authorRole: 'coordinator',
        text: 'Report is well-prepared. I have signed and forwarded to the Faculty Board.',
        documentName: null, parentCommentId: null, createdAt: ts('2025-11-05T10:30:00'),
      },
      {
        id: 'cmt_003_02', authorId: 'admin-001', authorName: 'Linda Mkhize', authorRole: 'admin',
        text: 'Faculty Board and Senate Board have both approved. Congratulations Thabo - great work on this report.',
        documentName: null, parentCommentId: null, createdAt: ts('2025-12-15T16:00:00'),
      },
    ],
    feedback: [
      {
        id: 'fb_003_01', authorId: 'coordinator-001', authorName: 'Dr. Fatima Patel', authorRole: 'coordinator',
        recommendation: 'approve',
        text: 'The report meets all Faculty requirements. The research trajectory is strong and the student demonstrates excellent progress for a first-year PhD candidate. Forwarding for final approval.',
        criteria: [
          { key: 'quality', label: 'Research Quality', rating: 5 },
          { key: 'writing', label: 'Academic Writing', rating: 4 },
          { key: 'completeness', label: 'Completeness', rating: 5 },
        ],
        createdAt: ts('2025-11-05T10:30:00'),
      },
    ],
  },

  // ──────────────────────────────────────────────
  // hdr-002: Title registration – under review (1 version)
  // ──────────────────────────────────────────────
  {
    id: 'dv-002-v1',
    requestId: 'hdr-002',
    version: 1,
    status: 'under_review',
    submittedBy: 'student-001',
    submitterName: 'Thabo Molefe',
    submitterRole: 'student',
    changeNotes: 'Initial title registration submission with research proposal and literature review.',
    submittedAt: ts('2026-01-15T09:00:00'),
    updatedAt: ts('2026-02-01T10:00:00'),
    documents: [
      { name: 'Research_Proposal_v3.pdf', size: '3.1 MB', url: '/documents/hdr-002/Research_Proposal_v3.pdf', type: 'application/pdf' },
      { name: 'Literature_Review_Summary.pdf', size: '1.5 MB', url: '/documents/hdr-002/Literature_Review_Summary.pdf', type: 'application/pdf' },
      { name: 'Ethics_Clearance_Application.pdf', size: '890 KB', url: '/documents/hdr-002/Ethics_Clearance_Application.pdf', type: 'application/pdf' },
    ],
    comments: [
      {
        id: 'cmt_004_01', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor',
        text: 'I have started reviewing the proposal. The research questions are well-stated. I will provide detailed feedback on the methodology section by end of week.',
        documentName: 'Research_Proposal_v3.pdf', parentCommentId: null, createdAt: ts('2026-02-02T09:00:00'),
      },
      {
        id: 'cmt_004_02', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor',
        text: 'The literature review is thorough, but consider adding the recent Kaggle TB detection challenge results (2024) as they directly relate to your proposed approach.',
        documentName: 'Literature_Review_Summary.pdf', parentCommentId: null, createdAt: ts('2026-02-03T11:30:00'),
      },
      {
        id: 'cmt_004_03', authorId: 'student-001', authorName: 'Thabo Molefe', authorRole: 'student',
        text: 'Thank you Professor. I am aware of the Kaggle challenge results - will add them as a benchmark comparison. Should I update the document now or wait for your full review?',
        documentName: 'Literature_Review_Summary.pdf', parentCommentId: 'cmt_004_02', createdAt: ts('2026-02-03T14:00:00'),
      },
    ],
    feedback: [],
  },

  // ──────────────────────────────────────────────
  // hdr-004: Ethics referral – 2 versions (1st rejected, 2nd pending)
  // ──────────────────────────────────────────────
  {
    id: 'dv-004-v1',
    requestId: 'hdr-004',
    version: 1,
    status: 'superseded',
    submittedBy: 'student-001',
    submitterName: 'Thabo Molefe',
    submitterRole: 'student',
    changeNotes: 'Initial ethics clearance application.',
    submittedAt: ts('2025-11-10T09:00:00'),
    updatedAt: ts('2026-01-08T11:00:00'),
    documents: [
      { name: 'Ethics_Application_v1.pdf', size: '2.1 MB', url: '/documents/hdr-004/Ethics_Application_v1.pdf', type: 'application/pdf' },
      { name: 'Informed_Consent_Form.pdf', size: '380 KB', url: '/documents/hdr-004/Informed_Consent_Form.pdf', type: 'application/pdf' },
      { name: 'Data_Collection_Protocol.pdf', size: '560 KB', url: '/documents/hdr-004/Data_Collection_Protocol.pdf', type: 'application/pdf' },
    ],
    comments: [
      {
        id: 'cmt_005_01', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor',
        text: 'The ethics application looks comprehensive. I have one concern about the informed consent form - it does not cover participants under 18, which is required for your paediatric imaging data.',
        documentName: 'Informed_Consent_Form.pdf', parentCommentId: null, createdAt: ts('2025-11-15T10:00:00'),
      },
      {
        id: 'cmt_005_02', authorId: 'student-001', authorName: 'Thabo Molefe', authorRole: 'student',
        text: 'Good point, Professor. I was planning to exclude under-18 data initially, but I see how including it strengthens the study. I will revise the consent form.',
        documentName: 'Informed_Consent_Form.pdf', parentCommentId: 'cmt_005_01', createdAt: ts('2025-11-16T09:00:00'),
      },
      {
        id: 'cmt_005_03', authorId: 'coordinator-001', authorName: 'Dr. Fatima Patel', authorRole: 'coordinator',
        text: 'The Faculty Board has reviewed and referred this back. The consent form must be revised for minors, and a separate data management plan is required. See the referral notice for details.',
        documentName: null, parentCommentId: null, createdAt: ts('2026-01-08T11:00:00'),
      },
    ],
    feedback: [
      {
        id: 'fb_005_01', authorId: 'supervisor-001', authorName: 'Prof. Sarah van der Berg', authorRole: 'supervisor',
        recommendation: 'request_changes',
        text: 'The application is almost ready but the consent form needs a guardian consent section for minors. Additionally, the data anonymization procedure should be described in more detail. I have approved with the expectation that these will be addressed before Faculty Board review.',
        criteria: [
          { key: 'quality', label: 'Research Quality', rating: 4 },
          { key: 'completeness', label: 'Completeness', rating: 3 },
          { key: 'formatting', label: 'Formatting & Style', rating: 4 },
        ],
        createdAt: ts('2025-11-20T14:00:00'),
      },
      {
        id: 'fb_005_02', authorId: 'coordinator-001', authorName: 'Dr. Fatima Patel', authorRole: 'coordinator',
        recommendation: 'refer_back',
        text: 'The Faculty Ethics Committee requires revisions to the informed consent form (must cover participants under 18) and a standalone data management plan. The anonymization procedures are not sufficiently detailed for the Committee requirements.',
        criteria: [
          { key: 'completeness', label: 'Completeness', rating: 2 },
          { key: 'methodology', label: 'Methodology', rating: 3 },
        ],
        createdAt: ts('2026-01-08T11:00:00'),
      },
    ],
  },
  {
    id: 'dv-004-v2',
    requestId: 'hdr-004',
    version: 2,
    status: 'changes_requested',
    submittedBy: 'student-001',
    submitterName: 'Thabo Molefe',
    submitterRole: 'student',
    changeNotes: 'Revised consent form with guardian consent for minors and added a separate data management plan. Enhanced anonymization procedures in the ethics application.',
    submittedAt: ts('2026-01-20T10:00:00'),
    updatedAt: ts('2026-01-20T10:00:00'),
    documents: [
      { name: 'Ethics_Application_v1.pdf', size: '2.4 MB', url: '/documents/hdr-004/Ethics_Application_v1.pdf', type: 'application/pdf' },
      { name: 'Informed_Consent_Form.pdf', size: '520 KB', url: '/documents/hdr-004/Informed_Consent_Form.pdf', type: 'application/pdf' },
      { name: 'Data_Collection_Protocol.pdf', size: '610 KB', url: '/documents/hdr-004/Data_Collection_Protocol.pdf', type: 'application/pdf' },
    ],
    comments: [
      {
        id: 'cmt_006_01', authorId: 'student-001', authorName: 'Thabo Molefe', authorRole: 'student',
        text: 'I have revised the consent form to include a guardian consent section for minors (Section 4.3) and created a standalone Data Management Plan appendix. The anonymization procedures are now detailed in Section 5.2 of the ethics application.',
        documentName: null, parentCommentId: null, createdAt: ts('2026-01-20T10:30:00'),
      },
    ],
    feedback: [],
  },

  // ──────────────────────────────────────────────
  // hdr-005: Student 2 (Amahle Dlamini) – Coordinator review (1 version)
  // ──────────────────────────────────────────────
  {
    id: 'dv-005-v1',
    requestId: 'hdr-005',
    version: 1,
    status: 'submitted',
    submittedBy: 'student-002',
    submitterName: 'Amahle Dlamini',
    submitterRole: 'student',
    changeNotes: 'Initial submission of annual progress report.',
    submittedAt: ts('2026-01-20T08:00:00'),
    updatedAt: ts('2026-01-25T10:00:00'),
    documents: [
      { name: 'Progress_Report_2025_Dlamini.pdf', size: '2.0 MB', url: '/documents/hdr-005/Progress_Report_2025_Dlamini.pdf', type: 'application/pdf' },
    ],
    comments: [
      {
        id: 'cmt_007_01', authorId: 'supervisor-002', authorName: 'Dr. James Okafor', authorRole: 'supervisor',
        text: 'Amahle, the progress report is well-structured. The NLP model results are impressive. I have approved and forwarded to the coordinator.',
        documentName: 'Progress_Report_2025_Dlamini.pdf', parentCommentId: null, createdAt: ts('2026-01-22T14:00:00'),
      },
      {
        id: 'cmt_007_02', authorId: 'student-002', authorName: 'Amahle Dlamini', authorRole: 'student',
        text: 'Thank you Dr. Okafor. I look forward to the coordinator review.',
        documentName: null, parentCommentId: 'cmt_007_01', createdAt: ts('2026-01-22T15:30:00'),
      },
    ],
    feedback: [
      {
        id: 'fb_007_01', authorId: 'supervisor-002', authorName: 'Dr. James Okafor', authorRole: 'supervisor',
        recommendation: 'approve',
        text: 'Excellent progress for a second-year student. The NLP methodology is sound and the preliminary results are promising. The writing is clear and well-organized. Ready for coordinator review.',
        criteria: [
          { key: 'quality', label: 'Research Quality', rating: 5 },
          { key: 'writing', label: 'Academic Writing', rating: 5 },
          { key: 'methodology', label: 'Methodology', rating: 4 },
          { key: 'completeness', label: 'Completeness', rating: 4 },
          { key: 'formatting', label: 'Formatting & Style', rating: 5 },
        ],
        createdAt: ts('2026-01-23T09:00:00'),
      },
    ],
  },
];

// ── Seed ──
async function seed() {
  console.log('Authenticating...');
  await signInWithEmailAndPassword(auth, 'admin@uwc.ac.za', 'Portal@2026');
  console.log('  Signed in as admin@uwc.ac.za\n');

  console.log('Seeding document versions...');
  let count = 0;
  for (const v of VERSIONS) {
    const { id, ...data } = v;
    await setDoc(doc(collection(db, 'documentVersions'), id), data);
    count++;
    console.log(`  [${count}/${VERSIONS.length}] ${id} (${data.requestId} v${data.version})`);
  }
  console.log(`\nDone! ${count} document versions seeded.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
