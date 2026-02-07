import { useState } from 'react';
import {
  HiOutlineCalendarDays,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineMapPin,
} from 'react-icons/hi2';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { mockCalendarEvents } from '../data/mockData';
import type { CalendarEvent } from '../types';

const eventTypeColors: Record<string, string> = {
  deadline: 'bg-red-500',
  meeting: 'bg-blue-500',
  presentation: 'bg-violet-500',
  workshop: 'bg-amber-500',
  other: 'bg-gray-500',
};

const eventTypeBadge: Record<string, string> = {
  deadline: 'bg-red-50 text-red-700',
  meeting: 'bg-blue-50 text-blue-700',
  presentation: 'bg-violet-50 text-violet-700',
  workshop: 'bg-amber-50 text-amber-700',
  other: 'bg-gray-50 text-gray-700',
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const events = mockCalendarEvents.filter(
    (e) => !e.role || e.role === user?.role
  );

  const getEventsForDay = (day: Date): CalendarEvent[] =>
    events.filter((e) => isSameDay(e.date, day));

  const selectedDayEvents = getEventsForDay(selectedDate);

  const upcomingEvents = events
    .filter((e) => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Calendar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Academic deadlines and events</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-md"
              >
                <HiOutlineChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-md"
              >
                <HiOutlineChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-center text-[11px] uppercase tracking-wider font-medium text-gray-400 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const selected = isSameDay(day, selectedDate);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`relative h-[72px] p-1.5 border-t border-gray-50 text-left group ${
                      !inMonth ? 'opacity-30' : ''
                    } ${selected ? 'bg-[#003366]/[0.03]' : 'hover:bg-gray-50/50'}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full ${
                        today
                          ? 'bg-[#003366] text-white font-semibold'
                          : selected
                          ? 'bg-gray-100 text-gray-800 font-medium'
                          : 'text-gray-600'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1 px-0.5">
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${eventTypeColors[e.type] || 'bg-gray-400'}`}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-gray-400 ml-0.5">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Day Events */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h3>
            </div>
            <div className="p-3">
              {selectedDayEvents.length > 0 ? (
                <div className="space-y-2">
                  {selectedDayEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-gray-50/50 rounded-lg border border-gray-50">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${eventTypeColors[event.type]}`} />
                        <h4 className="text-sm font-medium text-gray-800 truncate">{event.title}</h4>
                      </div>
                      <div className="ml-4 space-y-1">
                        {event.time && (
                          <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <HiOutlineClock className="w-3 h-3" />
                            {event.time}
                          </p>
                        )}
                        {event.location && (
                          <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <HiOutlineMapPin className="w-3 h-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 ml-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${eventTypeBadge[event.type]}`}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <HiOutlineCalendarDays className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400">No events on this day</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Upcoming Events</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${eventTypeColors[event.type]}`} />
                    <h4 className="text-sm text-gray-800 truncate">{event.title}</h4>
                  </div>
                  <p className="text-[11px] text-gray-400 ml-3.5">
                    {format(event.date, 'MMM d, yyyy')}
                    {event.time ? ` at ${event.time}` : ''}
                  </p>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="px-5 py-6 text-center">
                  <p className="text-xs text-gray-400">No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
