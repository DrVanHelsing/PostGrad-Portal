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
