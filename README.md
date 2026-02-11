# UWC PostGrad Portal

<p align="center">
  <img src="public/uwc_logo.svg" alt="University of the Western Cape" width="100" />
</p>

A role-based postgraduate request management system for the **University of the Western Cape (UWC)**. Built with React 19, Vite, Firebase (Authentication + Cloud Firestore), and standard CSS.

---

## Features

### Six User Roles

| Role | Capabilities |
|---|---|
| **Student** | Create/submit HD requests, track submissions, manage milestones, view academic progress |
| **Supervisor** | Review requests, approve/refer back, sign digitally, nudge students, annotate documents |
| **Coordinator** | Manage all requests, forward to Faculty/Senate Boards, record outcomes, export agendas |
| **Admin** | System overview, analytics, role management, audit logs, dataset exports, form builder |
| **External** | View assigned requests, submit forms, participate in external review workflows |
| **Examiner** | Review assigned requests, complete examiner-specific form sections |

### Core Functionality

- **HD Request Workflow** — Full lifecycle: draft → supervisor review → co-supervisor sign → coordinator → Faculty Board → Senate Board → approved
- **Dynamic Form System** — 20 prebuilt templates (HDR-001 to HDR-020) with 15 field types (text, textarea, select, radio, checkbox, date, email, tel, number, file, keywords, table, weighted-table, repeater-group, signature), conditional visibility, auto-population, locked sections, and digital signature blocks
- **Admin Form Builder** — Full-screen visual template editor (`/form-builder`) with three-panel layout (template list, editor, live preview), drag-and-drop section reordering, field CRUD, auto-save, and "Seed All Templates" to load 20 prebuilt forms
- **Header/Footer Template Editor** — Element-based visual customisation for document headers and footers. 6 element types (image, text, title, label, date, separator) with per-element styling (font, alignment, colour, opacity). "Apply to All Templates" propagates branding across all 20 forms
- **Fullscreen Document Preview** — Modal fullscreen toggle for form fill (HD Requests) and Form Builder preview; expand/collapse button in modal header
- **DOCX Export** — Client-side Word document generation from filled forms with UWC branding, structured sections, and signature placeholders
- **Access Code System** — Secure supervisor access via generated 6-character codes with expiry
- **Digital Signatures** — Draw or type signature pad for approval actions
- **Submission Tracker** — Visual workflow progress bar with owner tracking and response timers
- **Document Review & Version Control** — Multi-version document management with visual diff, feedback, and status workflow (submitted → under review → changes requested → approved)
- **PDF Annotation System** — Full-screen PDF viewer (react-pdf) with text selection, inline highlight annotations, colour picker, reply threads, resolve/reopen, and draft → sent batch workflow
- **Batch Annotation Workflow** — Supervisors/coordinators save annotations as drafts, review all at once, then confirm & send to notify the student via in-app notification + email
- **Nudge System** — Supervisors can send reminder notifications to students
- **Committee Exports** — CSV export of Faculty/Senate Board agendas with student number, degree, and supervisor
- **Refer-Back Workflow** — 24-hour amendment timer when requests are referred back
- **Calendar** — Full CRUD calendar with month view, role-based auto-filtering, and event types
- **Milestones** — Students can log academic milestones (conferences, publications, etc.)
- **Audit Logs** — Searchable activity log with date filtering and CSV export
- **Analytics Dashboard** — Bar charts for request status/type distribution, summary statistics
- **Role Management** — Admin interface to create users and reassign roles across all 6 role types, with organisation field for external/examiner users
- **Overdue Monitoring** — "Overdue Only" filter on requests page for coordinators/admins
- **Persistent Alert Banners** — `NotificationAlerts` component surfaces 5 alert types as colour-coded persistent banners: overdue requests (danger), approaching deadlines < 6h (warning), referred-back action required (info), stale drafts > 3 days (info), pending supervisor reviews (info)
- **Notifications** — Real-time Firestore-backed notifications with bell icon, unread count, mark-read, and link navigation
- **Email Notifications** — EmailJS integration with 11 actively wired email functions for real email delivery on all cross-user workflow actions (submissions, approvals, refer-backs, co-supervisor handoffs, coordinator referrals, FHD outcomes, nudges, escalations, form completions)
- **UserPicker** — Reusable modal for dynamic supervisor/coordinator selection with real-time search, role filter chips, and avatar display
- **Dark/Light Mode** — Complete theming system with persistent preference via Settings → Appearance tab. 100+ element-level CSS overrides across all pages ensure consistent styling in both themes
- **Help & Documentation** — Dedicated Help & Docs page (all roles) with 7 FAQ categories (20+ questions), 6 static guides, and 13 interactive walkthrough tours
- **Guided Tour System** — Overlay-based walkthrough engine with SVG mask highlighting, auto-scroll to elements, click-to-proceed steps, cross-page navigation, and 4 role-specific full system tours

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19.2.0 (JSX, no TypeScript) |
| **Build Tool** | Vite 7.3.1 |
| **Routing** | react-router-dom 6.30.3 |
| **Backend** | Firebase (Spark plan, serverless) |
| **Auth** | Firebase Authentication (email/password) |
| **Database** | Cloud Firestore (NoSQL, real-time subscriptions) |
| **Email** | EmailJS (@emailjs/browser) |
| **PDF Viewer** | react-pdf 10 + pdfjs-dist 5.4 |
| **PDF Generation** | pdf-lib (dev scripts) |
| **Icons** | react-icons/hi2 (Heroicons v2) |
| **Dates** | date-fns 4 |
| **Styling** | Standard CSS with custom properties (UWC brand colours) |
| **State** | Firestore real-time subscriptions via React Context |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project (see [Firebase Migration Changelog](docs/FIREBASE_MIGRATION_CHANGELOG.md))

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Firebase and EmailJS credentials (see below)

