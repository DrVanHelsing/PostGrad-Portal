// ============================================
// PostGrad Portal – Constants
// ============================================

/* Title options for supervisor / coordinator / admin users */
export const TITLE_OPTIONS = ['Prof.', 'Assoc. Prof.', 'Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Mx.'];

/* Additional permissions that can be granted alongside primary role */
export const PERMISSION_LABELS = {
  coordinator: 'Coordinator Access',
  admin: 'Admin Access',
  supervisor: 'Supervisor Access',
  reviewer: 'Review Access',
};

/* Programme options */
export const PROGRAMME_OPTIONS = [
  'MSc Computer Science',
  'PhD Computer Science',
  'MSc Information Systems',
  'PhD Information Systems',
  'MA Information Studies',
  'MPhil Information Technology',
  'PhD Information Technology',
  'MSc Data Science',
  'PhD Data Science',
  'MSc Bioinformatics',
  'PhD Bioinformatics',
  'MCom Information Systems',
  'Other',
];

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
  title_registration: 'Title Registration',
  progress_report: 'Progress Report',
  intention_to_submit: 'Intention to Submit',
  appointment_of_examiners: 'Appointment of Examiners',
  examiner_summary_cv: 'Examiner Summary CV',
  change_of_examiners: 'Change of Examiners',
  appointment_of_arbiter: 'Appointment of Arbiter',
  leave_of_absence: 'Leave of Absence',
  addition_of_co_supervisor: 'Addition of Co-Supervisor',
  change_of_supervisor: 'Change of Supervisor',
  removal_of_supervisor: 'Removal of Supervisor',
  change_of_thesis_title: 'Change of Thesis Title',
  readmission: 'Readmission',
  upgrade_masters_to_doctoral: 'Upgrade Masters to Doctoral',
  mou: 'Memorandum of Understanding',
  supervisor_profile_rott: 'Supervisor Profile (RoTT)',
  supervisor_summative_report: 'Supervisor Summative Report',
  ns_higher_degrees_cover: 'NS Higher Degrees Cover',
  fhd_checklist: 'FHD Checklist',
  msc_to_phd_transition: 'MSc to PhD Transition',
  other_request: 'Other Request',
  other: 'Other',
};

export const EVENT_TYPE_CONFIG = {
  deadline: { label: 'Deadline', color: 'var(--status-danger)', bg: 'var(--status-danger-bg)' },
  meeting: { label: 'Meeting', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  event: { label: 'Event', color: 'var(--status-purple)', bg: 'var(--status-purple-bg)' },
  reminder: { label: 'Reminder', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
};

export const MILESTONE_TYPE_LABELS = {
  proposal: 'Proposal',
  data_collection: 'Data Collection',
  writing: 'Writing',
  submission: 'Submission',
  review: 'Review',
  completion: 'Completion',
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
  msc_to_phd_transition: 'MSc to PhD Transition',
};

/* Forms that explicitly require file uploads / attachments */
export const FORMS_REQUIRING_ATTACHMENTS = [
  'appointment_of_examiners',    // Full CV required
  'examiner_summary_cv',         // CV summary document
  'leave_of_absence',            // Supporting documentation
  'supervisor_profile_rott',     // Supervisor profile documents
  'other_request',               // Ad-hoc attachments
];

/* Request types for which document annotation UI is enabled */
export const THESIS_ANNOTATION_REQUEST_TYPES = [
  'title_registration',
  'progress_report',
  'intention_to_submit',
  'change_of_thesis_title',
  'appointment_of_examiners',
  'examiner_summary_cv',
  'change_of_examiners',
  'appointment_of_arbiter',
  'thesis_submission',
  'upgrade_masters_to_doctoral',
  'msc_to_phd_transition',
  'supervisor_summative_report',
];

/* Concurrent workflow steps – steps that happen in parallel */
export const CONCURRENT_WORKFLOW_STEPS = {
  supervisor_review: ['supervisor_review', 'co_supervisor_review'], // Supervisor + Co-supervisor can review concurrently
};

/* Referral notification timeout in hours */
export const REFERRAL_NOTIFICATION_HOURS = 48;

/* Helper: check if a user has a permission (either as primary role or additional perm) */
export function hasPermission(user, perm) {
  if (!user) return false;
  if (user.role === perm) return true;
  if (user.role === 'admin') return true; // Admin has all permissions
  return user.permissions?.includes(perm) || false;
}

/* Helper: get display name for user (with title for staff) */
export function getDisplayName(user) {
  if (!user) return '—';
  if (user.title && user.surname) {
    return `${user.title} ${user.firstName || ''} ${user.surname}`.trim();
  }
  return user.name || `${user.firstName || ''} ${user.surname || ''}`.trim() || user.email;
}
