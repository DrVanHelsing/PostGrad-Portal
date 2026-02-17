/**
 * Generate Real Documents & Save Locally + Update Firestore
 * Creates realistic PDF, Word, and Excel files for each HD request,
 * saves them to public/documents/{requestId}/, and updates Firestore
 * with URLs that Vite will serve during development.
 *
 * Usage:  node scripts/upload-documents.mjs
 *
 * Prerequisites:
 *   - npm install pdf-lib docx exceljs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DOCS = path.resolve(__dirname, '..', 'public', 'documents');

import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak } from 'docx';
import ExcelJS from 'exceljs';

// ── Firebase config ──
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

// ══════════════════════════════════════════════════════════════
// PDF GENERATORS
// ══════════════════════════════════════════════════════════════

async function addUWCHeader(page, font, fontBold, title, subtitle) {
  const { width, height } = page.getSize();
  // University header bar
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: rgb(0.0, 0.22, 0.55) });
  page.drawText('UNIVERSITY OF THE WESTERN CAPE', { x: 50, y: height - 35, size: 18, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Private Bag X17, Bellville 7535, South Africa', { x: 50, y: height - 55, size: 9, font, color: rgb(0.85, 0.85, 0.85) });
  page.drawText('Tel: +27 21 959 2911 | www.uwc.ac.za', { x: 50, y: height - 68, size: 9, font, color: rgb(0.85, 0.85, 0.85) });

  // Title
  let y = height - 110;
  page.drawText(title, { x: 50, y, size: 16, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 22;
  if (subtitle) {
    page.drawText(subtitle, { x: 50, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 18;
  }
  // Horizontal rule
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.0, 0.22, 0.55) });
  return y - 15;
}

function drawField(page, font, fontBold, label, value, x, y, labelWidth = 160) {
  page.drawText(label + ':', { x, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(String(value || 'N/A'), { x: x + labelWidth, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
  return y - 18;
}

function drawParagraph(page, font, text, x, y, maxWidth, size = 10) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color: rgb(0.15, 0.15, 0.15) });
      currentY -= 15;
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) {
    page.drawText(line, { x, y: currentY, size, font, color: rgb(0.15, 0.15, 0.15) });
    currentY -= 15;
  }
  return currentY;
}

function addFooter(page, font, pageNum, totalPages) {
  const { width } = page.getSize();
  page.drawLine({ start: { x: 50, y: 40 }, end: { x: width - 50, y: 40 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  page.drawText(`Page ${pageNum} of ${totalPages}`, { x: width - 120, y: 25, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('PostGrad Portal - Confidential', { x: 50, y: 25, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
}

// ── 1. Research Proposal PDF ──
async function generateResearchProposal(studentName, title, department) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Page 1: Cover page
  const cover = pdfDoc.addPage([595, 842]); // A4
  const { width: cw, height: ch } = cover.getSize();
  cover.drawRectangle({ x: 0, y: ch - 120, width: cw, height: 120, color: rgb(0.0, 0.22, 0.55) });
  cover.drawText('UNIVERSITY OF THE WESTERN CAPE', { x: 50, y: ch - 50, size: 22, font: fontBold, color: rgb(1, 1, 1) });
  cover.drawText('Faculty of Natural Sciences', { x: 50, y: ch - 78, size: 14, font, color: rgb(0.85, 0.85, 0.85) });
  cover.drawText(`Department of ${department}`, { x: 50, y: ch - 98, size: 12, font, color: rgb(0.85, 0.85, 0.85) });

  cover.drawText('RESEARCH PROPOSAL', { x: 50, y: ch - 200, size: 28, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  cover.drawText(title, { x: 50, y: ch - 240, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

  let y = ch - 300;
  y = drawField(cover, font, fontBold, 'Candidate', studentName, 50, y);
  y = drawField(cover, font, fontBold, 'Department', department, 50, y);
  y = drawField(cover, font, fontBold, 'Degree', 'Doctor of Philosophy (PhD)', 50, y);
  y = drawField(cover, font, fontBold, 'Date', 'January 2026', 50, y);
  y = drawField(cover, font, fontBold, 'Version', '3.0', 50, y);

  cover.drawText('CONFIDENTIAL', { x: 200, y: 80, size: 20, font: fontBold, color: rgb(0.8, 0.0, 0.0), opacity: 0.3 });
  addFooter(cover, font, 1, 4);

  // Page 2: Abstract & Introduction
  const p2 = pdfDoc.addPage([595, 842]);
  y = await addUWCHeader(p2, font, fontBold, 'Research Proposal', `${studentName} - ${department}`);

  p2.drawText('1. ABSTRACT', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p2, font, `This research investigates the application of machine learning algorithms for automated diagnostic imaging in resource-constrained healthcare settings across South Africa. The study focuses on developing convolutional neural network (CNN) architectures optimized for tuberculosis (TB) screening using chest X-ray images. Preliminary results from a dataset of 2,400 anonymized images from Tygerberg Hospital demonstrate a sensitivity of 94.2% and specificity of 91.8%, which meets WHO target product profile specifications for TB triage tests.`, 50, y, 500);
  y -= 10;

  p2.drawText('2. INTRODUCTION & BACKGROUND', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p2, font, `South Africa bears a disproportionate burden of tuberculosis, with an estimated incidence rate of 468 per 100,000 population (WHO, 2024). Early detection remains a critical challenge, particularly in rural and peri-urban clinics where access to trained radiologists is severely limited. Computer-aided detection (CAD) systems leveraging deep learning have shown promise in bridging this diagnostic gap.`, 50, y, 500);
  y -= 10;
  y = drawParagraph(p2, font, `This proposal builds upon recent advances in transfer learning and attention mechanisms to develop a lightweight, deployable model suitable for point-of-care devices. The research extends prior work by incorporating multi-modal data fusion, combining radiographic features with clinical metadata to improve diagnostic accuracy.`, 50, y, 500);
  y -= 10;

  p2.drawText('3. RESEARCH OBJECTIVES', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  const objectives = [
    'To develop and evaluate CNN architectures for automated TB screening from chest X-rays',
    'To optimize model performance for deployment on low-resource edge computing devices',
    'To validate the system in a clinical setting at partner hospitals in the Western Cape',
    'To assess the cost-effectiveness and clinical workflow integration feasibility',
  ];
  for (const obj of objectives) {
    p2.drawText('-', { x: 55, y, size: 10, font: fontBold });
    y = drawParagraph(p2, font, obj, 70, y, 480);
    y -= 3;
  }
  addFooter(p2, font, 2, 4);

  // Page 3: Methodology
  const p3 = pdfDoc.addPage([595, 842]);
  y = await addUWCHeader(p3, font, fontBold, 'Research Proposal (cont.)', 'Methodology & Timeline');

  p3.drawText('4. METHODOLOGY', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  p3.drawText('4.1 Data Collection', { x: 50, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 16;
  y = drawParagraph(p3, font, `The primary dataset consists of 12,000 de-identified posterior-anterior (PA) chest X-ray images sourced from Tygerberg Hospital and Groote Schuur Hospital under ethics clearance BM25/3/12. Images are stratified by pathology: normal, TB-positive (confirmed by GeneXpert), and other pulmonary conditions. A secondary validation dataset of 3,000 images from the NIH ChestX-ray14 public repository will be used for cross-domain evaluation.`, 50, y, 500);
  y -= 10;
  p3.drawText('4.2 Model Architecture', { x: 50, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 16;
  y = drawParagraph(p3, font, `We propose a modified EfficientNet-B3 backbone with a custom attention module tailored for pulmonary region-of-interest detection. The model is designed to run inference in under 500ms on ARM-based edge devices (e.g., NVIDIA Jetson Nano). Knowledge distillation from a larger ResNet-152 teacher model will be employed to maintain accuracy while reducing computational requirements.`, 50, y, 500);
  y -= 10;
  p3.drawText('4.3 Evaluation Metrics', { x: 50, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 16;
  y = drawParagraph(p3, font, `Model performance will be evaluated using sensitivity, specificity, AUC-ROC, positive predictive value (PPV), and negative predictive value (NPV). The primary endpoint is meeting or exceeding the WHO target product profile for triage tests: sensitivity >= 95% and specificity >= 80%.`, 50, y, 500);

  y -= 20;
  p3.drawText('5. TIMELINE', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  const timeline = [
    ['Phase', 'Period', 'Activities'],
    ['1', 'Jan - Jun 2024', 'Literature review, ethics clearance, data collection setup'],
    ['2', 'Jul - Dec 2024', 'Data preprocessing, baseline model development'],
    ['3', 'Jan - Jun 2025', 'Model optimization, attention mechanism integration'],
    ['4', 'Jul - Dec 2025', 'Clinical validation at partner hospitals'],
    ['5', 'Jan - Jun 2026', 'Edge deployment, cost-effectiveness analysis'],
    ['6', 'Jul - Dec 2026', 'Thesis writing, publications, final submission'],
  ];
  for (const row of timeline) {
    const isHeader = row[0] === 'Phase';
    const f = isHeader ? fontBold : font;
    const c = isHeader ? rgb(0.0, 0.22, 0.55) : rgb(0.15, 0.15, 0.15);
    p3.drawText(row[0], { x: 55, y, size: 9, font: f, color: c });
    p3.drawText(row[1], { x: 100, y, size: 9, font: f, color: c });
    p3.drawText(row[2], { x: 240, y, size: 9, font: f, color: c });
    y -= 15;
  }
  addFooter(p3, font, 3, 4);

  // Page 4: References
  const p4 = pdfDoc.addPage([595, 842]);
  y = await addUWCHeader(p4, font, fontBold, 'Research Proposal (cont.)', 'References');

  p4.drawText('6. REFERENCES', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  const refs = [
    'WHO (2024). Global Tuberculosis Report 2024. Geneva: World Health Organization.',
    'Rajpurkar, P. et al. (2017). CheXNet: Radiologist-Level Pneumonia Detection on Chest X-Rays with Deep Learning. arXiv:1711.05225.',
    'Tan, M., & Le, Q. V. (2019). EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks. ICML 2019.',
    'Allen, B. et al. (2021). Evaluation of Artificial Intelligence Models for TB Screening in Low-Resource Settings. The Lancet Digital Health, 3(8).',
    'Qin, Z. Z. et al. (2023). Computer-aided detection for tuberculosis screening: a systematic review. The Lancet Respiratory Medicine, 11(1).',
    'South African National Department of Health (2023). National Tuberculosis Management Guidelines. Pretoria.',
    'Hinton, G. et al. (2015). Distilling the Knowledge in a Neural Network. NIPS Deep Learning Workshop.',
    'Chollet, F. (2017). Xception: Deep Learning with Depthwise Separable Convolutions. CVPR 2017.',
  ];
  for (let i = 0; i < refs.length; i++) {
    p4.drawText(`[${i + 1}]`, { x: 55, y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    y = drawParagraph(p4, fontItalic, refs[i], 80, y, 465, 9);
    y -= 5;
  }
  addFooter(p4, font, 4, 4);

  return pdfDoc.save();
}

// ── 2. Progress Report PDF ──
async function generateProgressReport(studentName, studentNumber, supervisor, department, year) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, `Annual Progress Report - ${year}`, `Department of ${department}`);

  y = drawField(p1, font, fontBold, 'Student Name', studentName, 50, y);
  y = drawField(p1, font, fontBold, 'Student Number', studentNumber, 50, y);
  y = drawField(p1, font, fontBold, 'Supervisor', supervisor, 50, y);
  y = drawField(p1, font, fontBold, 'Department', department, 50, y);
  y = drawField(p1, font, fontBold, 'Reporting Period', `1 January ${year} - 31 December ${year}`, 50, y);
  y = drawField(p1, font, fontBold, 'Date Submitted', `15 September ${year}`, 50, y);
  y -= 10;

  p1.drawText('1. EXECUTIVE SUMMARY', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, font, `This report summarises research progress for the ${year} academic year. Significant milestones have been achieved including completion of data collection (Phase 2), successful development of baseline machine learning models achieving 91.8% accuracy, and a peer-reviewed conference publication at SAICSIT ${year}. The project timeline remains on track with minor delays in ethics clearance renewals.`, 50, y, 500);
  y -= 15;

  p1.drawText('2. RESEARCH PROGRESS', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  p1.drawText('2.1 Completed Activities', { x: 50, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 16;
  const activities = [
    'Collected and preprocessed 2,400 chest X-ray images from Tygerberg Hospital',
    'Developed 3 baseline CNN models (ResNet-50, EfficientNet-B3, DenseNet-121)',
    'Achieved best accuracy of 94.2% sensitivity on the validation set',
    'Published paper at SAICSIT 2025 conference proceedings',
    'Completed Python for Data Science workshop (CSIR, 3 days)',
    'Led department journal club discussion on transformer architectures',
  ];
  for (const act of activities) {
    p1.drawText('[x]', { x: 55, y, size: 9, font: fontBold, color: rgb(0, 0.5, 0) });
    y = drawParagraph(p1, font, act, 72, y, 478);
    y -= 3;
  }
  y -= 10;

  p1.drawText('2.2 Challenges Encountered', { x: 50, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  y -= 16;
  y = drawParagraph(p1, font, `The primary challenge has been delays in obtaining additional imaging data from Groote Schuur Hospital due to institutional review board (IRB) backlog from COVID-era processes. This has been partially mitigated by augmenting the training dataset with publicly available NIH ChestX-ray14 images. Ethics clearance renewal is expected by Q1 2026.`, 50, y, 500);

  y -= 15;
  p1.drawText('3. PUBLICATIONS & PRESENTATIONS', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 18;
  y = drawParagraph(p1, font, `- Molefe, T., & van der Berg, S. (${year}). "ML-Driven Diagnostics in Low-Resource Settings." Proc. SAICSIT ${year}.`, 55, y, 490);
  y = drawParagraph(p1, font, `- Molefe, T. (${year}). "Attention Is All You Need for Medical Imaging." Department Journal Club, UWC. (Presented)`, 55, y, 490);
  addFooter(p1, font, 1, 2);

  // Page 2
  const p2 = pdfDoc.addPage([595, 842]);
  y = await addUWCHeader(p2, font, fontBold, `Progress Report (cont.)`, 'Plan & Supervisor Assessment');

  p2.drawText('4. PLAN FOR NEXT PERIOD', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  const nextSteps = [
    'Complete model optimization with attention mechanisms (Q1 2026)',
    'Begin clinical validation at Tygerberg Hospital (Q2 2026)',
    'Deploy prototype on edge device for point-of-care testing (Q2 2026)',
    'Submit journal paper to The Lancet Digital Health (Q3 2026)',
    'Begin thesis writing - Chapters 1-3 draft (Q3 2026)',
  ];
  for (const step of nextSteps) {
    p2.drawText('>', { x: 55, y, size: 10, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
    y = drawParagraph(p2, font, step, 72, y, 478);
    y -= 3;
  }
  y -= 15;

  p2.drawText('5. SUPERVISOR ASSESSMENT', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  p2.drawRectangle({ x: 50, y: y - 80, width: 500, height: 95, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1, color: rgb(0.98, 0.98, 0.98) });
  y -= 5;
  y = drawParagraph(p2, font, `${studentName} has demonstrated excellent progress this reporting period. The research output is of high quality and the conference paper was well received. I am satisfied that the project is on track for completion within the registered period. The data collection delays are acknowledged and the mitigation strategy is appropriate.`, 60, y, 480);
  y -= 15;
  p2.drawText(`- ${supervisor}`, { x: 60, y, size: 10, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
  y -= 15;
  p2.drawText(`Date: 20 September ${year}`, { x: 60, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
  y -= 30;

  p2.drawText('6. OVERALL RATING', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  const ratings = ['Unsatisfactory', 'Below Expectations', 'Satisfactory', 'Good', 'Excellent'];
  for (let i = 0; i < ratings.length; i++) {
    const selected = i === 4; // Excellent
    p2.drawText(selected ? '[X]' : '[ ]', { x: 55, y, size: 10, font: fontBold, color: selected ? rgb(0, 0.5, 0) : rgb(0.5, 0.5, 0.5) });
    p2.drawText(ratings[i], { x: 75, y, size: 10, font: selected ? fontBold : font, color: selected ? rgb(0, 0.4, 0) : rgb(0.4, 0.4, 0.4) });
    y -= 16;
  }
  addFooter(p2, font, 2, 2);

  return pdfDoc.save();
}

// ── 3. Registration Form PDF ──
async function generateRegistrationForm(studentName, studentNumber, programme, supervisor, coSupervisor) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Postgraduate Registration Form', 'Academic Year 2026');

  const fields = [
    ['Surname', studentName.split(' ').pop()],
    ['First Name(s)', studentName.split(' ').slice(0, -1).join(' ')],
    ['Student Number', studentNumber],
    ['ID / Passport Number', '98XXXXX5089XXX'],
    ['Programme', programme],
    ['Faculty', 'Natural Sciences'],
    ['Department', 'Computer Science'],
    ['Year of Study', '2 (second year)'],
    ['Primary Supervisor', supervisor],
    ['Co-Supervisor', coSupervisor || 'N/A'],
    ['Registration Type', 'Full-time'],
    ['Funding Source', 'UWC Postgraduate Bursary'],
    ['Email', `${studentName.split(' ')[0].toLowerCase()}@uwc.ac.za`],
    ['Contact Number', '081-555-1002'],
  ];
  for (const [label, value] of fields) {
    y = drawField(p1, font, fontBold, label, value, 50, y, 180);
  }
  y -= 15;

  p1.drawText('DECLARATION', { x: 50, y, size: 12, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 18;
  y = drawParagraph(p1, font, 'I hereby declare that the information provided is true and correct. I understand that any false information may result in the cancellation of my registration. I agree to abide by the rules and regulations of the University of the Western Cape.', 50, y, 500);
  y -= 25;

  p1.drawText('Student Signature: ________________________', { x: 50, y, size: 10, font });
  p1.drawText('Date: ___/___/2026', { x: 350, y, size: 10, font });
  y -= 25;
  p1.drawText('Supervisor Signature: ________________________', { x: 50, y, size: 10, font });
  p1.drawText('Date: ___/___/2026', { x: 350, y, size: 10, font });

  addFooter(p1, font, 1, 1);
  return pdfDoc.save();
}

// ── 4. Ethics Application PDF ──
async function generateEthicsApplication(studentName, title) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Ethics Clearance Application', 'Biomedical Research Ethics Committee (BMREC)');

  y = drawField(p1, font, fontBold, 'Project Title', title, 50, y, 120);
  y = drawField(p1, font, fontBold, 'Applicant', studentName, 50, y, 120);
  y = drawField(p1, font, fontBold, 'Protocol No.', 'BM25/3/12', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Risk Level', 'Medium (human subject data)', 50, y, 120);
  y -= 10;

  const sections = [
    { title: 'Study Design', text: 'Retrospective analysis of de-identified medical imaging data. No direct patient contact. Images will be sourced from existing hospital PACS archives under a data sharing agreement with Tygerberg Hospital and Groote Schuur Hospital.' },
    { title: 'Participants', text: 'The study involves secondary analysis of existing medical records (chest X-ray images). No direct recruitment of participants. Images are de-identified at source by hospital radiography department staff. Estimated sample: 12,000 images from adult patients (18+) who had chest X-rays taken between 2020-2025.' },
    { title: 'Informed Consent', text: 'A waiver of individual informed consent is requested as: (a) the data is retrospective and de-identified, (b) it is impracticable to obtain consent from approximately 12,000 individuals, (c) the research poses minimal risk. Hospital-level consent has been obtained via the data sharing agreement.' },
    { title: 'Data Protection', text: 'All data will be stored on an encrypted, password-protected university server. No personally identifiable information (name, ID, date of birth) will be collected. Images are anonymized via DICOM header stripping before transfer. Research outputs will be reported in aggregate only. Compliance with POPIA is maintained throughout.' },
    { title: 'Risk Mitigation', text: 'The primary risk is potential re-identification through rare pathology patterns. This is mitigated by: (1) removing all metadata, (2) applying data minimization principles, (3) restricting access to the research team only, (4) secure deletion of data after study completion (planned 2027).' },
  ];
  for (const s of sections) {
    p1.drawText(s.title, { x: 50, y, size: 11, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
    y -= 16;
    y = drawParagraph(p1, font, s.text, 50, y, 500);
    y -= 10;
  }
  addFooter(p1, font, 1, 1);
  return pdfDoc.save();
}

// ── 5. Medical Certificate PDF ──
async function generateMedicalCertificate(studentName) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const p1 = pdfDoc.addPage([595, 842]);
  const { width, height } = p1.getSize();

  // Doctor letterhead
  p1.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: rgb(0.15, 0.45, 0.35) });
  p1.drawText('DR. A. WILLIAMS  MBChB (UCT), FCS (SA)', { x: 50, y: height - 30, size: 14, font: fontBold, color: rgb(1, 1, 1) });
  p1.drawText('Suite 204, Medical Centre, Bellville 7530 | Tel: 021-948-1234', { x: 50, y: height - 48, size: 9, font, color: rgb(0.85, 0.85, 0.85) });

  let y = height - 100;
  p1.drawText('MEDICAL CERTIFICATE', { x: 50, y, size: 18, font: fontBold, color: rgb(0.15, 0.45, 0.35) });
  y -= 30;
  p1.drawText(`Date: 3 February 2026`, { x: 50, y, size: 10, font });
  y -= 25;

  p1.drawText('To Whom It May Concern,', { x: 50, y, size: 11, font: fontBold });
  y -= 25;
  y = drawParagraph(p1, font, `This is to certify that ${studentName} (date of birth: 15/03/1998) presented at my practice on 1 February 2026 with complaints requiring further surgical investigation.`, 50, y, 500);
  y -= 10;
  y = drawParagraph(p1, font, `Following clinical examination and diagnostic imaging (MRI scan dated 28/01/2026), it is my professional opinion that the patient requires orthopaedic surgery followed by a rehabilitation period of approximately 3-4 months.`, 50, y, 500);
  y -= 10;
  y = drawParagraph(p1, font, `The surgery is scheduled for 15 February 2026 at Netcare N1 City Hospital. The patient is expected to achieve full recovery by approximately June 2026, at which time they should be able to resume normal academic activities.`, 50, y, 500);
  y -= 10;
  y = drawParagraph(p1, font, `During the recovery period, the patient will require regular follow-up appointments and physiotherapy sessions, which will limit their capacity for full-time academic engagement.`, 50, y, 500);
  y -= 10;
  y = drawParagraph(p1, font, `I recommend a leave of absence from academic duties for the period February 2026 to July 2026 (one semester) to allow for adequate recovery.`, 50, y, 500);
  y -= 30;
  p1.drawText('Yours faithfully,', { x: 50, y, size: 10, font });
  y -= 25;
  p1.drawText('Dr. A. Williams', { x: 50, y, size: 11, font: fontBold, color: rgb(0.15, 0.45, 0.35) });
  y -= 15;
  p1.drawText('MBChB (UCT), FCS (SA)', { x: 50, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 12;
  p1.drawText('HPCSA Reg: MP0123456', { x: 50, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  // Stamp effect
  p1.drawText('VERIFIED', { x: 380, y: y + 40, size: 22, font: fontBold, color: rgb(0, 0.5, 0), opacity: 0.3, rotate: degrees(-15) });

  return pdfDoc.save();
}

// ── 6. Turnitin Similarity Report PDF ──
async function generateTurnitinReport(studentName, thesisTitle) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const p1 = pdfDoc.addPage([595, 842]);
  const { width, height } = p1.getSize();

  p1.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: rgb(0.0, 0.35, 0.6) });
  p1.drawText('Turnitin', { x: 50, y: height - 35, size: 24, font: fontBold, color: rgb(1, 1, 1) });
  p1.drawText('Originality Report', { x: 50, y: height - 55, size: 12, font, color: rgb(0.85, 0.85, 0.85) });

  let y = height - 100;
  y = drawField(p1, font, fontBold, 'Paper Title', thesisTitle, 50, y, 140);
  y = drawField(p1, font, fontBold, 'Author', studentName, 50, y, 140);
  y = drawField(p1, font, fontBold, 'Submission Date', '1 December 2025', 50, y, 140);
  y = drawField(p1, font, fontBold, 'Paper ID', '2847391057', 50, y, 140);
  y = drawField(p1, font, fontBold, 'Word Count', '28,451', 50, y, 140);
  y -= 15;

  // Similarity score
  p1.drawRectangle({ x: 50, y: y - 70, width: 500, height: 80, borderColor: rgb(0, 0.6, 0), borderWidth: 2, color: rgb(0.95, 1, 0.95) });
  p1.drawText('SIMILARITY INDEX', { x: 70, y: y - 15, size: 12, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
  p1.drawText('12%', { x: 70, y: y - 45, size: 36, font: fontBold, color: rgb(0, 0.6, 0) });
  p1.drawText('ACCEPTABLE - Below 15% threshold', { x: 170, y: y - 40, size: 12, font: fontBold, color: rgb(0, 0.5, 0) });
  y -= 90;

  p1.drawText('Source Breakdown', { x: 50, y, size: 12, font: fontBold, color: rgb(0.0, 0.35, 0.6) });
  y -= 20;
  const sources = [
    ['Internet sources:', '5%', '14 matches'],
    ['Publications:', '4%', '8 matches'],
    ['Student papers:', '3%', '6 matches'],
    ['Excluded (bibliography):', '--', '28 sources excluded'],
    ['Excluded (quotes):', '--', '12 quoted passages excluded'],
  ];
  for (const [src, pct, detail] of sources) {
    p1.drawText(src, { x: 55, y, size: 10, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    p1.drawText(pct, { x: 220, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    p1.drawText(detail, { x: 280, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
    y -= 16;
  }
  y -= 15;
  p1.drawText('Top Matching Sources', { x: 50, y, size: 12, font: fontBold, color: rgb(0.0, 0.35, 0.6) });
  y -= 18;
  const topSources = [
    ['1', '2.1%', 'IEEE Transactions on Medical Imaging, Vol. 42, 2023'],
    ['2', '1.8%', 'WHO Global TB Report 2024 (who.int)'],
    ['3', '1.4%', 'UCT MSc Thesis Repository - "Urban Data Analytics"'],
    ['4', '1.2%', 'arxiv.org - "EfficientNet: Rethinking Model Scaling"'],
    ['5', '0.9%', 'SA Journal of Science, Vol. 121, 2025'],
  ];
  for (const [num, pct, src] of topSources) {
    p1.drawText(`${num}.`, { x: 55, y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    p1.drawText(pct, { x: 75, y, size: 9, font: fontBold, color: rgb(0.0, 0.35, 0.6) });
    p1.drawText(src, { x: 115, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 15;
  }

  return pdfDoc.save();
}

// ── 7. Supervisor Feedback Form PDF ──
async function generateSupervisorFeedback(studentName, supervisorName, requestTitle) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Supervisor Assessment & Feedback Form', 'Faculty of Natural Sciences');

  y = drawField(p1, font, fontBold, 'Student', studentName, 50, y, 140);
  y = drawField(p1, font, fontBold, 'Supervisor', supervisorName, 50, y, 140);
  y = drawField(p1, font, fontBold, 'Request/Report', requestTitle, 50, y, 140);
  y = drawField(p1, font, fontBold, 'Date', 'September 2025', 50, y, 140);
  y -= 10;

  const criteria = [
    ['Research Quality', 'Excellent', 'The candidate demonstrates deep understanding of the domain and applies rigorous methodology.'],
    ['Academic Writing', 'Good', 'Writing is clear and well-structured. Minor improvements needed in literature synthesis.'],
    ['Methodology', 'Excellent', 'Sound experimental design with appropriate statistical analysis.'],
    ['Independence', 'Good', 'Shows increasing independence in problem-solving. Requires less guidance compared to Year 1.'],
    ['Time Management', 'Satisfactory', 'Generally meets deadlines. Data collection delays were external factors.'],
    ['Publication Output', 'Excellent', 'One conference paper published, one journal submission under review - above expectations for this stage.'],
  ];
  for (const [criterion, rating, comment] of criteria) {
    p1.drawText(criterion, { x: 50, y, size: 11, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
    const ratingColor = rating === 'Excellent' ? rgb(0, 0.5, 0) : rating === 'Good' ? rgb(0.0, 0.35, 0.6) : rgb(0.6, 0.4, 0);
    p1.drawText(`[${rating}]`, { x: 250, y, size: 10, font: fontBold, color: ratingColor });
    y -= 16;
    y = drawParagraph(p1, font, comment, 55, y, 490);
    y -= 10;
  }

  y -= 5;
  p1.drawText('Overall Recommendation: APPROVE & FORWARD', { x: 50, y, size: 12, font: fontBold, color: rgb(0, 0.5, 0) });

  return pdfDoc.save();
}

// ══════════════════════════════════════════════════════════════
// WORD DOCUMENT GENERATOR – Examiner Nomination
// ══════════════════════════════════════════════════════════════

async function generateExaminerNomination(studentName, thesisTitle, supervisor) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ children: [new TextRun({ text: 'UNIVERSITY OF THE WESTERN CAPE', bold: true, size: 32, color: '00397E', font: 'Arial' })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: 'Faculty of Natural Sciences', size: 22, color: '666666', font: 'Arial' })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: '-'.repeat(60), color: '00397E' })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'THESIS EXAMINER NOMINATION FORM', bold: true, size: 28, color: '00397E' })] }),
        new Paragraph({ spacing: { after: 200 } }),

        // Student details table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            makeTableRow('Student Name:', studentName),
            makeTableRow('Thesis Title:', thesisTitle),
            makeTableRow('Degree:', 'Master of Science'),
            makeTableRow('Department:', 'Computer Science'),
            makeTableRow('Supervisor:', supervisor),
            makeTableRow('Date of Submission:', '12 December 2025'),
          ],
        }),
        new Paragraph({ spacing: { after: 300 } }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'PROPOSED EXTERNAL EXAMINERS', bold: true, color: '00397E' })] }),
        new Paragraph({ spacing: { after: 100 } }),

        // Examiner 1
        new Paragraph({ children: [new TextRun({ text: 'Examiner 1 (Primary)', bold: true, size: 22 })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            makeTableRow('Name:', 'Prof. Amina Osei-Bonsu'),
            makeTableRow('Title & Affiliation:', 'Professor of Computer Science, University of Ghana'),
            makeTableRow('Email:', 'a.oseibonsu@ug.edu.gh'),
            makeTableRow('Expertise:', 'Data Science, Urban Computing, Geospatial Analytics'),
            makeTableRow('Relationship:', 'No prior relationship with candidate or supervisor'),
          ],
        }),
        new Paragraph({ spacing: { after: 200 } }),

        // Examiner 2
        new Paragraph({ children: [new TextRun({ text: 'Examiner 2 (Secondary)', bold: true, size: 22 })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            makeTableRow('Name:', 'Dr. Robert Chen'),
            makeTableRow('Title & Affiliation:', 'Senior Lecturer, University of Melbourne'),
            makeTableRow('Email:', 'r.chen@unimelb.edu.au'),
            makeTableRow('Expertise:', 'Machine Learning, Smart Cities, Predictive Modelling'),
            makeTableRow('Relationship:', 'No prior relationship with candidate or supervisor'),
          ],
        }),
        new Paragraph({ spacing: { after: 300 } }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'SUPERVISOR MOTIVATION', bold: true, color: '00397E' })] }),
        new Paragraph({ children: [new TextRun({ text: `Both nominated examiners are internationally recognized experts in data science and urban analytics, directly relevant to the thesis topic. Prof. Osei-Bonsu has published extensively on African urban data systems, while Dr. Chen brings expertise in machine learning applications for city planning. Neither has any conflict of interest with the candidate, the supervisor, or the University of the Western Cape.`, size: 20 })], spacing: { after: 200 } }),

        new Paragraph({ spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: 'Supervisor Signature: ________________________     Date: ___/___/2026', size: 20 })] }),
        new Paragraph({ children: [new TextRun({ text: 'HOD Signature: ________________________     Date: ___/___/2026', size: 20 })] }),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}

function makeTableRow(label, value) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Arial' })] })],
        borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' }, left: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' }, right: { style: BorderStyle.NONE } },
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: 'Arial' })] })],
        borders: { top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' } },
      }),
    ],
  });
}

// ══════════════════════════════════════════════════════════════
// EXCEL GENERATOR – Academic Transcript
// ══════════════════════════════════════════════════════════════

async function generateAcademicTranscript(studentName, studentNumber, programme) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'UWC Postgraduate Administration';
  wb.created = new Date();

  const ws = wb.addWorksheet('Transcript', {
    pageSetup: { paperSize: 9, orientation: 'portrait' },
  });

  // Header
  ws.mergeCells('A1:F1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'UNIVERSITY OF THE WESTERN CAPE - ACADEMIC TRANSCRIPT';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF00397E' } };
  titleCell.alignment = { horizontal: 'center' };

  ws.mergeCells('A2:F2');
  ws.getCell('A2').value = 'Faculty of Natural Sciences';
  ws.getCell('A2').font = { name: 'Arial', size: 10, color: { argb: 'FF666666' } };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  // Student info
  const info = [
    ['Student:', studentName, '', 'Programme:', programme, ''],
    ['Student No:', studentNumber, '', 'Status:', 'Active', ''],
    ['Faculty:', 'Natural Sciences', '', 'Year:', '2025', ''],
  ];
  let row = 4;
  for (const r of info) {
    for (let c = 0; c < r.length; c++) {
      const cell = ws.getCell(row, c + 1);
      cell.value = r[c];
      cell.font = { name: 'Arial', size: 10, bold: c % 3 === 0 };
    }
    row++;
  }
  row++;

  // Course table header
  ws.columns = [
    { width: 14 }, { width: 40 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 14 }
  ];

  const headerRow = ws.getRow(row);
  const headers = ['Code', 'Module Name', 'Credits', 'Mark', 'Result', 'Semester'];
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00397E' } };
    cell.alignment = { horizontal: 'center' };
    cell.border = { bottom: { style: 'thin' } };
  });
  row++;

  // Course data
  const courses = [
    ['COS701', 'Advanced Machine Learning', 30, 82, 'DI', 'S1 2024'],
    ['COS702', 'Research Methodology', 15, 78, 'PA', 'S1 2024'],
    ['COS703', 'Statistical Data Analysis', 15, 85, 'DI', 'S1 2024'],
    ['COS711', 'Deep Learning & Neural Networks', 30, 88, 'DI', 'S2 2024'],
    ['COS712', 'Big Data Analytics', 15, 76, 'PA', 'S2 2024'],
    ['COS720', 'Spatial Data Science', 15, 80, 'DI', 'S2 2024'],
    ['COS800', 'MSc Thesis (Year 1 Progress)', 60, null, 'IP', 'S1-S2 2025'],
  ];
  for (const c of courses) {
    const dataRow = ws.getRow(row);
    c.forEach((val, i) => {
      const cell = dataRow.getCell(i + 1);
      cell.value = val ?? '--';
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { horizontal: i >= 2 ? 'center' : 'left' };
      if (i === 4) {
        const color = val === 'DI' ? 'FF006600' : val === 'PA' ? 'FF003399' : 'FF996600';
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: color } };
      }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } } };
    });
    row++;
  }
  row++;

  // Summary
  ws.getCell(row, 1).value = 'Weighted Average:';
  ws.getCell(row, 1).font = { name: 'Arial', size: 11, bold: true };
  ws.getCell(row, 2).value = '82.3%';
  ws.getCell(row, 2).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF006600' } };
  row++;
  ws.getCell(row, 1).value = 'Credits Completed:';
  ws.getCell(row, 1).font = { name: 'Arial', size: 11, bold: true };
  ws.getCell(row, 2).value = '120 / 180';
  ws.getCell(row, 2).font = { name: 'Arial', size: 11 };
  row += 2;

  ws.getCell(row, 1).value = 'Legend: DI = Distinction (75%+), PA = Pass, IP = In Progress, FA = Fail';
  ws.getCell(row, 1).font = { name: 'Arial', size: 8, color: { argb: 'FF999999' } };
  ws.mergeCells(row, 1, row, 6);
  row++;
  ws.getCell(row, 1).value = 'This is an unofficial transcript generated for postgraduate administration purposes.';
  ws.getCell(row, 1).font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF999999' } };
  ws.mergeCells(row, 1, row, 6);

  return wb.xlsx.writeBuffer();
}

// ══════════════════════════════════════════════════════════════
// UPLOAD & FIRESTORE UPDATE
// ══════════════════════════════════════════════════════════════

function saveFileLocally(buffer, requestId, fileName) {
  const dir = path.join(PUBLIC_DOCS, requestId);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  fs.writeFileSync(filePath, uint8);
  // URL that Vite serves from public/
  return `/documents/${requestId}/${fileName}`;
}

// Map of requestId → array of { name, generator, contentType }
const DOCUMENT_MAP = {
  // ── hdr-001: Fully approved progress report (Thabo)
  'hdr-001': [
    { name: 'Progress_Report_2025.pdf', gen: () => generateProgressReport('Thabo Molefe', '3847291', 'Prof. Sarah van der Berg', 'Computer Science', '2025'), type: 'application/pdf' },
    { name: 'Supervisor_Feedback_Form.pdf', gen: () => generateSupervisorFeedback('Thabo Molefe', 'Prof. Sarah van der Berg', 'Annual Progress Report 2025'), type: 'application/pdf' },
  ],
  // ── hdr-002: Title registration in supervisor review (Thabo)
  'hdr-002': [
    { name: 'Research_Proposal_v3.pdf', gen: () => generateResearchProposal('Thabo Molefe', 'ML-Driven Diagnostic Imaging for TB Screening', 'Computer Science'), type: 'application/pdf' },
  ],
  // ── hdr-003: Draft extension (Thabo) – motivation letter
  'hdr-003': [
    { name: 'Extension_Motivation_Letter.pdf', gen: async () => {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const p = pdfDoc.addPage([595, 842]);
      let y = await addUWCHeader(p, font, fontBold, 'Motivation for Extension of Registration', 'Student Request');
      y = drawField(p, font, fontBold, 'Student', 'Thabo Molefe (3847291)', 50, y, 120);
      y = drawField(p, font, fontBold, 'Programme', 'PhD Computer Science', 50, y, 120);
      y = drawField(p, font, fontBold, 'Current End', '31 December 2026', 50, y, 120);
      y = drawField(p, font, fontBold, 'Requested End', '30 June 2027', 50, y, 120);
      y -= 15;
      p.drawText('Motivation:', { x: 50, y, size: 12, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
      y -= 18;
      y = drawParagraph(p, font, 'I am writing to request a 6-month extension to my PhD registration. The extension is necessitated by unanticipated delays in obtaining data from partner hospitals. The ethics committee clearance renewal from Groote Schuur Hospital has been delayed by 4 months due to an institutional review board backlog stemming from COVID-era processes. Additionally, the MRI scanner replacement at Tygerberg Hospital resulted in a 2-month data collection gap. These delays are external to my research activities and I have continued making progress in other aspects of my thesis, including model development and conference publications.', 50, y, 500);
      y -= 15;
      y = drawParagraph(p, font, 'I have discussed this matter with my supervisor, Prof. Sarah van der Berg, who supports this request. The revised timeline is realistic and I am confident of completing all requirements by June 2027.', 50, y, 500);
      y -= 30;
      p.drawText('Thabo Molefe', { x: 50, y, size: 11, font: fontBold });
      y -= 15;
      p.drawText('5 February 2026', { x: 50, y, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
      addFooter(p, font, 1, 1);
      return pdfDoc.save();
    }, type: 'application/pdf' },
  ],
  // ── hdr-004: Ethics referred back (Thabo)
  'hdr-004': [
    { name: 'Ethics_Application_v1.pdf', gen: () => generateEthicsApplication('Thabo Molefe', 'ML Applications in Healthcare Diagnostics'), type: 'application/pdf' },
  ],
  // ── hdr-005: Registration at coordinator (Naledi)
  'hdr-005': [
    { name: 'Registration_Form_2026.pdf', gen: () => generateRegistrationForm('Naledi Khumalo', '3892456', 'MSc Data Science', 'Dr. James Nkosi', 'Prof. Sarah van der Berg'), type: 'application/pdf' },
    { name: 'Academic_Transcript.xlsx', gen: () => generateAcademicTranscript('Naledi Khumalo', '3892456', 'MSc Data Science'), type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  ],
  // ── hdr-006: Thesis exam at FHD (Naledi)
  'hdr-006': [
    { name: 'Turnitin_Report.pdf', gen: () => generateTurnitinReport('Naledi Khumalo', 'Predictive Analytics for Urban Planning in Cape Town'), type: 'application/pdf' },
    { name: 'Examiner_Nomination_Form.docx', gen: () => generateExaminerNomination('Naledi Khumalo', 'Predictive Analytics for Urban Planning in Cape Town', 'Dr. James Nkosi'), type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  ],
  // ── hdr-007: Approved progress report (Naledi)
  'hdr-007': [
    { name: 'Progress_Report_NK_2025.pdf', gen: () => generateProgressReport('Naledi Khumalo', '3892456', 'Dr. James Nkosi', 'Computer Science', '2025'), type: 'application/pdf' },
  ],
  // ── hdr-009: Leave of absence (Sipho)
  'hdr-009': [
    { name: 'Medical_Certificate.pdf', gen: () => generateMedicalCertificate('Sipho Dlamini'), type: 'application/pdf' },
  ],
  // ── hdr-011: Title registration at SHD (Sipho)
  'hdr-011': [
    { name: 'Title_Registration_Form.pdf', gen: async () => {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const p = pdfDoc.addPage([595, 842]);
      let y = await addUWCHeader(p, font, fontBold, 'Title Registration Form', 'Postgraduate Research');
      y = drawField(p, font, fontBold, 'Student', 'Sipho Dlamini (3901234)', 50, y, 160);
      y = drawField(p, font, fontBold, 'Programme', 'MSc Information Systems', 50, y, 160);
      y = drawField(p, font, fontBold, 'Proposed Title', 'Blockchain-based Academic Credential Verification', 50, y, 160);
      y = drawField(p, font, fontBold, 'Supervisor', 'Prof. Sarah van der Berg', 50, y, 160);
      y = drawField(p, font, fontBold, 'Faculty', 'Natural Sciences', 50, y, 160);
      y -= 15;
      p.drawText('Brief Description:', { x: 50, y, size: 12, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
      y -= 18;
      y = drawParagraph(p, font, 'This research investigates the development of a blockchain-based system for verifying academic credentials in South African higher education institutions. The system will use Ethereum smart contracts to create tamper-proof digital records of qualifications, addressing the growing problem of credential fraud. The prototype will be tested with a sample of UWC graduates and evaluated for usability, security, and scalability.', 50, y, 500);
      addFooter(p, font, 1, 1);
      return pdfDoc.save();
    }, type: 'application/pdf' },
  ],
  // ── hdr-012: Progress report at co-supervisor (Sipho)
  'hdr-012': [
    { name: 'Progress_Report_Jan2026.pdf', gen: async () => {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const p = pdfDoc.addPage([595, 842]);
      let y = await addUWCHeader(p, font, fontBold, 'Semi-Annual Progress Report', 'January 2026');
      y = drawField(p, font, fontBold, 'Student', 'Sipho Dlamini (3901234)', 50, y, 140);
      y = drawField(p, font, fontBold, 'Period', 'July 2025 - January 2026', 50, y, 140);
      y = drawField(p, font, fontBold, 'Supervisor', 'Prof. Sarah van der Berg', 50, y, 140);
      y -= 15;
      p.drawText('Summary of Progress:', { x: 50, y, size: 12, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
      y -= 18;
      y = drawParagraph(p, font, 'This report covers the second half of my first year. Key achievements include: (1) Completion of the first working prototype of the credential verification smart contract deployed on the Ethereum Goerli testnet, (2) Submission of full draft of Literature Review chapter, (3) Abstract submission for SATNAC 2026, (4) Completion of Department Seminar presentation, and (5) Completion of Solidity development certification.', 50, y, 500);
      y -= 10;
      y = drawParagraph(p, font, 'The prototype successfully verifies academic credentials in under 3 seconds with gas costs below 0.002 ETH per verification. Initial user testing with 15 participants showed a System Usability Scale (SUS) score of 72.5, indicating acceptable usability. Next steps include expanding the smart contract to support batch verification and integrating with the South African Qualifications Authority (SAQA) database API.', 50, y, 500);
      addFooter(p, font, 1, 1);
      return pdfDoc.save();
    }, type: 'application/pdf' },
  ],
};

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════

async function main() {
  console.log('========================================================');
  console.log('  Generate Documents & Update Firestore - PostGrad Portal');
  console.log('========================================================\n');

  // Clean previous output
  if (fs.existsSync(PUBLIC_DOCS)) {
    fs.rmSync(PUBLIC_DOCS, { recursive: true });
  }
  fs.mkdirSync(PUBLIC_DOCS, { recursive: true });

  // Auth (needed for Firestore updates)
  console.log('[0] Authenticating...');
  await signInWithEmailAndPassword(auth, 'admin@uwc.ac.za', 'Portal@2026');
  console.log('    OK\n');

  let totalFiles = 0;
  let errors = 0;

  for (const [requestId, docs] of Object.entries(DOCUMENT_MAP)) {
    console.log(`[${requestId}] Generating ${docs.length} document(s)...`);
    const updatedDocuments = [];

    for (const { name, gen, type } of docs) {
      try {
        const buffer = await gen();
        const size = buffer.byteLength || buffer.length;
        const sizeKB = (size / 1024).toFixed(1);

        // Save locally under public/documents/{requestId}/
        const url = saveFileLocally(buffer, requestId, name);

        updatedDocuments.push({
          name,
          size: `${sizeKB} KB`,
          uploadedAt: new Date().toISOString(),
          type,
          url,
        });

        console.log(`    + ${name} (${sizeKB} KB)`);
        totalFiles++;
      } catch (err) {
        console.error(`    X ${name}: ${err.message}`);
        errors++;
      }
    }

    // Update Firestore hdRequest with document URLs
    if (updatedDocuments.length > 0) {
      try {
        await updateDoc(doc(db, 'hdRequests', requestId), { documents: updatedDocuments });
        console.log(`    -> Firestore updated`);
      } catch (err) {
        console.error(`    X Firestore update failed: ${err.message}`);
        errors++;
      }
    }
  }

  console.log(`\nDone! ${totalFiles} files saved to public/documents/, ${errors} errors.`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('✗ Failed:', err.message);
  process.exit(1);
});
