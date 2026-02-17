// =============================================
// Seed Annotations – Firestore 'annotations' collection
// Extracts embedded annotations from thesis submissions
// and writes them as separate documents with proper field
// mapping so subscribeToAnnotations() can find them.
//
// Usage:  node scripts/seed-annotations.mjs
// =============================================

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, getDocs, Timestamp,
} from 'firebase/firestore';

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

function ts(dateStr) { return Timestamp.fromDate(new Date(dateStr)); }

/* ── Color name → hex mapping ── */
const COLOR_MAP = {
  yellow: '#ffd43b',
  green: '#69db7c',
  blue: '#74c0fc',
  red: '#ffa8a8',
  pink: '#ffc9c9',
  orange: '#ffa94d',
};

function mapColor(c) {
  if (!c) return '#ffd43b';
  if (c.startsWith('#')) return c;
  return COLOR_MAP[c.toLowerCase()] || '#ffd43b';
}

// ─────────────────────────────────────────────────────────────
// Annotations extracted from SEED_THESIS_SUBMISSIONS.
// Each annotation includes:
//   • versionId  – matches the thesis submission version id (tv-XXX)
//   • requestId  – the thesis submission id (thesis-XXX)
//   • documentName – the first document's name in that version
//   • pageNumber, highlightColor, resolved  – mapped from embedded fields
// ─────────────────────────────────────────────────────────────
const ANNOTATIONS = [
  // ── thesis-001, tv-001 → Chapter3_Methodology_v1.pdf ──
  {
    id: 'ann-001',
    versionId: 'tv-001',
    requestId: 'thesis-001',
    documentName: 'Chapter3_Methodology_v1.pdf',
    selectedText: 'convenience sampling approach',
    comment: 'This needs to be changed to stratified sampling to ensure representativeness across hospital types.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#ffd43b',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2026-01-25'),
    updatedAt: ts('2026-01-25'),
  },
  {
    id: 'ann-002',
    versionId: 'tv-001',
    requestId: 'thesis-001',
    documentName: 'Chapter3_Methodology_v1.pdf',
    selectedText: 'ethical approval is pending',
    comment: 'Update this to reflect the approved ethics number (HS-2025-0847).',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#69db7c',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2026-01-25'),
    updatedAt: ts('2026-01-25'),
  },
  // ── thesis-001, tv-002 → Chapter3_Methodology_v2.pdf ──
  {
    id: 'ann-003',
    versionId: 'tv-002',
    requestId: 'thesis-001',
    documentName: 'Chapter3_Methodology_v2.pdf',
    selectedText: 'deep learning architectures',
    comment: 'Consider citing the recent survey by Chen et al. (2025) here.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#74c0fc',
    status: 'active',
    resolved: false,
    replies: [],
    createdAt: ts('2026-02-03'),
    updatedAt: ts('2026-02-03'),
  },
  // ── thesis-003, tv-006 → Khumalo_MSc_Thesis_Full_v1.pdf ──
  {
    id: 'ann-004',
    versionId: 'tv-006',
    requestId: 'thesis-003',
    documentName: 'Khumalo_MSc_Thesis_Full_v1.pdf',
    selectedText: 'urban growth prediction model',
    comment: 'Consider adding a comparison with the Cellular Automata approach used by Verburg et al.',
    pageNumber: 1,
    authorId: 'supervisor-002',
    authorName: 'Dr. James Nkosi',
    authorRole: 'supervisor',
    highlightColor: '#ffd43b',
    status: 'active',
    resolved: false,
    replies: [],
    createdAt: ts('2026-02-08'),
    updatedAt: ts('2026-02-08'),
  },
  {
    id: 'ann-005',
    versionId: 'tv-006',
    requestId: 'thesis-003',
    documentName: 'Khumalo_MSc_Thesis_Full_v1.pdf',
    selectedText: 'random forest regression',
    comment: 'The feature importance analysis should be presented as a separate table rather than inline text.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#ffc9c9',
    status: 'active',
    resolved: false,
    replies: [],
    createdAt: ts('2026-02-10'),
    updatedAt: ts('2026-02-10'),
  },
  // ── thesis-008, tv-014 → SAICSIT_2026_Khumalo_Draft.pdf ──
  {
    id: 'ann-006',
    versionId: 'tv-014',
    requestId: 'thesis-008',
    documentName: 'SAICSIT_2026_Khumalo_Draft.pdf',
    selectedText: 'our novel approach',
    comment: 'Avoid using "novel" — let the reviewers decide if it\'s novel. Use "proposed" instead.',
    pageNumber: 1,
    authorId: 'supervisor-002',
    authorName: 'Dr. James Nkosi',
    authorRole: 'supervisor',
    highlightColor: '#ffd43b',
    status: 'active',
    resolved: false,
    replies: [],
    createdAt: ts('2026-02-10'),
    updatedAt: ts('2026-02-10'),
  },
  // ── thesis-010, tv-016 → Chapter2_LitReview_Dlamini_v1.pdf ──
  {
    id: 'ann-007',
    versionId: 'tv-016',
    requestId: 'thesis-010',
    documentName: 'Chapter2_LitReview_Dlamini_v1.pdf',
    selectedText: 'blockchain is a distributed ledger',
    comment: 'This paragraph reads like a tutorial. Cut it down — your readers will be academics familiar with the basics.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#ffd43b',
    status: 'active',
    resolved: false,
    replies: [],
    createdAt: ts('2025-12-15'),
    updatedAt: ts('2025-12-15'),
  },
  {
    id: 'ann-008',
    versionId: 'tv-016',
    requestId: 'thesis-010',
    documentName: 'Chapter2_LitReview_Dlamini_v1.pdf',
    selectedText: 'no existing South African studies',
    comment: 'This is incorrect. See Ngwenya (2023) and van Zyl (2024) for SA-specific work in this area.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#ffa8a8',
    status: 'active',
    resolved: false,
    replies: [],
    createdAt: ts('2025-12-15'),
    updatedAt: ts('2025-12-15'),
  },
  // ── thesis-002, tv-003 → Chapter2_LitReview_v1.pdf ──
  {
    id: 'ann-009',
    versionId: 'tv-003',
    requestId: 'thesis-002',
    documentName: 'Chapter2_LitReview_v1.pdf',
    selectedText: 'systematic review methodology',
    comment: 'Clarify whether you followed PRISMA or another systematic review framework.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#ffd43b',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2025-09-22'),
    updatedAt: ts('2025-09-22'),
  },
  // ── thesis-002, tv-004 → Chapter2_LitReview_v2.pdf ──
  {
    id: 'ann-010',
    versionId: 'tv-004',
    requestId: 'thesis-002',
    documentName: 'Chapter2_LitReview_v2.pdf',
    selectedText: 'limited African research context',
    comment: 'Good improvement — the new African case studies strengthen this section significantly.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#69db7c',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2025-10-18'),
    updatedAt: ts('2025-10-18'),
  },
  // ── thesis-004, tv-007 → Chapter4_Results_v1.pdf ──
  {
    id: 'ann-011',
    versionId: 'tv-007',
    requestId: 'thesis-004',
    documentName: 'Chapter4_Results_v1.pdf',
    selectedText: 'confidence interval of 95%',
    comment: 'Add confidence intervals to ALL prediction tables, not just Table 4.1.',
    pageNumber: 1,
    authorId: 'supervisor-002',
    authorName: 'Dr. James Nkosi',
    authorRole: 'supervisor',
    highlightColor: '#ffd43b',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2025-12-12'),
    updatedAt: ts('2025-12-12'),
  },
  {
    id: 'ann-012',
    versionId: 'tv-007',
    requestId: 'thesis-004',
    documentName: 'Chapter4_Results_v1.pdf',
    selectedText: 'discussion of findings',
    comment: 'Connect these findings back to the theoretical framework in Chapter 2.',
    pageNumber: 1,
    authorId: 'supervisor-002',
    authorName: 'Dr. James Nkosi',
    authorRole: 'supervisor',
    highlightColor: '#ffc9c9',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2025-12-13'),
    updatedAt: ts('2025-12-13'),
  },
  // ── thesis-005, tv-009 → Research_Proposal_Molefe_v1.pdf ──
  {
    id: 'ann-013',
    versionId: 'tv-009',
    requestId: 'thesis-005',
    documentName: 'Research_Proposal_Molefe_v1.pdf',
    selectedText: 'broad scope of machine learning',
    comment: 'The scope is too broad. Narrow down to 2-3 specific diagnostic areas for feasibility.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#ffd43b',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2025-05-22'),
    updatedAt: ts('2025-05-22'),
  },
  {
    id: 'ann-014',
    versionId: 'tv-009',
    requestId: 'thesis-005',
    documentName: 'Research_Proposal_Molefe_v1.pdf',
    selectedText: 'budget allocation',
    comment: 'Budget section is incomplete. Please add estimated costs for data collection, computing resources, and travel.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#ffa8a8',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2025-05-23'),
    updatedAt: ts('2025-05-23'),
  },
  // ── thesis-005, tv-010 → Research_Proposal_Molefe_v2.pdf ──
  {
    id: 'ann-015',
    versionId: 'tv-010',
    requestId: 'thesis-005',
    documentName: 'Research_Proposal_Molefe_v2.pdf',
    selectedText: 'tuberculosis and diabetic retinopathy',
    comment: 'Good focus areas. This is much more feasible now.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#69db7c',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2025-06-18'),
    updatedAt: ts('2025-06-18'),
  },
  // ── thesis-007, tv-012 → SLR_UrbanAnalytics_Khumalo_v1.pdf ──
  {
    id: 'ann-016',
    versionId: 'tv-012',
    requestId: 'thesis-007',
    documentName: 'SLR_UrbanAnalytics_Khumalo_v1.pdf',
    selectedText: 'search string construction',
    comment: 'Add the keyword co-occurrence analysis to validate your search strategy.',
    pageNumber: 1,
    authorId: 'supervisor-002',
    authorName: 'Dr. James Nkosi',
    authorRole: 'supervisor',
    highlightColor: '#ffd43b',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2025-08-18'),
    updatedAt: ts('2025-08-18'),
  },
  {
    id: 'ann-017',
    versionId: 'tv-012',
    requestId: 'thesis-007',
    documentName: 'SLR_UrbanAnalytics_Khumalo_v1.pdf',
    selectedText: 'no African case studies were found',
    comment: 'There are several African case studies — check Amoako (2022) and Odendaal (2021).',
    pageNumber: 1,
    authorId: 'supervisor-002',
    authorName: 'Dr. James Nkosi',
    authorRole: 'supervisor',
    highlightColor: '#ffa8a8',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2025-08-19'),
    updatedAt: ts('2025-08-19'),
  },
  // ── thesis-007, tv-013 → SLR_UrbanAnalytics_Khumalo_v2.pdf ──
  {
    id: 'ann-018',
    versionId: 'tv-013',
    requestId: 'thesis-007',
    documentName: 'SLR_UrbanAnalytics_Khumalo_v2.pdf',
    selectedText: 'PRISMA flow diagram',
    comment: 'Much improved PRISMA diagram. Ready for thesis.',
    pageNumber: 1,
    authorId: 'supervisor-002',
    authorName: 'Dr. James Nkosi',
    authorRole: 'supervisor',
    highlightColor: '#69db7c',
    status: 'resolved',
    resolved: true,
    replies: [],
    createdAt: ts('2025-09-18'),
    updatedAt: ts('2025-09-18'),
  },
  // ── thesis-013, tv-019 → Data_Analysis_Report_TB_Molefe.pdf ──
  {
    id: 'ann-019',
    versionId: 'tv-019',
    requestId: 'thesis-013',
    documentName: 'Data_Analysis_Report_TB_Molefe.pdf',
    selectedText: 'classification accuracy of 94.2%',
    comment: 'Impressive results. Please also report sensitivity and specificity for the TB class specifically.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#74c0fc',
    status: 'active',
    resolved: false,
    replies: [],
    createdAt: ts('2026-02-12'),
    updatedAt: ts('2026-02-12'),
  },
  // ── thesis-013, tv-019 → Statistical_Appendix_Molefe.pdf ──
  {
    id: 'ann-020',
    versionId: 'tv-019',
    requestId: 'thesis-013',
    documentName: 'Statistical_Appendix_Molefe.pdf',
    selectedText: 'confusion matrix',
    comment: 'Label the axes more clearly — include class names not just numbers.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#ffd43b',
    status: 'active',
    resolved: false,
    replies: [],
    createdAt: ts('2026-02-12'),
    updatedAt: ts('2026-02-12'),
  },
];

async function seedAnnotations() {
  // Try to authenticate — if Firebase Auth is disabled, seed directly
  let authed = false;
  try {
    await signInWithEmailAndPassword(auth, 'admin@uwc.ac.za', 'Portal@2026');
    console.log('🔑 Authenticated as admin\n');
    authed = true;
  } catch (e) {
    console.log(`⚠ Auth skipped (${e.code || e.message}) — writing directly\n`);
  }

  // Check if annotations already exist
  const existingSnap = await getDocs(collection(db, 'annotations'));
  if (existingSnap.size > 0) {
    console.log(`⚠ annotations collection already has ${existingSnap.size} documents.`);
    console.log('  Overwriting with fresh data...\n');
  }

  const col = collection(db, 'annotations');

  for (const ann of ANNOTATIONS) {
    const { id, ...data } = ann;
    console.log(`📝 ${id} → v:${data.versionId} doc:${data.documentName} "${data.selectedText.slice(0, 35)}..."`);
    await setDoc(doc(col, id), data);
  }

  console.log(`\n🎉 ${ANNOTATIONS.length} annotations seeded successfully!`);
  process.exit(0);
}

seedAnnotations().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