# Start development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

VITE_EMAILJS_SERVICE_ID=your-emailjs-service-id
VITE_EMAILJS_TEMPLATE_ID=your-emailjs-template-id
VITE_EMAILJS_PUBLIC_KEY=your-emailjs-public-key
```

### Demo Accounts

| Email | Role | Name |
|---|---|---|
| `student@uwc.ac.za` | Student | Thabo Molefe |
| `student2@uwc.ac.za` | Student | Amahle Dlamini |
| `student3@uwc.ac.za` | Student | Sipho Dlamini |
| `supervisor@uwc.ac.za` | Supervisor | Prof. Sarah van der Berg |
| `supervisor2@uwc.ac.za` | Supervisor | Dr. Marcus Thompson |
| `coordinator@uwc.ac.za` | Coordinator | Dr. Fatima Patel |
| `admin@uwc.ac.za` | Admin | Linda Mkhize |

> Default password: `Portal@2026`
>
> **Note:** 6 role types are supported (student, supervisor, coordinator, admin, external, examiner). External and examiner users can be created via the Admin Role Management page.

---

## Project Structure

```
postgrad-portal/
├── index.html                         # Entry HTML (UWC favicon)
├── package.json
├── firebase.json                      # Firebase project config
├── firestore.rules                    # Firestore security rules
├── vite.config.js
├── public/
│   ├── uwc_logo.svg                   # University of the Western Cape logo
│   └── documents/                     # 19 generated sample documents (PDF/DOCX/XLSX)
│       ├── hdr-001/                   # Progress_Report, Publication_Evidence, Supervisor_Feedback
│       ├── hdr-002/                   # Research_Proposal, Literature_Review, Ethics_Clearance
│       ├── hdr-003/                   # Extension_Motivation_Letter
│       ├── hdr-004/                   # Ethics_Application, Informed_Consent, Data_Collection
│       ├── hdr-005/                   # Registration, Academic_Transcript, Progress_Report
│       ├── hdr-006/                   # Examiner_Nomination, Turnitin_Report
│       ├── hdr-007/                   # Progress_Report_NK
│       ├── hdr-009/                   # Medical_Certificate
│       ├── hdr-011/                   # Title_Registration_Form
│       └── hdr-012/                   # Progress_Report_Jan2026
├── scripts/                           # Automation & provisioning
│   ├── setup-firebase.mjs             # Firebase Auth user creation
│   ├── seed-firebase.mjs              # Firestore collection seeding (7 collections)
│   ├── reseed-firebase.mjs            # Clear & re-seed all data
│   ├── seed-document-versions.mjs     # Document version history seeding
│   ├── seed-annotations.mjs           # Annotation seed data
│   ├── upload-documents.mjs           # Generate 13 sample PDFs/DOCX/XLSX with pdf-lib
│   ├── generate-missing-pdfs.mjs      # Generate 6 additional PDFs referenced by versions
│   ├── test-emailjs.mjs               # EmailJS connectivity test
│   └── test-firestore.mjs             # Firestore connectivity test
├── docs/
│   ├── FIREBASE_MIGRATION_CHANGELOG.md
│   ├── EMAILJS_SETUP.md
│   ├── DEVELOPMENT_CHANGELOG.md      # 6 DSRM iterations documented
│   └── SYSTEM_VS_SPECIFICATION.md    # 63-requirement spec comparison
└── src/
    ├── App.jsx                        # Routes and protected route wrapper
    ├── main.jsx                       # Entry point (AuthProvider + DataProvider)
    ├── index.css                      # Global styles & CSS custom properties
    ├── components/
    │   ├── common/                    # Shared UI – Card, Modal (fullscreen), StatusBadge, Avatar, etc.
    │   │   ├── index.jsx
    │   │   ├── common.css
    │   │   ├── SignaturePad.jsx
    │   │   ├── UserPicker.jsx         # Reusable user selection modal (search, role filter, avatars)
    │   │   └── NotificationAlerts.jsx # Persistent alert banners (overdue, deadline, action required)
    │   ├── forms/                     # Dynamic form system (15 field types, 20 templates)
    │   │   ├── index.js               # Forms barrel export
    │   │   ├── DynamicFormRenderer.jsx # Master renderer: headers, footers, sections, fields
    │   │   ├── FormFieldRenderer.jsx   # Field-type dispatcher (15 types)
    │   │   ├── FormSignatureBlock.jsx  # Signature capture (draw/type)
    │   │   ├── KeywordsTagInput.jsx    # Tag input for keywords
    │   │   ├── WeightedTableField.jsx  # Assessment table with weighted scoring
    │   │   ├── RepeaterGroupField.jsx  # Dynamic add/remove field groups
    │   │   ├── LockedSectionOverlay.jsx# Locked section overlay with message
    │   │   ├── HeaderFooterEditor.jsx  # Visual header/footer designer (element-based)
    │   │   ├── HeaderFooterEditor.css  # Editor styles
    │   │   └── document-form.css       # Form fill document styles (print-ready)
    │   ├── layout/                    # App shell – sidebar, header, outlet
    │   │   ├── Layout.jsx
    │   │   ├── Header.jsx             # Notification bell dropdown
    │   │   ├── Sidebar.jsx            # UWC-branded nav with 6 role-specific menus
    │   │   └── layout.css
    │   ├── AnnotatedDocViewer.jsx     # Full-screen PDF viewer + annotation system
    │   └── AnnotatedDocViewer.css
    ├── context/
    │   ├── AuthContext.jsx            # Firebase Auth provider
    │   ├── DataContext.jsx            # Firestore real-time subscriptions + mutations + getUsersByRole helper
    │   ├── ThemeContext.jsx           # Dark/light mode provider (localStorage persistence)
    │   ├── GuidedTour.jsx             # Guided tour engine (overlay, highlight, auto-scroll)
    │   └── GuidedTour.css             # Tour overlay + tooltip styles
    ├── firebase/
    │   ├── config.js                  # Firebase app initialisation
    │   ├── firestore.js               # Firestore CRUD (all collections)
    │   ├── collections.js             # Collection name constants
    │   ├── documentVersions.js        # Document version control operations
    │   ├── annotations.js             # Annotation CRUD + batch confirm/send
    │   ├── formTemplates.js           # Form template & submission CRUD
    │   ├── prebuiltTemplates.js       # 20 prebuilt HD form template definitions
    │   └── storage.js                 # Firebase Storage helpers
    ├── services/
    │   ├── emailService.js            # EmailJS integration (send real emails)
    │   ├── pdfService.js              # Client-side PDF generation (jsPDF)
    │   └── docxExportService.js       # Client-side DOCX generation from filled forms
    ├── pages/
    │   ├── Dashboard.jsx              # Role-based dashboard router
    │   ├── HDRequestsPage.jsx         # Request list, detail modal, all workflow actions
    │   ├── DocumentReviewPage.jsx     # Version control, comments, feedback, annotations
    │   ├── SubmissionTracker.jsx      # Visual workflow progress tracker
    │   ├── CalendarPage.jsx           # Month calendar with CRUD
    │   ├── StudentsPage.jsx           # Student directory with edit modal
    │   ├── AcademicProgressPage.jsx   # Student academic history
    │   ├── AnalyticsPage.jsx          # Admin analytics with charts
    │   ├── AuditLogsPage.jsx          # Searchable audit log
    │   ├── RoleManagementPage.jsx     # Admin role assignment
    │   ├── FormBuilderPage.jsx        # Full-screen admin form template editor
    │   ├── FormBuilderPage.css        # Form builder layout styles
    │   ├── LoginPage.jsx              # Login with demo quick-access
    │   ├── SettingsPage.jsx           # Profile, notifications, password, appearance (theme)
    │   ├── HelpPage.jsx               # Help & Docs (FAQs, guides, interactive walkthroughs)
    │   ├── HelpPage.css               # Help page styles
    │   ├── walkthroughs.js            # 13 walkthrough definitions (4 full + 9 task-specific)
    │   ├── SeedPage.jsx               # Admin-only database reseed tool
    │   └── dashboards/
    │       ├── StudentDashboard.jsx
    │       ├── SupervisorDashboard.jsx
    │       ├── CoordinatorDashboard.jsx
    │       └── AdminDashboard.jsx
    └── utils/
    │   ├── constants.js               # Status configs, labels, workflow states, 6 roles, section roles
        └── helpers.js                 # Date formatting, utilities
