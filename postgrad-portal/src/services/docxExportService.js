// ============================================
// Word Document Export Service
// Generates .docx files from form data + template schema
// Uses 'docx' library to create programmatic Word documents
// that visually match the original FHD Word templates
// ============================================

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, ImageRun,
  Header, Footer, PageNumber, NumberFormat, ShadingType,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';

const UWC_NAVY = '003366';
const UWC_GOLD = 'CC9900';
const FONT = 'Times New Roman';
const FONT_SIZE = 22; // half-points (11pt)
const HEADING_SIZE = 28; // 14pt
const BORDER_STYLE = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const CELL_MARGINS = { top: convertInchesToTwip(0.04), bottom: convertInchesToTwip(0.04), left: convertInchesToTwip(0.08), right: convertInchesToTwip(0.08) };

/* ── Helpers ── */

function txt(text, opts = {}) {
  return new TextRun({
    text: text || '',
    font: FONT,
    size: opts.size || FONT_SIZE,
    bold: opts.bold || false,
    italics: opts.italics || false,
    underline: opts.underline ? {} : undefined,
    color: opts.color || '000000',
    break: opts.break,
  });
}

function para(children, opts = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [children],
    alignment: opts.alignment || AlignmentType.LEFT,
    spacing: { after: opts.spacingAfter ?? 100, before: opts.spacingBefore ?? 0 },
    heading: opts.heading,
    indent: opts.indent,
  });
}

function emptyLine() {
  return para([txt('')], { spacingAfter: 50 });
}

function labelValuePair(label, value, opts = {}) {
  return para([
    txt(`${label}: `, { bold: true, size: opts.size || FONT_SIZE }),
    txt(value || '—', { size: opts.size || FONT_SIZE }),
  ]);
}

function tableBorder(hasBorder = true) {
  const b = hasBorder ? BORDER_STYLE : NO_BORDER;
  return { top: b, bottom: b, left: b, right: b };
}

function cell(content, opts = {}) {
  const children = typeof content === 'string'
    ? [para([txt(content, { bold: opts.bold, size: opts.size || FONT_SIZE })], { alignment: opts.alignment })]
    : Array.isArray(content) ? content : [content];
  return new TableCell({
    children,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    borders: tableBorder(opts.borders !== false),
    margins: CELL_MARGINS,
    verticalAlign: opts.verticalAlign,
    columnSpan: opts.columnSpan,
    rowSpan: opts.rowSpan,
  });
}

function headerCell(content, opts = {}) {
  return cell(content, { bold: true, shading: UWC_NAVY, ...opts, size: opts.size || FONT_SIZE });
}

/* ── Build UWC Header block ── */
function buildDocumentHeader(template) {
  const headerLines = template.layout?.header?.lines || [
    'UNIVERSITY OF THE WESTERN CAPE',
    'FACULTY OF NATURAL SCIENCES',
    'FACULTY HIGHER DEGREES COMMITTEE',
  ];
  const rows = [];

  // UWC crest + title rows
  rows.push(
    para([txt(headerLines[0] || '', { bold: true, size: 32, color: UWC_NAVY })], { alignment: AlignmentType.CENTER }),
  );
  headerLines.slice(1).forEach(line => {
    rows.push(para([txt(line, { bold: true, size: HEADING_SIZE, color: UWC_NAVY })], { alignment: AlignmentType.CENTER }));
  });
  // Gold divider line
  rows.push(para([txt('━'.repeat(70), { color: UWC_GOLD, size: 16 })], { alignment: AlignmentType.CENTER }));
  // Form name
  rows.push(para([txt(template.name, { bold: true, size: 32, color: UWC_NAVY })], { alignment: AlignmentType.CENTER, spacingAfter: 200 }));

  return rows;
}

/* ── Resolve field value from form data ── */
function resolveFieldValue(field, formData) {
  const raw = formData[field.id];
  if (raw === undefined || raw === null || raw === '') return '';

  switch (field.type) {
    case 'keywords_tag':
      return Array.isArray(raw) ? raw.join('; ') : String(raw);
    case 'checkbox':
      return raw ? 'Yes' : 'No';
    case 'select':
      if (field.options) {
        const opt = field.options.find(o => o.value === raw);
        return opt ? opt.label : String(raw);
      }
      return String(raw);
    case 'date':
      try { return new Date(raw).toLocaleDateString('en-ZA'); } catch { return String(raw); }
    case 'auto_populated':
      return String(raw);
    default:
      return String(raw);
  }
}

