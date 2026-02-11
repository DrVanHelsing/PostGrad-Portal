// ============================================
// Form Builder Page – Full-screen Admin Tool
// Three-panel editor with drag-and-drop, auto-save,
// dedicated toolbar header, and professional icons
// ============================================

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Modal, Card, StatusBadge, EmptyState } from '../components/common';
import { DynamicFormRenderer } from '../components/forms';
import HeaderFooterEditor, { DEFAULT_HEADER, DEFAULT_FOOTER } from '../components/forms/HeaderFooterEditor';
import { ALL_PREBUILT_TEMPLATES } from '../firebase/prebuiltTemplates';
import { FORM_CATEGORIES, FORM_TYPE_LABELS, SECTION_ROLE_COLORS } from '../utils/constants';
import {
  HiOutlineDocumentText, HiOutlinePlusCircle, HiOutlinePencilSquare,
  HiOutlineTrash, HiOutlineArrowUp, HiOutlineArrowDown, HiOutlineEye,
  HiOutlineCheckCircle, HiOutlineArchiveBox, HiOutlineDocumentDuplicate,
  HiOutlineArrowPath, HiOutlineMagnifyingGlass, HiOutlineXMark,
  HiOutlineChevronDown, HiOutlineChevronRight, HiOutlineViewColumns,
  HiOutlinePencil, HiOutlineBars3, HiOutlineListBullet, HiOutlineCalendarDays,
  HiOutlineEnvelope, HiOutlinePhone, HiOutlineHashtag,
  HiOutlineTag, HiOutlineTableCells,
  HiOutlineDocumentPlus, HiOutlinePaperClip, HiOutlineInformationCircle,
  HiOutlineCloudArrowUp, HiOutlineBars3BottomLeft,
  HiOutlineArrowUturnLeft, HiOutlineBookmarkSquare, HiOutlineCog6Tooth,
  HiOutlineRectangleGroup, HiOutlineSquare2Stack,
  HiOutlineArrowsPointingOut,
  HiOutlineUserCircle,
  HiOutlineGlobeAlt,
} from 'react-icons/hi2';
import './FormBuilderPage.css';

/* ── Field type configuration with professional icons ── */
const FIELD_TYPES = [
  { type: 'text',            label: 'Text Input',       Icon: HiOutlinePencil },
  { type: 'textarea',        label: 'Text Area',        Icon: HiOutlineBars3 },
  { type: 'select',          label: 'Dropdown',         Icon: HiOutlineListBullet },
  { type: 'date',            label: 'Date Picker',      Icon: HiOutlineCalendarDays },
  { type: 'email',           label: 'Email',            Icon: HiOutlineEnvelope },
  { type: 'phone',           label: 'Phone',            Icon: HiOutlinePhone },
  { type: 'number',          label: 'Number',           Icon: HiOutlineHashtag },
  { type: 'checkbox',        label: 'Checkbox',         Icon: HiOutlineCheckCircle },
  { type: 'auto_populated',  label: 'Auto-populated',   Icon: HiOutlineArrowPath },
  { type: 'keywords_tag',    label: 'Keywords Tags',    Icon: HiOutlineTag },
  { type: 'weighted_table',  label: 'Weighted Table',   Icon: HiOutlineTableCells },
  { type: 'repeater_group',  label: 'Repeater Group',   Icon: HiOutlineSquare2Stack },
  { type: 'file_upload',     label: 'File Upload',      Icon: HiOutlinePaperClip },
  { type: 'paragraph',       label: 'Info Text',        Icon: HiOutlineInformationCircle },
];

const ROLE_OPTIONS = ['student', 'supervisor', 'co_supervisor', 'coordinator', 'admin', 'external'];

const AUTO_SAVE_DELAY = 2500; // ms

