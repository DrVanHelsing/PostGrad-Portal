// ============================================
// PostGrad Portal – Utility Helpers
// ============================================

import { format, formatDistanceToNow, isToday, isThisWeek, isThisMonth, isBefore, addDays } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
};

export const formatRelativeTime = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isOverdue = (date) => {
  if (!date) return false;
  return isBefore(new Date(date), new Date());
};

export const isDueSoon = (date, days = 7) => {
  if (!date) return false;
  const d = new Date(date);
  const limit = addDays(new Date(), days);
  return !isBefore(d, new Date()) && isBefore(d, limit);
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
};

export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const val = typeof key === 'function' ? key(item) : item[key];
    groups[val] = groups[val] || [];
    groups[val].push(item);
    return groups;
  }, {});
};

export const isDateToday = (date) => isToday(new Date(date));
export const isDateThisWeek = (date) => isThisWeek(new Date(date), { weekStartsOn: 1 });
export const isDateThisMonth = (date) => isThisMonth(new Date(date));

export const pluralize = (count, singular, plural) => {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural || singular + 's'}`;
};