/* ── Build table-layout section ── */
function buildTableSection(section, formData) {
  const { fields } = section;
  if (!fields || fields.length === 0) return [];

  // Group fields by row
  const rows = {};
  fields.forEach(f => {
    const row = f.row || 0;
    if (!rows[row]) rows[row] = [];
    rows[row].push(f);
  });

  const tableRows = [];
  Object.keys(rows).sort((a, b) => Number(a) - Number(b)).forEach(rowKey => {
    const fieldsInRow = rows[rowKey];
    const cells = [];
    fieldsInRow.forEach(f => {
      if (f.type === 'paragraph') {
        cells.push(
          cell([para([txt(f.label || f.content, { italics: true, size: 20 })])], { columnSpan: 2, borders: false })
        );
      } else {
        cells.push(cell(f.label + ':', { bold: true, width: 35, shading: 'F0F0F0' }));
        cells.push(cell(resolveFieldValue(f, formData) || '—', { width: 65 }));
      }
    });
    if (cells.length > 0) {
      tableRows.push(new TableRow({ children: cells }));
    }
  });

  if (tableRows.length === 0) return [];
  return [new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } })];
}

/* ── Build flow-layout section ── */
function buildFlowSection(section, formData) {
  const paras = [];
  (section.fields || []).forEach(f => {
    if (f.type === 'paragraph') {
      paras.push(para([txt(f.label || f.content || '', { italics: true, size: 20 })], { spacingAfter: 60 }));
    } else if (f.type === 'textarea') {
      paras.push(para([txt(f.label + ':', { bold: true })]));
      paras.push(para([txt(resolveFieldValue(f, formData) || '(No response)')], { spacingAfter: 120, indent: { left: convertInchesToTwip(0.25) } }));
    } else if (f.type === 'weighted_table') {
      paras.push(...buildWeightedTable(f, formData));
    } else if (f.type === 'repeater_group') {
      paras.push(...buildRepeaterGroup(f, formData));
    } else {
      paras.push(labelValuePair(f.label, resolveFieldValue(f, formData)));
    }
  });
  return paras;
}

/* ── Build weighted assessment table ── */
function buildWeightedTable(field, formData) {
  const data = formData[field.id];
  if (!data || !Array.isArray(data.rows)) return [para([txt('(Weighted table — no data)')])];

  const cols = field.columns || [];
  const paras = [];
  paras.push(para([txt(field.label || 'Weighted Assessment', { bold: true, size: HEADING_SIZE })]));

  // Header row
  const headerCells = cols.map(c => headerCell(c.label, { width: c.width || Math.floor(100 / cols.length) }));
  const headerRow = new TableRow({
    children: headerCells.length > 0 ? headerCells : [headerCell('Module'), headerCell('Weight'), headerCell('Mark'), headerCell('Weighted Mark')],
  });

  // Data rows
  const dataRows = data.rows.map(row => {
    const rowCells = cols.map(c => cell(String(row[c.key] ?? ''), {}));
    return new TableRow({ children: rowCells.length > 0 ? rowCells : [cell('—')] });
  });

  // Total row
  if (data.total !== undefined) {
    dataRows.push(new TableRow({
      children: [
        cell('TOTAL', { bold: true, columnSpan: cols.length - 1 }),
        cell(String(data.total), { bold: true }),
      ],
    }));
  }

  paras.push(new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }));
  paras.push(emptyLine());
  return paras;
}

/* ── Build repeater group ── */
function buildRepeaterGroup(field, formData) {
  const items = formData[field.id];
  if (!Array.isArray(items) || items.length === 0) return [para([txt(`(No ${field.label || 'entries'} provided)`)])];

  const paras = [];
  paras.push(para([txt(field.label || 'Entries', { bold: true, size: HEADING_SIZE })]));
  items.forEach((item, idx) => {
    paras.push(para([txt(`${field.itemLabel || 'Entry'} ${idx + 1}`, { bold: true, underline: true })]));
    (field.subFields || []).forEach(sf => {
      paras.push(labelValuePair(sf.label, String(item[sf.id] ?? '—')));
    });
    paras.push(emptyLine());
  });
  return paras;
}

/* ── Build signature blocks ── */
function buildSignatureBlocks(template, signatures) {
  const paras = [];
  paras.push(emptyLine());
  paras.push(para([txt('━'.repeat(70), { color: UWC_GOLD, size: 12 })], { alignment: AlignmentType.CENTER }));
  paras.push(emptyLine());

  (template.sections || []).forEach(section => {
    if (!section.requiresSignature) return;
    const sig = signatures?.[section.id];
    paras.push(para([txt(`${section.title} — Signature`, { bold: true, size: HEADING_SIZE })]));
    if (sig?.signedAt) {
      paras.push(labelValuePair('Signed by', sig.signedBy || '—'));
      paras.push(labelValuePair('Date', sig.signedAt ? new Date(sig.signedAt).toLocaleDateString('en-ZA') : '—'));
      if (sig.type === 'typed') {
        paras.push(para([txt(sig.data || '', { italics: true, size: 28 })]));
      } else {
        paras.push(para([txt('[Digital signature on file]', { italics: true })]));
      }
    } else {
      paras.push(para([txt('______________________________', {})]));
      paras.push(para([txt('Signature', { size: 18 })]));
      paras.push(para([txt('______________________________', {})]));
      paras.push(para([txt('Date', { size: 18 })]));
    }
    paras.push(emptyLine());
  });
  return paras;
}

