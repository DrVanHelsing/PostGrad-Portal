// ============================================
// DynamicFormRenderer – Master form renderer
// Builds a complete multi-section form from a
// template schema JSON. Handles role-gating,
// conditional visibility, signatures, and
// auto-populated fields.
// ============================================
import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  HiOutlineCheckCircle, HiOutlineLockClosed,
  HiOutlineArrowPath, HiOutlineArrowDownTray,
  HiOutlineExclamationTriangle, HiOutlinePaperAirplane,
} from 'react-icons/hi2';
import FormFieldRenderer from './FormFieldRenderer';
import FormSignatureBlock from './FormSignatureBlock';
import LockedSectionOverlay from './LockedSectionOverlay';
import './document-form.css';

/**
 * @param {Object}   template          – Full template schema
 * @param {Object}   formData          – { [fieldId]: value, ... }
 * @param {Object}   sectionStatuses   – { [sectionId]: 'pending' | 'in_progress' | 'completed' | 'referred_back' }
 * @param {Object}   signatures        – { [sectionId]: { type, data, name, date } }
 * @param {string}   currentUserRole   – 'student' | 'supervisor' | 'co_supervisor' | 'coordinator' | 'admin'
 * @param {Object}   currentUser       – user profile object
 * @param {Object}   studentProfile    – active student profile (for auto_populated)
 * @param {Function} onFieldChange     – (fieldId, value) => void
 * @param {Function} onSectionSign     – (sectionId, sigData) => void
 * @param {Function} onSectionComplete – (sectionId) => void
 * @param {Function} onSectionReferBack – (sectionId, comment) => void
 * @param {Function} onExport          – () => void
 * @param {Function} onSubmit          – () => void
 * @param {boolean}  readOnly          – entire form is read-only
 * @param {boolean}  bypassRoleLocking  – when true, shows all sections unlocked (no LockedSectionOverlay)
 * @param {Object}   validationErrors  – { [fieldId]: 'message', ... }
 */