```

---

## Routes

| Path | Component | Access |
|---|---|---|
| `/login` | LoginPage | Public |
| `/dashboard` | Dashboard (role-based) | All |
| `/requests` | HDRequestsPage | All |
| `/requests/:requestId/review` | DocumentReviewPage | All |
| `/tracker` | SubmissionTracker | All |
| `/calendar` | CalendarPage | All |
| `/students` | StudentsPage | Supervisor, Coordinator, Admin |
| `/progress` | AcademicProgressPage | Student |
| `/audit` | AuditLogsPage | Coordinator, Admin |
| `/analytics` | AnalyticsPage | Admin |
| `/roles` | RoleManagementPage | Admin |
| `/form-builder` | FormBuilderPage | Admin |
| `/settings` | SettingsPage | All (6 roles) |
| `/help` | HelpPage | All (6 roles) |

---

## Notification System

All cross-user actions trigger **both** in-app Firestore notifications and **EmailJS email notifications**:

| Action | Notified User | Email Function |
|---|---|---|
| Request submitted to supervisor | Supervisor + Student confirmation | `sendFormCompletionEmail` + `sendRequestSubmittedEmail` |
| Supervisor approves | Student + Coordinator | `sendRequestApprovedEmail` |
| Supervisor refers back | Student + Supervisor | `sendReferredBackEmail` |
| Co-supervisor signs | Student + Coordinator | `sendSectionHandoffEmail` |
| Coordinator refers back → supervisor | Supervisor | `sendSectionReferBackEmail` |
| Forwarded to Faculty Board | Admin + Student | `sendEscalationEmail` |
| Faculty/Senate Board outcome | Student + Supervisor | `sendFinalApprovalEmail` (or `sendReferredBackEmail`) |
| Comment added (Document Review) | Student + Supervisor | `sendEmail` (generic) |
| Review started | Student | `sendEmail` (generic) |
| Changes requested | Student | `sendEmail` (generic) |
| Version approved | Student + Coordinator | `sendEmail` (generic) |
| Feedback submitted | Student | `sendEmail` (generic) |
| Annotations sent (batch) | Student | `sendEmail` (generic) |
| Student nudged | Student | `sendNudgeEmail` |

**11 of 13** email functions actively wired. 2 reserved for future server-side automation (`sendDeadlineReminderEmail`, `sendLinkedFormRequiredEmail`).

---

## Firestore Collections

| Collection | Documents | Description |
|---|---|---|
| `users` | 7 | User profiles (linked to Firebase Auth) — supports 6 role types |
| `hdRequests` | 12 | Higher Degree requests with full workflow state |
| `calendarEvents` | 24 | Calendar entries (deadlines, meetings, events) |
| `milestones` | 20 | Student academic milestones |
| `notifications` | ~50+ | Per-user notifications (real-time) |
| `studentProfiles` | 3 | Extended student academic profiles |
| `auditLogs` | 40+ | System activity audit trail |
| `documentVersions` | 7 | Document version history with comments/feedback |
| `annotations` | 5+ | PDF text annotations with reply threads |
| `formTemplates` | 20 | HD request form template definitions (schema-driven) |
| `formSubmissions` | ~0+ | Submitted form responses linked to templates |

---

## Brand

| | |
|---|---|
| **UWC Navy** | `#003366` |
| **UWC Gold** | `#C5A55A` |
| **Logo** | `public/uwc_logo.svg` |

---

## Documentation

- [Firebase Migration Changelog](docs/FIREBASE_MIGRATION_CHANGELOG.md) — Detailed migration from mock data to Firebase
- [Development Changelog](docs/DEVELOPMENT_CHANGELOG.md) — 6 DSRM iterations: document review, annotations, notifications, dark mode, guided tours, dynamic forms, form builder, external users, alert banners
- [System vs Specification](docs/SYSTEM_VS_SPECIFICATION.md) — Feature-by-feature comparison against the Functional Specification (63 requirements evaluated)
- [Platform Comparison](docs/PLATFORM_COMPARISON.md) — Comparative analysis: Firebase Spark vs Blaze vs Microsoft Azure
- [EmailJS Setup Guide](docs/EMAILJS_SETUP.md) — Email notification configuration
- [Functional Specification](../Postgraduate%20Request%20Portal%20–%20Functional%20Specification.txt) — Original requirements document
