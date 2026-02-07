// ============================================
// PostGrad Portal – Constants
// ============================================

export const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'var(--text-tertiary)', bg: 'var(--bg-muted)' },
  submitted_to_supervisor: { label: 'Submitted', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  supervisor_review: { label: 'Supervisor Review', color: 'var(--status-purple)', bg: 'var(--status-purple-bg)' },
  co_supervisor_review: { label: 'Co-Supervisor Review', color: 'var(--status-indigo)', bg: 'var(--status-indigo-bg)' },
  coordinator_review: { label: 'Coordinator Review', color: 'var(--status-orange)', bg: 'var(--status-orange-bg)' },
  fhd_pending: { label: 'Faculty Board Pending', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  shd_pending: { label: 'Senate Board Pending', color: 'var(--status-pink)', bg: 'var(--status-pink-bg)' },
  approved: { label: 'Approved', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  recommended: { label: 'Recommended', color: 'var(--status-teal)', bg: 'var(--status-teal-bg)' },
  referred_back: { label: 'Referred Back', color: 'var(--status-danger)', bg: 'var(--status-danger-bg)' },
};

export const REQUEST_TYPE_LABELS = {
  registration: 'Registration',
  title_registration: 'Title Registration',
  progress_report: 'Progress Report',
  extension: 'Extension',
  leave_of_absence: 'Leave of Absence',
  supervisor_change: 'Supervisor Change',
  examination_entry: 'Examination Entry',
  other: 'Other',
};

export const EVENT_TYPE_CONFIG = {
  deadline: { label: 'Deadline', color: 'var(--status-danger)', bg: 'var(--status-danger-bg)' },
  meeting: { label: 'Meeting', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  event: { label: 'Event', color: 'var(--status-purple)', bg: 'var(--status-purple-bg)' },
  reminder: { label: 'Reminder', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
};

export const MILESTONE_TYPE_LABELS = {
  conference: 'Conference',
  journal_club: 'Journal Club',
  workshop: 'Workshop',
  training: 'Training',
  publication: 'Publication',
  other: 'Other',
};

export const STUDENT_STATUS_CONFIG = {
  active: { label: 'Active', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  on_leave: { label: 'On Leave', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  completed: { label: 'Completed', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  discontinued: { label: 'Discontinued', color: 'var(--status-danger)', bg: 'var(--status-danger-bg)' },
};

export const NOTIFICATION_TYPE_CONFIG = {
  info: { color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  warning: { color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  success: { color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  error: { color: 'var(--status-danger)', bg: 'var(--status-danger-bg)' },
};

/* Workflow States – ordered progression */
export const WORKFLOW_STATES = [
  'draft',
  'submitted_to_supervisor',
  'supervisor_review',
  'co_supervisor_review',
  'coordinator_review',
  'fhd_pending',
  'shd_pending',
  'approved',
];

export const ROLE_LABELS = {
  student: 'Student',
  supervisor: 'Supervisor',
  coordinator: 'Coordinator',
  admin: 'Administrator',
};
