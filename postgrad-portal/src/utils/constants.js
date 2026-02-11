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
  external: 'External User',
  examiner: 'Examiner',
};

/* Internal roles that can be created by admin (shown in Create User dropdowns) */
export const CREATABLE_ROLES = {
  student: 'Student',
  supervisor: 'Supervisor',
  coordinator: 'Coordinator',
  admin: 'Administrator',
  external: 'External User',
  examiner: 'Examiner',
};

/* Form Template Categories */
export const FORM_CATEGORIES = {
  registration: { label: 'Registration & Title', icon: 'HiOutlineDocumentText' },
  progress: { label: 'Progress & Reports', icon: 'HiOutlineChartBarSquare' },
  examination: { label: 'Examination', icon: 'HiOutlineAcademicCap' },
  supervision: { label: 'Supervision Changes', icon: 'HiOutlineUserGroup' },
  administrative: { label: 'Administrative', icon: 'HiOutlineCog6Tooth' },
  other: { label: 'Other', icon: 'HiOutlineDocumentText' },
};

/* Section role colour mapping */
export const SECTION_ROLE_COLORS = {
  student: { color: 'var(--status-info)', bg: 'var(--status-info-bg)', label: 'Student' },
  supervisor: { color: 'var(--status-purple)', bg: 'var(--status-purple-bg)', label: 'Supervisor' },
  co_supervisor: { color: 'var(--status-indigo)', bg: 'var(--status-indigo-bg)', label: 'Co-Supervisor' },
  coordinator: { color: 'var(--status-orange)', bg: 'var(--status-orange-bg)', label: 'Coordinator' },
  admin: { color: 'var(--status-danger)', bg: 'var(--status-danger-bg)', label: 'Admin' },
  examiner: { color: 'var(--status-teal)', bg: 'var(--status-teal-bg)', label: 'Examiner' },
};

/* Extended request type labels – covers all 20 FHD form types */
export const FORM_TYPE_LABELS = {
  title_registration: 'Title Registration',
  progress_report: 'Progress Report',
  intention_to_submit: 'Intention to Submit',
  appointment_of_examiners: 'Appointment of Examiners',
  examiner_summary_cv: 'Examiner Summary CV',
  change_of_examiners: 'Change of Examiners',
  appointment_of_arbiter: 'Appointment of Arbiter',
  leave_of_absence: 'Leave of Absence',
  addition_of_co_supervisor: 'Addition of Co-Supervisor',
  change_of_supervisor: 'Change of Supervisor / Co-Supervisor',
  removal_of_supervisor: 'Removal of Supervisor / Co-Supervisor',
  change_of_thesis_title: 'Change of Thesis Title',
  readmission: 'Request for Readmission',
  upgrade_masters_to_doctoral: 'Upgrade Masters to Doctoral',
  mou: 'Memorandum of Understanding',
  supervisor_profile_rott: 'Prospective Supervisor Profile (ROTT)',
  supervisor_summative_report: 'Supervisor Summative Report',
  other_request: 'Other Request',
  ns_higher_degrees_cover: 'Natural Sciences Higher Degrees',
  fhd_checklist: 'FHD Submissions Checklist',
};