/* ════════════════════════════════════════════ */
export default function FormBuilderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    formTemplates, setFormTemplate, updateFormTemplate,
    publishFormTemplate, archiveFormTemplate, duplicateFormTemplate,
  } = useData();

  /* ── State ── */
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [showPreviewFullscreen, setShowPreviewFullscreen] = useState(false);
  const [previewRole, setPreviewRole] = useState('student');
  const [previewFullForm, setPreviewFullForm] = useState(false);
  const [showApplyAllConfirm, setShowApplyAllConfirm] = useState(null); // 'header' | 'footer' | null
  const [expandedSections, setExpandedSections] = useState({});
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(null);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // 'saving' | 'saved' | null
  const autoSaveTimerRef = useRef(null);

  /* Loading & UI state */
  const [pageLoading, setPageLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [showFooterModal, setShowFooterModal] = useState(false);

  /* Simulate initial page load */
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  /* Drag state */
  const [dragItem, setDragItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  /* ── Merged template list ── */
  const allTemplates = useMemo(() => {
    const fsMap = new Map(formTemplates.map(t => [t.slug, t]));
    const merged = [...formTemplates];
    ALL_PREBUILT_TEMPLATES.forEach(t => {
      if (!fsMap.has(t.slug)) merged.push({ ...t, _isLocal: true });
    });
    return merged;
  }, [formTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      const matchSearch = !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCategory === 'all' || t.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [allTemplates, searchTerm, filterCategory]);

  /* ── Load template for editing ── */
  const selectTemplate = useCallback((template) => {
    setSelectedTemplateId(template.id || template.slug);
    setEditingTemplate(JSON.parse(JSON.stringify(template)));
    setDirty(false);
    setEditingFieldId(null);
    setExpandedSections({});
    setAutoSaveStatus(null);
    setSidebarCollapsed(true);
  }, []);

  /* ── Save ── */
  const handleSave = useCallback(async (silent = false) => {
    if (!editingTemplate || saving) return;
    setSaving(true);
    if (!silent) setAutoSaveStatus('saving');
    try {
      const cleanTemplate = { ...editingTemplate };
      delete cleanTemplate._isLocal;
      delete cleanTemplate.id;

      if (editingTemplate._isLocal || !editingTemplate.id) {
        await setFormTemplate(editingTemplate.slug, cleanTemplate);
      } else {
        await updateFormTemplate(editingTemplate.id, cleanTemplate);
      }
      setDirty(false);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(prev => prev === 'saved' ? null : prev), 3000);
    } catch (err) {
      console.error('Save template error:', err);
      setAutoSaveStatus(null);
    } finally {
      setSaving(false);
    }
  }, [editingTemplate, saving, setFormTemplate, updateFormTemplate]);

  /* ── Auto-save on dirty changes ── */
  useEffect(() => {
    if (!dirty || !editingTemplate) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true);
    }, AUTO_SAVE_DELAY);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [dirty, editingTemplate, handleSave]);

  /* ── Save & Exit ── */
  const handleSaveAndExit = useCallback(async () => {
    if (dirty && editingTemplate) {
      setSaveLoading(true);
      await handleSave(false);
      // small delay so user sees the overlay
      await new Promise(r => setTimeout(r, 600));
      setSaveLoading(false);
    }
    navigate('/dashboard');
  }, [dirty, editingTemplate, handleSave, navigate]);

  /* ── Discard & Exit ── */
  const handleDiscardAndExit = useCallback(() => {
    if (dirty) {
      setShowDiscardConfirm(true);
    } else {
      navigate('/dashboard');
    }
  }, [dirty, navigate]);

  const confirmDiscard = useCallback(() => {
    setShowDiscardConfirm(false);
    navigate('/dashboard');
  }, [navigate]);

  /* ── Seed all prebuilt templates ── */
  const handleSeedAll = useCallback(async () => {
    setSaving(true);
    try {
      for (const t of ALL_PREBUILT_TEMPLATES) {
        const exists = formTemplates.find(ft => ft.slug === t.slug);
        if (!exists) {
          await setFormTemplate(t.slug, { ...t, status: 'published', isPrebuilt: true });
        }
      }
      setShowSeedConfirm(false);
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setSaving(false);
    }
  }, [formTemplates, setFormTemplate]);

  /* ── Mutators ── */
  const updateTemplate = (path, value) => {
    setEditingTemplate(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let target = next;
      for (let i = 0; i < keys.length - 1; i++) target = target[keys[i]];
      target[keys[keys.length - 1]] = value;
      return next;
    });
    setDirty(true);
  };

  const moveSection = (idx, dir) => {
    setEditingTemplate(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const arr = next.sections;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return next;
    });
    setDirty(true);
  };

  const removeSection = (idx) => {
    setEditingTemplate(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sections.splice(idx, 1);
      return next;
    });
    setDirty(true);
  };

  const addSection = (section) => {
    setEditingTemplate(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sections.push(section);
      return next;
    });
    setDirty(true);
    setShowAddSectionModal(false);
  };

  const moveField = (sectionIdx, fieldIdx, dir) => {
    setEditingTemplate(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const arr = next.sections[sectionIdx].fields;
      const newIdx = fieldIdx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return prev;
      [arr[fieldIdx], arr[newIdx]] = [arr[newIdx], arr[fieldIdx]];
      return next;
    });
    setDirty(true);
  };

  const removeField = (sectionIdx, fieldIdx) => {
    setEditingTemplate(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sections[sectionIdx].fields.splice(fieldIdx, 1);
      return next;
    });
    setDirty(true);
    setEditingFieldId(null);
  };

  const addField = (sectionIdx, field) => {
    setEditingTemplate(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sections[sectionIdx].fields.push(field);
      return next;
    });
    setDirty(true);
    setShowAddFieldModal(null);
  };

  const updateField = (sectionIdx, fieldIdx, key, value) => {
    setEditingTemplate(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sections[sectionIdx].fields[fieldIdx][key] = value;
      return next;
    });
    setDirty(true);
  };

  const toggleSection = (idx) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  /* ── Header/Footer helpers ── */
  const updateHeaderConfig = useCallback((newConfig) => {
    setEditingTemplate(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.layout) next.layout = {};
      next.layout.headerConfig = newConfig;
      return next;
    });
    setDirty(true);
  }, []);

  const updateFooterConfig = useCallback((newConfig) => {
    setEditingTemplate(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.layout) next.layout = {};
      next.layout.footerConfig = newConfig;
      return next;
    });
    setDirty(true);
  }, []);

  const handleApplyToAll = useCallback(async (zone) => {
    if (!editingTemplate) return;
    setSaving(true);
    try {
      const configKey = zone === 'header' ? 'headerConfig' : 'footerConfig';
      const config = editingTemplate.layout?.[configKey];
      // Also apply formTitle/formCode per-template if header
      for (const t of formTemplates) {
        if (t.id && t.id !== editingTemplate.id) {
          const updates = { [`layout.${configKey}`]: config || (zone === 'header' ? DEFAULT_HEADER : DEFAULT_FOOTER) };
          await updateFormTemplate(t.id, updates);
        }
      }
      setShowApplyAllConfirm(null);
    } catch (err) {
      console.error('Apply to all error:', err);
    } finally {
      setSaving(false);
    }
  }, [editingTemplate, formTemplates, updateFormTemplate]);

  /* ── Drag & Drop – Sections ── */
  const handleSectionDragStart = (e, sIdx) => {
    setDragItem({ type: 'section', sectionIdx: sIdx });
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleSectionDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    if (dragItem && dragOverItem && dragItem.type === 'section' && dragOverItem.type === 'section' && dragItem.sectionIdx !== dragOverItem.sectionIdx) {
      setEditingTemplate(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const arr = next.sections;
        const [removed] = arr.splice(dragItem.sectionIdx, 1);
        arr.splice(dragOverItem.sectionIdx, 0, removed);
        return next;
      });
      setDirty(true);
    }
    setDragItem(null);
    setDragOverItem(null);
  };

  const handleSectionDragOver = (e, sIdx) => {
    e.preventDefault();
    setDragOverItem({ type: 'section', sectionIdx: sIdx });
  };

  /* ── Drag & Drop – Fields ── */
  const handleFieldDragStart = (e, sIdx, fIdx) => {
    e.stopPropagation();
    setDragItem({ type: 'field', sectionIdx: sIdx, fieldIdx: fIdx });
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleFieldDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    if (dragItem && dragOverItem && dragItem.type === 'field' && dragOverItem.type === 'field'
        && dragItem.sectionIdx === dragOverItem.sectionIdx
        && dragItem.fieldIdx !== dragOverItem.fieldIdx) {
      setEditingTemplate(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const arr = next.sections[dragItem.sectionIdx].fields;
        const [removed] = arr.splice(dragItem.fieldIdx, 1);
        arr.splice(dragOverItem.fieldIdx, 0, removed);
        return next;
      });
      setDirty(true);
    }
    setDragItem(null);
    setDragOverItem(null);
  };

  const handleFieldDragOver = (e, sIdx, fIdx) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItem({ type: 'field', sectionIdx: sIdx, fieldIdx: fIdx });
  };

  /* ══════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════ */
  return (
    <div className="fb-fullscreen">
      {/* \u2500\u2500 Loading Overlay \u2500\u2500 */}
      {pageLoading && (
        <div className="fb-loading-overlay">
          <div className="fb-loading-spinner" />
          <span>Loading Form Builder\u2026</span>
        </div>
      )}

      {/* \u2500\u2500 Save/Exit Loading Overlay \u2500\u2500 */}
      {saveLoading && (
        <div className="fb-loading-overlay">
          <div className="fb-loading-spinner" />
          <span>Saving changes\u2026</span>
        </div>
      )}
      {/* ── Top Toolbar ── */}
      <header className="fb-toolbar">
        <div className="fb-toolbar-left">
          <button className="fb-toolbar-back" onClick={handleDiscardAndExit} title="Back to Dashboard">
            <HiOutlineArrowUturnLeft />
          </button>
          <div className="fb-toolbar-brand">
            <HiOutlineRectangleGroup />
            <span>Form Builder</span>
          </div>
          {editingTemplate && (
            <span className="fb-toolbar-template-name">{editingTemplate.name}</span>
          )}
        </div>

        <div className="fb-toolbar-center">
          {autoSaveStatus === 'saving' && <span className="fb-autosave-indicator saving"><HiOutlineCloudArrowUp /> Saving…</span>}
          {autoSaveStatus === 'saved' && <span className="fb-autosave-indicator saved"><HiOutlineCheckCircle /> Saved</span>}
          {dirty && !autoSaveStatus && <span className="fb-autosave-indicator unsaved">Unsaved changes</span>}
        </div>

        <div className="fb-toolbar-right">
          <button className="btn btn-sm btn-secondary" onClick={() => setShowSeedConfirm(true)} title="Seed prebuilt templates">
            <HiOutlineArrowPath /> Seed All
          </button>
          {editingTemplate && (
            <button className="btn btn-sm btn-secondary" onClick={() => setShowPreview(!showPreview)}>
              <HiOutlineEye /> {showPreview ? 'Hide Preview' : 'Preview'}
            </button>
          )}
          <button className="btn btn-sm btn-primary" onClick={handleSaveAndExit}>
            <HiOutlineBookmarkSquare /> Save & Exit
          </button>
          <button className="btn btn-sm btn-ghost" onClick={handleDiscardAndExit} title="Discard changes and return to dashboard">
            <HiOutlineXMark /> Exit
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="fb-body">
        {/* ── LEFT PANEL: Template List (collapsible) ── */}
        <div className={`fb-panel fb-left ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="fb-panel-header">
            <h3><HiOutlineDocumentText /> {!sidebarCollapsed && 'Templates'}</h3>
            <button className="btn btn-icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {sidebarCollapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronDown />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <>
              <div className="fb-search-bar">
                <HiOutlineMagnifyingGlass />
                <input placeholder="Search templates…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <select className="fb-filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="all">All Categories</option>
                {Object.entries(FORM_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>

              <div className="fb-template-list">
            {filteredTemplates.length === 0 ? (
              <EmptyState icon={<HiOutlineDocumentText />} title="No templates" description="No templates match your filter." />
            ) : (
              filteredTemplates.map(t => (
                <div
                  key={t.slug}
                  className={`fb-template-item ${(t.id || t.slug) === selectedTemplateId ? 'active' : ''}`}
                  onClick={() => selectTemplate(t)}
                >
                  <div className="fb-template-name">{t.name}</div>
                  <div className="fb-template-meta">
                    <span className="fb-template-category">{t.category}</span>
                    {t._isLocal && <span className="fb-template-badge local">Local</span>}
                    {t.status === 'published' && <span className="fb-template-badge published">Published</span>}
                    {t.status === 'draft' && <span className="fb-template-badge draft">Draft</span>}
                    {t.status === 'archived' && <span className="fb-template-badge archived">Archived</span>}
                  </div>
                </div>
              ))
            )}
          </div>
            </>
          )}
        </div>

        {/* ── CENTER PANEL: Section/Field Editor ── */}
        <div className="fb-panel fb-center">
          {!editingTemplate ? (
            <div className="fb-empty-center">
              <HiOutlineViewColumns />
              <p>Select a template from the left panel to begin editing</p>
            </div>
          ) : (
            <>
              {/* Template header */}
              <div className="fb-editor-header">
                <div className="fb-editor-header-inputs">
                  <input className="fb-title-input" value={editingTemplate.name} onChange={e => updateTemplate('name', e.target.value)} placeholder="Template Name" />
                  <input className="fb-desc-input" value={editingTemplate.description || ''} onChange={e => updateTemplate('description', e.target.value)} placeholder="Description…" />
                </div>
              </div>

              {/* Template meta */}
              <div className="fb-meta-row">
                <label><HiOutlineCog6Tooth /> Category:
                  <select value={editingTemplate.category || ''} onChange={e => updateTemplate('category', e.target.value)}>
                    {Object.entries(FORM_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </label>
                <label>Initiator Roles:
                  <div className="fb-chip-group">
                    {ROLE_OPTIONS.map(r => (
                      <label key={r} className="fb-chip">
                        <input type="checkbox" checked={editingTemplate.initiatorRoles?.includes(r) || false}
                          onChange={e => {
                            const roles = new Set(editingTemplate.initiatorRoles || []);
                            e.target.checked ? roles.add(r) : roles.delete(r);
                            updateTemplate('initiatorRoles', [...roles]);
                          }} />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>
                </label>
              </div>

              {/* Header/Footer edit buttons */}
              <div className="fb-hf-buttons">
                <button className="btn btn-sm btn-secondary" onClick={() => setShowHeaderModal(true)}>
                  <HiOutlinePencilSquare /> Edit Header
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => setShowFooterModal(true)}>
                  <HiOutlinePencilSquare /> Edit Footer
                </button>
              </div>

              {/* Sections – draggable */}
              <div className="fb-sections">
                {(editingTemplate.sections || []).map((section, sIdx) => (
                  <div
                    key={sIdx}
                    className={`fb-section-card ${dragOverItem?.type === 'section' && dragOverItem.sectionIdx === sIdx ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={e => handleSectionDragStart(e, sIdx)}
                    onDragEnd={handleSectionDragEnd}
                    onDragOver={e => handleSectionDragOver(e, sIdx)}
                  >
                    <div className="fb-section-header" onClick={() => toggleSection(sIdx)}>
                      <span className="fb-drag-handle" title="Drag to reorder"><HiOutlineBars3BottomLeft /></span>
                      {expandedSections[sIdx] ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
                      <span className="fb-section-title">{section.title || `Section ${sIdx + 1}`}</span>
                      <span className="fb-section-role" style={{ background: SECTION_ROLE_COLORS[section.assignedRole]?.bg || '#eee', color: SECTION_ROLE_COLORS[section.assignedRole]?.color || '#333' }}>
                        {section.assignedRole || 'unassigned'}
                      </span>
                      <div className="fb-section-actions">
                        <button title="Move up" onClick={e => { e.stopPropagation(); moveSection(sIdx, -1); }} disabled={sIdx === 0}><HiOutlineArrowUp /></button>
                        <button title="Move down" onClick={e => { e.stopPropagation(); moveSection(sIdx, 1); }} disabled={sIdx === editingTemplate.sections.length - 1}><HiOutlineArrowDown /></button>
                        <button title="Delete section" onClick={e => { e.stopPropagation(); removeSection(sIdx); }}><HiOutlineTrash /></button>
                      </div>
                    </div>

                    {expandedSections[sIdx] && (
                      <div className="fb-section-body">
                        {/* Section settings */}
                        <div className="fb-section-settings">
                          <div className="fb-field-row">
                            <label>Title: <input value={section.title || ''} onChange={e => updateTemplate(`sections.${sIdx}.title`, e.target.value)} placeholder="Section title" /></label>
                            <label>Assigned Role:
                              <select value={section.assignedRole || ''} onChange={e => updateTemplate(`sections.${sIdx}.assignedRole`, e.target.value)}>
                                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </label>
                          </div>
                          <div className="fb-field-row">
                            <label>Layout:
                              <select value={section.layoutMode || 'table'} onChange={e => updateTemplate(`sections.${sIdx}.layoutMode`, e.target.value)}>
                                <option value="table">Table</option>
                                <option value="flow">Flow</option>
                              </select>
                            </label>
                            <label className="fb-checkbox-label" style={{ alignSelf: 'flex-end', paddingBottom: 8 }}>
                              <input type="checkbox" checked={section.requiresSignature || false} onChange={e => updateTemplate(`sections.${sIdx}.requiresSignature`, e.target.checked)} />
                              Requires Signature
                            </label>
                          </div>
                        </div>

                        {/* Fields – draggable */}
                        <div className="fb-fields-list">
                          {(section.fields || []).map((field, fIdx) => {
                            const FieldIcon = FIELD_TYPES.find(ft => ft.type === field.type)?.Icon || HiOutlineDocumentText;
                            return (
                              <div
                                key={fIdx}
                                className={`fb-field-item ${editingFieldId === `${sIdx}-${fIdx}` ? 'editing' : ''} ${dragOverItem?.type === 'field' && dragOverItem.sectionIdx === sIdx && dragOverItem.fieldIdx === fIdx ? 'drag-over' : ''}`}
                                draggable
                                onDragStart={e => handleFieldDragStart(e, sIdx, fIdx)}
                                onDragEnd={handleFieldDragEnd}
                                onDragOver={e => handleFieldDragOver(e, sIdx, fIdx)}
                              >
                                <div className="fb-field-summary" onClick={() => setEditingFieldId(editingFieldId === `${sIdx}-${fIdx}` ? null : `${sIdx}-${fIdx}`)}>
                                  <span className="fb-drag-handle fb-drag-handle-sm" title="Drag to reorder"><HiOutlineBars3BottomLeft /></span>
                                  <span className="fb-field-type-badge"><FieldIcon /></span>
                                  <span className="fb-field-label">{field.label || field.id}</span>
                                  <span className="fb-field-type">{field.type}</span>
                                  {field.required && <span className="fb-required-dot" title="Required">*</span>}
                                  <div className="fb-field-actions">
                                    <button title="Move up" onClick={e => { e.stopPropagation(); moveField(sIdx, fIdx, -1); }} disabled={fIdx === 0}><HiOutlineArrowUp /></button>
                                    <button title="Move down" onClick={e => { e.stopPropagation(); moveField(sIdx, fIdx, 1); }} disabled={fIdx === section.fields.length - 1}><HiOutlineArrowDown /></button>
                                    <button title="Remove" onClick={e => { e.stopPropagation(); removeField(sIdx, fIdx); }}><HiOutlineTrash /></button>
                                  </div>
                                </div>

                                {editingFieldId === `${sIdx}-${fIdx}` && (
                                  <div className="fb-field-editor">
                                    <div className="fb-field-row">
                                      <label>ID: <input value={field.id || ''} onChange={e => updateField(sIdx, fIdx, 'id', e.target.value)} /></label>
                                      <label>Label: <input value={field.label || ''} onChange={e => updateField(sIdx, fIdx, 'label', e.target.value)} /></label>
                                    </div>
                                    <div className="fb-field-row">
                                      <label>Type:
                                        <select value={field.type} onChange={e => updateField(sIdx, fIdx, 'type', e.target.value)}>
                                          {FIELD_TYPES.map(ft => <option key={ft.type} value={ft.type}>{ft.label}</option>)}
                                        </select>
                                      </label>
                                      <label>Width:
                                        <select value={field.width || 'full'} onChange={e => updateField(sIdx, fIdx, 'width', e.target.value)}>
                                          <option value="full">Full</option>
                                          <option value="half">Half</option>
                                          <option value="third">Third</option>
                                        </select>
                                      </label>
                                      <label className="fb-checkbox-label">
                                        <input type="checkbox" checked={field.required || false} onChange={e => updateField(sIdx, fIdx, 'required', e.target.checked)} />
                                        Required
                                      </label>
                                    </div>
                                    {field.type === 'select' && (
                                      <div className="fb-field-row">
                                        <label>Options (JSON):
                                          <textarea rows={3} value={JSON.stringify(field.options || [], null, 2)}
                                            onChange={e => {
                                              try { updateField(sIdx, fIdx, 'options', JSON.parse(e.target.value)); } catch {}
                                            }} />
                                        </label>
                                      </div>
                                    )}
                                    {field.type === 'auto_populated' && (
                                      <div className="fb-field-row">
                                        <label>Source:
                                          <select value={field.autoPopulate?.source || ''} onChange={e => updateField(sIdx, fIdx, 'autoPopulate', { ...field.autoPopulate, source: e.target.value })}>
                                            <option value="">—</option>
                                            <option value="user">User</option>
                                            <option value="studentProfile">Student Profile</option>
                                            <option value="system">System</option>
                                          </select>
                                        </label>
                                        <label>Field:
                                          <input value={field.autoPopulate?.field || ''} onChange={e => updateField(sIdx, fIdx, 'autoPopulate', { ...field.autoPopulate, field: e.target.value })} />
                                        </label>
                                      </div>
                                    )}
                                    <div className="fb-field-row">
                                      <label>Placeholder: <input value={field.placeholder || ''} onChange={e => updateField(sIdx, fIdx, 'placeholder', e.target.value)} /></label>
                                      <label>Help text: <input value={field.helpText || ''} onChange={e => updateField(sIdx, fIdx, 'helpText', e.target.value)} /></label>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <button className="btn btn-sm btn-secondary fb-add-field-btn" onClick={() => setShowAddFieldModal(sIdx)}>
                          <HiOutlinePlusCircle /> Add Field
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <button className="btn btn-secondary fb-add-section-btn" onClick={() => setShowAddSectionModal(true)}>
                  <HiOutlinePlusCircle /> Add Section
                </button>
              </div>

              {/* Template-level actions */}
              <div className="fb-bottom-actions">
                {editingTemplate.id && (
                  <>
                    {editingTemplate.status !== 'published' && (
                      <button className="btn btn-sm btn-success" onClick={() => publishFormTemplate(editingTemplate.id)}>
                        <HiOutlineCheckCircle /> Publish
                      </button>
                    )}
                    <button className="btn btn-sm btn-warning" onClick={() => archiveFormTemplate(editingTemplate.id)}>
                      <HiOutlineArchiveBox /> Archive
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => duplicateFormTemplate(editingTemplate.id)}>
                      <HiOutlineDocumentDuplicate /> Duplicate
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT PANEL: Live Preview ── */}
        {showPreview && editingTemplate && (
          <div className="fb-panel fb-right">
            <div className="fb-panel-header">
              <h3><HiOutlineEye /> Live Preview</h3>
              <div className="fb-panel-header-actions">
                <button className="btn btn-icon" onClick={() => setShowPreviewFullscreen(true)} title="Full screen preview"><HiOutlineArrowsPointingOut /></button>
                <button className="btn btn-icon" onClick={() => setShowPreview(false)}><HiOutlineXMark /></button>
              </div>
            </div>

            {/* Preview controls: Role Switcher + Full Form Toggle */}
            <PreviewControls
              previewRole={previewRole}
              onRoleChange={setPreviewRole}
              previewFullForm={previewFullForm}
              onFullFormToggle={setPreviewFullForm}
            />

            <div className="fb-preview-container">
              <DynamicFormRenderer
                template={editingTemplate}
                formData={{}}
                sectionStatuses={{}}
                signatures={{}}
                currentUserRole={previewRole}
                currentUser={user}
                studentProfile={{}}
                onFieldChange={() => {}}
                readOnly
                bypassRoleLocking={previewFullForm}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}

      {/* ── Edit Header Modal ── */}
      <Modal isOpen={showHeaderModal} onClose={() => setShowHeaderModal(false)} title="Edit Header Design" large>
        {editingTemplate && (
          <div className="fb-hf-modal-body">
            <HeaderFooterEditor
              zone="header"
              config={editingTemplate.layout?.headerConfig}
              onChange={updateHeaderConfig}
              formTitle={editingTemplate.layout?.header?.formTitle || ''}
              formCode={editingTemplate.layout?.header?.formCode || ''}
              onFormTitleChange={v => updateTemplate('layout.header.formTitle', v)}
              onFormCodeChange={v => updateTemplate('layout.header.formCode', v)}
              onApplyAll={() => setShowApplyAllConfirm('header')}
            />
            <div className="fb-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowApplyAllConfirm('header')}>Apply to All Templates</button>
              <button className="btn btn-primary" onClick={() => setShowHeaderModal(false)}>Done</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Footer Modal ── */}
      <Modal isOpen={showFooterModal} onClose={() => setShowFooterModal(false)} title="Edit Footer Design" large>
        {editingTemplate && (
          <div className="fb-hf-modal-body">
            <HeaderFooterEditor
              zone="footer"
              config={editingTemplate.layout?.footerConfig}
              onChange={updateFooterConfig}
              onApplyAll={() => setShowApplyAllConfirm('footer')}
            />
            <div className="fb-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowApplyAllConfirm('footer')}>Apply to All Templates</button>
              <button className="btn btn-primary" onClick={() => setShowFooterModal(false)}>Done</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showAddSectionModal} onClose={() => setShowAddSectionModal(false)} title="Add New Section">
        <AddSectionForm onAdd={addSection} onClose={() => setShowAddSectionModal(false)} />
      </Modal>

      <Modal isOpen={showAddFieldModal !== null} onClose={() => setShowAddFieldModal(null)} title="Add New Field">
        <AddFieldForm onAdd={(field) => addField(showAddFieldModal, field)} onClose={() => setShowAddFieldModal(null)} />
      </Modal>

      <Modal isOpen={showSeedConfirm} onClose={() => setShowSeedConfirm(false)} title="Seed Prebuilt Templates"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowSeedConfirm(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving} onClick={handleSeedAll}>
              {saving ? 'Seeding…' : 'Seed All Templates'}
            </button>
          </>
        }
      >
        <p>This will write all 20 prebuilt form templates to Firestore. Existing templates with the same slug will <strong>not</strong> be overwritten.</p>
      </Modal>

      <Modal isOpen={showDiscardConfirm} onClose={() => setShowDiscardConfirm(false)} title="Discard Changes?"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDiscardConfirm(false)}>Keep Editing</button>
            <button className="btn btn-danger" onClick={confirmDiscard}>Discard & Exit</button>
          </>
        }
      >
        <p>You have unsaved changes. Are you sure you want to discard them and return to the dashboard?</p>
      </Modal>

      {/* ── Apply Header/Footer to All Confirmation ── */}
      <Modal isOpen={!!showApplyAllConfirm} onClose={() => setShowApplyAllConfirm(null)}
        title={`Apply ${showApplyAllConfirm === 'header' ? 'Header' : 'Footer'} to All Templates?`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowApplyAllConfirm(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving} onClick={() => handleApplyToAll(showApplyAllConfirm)}>
              {saving ? 'Applying…' : `Apply to ${formTemplates.length} Templates`}
            </button>
          </>
        }
      >
        <p>This will update the <strong>{showApplyAllConfirm}</strong> design on all {formTemplates.length} templates saved in Firestore to match the current template's design.</p>
        <p className="fb-modal-hint">
          Each template will keep its own form title and form code. Only the visual layout (background, colors, elements, accent bar) will be overwritten.
        </p>
      </Modal>

      {/* ── Full-screen Preview Popup ── */}
      <Modal
        isOpen={showPreviewFullscreen}
        onClose={() => setShowPreviewFullscreen(false)}
        title={editingTemplate?.name ? `Preview – ${editingTemplate.name}` : 'Preview'}
        fullscreen
        onToggleFullscreen={() => setShowPreviewFullscreen(false)}
      >
        {editingTemplate && (
          <>
            <PreviewControls
              previewRole={previewRole}
              onRoleChange={setPreviewRole}
              previewFullForm={previewFullForm}
              onFullFormToggle={setPreviewFullForm}
            />
            <DynamicFormRenderer
              template={editingTemplate}
              formData={{}}
              sectionStatuses={{}}
              signatures={{}}
              currentUserRole={previewRole}
              currentUser={user}
              studentProfile={{}}
              onFieldChange={() => {}}
              readOnly
              bypassRoleLocking={previewFullForm}
            />
          </>
        )}
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Sub-component: Preview Controls (Role Switcher + Full Form)
   ══════════════════════════════════════════════════════════ */
const PREVIEW_ROLES = [
  { key: 'student',        label: 'Student',        color: '#3b82f6' },
  { key: 'supervisor',     label: 'Supervisor',     color: '#8b5cf6' },
  { key: 'co_supervisor',  label: 'Co-Supervisor',  color: '#a855f7' },
  { key: 'coordinator',    label: 'Coordinator',    color: '#f59e0b' },
  { key: 'admin',          label: 'Admin',          color: '#ef4444' },
];

function PreviewControls({ previewRole, onRoleChange, previewFullForm, onFullFormToggle }) {
  return (
    <div className="fb-preview-controls">
      <div className="fb-preview-controls-row">
        <div className="fb-preview-role-switcher">
          <span className="fb-preview-controls-label"><HiOutlineUserCircle /> View as:</span>
          <div className="fb-preview-role-pills">
            {PREVIEW_ROLES.map(r => (
              <button
                key={r.key}
                className={`fb-preview-role-pill ${previewRole === r.key ? 'active' : ''}`}
                style={previewRole === r.key ? { background: r.color, borderColor: r.color, color: '#fff' } : {}}
                onClick={() => onRoleChange(r.key)}
                title={`Preview as ${r.label}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <button
          className={`fb-preview-full-form-btn ${previewFullForm ? 'active' : ''}`}
          onClick={() => onFullFormToggle(!previewFullForm)}
          title="Toggle full form view — shows all sections without role restrictions"
        >
          <HiOutlineGlobeAlt />
          <span>{previewFullForm ? 'Full Form' : 'Role View'}</span>
        </button>
      </div>
      {previewFullForm && (
        <div className="fb-preview-full-form-hint">
          Showing all sections without role-based locking
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Sub-component: Add Section Form
   ══════════════════════════════════════════════════════════ */
function AddSectionForm({ onAdd, onClose }) {
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('student');
  const [layout, setLayout] = useState('table');
  const [sig, setSig] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      id: title.toLowerCase().replace(/\s+/g, '_'),
      title,
      assignedRole: role,
      layoutMode: layout,
      requiresSignature: sig,
      fields: [],
    });
  };

  return (
    <div className="fb-modal-form">
      <div className="form-group"><label className="form-label">Section Title</label><input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Student Details" /></div>
      <div className="form-group"><label className="form-label">Assigned Role</label>
        <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Layout</label>
        <select className="form-select" value={layout} onChange={e => setLayout(e.target.value)}>
          <option value="table">Table</option><option value="flow">Flow</option>
        </select>
      </div>
      <div className="form-group"><label className="fb-checkbox-label"><input type="checkbox" checked={sig} onChange={e => setSig(e.target.checked)} /> Requires Signature</label></div>
      <div className="fb-modal-actions">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!title.trim()} onClick={handleSubmit}><HiOutlinePlusCircle /> Add Section</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Sub-component: Add Field Form
   ══════════════════════════════════════════════════════════ */
function AddFieldForm({ onAdd, onClose }) {
  const [id, setId] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState('text');
  const [required, setRequired] = useState(false);
  const [width, setWidth] = useState('full');

  const handleSubmit = () => {
    if (!id.trim() || !label.trim()) return;
    onAdd({ id: id.trim(), label: label.trim(), type, required, width, row: 1 });
  };

  const handleLabelChange = (val) => {
    setLabel(val);
    if (!id || id === label.toLowerCase().replace(/\s+/g, '_')) {
      setId(val.toLowerCase().replace(/\s+/g, '_'));
    }
  };

  return (
    <div className="fb-modal-form">
      <div className="form-group"><label className="form-label">Label</label><input className="form-input" value={label} onChange={e => handleLabelChange(e.target.value)} placeholder="e.g. First Name" /></div>
      <div className="form-group"><label className="form-label">Field ID</label><input className="form-input" value={id} onChange={e => setId(e.target.value)} placeholder="e.g. first_name" /></div>
      <div className="form-group"><label className="form-label">Type</label>
        <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
          {FIELD_TYPES.map(ft => <option key={ft.type} value={ft.type}>{ft.label}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Width</label>
        <select className="form-select" value={width} onChange={e => setWidth(e.target.value)}>
          <option value="full">Full</option><option value="half">Half</option><option value="third">Third</option>
        </select>
      </div>
      <div className="form-group"><label className="fb-checkbox-label"><input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} /> Required</label></div>
      <div className="fb-modal-actions">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!id.trim() || !label.trim()} onClick={handleSubmit}><HiOutlinePlusCircle /> Add Field</button>
      </div>
    </div>
  );
}
