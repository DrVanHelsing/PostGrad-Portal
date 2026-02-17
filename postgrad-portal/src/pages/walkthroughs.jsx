// ============================================
// Walkthrough Definitions – Step-by-step guides
// Each tour is an object with { id, title, description, roles, steps }
// Steps: { selector, route, title, content, tooltipPosition, clickToProceed }
// ============================================

import {
  HiOutlineRocketLaunch,
  HiOutlineDocumentText,
  HiOutlinePencilSquare,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
  HiOutlinePaintBrush,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';

/* ── Helper: role-aware tour filtering ── */
export const TOUR_CATEGORIES = {
  getting_started: { label: 'Getting Started', icon: <HiOutlineRocketLaunch /> },
  requests: { label: 'HD Requests', icon: <HiOutlineDocumentText /> },
  reviews: { label: 'Reviews & Documents', icon: <HiOutlinePencilSquare /> },
  tracking: { label: 'Tracking & Progress', icon: <HiOutlineChartBar /> },
  admin: { label: 'Administration', icon: <HiOutlineShieldCheck /> },
  settings: { label: 'Settings & Preferences', icon: <HiOutlinePaintBrush /> },
};

/* ════════════════════════════════════════
   COMPLETE SYSTEM TOURS (per role)
   ════════════════════════════════════════ */

const FULL_STUDENT_TOUR = {
  id: 'full-student',
  title: 'Complete Student Guide',
  description: 'A comprehensive tour of every feature available to students — from dashboard to settings.',
  category: 'getting_started',
  roles: ['student'],
  steps: [
    { title: 'Welcome to the PostGrad Portal', content: 'This guided tour will walk you through every feature available to you as a student. Let\'s get started!', tooltipPosition: 'center' },
    { selector: '.sidebar', route: '/dashboard', title: 'Sidebar Navigation', content: 'This is your main navigation panel. It contains links to all your available pages grouped by section.', tooltipPosition: 'right' },
    { selector: '.sidebar-link[href="/dashboard"]', route: '/dashboard', title: 'Dashboard', content: 'Your dashboard shows an overview of your requests, upcoming deadlines, and recent activity. This is your home page.', tooltipPosition: 'right' },
    { selector: '.stats-grid', route: '/dashboard', title: 'Overview Stats', content: 'These cards show your key metrics at a glance — active requests, pending reviews, and upcoming deadlines.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/requests"]', route: '/dashboard', title: 'HD Requests', content: 'Click here to view and manage your Higher Degree requests. You can create new requests and track existing ones.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/requests', title: 'Your Requests', content: 'This page lists all your HD requests. You can filter by status, search, and click on any request to see its full details and workflow history.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/progress-tracker"]', route: '/requests', title: 'Progress Tracker', content: 'The tracker shows where each submission sits in the HD committee pipeline and milestone journey.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/progress-tracker', title: 'Track Your Submissions', content: 'Use tabs and filters to move between submissions, milestones, and targeted timeline views.', tooltipPosition: 'bottom' },
    { selector: '.page-header', route: '/dashboard', title: 'Calendar on Dashboard', content: 'Your dashboard includes a calendar widget for deadlines, meetings, and committee events.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/settings"]', route: '/progress-tracker', title: 'Settings', content: 'Manage your profile, notification preferences, theme, and password here.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/settings', title: 'Settings Page', content: 'Update your profile information, toggle notification preferences, switch between light and dark mode, and change your password.', tooltipPosition: 'bottom' },
    { title: 'Tour Complete', content: 'You\'ve seen all the main features available to you. Use the Help & Docs page anytime to revisit guides or start specific walkthroughs.', tooltipPosition: 'center' },
  ],
};

const FULL_SUPERVISOR_TOUR = {
  id: 'full-supervisor',
  title: 'Complete Supervisor Guide',
  description: 'A comprehensive tour of all supervisor features — review workflows, student management, and more.',
  category: 'getting_started',
  roles: ['supervisor'],
  steps: [
    { title: 'Welcome, Supervisor!', content: 'This tour covers all features available to you as a supervisor. You can review student requests, provide feedback, and manage your students.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/dashboard"]', route: '/dashboard', title: 'Your Dashboard', content: 'The dashboard gives an overview of pending reviews, student activity, and recent submissions requiring your attention.', tooltipPosition: 'right' },
    { selector: '.stats-grid', route: '/dashboard', title: 'Key Metrics', content: 'See at a glance how many requests need review, how many students you supervise, and any approaching deadlines.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/requests"]', route: '/dashboard', title: 'Review Requests', content: 'Access all HD requests assigned to you for review. You can approve, request changes, or add comments.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/requests', title: 'Request Review', content: 'Filter requests by status and click on any request to open the detailed review page with comments, feedback, and decisions.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/students"]', route: '/requests', title: 'Your Students', content: 'View all students assigned to you, monitor their progress, and access their submission history.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/students', title: 'Student Management', content: 'Here you can see each student\'s current status, their active requests, and send nudge notifications if needed.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/progress-tracker"]', route: '/students', title: 'Progress Tracker', content: 'Monitor pipeline and milestone progress of requests from your students.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/dashboard', title: 'Calendar on Dashboard', content: 'View committee meetings, deadlines, and events from the dashboard calendar widget.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/settings"]', route: '/progress-tracker', title: 'Settings', content: 'Manage your profile, notifications, appearance, and password.', tooltipPosition: 'right', clickToProceed: true },
    { title: 'Tour Complete', content: 'You\'re now familiar with all supervisor features. Use the Help & Docs page for specific task walkthroughs anytime.', tooltipPosition: 'center' },
  ],
};

const FULL_COORDINATOR_TOUR = {
  id: 'full-coordinator',
  title: 'Complete Coordinator Guide',
  description: 'A full walkthrough of coordinator responsibilities — student oversight, committee prep, and record management.',
  category: 'getting_started',
  roles: ['coordinator'],
  steps: [
    { title: 'Welcome, Coordinator!', content: 'This comprehensive tour covers all your coordination tools — from global student oversight to committee preparation and audit logging.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/dashboard"]', route: '/dashboard', title: 'Coordinator Dashboard', content: 'Your dashboard shows high-level metrics: total students, active submissions, committee pipeline status and recent activity.', tooltipPosition: 'right' },
    { selector: '.stats-grid', route: '/dashboard', title: 'Programme Metrics', content: 'These cards summarise your postgraduate programme — total students, pending reviews, and approval rates.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/requests"]', route: '/dashboard', title: 'All Requests', content: 'View every HD request across the programme. Manage review status, record committee outcomes, and assign reference numbers.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.sidebar-link[href="/students"]', route: '/requests', title: 'All Students', content: 'Full student roster with filtering and search. Monitor progress, update records, and manage supervisors.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/dashboard', title: 'Calendar on Dashboard', content: 'Create and manage institution-wide events, deadlines, and committee meeting dates from the embedded calendar widget.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/progress-tracker"]', route: '/students', title: 'Progress Tracker', content: 'A visual, filter-driven pipeline and milestone view across the programme.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.sidebar-link[href="/audit"]', route: '/progress-tracker', title: 'Audit Logs', content: 'View a complete activity trail — every status change, comment, approval, and system event is logged here.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/audit', title: 'Audit Trail', content: 'Filter by user, action type, and date range. Essential for governance, compliance, and dispute resolution.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/settings"]', route: '/audit', title: 'Settings', content: 'Profile, notifications, theme, and password management.', tooltipPosition: 'right', clickToProceed: true },
    { title: 'Tour Complete', content: 'You\'ve seen all coordinator features. Visit Help & Docs for targeted walkthroughs anytime.', tooltipPosition: 'center' },
  ],
};

const FULL_ADMIN_TOUR = {
  id: 'full-admin',
  title: 'Complete Admin Guide',
  description: 'Full system administration tour — role management, analytics, audit logs, and governance tools.',
  category: 'getting_started',
  roles: ['admin'],
  steps: [
    { title: 'Welcome, Administrator!', content: 'This tour covers all system administration features — user management, analytics, audit logging, and system configuration.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/dashboard"]', route: '/dashboard', title: 'Admin Dashboard', content: 'System-wide overview showing total users, active requests, approval rates, and system health metrics.', tooltipPosition: 'right' },
    { selector: '.sidebar-link[href="/requests"]', route: '/dashboard', title: 'All Requests', content: 'View and manage every HD request in the system with full administrative access.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.sidebar-link[href="/students"]', route: '/requests', title: 'All Students', content: 'Complete student directory with all administrative data, status, and history.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.sidebar-link[href="/audit"]', route: '/students', title: 'Audit Logs', content: 'Full system audit trail — track every user action, system event, and data change.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.sidebar-link[href="/analytics"]', route: '/audit', title: 'Analytics', content: 'System-wide analytics and data visualization — submission trends, processing times, and usage statistics.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/analytics', title: 'Analytics Dashboard', content: 'Charts and graphs showing key performance indicators for the postgraduate programme.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/roles"]', route: '/analytics', title: 'Role Management', content: 'Assign and modify user roles, manage permissions, and handle access control.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/roles', title: 'User Roles', content: 'View all users, change role assignments, and manage system access. This is a critical governance function.', tooltipPosition: 'bottom' },
    { selector: '.sidebar-link[href="/settings"]', route: '/roles', title: 'Settings', content: 'Your profile, preferences, and system settings.', tooltipPosition: 'right', clickToProceed: true },
    { title: 'Tour Complete', content: 'You\'re now familiar with all admin features. The Help & Docs page has targeted walkthroughs for specific tasks.', tooltipPosition: 'center' },
  ],
};

/* ════════════════════════════════════════
   SPECIFIC TASK WALKTHROUGHS
   ════════════════════════════════════════ */

const CHANGE_THEME_TOUR = {
  id: 'change-theme',
  title: 'Change Theme (Light / Dark Mode)',
  description: 'Learn how to switch between light and dark mode for a comfortable viewing experience.',
  category: 'settings',
  roles: ['student', 'supervisor', 'coordinator', 'admin'],
  steps: [
    { title: 'Changing the Theme', content: 'This walkthrough will show you how to switch between light and dark mode. The theme is saved locally and persists across sessions.', tooltipPosition: 'center' },
    { selector: '.header-icon-btn[aria-label*="mode"]', route: null, title: 'Theme Toggle', content: 'Click the <strong>sun/moon icon</strong> in the header to instantly switch between light and dark mode. You can also change the theme from Settings.', tooltipPosition: 'bottom' },
    { title: 'Theme Updated', content: 'Your theme preference is saved automatically. Use the header toggle anytime you want to switch. The theme works consistently across all pages.', tooltipPosition: 'center' },
  ],
};

const SUBMIT_REQUEST_TOUR = {
  id: 'submit-request',
  title: 'Submit an HD Request',
  description: 'Step-by-step guide to creating and submitting a new Higher Degree request.',
  category: 'requests',
  roles: ['student'],
  steps: [
    { title: 'Submitting an HD Request', content: 'This walkthrough guides you through creating and submitting a new Higher Degree request. Let\'s begin!', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/requests"]', route: null, title: 'Go to Requests', content: 'Navigate to the HD Requests page from the sidebar.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/requests', title: 'Your Requests Page', content: 'Here you can see all your existing requests. To create a new one, look for the "New Request" button at the top of the page.', tooltipPosition: 'bottom' },
    { selector: '.btn-primary, button[class*="btn-primary"]', route: '/requests', title: 'Create New Request', content: 'Click the "New Request" button to open the request creation form. You\'ll need to select a request type and fill in the required fields.', tooltipPosition: 'bottom' },
    { title: 'Filling Out the Form', content: 'In the request form you\'ll:\n\n1. Select the request type (Registration, Title Registration, etc.)\n2. Fill in required details\n3. Attach documents only if the selected request type requires them\n4. Submit for supervisor review\n\nAfter submission, your supervisor receives a notification and can begin reviewing.', tooltipPosition: 'center' },
    { title: 'What Happens Next?', content: 'Once submitted, your request enters the review pipeline:\n\n<strong>Submitted → Supervisor Review → Co-Supervisor (if applicable) → Coordinator → Faculty Board → Senate Board → Approved</strong>\n\nYou can track progress on the Submission Tracker page at any time.', tooltipPosition: 'center' },
  ],
};

const REVIEW_REQUEST_TOUR = {
  id: 'review-request',
  title: 'Review a Student Request',
  description: 'Learn how to review, comment on, and approve or refer back an HD request.',
  category: 'reviews',
  roles: ['supervisor', 'coordinator'],
  steps: [
    { title: 'Reviewing an HD Request', content: 'This walkthrough guides you through the review process for student HD requests.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/requests"]', route: null, title: 'Go to Requests', content: 'Open the Requests page to see all requests assigned to you for review.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/requests', title: 'Request List', content: 'Filter requests by status to find those pending your review. Click on any request to open its detail page.', tooltipPosition: 'bottom' },
    { title: 'Request Detail Page', content: 'On the request detail page you can:\n\n1. <strong>Review submitted form data and attached files</strong>\n2. <strong>Add comments</strong> — provide contextual feedback in the comments section\n3. <strong>Submit feedback</strong> — rate the submission on 5 criteria\n4. <strong>Approve or Request Changes</strong> — advance the request or send it back', tooltipPosition: 'center' },
    { title: 'Review Complete!', content: 'After your review, the request moves to the next stage in the pipeline. The student and relevant parties receive notifications about your decision.', tooltipPosition: 'center' },
  ],
};

const TRACK_SUBMISSIONS_TOUR = {
  id: 'track-submissions',
  title: 'Track Submission Progress',
  description: 'Learn how to monitor the progress of HD submissions through the committee pipeline.',
  category: 'tracking',
  roles: ['student', 'supervisor', 'coordinator', 'admin'],
  steps: [
    { title: 'Tracking Submissions', content: 'The Submission Tracker provides a visual pipeline view of all HD submissions. Let\'s explore it.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/progress-tracker"]', route: null, title: 'Open Tracker', content: 'Navigate to the Progress Tracker from the sidebar.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/progress-tracker', title: 'Submission Pipeline', content: 'Use filters and tabs to monitor submissions, milestones, and workflow state in one place.', tooltipPosition: 'bottom' },
    { title: 'Pipeline Stages', content: 'The stages are:\n\n1. <strong>Draft</strong> — not yet submitted\n2. <strong>Submitted to Supervisor</strong> — awaiting review\n3. <strong>Supervisor Review</strong> — under supervisor assessment\n4. <strong>Co-Supervisor Review</strong> — if applicable\n5. <strong>Coordinator Review</strong> — programme-level review\n6. <strong>Faculty Board</strong> — FHD committee decision\n7. <strong>Senate Board</strong> — SHD final approval\n8. <strong>Approved</strong> — completed', tooltipPosition: 'center' },
    { title: 'That\'s It!', content: 'Apply filters to reveal detailed timelines and monitor progress by status, stage, and milestone type. The tracker updates in real-time as decisions are made.', tooltipPosition: 'center' },
  ],
};

const USE_CALENDAR_TOUR = {
  id: 'use-calendar',
  title: 'Using the Dashboard Calendar',
  description: 'View and manage deadlines, meetings, and events from the dashboard calendar widget.',
  category: 'tracking',
  roles: ['student', 'supervisor', 'coordinator', 'admin'],
  steps: [
    { title: 'Calendar Overview', content: 'The dashboard calendar helps you keep track of important dates, deadlines, and events.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/dashboard"]', route: null, title: 'Open Dashboard', content: 'Navigate to the dashboard to access the embedded calendar widget.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/dashboard', title: 'Calendar Widget', content: 'The monthly calendar displays events colour-coded by type: deadlines (red), meetings (blue), events (purple), and reminders (amber).', tooltipPosition: 'bottom' },
    { title: 'Event Types', content: '<strong>Deadlines</strong> — HD submission deadlines\n<strong>Meetings</strong> — Committee meetings\n<strong>Events</strong> — Faculty events, workshops\n<strong>Reminders</strong> — System-generated reminders\n\nCoordinators and admins can create new events. All users can view events relevant to their role.', tooltipPosition: 'center' },
  ],
};

const MANAGE_NOTIFICATIONS_TOUR = {
  id: 'manage-notifications',
  title: 'Managing Notifications',
  description: 'Learn how to view and manage your in-app notifications and email preferences.',
  category: 'settings',
  roles: ['student', 'supervisor', 'coordinator', 'admin'],
  steps: [
    { title: 'Notification System', content: 'The portal sends in-app and email notifications for important events. Let\'s explore how to manage them.', tooltipPosition: 'center' },
    { selector: '.header-icon-btn[aria-label="Notifications"]', route: '/dashboard', title: 'Notification Bell', content: 'Click the bell icon to see your recent notifications. A red dot indicates unread notifications.', tooltipPosition: 'bottom' },
    { title: 'Notification Types', content: 'You receive notifications for:\n\n• Request status changes\n• New review assignments\n• Comments and feedback\n• Thesis annotation activity (for thesis-related reviews)\n• Deadline reminders\n• Committee decisions\n\nEach notification also sends an email.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/settings"]', route: '/dashboard', title: 'Notification Settings', content: 'Navigate to Settings to customise which notifications you receive.', tooltipPosition: 'right', clickToProceed: true },
    { title: 'Customise Preferences', content: 'On the Settings page under the Notifications tab, you can toggle individual notification categories on or off. Preferences are saved to your account.', tooltipPosition: 'center' },
  ],
};

const ANNOTATE_DOCUMENTS_TOUR = {
  id: 'annotate-documents',
  title: 'Annotating Documents',
  description: 'Learn to add text annotations with highlights to thesis-related student submissions.',
  category: 'reviews',
  roles: ['supervisor', 'coordinator'],
  steps: [
    { title: 'Document Annotation', content: 'The annotation system lets you provide precise, text-level feedback on thesis-related PDF documents. Annotations are highlighted directly on the document.', tooltipPosition: 'center' },
    { title: 'Opening a Document', content: 'From any request\'s review page, click on a PDF document to open the full-screen Annotated Document Viewer.', tooltipPosition: 'center' },
    { title: 'Creating an Annotation', content: '1. <strong>Select text</strong> on the PDF by clicking and dragging\n2. A floating <strong>"Annotate"</strong> button appears near your selection\n3. Click it to open the annotation form\n4. Choose a <strong>highlight colour</strong> and type your comment\n5. Click <strong>Save</strong> — the annotation is saved as a draft', tooltipPosition: 'center' },
    { title: 'Managing Annotations', content: 'Use the sidebar to:\n\n• View all annotations for the document\n• <strong>Reply</strong> to annotations (threaded discussion)\n• <strong>Resolve</strong> annotations when addressed\n• <strong>Reopen</strong> if further action is needed', tooltipPosition: 'center' },
    { title: 'Batch Send Workflow', content: 'Annotations are saved as <strong>drafts</strong> until you\'re ready.\n\n1. Add as many annotations as needed\n2. The sidebar shows a <strong>"Review & Send (N drafts)"</strong> button\n3. Click to open the confirmation modal\n4. Review all drafts, then click <strong>"Confirm & Send"</strong>\n5. The student receives a single notification with all annotations', tooltipPosition: 'center' },
  ],
};

const MANAGE_ROLES_TOUR = {
  id: 'manage-roles',
  title: 'Managing User Roles',
  description: 'How to view and change user roles and permissions as an administrator.',
  category: 'admin',
  roles: ['admin'],
  steps: [
    { title: 'Role Management', content: 'As an administrator, you can view all users and manage their role assignments.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/roles"]', route: null, title: 'Open Role Management', content: 'Navigate to the Role Management page from the sidebar.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/roles', title: 'User Directory', content: 'This page shows all system users with their current roles, departments, and last activity. Use the search and filter options to find specific users.', tooltipPosition: 'bottom' },
    { title: 'Changing a Role', content: 'To change a user\'s role:\n\n1. Find the user in the list\n2. Click their role badge or edit button\n3. Select the new role from the dropdown\n4. Confirm the change\n\nRole changes take effect immediately and are logged in the audit trail.', tooltipPosition: 'center' },
  ],
};

const VIEW_AUDIT_LOGS_TOUR = {
  id: 'view-audit-logs',
  title: 'Viewing Audit Logs',
  description: 'How to access and filter the system audit trail for governance and compliance.',
  category: 'admin',
  roles: ['coordinator', 'admin'],
  steps: [
    { title: 'Audit Logs', content: 'The audit log records every significant action in the system — submissions, approvals, comments, role changes, and more.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/audit"]', route: null, title: 'Open Audit Logs', content: 'Navigate to the Audit Logs page.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/audit', title: 'Activity Trail', content: 'The audit log shows a chronological list of all system events. Each entry includes the user, action, timestamp, and affected resource.', tooltipPosition: 'bottom' },
    { title: 'Filtering & Searching', content: 'Use the filter options to:\n\n• Search by user name\n• Filter by action type (create, update, approve, etc.)\n• Filter by date range\n• View specific resource types\n\nThis is essential for compliance, dispute resolution, and system oversight.', tooltipPosition: 'center' },
  ],
};

const VIEW_ANALYTICS_TOUR = {
  id: 'view-analytics',
  title: 'System Analytics',
  description: 'Explore system-wide analytics, charts, and performance metrics.',
  category: 'admin',
  roles: ['admin'],
  steps: [
    { title: 'System Analytics', content: 'The Analytics dashboard provides visual insights into system usage, submission trends, and programme performance.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/analytics"]', route: null, title: 'Open Analytics', content: 'Navigate to the Analytics page.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/analytics', title: 'Analytics Overview', content: 'View charts and metrics including submission volumes over time, average processing times, approval rates, and user activity patterns.', tooltipPosition: 'bottom' },
    { title: 'Using Analytics', content: 'Analytics helps you:\n\n• Identify bottlenecks in the review pipeline\n• Monitor programme health metrics\n• Track supervisor response times\n• Generate reports for stakeholders', tooltipPosition: 'center' },
  ],
};

const CSV_IMPORT_TOUR = {
  id: 'csv-import',
  title: 'Bulk Import Users (CSV)',
  description: 'Learn how to create multiple user accounts by uploading a CSV file.',
  category: 'admin',
  roles: ['admin'],
  steps: [
    { title: 'Bulk User Import', content: 'This walkthrough shows you how to create multiple user accounts at once by uploading a CSV file. Ideal for onboarding cohorts of students or adding new staff.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/roles"]', route: null, title: 'Open Role Management', content: 'Navigate to the Role Management page from the sidebar.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/roles', title: 'Import CSV Button', content: 'At the top of the page, click the <strong>"Import CSV"</strong> button (next to "Create User") to open the import dialog.', tooltipPosition: 'bottom' },
    { title: 'Prepare Your CSV', content: 'Your CSV file needs these <strong>required columns</strong>:\n\n• <strong>firstName</strong> — User\'s first name\n• <strong>surname</strong> — User\'s last name\n• <strong>email</strong> — Unique email address\n• <strong>role</strong> — student, supervisor, coordinator, admin, external, or examiner\n\n<strong>Optional columns:</strong> title, studentNumber, organization', tooltipPosition: 'center' },
    { title: 'Download a Template', content: 'Click <strong>"Download CSV Template"</strong> in the import dialog to get a pre-formatted file with example data. Edit it in Excel or any text editor, then save as CSV.', tooltipPosition: 'center' },
    { title: 'Validate & Import', content: '1. Select your CSV file — the system validates every row\n2. Review the preview table for errors (shown in red)\n3. Invalid rows are skipped automatically\n4. Click <strong>"Import Users"</strong> to begin\n5. A progress bar tracks creation', tooltipPosition: 'center' },
    { title: 'Review Results', content: 'After import, the dialog shows:\n\n• <strong>Successfully created</strong> users with temporary passwords\n• <strong>Failed</strong> users with error reasons\n\nYou can copy each user\'s temporary password from the results table. Users must change their password on first login.', tooltipPosition: 'center' },
  ],
};

const VIEW_FORM_TOUR = {
  id: 'view-form',
  title: 'Viewing Submitted Forms',
  description: 'Learn how to view the full multi-section form for any HD request in read-only mode.',
  category: 'requests',
  roles: ['student', 'supervisor', 'coordinator', 'admin'],
  steps: [
    { title: 'Viewing HD Request Forms', content: 'Every HD request type has a structured multi-section form. You can view any submitted form in read-only mode, regardless of your role.', tooltipPosition: 'center' },
    { selector: '.sidebar-link[href="/requests"]', route: null, title: 'Open Requests', content: 'Navigate to the HD Requests page from the sidebar.', tooltipPosition: 'right', clickToProceed: true },
    { selector: '.page-header', route: '/requests', title: 'Select a Request', content: 'Click on any request row in the table to open its detail view.', tooltipPosition: 'bottom' },
    { title: 'View Form Button', content: 'In the request detail view, click <strong>"View Submitted Form"</strong> (or <strong>"View Form Template"</strong> if no data has been submitted yet).\n\nThis opens the full multi-section form in read-only mode. All fields and sections are visible to all roles — nothing is hidden behind role locks.', tooltipPosition: 'center' },
    { title: 'That\'s It!', content: 'The form viewer shows every section of the form with all data filled in (if submitted). Fields appear greyed-out to indicate read-only status. This provides full transparency across all roles.', tooltipPosition: 'center' },
  ],
};

/* ════════════════════════════════════════
   EXPORT ALL TOURS
   ════════════════════════════════════════ */

export const ALL_TOURS = [
  // Full system tours
  FULL_STUDENT_TOUR,
  FULL_SUPERVISOR_TOUR,
  FULL_COORDINATOR_TOUR,
  FULL_ADMIN_TOUR,
  // Task-specific
  CHANGE_THEME_TOUR,
  SUBMIT_REQUEST_TOUR,
  REVIEW_REQUEST_TOUR,
  TRACK_SUBMISSIONS_TOUR,
  USE_CALENDAR_TOUR,
  MANAGE_NOTIFICATIONS_TOUR,
  ANNOTATE_DOCUMENTS_TOUR,
  MANAGE_ROLES_TOUR,
  VIEW_AUDIT_LOGS_TOUR,
  VIEW_ANALYTICS_TOUR,
  CSV_IMPORT_TOUR,
  VIEW_FORM_TOUR,
];

/** Get tours available for a specific role */
export function getToursForRole(role) {
  return ALL_TOURS.filter(t => t.roles.includes(role));
}
