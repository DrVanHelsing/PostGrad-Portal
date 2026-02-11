// ============================================
// LockedSectionOverlay – Shows when a section
// belongs to another role and is not yet editable
// ============================================
import { HiOutlineLockClosed } from 'react-icons/hi2';
import { SECTION_ROLE_COLORS } from '../../utils/constants';

export default function LockedSectionOverlay({ role, status }) {
  const roleConfig = SECTION_ROLE_COLORS[role] || { label: role, color: '#64748b' };
  const statusLabel = status === 'pending' ? 'Not yet started' : status === 'completed' ? 'Completed' : 'In progress';

  return (
    <div className="locked-section-overlay">
      <div className="locked-section-content">
        <HiOutlineLockClosed />
        <span>
          This section is assigned to <strong style={{ color: roleConfig.color }}>{roleConfig.label}</strong>
        </span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>Status: {statusLabel}</span>
      </div>
    </div>
  );
}
