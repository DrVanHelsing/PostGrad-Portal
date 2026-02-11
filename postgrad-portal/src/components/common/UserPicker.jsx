// ============================================
// UserPicker – Reusable User Selection Modal
// Search + filter popup for selecting users from
// the system (supervisor, co-supervisor, etc.).
// ============================================

import { useState, useMemo } from 'react';
import { Modal, Avatar, EmptyState } from './index';
import { ROLE_LABELS } from '../../utils/constants';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';

/**
 * UserPicker – Modal component for selecting a user.
 *
 * Props:
 *   isOpen       – boolean
 *   onClose      – fn()
 *   onSelect     – fn(user) called when user is picked
 *   users        – array of user objects  { id, name, email, role, department }
 *   title        – modal title  (default: "Select User")
 *   roleFilter   – restrict to specific roles  (e.g. ['supervisor'])  optional
 *   excludeIds   – array of user IDs to exclude  optional
 *   selectedId   – currently selected user ID (for highlight)  optional
 */
export default function UserPicker({
  isOpen,
  onClose,
  onSelect,
  users = [],
  title = 'Select User',
  roleFilter = null,
  excludeIds = [],
  selectedId = null,
}) {
  const [search, setSearch] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState('all');

  // Determine which roles are present in the user list
  const availableRoles = useMemo(() => {
    const roleSet = new Set(users.map(u => u.role));
    if (roleFilter) {
      return roleFilter.filter(r => roleSet.has(r));
    }
    return [...roleSet].sort();
  }, [users, roleFilter]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      // Role restriction from prop
      if (roleFilter && !roleFilter.includes(u.role)) return false;
      // Exclude certain IDs
      if (excludeIds.includes(u.id)) return false;
      // Active role filter chip
      if (activeRoleFilter !== 'all' && u.role !== activeRoleFilter) return false;
      // Search
      if (search) {
        const q = search.toLowerCase();
        return (
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, roleFilter, excludeIds, activeRoleFilter, search]);

  const handleSelect = (user) => {
    onSelect(user);
    setSearch('');
    setActiveRoleFilter('all');
  };

  const handleClose = () => {
    setSearch('');
    setActiveRoleFilter('all');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      {/* Search + Filter bar */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <div className="search-container" style={{ marginBottom: 'var(--space-sm)' }}>
          <HiOutlineMagnifyingGlass className="search-icon" />
          <input
            className="search-input"
            placeholder="Search by name, email, or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`filter-chip ${activeRoleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveRoleFilter('all')}
          >
            All ({users.filter(u => !roleFilter || roleFilter.includes(u.role)).filter(u => !excludeIds.includes(u.id)).length})
          </button>
          {availableRoles.map(role => (
            <button
              key={role}
              className={`filter-chip ${activeRoleFilter === role ? 'active' : ''}`}
              onClick={() => setActiveRoleFilter(role)}
            >
              {ROLE_LABELS[role] || role}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<HiOutlineUserGroup />}
            title="No users found"
            description="Try adjusting your search or filter."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(u => {
              const isSelected = u.id === selectedId;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelect(u)}
                  className="user-picker-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--uwc-navy)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(0,51,102,0.04)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'var(--transition-fast)',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-muted)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-primary)';
                  }}
                >
                  <Avatar name={u.name} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                      {u.name}
                      {isSelected && (
                        <HiOutlineCheckCircle
                          style={{ marginLeft: 6, verticalAlign: -2, color: 'var(--status-success)' }}
                        />
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}
                      {u.department && ` · ${u.department}`}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--uwc-navy)',
                      background: 'rgba(0,51,102,0.06)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div style={{ marginTop: 'var(--space-md)', fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>
        {filtered.length} user{filtered.length !== 1 ? 's' : ''} shown · Click a user to select
      </div>
    </Modal>
  );
}
