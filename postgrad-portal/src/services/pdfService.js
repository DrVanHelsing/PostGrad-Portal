// ============================================
// PDF Generation Service (jsPDF)
// Generates final signed PDF for approved HD requests
// ============================================

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const UWC_NAVY = [0, 51, 102];
const UWC_GOLD = [204, 153, 0];

/**
 * Generate a professional PDF for an approved HD request.
 * @param {Object} request – the HD request document
 * @param {Object} opts – { getUserById, studentProfile }
 * @returns {Blob} PDF blob
 */
export function generateRequestPdf(request, opts = {}) {
  const { getUserById, studentProfile } = opts;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // ── Header ──
  doc.setFillColor(...UWC_NAVY);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('University of the Western Cape', pageWidth / 2, 16, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Postgraduate Request Portal – Official Document', pageWidth / 2, 26, { align: 'center' });

  // Gold accent line
  doc.setFillColor(...UWC_GOLD);
  doc.rect(0, 40, pageWidth, 2, 'F');

  y = 55;
  doc.setTextColor(0, 0, 0);

  // ── Document Title ──
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(request.title || 'Higher Degree Request', 14, y);
  y += 8;

  // ── Reference ──
  if (request.referenceNumber) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Reference: ${request.referenceNumber}`, 14, y);
    y += 6;
  }

  // ── Status banner ──
  doc.setFillColor(230, 245, 230);
  doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'F');
  doc.setTextColor(34, 120, 34);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const statusText = request.status === 'approved' ? 'APPROVED' : request.status?.replace(/_/g, ' ').toUpperCase();
  doc.text(`Status: ${statusText}`, 18, y + 7);
  y += 18;

  // ── Request Details Table ──
  doc.setTextColor(0, 0, 0);
  const student = getUserById?.(request.studentId);
  const supervisor = getUserById?.(request.supervisorId);
  const coSupervisor = request.coSupervisorId ? getUserById?.(request.coSupervisorId) : null;

  const detailRows = [
    ['Request Type', formatType(request.type)],
    ['Student Name', request.studentName || student?.name || '—'],
    ['Student Number', student?.studentNumber || '—'],
    ['Department', student?.department || '—'],
  ];

  if (studentProfile) {
    detailRows.push(['Programme', studentProfile.programme || '—']);
    detailRows.push(['Degree', studentProfile.degree || '—']);
  }

  detailRows.push(
    ['Primary Supervisor', supervisor?.name || '—'],
    ...(coSupervisor ? [['Co-Supervisor', coSupervisor.name]] : []),
    ['Date Created', formatPdfDate(request.createdAt)],
    ['Date Approved', formatPdfDate(request.updatedAt)],
  );

  if (request.fhdOutcome) detailRows.push(['Faculty Board Outcome', request.fhdOutcome.replace(/_/g, ' ').toUpperCase()]);
  if (request.shdOutcome) detailRows.push(['Senate Board Outcome', request.shdOutcome.replace(/_/g, ' ').toUpperCase()]);
  if (request.referenceNumber) detailRows.push(['Reference Number', request.referenceNumber]);

  doc.autoTable({
    startY: y,
    head: [['Field', 'Details']],
    body: detailRows,
    theme: 'grid',
    headStyles: { fillColor: UWC_NAVY, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Description ──
  if (request.description) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(request.description, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4.5 + 8;
  }

  // ── Signatures ──
  if (request.signatures?.length > 0) {
    // Check if we need a new page
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Digital Signatures', 14, y);
    y += 4;

    const sigRows = request.signatures.map(s => [
      s.role?.charAt(0).toUpperCase() + s.role?.slice(1).replace(/-/g, ' '),
      s.name || '—',
      formatPdfDate(s.date),
      'Verified',
    ]);

    doc.autoTable({
      startY: y,
      head: [['Role', 'Name', 'Date', 'Status']],
      body: sigRows,
      theme: 'grid',
      headStyles: { fillColor: UWC_NAVY, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;
  }

  // ── Workflow History ──
  if (request.versions?.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Workflow History', 14, y);
    y += 4;

    const histRows = request.versions.map(v => [
      `v${v.version}`,
      v.action,
      getUserById?.(v.by)?.name || v.by || '—',
      formatPdfDate(v.date),
    ]);

    doc.autoTable({
      startY: y,
      head: [['#', 'Action', 'By', 'Date']],
      body: histRows,
      theme: 'grid',
      headStyles: { fillColor: UWC_NAVY, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 12 } },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;
  }

  // ── Attached Documents ──
  if (request.documents?.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Attached Documents', 14, y);
    y += 4;

    const docRows = request.documents.map(d => [d.name, d.size || '—', d.url ? 'Available' : 'N/A']);
    doc.autoTable({
      startY: y,
      head: [['Document', 'Size', 'Download']],
      body: docRows,
      theme: 'grid',
      headStyles: { fillColor: UWC_NAVY, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 12;
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...UWC_NAVY);
    doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(
      `PostGrad Portal – University of the Western Cape | Generated: ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

/* ── Helpers ── */
function formatPdfDate(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
}

const TYPE_LABELS = {
  title_registration: 'Title Registration',
  registration: 'Registration',
  progress_report: 'Progress Report',
  extension: 'Extension',
  leave_of_absence: 'Leave of Absence',
  examination_entry: 'Examination Entry',
  supervisor_change: 'Supervisor Change',
};

function formatType(type) {
  return TYPE_LABELS[type] || type || '—';
}
