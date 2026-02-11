// ============================================
// HeaderFooterEditor – Visual header/footer
// customisation for form templates.
// Allows adding/removing/repositioning elements:
// images, text lines, labels, dates, separators.
// Supports "Apply to All Templates" for global branding.
// ============================================

import { useState, useCallback } from 'react';
import {
  HiOutlineTrash, HiOutlineArrowUp, HiOutlineArrowDown,
  HiOutlinePhoto, HiOutlinePencilSquare, HiOutlineCalendarDays,
  HiOutlineTag, HiOutlineBars3, HiOutlineDocumentText,
  HiOutlineEye, HiOutlineSparkles, HiOutlineArrowPath,
  HiOutlineCheckCircle, HiOutlineMinus, HiOutlineChevronDown,
  HiOutlineChevronUp, HiOutlinePaintBrush,
} from 'react-icons/hi2';
import './HeaderFooterEditor.css';

/* ── Element type definitions ── */
const ELEMENT_TYPES = [
  { type: 'image',     label: 'Image',   icon: HiOutlinePhoto,          defaultValue: { src: '/uwc_logo.svg', alt: 'Logo', height: 56, align: 'center' } },
  { type: 'text',      label: 'Text',    icon: HiOutlinePencilSquare,   defaultValue: { content: 'New text line', fontSize: 13, fontWeight: '600', align: 'center', uppercase: false, letterSpacing: '0.04em', opacity: 1 } },
  { type: 'title',     label: 'Title',   icon: HiOutlineDocumentText,   defaultValue: { content: 'FORM TITLE', fontSize: 18, fontWeight: '700', align: 'center', uppercase: true, letterSpacing: '0.04em' } },
  { type: 'label',     label: 'Label',   icon: HiOutlineTag,            defaultValue: { content: 'FHD-XX-2026', fontSize: 11, fontWeight: '400', align: 'center', opacity: 0.6 } },
  { type: 'date',      label: 'Date',    icon: HiOutlineCalendarDays,   defaultValue: { format: 'full', align: 'center', fontSize: 11 } },
  { type: 'separator', label: 'Divider', icon: HiOutlineMinus,          defaultValue: { style: 'solid', color: 'rgba(255,255,255,0.2)', thickness: 1, width: '80%' } },
];

const ALIGN_OPTIONS = ['left', 'center', 'right'];

/* ── Gradient presets ── */
const GRADIENT_PRESETS = [
  { label: 'UWC Navy',   colors: ['#003366', '#004d99'], angle: 135 },
  { label: 'Dark Navy',  colors: ['#001a33', '#003366'], angle: 135 },
  { label: 'Ocean',      colors: ['#003366', '#006699'], angle: 180 },
  { label: 'Slate',      colors: ['#2c3e50', '#34495e'], angle: 135 },
  { label: 'Charcoal',   colors: ['#1a1a2e', '#16213e'], angle: 135 },
  { label: 'Forest',     colors: ['#1b4332', '#2d6a4f'], angle: 135 },
  { label: 'Burgundy',   colors: ['#4a0e0e', '#7c1d1d'], angle: 135 },
  { label: 'Solid Navy', colors: ['#003366', '#003366'], angle: 0 },
  { label: 'Light Grey', colors: ['#f5f6f8', '#eef0f4'], angle: 180 },
  { label: 'White',      colors: ['#ffffff', '#ffffff'], angle: 0 },
];

