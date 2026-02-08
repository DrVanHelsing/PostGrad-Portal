/**
 * Generate the 6 missing PDF documents that are referenced in seed-document-versions.mjs
 * but don't exist on disk. Uses pdf-lib with UWC branding (same style as upload-documents.mjs).
 *
 * Missing files:
 *   1. hdr-001/Publication_Evidence.pdf
 *   2. hdr-002/Literature_Review_Summary.pdf
 *   3. hdr-002/Ethics_Clearance_Application.pdf
 *   4. hdr-004/Informed_Consent_Form.pdf
 *   5. hdr-004/Data_Collection_Protocol.pdf
 *   6. hdr-005/Progress_Report_2025_Dlamini.pdf
 *
 * Usage: node scripts/generate-missing-pdfs.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DOCS = path.resolve(__dirname, '..', 'public', 'documents');

// ── Shared helpers (same as upload-documents.mjs) ──

async function addUWCHeader(page, font, fontBold, title, subtitle) {
  const { width, height } = page.getSize();
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: rgb(0.0, 0.22, 0.55) });
  page.drawText('UNIVERSITY OF THE WESTERN CAPE', { x: 50, y: height - 35, size: 18, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('Private Bag X17, Bellville 7535, South Africa', { x: 50, y: height - 55, size: 9, font, color: rgb(0.85, 0.85, 0.85) });
  page.drawText('Tel: +27 21 959 2911 | www.uwc.ac.za', { x: 50, y: height - 68, size: 9, font, color: rgb(0.85, 0.85, 0.85) });
  let y = height - 110;
  page.drawText(title, { x: 50, y, size: 16, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 22;
  if (subtitle) {
    page.drawText(subtitle, { x: 50, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 18;
  }
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

function saveFile(buffer, requestId, fileName) {
  const dir = path.join(PUBLIC_DOCS, requestId);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  fs.writeFileSync(filePath, uint8);
  console.log(`  + ${requestId}/${fileName} (${(uint8.length / 1024).toFixed(1)} KB)`);
}

// ══════════════════════════════════════════
// 1. Publication Evidence (hdr-001)
// ══════════════════════════════════════════
async function generatePublicationEvidence() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Page 1: Conference paper acceptance
  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Publication Evidence Portfolio', 'Thabo Molefe – PhD Computer Science');

  p1.drawText('1. CONFERENCE PUBLICATION', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;

  // Acceptance letter box
  p1.drawRectangle({ x: 50, y: y - 130, width: 500, height: 145, borderColor: rgb(0, 0.5, 0), borderWidth: 1.5, color: rgb(0.96, 1, 0.96) });
  y -= 10;
  p1.drawText('ACCEPTANCE NOTIFICATION', { x: 70, y, size: 12, font: fontBold, color: rgb(0, 0.5, 0) });
  y -= 18;
  y = drawField(p1, font, fontBold, 'Conference', 'SAICSIT 2025 – South African Institute of Computer Scientists and Information Technologists', 70, y, 100);
  y = drawField(p1, font, fontBold, 'Paper Title', 'ML-Driven Diagnostic Imaging for TB Screening in Resource-Constrained Settings', 70, y, 100);
  y = drawField(p1, font, fontBold, 'Authors', 'Molefe, T. and van der Berg, S.', 70, y, 100);
  y = drawField(p1, font, fontBold, 'Decision', 'ACCEPTED (Full Paper)', 70, y, 100);
  y = drawField(p1, font, fontBold, 'Date', '15 July 2025', 70, y, 100);
  y -= 20;

  p1.drawText('Review Summary:', { x: 50, y, size: 11, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 16;
  y = drawParagraph(p1, font, 'The paper was reviewed by three independent reviewers. All reviewers recommended acceptance, noting the novelty of the approach and its relevance to the African healthcare context. Minor revisions were requested regarding the statistical analysis section, which have been addressed in the camera-ready version.', 50, y, 500);
  y -= 10;

  const reviews = [
    ['Reviewer 1', 'Accept', 'Strong contribution to AI in healthcare. Well-written and methodologically sound.'],
    ['Reviewer 2', 'Accept (minor)', 'Interesting application. Please add confidence intervals to Table 3.'],
    ['Reviewer 3', 'Accept', 'Relevant and timely research for the South African context. Good use of local data.'],
  ];
  for (const [rev, dec, comment] of reviews) {
    p1.drawText(rev, { x: 55, y, size: 9, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
    p1.drawText(`[${dec}]`, { x: 130, y, size: 9, font: fontBold, color: rgb(0, 0.5, 0) });
    y -= 14;
    y = drawParagraph(p1, fontItalic, comment, 55, y, 490, 9);
    y -= 8;
  }

  y -= 10;
  p1.drawText('2. JOURNAL SUBMISSION (Under Review)', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawField(p1, font, fontBold, 'Journal', 'The Lancet Digital Health', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Title', 'Attention-Enhanced CNNs for Automated TB Screening: A Multi-Site Validation Study', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Submitted', '12 November 2025', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Status', 'Under Peer Review (Round 1)', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Manuscript ID', 'TLDH-2025-4821', 50, y, 120);

  addFooter(p1, font, 1, 1);
  return pdfDoc.save();
}

// ══════════════════════════════════════════
// 2. Literature Review Summary (hdr-002)
// ══════════════════════════════════════════
async function generateLiteratureReviewSummary() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Page 1
  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Literature Review Summary', 'ML-Driven Diagnostic Imaging for TB Screening');

  y = drawField(p1, font, fontBold, 'Student', 'Thabo Molefe (3847291)', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Programme', 'PhD Computer Science', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Supervisor', 'Prof. Sarah van der Berg', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Date', 'January 2026', 50, y, 120);
  y -= 10;

  p1.drawText('1. OVERVIEW', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, font, 'This literature review synthesises 87 peer-reviewed publications spanning the fields of computer-aided detection (CAD), deep learning for medical imaging, and tuberculosis diagnostics. The review is structured thematically, covering: (a) the epidemiology and diagnostic challenges of TB in sub-Saharan Africa, (b) the evolution of CAD systems from traditional feature extraction to deep learning approaches, (c) specific CNN architectures applied to chest radiography, and (d) deployment considerations for resource-constrained settings.', 50, y, 500);
  y -= 10;

  p1.drawText('2. KEY THEMES', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;

  const themes = [
    { title: '2.1 TB Diagnostic Gap in Africa', text: 'WHO (2024) reports that only 61% of estimated TB cases in sub-Saharan Africa are diagnosed. The shortage of trained radiologists (estimated at 1 per 500,000 population in rural areas) creates a critical need for automated screening tools. Studies by Qin et al. (2023) demonstrate that CAD systems can match radiologist sensitivity in high-burden settings.' },
    { title: '2.2 Deep Learning for Chest Radiography', text: 'The field has evolved from early feature-based approaches (Jaeger et al., 2014) to deep CNNs. CheXNet (Rajpurkar et al., 2017) established radiologist-level performance. Recent work focuses on attention mechanisms (Wang et al., 2023) and multi-task learning (Li et al., 2024) for improved localisation and classification.' },
    { title: '2.3 Transfer Learning and Model Efficiency', text: 'EfficientNet (Tan & Le, 2019) and knowledge distillation (Hinton et al., 2015) techniques enable deployment on edge devices. The trade-off between model size and diagnostic accuracy is well-documented, with pruned models retaining 95%+ of full model performance while reducing inference time by 60%.' },
    { title: '2.4 Deployment in Resource-Constrained Settings', text: 'Recent pilots in India (Mahajan et al., 2022) and South Africa (Allen et al., 2021) demonstrate feasibility but highlight challenges: intermittent connectivity, power supply reliability, integration with existing clinical workflows, and the need for culturally appropriate privacy frameworks (POPIA compliance in SA).' },
  ];
  for (const theme of themes) {
    p1.drawText(theme.title, { x: 50, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    y -= 16;
    y = drawParagraph(p1, font, theme.text, 50, y, 500);
    y -= 10;
  }

  p1.drawText('3. IDENTIFIED GAP', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, font, 'While existing CAD systems show promise, no study has combined attention-enhanced architectures with edge-optimised deployment specifically validated in South African clinical settings. This research addresses this gap by developing and validating a lightweight model tailored for Western Cape healthcare facilities.', 50, y, 500);

  addFooter(p1, font, 1, 1);
  return pdfDoc.save();
}

// ══════════════════════════════════════════
// 3. Ethics Clearance Application (hdr-002)
// ══════════════════════════════════════════
async function generateEthicsClearanceApplication() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Ethics Clearance Application', 'Biomedical Research Ethics Committee (BMREC)');

  y = drawField(p1, font, fontBold, 'Protocol Number', 'BM25/3/12', 50, y, 150);
  y = drawField(p1, font, fontBold, 'Project Title', 'ML-Driven Diagnostic Imaging for TB Screening', 50, y, 150);
  y = drawField(p1, font, fontBold, 'Applicant', 'Thabo Molefe (3847291)', 50, y, 150);
  y = drawField(p1, font, fontBold, 'Supervisor', 'Prof. Sarah van der Berg', 50, y, 150);
  y = drawField(p1, font, fontBold, 'Faculty', 'Natural Sciences', 50, y, 150);
  y = drawField(p1, font, fontBold, 'Risk Level', 'Medium (de-identified human data)', 50, y, 150);
  y = drawField(p1, font, fontBold, 'Date Submitted', '15 January 2026', 50, y, 150);
  y -= 10;

  const sections = [
    { title: '1. Study Design', text: 'Retrospective analysis of de-identified medical imaging data from two tertiary hospitals in the Western Cape. No direct patient contact. All images are anonymised at source by hospital radiography staff before transfer to the research team.' },
    { title: '2. Data Sources', text: 'Primary: 12,000 de-identified chest X-ray images from Tygerberg Hospital and Groote Schuur Hospital (2020-2025). Secondary: 3,000 images from the NIH ChestX-ray14 public repository for cross-validation.' },
    { title: '3. Informed Consent', text: 'A waiver of individual informed consent is requested as the data is: (a) retrospective and fully de-identified, (b) impracticable to obtain consent from approximately 12,000 individuals, and (c) poses minimal risk. Institutional consent is documented via data sharing agreements with both hospitals.' },
    { title: '4. Data Protection (POPIA Compliance)', text: 'All data stored on encrypted university servers. No personally identifiable information collected. DICOM headers stripped before transfer. Research outputs reported in aggregate only. Data deletion scheduled for December 2027.' },
    { title: '5. Risk Assessment', text: 'Primary risk: potential re-identification via rare pathology patterns. Mitigation: metadata removal, data minimisation, restricted access (PI + 2 researchers only), secure deletion post-study. Residual risk assessed as LOW.' },
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

// ══════════════════════════════════════════
// 4. Informed Consent Form (hdr-004)
// ══════════════════════════════════════════
async function generateInformedConsentForm() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Informed Consent Form', 'Research Ethics Compliance Document');

  y = drawField(p1, font, fontBold, 'Study Title', 'ML Applications in Healthcare Diagnostics', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Researcher', 'Thabo Molefe', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Supervisor', 'Prof. Sarah van der Berg', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Protocol No.', 'BM25/3/12', 50, y, 120);
  y = drawField(p1, font, fontBold, 'Version', '2.0 (Revised for minors)', 50, y, 120);
  y -= 10;

  const sections = [
    { title: '1. Purpose of the Study', text: 'You are invited to participate in a research study that aims to develop and evaluate machine learning algorithms for automated analysis of medical imaging data. The study seeks to improve early detection of tuberculosis from chest X-ray images.' },
    { title: '2. What Participation Involves', text: 'Your existing medical imaging records (chest X-rays) will be used in this study. No additional procedures, tests, or visits are required. Your images will be anonymised before use, meaning your personal identity will not be linked to any images used in the research.' },
    { title: '3. Risks and Benefits', text: 'Risks: Minimal. There is a very small risk that anonymised images could theoretically be re-identified, although multiple safeguards are in place to prevent this. Benefits: You will not receive direct benefit, but the research may improve TB diagnosis for future patients in South Africa.' },
    { title: '4. Confidentiality', text: 'Your personal information will be kept strictly confidential. Images are anonymised by removing all identifying information (name, ID number, date of birth) before the research team accesses them. Data is stored on encrypted, password-protected university servers. Only the research team (3 persons) has access.' },
    { title: '4.3 Guardian Consent for Minors', text: 'If the participant is under 18 years of age, a parent or legal guardian must provide consent on their behalf. The minor should also provide assent (agreement) if they are old enough to understand the study (typically age 12 and above). A separate assent form is available.' },
    { title: '5. Voluntary Participation', text: 'Participation is entirely voluntary. You may withdraw consent at any time without penalty or loss of benefits. If you withdraw, any images already anonymised and included in analysis will not be removed, as re-identification is not possible.' },
  ];
  for (const s of sections) {
    p1.drawText(s.title, { x: 50, y, size: 11, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
    y -= 16;
    y = drawParagraph(p1, font, s.text, 50, y, 500);
    y -= 8;
  }

  y -= 10;
  p1.drawText('CONSENT DECLARATION', { x: 50, y, size: 12, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 18;
  y = drawParagraph(p1, font, 'I have read and understood the information above. I have had the opportunity to ask questions and have received satisfactory answers. I voluntarily agree to participate in this study.', 50, y, 500);
  y -= 20;
  p1.drawText('Participant Signature: ________________________     Date: ___/___/2026', { x: 50, y, size: 10, font });
  y -= 18;
  p1.drawText('Guardian Signature (if under 18): ________________________     Date: ___/___/2026', { x: 50, y, size: 10, font });
  y -= 18;
  p1.drawText('Researcher Signature: ________________________     Date: ___/___/2026', { x: 50, y, size: 10, font });

  addFooter(p1, font, 1, 1);
  return pdfDoc.save();
}

// ══════════════════════════════════════════
// 5. Data Collection Protocol (hdr-004)
// ══════════════════════════════════════════
async function generateDataCollectionProtocol() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Data Collection Protocol', 'Study BM25/3/12 – ML Healthcare Diagnostics');

  y = drawField(p1, font, fontBold, 'Principal Investigator', 'Thabo Molefe', 50, y, 160);
  y = drawField(p1, font, fontBold, 'Supervisor', 'Prof. Sarah van der Berg', 50, y, 160);
  y = drawField(p1, font, fontBold, 'Protocol Version', '2.0', 50, y, 160);
  y = drawField(p1, font, fontBold, 'Effective Date', '1 February 2026', 50, y, 160);
  y -= 10;

  const sections = [
    { title: '1. Data Sources', text: 'Images will be obtained from two sources: (A) Tygerberg Hospital PACS archive - 8,000 posterior-anterior chest X-rays from adult patients (2020-2025), and (B) Groote Schuur Hospital PACS archive - 4,000 images from adults and paediatric patients (2021-2025).' },
    { title: '2. Inclusion Criteria', text: 'PA chest X-rays of diagnostic quality; patients aged 12 and above; images with confirmed pathology status (GeneXpert-confirmed TB positive, or clinically confirmed negative); images taken with digital radiography equipment.' },
    { title: '3. Exclusion Criteria', text: 'Lateral or AP views; severely degraded images (motion artifact, gross under/over-exposure); images from patients who have withdrawn consent; duplicate images from the same patient encounter.' },
    { title: '4. Anonymisation Procedure', text: 'Step 1: Hospital radiology staff export images from PACS. Step 2: DICOM header stripping using PyDICOM library (removal of patient name, ID, DOB, all UIDs). Step 3: Assignment of random study ID (format: UWC-TB-XXXXX). Step 4: Transfer to research server via secure encrypted channel (SFTP). Step 5: Verification of anonymisation completeness by independent check.' },
    { title: '5. Data Storage and Security', text: 'All data stored on UWC Research Computing Server (RCS). Access restricted to PI and two approved researchers via multi-factor authentication. Nightly encrypted backups. No data stored on personal devices, removable media, or cloud services. Server located in UWC data centre (physically secured, access-controlled).' },
    { title: '6. Data Management Plan', text: 'Raw images stored in DICOM format. Processed images stored as PNG (512x512 pixels, 8-bit grayscale). Metadata stored in PostgreSQL database on same server. All processing scripts version-controlled in private Git repository. Data retention: 5 years post-study completion, then secure deletion with documented verification.' },
    { title: '7. Quality Assurance', text: 'Random 5% sample audited monthly for anonymisation completeness. Image quality assessment using automated metrics (SNR, contrast). Inter-rater reliability testing for manual annotations (target kappa > 0.85). Protocol deviations logged and reported to BMREC within 7 days.' },
  ];
  for (const s of sections) {
    p1.drawText(s.title, { x: 50, y, size: 11, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
    y -= 16;
    y = drawParagraph(p1, font, s.text, 50, y, 500);
    y -= 8;
  }

  addFooter(p1, font, 1, 1);
  return pdfDoc.save();
}

// ══════════════════════════════════════════
// 6. Progress Report for Amahle Dlamini (hdr-005)
// ══════════════════════════════════════════
async function generateProgressReportDlamini() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Annual Progress Report - 2025', 'Department of Computer Science');

  y = drawField(p1, font, fontBold, 'Student Name', 'Amahle Dlamini', 50, y);
  y = drawField(p1, font, fontBold, 'Student Number', '3856712', 50, y);
  y = drawField(p1, font, fontBold, 'Supervisor', 'Dr. James Okafor', 50, y);
  y = drawField(p1, font, fontBold, 'Department', 'Computer Science', 50, y);
  y = drawField(p1, font, fontBold, 'Programme', 'MSc Data Science', 50, y);
  y = drawField(p1, font, fontBold, 'Reporting Period', '1 January 2025 - 31 December 2025', 50, y);
  y = drawField(p1, font, fontBold, 'Date Submitted', '20 January 2026', 50, y);
  y -= 10;

  p1.drawText('1. EXECUTIVE SUMMARY', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, font, 'This report summarises research progress for the 2025 academic year. The study investigates the application of Natural Language Processing (NLP) techniques for multilingual sentiment analysis of South African social media data, with a focus on isiZulu, isiXhosa, and Afrikaans text. Key achievements include the development of a novel tokenisation approach for agglutinative languages, collection of a 50,000-tweet annotated dataset, and a baseline BERT model achieving 78.4% accuracy on the multilingual sentiment classification task.', 50, y, 500);
  y -= 10;

  p1.drawText('2. COMPLETED ACTIVITIES', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  const activities = [
    'Completed comprehensive literature review on NLP for low-resource African languages',
    'Developed custom tokeniser for isiZulu and isiXhosa (handles noun class prefixes and agglutination)',
    'Collected and annotated 50,000 tweets in three languages using crowd-sourced annotators',
    'Trained baseline multilingual BERT model (mBERT) achieving 78.4% accuracy',
    'Presented poster at the AfricaNLP Workshop (co-located with ICLR 2025)',
    'Completed Research Ethics online training module (CITI Program)',
    'Submitted abstract to the African Conference on Computational Linguistics (AfriCCL 2026)',
  ];
  for (const act of activities) {
    p1.drawText('[x]', { x: 55, y, size: 9, font: fontBold, color: rgb(0, 0.5, 0) });
    y = drawParagraph(p1, font, act, 72, y, 478);
    y -= 3;
  }
  y -= 10;

  p1.drawText('3. CHALLENGES', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, font, 'The primary challenge has been sourcing high-quality annotators for isiZulu sentiment. Many social media posts contain code-switching between English and isiZulu, which complicates annotation consistency. Inter-annotator agreement (Fleiss kappa) was initially 0.62 but improved to 0.78 after two rounds of annotator training. Additionally, Twitter API access changes in mid-2025 required migrating data collection to alternative APIs.', 50, y, 500);

  y -= 15;
  p1.drawText('4. PLAN FOR NEXT PERIOD', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  const plans = [
    'Fine-tune AfroXLMR (African-specific transformer) and compare with mBERT baseline',
    'Implement custom attention mechanism for code-switched text',
    'Expand dataset to 100,000 annotated examples',
    'Begin thesis writing - Chapters 1-3 (Literature Review, Methodology, Data Collection)',
    'Submit journal paper to Natural Language Engineering',
  ];
  for (const p of plans) {
    p1.drawText('>', { x: 55, y, size: 10, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
    y = drawParagraph(p1, font, p, 72, y, 478);
    y -= 3;
  }
  addFooter(p1, font, 1, 1);

  return pdfDoc.save();
}

// ══════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════
async function main() {
  console.log('Generating 6 missing PDF documents...\n');

  const files = [
    { requestId: 'hdr-001', name: 'Publication_Evidence.pdf', gen: generatePublicationEvidence },
    { requestId: 'hdr-002', name: 'Literature_Review_Summary.pdf', gen: generateLiteratureReviewSummary },
    { requestId: 'hdr-002', name: 'Ethics_Clearance_Application.pdf', gen: generateEthicsClearanceApplication },
    { requestId: 'hdr-004', name: 'Informed_Consent_Form.pdf', gen: generateInformedConsentForm },
    { requestId: 'hdr-004', name: 'Data_Collection_Protocol.pdf', gen: generateDataCollectionProtocol },
    { requestId: 'hdr-005', name: 'Progress_Report_2025_Dlamini.pdf', gen: generateProgressReportDlamini },
  ];

  for (const f of files) {
    try {
      const buffer = await f.gen();
      saveFile(buffer, f.requestId, f.name);
    } catch (err) {
      console.error(`  X ${f.requestId}/${f.name}: ${err.message}`);
    }
  }

  console.log('\nDone! All missing PDFs generated.');
}

main().catch(err => { console.error(err); process.exit(1); });
