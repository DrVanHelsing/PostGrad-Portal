// ============================================
// RepeaterGroupField – Repeatable field groups
// e.g. multiple examiners in Appointment of Examiners
// ============================================
import { useCallback } from 'react';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';
import FormFieldRenderer from './FormFieldRenderer';

/**
 * @param {Object}   config        – repeaterConfig from field schema
 * @param {Array}    value         – array of item data objects
 * @param {Function} onChange      – (newArray) => void
 * @param {boolean}  disabled
 * @param {Object}   currentUser
 * @param {Object}   studentProfile
 * @param {Object}   allFormData
 */
export default function RepeaterGroupField({ config, value = [], onChange, disabled, currentUser, studentProfile, allFormData }) {
  if (!config) return null;

  const { minItems = 1, maxItems = 10, addLabel = 'Add Item', itemTitle = 'Item {n}', fields = [] } = config;

  const addItem = useCallback(() => {
    if (value.length >= maxItems) return;
    onChange([...value, {}]);
  }, [value, onChange, maxItems]);

  const removeItem = useCallback((index) => {
    if (value.length <= minItems) return;
    onChange(value.filter((_, i) => i !== index));
  }, [value, onChange, minItems]);

  const updateItem = useCallback((index, fieldId, fieldValue) => {
    const newItems = [...value];
    newItems[index] = { ...newItems[index], [fieldId]: fieldValue };
    onChange(newItems);
  }, [value, onChange]);

  // Ensure at least minItems exist
  const items = value.length < minItems
    ? [...value, ...Array.from({ length: minItems - value.length }, () => ({}))]
    : value;

  return (
    <div className="repeater-group">
      {items.map((item, index) => (
        <div key={index} className="repeater-group-item">
          <div className="repeater-group-item-header">
            <span>{itemTitle.replace('{n}', String(index + 1))}</span>
            {!disabled && items.length > minItems && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => removeItem(index)}
                title="Remove"
                style={{ padding: '2px 6px' }}
              >
                <HiOutlineTrash />
              </button>
            )}
          </div>
          <div className="repeater-group-item-body">
            {fields.map((field) => {
              // Handle conditional fields within repeater
              if (field.conditionalOn) {
                const condFieldValue = item[field.conditionalOn.fieldId];
                const { operator, value: condValue } = field.conditionalOn;
                let visible = false;
                if (operator === 'equals') visible = condFieldValue === condValue;
                else if (operator === 'not_equals') visible = condFieldValue !== condValue;
                else if (operator === 'not_empty') visible = !!condFieldValue;
                if (!visible) return null;
              }

              return (
                <FormFieldRenderer
                  key={field.id}
                  field={field}
                  value={item[field.id]}
                  onChange={(val) => updateItem(index, field.id, val)}
                  disabled={disabled}
                  currentUser={currentUser}
                  studentProfile={studentProfile}
                  allFormData={allFormData}
                />
              );
            })}
          </div>
        </div>
      ))}

      {!disabled && items.length < maxItems && (
        <button
          className="repeater-group-add"
          onClick={addItem}
          disabled={items.length >= maxItems}
        >
          <HiOutlinePlus /> {addLabel}
        </button>
      )}
    </div>
  );
}
