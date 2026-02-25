# UWC PostGrad Portal

<p align="center">
  <img src="public/uwc_logo.svg" alt="University of the Western Cape" width="100" />
</p>

A role-based postgraduate request management system for the **University of the Western Cape (UWC)**. Built with React 19, Vite, Firebase (Authentication + Cloud Firestore), and standard CSS. Deployed on Vercel with Vercel Analytics.

---

## Features

### Six User Roles

| Role | Capabilities |
|---|---|
| **Student** | Create/submit HD requests, track submissions, manage milestones, view academic progress |
| **Supervisor** | Review requests, approve/refer back, sign digitally, nudge students, annotate documents and forms |
| **Coordinator** | Manage all requests, forward to Faculty/Senate Boards, record outcomes, export agendas |
| **Admin** | System overview, analytics, role management, audit logs, dataset exports, form builder |
| **External** | View assigned requests, submit forms, participate in external review workflows |
| **Examiner** | Review assigned requests, complete examiner-specific form sections |

---

### Core Functionality

#### HD Request Workflow
- Full lifecycle: Draft → Submitted to Supervisor → Co-Supervisor Review → Coordinator Review → Faculty Board → Senate Board → Approved
- 24-hour amendment timer when requests are referred back
- "Overdue Only" filter for coordinators/admins
- Visual submission tracker with current owner, timestamps, and response timer badges

#### Dynamic Form System
- **20 prebuilt templates** (HDR-001 to HDR-020) covering all Higher Degree request types
- **15 field types**: text, textarea, select, radio, checkbox, date, email, phone, number, file upload, keywords tag input, table layout, weighted-table (auto-scoring), repeater-group (dynamic rows), and digital signature blocks
- Conditional field/section visibility based on form data
- Auto-population of fields from user profile and student profile data
- Role-locked sections — visible but locked to specific roles with overlay messaging
- In-progress form validation with per-field error display

#### Inline Form Annotation System
- **Unified annotation types**: field-level comments, section-level comments, and text-highlight annotations — all rendered inline within the form
- **Text highlighting**: Select any text in a field and a popover appears to annotate the exact excerpt; highlighted snippets are shown as badges beneath the field
- **Inline comment threads**: clicking the comment button on a field or section expands a thread inline below that element — no separate sidebar or panel
- **Inline annotation filters**: All / Open / Resolved filter buttons placed directly in the modal toolbar (default: All), wiring into the form renderer to show/hide relevant threads
- **Collapsible threads**: short comments display fully; long comments or threads with replies collapse to a preview and expand on click/hover
- Reply threads, resolve/reopen actions on each annotation
- Annotation badges on fields with unread/open indicators (`has-open` / `all-resolved` states)
- Supervisors, co-supervisors, coordinators, and admins can resolve and reopen annotations

#### Admin Form Builder
- Full-screen visual template editor (`/form-builder`) with three-panel layout (template list, editor, live preview)
- Drag-and-drop section reordering, field CRUD, auto-save
- "Seed All Templates" bulk-loads all 20 prebuilt HD forms
- **Header/Footer Template Editor** — element-based visual customisation with 6 element types (image, text, title, label, date, separator), per-element styling (font, alignment, colour, opacity), and "Apply to All Templates" to propagate branding across all 20 forms

#### Document Review & Version Control
- Multi-version document management with visual diff tracking
- Structured feedback with per-criteria ratings
- Status workflow: Submitted → Under Review → Changes Requested → Approved → Superseded
- Full-screen PDF viewer (`AnnotatedDocViewer`) with:
  - Text selection and inline highlight annotations
  - Colour picker for highlight colours
  - Reply threads on highlights
  - Resolve/reopen annotation status
  - Draft → Sent batch annotation workflow (supervisors review all drafts, then send in one action)

#### Notification System
- Real-time Firestore-backed notifications with bell icon, unread count badge, and mark-as-read
- **EmailJS** integration: 11 actively wired email functions trigger real emails on every cross-user workflow event
- **Persistent Alert Banners** — `NotificationAlerts` surfaces 5 alert types as color-coded banners: overdue requests (danger), approaching deadlines < 6h (warning), referred-back action required (info), stale drafts > 3 days (info), pending supervisor reviews (info)

#### UI & Theming
- **Dark / Light Mode** — complete theming via CSS custom properties with persistent preference (localStorage). All form elements, signature blocks, auto-populated fields, action bars, and every page component adapt to both themes
- Signature and auto-populated fields use the form background colour in dark mode for a seamless appearance
- First-login password change enforcement (redirect to `/settings`)
- Responsive layout with mobile breakpoints

