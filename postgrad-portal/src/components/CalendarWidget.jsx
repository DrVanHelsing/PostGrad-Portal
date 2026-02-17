// ============================================
// CalendarWidget – embeddable mini calendar for dashboards
// Replaces standalone CalendarPage. Supports inline CRUD for coordinators/admins.
// Admin can add events targeted at specific users via targetUserIds.
// ============================================

import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardBody, StatusBadge, Modal, EmptyState } from './common';
import { EVENT_TYPE_CONFIG } from '../utils/constants';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import {
  HiOutlineCalendarDays,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from 'react-icons/hi2';

const DAY_NAMES = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CalendarWidget({ showManage = false, showTargetUsers = false }) {
  const { user } = useAuth();
  const { mockCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent, mockUsers } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', type: 'event', scope: 'all', description: '', targetUserIds: [] });

  const canManage = !!showManage;

  const filteredEvents = useMemo(() => mockCalendarEvents, [mockCalendarEvents]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = [];
    let day = start;
    while (day <= end) { days.push(day); day = addDays(day, 1); }
    return days;
  }, [currentDate]);

  const upcomingEvents = useMemo(() =>
    filteredEvents
      .filter(e => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5),
  [filteredEvents]);

  const getEventsForDay = (day) => filteredEvents.filter(e => isSameDay(new Date(e.date), day));

  const openNewEvent = (date) => {
    setEditingEvent(null);
    setEventForm({ title: '', date: date ? format(date, 'yyyy-MM-dd') : '', time: '10:00', type: 'event', scope: 'all', description: '', targetUserIds: [] });
    setShowEventModal(true);
  };

  const openEditEvent = (evt) => {
    setEditingEvent(evt);
    setEventForm({
      title: evt.title,
      date: format(new Date(evt.date), 'yyyy-MM-dd'),
      time: evt.time || '',
      type: evt.type,
      scope: evt.scope || 'all',
      description: evt.description || '',
      targetUserIds: evt.targetUserIds || [],
    });
    setShowEventModal(true);
  };

  const handleSave = () => {
    if (!eventForm.title || !eventForm.date) return;
    const payload = { ...eventForm, date: new Date(eventForm.date) };
    if (!showTargetUsers || payload.targetUserIds.length === 0) delete payload.targetUserIds;
    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, payload);
    } else {
      addCalendarEvent({ ...payload, createdBy: user.id });
    }
    setShowEventModal(false);
  };

  const handleDelete = (evtId) => {
    deleteCalendarEvent(evtId);
    setSelectedDayEvents(null);
  };

  const toggleTargetUser = (uid) => {
    setEventForm(prev => ({
      ...prev,
      targetUserIds: prev.targetUserIds.includes(uid)
        ? prev.targetUserIds.filter(id => id !== uid)
        : [...prev.targetUserIds, uid],
    }));
  };

  // Users available for targeting (students, supervisors)
  const targetableUsers = useMemo(() =>
    mockUsers.filter(u => ['student', 'supervisor'].includes(u.role)).sort((a, b) => a.name.localeCompare(b.name)),
  [mockUsers]);

  return (
    <>
      <Card>
        <CardHeader
          title="Calendar"
          icon={<HiOutlineCalendarDays />}
          iconBg="var(--status-warning-bg)"
          iconColor="var(--status-warning)"
          action={canManage ? <button className="btn btn-primary btn-sm" onClick={() => openNewEvent()}><HiOutlinePlusCircle /> Add</button> : null}
        />
        <CardBody>
          {/* Mini calendar nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <button className="calendar-nav-btn" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><HiOutlineChevronLeft /></button>
            <span style={{ fontSize: 13, fontWeight: 700, flex: 1, textAlign: 'center' }}>{format(currentDate, 'MMMM yyyy')}</span>
            <button className="calendar-nav-btn" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><HiOutlineChevronRight /></button>
          </div>

          {/* Mini grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, marginBottom: 16 }}>
            {DAY_NAMES.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', padding: '4px 0', textTransform: 'uppercase' }}>{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              const events = getEventsForDay(day);
              const inMonth = isSameMonth(day, currentDate);
              const todayFlag = isToday(day);
              return (
                <div
                  key={i}
                  onClick={() => { if (events.length) setSelectedDayEvents({ date: day, events }); else if (canManage) openNewEvent(day); }}
                  style={{
                    textAlign: 'center', padding: '6px 2px', cursor: events.length || canManage ? 'pointer' : 'default',
                    fontSize: 12, fontWeight: todayFlag ? 700 : 400, position: 'relative',
                    color: !inMonth ? 'var(--text-tertiary)' : todayFlag ? 'var(--uwc-navy)' : 'var(--text-primary)',
                    background: todayFlag ? 'rgba(0,51,102,0.06)' : 'transparent', borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {format(day, 'd')}
                  {events.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                      {events.slice(0, 3).map((e, j) => {
                        const cfg = EVENT_TYPE_CONFIG[e.type] || EVENT_TYPE_CONFIG.event;
                        return <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Upcoming list */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Upcoming</div>
            {upcomingEvents.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', padding: 12 }}>No upcoming events</div>
            ) : (
              upcomingEvents.map(evt => {
                const cfg = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.event;
                return (
                  <div key={evt.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{format(new Date(evt.date), 'd')}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{format(new Date(evt.date), 'MMM')}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{evt.title}</div>
                      {evt.time && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{evt.time}</div>}
                      <StatusBadge config={{ label: cfg.label, color: cfg.color, bg: cfg.bg }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardBody>
      </Card>

      {/* Day events popup */}
      <Modal isOpen={!!selectedDayEvents} onClose={() => setSelectedDayEvents(null)} title={selectedDayEvents ? `Events · ${format(selectedDayEvents.date, 'dd MMM yyyy')}` : ''}>
        {selectedDayEvents?.events.map(evt => {
          const cfg = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.event;
          return (
            <div key={evt.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{evt.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{evt.time}{evt.description ? ` · ${evt.description}` : ''}</div>
                <div style={{ marginTop: 4 }}><StatusBadge config={{ label: cfg.label, color: cfg.color, bg: cfg.bg }} /></div>
              </div>
              {canManage && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedDayEvents(null); openEditEvent(evt); }}><HiOutlinePencilSquare /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(evt.id)} style={{ color: 'var(--status-error)' }}><HiOutlineTrash /></button>
                </div>
              )}
            </div>
          );
        })}
      </Modal>

      {/* Add/Edit Event Modal */}
      <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)}
        title={editingEvent ? 'Edit Event' : 'New Event'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
          <button className="btn btn-primary" disabled={!eventForm.title || !eventForm.date} onClick={handleSave}>
            {editingEvent ? 'Save Changes' : 'Create Event'}
          </button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Event title" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input className="form-input" type="time" value={eventForm.time} onChange={e => setEventForm({ ...eventForm, time: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })}>
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Scope</label>
            <select className="form-select" value={eventForm.scope} onChange={e => setEventForm({ ...eventForm, scope: e.target.value })}>
              <option value="all">All</option>
              <option value="faculty">Faculty</option>
              <option value="department">Department</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" rows={2} value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Event description..." />
        </div>

        {/* Target users – admin only */}
        {showTargetUsers && user.role === 'admin' && (
          <div className="form-group">
            <label className="form-label">Assign to specific users (optional)</label>
            <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 8 }}>
              {targetableUsers.map(u => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={eventForm.targetUserIds.includes(u.id)} onChange={() => toggleTargetUser(u.id)} />
                  {u.name} <span style={{ color: 'var(--text-tertiary)' }}>({u.role})</span>
                </label>
              ))}
            </div>
            {eventForm.targetUserIds.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{eventForm.targetUserIds.length} user(s) selected — they will receive a notification</div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
