/**
 * generate-docs-pdf.mjs
 * 
 * Generates PDF documentation files with table of contents and internal hyperlinks.
 * Uses pdf-lib for PDF generation from the project Markdown documentation.
 * 
 * Usage: node scripts/generate-docs-pdf.mjs
 * Output: docs/pdf/ directory
 */

import { PDFDocument, StandardFonts, rgb, PDFName, PDFString } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const OUTPUT_DIR = path.join(DOCS_DIR, 'pdf');

// ── Brand Colours ──
const NAVY = rgb(0, 0.2, 0.4);          // #003366
const GOLD = rgb(0.773, 0.647, 0.353);  // #C5A55A
const BLACK = rgb(0.1, 0.1, 0.12);
const GREY = rgb(0.35, 0.38, 0.42);
const LIGHT_GREY = rgb(0.6, 0.63, 0.67);
const WHITE = rgb(1, 1, 1);
const BG = rgb(0.96, 0.965, 0.975);
const TABLE_BORDER = rgb(0.82, 0.84, 0.87);
const TABLE_HEADER = rgb(0.94, 0.95, 0.96);
const LINK_BLUE = rgb(0.15, 0.35, 0.65);
const SUCCESS_GREEN = rgb(0.1, 0.55, 0.3);
const WARNING_AMBER = rgb(0.8, 0.55, 0.05);
const ERROR_RED = rgb(0.75, 0.2, 0.2);

// ── Page Config ──
const PAGE_W = 595.28;  // A4
const PAGE_H = 841.89;
const MARGIN_TOP = 72;
const MARGIN_BOTTOM = 60;
const MARGIN_LEFT = 60;
const MARGIN_RIGHT = 60;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;
const LINE_HEIGHT = 16;
const PARA_SPACING = 8;

/**
 * Parse a markdown file into structured sections
 */