/* ── Apply computed values from exportConfig ── */
function applyComputedValues(formData, exportConfig) {
  const enriched = { ...formData };
  (exportConfig?.computedValues || []).forEach(cv => {
    switch (cv.type) {
      case 'join': {
        const parts = (cv.sourceFieldIds || []).map(id => {
          const val = formData[id];
          return Array.isArray(val) ? val.join(cv.config?.separator || ', ') : String(val || '');
        });
        enriched[cv.tag] = parts.join(cv.config?.separator || ', ');
        break;
      }
      case 'sum': {
        enriched[cv.tag] = (cv.sourceFieldIds || []).reduce((s, id) => s + (Number(formData[id]) || 0), 0);
        break;
      }
      case 'concat': {
        enriched[cv.tag] = (cv.sourceFieldIds || []).map(id => formData[id] || '').join(cv.config?.separator || ' ');
        break;
      }
      default:
        break;
    }
  });
  return enriched;
}

/* ════════════════════════════════════════════════════════════════
   Main Export: Generate and download a .docx file
   ════════════════════════════════════════════════════════════════ */

/**
 * Generate a Word document from form data and template schema.
 * @param {Object} template - The form template schema (from prebuiltTemplates)
 * @param {Object} formData - All field values keyed by field.id
 * @param {Object} signatures - Signature data keyed by section.id
 * @param {Object} [opts] - Options: { studentProfile, currentUser, submissionId }
 * @returns {Promise<Blob>} The generated .docx Blob, or downloads it directly
 */
export async function exportFormToDocx(template, formData, signatures, opts = {}) {
  const { studentProfile, currentUser, submissionId, download = true } = opts;
  const enrichedData = applyComputedValues(formData, template.exportConfig);

  // Build document content
  const contentChildren = [];

  // 1. UWC Header
  contentChildren.push(...buildDocumentHeader(template));
  contentChildren.push(emptyLine());

  // 2. Reference number if available
  if (submissionId) {
    contentChildren.push(
      para([txt(`Reference: ${submissionId}`, { italics: true, size: 18, color: '666666' })], { alignment: AlignmentType.RIGHT }),
    );
  }

  // 3. Sections
  (template.sections || []).forEach((section, idx) => {
    // Section heading
    contentChildren.push(
      para([txt(`${idx + 1}. ${section.title}`, { bold: true, size: HEADING_SIZE, color: UWC_NAVY })], {
        spacingBefore: 200,
        spacingAfter: 100,
      }),
    );

    // Description
    if (section.description) {
      contentChildren.push(
        para([txt(section.description, { italics: true, size: 20, color: '555555' })], { spacingAfter: 80 }),
      );
    }

    // Fields
    if (section.layoutMode === 'table') {
      contentChildren.push(...buildTableSection(section, enrichedData));
    } else {
      contentChildren.push(...buildFlowSection(section, enrichedData));
    }

    contentChildren.push(emptyLine());
  });

  // 4. Signatures
  contentChildren.push(...buildSignatureBlocks(template, signatures));

  // 5. Footer note
  contentChildren.push(
    para([
      txt('This document was generated by the UWC Postgraduate Request Portal.', { italics: true, size: 16, color: '999999' }),
    ], { alignment: AlignmentType.CENTER, spacingBefore: 300 }),
  );
  contentChildren.push(
    para([
      txt(`Generated on ${new Date().toLocaleDateString('en-ZA')} at ${new Date().toLocaleTimeString('en-ZA')}`, { italics: true, size: 16, color: '999999' }),
    ], { alignment: AlignmentType.CENTER }),
  );

  // Build document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: FONT_SIZE },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.75),
            bottom: convertInchesToTwip(0.75),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            para([txt('University of the Western Cape — Faculty of Natural Sciences', { size: 16, color: '999999' })], { alignment: AlignmentType.CENTER }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            para([
              txt('Page ', { size: 16, color: '999999' }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: '999999' }),
              txt(' of ', { size: 16, color: '999999' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: '999999' }),
            ], { alignment: AlignmentType.CENTER }),
          ],
        }),
      },
      children: contentChildren,
    }],
  });

  // Generate blob
  const blob = await Packer.toBlob(doc);

  if (download) {
    const fileName = `${template.slug || 'form'}_${submissionId || Date.now()}.docx`;
    saveAs(blob, fileName);
  }

  return blob;
}

/**
 * Generate a PDF-friendly print view by opening a new window.
 * Falls back for environments where docx generation isn't ideal.
 */
export function printFormAsPdf(template, formData) {
  // This opens the browser print dialog for the current form view
  window.print();
}