#### Other Features
- **Digital Signatures** — draw or type signature pad, stored per section, previewed in the form
- **DOCX Export** — client-side Word document generation from filled forms with UWC branding and signature placeholders
- **Access Code System** — secure supervisor access via 6-character codes with configurable expiry
- **Nudge System** — supervisors can send reminder notifications to students
- **Committee Exports** — CSV export of Faculty/Senate Board agendas
- **Calendar** — full CRUD month-view calendar with role-based auto-filtering
- **Milestones** — students log academic milestones (conferences, publications, awards)
- **Audit Logs** — searchable activity log with date filtering and CSV export
- **Analytics Dashboard** — bar charts for request status/type distribution and summary statistics
- **Role Management** — admin interface to create users and reassign roles across all 6 types; external/examiner users include an organisation field
- **UserPicker** — reusable modal for dynamic supervisor/coordinator selection with real-time search, role filter chips, and avatar display
- **Help & Documentation** — dedicated Help & Docs page with 7 FAQ categories (20+ questions), 6 static guides, and 13 interactive walkthrough tours
- **Guided Tour System** — overlay-based walkthrough engine with SVG mask highlighting, auto-scroll, click-to-proceed steps, cross-page navigation, and 4 role-specific full-system tours
- **Vercel Analytics** — production usage analytics via `@vercel/analytics`

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
| **Email** | EmailJS (`@emailjs/browser`) |
| **PDF Viewer** | react-pdf 10 + pdfjs-dist 5.4 |
| **PDF Generation** | pdf-lib (dev scripts only) |
| **Icons** | react-icons/hi2 (Heroicons v2) |
| **Dates** | date-fns 4 |
| **Styling** | Standard CSS with custom properties (UWC brand colours, dark/light themes) |
| **State** | Firestore real-time subscriptions via React Context |
| **Deployment** | Vercel (production) |
| **Analytics** | `@vercel/analytics` (Vercel Analytics) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project (Spark plan is sufficient)
- An EmailJS account for email notifications

### Installation

```bash
# Clone and install
cd postgrad-portal
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

Create a `.env` file in the `postgrad-portal/` directory:

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

### Seeding the Database

```bash
# Create Firebase Auth users
node scripts/setup-firebase.mjs

# Seed all Firestore collections
node scripts/seed-firebase.mjs

# Seed form templates
node scripts/seed-form-templates.mjs

# Seed document versions
node scripts/seed-document-versions.mjs