/* ── Parse gradient CSS → structured parts ── */
function parseGradient(bg) {
  if (!bg) return { color1: '#003366', color2: '#004d99', angle: 135 };
  const m = bg.match(/linear-gradient\(\s*(\d+)deg\s*,\s*(#[0-9a-fA-F]{3,8})\s*(?:\d+%?\s*,)?\s*(#[0-9a-fA-F]{3,8})/);
  if (m) return { color1: m[2], color2: m[3], angle: parseInt(m[1]) || 135 };
  const s = bg.match(/#[0-9a-fA-F]{3,8}/);
  if (s) return { color1: s[0], color2: s[0], angle: 0 };
  return { color1: '#003366', color2: '#004d99', angle: 135 };
}

/* ── Build gradient CSS from parts ── */
function buildGradient(c1, c2, angle) {
  if (c1 === c2) return c1;
  return `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%)`;
}

/* ── Parse padding shorthand → px number ── */
function parsePaddingPx(padding) {
  if (!padding) return 24;
  const m = String(padding).match(/(\d+)/);
  return m ? parseInt(m[1]) : 24;
}

/* ── Defaults ── */
export const DEFAULT_HEADER = {
  background: 'linear-gradient(135deg, #003366 0%, #004d99 100%)',
  textColor: '#ffffff',
  padding: '28px 32px 24px',
  showAccentBar: true,
  accentColor: '#C5A55A',
  elements: [
    { id: 'logo',      type: 'image', src: '/uwc_logo.svg', alt: 'University of the Western Cape', height: 56, align: 'center' },
    { id: 'uni_name',  type: 'text',  content: 'UNIVERSITY OF THE WESTERN CAPE', fontSize: 13, fontWeight: '700', align: 'center', uppercase: true, letterSpacing: '0.16em', opacity: 1 },
    { id: 'faculty',   type: 'text',  content: 'FACULTY OF NATURAL SCIENCES',    fontSize: 11, fontWeight: '500', align: 'center', uppercase: true, letterSpacing: '0.14em', opacity: 0.75 },
    { id: 'committee', type: 'text',  content: 'FACULTY HIGHER DEGREES COMMITTEE', fontSize: 11, fontWeight: '500', align: 'center', uppercase: true, letterSpacing: '0.14em', opacity: 0.75 },
  ],
};

export const DEFAULT_FOOTER = {
  background: 'var(--bg-muted, #f5f6f8)',
  textColor: 'var(--text-secondary, #666)',
  padding: '12px 32px',
  showAccentBar: false,
  accentColor: '#C5A55A',
  elements: [
    { id: 'footer_text', type: 'text', content: 'University of the Western Cape – Faculty of Natural Sciences', fontSize: 10, fontWeight: '400', align: 'center', opacity: 0.7 },
  ],
};


/* ══════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════ */
export default function HeaderFooterEditor({
  zone = 'header', config, onChange,
  formTitle, formCode, onFormTitleChange, onFormCodeChange, onApplyAll,
}) {
  const [dragIdx, setDragIdx]       = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showStyle, setShowStyle]   = useState(false);

  const defaults = zone === 'header' ? DEFAULT_HEADER : DEFAULT_FOOTER;
  const cfg = { ...defaults, ...config, elements: config?.elements || defaults.elements };
  const grad = parseGradient(cfg.background);

  const updateProp = useCallback((k, v) => onChange({ ...cfg, [k]: v }), [cfg, onChange]);

  const updateGradient = useCallback((c1, c2, a) => {
    onChange({ ...cfg, background: buildGradient(c1, c2, a) });
  }, [cfg, onChange]);

  /* element CRUD */
  const addElement = useCallback((td) => {
    const el = { id: `${td.type}_${Date.now()}`, type: td.type, ...td.defaultValue };
    onChange({ ...cfg, elements: [...cfg.elements, el] });
    setExpandedId(el.id);
  }, [cfg, onChange]);

  const updateElement = useCallback((i, k, v) => {
    const next = [...cfg.elements]; next[i] = { ...next[i], [k]: v };
    onChange({ ...cfg, elements: next });
  }, [cfg, onChange]);

  const removeElement = useCallback((i) => {
    const next = [...cfg.elements]; next.splice(i, 1);
    onChange({ ...cfg, elements: next }); setExpandedId(null);
  }, [cfg, onChange]);

  const moveElement = useCallback((i, dir) => {
    const next = [...cfg.elements]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ ...cfg, elements: next });
  }, [cfg, onChange]);

  /* drag-and-drop */
  const handleDragStart = (e, i) => { setDragIdx(i); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver  = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
  const handleDragEnd   = () => {
    if (dragIdx != null && dragOverIdx != null && dragIdx !== dragOverIdx) {
      const next = [...cfg.elements]; const [item] = next.splice(dragIdx, 1);
      next.splice(dragOverIdx, 0, item); onChange({ ...cfg, elements: next });
    }
    setDragIdx(null); setDragOverIdx(null);
  };

  /* image upload (base64) */
  const handleImageUpload = useCallback((i) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = (e) => {
      const f = e.target.files?.[0]; if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => updateElement(i, 'src', ev.target.result);
      r.readAsDataURL(f);
    };
    inp.click();
  }, [updateElement]);

  /* ═════════ JSX ═════════ */
  return (
    <div className="hfe-editor">
      {/* toolbar */}
      <div className="hfe-toolbar">
        <h4 className="hfe-toolbar-title">{zone === 'header' ? 'Header' : 'Footer'} Designer</h4>
        <div className="hfe-toolbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(p => !p)}>
            <HiOutlineEye /> {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          {onApplyAll && (
            <button className="btn btn-sm btn-gold" onClick={onApplyAll} title="Apply to all templates">
              <HiOutlineSparkles /> Apply All
            </button>
          )}
        </div>
      </div>

      {/* live preview */}
      {showPreview && (
        <div className="hfe-preview-wrapper">
          <div className="hfe-preview-label">Preview</div>
          <HeaderFooterPreview zone={zone} config={cfg} formTitle={formTitle} formCode={formCode} />
        </div>
      )}

      {/* ── Style panel (collapsible) ── */}
      <button className="hfe-section-toggle" onClick={() => setShowStyle(s => !s)}>
        <HiOutlinePaintBrush />
        <span>Background & Style</span>
        {showStyle ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
      </button>

      {showStyle && (
        <div className="hfe-style-panel">
          {/* gradient presets */}
          <div className="hfe-style-group">
            <span className="hfe-style-label">Background Preset</span>
            <div className="hfe-preset-grid">
              {GRADIENT_PRESETS.map((p, i) => {
                const bg = buildGradient(p.colors[0], p.colors[1], p.angle);
                const active = cfg.background === bg || cfg.background === p.colors[0];
                return (
                  <button
                    key={i}
                    className={`hfe-preset-swatch${active ? ' active' : ''}`}
                    style={{ background: bg }}
                    onClick={() => updateProp('background', bg)}
                    title={p.label}
                  >
                    {active && <HiOutlineCheckCircle />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* custom gradient */}
          <div className="hfe-style-group">
            <span className="hfe-style-label">Custom Gradient</span>
            <div className="hfe-gradient-row">
              <label className="hfe-inline-field">
                <span>Color 1</span>
                <input type="color" value={grad.color1} onChange={e => updateGradient(e.target.value, grad.color2, grad.angle)} />
              </label>
              <label className="hfe-inline-field">
                <span>Color 2</span>
                <input type="color" value={grad.color2} onChange={e => updateGradient(grad.color1, e.target.value, grad.angle)} />
              </label>
              <label className="hfe-inline-field hfe-inline-angle">
                <span>Angle</span>
                <input type="range" min={0} max={360} step={5} value={grad.angle}
                  onChange={e => updateGradient(grad.color1, grad.color2, parseInt(e.target.value))} />
                <span className="hfe-range-val">{grad.angle}°</span>
              </label>
            </div>
          </div>

          {/* text color, padding, accent */}
          <div className="hfe-style-group">
            <div className="hfe-compact-row">
              <label className="hfe-inline-field">
                <span>Text Color</span>
                <div className="hfe-color-combo">
                  <input type="color" value={cfg.textColor?.startsWith('#') ? cfg.textColor : '#ffffff'}
                    onChange={e => updateProp('textColor', e.target.value)} />
                  <span className="hfe-color-hex">{cfg.textColor || '#fff'}</span>
                </div>
              </label>
              <label className="hfe-inline-field">
                <span>Padding</span>
                <div className="hfe-range-combo">
                  <input type="range" min={4} max={48} value={parsePaddingPx(cfg.padding)}
                    onChange={e => { const v = e.target.value; updateProp('padding', `${v}px ${Math.round(v * 1.15)}px`); }} />
                  <span className="hfe-range-val">{parsePaddingPx(cfg.padding)}px</span>
                </div>
              </label>
            </div>
          </div>

          <div className="hfe-style-group">
            <div className="hfe-compact-row">
              <label className="hfe-chk-inline">
                <input type="checkbox" checked={cfg.showAccentBar || false}
                  onChange={e => updateProp('showAccentBar', e.target.checked)} />
                <span>Accent Bar</span>
              </label>
              {cfg.showAccentBar && (
                <label className="hfe-inline-field">
                  <span>Accent Color</span>
                  <div className="hfe-color-combo">
                    <input type="color" value={cfg.accentColor || '#C5A55A'}
                      onChange={e => updateProp('accentColor', e.target.value)} />
                    <span className="hfe-color-hex">{cfg.accentColor || '#C5A55A'}</span>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Form title & code (header only) ── */}
      {zone === 'header' && (
        <div className="hfe-title-row">
          <label className="hfe-inline-field hfe-inline-grow">
            <span>Form Title</span>
            <input type="text" value={formTitle || ''} onChange={e => onFormTitleChange?.(e.target.value)} placeholder="e.g. TITLE REGISTRATION FORM" />
          </label>
          <label className="hfe-inline-field" style={{ maxWidth: 140 }}>
            <span>Form Code</span>
            <input type="text" value={formCode || ''} onChange={e => onFormCodeChange?.(e.target.value)} placeholder="FHD-TR-2026" />
          </label>
        </div>
      )}

      {/* ── Elements header ── */}
      <div className="hfe-elements-header">
        <h5>Elements</h5>
        <div className="hfe-add-btns">
          {ELEMENT_TYPES.map(t => (
            <button key={t.type} className="btn btn-ghost btn-xs" onClick={() => addElement(t)} title={`Add ${t.label}`}>
              <t.icon /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Elements list ── */}
      <div className="hfe-elements-list">
        {cfg.elements.map((el, idx) => {
          const td = ELEMENT_TYPES.find(t => t.type === el.type);
          const Icon = td?.icon || HiOutlineDocumentText;
          const open = expandedId === el.id;

          return (
            <div key={el.id}
              className={`hfe-el-card${open ? ' expanded' : ''}${dragOverIdx === idx ? ' drag-over' : ''}`}
              draggable onDragStart={e => handleDragStart(e, idx)}
              onDragOver={e => handleDragOver(e, idx)} onDragEnd={handleDragEnd}
            >
              {/* summary row */}
              <div className="hfe-el-summary" onClick={() => setExpandedId(open ? null : el.id)}>
                <span className="hfe-drag"><HiOutlineBars3 /></span>
                <span className="hfe-el-icon"><Icon /></span>
                <span className="hfe-el-name">
                  {el.type === 'image' ? (el.alt || 'Image') : el.type === 'separator' ? 'Divider' : (el.content || el.type)}
                </span>
                <span className="hfe-el-type">{td?.label || el.type}</span>
                <div className="hfe-el-actions">
                  <button onClick={e => { e.stopPropagation(); moveElement(idx, -1); }} disabled={idx === 0} title="Up"><HiOutlineArrowUp /></button>
                  <button onClick={e => { e.stopPropagation(); moveElement(idx, 1); }} disabled={idx === cfg.elements.length - 1} title="Down"><HiOutlineArrowDown /></button>
                  <button onClick={e => { e.stopPropagation(); removeElement(idx); }} title="Remove"><HiOutlineTrash /></button>
                </div>
              </div>

              {/* expanded editor */}
              {open && (
                <div className="hfe-el-editor">
                  {el.type === 'image' && <ImageEditor el={el} idx={idx} updateElement={updateElement} handleImageUpload={handleImageUpload} />}
                  {(el.type === 'text' || el.type === 'title' || el.type === 'label') && <TextEditor el={el} idx={idx} updateElement={updateElement} />}
                  {el.type === 'date' && <DateEditor el={el} idx={idx} updateElement={updateElement} />}
                  {el.type === 'separator' && <SeparatorEditor el={el} idx={idx} updateElement={updateElement} />}
                </div>
              )}
            </div>
          );
        })}

        {cfg.elements.length === 0 && (
          <div className="hfe-empty">No elements yet — add images, text, labels, or dividers above.</div>
        )}
      </div>

      {/* reset */}
      <div className="hfe-footer-bar">
        <button className="btn btn-ghost btn-xs" onClick={() => onChange(zone === 'header' ? { ...DEFAULT_HEADER } : { ...DEFAULT_FOOTER })}>
          <HiOutlineArrowPath /> Reset to Default
        </button>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════
   Element sub-editors (compact)
   ══════════════════════════════════════════════════ */
function ImageEditor({ el, idx, updateElement, handleImageUpload }) {
  return (
    <>
      <div className="hfe-row">
        <label className="hfe-inline-field hfe-inline-grow">
          <span>Image URL</span>
          <input type="text" value={el.src || ''} onChange={e => updateElement(idx, 'src', e.target.value)} placeholder="/uwc_logo.svg" />
        </label>
        <button className="btn btn-secondary btn-xs" onClick={() => handleImageUpload(idx)} style={{ alignSelf: 'flex-end' }}>
          <HiOutlinePhoto /> Upload
        </button>
      </div>
      <div className="hfe-row">
        <label className="hfe-inline-field hfe-inline-grow">
          <span>Alt</span>
          <input type="text" value={el.alt || ''} onChange={e => updateElement(idx, 'alt', e.target.value)} />
        </label>
        <label className="hfe-inline-field hfe-w80">
          <span>Height</span>
          <input type="number" value={el.height || 56} onChange={e => updateElement(idx, 'height', parseInt(e.target.value) || 56)} min={16} max={200} />
        </label>
        <label className="hfe-inline-field hfe-w80">
          <span>Align</span>
          <select value={el.align || 'center'} onChange={e => updateElement(idx, 'align', e.target.value)}>
            {ALIGN_OPTIONS.map(a => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
          </select>
        </label>
      </div>
      {el.src && (
        <div className="hfe-thumb"><img src={el.src} alt={el.alt} onError={e => { e.target.style.display = 'none'; }} /></div>
      )}
    </>
  );
}

function TextEditor({ el, idx, updateElement }) {
  return (
    <>
      <div className="hfe-row">
        <label className="hfe-inline-field hfe-inline-grow">
          <span>Content</span>
          <input type="text" value={el.content || ''} onChange={e => updateElement(idx, 'content', e.target.value)} />
        </label>
      </div>
      <div className="hfe-row">
        <label className="hfe-inline-field hfe-w65">
          <span>Size</span>
          <input type="number" value={el.fontSize || 13} onChange={e => updateElement(idx, 'fontSize', parseInt(e.target.value) || 13)} min={8} max={48} />
        </label>
        <label className="hfe-inline-field hfe-w100">
          <span>Weight</span>
          <select value={el.fontWeight || '400'} onChange={e => updateElement(idx, 'fontWeight', e.target.value)}>
            <option value="300">Light</option><option value="400">Normal</option>
            <option value="500">Medium</option><option value="600">Semibold</option>
            <option value="700">Bold</option><option value="800">Extra Bold</option>
          </select>
        </label>
        <label className="hfe-inline-field hfe-w80">
          <span>Align</span>
          <select value={el.align || 'center'} onChange={e => updateElement(idx, 'align', e.target.value)}>
            {ALIGN_OPTIONS.map(a => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
          </select>
        </label>
        <label className="hfe-inline-field hfe-w70">
          <span>Opacity</span>
          <input type="range" min={0} max={1} step={0.05} value={el.opacity ?? 1} onChange={e => updateElement(idx, 'opacity', parseFloat(e.target.value))} />
        </label>
        <label className="hfe-chk-inline">
          <input type="checkbox" checked={el.uppercase || false} onChange={e => updateElement(idx, 'uppercase', e.target.checked)} />
          <span>ABC</span>
        </label>
      </div>
    </>
  );
}

function DateEditor({ el, idx, updateElement }) {
  return (
    <div className="hfe-row">
      <label className="hfe-inline-field hfe-w160">
        <span>Format</span>
        <select value={el.format || 'full'} onChange={e => updateElement(idx, 'format', e.target.value)}>
          <option value="full">February 11, 2026</option>
          <option value="short">11/02/2026</option>
          <option value="iso">2026-02-11</option>
          <option value="year">2026</option>
        </select>
      </label>
      <label className="hfe-inline-field hfe-w65">
        <span>Size</span>
        <input type="number" value={el.fontSize || 11} onChange={e => updateElement(idx, 'fontSize', parseInt(e.target.value) || 11)} min={8} max={24} />
      </label>
      <label className="hfe-inline-field hfe-w80">
        <span>Align</span>
        <select value={el.align || 'center'} onChange={e => updateElement(idx, 'align', e.target.value)}>
          {ALIGN_OPTIONS.map(a => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
        </select>
      </label>
    </div>
  );
}

function SeparatorEditor({ el, idx, updateElement }) {
  return (
    <div className="hfe-row">
      <label className="hfe-inline-field hfe-w90">
        <span>Style</span>
        <select value={el.style || 'solid'} onChange={e => updateElement(idx, 'style', e.target.value)}>
          <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
        </select>
      </label>
      <label className="hfe-inline-field hfe-w65">
        <span>Thick</span>
        <input type="number" value={el.thickness || 1} onChange={e => updateElement(idx, 'thickness', parseInt(e.target.value) || 1)} min={1} max={6} />
      </label>
      <label className="hfe-inline-field hfe-w70">
        <span>Width</span>
        <input type="text" value={el.width || '80%'} onChange={e => updateElement(idx, 'width', e.target.value)} />
      </label>
      <label className="hfe-inline-field hfe-w40">
        <span>Color</span>
        <input type="color" value={el.color?.startsWith('#') ? el.color : '#cccccc'} onChange={e => updateElement(idx, 'color', e.target.value)} />
      </label>
    </div>
  );
}


/* ══════════════════════════════════════════════════
   Preview sub-component
   ══════════════════════════════════════════════════ */
export function HeaderFooterPreview({ zone, config, formTitle, formCode }) {
  const defaults = zone === 'header' ? DEFAULT_HEADER : DEFAULT_FOOTER;
  const cfg = { ...defaults, ...config };
  const elements = cfg.elements || [];

  const fmtDate = (f) => {
    const d = new Date();
    switch (f) {
      case 'short': return d.toLocaleDateString('en-GB');
      case 'iso':   return d.toISOString().split('T')[0];
      case 'year':  return String(d.getFullYear());
      default:      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  return (
    <div className="hfe-preview" style={{ background: cfg.background, color: cfg.textColor, padding: cfg.padding, position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
      {zone === 'header' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle at 20% 80%,rgba(197,165,90,0.08) 0%,transparent 50%),radial-gradient(circle at 80% 20%,rgba(255,255,255,0.04) 0%,transparent 50%)' }} />
      )}

      {elements.map((el, i) => {
        const base = { position: 'relative', zIndex: 1, textAlign: el.align || 'center' };

        if (el.type === 'image') return (
          <div key={el.id || i} style={{ ...base, display: 'flex', justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center', marginBottom: 8 }}>
            <img src={el.src} alt={el.alt || ''} style={{ height: el.height || 56, width: 'auto', background: '#fff', borderRadius: 8, padding: '6px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
          </div>
        );

        if (el.type === 'text' || el.type === 'title' || el.type === 'label') return (
          <div key={el.id || i} style={{ ...base, fontSize: el.fontSize || 13, fontWeight: el.fontWeight || '400', letterSpacing: el.letterSpacing || 'normal', textTransform: el.uppercase ? 'uppercase' : 'none', opacity: el.opacity ?? 1, marginBottom: el.type === 'title' ? 2 : 4 }}>
            {el.content}
          </div>
        );

        if (el.type === 'date') return (
          <div key={el.id || i} style={{ ...base, fontSize: el.fontSize || 11, opacity: 0.6, marginBottom: 4 }}>{fmtDate(el.format)}</div>
        );

        if (el.type === 'separator') return (
          <div key={el.id || i} style={{ ...base, display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
            <hr style={{ width: el.width || '80%', border: 'none', borderTop: `${el.thickness || 1}px ${el.style || 'solid'} ${el.color || 'rgba(255,255,255,0.2)'}`, margin: 0 }} />
          </div>
        );

        return null;
      })}

      {zone === 'header' && (formTitle || formCode) && (
        <div style={{ position: 'relative', zIndex: 1, marginTop: 6 }}>
          {formTitle && <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{formTitle}</div>}
          {formCode && <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: '0.04em' }}>{formCode}</div>}
        </div>
      )}

      {cfg.showAccentBar && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${cfg.accentColor || '#C5A55A'}, ${lightenColor(cfg.accentColor || '#C5A55A')}, ${cfg.accentColor || '#C5A55A'})` }} />
      )}
    </div>
  );
}


/* ── lighten hex helper ── */
function lightenColor(hex) {
  try {
    const c = hex.replace('#', '');
    const r = Math.min(255, parseInt(c.substring(0, 2), 16) + 60);
    const g = Math.min(255, parseInt(c.substring(2, 4), 16) + 60);
    const b = Math.min(255, parseInt(c.substring(4, 6), 16) + 60);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch { return hex; }
}
