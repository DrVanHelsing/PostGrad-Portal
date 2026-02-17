/**
 * Generate 4 missing PDF files referenced by thesis_submissions seed data.
 *
 * Missing:
 *   1. hdr-002/Progress_Report_2025.pdf
 *   2. hdr-002/Publication_Evidence.pdf
 *   3. hdr-001/Title_Registration_Form.pdf
 *   4. hdr-009/Progress_Report_SD_2025.pdf
 *
 * Usage: node scripts/generate-thesis-pdfs.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DOCS = path.resolve(__dirname, '..', 'public', 'documents');

/* ── Shared helpers ── */

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

function drawField(page, font, fontBold, label, value, x, y, labelWidth = 180) {
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
  console.log(`  ✓ ${requestId}/${fileName} (${(uint8.length / 1024).toFixed(1)} KB)`);
}

/* ══════════════════════════════════════════
   1. hdr-002/Progress_Report_2025.pdf
   ══════════════════════════════════════════ */
async function gen_hdr002_ProgressReport() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Annual Progress Report 2025', 'Aisha Moosa – MSc Computer Science');
  y = drawField(p1, font, fontBold, 'Student Number', '3845921', 50, y);
  y = drawField(p1, font, fontBold, 'Programme', 'MSc Computer Science (Full Thesis)', 50, y);
  y = drawField(p1, font, fontBold, 'Supervisor', 'Dr. James Nkosi', 50, y);
  y = drawField(p1, font, fontBold, 'Reporting Period', 'January 2025 – December 2025', 50, y);
  y = drawField(p1, font, fontBold, 'Registration Year', '2024', 50, y);
  y -= 10;
  p1.drawText('1. Research Progress Summary', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, font, 'During the 2025 academic year, significant progress was made on the research project "NLP-Driven Sentiment Analysis for South African Social Media Platforms". The literature review has been completed covering 95 papers across sentiment analysis, multilingual NLP, and South African linguistic contexts. A novel multilingual tokenization approach has been developed that handles code-switching between English, isiXhosa, and Afrikaans.', 50, y, 495);
  y -= 10;
  p1.drawText('2. Milestones Achieved', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  const milestones = [
    'Literature review chapter completed and approved by supervisor',
    'Research proposal approved by Faculty Board (March 2025)',
    'Ethics clearance obtained (EC-2025-0234)',
    'Data collection completed: 50,000 social media posts collected',
    'Preliminary model trained with 78% accuracy on validation set',
    'One conference paper submitted to SAICSIT 2025',
  ];
  for (const m of milestones) {
    p1.drawText(`•  ${m}`, { x: 60, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
    y -= 16;
  }
  y -= 10;
  p1.drawText('3. Challenges and Mitigation', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, font, 'The primary challenge has been the lack of labeled training data for isiXhosa sentiment. This was mitigated through a manual annotation process involving three native speakers. Inter-annotator agreement (Cohen\'s kappa) reached 0.82 after two rounds of calibration.', 50, y, 495);

  // Page 2
  const p2 = pdfDoc.addPage([595, 842]);
  let y2 = 790;
  p2.drawText('4. Planned Activities (2026)', { x: 50, y: y2, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y2 -= 20;
  const planned = [
    'Complete model optimization and hyperparameter tuning (Q1 2026)',
    'Write results and discussion chapter (Q1-Q2 2026)',
    'Submit journal paper to SAJIC (Q2 2026)',
    'Complete full thesis draft (Q3 2026)',
    'Submit for examination (Q4 2026)',
  ];
  for (const p of planned) {
    p2.drawText(`•  ${p}`, { x: 60, y: y2, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
    y2 -= 16;
  }
  y2 -= 10;
  p2.drawText('5. Supervisor\'s Assessment', { x: 50, y: y2, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y2 -= 20;
  y2 = drawParagraph(p2, font, 'Ms Moosa has made excellent progress during her first full year of study. The research methodology is sound and the preliminary results are encouraging. I am satisfied that she is on track for completion within the prescribed period. I recommend continued registration.', 50, y2, 495);
  y2 -= 20;
  y2 = drawField(p2, font, fontBold, 'Supervisor Signature', '____________________', 50, y2);
  y2 = drawField(p2, font, fontBold, 'Date', '15 December 2025', 50, y2);

  addFooter(p1, font, 1, 2);
  addFooter(p2, font, 2, 2);

  const bytes = await pdfDoc.save();
  saveFile(bytes, 'hdr-002', 'Progress_Report_2025.pdf');
}

/* ══════════════════════════════════════════
   2. hdr-002/Publication_Evidence.pdf
   ══════════════════════════════════════════ */
async function gen_hdr002_PublicationEvidence() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Publication Evidence Portfolio', 'Aisha Moosa – MSc Computer Science');
  y = drawField(p1, font, fontBold, 'Student Number', '3845921', 50, y);
  y = drawField(p1, font, fontBold, 'Supervisor', 'Dr. James Nkosi', 50, y);
  y -= 10;

  p1.drawText('1. Conference Paper', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  p1.drawText('Moosa, A., & Nkosi, J. (2025).', { x: 60, y, size: 10, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
  y -= 16;
  y = drawParagraph(p1, fontItalic, '"Multilingual Sentiment Analysis for South African Social Media: A Code-Switching Approach."', 60, y, 480, 10);
  y = drawParagraph(p1, font, 'Proceedings of the South African Institute of Computer Scientists and Information Technologists (SAICSIT 2025), Cape Town, South Africa, pp. 112-121.', 60, y, 480, 10);
  y -= 5;
  y = drawField(p1, font, fontBold, 'Status', 'Accepted – Presented September 2025', 60, y);
  y = drawField(p1, font, fontBold, 'DOI', '10.1145/3628797.3628812', 60, y);
  y -= 10;

  p1.drawText('2. Journal Submission (In Review)', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  p1.drawText('Moosa, A., & Nkosi, J. (2025).', { x: 60, y, size: 10, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
  y -= 16;
  y = drawParagraph(p1, fontItalic, '"A Novel Tokenization Framework for Code-Switched South African Languages in Social Media NLP."', 60, y, 480, 10);
  y = drawParagraph(p1, font, 'South African Journal of Information Communication (SAJIC). Submitted October 2025.', 60, y, 480, 10);
  y -= 5;
  y = drawField(p1, font, fontBold, 'Status', 'Under Review', 60, y);
  y -= 10;

  p1.drawText('3. Poster Presentation', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, font, 'Poster presented at the UWC Faculty of Natural Sciences Research Day (August 2025). Title: "Bridging Languages: NLP for Multilingual South African Social Media". Awarded Best Poster in the Computer Science category.', 60, y, 480, 10);

  addFooter(p1, font, 1, 1);

  const bytes = await pdfDoc.save();
  saveFile(bytes, 'hdr-002', 'Publication_Evidence.pdf');
}

/* ══════════════════════════════════════════
   3. hdr-001/Title_Registration_Form.pdf
   ══════════════════════════════════════════ */
async function gen_hdr001_TitleRegistrationForm() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Title Registration Form', 'Faculty of Natural Sciences – Postgraduate Studies');

  y = drawField(p1, font, fontBold, 'Student Name', 'Thabo Molefe', 50, y);
  y = drawField(p1, font, fontBold, 'Student Number', '3812456', 50, y);
  y = drawField(p1, font, fontBold, 'Programme', 'PhD Computer Science', 50, y);
  y = drawField(p1, font, fontBold, 'Department', 'Computer Science', 50, y);
  y = drawField(p1, font, fontBold, 'Faculty', 'Natural Sciences', 50, y);
  y = drawField(p1, font, fontBold, 'Registration Year', '2024', 50, y);
  y -= 10;

  p1.drawText('Proposed Thesis Title', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, fontBold, '"Machine Learning Applications in Healthcare Diagnostics: A South African Perspective"', 60, y, 480, 11);
  y -= 10;

  p1.drawText('Brief Description of Research', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, font, 'This research aims to develop and evaluate machine learning models for automated diagnosis of tuberculosis and diabetic retinopathy using medical imaging data from South African healthcare facilities. The study focuses on creating models that are robust to the specific imaging conditions and patient demographics found in the South African public health system, with particular emphasis on resource-constrained clinical settings.', 60, y, 480, 10);
  y -= 10;

  p1.drawText('Supervisor Endorsement', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawField(p1, font, fontBold, 'Supervisor', 'Prof. Sarah van der Berg', 50, y);
  y = drawField(p1, font, fontBold, 'Co-Supervisor', 'N/A', 50, y);
  y -= 10;
  y = drawParagraph(p1, font, 'I confirm that I have reviewed the proposed title and research description and consider it appropriate for a PhD-level study. The research topic is viable, the student has the necessary background, and appropriate supervision capacity is available.', 60, y, 480, 10);
  y -= 20;
  y = drawField(p1, font, fontBold, 'Supervisor Signature', '____________________', 50, y);
  y = drawField(p1, font, fontBold, 'Date', '10 March 2024', 50, y);
  y -= 10;

  p1.drawText('Faculty Approval', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawField(p1, font, fontBold, 'Dean / Delegate', '____________________', 50, y);
  y = drawField(p1, font, fontBold, 'Date', '____________________', 50, y);

  addFooter(p1, font, 1, 1);

  const bytes = await pdfDoc.save();
  saveFile(bytes, 'hdr-001', 'Title_Registration_Form.pdf');
}

/* ══════════════════════════════════════════
   4. hdr-009/Progress_Report_SD_2025.pdf
   ══════════════════════════════════════════ */
async function gen_hdr009_ProgressReport() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1
  const p1 = pdfDoc.addPage([595, 842]);
  let y = await addUWCHeader(p1, font, fontBold, 'Annual Progress Report 2025', 'Sipho Dlamini – MSc Information Systems');
  y = drawField(p1, font, fontBold, 'Student Number', '3867234', 50, y);
  y = drawField(p1, font, fontBold, 'Programme', 'MSc Information Systems (Full Thesis)', 50, y);
  y = drawField(p1, font, fontBold, 'Supervisor', 'Prof. Sarah van der Berg', 50, y);
  y = drawField(p1, font, fontBold, 'Reporting Period', 'January 2025 – December 2025', 50, y);
  y = drawField(p1, font, fontBold, 'Registration Year', '2025', 50, y);
  y -= 10;

  p1.drawText('1. Research Progress Summary', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, font, 'The research project "Blockchain-Based Academic Credential Verification Systems" has progressed well in its first year. The research proposal was developed, reviewed, and approved by the Faculty Higher Degrees Committee. A comprehensive literature review covering blockchain technology, credential verification systems, and the South African higher education regulatory framework (SAQA/NQF) has been completed.', 50, y, 495);
  y -= 10;

  p1.drawText('2. Milestones Achieved', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  const milestones = [
    'Research proposal approved by Faculty Board (July 2025)',
    'Literature review chapter drafted and submitted for review',
    'Design Science Research methodology chapter initiated',
    'Attended UWC Blockchain Workshop (April 2025)',
    'Completed Coursera specialization on Blockchain Development',
    'Established contact with SAQA for potential case study collaboration',
  ];
  for (const m of milestones) {
    p1.drawText(`•  ${m}`, { x: 60, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
    y -= 16;
  }
  y -= 10;

  p1.drawText('3. Challenges and Mitigation', { x: 50, y, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y -= 20;
  y = drawParagraph(p1, font, 'The main challenge has been obtaining access to real credential verification data due to privacy concerns (POPIA compliance). This has been mitigated by designing a prototype that works with synthetic but realistic credential data. Discussions with the university\'s registrar office are ongoing for a potential pilot implementation.', 50, y, 495);

  // Page 2
  const p2 = pdfDoc.addPage([595, 842]);
  let y2 = 790;
  p2.drawText('4. Planned Activities (2026)', { x: 50, y: y2, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y2 -= 20;
  const planned = [
    'Complete methodology chapter (Q1 2026)',
    'Develop blockchain prototype for credential verification (Q1-Q2 2026)',
    'Conduct user evaluation study with university staff (Q2 2026)',
    'Write results chapter (Q3 2026)',
    'Complete thesis draft (Q3-Q4 2026)',
    'Submit for examination (Q4 2026)',
  ];
  for (const p of planned) {
    p2.drawText(`•  ${p}`, { x: 60, y: y2, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
    y2 -= 16;
  }
  y2 -= 10;

  p2.drawText('5. Supervisor\'s Assessment', { x: 50, y: y2, size: 13, font: fontBold, color: rgb(0.0, 0.22, 0.55) });
  y2 -= 20;
  y2 = drawParagraph(p2, font, 'Mr Dlamini has made solid progress in his first year of MSc studies. His literature review demonstrates a good understanding of both the blockchain technology landscape and the South African credential verification context. The choice of Design Science Research methodology is appropriate for this applied research project. I recommend continued registration and am optimistic about timely completion.', 50, y2, 495);
  y2 -= 20;
  y2 = drawField(p2, font, fontBold, 'Supervisor Signature', '____________________', 50, y2);
  y2 = drawField(p2, font, fontBold, 'Date', '18 December 2025', 50, y2);

  addFooter(p1, font, 1, 2);
  addFooter(p2, font, 2, 2);

  const bytes = await pdfDoc.save();
  saveFile(bytes, 'hdr-009', 'Progress_Report_SD_2025.pdf');
}

/* ══════════════════════════════════════════ */

async function main() {
  console.log('\n🔧 Generating missing thesis-submission PDFs...\n');
  await gen_hdr002_ProgressReport();
  await gen_hdr002_PublicationEvidence();
  await gen_hdr001_TitleRegistrationForm();
  await gen_hdr009_ProgressReport();
  console.log('\n✅ Done – 4 PDFs generated.\n');
}

main().catch(e => { console.error(e); process.exit(1); });