# Or re-seed everything at once
node scripts/reseed-firebase.mjs
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
├── storage.rules                      # Firebase Storage security rules
├── vite.config.js
├── vercel.json                        # Vercel SPA routing config
├── public/
│   ├── uwc_logo.svg                   # University of the Western Cape logo
│   └── documents/                     # Sample documents (PDF/DOCX/XLSX)
│       ├── hdr-001/ … hdr-012/        # 19 generated sample documents across 10 form types
├── scripts/                           # Automation & provisioning (Node.js ESM)
│   ├── setup-firebase.mjs             # Firebase Auth user creation
│   ├── seed-firebase.mjs              # Firestore collection seeding (7+ collections)
│   ├── reseed-firebase.mjs            # Clear & re-seed all data
│   ├── seed-document-versions.mjs     # Document version history seeding
│   ├── seed-annotations.mjs           # Annotation seed data
│   ├── seed-form-templates.mjs        # Form template seeding
│   ├── upload-documents.mjs           # Generate sample PDFs/DOCX/XLSX with pdf-lib
│   ├── generate-docs-pdf.mjs          # Generate documents PDF
│   ├── generate-missing-pdfs.mjs      # Generate additional PDFs for document versions
│   ├── generate-thesis-pdfs.mjs       # Generate thesis PDF samples
│   ├── repair-pdfs.mjs                # Repair malformed PDF files
│   ├── backfill-local-passwords.mjs   # Backfill local password hashes
│   ├── enable-auth-provider.mjs       # Firebase Auth provider setup
│   ├── test-emailjs.mjs               # EmailJS connectivity test
│   └── test-firestore.mjs             # Firestore connectivity test
├── docs/
│   ├── DEVELOPMENT_CHANGELOG.md       # 7 DSRM iterations documented
│   ├── SYSTEM_VS_SPECIFICATION.md     # 63-requirement spec comparison
│   ├── PLATFORM_COMPARISON.md         # Firebase vs Azure comparative analysis
│   └── GLOSSARY.md                    # Domain terminology
└── src/
    ├── App.jsx                        # Routes and protected route wrapper (+ Vercel Analytics)
    ├── main.jsx                       # Entry point
    ├── index.css                      # Global styles & CSS custom properties
    ├── components/
    │   ├── common/                    # Shared UI components
    │   │   ├── index.jsx              # Card, Modal (fullscreen), StatusBadge, Avatar, etc.
    │   │   ├── common.css
    │   │   ├── SignaturePad.jsx       # Draw/type signature capture
    │   │   ├── UserPicker.jsx         # Reusable user selection modal (search, role filter, avatars)
    │   │   └── NotificationAlerts.jsx # Persistent alert banners (5 alert types)
    │   ├── forms/                     # Dynamic form system
    │   │   ├── index.js               # Barrel export
    │   │   ├── DynamicFormRenderer.jsx # Master renderer: headers, footers, sections, fields, inline annotations
    │   │   ├── FormFieldRenderer.jsx   # Field-type dispatcher (15 types)
    │   │   ├── FormSignatureBlock.jsx  # Signature capture (draw/type) with dark mode support
    │   │   ├── FormAnnotationThread.jsx# Inline annotation thread component (replies, resolve, reopen)
    │   │   ├── FormAnnotationsPanel.jsx# Standalone annotation panel (legacy, kept for reference)
    │   │   ├── KeywordsTagInput.jsx    # Multi-tag keyword input
    │   │   ├── WeightedTableField.jsx  # Assessment table with weighted scoring
    │   │   ├── RepeaterGroupField.jsx  # Dynamic add/remove field groups
    │   │   ├── LockedSectionOverlay.jsx# Locked section overlay with message
    │   │   ├── HeaderFooterEditor.jsx  # Visual header/footer designer (element-based)
    │   │   ├── HeaderFooterEditor.css  # Editor styles
    │   │   ├── FormAnnotations.css     # Inline annotation thread styles
    │   │   └── document-form.css       # Form document styles with full dark mode support
    │   ├── layout/                    # App shell
    │   │   ├── Layout.jsx
    │   │   ├── Header.jsx             # Notification bell dropdown
    │   │   ├── Sidebar.jsx            # UWC-branded nav with 6 role-specific menus
    │   │   └── layout.css
    │   ├── AnnotatedDocViewer.jsx     # Full-screen PDF viewer + highlight annotation system
    │   ├── AnnotatedDocViewer.css
    │   └── CalendarWidget.jsx         # Embeddable calendar widget
    ├── context/
    │   ├── AuthContext.jsx            # Firebase Auth provider (first-login enforcement)
    │   ├── DataContext.jsx            # Firestore real-time subscriptions + mutations + getUsersByRole
    │   ├── ThemeContext.jsx           # Dark/light mode provider (localStorage persistence)
    │   ├── GuidedTour.jsx             # Guided tour engine (overlay, highlight mask, auto-scroll)
    │   └── GuidedTour.css             # Tour overlay + tooltip styles
    ├── firebase/
    │   ├── config.js                  # Firebase app initialisation
    │   ├── firestore.js               # Firestore CRUD (all collections)
    │   ├── collections.js             # Collection name constants
    │   ├── documentVersions.js        # Document version control operations
    │   ├── annotations.js             # PDF annotation CRUD + batch confirm/send
    │   ├── formTemplates.js           # Form template & submission CRUD
    │   ├── prebuiltTemplates.js       # 20 prebuilt HD form template definitions
    │   └── storage.js                 # Firebase Storage helpers
    ├── services/
    │   ├── emailService.js            # EmailJS integration (11 active email functions)
    │   ├── pdfService.js              # Client-side PDF generation (jsPDF)
    │   └── docxExportService.js       # Client-side DOCX generation from filled forms
    ├── pages/
    │   ├── Dashboard.jsx              # Role-based dashboard router
    │   ├── Dashboard.css
    │   ├── HDRequestsPage.jsx         # Request list, detail modal, workflow actions, inline annotation filters
    │   ├── HDRequestsPage.css
    │   ├── DocumentReviewPage.jsx     # Version control, comments, feedback, PDF annotations
    │   ├── DocumentReviewPage.css
    │   ├── SubmissionsPage.jsx        # Submissions list view
    │   ├── SubmissionsPage.css
    │   ├── SubmissionTracker.jsx      # Visual workflow progress tracker
    │   ├── SubmissionTracker.css
    │   ├── CalendarPage.jsx           # Month calendar with CRUD
    │   ├── CalendarPage.css
    │   ├── StudentsPage.jsx           # Student directory with edit modal
    │   ├── AcademicProgressPage.jsx   # Student academic history
    │   ├── AnalyticsPage.jsx          # Admin analytics with bar charts
    │   ├── AuditLogsPage.jsx          # Searchable, filterable audit log with CSV export
    │   ├── RoleManagementPage.jsx     # Admin role assignment (6 roles, org field for external/examiner)
    │   ├── FormBuilderPage.jsx        # Full-screen admin form template editor
    │   ├── FormBuilderPage.css
    │   ├── LoginPage.jsx              # Login with demo quick-access cards
    │   ├── LoginPage.css
    │   ├── ProgressTrackerPage.jsx    # Progress tracker page wrapper
    │   ├── SettingsPage.jsx           # Profile, notifications, password, appearance (theme toggle)
    │   ├── HelpPage.jsx               # Help & Docs (FAQs, guides, interactive walkthroughs)
    │   ├── HelpPage.css
    │   ├── walkthroughs.jsx           # 13 walkthrough definitions (4 full + 9 task-specific)
    │   ├── SeedPage.jsx               # Admin-only database reseed tool
    │   └── dashboards/
    │       ├── StudentDashboard.jsx
    │       ├── SupervisorDashboard.jsx
    │       ├── CoordinatorDashboard.jsx
    │       └── AdminDashboard.jsx
    └── utils/
        ├── constants.js               # Status configs, labels, workflow states, 6 roles, section roles
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
| `/submissions` | SubmissionsPage | Student, Supervisor, Coordinator, Admin |
| `/progress-tracker` | ProgressTrackerPage | All |
| `/students` | StudentsPage | Supervisor, Coordinator, Admin |
| `/audit` | AuditLogsPage | Coordinator, Admin |
| `/analytics` | AnalyticsPage | Admin |
| `/roles` | RoleManagementPage | Admin |
| `/form-builder` | FormBuilderPage (fullscreen) | Admin |
| `/settings` | SettingsPage | All (6 roles) |
| `/help` | HelpPage | All (6 roles) |
| `/seed` | SeedPage | Public (dev) |

