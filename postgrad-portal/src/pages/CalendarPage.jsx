// ============================================
// Calendar Page – CRUD + Role Filtering
// ============================================

import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardBody, StatusBadge, Modal } from '../components/common';
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
import './CalendarPage.css';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const { user } = useAuth();
  const { mockCalendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const defaultScope = user.role === 'student' ? 'department' : user.role === 'supervisor' ? 'department' : 'all';
  const [scopeFilter, setScopeFilter] = useState(defaultScope);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', type: 'event', scope: 'all', description: '' });

  const canManage = user.role === 'coordinator' || user.role === 'admin';

  const filteredEvents = useMemo(() => {
    return mockCalendarEvents.filter(e => {
      if (scopeFilter === 'all') return true;
      return e.scope === scopeFilter || e.scope === 'all';
    });
  }, [scopeFilter, mockCalendarEvents]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents
      .filter(e => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredEvents]);

  const getEventsForDay = (day) => filteredEvents.filter(e => isSameDay(new Date(e.date), day));

  const openNewEvent = (date) => {
    setEditingEvent(null);
    setEventForm({ title: '', date: date ? format(date, 'yyyy-MM-dd') : '', time: '10:00', type: 'event', scope: 'all', description: '' });
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
    });
    setShowEventModal(true);
  };

  const handleSave = () => {
    if (!eventForm.title || !eventForm.date) return;
    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, { ...eventForm, date: new Date(eventForm.date) });
    } else {
      addCalendarEvent({ ...eventForm, date: new Date(eventForm.date), createdBy: user.id });
    }
    setShowEventModal(false);
  };

  const handleDelete = (evtId) => {
    deleteCalendarEvent(evtId);
    setSelectedDayEvents(null);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Calendar</h1>
          <p>Academic deadlines, committee meetings, and events</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => openNewEvent()}>
            <HiOutlinePlusCircle /> Add Event
          </button>
        )}
      </div>

      {/* Scope Filter */}
      <div className="filter-bar" style={{ marginBottom: 'var(--space-xl)' }}>
        {['all', 'faculty', 'department'].map(s => (
          <button key={s} className={`filter-chip ${scopeFilter === s ? 'active' : ''}`} onClick={() => setScopeFilter(s)}>
            {s === 'all' ? 'All Events' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="calendar-layout">
        <div>
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><HiOutlineChevronLeft /></button>
            <h2>{format(currentDate, 'MMMM yyyy')}</h2>
            <button className="calendar-nav-btn" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><HiOutlineChevronRight /></button>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date())} style={{ marginLeft: 'auto' }}>Today</button>
          </div>

          <div className="calendar-grid">
            {DAY_NAMES.map(d => (<div key={d} className="calendar-day-header">{d}</div>))}
            {calendarDays.map((day, i) => {
              const events = getEventsForDay(day);
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              return (
                <div key={i}
                  className={`calendar-day ${!inMonth ? 'other-month' : ''} ${today ? 'today' : ''}`}
                  onClick={() => { if (events.length) setSelectedDayEvents({ date: day, events }); else if (canManage) openNewEvent(day); }}
                  style={{ cursor: events.length || canManage ? 'pointer' : 'default' }}
                >
                  <div className="calendar-day-number">{format(day, 'd')}</div>
                  {events.map(evt => {
                    const cfg = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.event;
                    return (
                      <div key={evt.id} className="calendar-event-dot" style={{ background: cfg.bg, color: cfg.color }} title={evt.title}>
                        {evt.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader title="Upcoming" icon={<HiOutlineCalendarDays />} iconBg="var(--status-warning-bg)" iconColor="var(--status-warning)" />
          <CardBody>
            {upcomingEvents.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: 20 }}>No upcoming events</div>
            ) : (
              upcomingEvents.map(evt => {
                const cfg = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.event;
                return (
                  <div key={evt.id} className="calendar-upcoming-item">
                    <div className="calendar-upcoming-date">
                      <div className="calendar-upcoming-day">{format(new Date(evt.date), 'd')}</div>
                      <div className="calendar-upcoming-month">{format(new Date(evt.date), 'MMM')}</div>
                    </div>
                    <div className="calendar-upcoming-info">
                      <div className="calendar-upcoming-title">{evt.title}</div>
                      <div className="calendar-upcoming-desc">{evt.description}</div>
                      <div style={{ marginTop: 4 }}>
                        <StatusBadge config={{ label: cfg.label, color: cfg.color, bg: cfg.bg }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>
      </div>

      {/* Day events popup */}
      <Modal isOpen={!!selectedDayEvents} onClose={() => setSelectedDayEvents(null)} title={selectedDayEvents ? `Events on ${format(selectedDayEvents.date, 'dd MMMM yyyy')}` : ''}>
        {selectedDayEvents?.events.map(evt => {
          const cfg = EVENT_TYPE_CONFIG[evt.type] || EVENT_TYPE_CONFIG.event;
          return (
            <div key={evt.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{evt.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{evt.time} · {evt.description}</div>
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
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEventModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!eventForm.title || !eventForm.date} onClick={handleSave}>
              {editingEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </>
        }
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
          <textarea className="form-textarea" rows={3} value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Event description..." />
        </div>
      </Modal>
    </div>
  );
}
