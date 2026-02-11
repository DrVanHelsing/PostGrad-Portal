// ============================================
// KeywordsTagInput – Tag-style keyword entry
// For Title Registration "Keywords" field
// ============================================
import { useState, useRef, useCallback } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';

export default function KeywordsTagInput({ value = [], onChange, disabled, placeholder }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const addKeyword = useCallback((keyword) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    // Avoid duplicates (case-insensitive)
    if (value.some((k) => k.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setInputValue('');
  }, [value, onChange]);

  const removeKeyword = useCallback((index) => {
    onChange(value.filter((_, i) => i !== index));
  }, [value, onChange]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeKeyword(value.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addKeyword(inputValue);
    }
  };

  return (
    <div
      className={`keywords-tag-input ${disabled ? 'disabled' : ''}`}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((keyword, i) => (
        <span key={i} className="keyword-tag">
          {keyword}
          {!disabled && (
            <button onClick={(e) => { e.stopPropagation(); removeKeyword(i); }} aria-label={`Remove ${keyword}`}>
              <HiOutlineXMark />
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? (placeholder || 'Type a keyword and press Enter...') : ''}
          disabled={disabled}
        />
      )}
    </div>
  );
}