function parseMarkdown(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;

  for (const line of lines) {
    const h1 = line.match(/^# (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);

    if (h1) {
      currentSection = { level: 1, title: h1[1].trim(), content: [], subsections: [] };
      sections.push(currentSection);
    } else if (h2) {
      const sub = { level: 2, title: h2[1].trim(), content: [], subsections: [] };
      if (currentSection) currentSection.subsections.push(sub);
      else sections.push(sub);
      currentSection = sub;
    } else if (h3) {
      const sub = { level: 3, title: h3[1].trim(), content: [] };
      if (currentSection) currentSection.subsections.push(sub);
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }

  return sections;
}

/**
 * Flatten sections into a linear list for TOC and page tracking
 */
function flattenSections(sections) {
  const flat = [];
  for (const s of sections) {
    flat.push(s);
    if (s.subsections) {
      for (const sub of s.subsections) {
        flat.push(sub);
        if (sub.subsections) {
          for (const inner of sub.subsections) {
            flat.push(inner);
          }
        }
      }
    }
  }
  return flat;
}

/**
 * Replace Unicode characters that WinAnsi (standard PDF font encoding) cannot handle
 */
function sanitizeForPdf(text) {
  return text
    .replace(/\u2192/g, '->')    // →
    .replace(/\u2190/g, '<-')    // ←
    .replace(/\u2014/g, '--')    // —
    .replace(/\u2013/g, '-')     // –
    .replace(/\u2018/g, "'")     // '
    .replace(/\u2019/g, "'")     // '
    .replace(/\u201C/g, '"')     // "
    .replace(/\u201D/g, '"')     // "
    .replace(/\u2026/g, '...')   // …
    .replace(/\u2022/g, '*')     // •  (only for non-bullet contexts)
    .replace(/\u2705/g, '[OK]')  // ✅  (green check emoji)
    .replace(/\u26A0\uFE0F?/g, '[!]')  // ⚠️
    .replace(/\u274C/g, '[X]')   // ❌
    .replace(/\u2611/g, '[v]')   // ☑
    .replace(/\u2610/g, '[ ]')   // ☐
    .replace(/[\u2500-\u257F]/g, '-')  // box drawing chars
    .replace(/[\u2580-\u259F]/g, '#')  // block elements
    .replace(/\u00A0/g, ' ');    // non-breaking space
}

/**
 * Strip basic Markdown formatting from text
 */
function stripMd(text) {
  return sanitizeForPdf(text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^[-*]\s+/gm, '* ')
    .replace(/^\d+\.\s+/gm, (m) => m));
}

/**
 * Word wrap text to fit within a given width
 */
function wordWrap(text, font, fontSize, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const w = font.widthOfTextAtSize(test, fontSize);
    if (w > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Parse table from content lines
 */
function parseTable(lines) {
  const rows = [];
  for (const line of lines) {
    if (line.startsWith('|') && !line.match(/^\|[\s-:|]+\|$/)) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      rows.push(cells);
    }
  }
  return rows;
}

/**
 * Draw a simple table on the page
 */
function drawTable(page, rows, startY, fonts, options = {}) {
  if (rows.length === 0) return startY;
  
  const { fontSize = 8.5, colWidths, startX = MARGIN_LEFT } = options;
  const cellPad = 5;
  const numCols = rows[0].length;
  const availW = CONTENT_W;
  
  // Calculate column widths
  let widths = colWidths;
  if (!widths) {
    widths = Array(numCols).fill(availW / numCols);
  }

  let y = startY;

  for (let r = 0; r < rows.length; r++) {
    const isHeader = r === 0;
    const rowFont = isHeader ? fonts.bold : fonts.regular;
    const bg = isHeader ? TABLE_HEADER : (r % 2 === 0 ? WHITE : BG);

    // Calculate row height (multiline cells)
    let maxHeight = LINE_HEIGHT;
    const wrappedCells = rows[r].map((cell, ci) => {
      const cleanText = stripMd(cell);
      const lines = wordWrap(cleanText, rowFont, fontSize, widths[ci] - cellPad * 2);
      const h = lines.length * (fontSize + 3) + cellPad * 2;
      if (h > maxHeight) maxHeight = h;
      return lines;
    });

    // Check page break
    if (y - maxHeight < MARGIN_BOTTOM) return -(maxHeight); // signal needs new page

    // Draw cell backgrounds
    let x = startX;
    for (let ci = 0; ci < numCols; ci++) {
      page.drawRectangle({
        x, y: y - maxHeight, width: widths[ci], height: maxHeight,
        color: bg, borderColor: TABLE_BORDER, borderWidth: 0.5,
      });

      // Draw cell text
      const lines = wrappedCells[ci] || [''];
      let textY = y - cellPad - fontSize;
      for (const line of lines) {
        // Check for status symbols
        let textColor = isHeader ? NAVY : BLACK;
        let displayText = line;
        if (line.includes('[OK]')) { textColor = SUCCESS_GREEN; }
        else if (line.includes('[!]')) { textColor = WARNING_AMBER; }
        else if (line.includes('[X]')) { textColor = ERROR_RED; }

        page.drawText(displayText, {
          x: x + cellPad, y: textY,
          size: fontSize, font: rowFont, color: textColor,
          maxWidth: widths[ci] - cellPad * 2,
        });
        textY -= (fontSize + 3);
      }
      x += widths[ci];
    }

    y -= maxHeight;
  }

  return y;
}

/**
 * Build a PDF document from markdown content
 */
async function buildPdf(title, markdownContent, outputFilename) {
  const doc = await PDFDocument.create();
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
    mono: await doc.embedFont(StandardFonts.Courier),
  };

  // Track section pages for TOC
  const tocEntries = [];
  let pageCount = 0;

  function newPage() {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    pageCount++;

    // Footer
    page.drawText(`UWC PostGrad Portal — ${title}`, {
      x: MARGIN_LEFT, y: 25, size: 7.5, font: fonts.italic, color: LIGHT_GREY,
    });
    page.drawText(`Page ${pageCount}`, {
      x: PAGE_W - MARGIN_RIGHT - fonts.regular.widthOfTextAtSize(`Page ${pageCount}`, 7.5),
      y: 25, size: 7.5, font: fonts.regular, color: LIGHT_GREY,
    });

    // Header line
    page.drawLine({
      start: { x: MARGIN_LEFT, y: PAGE_H - MARGIN_TOP + 15 },
      end: { x: PAGE_W - MARGIN_RIGHT, y: PAGE_H - MARGIN_TOP + 15 },
      thickness: 0.5, color: GOLD,
    });

    return page;
  }

  // ── Title Page ──
  const titlePage = doc.addPage([PAGE_W, PAGE_H]);
  pageCount++;

  // Navy header block
  titlePage.drawRectangle({
    x: 0, y: PAGE_H - 200, width: PAGE_W, height: 200, color: NAVY,
  });

  // Gold accent line
  titlePage.drawRectangle({
    x: 0, y: PAGE_H - 204, width: PAGE_W, height: 4, color: GOLD,
  });

  // Title text
  titlePage.drawText('UWC PostGrad Portal', {
    x: MARGIN_LEFT, y: PAGE_H - 90,
    size: 28, font: fonts.bold, color: WHITE,
  });
  titlePage.drawText(title, {
    x: MARGIN_LEFT, y: PAGE_H - 130,
    size: 18, font: fonts.regular, color: GOLD,
  });
  titlePage.drawText('University of the Western Cape', {
    x: MARGIN_LEFT, y: PAGE_H - 160,
    size: 11, font: fonts.italic, color: rgb(0.7, 0.75, 0.82),
  });

  // Metadata below the header
  const meta = [
    `Generated: ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    'Project: Postgraduate Request Portal',
    'Methodology: Design Science Research (DSRM)',
  ];
  let metaY = PAGE_H - 260;
  for (const m of meta) {
    titlePage.drawText(m, {
      x: MARGIN_LEFT, y: metaY, size: 11, font: fonts.regular, color: GREY,
    });
    metaY -= 20;
  }

  // Footer on title page
  titlePage.drawLine({
    start: { x: MARGIN_LEFT, y: 50 },
    end: { x: PAGE_W - MARGIN_RIGHT, y: 50 },
    thickness: 0.5, color: TABLE_BORDER,
  });
  titlePage.drawText('Confidential — For Academic Research Purposes', {
    x: MARGIN_LEFT, y: 34, size: 8, font: fonts.italic, color: LIGHT_GREY,
  });

  // ── Parse content ──
  const sections = parseMarkdown(markdownContent);
  const flatSections = flattenSections(sections);

  // ── Build content pages (first pass to collect page numbers) ──
  // We'll build the content now and insert the TOC page afterwards
  const contentStartPageIndex = pageCount; // After title page
  let currentPage = newPage();
  let y = PAGE_H - MARGIN_TOP;

  function checkPageBreak(needed) {
    if (y - needed < MARGIN_BOTTOM) {
      currentPage = newPage();
      y = PAGE_H - MARGIN_TOP;
    }
  }

  function drawHeading(text, level) {
    const sizes = { 1: 20, 2: 15, 3: 12 };
    const spacing = { 1: 30, 2: 22, 3: 16 };
    const fontSize = sizes[level] || 12;
    const space = spacing[level] || 16;

    checkPageBreak(space + fontSize + 10);
    y -= space;

    const font = level === 1 ? fonts.bold : fonts.bold;
    const color = level === 1 ? NAVY : (level === 2 ? NAVY : GREY);

    // Word wrap heading
    const lines = wordWrap(stripMd(text), font, fontSize, CONTENT_W);
    for (const line of lines) {
      checkPageBreak(fontSize + 4);
      currentPage.drawText(line, {
        x: MARGIN_LEFT, y, size: fontSize, font, color,
      });
      y -= fontSize + 4;
    }

    // Record TOC entry
    tocEntries.push({ title: stripMd(text), level, page: pageCount });

    y -= 4;
  }

  function drawParagraph(lines) {
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) { y -= PARA_SPACING; continue; }
      if (line.startsWith('```')) continue;  // Skip code fences
      if (line.startsWith('---') || line.startsWith('___')) {
        y -= PARA_SPACING;
        continue;
      }

      // Check if this is a table start
      if (line.startsWith('|')) continue; // tables handled separately

      // Quote blocks
      if (line.startsWith('>')) {
        const text = stripMd(line.replace(/^>\s*/, ''));
        if (!text) continue;
        checkPageBreak(LINE_HEIGHT + 4);
        currentPage.drawRectangle({
          x: MARGIN_LEFT, y: y - 2, width: 3, height: LINE_HEIGHT, color: GOLD,
        });
        const wrapped = wordWrap(text, fonts.italic, 9.5, CONTENT_W - 16);
        for (const wl of wrapped) {
          checkPageBreak(LINE_HEIGHT);
          currentPage.drawText(wl, {
            x: MARGIN_LEFT + 12, y, size: 9.5, font: fonts.italic, color: GREY,
          });
          y -= LINE_HEIGHT;
        }
        continue;
      }

      // Bullet points
      const isBullet = line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ');
      const isNumbered = /^\d+\.\s/.test(line);
      const indent = (isBullet || isNumbered) ? 12 : 0;
      let text = stripMd(line);
      if (isBullet) text = '*  ' + text.replace(/^[*\-\u2022]\s*/, '');

      const wrapped = wordWrap(text, fonts.regular, 10, CONTENT_W - indent);
      for (const wl of wrapped) {
        checkPageBreak(LINE_HEIGHT);
        currentPage.drawText(wl, {
          x: MARGIN_LEFT + indent, y, size: 10, font: fonts.regular, color: BLACK,
        });
        y -= LINE_HEIGHT;
      }
    }
  }

  // ── Render sections ──
  for (const section of sections) {
    drawHeading(section.title, section.level);

    // Process content including tables
    const tableLines = [];
    let inTable = false;
    const nonTableContent = [];

    for (const line of section.content) {
      if (line.trim().startsWith('|')) {
        if (!inTable) {
          // Flush non-table content
          if (nonTableContent.length > 0) {
            drawParagraph(nonTableContent);
            nonTableContent.length = 0;
          }
          inTable = true;
        }
        tableLines.push(line.trim());
      } else {
        if (inTable) {
          // End of table, draw it
          const tableRows = parseTable(tableLines);
          if (tableRows.length > 0) {
            checkPageBreak(40);
            y -= 6;
            const result = drawTable(currentPage, tableRows, y, fonts);
            if (result < 0) {
              currentPage = newPage();
              y = PAGE_H - MARGIN_TOP;
              drawTable(currentPage, tableRows, y, fonts);
              y += result;
            } else {
              y = result - 8;
            }
          }
          tableLines.length = 0;
          inTable = false;
        }
        nonTableContent.push(line);
      }
    }
    // Flush remaining
    if (inTable && tableLines.length > 0) {
      const tableRows = parseTable(tableLines);
      if (tableRows.length > 0) {
        checkPageBreak(40);
        y -= 6;
        const result = drawTable(currentPage, tableRows, y, fonts);
        if (result < 0) {
          currentPage = newPage();
          y = PAGE_H - MARGIN_TOP;
          drawTable(currentPage, tableRows, y, fonts);
        } else {
          y = result - 8;
        }
      }
    }
    if (nonTableContent.length > 0) {
      drawParagraph(nonTableContent);
    }

    // Subsections
    if (section.subsections) {
      for (const sub of section.subsections) {
        drawHeading(sub.title, sub.level);

        const subTableLines = [];
        let subInTable = false;
        const subNonTable = [];

        for (const line of sub.content) {
          if (line.trim().startsWith('|')) {
            if (!subInTable) {
              if (subNonTable.length > 0) {
                drawParagraph(subNonTable);
                subNonTable.length = 0;
              }
              subInTable = true;
            }
            subTableLines.push(line.trim());
          } else {
            if (subInTable) {
              const tableRows = parseTable(subTableLines);
              if (tableRows.length > 0) {
                checkPageBreak(40);
                y -= 6;
                const result = drawTable(currentPage, tableRows, y, fonts);
                if (result < 0) {
                  currentPage = newPage();
                  y = PAGE_H - MARGIN_TOP;
                  drawTable(currentPage, tableRows, y, fonts);
                } else {
                  y = result - 8;
                }
              }
              subTableLines.length = 0;
              subInTable = false;
            }
            subNonTable.push(line);
          }
        }
        if (subInTable && subTableLines.length > 0) {
          const tableRows = parseTable(subTableLines);
          if (tableRows.length > 0) {
            checkPageBreak(40);
            y -= 6;
            const result = drawTable(currentPage, tableRows, y, fonts);
            if (result < 0) {
              currentPage = newPage();
              y = PAGE_H - MARGIN_TOP;
              drawTable(currentPage, tableRows, y, fonts);
            } else {
              y = result - 8;
            }
          }
        }
        if (subNonTable.length > 0) {
          drawParagraph(subNonTable);
        }

        // Inner subsections
        if (sub.subsections) {
          for (const inner of sub.subsections) {
            drawHeading(inner.title, inner.level);
            if (inner.content.length > 0) drawParagraph(inner.content);
          }
        }
      }
    }
  }

  // ── Now create the TOC ──
  // Insert TOC pages after title page (index 0)
  const tocPages = [];
  let tocPage = doc.insertPage(1, [PAGE_W, PAGE_H]);
  let tocY = PAGE_H - MARGIN_TOP;

  // TOC header
  tocPage.drawText('Table of Contents', {
    x: MARGIN_LEFT, y: tocY, size: 22, font: fonts.bold, color: NAVY,
  });
  tocY -= 12;
  tocPage.drawLine({
    start: { x: MARGIN_LEFT, y: tocY },
    end: { x: PAGE_W - MARGIN_RIGHT, y: tocY },
    thickness: 2, color: GOLD,
  });
  tocY -= 28;

  // TOC footer
  tocPage.drawText(`UWC PostGrad Portal — ${title}`, {
    x: MARGIN_LEFT, y: 25, size: 7.5, font: fonts.italic, color: LIGHT_GREY,
  });
  tocPage.drawLine({
    start: { x: MARGIN_LEFT, y: PAGE_H - MARGIN_TOP + 15 },
    end: { x: PAGE_W - MARGIN_RIGHT, y: PAGE_H - MARGIN_TOP + 15 },
    thickness: 0.5, color: GOLD,
  });

  let tocPageCount = 1;

  for (const entry of tocEntries) {
    if (tocY < MARGIN_BOTTOM + 20) {
      tocPageCount++;
      tocPage = doc.insertPage(tocPageCount, [PAGE_W, PAGE_H]);
      tocY = PAGE_H - MARGIN_TOP;
      tocPage.drawText(`UWC PostGrad Portal — ${title}`, {
        x: MARGIN_LEFT, y: 25, size: 7.5, font: fonts.italic, color: LIGHT_GREY,
      });
      tocPage.drawLine({
        start: { x: MARGIN_LEFT, y: PAGE_H - MARGIN_TOP + 15 },
        end: { x: PAGE_W - MARGIN_RIGHT, y: PAGE_H - MARGIN_TOP + 15 },
        thickness: 0.5, color: GOLD,
      });
    }

    const indent = (entry.level - 1) * 16;
    const fontSize = entry.level === 1 ? 11 : (entry.level === 2 ? 10 : 9);
    const font = entry.level === 1 ? fonts.bold : fonts.regular;
    const color = entry.level === 1 ? NAVY : (entry.level === 2 ? BLACK : GREY);
    const adjustedPage = entry.page + tocPageCount; // offset for inserted TOC pages

    // Truncate long titles
    let displayTitle = entry.title;
    const maxTitleW = CONTENT_W - indent - 40;
    while (font.widthOfTextAtSize(displayTitle, fontSize) > maxTitleW && displayTitle.length > 10) {
      displayTitle = displayTitle.slice(0, -4) + '...';
    }

    // Draw entry
    tocPage.drawText(displayTitle, {
      x: MARGIN_LEFT + indent, y: tocY, size: fontSize, font, color,
    });

    // Page number (right-aligned)
    const pageStr = `${adjustedPage}`;
    const pageNumW = fonts.regular.widthOfTextAtSize(pageStr, fontSize);
    tocPage.drawText(pageStr, {
      x: PAGE_W - MARGIN_RIGHT - pageNumW, y: tocY,
      size: fontSize, font: fonts.regular, color: LIGHT_GREY,
    });

    // Dot leader
    const textEndX = MARGIN_LEFT + indent + font.widthOfTextAtSize(displayTitle, fontSize) + 6;
    const dotsStartX = textEndX;
    const dotsEndX = PAGE_W - MARGIN_RIGHT - pageNumW - 6;
    if (dotsEndX - dotsStartX > 20) {
      let dotX = dotsStartX;
      while (dotX < dotsEndX) {
        tocPage.drawText('.', {
          x: dotX, y: tocY, size: fontSize - 2, font: fonts.regular, color: TABLE_BORDER,
        });
        dotX += 4;
      }
    }

    // Add GoTo link annotation for this TOC entry
    const targetPageIndex = adjustedPage - 1; // 0-based
    if (targetPageIndex < doc.getPageCount()) {
      const targetPage = doc.getPage(targetPageIndex);
      const ref = targetPage.ref;
      
      const linkAnnotation = doc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [MARGIN_LEFT + indent, tocY - 3, PAGE_W - MARGIN_RIGHT, tocY + fontSize + 2],
        Border: [0, 0, 0],
        C: [0, 0, 0],
        Dest: [ref, PDFName.of('XYZ'), null, null, null],
      });
      
      const annots = tocPage.node.get(PDFName.of('Annots'));
      if (annots) {
        annots.push(linkAnnotation);
      } else {
        tocPage.node.set(PDFName.of('Annots'), doc.context.obj([linkAnnotation]));
      }
    }

    tocY -= (fontSize + 8);
  }

  // ── Save ──
  const pdfBytes = await doc.save();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, outputFilename);
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`  ✓ ${outputFilename} (${doc.getPageCount()} pages, ${(pdfBytes.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}

// ── Main ──
async function main() {
  console.log('\n📄 PostGrad Portal — PDF Documentation Generator\n');
  console.log('  Output directory:', OUTPUT_DIR, '\n');

  // Document definitions: [title, source file, output filename]
  const documents = [
    ['System vs Specification — Comparison & Analysis', 'SYSTEM_VS_SPECIFICATION.md', 'System_vs_Specification.pdf'],
    ['Development Changelog & Research Notes', 'DEVELOPMENT_CHANGELOG.md', 'Development_Changelog.pdf'],
    ['Firebase Migration Changelog', 'FIREBASE_MIGRATION_CHANGELOG.md', 'Firebase_Migration_Changelog.pdf'],
    ['EmailJS Setup Guide', 'EMAILJS_SETUP.md', 'EmailJS_Setup_Guide.pdf'],
  ];

  // Also generate from README
  const readmePath = path.join(ROOT, 'README.md');
  if (fs.existsSync(readmePath)) {
    documents.unshift(['README — Project Documentation', null, 'README.pdf']);
  }

  const generated = [];

  for (const [title, sourceFile, outputFile] of documents) {
    try {
      const sourcePath = sourceFile ? path.join(DOCS_DIR, sourceFile) : readmePath;
      if (!fs.existsSync(sourcePath)) {
        console.log(`  ✗ Skipping ${outputFile} — source not found: ${sourceFile || 'README.md'}`);
        continue;
      }
      const content = fs.readFileSync(sourcePath, 'utf-8');
      const outPath = await buildPdf(title, content, outputFile);
      generated.push(outPath);
    } catch (err) {
      console.error(`  ✗ Error generating ${outputFile}:`, err.message);
    }
  }

  // ── Generate combined PDF ──
  if (generated.length > 1) {
    console.log('\n  Generating combined document...');
    const combined = await PDFDocument.create();
    
    for (const pdfPath of generated) {
      const bytes = fs.readFileSync(pdfPath);
      const src = await PDFDocument.load(bytes);
      const pages = await combined.copyPages(src, src.getPageIndices());
      
      // Add a separator page between documents
      if (combined.getPageCount() > 0) {
        const sepPage = combined.addPage([PAGE_W, PAGE_H]);
        const font = await combined.embedFont(StandardFonts.HelveticaBold);
        const titleText = path.basename(pdfPath, '.pdf').replace(/_/g, ' ');
        sepPage.drawRectangle({
          x: 0, y: PAGE_H / 2 - 1, width: PAGE_W, height: 2, color: GOLD,
        });
        sepPage.drawText(titleText, {
          x: PAGE_W / 2 - font.widthOfTextAtSize(titleText, 18) / 2,
          y: PAGE_H / 2 + 20,
          size: 18, font, color: NAVY,
        });
        sepPage.drawText('Next Section', {
          x: PAGE_W / 2 - font.widthOfTextAtSize('Next Section', 10) / 2,
          y: PAGE_H / 2 - 24,
          size: 10, font, color: LIGHT_GREY,
        });
      }
      
      for (const page of pages) {
        combined.addPage(page);
      }
    }

    const combinedBytes = await combined.save();
    const combinedPath = path.join(OUTPUT_DIR, 'PostGrad_Portal_Complete_Documentation.pdf');
    fs.writeFileSync(combinedPath, combinedBytes);
    console.log(`  ✓ PostGrad_Portal_Complete_Documentation.pdf (${combined.getPageCount()} pages, ${(combinedBytes.length / 1024).toFixed(0)} KB)`);
  }

  console.log(`\n✅ Done! ${generated.length} PDFs generated in docs/pdf/\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
