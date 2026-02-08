// =============================================
// Seed Annotations – Text highlight comments
// Demo data for the annotation/review system
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

const ANNOTATIONS = [
  // Annotations on hdr-001 version 3 (approved) – Progress_Report_2025.pdf
  {
    id: 'ann-001',
    versionId: 'dv-001-v3',
    requestId: 'hdr-001',
    documentName: 'Progress_Report_2025.pdf',
    selectedText: 'The study employs a mixed-methods approach combining quantitative image analysis with qualitative interviews',
    comment: 'This is well articulated. The mixed-methods design is appropriate for this research context. Consider adding a brief justification for why purely quantitative approaches were insufficient.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#ffd43b',
    resolved: false,
    replies: [
      {
        id: 'reply_001_01',
        authorId: 'student-001',
        authorName: 'Thabo Molefe',
        authorRole: 'student',
        text: 'Thank you Professor. I will add a paragraph in the methodology section contrasting pure quantitative approaches with our mixed-methods design.',
        createdAt: ts('2025-10-02T11:30:00'),
      },
    ],
    createdAt: ts('2025-10-01T14:20:00'),
    updatedAt: ts('2025-10-02T11:30:00'),
  },
  {
    id: 'ann-002',
    versionId: 'dv-001-v3',
    requestId: 'hdr-001',
    documentName: 'Progress_Report_2025.pdf',
    selectedText: 'preliminary results indicate a 15% improvement in detection accuracy',
    comment: 'Impressive result. However, please specify the baseline model used for comparison and include the confidence interval. A 15% improvement needs statistical validation.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#ffa8a8',
    resolved: true,
    replies: [
      {
        id: 'reply_002_01',
        authorId: 'student-001',
        authorName: 'Thabo Molefe',
        authorRole: 'student',
        text: 'I have updated the results section with a comparison table showing baseline YOLOv5 vs our modified architecture, including 95% confidence intervals.',
        createdAt: ts('2025-10-03T09:15:00'),
      },
      {
        id: 'reply_002_02',
        authorId: 'supervisor-001',
        authorName: 'Prof. Sarah van der Berg',
        authorRole: 'supervisor',
        text: 'Excellent. The statistical validation is now sound. Marking this as resolved.',
        createdAt: ts('2025-10-03T15:00:00'),
      },
    ],
    createdAt: ts('2025-10-01T14:35:00'),
    updatedAt: ts('2025-10-03T15:00:00'),
  },
  {
    id: 'ann-003',
    versionId: 'dv-001-v3',
    requestId: 'hdr-001',
    documentName: 'Progress_Report_2025.pdf',
    selectedText: 'data augmentation techniques including rotation, flipping, and colour jittering',
    comment: 'Please also consider adding more advanced augmentation techniques such as CutMix or Mosaic augmentations that are standard in modern object detection literature. Also mention the augmentation ratios used.',
    pageNumber: 1,
    authorId: 'coordinator-001',
    authorName: 'Dr. Fatima Patel',
    authorRole: 'coordinator',
    highlightColor: '#69db7c',
    resolved: false,
    replies: [],
    createdAt: ts('2025-10-04T10:00:00'),
    updatedAt: ts('2025-10-04T10:00:00'),
  },
  // Annotation on hdr-002 version 1 – Literature_Review_Draft.docx
  {
    id: 'ann-004',
    versionId: 'dv-002-v1',
    requestId: 'hdr-002',
    documentName: 'Ethics_Clearance_Application.pdf',
    selectedText: 'informed consent procedures will follow standard university protocols',
    comment: 'This is too vague. Please specify which exact protocol (UWC Ethics Policy version, form numbers) and describe the consent process step by step. The ethics committee will require this level of detail.',
    pageNumber: 1,
    authorId: 'supervisor-001',
    authorName: 'Prof. Sarah van der Berg',
    authorRole: 'supervisor',
    highlightColor: '#ffa8a8',
    resolved: false,
    replies: [
      {
        id: 'reply_004_01',
        authorId: 'student-002',
        authorName: 'Naledi Dlamini',
        authorRole: 'student',
        text: 'Understood. I will reference the UWC Research Ethics Policy (2024 revision, Section 4.2) and include the specific consent form template (EC-FORM-2024-03) with the step-by-step process.',
        createdAt: ts('2025-10-06T14:00:00'),
      },
    ],
    createdAt: ts('2025-10-05T09:30:00'),
    updatedAt: ts('2025-10-06T14:00:00'),
  },
  // Annotations on hdr-004 version 2
  {
    id: 'ann-005',
    versionId: 'dv-004-v2',
    requestId: 'hdr-004',
    documentName: 'Ethics_Application_v1.pdf',
    selectedText: 'waiver of individual informed consent is requested',
    comment: 'The waiver justification needs strengthening. Please reference the specific POPIA sections that support your argument, and add the ethics committee form reference numbers. The committee will want to see explicit regulatory alignment.',
    pageNumber: 1,
    authorId: 'coordinator-001',
    authorName: 'Dr. Fatima Patel',
    authorRole: 'coordinator',
    highlightColor: '#74c0fc',
    resolved: false,
    replies: [],
    createdAt: ts('2025-10-07T11:00:00'),
    updatedAt: ts('2025-10-07T11:00:00'),
  },
];

async function seedAnnotations() {
  console.log('🔑 Signing in as admin...');
  await signInWithEmailAndPassword(auth, 'admin@uwc.ac.za', 'Portal@2026');
  console.log('✅ Authenticated');

  const col = collection(db, 'annotations');

  for (const ann of ANNOTATIONS) {
    const { id, ...data } = ann;
    console.log(`📝 Seeding annotation ${id} → ${data.documentName} (${data.selectedText.slice(0, 40)}...)`);
    await setDoc(doc(col, id), data);
  }

  console.log(`\n🎉 ${ANNOTATIONS.length} annotations seeded successfully!`);
  process.exit(0);
}

seedAnnotations().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
