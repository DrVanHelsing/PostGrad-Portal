// ============================================
// WeightedTableField – OPTIONAL weighted
// assessment table for structured programmes
// ============================================
import { useMemo, useCallback } from 'react';

/**
 * Renders a table with weight/mark columns and auto-computes weighted marks.
 * This component is always OPTIONAL – only required for structured masters programmes.
 *
 * @param {Object}   config   – tableConfig from the template schema
 * @param {Object}   value    – { rows: { [key]: { weight, mark, comment, ... } }, isCompleted }
 * @param {Function} onChange – (newValue) => void
 * @param {boolean}  disabled
 * @param {string}   helpText
 */
export default function WeightedTableField({ config, value = {}, onChange, disabled, helpText }) {
  if (!config) return null;

  const rows = config.rows || [];
  const columns = config.columns || [];
  const rowData = value.rows || {};

  /* Compute weighted marks */
  const computed = useMemo(() => {
    const result = {};
    let totalWeight = 0;
    let totalWeightedMark = 0;

    rows.forEach((row) => {
      const rd = rowData[row.key] || {};
      const w = parseFloat(rd.weight) || 0;
      const m = parseFloat(rd.mark) || 0;
      const wm = w > 0 && m > 0 ? (w * m / 100) : 0;
      result[row.key] = { weighted_mark: wm.toFixed(1) };
      totalWeight += w;
      totalWeightedMark += wm;
    });

    const avg = totalWeight > 0 ? (totalWeightedMark / totalWeight * 100) : 0;
    return { cells: result, totalWeight, totalWeightedMark: totalWeightedMark.toFixed(1), weightedAverage: avg.toFixed(1) };
  }, [rows, rowData]);

  const handleCellChange = useCallback((rowKey, colKey, cellValue) => {
    const newRowData = { ...rowData };
    newRowData[rowKey] = { ...(newRowData[rowKey] || {}), [colKey]: cellValue };
    onChange({ ...value, rows: newRowData });
  }, [rowData, value, onChange]);

  return (
    <div className="weighted-table-wrapper">
      <table className="weighted-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rd = rowData[row.key] || {};
            return (
              <tr key={row.key}>
                {columns.map((col) => {
                  if (col.type === 'computed') {
                    return (
                      <td key={col.key} className="computed-cell">
                        {computed.cells[row.key]?.weighted_mark || '0.0'}
                      </td>
                    );
                  }
                  return (
                    <td key={col.key}>
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={rd[col.key] ?? (col.key === 'criterion' ? row.label : '')}
                        onChange={(e) => handleCellChange(row.key, col.key, e.target.value)}
                        disabled={disabled}
                        placeholder={col.key === 'criterion' ? row.label : ''}
                        min={col.type === 'number' ? 0 : undefined}
                        max={col.type === 'number' && col.key === 'mark' ? 100 : undefined}
                        step={col.type === 'number' ? 'any' : undefined}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}

          {/* Total row */}
          {config.showTotalRow && (
            <tr className="total-row">
              <td><strong>TOTAL</strong></td>
              {columns.slice(1).map((col) => {
                if (col.key === 'weight') return <td key={col.key} className="computed-cell">{computed.totalWeight}%</td>;
                if (col.key === 'weighted_mark') return <td key={col.key} className="computed-cell">{computed.totalWeightedMark}</td>;
                if (col.key === 'mark') return <td key={col.key} className="computed-cell">{computed.weightedAverage}%</td>;
                return <td key={col.key} />;
              })}
            </tr>
          )}
        </tbody>
      </table>

      {config.isOptional && (
        <p className="weighted-table-optional-note">
          {helpText || 'This table is optional – complete only for structured programme students.'}
        </p>
      )}
    </div>
  );
}
