// ============================================
// FormFieldRenderer – Switch-style renderer
// Maps field.type → specific input component
// ============================================
import { memo } from 'react';
import KeywordsTagInput from './KeywordsTagInput';
import WeightedTableField from './WeightedTableField';
import RepeaterGroupField from './RepeaterGroupField';
import {
  HiOutlineCloudArrowUp,
  HiOutlineXMark,
} from 'react-icons/hi2';

/**
 * Renders a single form field based on its type.
 */
function FormFieldRenderer({ field, value, onChange, disabled, error, currentUser, studentProfile, allFormData }) {
  const widthClass = field.width === 'half' ? 'field-half' : 'field-full';
  const isAutoPopulated = field.type === 'auto_populated';

  const wrapperClass = [
    'form-field-wrapper',
    widthClass,
    isAutoPopulated ? 'form-field-auto-populated' : '',
    error ? 'form-field-has-error' : '',
  ].filter(Boolean).join(' ');

  /* ── Render field by type ── */
  function renderField() {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
        return (
          <input
            className="form-input"
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder || ''}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'auto_populated':
        return (
          <input
            className="form-input"
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || field.readOnlyForRoles?.includes(currentUser?.role)}
            readOnly={isAutoPopulated && field.readOnlyForRoles?.includes(currentUser?.role)}
          />
        );

      case 'textarea':
        return (
          <textarea
            className="form-textarea"
            placeholder={field.placeholder || ''}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={field.rows || 3}
          />
        );

      case 'select':
        return (
          <select
            className="form-select"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">— Select —</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            className="form-input"
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );

      case 'checkbox':
        return (
          <label className="form-checkbox-wrapper">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
            />
            <span>{field.label}</span>
          </label>
        );

      case 'paragraph':
        return <p className="form-paragraph">{field.defaultValue || value || ''}</p>;

      case 'keywords_tag':
        return (
          <KeywordsTagInput
            value={value || []}
            onChange={onChange}
            disabled={disabled}
            placeholder={field.placeholder}
          />
        );

      case 'weighted_table':
        return (
          <WeightedTableField
            config={field.tableConfig}
            value={value || {}}
            onChange={onChange}
            disabled={disabled}
            helpText={field.helpText}
          />
        );

      case 'repeater_group':
        return (
          <RepeaterGroupField
            config={field.repeaterConfig}
            value={value || []}
            onChange={onChange}
            disabled={disabled}
            currentUser={currentUser}
            studentProfile={studentProfile}
            allFormData={allFormData}
          />
        );

      case 'file_upload':
        return (
          <FileUploadField
            value={value}
            onChange={onChange}
            disabled={disabled}
            helpText={field.helpText}
          />
        );

      default:
        return (
          <input
            className="form-input"
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );
    }
  }

  // Checkbox renders its own label
  if (field.type === 'checkbox') {
    return (
      <div className={wrapperClass}>
        {renderField()}
        {error && <span className="form-field-error">{error}</span>}
      </div>
    );
  }

  // Paragraph has no label
  if (field.type === 'paragraph') {
    return (
      <div className={wrapperClass}>
        {renderField()}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <label className="form-field-label">
        {field.label}
        {field.required && <span className="required-marker">*</span>}
      </label>
      {field.helpText && <span className="form-field-help">{field.helpText}</span>}
      {renderField()}
      {error && <span className="form-field-error">{error}</span>}
    </div>
  );
}


/* ── File Upload mini-component ── */
function FileUploadField({ value, onChange, disabled, helpText }) {
  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      onChange({ name: f.name, size: f.size, type: f.type, file: f });
    }
  };

  if (value && value.name) {
    return (
      <div className="file-upload-preview">
        <span>{value.name}</span>
        {!disabled && (
          <button onClick={() => onChange(null)} title="Remove file">
            <HiOutlineXMark />
          </button>
        )}
      </div>
    );
  }

  return (
    <label className="file-upload-zone" style={disabled ? { cursor: 'not-allowed', opacity: 0.6 } : {}}>
      <HiOutlineCloudArrowUp />
      <span>{helpText || 'Click to upload a file'}</span>
      <input type="file" onChange={handleFile} disabled={disabled} />
    </label>
  );
}


export default memo(FormFieldRenderer);
