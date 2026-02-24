/**
 * Seed Form Annotations
 * Populates the `formAnnotations` Firestore collection with realistic
 * sample annotation threads for the seeded form submissions (fs-001, fs-002).
 *
 * Usage:  node scripts/seed-form-annotations.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBCy59swYINVaEgfPy2XqP6U5nLs8qbadY',
  authDomain: 'postgrad-portal.firebaseapp.com',
  projectId: 'postgrad-portal',
  storageBucket: 'postgrad-portal.firebasestorage.app',
  messagingSenderId: '1074199423382',
  appId: '1:1074199423382:web:1a93b580f2c268dfd955b7',
};

const app   = initializeApp(firebaseConfig);
const auth  = getAuth(app);
const db    = getFirestore(app);

function ts(dateStr) { return Timestamp.fromDate(new Date(dateStr)); }

// ──────────────────────────────────────────────────────────────
// Sample annotations for fs-001: Title Registration (hdr-001)
//   Supervisor Prof. Sarah van der Berg reviews Thabo Molefe's
//   title registration submission.
// ──────────────────────────────────────────────────────────────
const FORM_ANNOTATIONS = [

  /* ── Title Registration (fs-001) ── supervisor open/unresolved */
  {
    id: 'fa-001',
    submissionId: 'fs-001',
    requestId:    'hdr-001',
    targetType:   'field',
    targetId:     'proposed_title',
    targetLabel:  'Proposed Thesis / Dissertation Title',
    authorId:     'supervisor-001',
    authorName:   'Prof. Sarah van der Berg',
    authorRole:   'supervisor',
    text: 'The title is too broad. Could you narrow it down to a specific clinical domain, e.g. "...for Cardiovascular Diagnostics"? This will strengthen the research scope.',
    createdAt:    ts('2026-02-03T09:15:00'),
    resolved:     false,
    resolvedBy:   null,
    resolvedAt:   null,
    replies: [
      {
        id: 'reply-fa-001-a',
        authorId:   'student-001',
        authorName: 'Thabo Molefe',
        authorRole: 'student',
        text: 'Thank you Prof. I agree – I was considering narrowing it to radiology or cardiology. Would "...for Radiology Diagnostics at Resource-Limited Hospitals" work?',
        createdAt: ts('2026-02-03T11:42:00'),
      },
      {
        id: 'reply-fa-001-b',
        authorId:   'supervisor-001',
        authorName: 'Prof. Sarah van der Berg',
        authorRole: 'supervisor',
        text: 'Radiology works well. Make sure the final title also references the South African context explicitly. Update the field and let me know.',
        createdAt: ts('2026-02-03T14:05:00'),
      },
    ],
  },

  /* ── Title Registration (fs-001) – supervisor resolved */
  {
    id: 'fa-002',
    submissionId: 'fs-001',
    requestId:    'hdr-001',
    targetType:   'field',
    targetId:     'keywords',
    targetLabel:  'Keywords',
    authorId:     'supervisor-001',
    authorName:   'Prof. Sarah van der Berg',
    authorRole:   'supervisor',
    text: 'Please add "transfer learning" and "low-resource settings" as keywords – these are key terms for literature discoverability.',
    createdAt:    ts('2026-02-03T09:22:00'),
    resolved:     true,
    resolvedBy:   'supervisor-001',
    resolvedAt:   ts('2026-02-04T08:30:00'),
    replies: [
      {
        id: 'reply-fa-002-a',
        authorId:   'student-001',
        authorName: 'Thabo Molefe',
        authorRole: 'student',
        text: 'Added both keywords. I also added "diagnostic AI" – hope that is okay.',
        createdAt: ts('2026-02-03T17:10:00'),
      },
    ],
  },

  /* ── Title Registration (fs-001) – coordinator section comment */
  {
    id: 'fa-003',
    submissionId: 'fs-001',
    requestId:    'hdr-001',
    targetType:   'field',
    targetId:     'research_description',
    targetLabel:  'Brief Description of Intended Research',
    authorId:     'coordinator-001',
    authorName:   'Dr. Fatima Patel',
    authorRole:   'coordinator',
    text: 'The description mentions "benchmark datasets" but does not specify which ones will be used. Please cite at least one public dataset (e.g. CheXpert, NIH Chest X-ray) to substantiate feasibility.',
    createdAt:    ts('2026-02-05T10:00:00'),
    resolved:     false,
    resolvedBy:   null,
    resolvedAt:   null,
    replies: [],
  },

  /* ── Title Registration (fs-001) – section-level comment (supervisor_review) */
  {
    id: 'fa-004',
    submissionId: 'fs-001',
    requestId:    'hdr-001',
    targetType:   'section',
    targetId:     'research_details',
    targetLabel:  'PROPOSED RESEARCH',
    authorId:     'supervisor-001',
    authorName:   'Prof. Sarah van der Berg',
    authorRole:   'supervisor',
    text: 'Overall this section is well structured. Once the title and keywords are updated (see individual field comments), I am ready to sign off.',
    createdAt:    ts('2026-02-03T09:30:00'),
    resolved:     false,
    resolvedBy:   null,
    resolvedAt:   null,
    replies: [
      {
        id: 'reply-fa-004-a',
        authorId:   'student-001',
        authorName: 'Thabo Molefe',
        authorRole: 'student',
        text: 'Understood, I will address all field comments and ping you once done.',
        createdAt:  ts('2026-02-03T12:00:00'),
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // Sample annotations for fs-002: Progress Report (hdr-002)
  //   Approved request – showing resolved back-and-forth thread.
  // ──────────────────────────────────────────────────────────────

  /* ── Progress Report (fs-002) – fully resolved field comment */
  {
    id: 'fa-005',
    submissionId: 'fs-002',
    requestId:    'hdr-002',
    targetType:   'field',
    targetId:     'work_completed',
    targetLabel:  'Work Completed During This Period',
    authorId:     'supervisor-001',
    authorName:   'Prof. Sarah van der Berg',
    authorRole:   'supervisor',
    text: 'Good progress overall, but please quantify the experiments – how many models were trained, on which datasets, and what accuracy ranges were achieved? Reviewers will want specifics.',
    createdAt:    ts('2025-11-12T10:30:00'),
    resolved:     true,
    resolvedBy:   'supervisor-001',
    resolvedAt:   ts('2025-11-14T09:00:00'),
    replies: [
      {
        id: 'reply-fa-005-a',
        authorId:   'student-001',
        authorName: 'Thabo Molefe',
        authorRole: 'student',
        text: 'Updated: trained 4 CNN variants on CheXpert (224 k images), top accuracy 91.3% on validation set. Added a summary table as well.',
        createdAt:  ts('2025-11-13T16:45:00'),
      },
      {
        id: 'reply-fa-005-b',
        authorId:   'supervisor-001',
        authorName: 'Prof. Sarah van der Berg',
        authorRole: 'supervisor',
        text: 'Much better. Resolving this thread.',
        createdAt:  ts('2025-11-14T09:00:00'),
      },
    ],
  },

  /* ── Progress Report (fs-002) – resolved challenges field */
  {
    id: 'fa-006',
    submissionId: 'fs-002',
    requestId:    'hdr-002',
    targetType:   'field',
    targetId:     'challenges',
    targetLabel:  'Challenges Encountered',
    authorId:     'coordinator-001',
    authorName:   'Dr. Fatima Patel',
    authorRole:   'coordinator',
    text: 'The challenges section mentions "data imbalance" but does not describe how it was handled. Please add your mitigation strategy (e.g. oversampling, class-weighted loss).',
    createdAt:    ts('2025-11-16T11:00:00'),
    resolved:     true,
    resolvedBy:   'coordinator-001',
    resolvedAt:   ts('2025-11-18T08:30:00'),
    replies: [
      {
        id: 'reply-fa-006-a',
        authorId:   'student-001',
        authorName: 'Thabo Molefe',
        authorRole: 'student',
        text: 'Added: used SMOTE for oversampling minority classes and added class-weighted loss during fine-tuning. Results section updated to reflect this.',
        createdAt:  ts('2025-11-17T14:20:00'),
      },
    ],
  },

  /* ── Progress Report (fs-002) – resolved section comment */
  {
    id: 'fa-007',
    submissionId: 'fs-002',
    requestId:    'hdr-002',
    targetType:   'section',
    targetId:     'progress_narrative',
    targetLabel:  'PROGRESS REPORT',
    authorId:     'supervisor-001',
    authorName:   'Prof. Sarah van der Berg',
    authorRole:   'supervisor',
    text: 'Solid report. The narrative flows well. Please address the two field-level comments below, then this section is ready for sign-off.',
    createdAt:    ts('2025-11-12T10:00:00'),
    resolved:     true,
    resolvedBy:   'supervisor-001',
    resolvedAt:   ts('2025-11-18T09:15:00'),
    replies: [],
  },

  /* ── Title Registration (fs-001) – highlight annotation on research description */
  {
    id: 'fa-008',
    submissionId: 'fs-001',
    requestId:    'hdr-001',
    targetType:   'highlight',
    targetId:     'highlight-research_description-1738600000000',
    targetLabel:  'Brief Description of Research',
    highlightText: 'deep learning models for medical imaging',
    highlightFieldId: 'research_description',
    authorId:     'supervisor-001',
    authorName:   'Prof. Sarah van der Berg',
    authorRole:   'supervisor',
    text: 'Please be more specific about which deep learning architectures you plan to use – CNNs, Vision Transformers, or hybrid approaches?',
    createdAt:    ts('2026-02-03T10:30:00'),
    resolved:     false,
    resolvedBy:   null,
    resolvedAt:   null,
    replies: [
      {
        id: 'reply-fa-008-a',
        authorId:   'student-001',
        authorName: 'Thabo Molefe',
        authorRole: 'student',
        text: 'Good point – I will specify ResNet-50 and DenseNet-121 as baseline CNNs with a comparison to Vision Transformers.',
        createdAt: ts('2026-02-03T15:20:00'),
      },
    ],
  },

  /* ── Progress Report (fs-002) – highlight annotation resolved */
  {
    id: 'fa-009',
    submissionId: 'fs-002',
    requestId:    'hdr-002',
    targetType:   'highlight',
    targetId:     'highlight-milestones_achieved-1732000000000',
    targetLabel:  'Key Milestones Achieved',
    highlightText: 'ethics approval obtained',
    highlightFieldId: 'milestones_achieved',
    authorId:     'coordinator-001',
    authorName:   'Dr. Fatima Abrahams',
    authorRole:   'coordinator',
    text: 'Please attach the ethics approval certificate number as a reference in this field.',
    createdAt:    ts('2025-11-14T09:15:00'),
    resolved:     true,
    resolvedBy:   'coordinator-001',
    resolvedAt:   ts('2025-11-16T10:00:00'),
    replies: [
      {
        id: 'reply-fa-009-a',
        authorId:   'student-001',
        authorName: 'Thabo Molefe',
        authorRole: 'student',
        text: 'Added: Ethics clearance ref BM22/6/15 granted 2025-08-20.',
        createdAt:  ts('2025-11-15T13:45:00'),
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Write to Firestore
// ─────────────────────────────────────────────────────────────
async function run() {
  console.log('Attempting sign-in (may be skipped if auth is disabled)…');
  try {
    await signInWithEmailAndPassword(auth, 'admin@uwc.ac.za', 'Portal@2026');
    console.log('Signed in as admin.');
  } catch (e) {
    console.log(`Auth skipped (${e.code || e.message}) — writing directly to Firestore.\n`);
  }

  const col = collection(db, 'formAnnotations');
  let written = 0;

  for (const ann of FORM_ANNOTATIONS) {
    const { id, ...data } = ann;
    await setDoc(doc(col, id), data);
    console.log(`  ✔ ${id}  [${data.submissionId}] ${data.targetType}:${data.targetId}  resolved=${data.resolved}`);
    written++;
  }

  console.log(`\nDone – ${written} form annotations written to Firestore.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
