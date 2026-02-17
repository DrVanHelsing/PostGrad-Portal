import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DOCS_ROOT = path.join(ROOT, 'public', 'documents');

function walkPdfFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkPdfFiles(fullPath, out);
    } else if (entry.name.toLowerCase().endsWith('.pdf')) {
      out.push(fullPath);
    }
  }
  return out;
}

async function createFallbackPdf(filePath, reason) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: rgb(0.0, 0.22, 0.55) });
  page.drawText('POSTGRAD PORTAL DOCUMENT REPAIR', { x: 40, y: 805, size: 16, font: bold, color: rgb(1, 1, 1) });

  page.drawText('File Name:', { x: 40, y: 700, size: 12, font: bold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(path.basename(filePath), { x: 130, y: 700, size: 12, font: regular, color: rgb(0.1, 0.1, 0.1) });

  page.drawText('Status:', { x: 40, y: 675, size: 12, font: bold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText('Rebuilt due to unreadable or invalid PDF structure.', { x: 130, y: 675, size: 12, font: regular, color: rgb(0.1, 0.1, 0.1) });

  page.drawText('Repair Reason:', { x: 40, y: 650, size: 12, font: bold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(String(reason).slice(0, 95), { x: 130, y: 650, size: 11, font: regular, color: rgb(0.1, 0.1, 0.1) });

  page.drawText('This placeholder ensures the file remains previewable in-browser.', { x: 40, y: 610, size: 11, font: regular, color: rgb(0.25, 0.25, 0.25) });

  const bytes = await pdfDoc.save();
  fs.writeFileSync(filePath, bytes);
}

async function normalizePdf(filePath) {
  const source = fs.readFileSync(filePath);

  try {
    const loaded = await PDFDocument.load(source, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      parseSpeed: 3,
    });
    const normalized = await loaded.save({
      useObjectStreams: false,
      addDefaultPage: false,
      updateFieldAppearances: false,
    });
    fs.writeFileSync(filePath, normalized);
    return { status: 'normalized' };
  } catch (error) {
    await createFallbackPdf(filePath, error?.message || 'Unknown parse error');
    return { status: 'replaced', error: error?.message || 'Unknown parse error' };
  }
}

async function main() {
  if (!fs.existsSync(DOCS_ROOT)) {
    console.error(`Documents folder not found: ${DOCS_ROOT}`);
    process.exit(1);
  }

  const files = walkPdfFiles(DOCS_ROOT);
  let normalizedCount = 0;
  let replacedCount = 0;

  console.log(`Found ${files.length} PDF files under public/documents`);

  for (const filePath of files) {
    const result = await normalizePdf(filePath);
    const relative = path.relative(ROOT, filePath).replace(/\\/g, '/');

    if (result.status === 'normalized') {
      normalizedCount += 1;
      console.log(`OK  ${relative}`);
    } else {
      replacedCount += 1;
      console.log(`FIX ${relative} :: ${result.error}`);
    }
  }

  console.log('');
  console.log(`Normalized: ${normalizedCount}`);
  console.log(`Replaced:   ${replacedCount}`);
}

main().catch((error) => {
  console.error('PDF repair failed:', error);
  process.exit(1);
});