> Legacy paths `/tracker`, `/calendar`, and `/progress` redirect to their current equivalents.

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
| Form annotations sent (batch) | Student | `sendEmail` (generic) |
| Student nudged | Student | `sendNudgeEmail` |

**11 of 13** email functions actively wired. 2 reserved for future automation (`sendDeadlineReminderEmail`, `sendLinkedFormRequiredEmail`).

---

## Firestore Collections

| Collection | Documents | Description |
|---|---|---|
| `users` | 7 | User profiles (linked to Firebase Auth) — supports 6 role types, `isExternal` flag, `organization` |
| `hdRequests` | 12 | Higher Degree requests with full workflow state |
| `calendarEvents` | 24 | Calendar entries (deadlines, meetings, events) |
| `milestones` | 20 | Student academic milestones |
| `notifications` | 50+ | Per-user notifications (real-time Firestore subscriptions) |
| `studentProfiles` | 3 | Extended student academic profiles |
| `auditLogs` | 40+ | System activity audit trail |
| `documentVersions` | 7 | Document version history with comments/feedback arrays |
| `annotations` | 5+ | PDF highlight annotations with reply threads and batch-send state |
| `formTemplates` | 20 | HD request form template definitions (schema-driven, 15 field types) |
| `formSubmissions` | varies | Submitted form responses linked to templates |

---

## Design Science Iterations

| Iteration | Focus | Key Deliverable |
|---|---|---|
| 1 | UI Prototype | React SPA with mock data, all 4 roles, complete workflow UI |
| 2 | Firebase Migration | Persistent data, real authentication, real-time subscriptions |
| 3 | Document Review + Notifications | Annotation engine, version control, email integration |
| 4 | Help System + Theming | Guided tours, Help & Docs, dark/light mode, spec comparison |
| 5 | Dynamic Forms + Form Builder | 20 templates, 15 field types, visual editor, header/footer customisation, DOCX export |
| 6 | External Users + Alerts | 6-role system, UserPicker, persistent alert banners, full email wiring |
| 7 | Inline Form Annotations | Unified field/section/highlight annotation system, inline filters, collapsible threads, dark mode polish |

---

## Brand

| | |
|---|---|
| **UWC Navy** | `#003366` |
| **UWC Gold** | `#C5A55A` |
| **Logo** | `public/uwc_logo.svg` |

---

## Documentation

- [Development Changelog](postgrad-portal/docs/DEVELOPMENT_CHANGELOG.md) — 7 DSRM iterations: document review, annotations, notifications, dark mode, guided tours, dynamic forms, form builder, external users, alert banners, inline form annotation system
- [System vs Specification](postgrad-portal/docs/SYSTEM_VS_SPECIFICATION.md) — Feature-by-feature comparison against the Functional Specification (63 requirements evaluated)
- [Platform Comparison](postgrad-portal/docs/PLATFORM_COMPARISON.md) — Comparative analysis: Firebase Spark vs Blaze vs Microsoft Azure
- [Glossary](postgrad-portal/docs/GLOSSARY.md) — Domain terminology and system concepts
- [Functional Specification](Postgraduate%20Request%20Portal%20–%20Functional%20Specification.txt) — Original requirements document