export default function DynamicFormRenderer({
  template,
  formData = {},
  sectionStatuses = {},
  signatures = {},
  currentUserRole,
  currentUser,
  studentProfile,
  onFieldChange,
  onSectionSign,
  onSectionComplete,
  onSectionReferBack,
  onExport,
  onSubmit,
  readOnly = false,
  bypassRoleLocking = false,
  validationErrors = {},
}) {
  const [referBackComment, setReferBackComment] = useState('');
  const [activeReferBack, setActiveReferBack] = useState(null);

  /* ── Resolve auto-populated values on mount ── */
  useEffect(() => {
    if (!template?.sections) return;
    template.sections.forEach((section) => {
      section.fields?.forEach((field) => {
        if (field.type === 'auto_populated' && field.autoPopulate && !formData[field.id]) {
          const val = resolveAutoPopulate(field.autoPopulate, currentUser, studentProfile);
          if (val) onFieldChange?.(field.id, val);
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.slug]);

  /* ── Check if a section is editable by current user ── */
  const canEditSection = useCallback((section) => {
    if (readOnly) return false;
    if (currentUserRole === 'admin') return true;
    if (section.assignedRole !== currentUserRole) return false;
    const status = sectionStatuses[section.id];
    return !status || status === 'in_progress' || status === 'referred_back';
  }, [readOnly, currentUserRole, sectionStatuses]);

  /* ── Determine section visibility (conditional) ── */
  const visibleSections = useMemo(() => {
    if (!template?.sections) return [];
    return template.sections
      .filter((s) => !s.conditionalOn || evaluateCondition(s.conditionalOn, formData, studentProfile))
      .sort((a, b) => a.order - b.order);
  }, [template, formData, studentProfile]);

  /* ── Overall progress ── */
  const progress = useMemo(() => {
    const total = visibleSections.length;
    const done = visibleSections.filter((s) => sectionStatuses[s.id] === 'completed').length;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }, [visibleSections, sectionStatuses]);

  if (!template) return null;

  return (
    <div className="document-form">
      {/* ── Document header ── */}
      <DocumentHeader layout={template.layout} />

      {/* ── Progress bar ── */}
      <div className="document-form-progress">
        <div className="document-form-progress-bar">
          <div className="document-form-progress-fill" style={{ width: `${progress.percent}%` }} />
        </div>
        <span className="document-form-progress-text">
          {progress.done} / {progress.total} sections completed ({progress.percent}%)
        </span>
      </div>

      {/* ── Sections ── */}
      {visibleSections.map((section) => {
        const isEditable = canEditSection(section);
        const status = sectionStatuses[section.id] || 'pending';
        const isSigned = !!signatures[section.id];
        const isCompleted = status === 'completed';
        const isReferredBack = status === 'referred_back';

        return (
          <div
            key={section.id}
            className={`document-form-section ${
              isCompleted ? 'section-completed' : ''
            } ${isReferredBack ? 'section-referred-back' : ''}`}
          >
            {/* Section header */}
            <div className="document-form-section-header">
              <div className="section-header-title">
                {section.borderLabel && (
                  <span className="section-border-label">{section.borderLabel}</span>
                )}
                <h3>{section.title}</h3>
                <SectionStatusBadge status={status} role={section.assignedRole} />
              </div>
              {isReferredBack && (
                <div className="section-referred-back-banner">
                  <HiOutlineExclamationTriangle />
                  <span>This section has been referred back for revision.</span>
                </div>
              )}
            </div>

            {/* Section body – locked or editable */}
            <div className={`document-form-section-body ${section.layoutMode === 'table' ? 'layout-table' : 'layout-flow'}`}>
              {!bypassRoleLocking && !isEditable && !isCompleted && section.assignedRole !== currentUserRole && (
                <LockedSectionOverlay
                  role={section.assignedRole}
                  status={status}
                />
              )}

              {/* Render fields */}
              {section.fields?.map((field) => {
                // Handle conditional fields
                if (field.conditionalOn && !evaluateCondition(field.conditionalOn, formData)) {
                  return null;
                }
                return (
                  <FormFieldRenderer
                    key={field.id}
                    field={field}
                    value={formData[field.id]}
                    onChange={(val) => onFieldChange?.(field.id, val)}
                    disabled={!isEditable}
                    error={validationErrors[field.id]}
                    currentUser={currentUser}
                    studentProfile={studentProfile}
                    allFormData={formData}
                  />
                );
              })}

              {/* Signature block */}
              {section.requiresSignature && (
                <FormSignatureBlock
                  sectionId={section.id}
                  label={section.signatureLabel}
                  signed={isSigned}
                  signatureData={signatures[section.id]}
                  canSign={isEditable && !isCompleted}
                  onSign={(sigData) => onSectionSign?.(section.id, sigData)}
                />
              )}
            </div>

            {/* Section actions */}
            {isEditable && !isCompleted && (
              <div className="document-form-section-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onSectionComplete?.(section.id)}
                  disabled={section.requiresSignature && !isSigned}
                >
                  <HiOutlineCheckCircle /> Complete Section
                </button>
              </div>
            )}

            {/* Refer-back action (for next-role reviewers) */}
            {!isEditable && section.assignedRole !== currentUserRole
              && currentUserRole !== 'student'
              && !isCompleted && status === 'in_progress' && (
              <div className="document-form-section-actions" style={{ borderTop: '1px dashed var(--border-muted)' }}>
                {activeReferBack === section.id ? (
                  <div className="refer-back-form">
                    <textarea
                      className="form-textarea"
                      placeholder="Reason for referring back..."
                      value={referBackComment}
                      onChange={(e) => setReferBackComment(e.target.value)}
                      rows={2}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => {
                          onSectionReferBack?.(section.id, referBackComment);
                          setActiveReferBack(null);
                          setReferBackComment('');
                        }}
                        disabled={!referBackComment.trim()}
                      >
                        <HiOutlineArrowPath /> Refer Back
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setActiveReferBack(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setActiveReferBack(section.id)}
                  >
                    <HiOutlineArrowPath /> Refer Back
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Form-level actions ── */}
      <div className="document-form-actions">
        {onExport && (
          <button className="btn btn-outline" onClick={onExport}>
            <HiOutlineArrowDownTray /> Export to Word
          </button>
        )}
        {onSubmit && !readOnly && (
          <button
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={progress.percent < 100}
          >
            <HiOutlinePaperAirplane /> Submit Form
          </button>
        )}
      </div>

      {/* ── Document footer ── */}
      <DocumentFooter layout={template.layout} />
    </div>
  );
}


/* ── Date format helper ── */
function formatDateStr(fmt) {
  const d = new Date();
  switch (fmt) {
    case 'short': return d.toLocaleDateString('en-GB');
    case 'iso': return d.toISOString().split('T')[0];
    case 'year': return String(d.getFullYear());
    default: return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

/* ── Render elements from headerConfig/footerConfig ── */
function renderElements(elements, textColor) {
  if (!elements || !Array.isArray(elements)) return null;
  return elements.map((el, i) => {
    const base = { position: 'relative', zIndex: 1, textAlign: el.align || 'center' };
    if (el.type === 'image') {
      return (
        <div key={el.id || i} style={{ ...base, display: 'flex', justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center', marginBottom: 8 }}>
          <img src={el.src} alt={el.alt || ''} style={{ height: el.height || 56, width: 'auto', background: '#fff', borderRadius: 8, padding: '6px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', objectFit: 'contain' }}
            onError={e => { e.target.style.display = 'none'; }} />
        </div>
      );
    }
    if (el.type === 'text' || el.type === 'title' || el.type === 'label') {
      return (
        <div key={el.id || i} style={{ ...base, fontSize: el.fontSize || 13, fontWeight: el.fontWeight || '400', letterSpacing: el.letterSpacing || 'normal', textTransform: el.uppercase ? 'uppercase' : 'none', opacity: el.opacity ?? 1, marginBottom: el.type === 'title' ? 2 : 4 }}>
          {el.content}
        </div>
      );
    }
    if (el.type === 'date') {
      return <div key={el.id || i} style={{ ...base, fontSize: el.fontSize || 11, opacity: 0.6, marginBottom: 4 }}>{formatDateStr(el.format)}</div>;
    }
    if (el.type === 'separator') {
      return (
        <div key={el.id || i} style={{ ...base, display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
          <hr style={{ width: el.width || '80%', border: 'none', borderTop: `${el.thickness || 1}px ${el.style || 'solid'} ${el.color || 'rgba(255,255,255,0.2)'}`, margin: 0 }} />
        </div>
      );
    }
    return null;
  });
}


/* ── Document Header sub-component ── */
function DocumentHeader({ layout }) {
  if (!layout?.header && !layout?.headerConfig) return null;

  // New element-based header
  const hc = layout.headerConfig;
  if (hc?.elements) {
    const { formTitle, formCode } = layout.header || {};
    return (
      <div className="document-form-header" style={{
        background: hc.background || undefined,
        color: hc.textColor || undefined,
        padding: hc.padding || undefined,
      }}>
        <div className="document-form-header::before" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 20% 80%, rgba(197,165,90,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%)' }} />
        {renderElements(hc.elements, hc.textColor)}
        {(formTitle || formCode) && (
          <div className="document-form-header-title">
            {formTitle && <h2>{formTitle}</h2>}
            {formCode && <span className="form-code">{formCode}</span>}
          </div>
        )}
        {hc.showAccentBar && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${hc.accentColor || '#C5A55A'}, ${lighten(hc.accentColor || '#C5A55A')}, ${hc.accentColor || '#C5A55A'})` }} />
        )}
      </div>
    );
  }

  // Legacy flat header (backward compat)
  const { formTitle, formCode, lines } = layout.header || {};
  return (
    <div className="document-form-header">
      <div className="document-form-header-logo">
        <img src="/uwc_logo.svg" alt="University of the Western Cape" onError={(e) => { e.target.style.display = 'none'; }} />
      </div>
      <div className="document-form-header-text">
        {lines?.map((line, i) => (
          <div key={i} className={`header-line ${i === 0 ? 'header-line-primary' : ''}`}>
            {line}
          </div>
        ))}
      </div>
      <div className="document-form-header-title">
        <h2>{formTitle}</h2>
        {formCode && <span className="form-code">{formCode}</span>}
      </div>
    </div>
  );
}


/* ── Section Status Badge ── */
function SectionStatusBadge({ status, role }) {
  const config = {
    pending: { label: 'Pending', color: 'var(--text-muted)', bg: 'var(--bg-muted)' },
    in_progress: { label: 'In Progress', color: 'var(--status-progress)', bg: '#e0f2fe' },
    completed: { label: 'Completed', color: 'var(--status-approved)', bg: '#dcfce7' },
    referred_back: { label: 'Referred Back', color: 'var(--status-review)', bg: '#fef3c7' },
  };
  const c = config[status] || config.pending;
  return (
    <span className="section-status-badge" style={{ color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
}


/* ── Helpers ── */

/* lighten a hex color for gradient */
function lighten(hex) {
  try {
    const c = (hex || '#C5A55A').replace('#', '');
    const r = Math.min(255, parseInt(c.substring(0, 2), 16) + 60);
    const g = Math.min(255, parseInt(c.substring(2, 4), 16) + 60);
    const b = Math.min(255, parseInt(c.substring(4, 6), 16) + 60);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch { return hex; }
}

/* ── Document Footer sub-component ── */
function DocumentFooter({ layout }) {
  const fc = layout?.footerConfig;
  if (!fc?.elements || fc.elements.length === 0) return null;
  return (
    <div className="document-form-footer" style={{
      background: fc.background || 'var(--bg-muted, #f5f6f8)',
      color: fc.textColor || 'var(--text-secondary, #666)',
      padding: fc.padding || '12px 32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {fc.showAccentBar && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${fc.accentColor || '#C5A55A'}, ${lighten(fc.accentColor || '#C5A55A')}, ${fc.accentColor || '#C5A55A'})` }} />
      )}
      {renderElements(fc.elements, fc.textColor)}
    </div>
  );
}

function resolveAutoPopulate(config, currentUser, studentProfile) {
  if (!config) return '';
  const { source, field } = config;
  if (source === 'system') {
    if (field === 'currentDate') return new Date().toISOString().split('T')[0];
    return '';
  }
  if (source === 'user' && currentUser) {
    if (field === 'name') return `${currentUser.firstName || ''} ${currentUser.surname || currentUser.lastName || ''}`.trim();
    return currentUser[field] || '';
  }
  if (source === 'studentProfile' && studentProfile) {
    if (field === 'fullName') return `${studentProfile.firstName || ''} ${studentProfile.surname || ''}`.trim();
    return studentProfile[field] || '';
  }
  return '';
}


export function evaluateCondition(condition, formData, studentProfile) {
  if (!condition) return true;

  /* ── Student-profile-based conditions (e.g. Section C year threshold) ── */
  if (condition.source === 'studentProfile') {
    if (!studentProfile) return false;
    if (condition.operator === 'year_threshold') {
      const degree = (studentProfile[condition.degreeField] || '').toLowerCase();
      const years = Number(studentProfile[condition.yearField]) || 0;
      const isMsc = degree.startsWith('msc') || degree === 'ma' || degree === 'mcom';
      const isPhd = degree === 'phd' || degree === 'dphil';
      if (isMsc) return years >= (condition.mscYear || 3);
      if (isPhd) return years >= (condition.phdYear || 5);
      return false;
    }
    return true;
  }

  /* ── Standard field-based conditions ── */
  const { fieldId, operator, value } = condition;
  const fieldValue = formData[fieldId];

  switch (operator) {
    case 'equals': return fieldValue === value;
    case 'not_equals': return fieldValue !== value;
    case 'contains': return typeof fieldValue === 'string' && fieldValue.includes(value);
    case 'not_empty': return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    case 'empty': return !fieldValue;
    case 'in': return Array.isArray(value) && value.includes(fieldValue);
    default: return true;
  }
}
