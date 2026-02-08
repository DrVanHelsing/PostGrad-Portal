# PostGrad Portal – Development Changelog & Research Notes

> **Project**: Postgraduate Request Portal  
> **Context**: Academic Research Project (Design Science Research Methodology)  
> **Date**: February 2026  
> **Scope**: Document Review System, Annotation Engine, Notification Architecture, and Codebase Cleanup

---

## Table of Contents

1. [Overview](#1-overview)
2. [Document Review & Version Control System](#2-document-review--version-control-system)
3. [PDF Annotation Engine](#3-pdf-annotation-engine)
4. [Batch Annotation Workflow](#4-batch-annotation-workflow)
5. [Notification Architecture](#5-notification-architecture)
6. [Email Integration (EmailJS)](#6-email-integration-emailjs)
7. [Document Generation & Management](#7-document-generation--management)
8. [UWC Branding & Logo Integration](#8-uwc-branding--logo-integration)
9. [Codebase Cleanup – Mock Data Removal](#9-codebase-cleanup--mock-data-removal)
10. [Challenges Faced](#10-challenges-faced)
11. [Lessons Learned](#11-lessons-learned)
12. [Design Science Alignment](#12-design-science-alignment)
13. [File Inventory](#13-file-inventory)

---

## 1. Overview

This document records the second major development iteration of the PostGrad Portal, building upon the Firebase migration documented in [FIREBASE_MIGRATION_CHANGELOG.md](FIREBASE_MIGRATION_CHANGELOG.md). This iteration focused on:

- **Document Review & Version Control** — a complete multi-version document review system with comments, feedback, and status workflow
- **PDF Annotation Engine** — full-screen PDF viewer with text-selection-based annotations, highlight overlays, reply threads, and resolve/reopen functionality
- **Batch Annotation Workflow** — draft → confirm → send pattern for supervisors to batch-review annotations before sending to students
- **Comprehensive Notification Architecture** — replacing broken mock in-memory notifications with Firestore-persisted notifications + EmailJS email delivery across all cross-user actions
- **Document Generation** — 19 realistic sample documents (PDF, DOCX, XLSX) generated with pdf-lib, docx, and exceljs for end-to-end testing
- **UWC Branding** — official SVG logo integration across sidebar, login page, and browser favicon
- **Codebase Cleanup** — removal of the legacy `mockData.js` (627 lines) and all dead code dependencies

### Design Science Iteration

This work constitutes the **third DSRM iteration** of the artefact:

| Iteration | Focus | Key Deliverable |
|-----------|-------|-----------------|
| 1 | UI Prototype | React SPA with mock data, all 4 roles, complete workflow UI |
| 2 | Firebase Migration | Persistent data, real authentication, real-time subscriptions |
| 3 | Document Review + Notifications | Annotation engine, version control, email integration, cleanup |
| 4 | Help System + Theming + Docs | Guided tours, Help & Docs page, dark/light mode, spec comparison |

---

## 2. Document Review & Version Control System

### 2.1 Problem Statement

The functional specification requires supervisors and coordinators to review student submissions, provide structured feedback, and manage document revisions. The initial prototype had no document viewing capability — documents were listed as metadata only.

### 2.2 Solution Design

A dedicated `DocumentReviewPage` was built with the following architecture:

**Firestore Collection: `documentVersions`**
```
documentVersions/{versionId}
├── requestId: string
├── versionNumber: number
├── status: 'submitted' | 'under_review' | 'changes_requested' | 'approved' | 'superseded'
├── documents: [{ name, url, type, size }]
├── comments: [{ authorId, authorName, authorRole, text, createdAt, documentName, parentCommentId }]
├── feedback: [{ authorId, authorName, authorRole, recommendation, text, criteria: [{ key, label, rating }] }]
├── submittedAt: Timestamp
└── updatedAt: Timestamp
```

**Key Design Decisions:**
- Comments and feedback are stored as **arrays within the version document** rather than subcollections — this reduces Firestore reads (one read gets all data for a version) and simplifies the real-time subscription model
- Version status follows a linear state machine: submitted → under_review → changes_requested / approved
- When changes are requested, the student can upload a new version, which sets the previous version to `superseded`

### 2.3 Features

| Feature | Description |
|---------|-------------|
| Version timeline | Visual version selector showing all versions with status badges |
| Document grid | Card grid of all documents in a version with type icons and size |
| Comments thread | Role-coloured avatars, reply chains, document filtering |
| Feedback system | 5-criteria rating (Research Quality, Academic Writing, Methodology, Completeness, Formatting) with star ratings and recommendation |
| Status workflow | Start Review / Request Changes / Approve buttons with role guards |
| Upload new version | Modal for students to upload revised documents |
| Annotated PDF viewer | Opens full-screen viewer with annotation capabilities |

---

## 3. PDF Annotation Engine

### 3.1 Problem Statement

Supervisors need to provide precise, text-specific feedback on student submissions. Generic comments are insufficient for academic review — annotations must be linked to specific passages in the document.

### 3.2 Solution: AnnotatedDocViewer

A full-screen PDF viewer component (`AnnotatedDocViewer.jsx`, ~885 lines) using react-pdf with the following capabilities:

**Architecture:**
```
AnnotatedDocViewer (main component)
├── PDF rendering via react-pdf (Document + Page)
├── Text layer selection detection (mouseup handler)
├── Selection popover (Annotate button appears near selection)
├── Sidebar with tabs:
│   ├── Annotations tab (list of all annotations with reply threads)
│   └── New tab (annotation creation form with colour picker)
├── HighlightOverlay (sub-component) — draws coloured highlights over matching text
├── AnnotationCard (sub-component) — renders individual annotation with actions
└── Confirm modal (batch send workflow)
```

**Firestore Collection: `annotations`**
```
annotations/{annotationId}
├── versionId: string
├── documentName: string
├── selectedText: string
├── comment: string
├── highlightColor: string (#ffd43b, #69db7c, etc.)
├── pageNumber: number
├── authorId, authorName, authorRole: string
├── status: 'draft' | 'sent'
├── resolved: boolean
├── replies: [{ id, text, authorId, authorName, authorRole, createdAt }]
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

### 3.3 Text Selection + Highlight Overlay

The highlight system works by:

1. **Text selection**: When the user selects text on the PDF page, a `mouseup` handler on the document container detects the `window.getSelection()` range
2. **Popover**: A floating "Annotate" button appears near the selection coordinates
3. **Saving**: The selected text string, page number, and user comment are stored in Firestore
4. **Overlay rendering**: `HighlightOverlay` searches the PDF text layer for spans matching the stored `selectedText`, computes their bounding rectangles relative to the container, and renders absolutely-positioned coloured `<div>`s on top

**Limitation**: The highlight matching uses string search (`indexOf`) on the concatenated text of all `<span>` elements in the text layer. This works well for contiguous text but may not perfectly match selections that span across unusual text layer segmentation.

---

## 4. Batch Annotation Workflow

### 4.1 Design Rationale

Sending notifications for every individual annotation would overwhelm students and create a fragmented review experience. Instead, supervisors should be able to:

1. Add multiple annotations as **drafts** during a review session
2. Review all drafts together in a confirmation modal
3. Send all at once, triggering a single consolidated notification

### 4.2 Implementation

**State flow:**
```
Create annotation → status: 'draft' → card shows amber "Draft" badge
                                     → sidebar shows "Review & Send (N drafts)" button
Click "Review & Send" → Confirm modal opens listing all draft annotations
Click "Confirm & Send" → Firestore batch update: status → 'sent'
                       → In-app notification created (Firestore)
                       → Email sent via EmailJS
                       → Modal closes, badges removed
```

**Key functions** in `annotations.js`:
- `createAnnotation()` — accepts `status = 'draft'` parameter
- `confirmAndSendAnnotations(versionId, documentName)` — queries draft annotations for a specific document and batch-updates to `'sent'`

---

## 5. Notification Architecture

### 5.1 The Mock Data Bug

A critical bug was discovered during audit: two files (`AnnotatedDocViewer.jsx` and `DocumentReviewPage.jsx`) were importing `addNotification` from the **legacy `mockData.js`** instead of the Firestore-backed version in `DataContext`. This meant:

- Notifications were written to an in-memory JavaScript array
- They were invisible to the Firestore-backed notification UI in the Header
- They were lost on page refresh
- No email was sent

### 5.2 Fix

Both files were updated to use `addNotification` from `useData()` (DataContext), which calls `addNotificationDoc()` in `firestore.js` — writing directly to the `notifications` Firestore collection with real-time subscription propagation.

### 5.3 Complete Notification Coverage

The following table shows every cross-user action and its notification mechanism:

| Source File | Action | In-App (Firestore) | Email (EmailJS) |
|-------------|--------|---------|--------|
| `firestore.js` | Submit to supervisor | ✅ supervisor + student | ✅ via HDRequestsPage |
| `firestore.js` | Supervisor approve | ✅ student + coordinator | ✅ via HDRequestsPage |
| `firestore.js` | Co-supervisor sign | ✅ student + coordinator | ✅ via HDRequestsPage |
| `firestore.js` | Refer back | ✅ student + supervisor | ✅ via HDRequestsPage |
| `firestore.js` | Forward to Faculty Board | ✅ admin + student | ✅ via HDRequestsPage |
| `firestore.js` | Faculty/Senate Board outcome | ✅ student + supervisor | ✅ via HDRequestsPage |
| `DocumentReviewPage.jsx` | Add comment | ✅ student + supervisor | ✅ email to student |
| `DocumentReviewPage.jsx` | Start review | ✅ student | ✅ email to student |
| `DocumentReviewPage.jsx` | Request changes | ✅ student | ✅ email to student |
| `DocumentReviewPage.jsx` | Approve version | ✅ student + coordinator | ✅ email to student |
| `DocumentReviewPage.jsx` | Submit feedback | ✅ student | ✅ email to student |
| `AnnotatedDocViewer.jsx` | Confirm & send annotations | ✅ student | ✅ email to student |
| `HDRequestsPage.jsx` | Nudge student | ✅ student | ✅ email to student |

---

## 6. Email Integration (EmailJS)

### 6.1 Architecture

EmailJS provides client-side email delivery without a backend server, aligned with the serverless Firebase architecture.

**Configuration:**
- Service: Gmail relay (`service_u7gafjo`)
- Template: Generic notification template (`template_b0kj7mb`) with `{{to_name}}`, `{{subject}}`, `{{message}}`, `{{action_url}}`, `{{action_text}}` variables
- Public key: stored as `VITE_EMAILJS_PUBLIC_KEY` environment variable

**Email functions** in `emailService.js`:
- `sendEmail({ toEmail, toName, subject, message, actionUrl, actionText })` — generic send
- `sendRequestSubmittedEmail()` — submission notification
- `sendRequestApprovedEmail()` — approval notification
- `sendReferredBackEmail()` — refer-back notification
- `sendFinalApprovalEmail()` — final approval notification
- `sendNudgeEmail()` — student nudge notification

All email calls are wrapped in try/catch and use `.catch(console.error)` to prevent email failures from blocking the main workflow.

---

## 7. Document Generation & Management

### 7.1 Approach

Firebase Storage (free tier) requires the Firestore database and Storage bucket to be in the same region. Due to a region mismatch (Firestore in `europe-west1`, Storage bucket auto-created in `us-central1`), documents are served as **static files from the Vite `public/` directory** instead.

### 7.2 Document Inventory

19 documents across 10 request directories, generated using:
- **pdf-lib** for PDFs (with UWC branding: navy header, gold accents, structured fields)
- **docx** for Word documents
- **exceljs** for Excel spreadsheets

| Script | Files Generated | Function |
|--------|----------------|----------|
| `upload-documents.mjs` | 13 files | Main document generator with DOCUMENT_MAP |
| `generate-missing-pdfs.mjs` | 6 files | Fills gaps for documents referenced in version seeds |

### 7.3 Discovery of Missing PDFs

During testing, 6 PDFs that were referenced in `seed-document-versions.mjs` did not exist on disk. The `upload-documents.mjs` script only generated 13 files, but the version data referenced 19 unique document URLs. A dedicated `generate-missing-pdfs.mjs` script was created to fill these gaps using the same pdf-lib helpers and UWC branding.

---

## 8. UWC Branding & Logo Integration

### 8.1 Implementation

The official UWC SVG logo was added to `public/uwc_logo.svg` and integrated in three locations:

| Location | Before | After |
|----------|--------|-------|
| Sidebar brand | `<div>` with text "UWC" | `<img src="/uwc_logo.svg">` |
| Login page | `<div>` with text "UWC" (64x64) | `<img src="/uwc_logo.svg">` (80x80) |
| Browser favicon | Default Vite logo (`vite.svg`) | UWC logo |
| Page title | "postgrad-portal" | "UWC PostGrad Portal" |

CSS was updated to style the `<img>` element (object-fit, border-radius) instead of the previous text-based block.

---

## 9. Codebase Cleanup – Mock Data Removal

### 9.1 Background

The original `mockData.js` (627 lines) was the pre-Firebase in-memory data store. After the Firebase migration, all 16+ page components were updated to use `useData()` from `DataContext.jsx`, which provides the same API surface backed by Firestore.

### 9.2 Audit Findings

| Category | Count | Status |
|----------|-------|--------|
| Exports in mockData.js | 40+ | 100% replaced by Firestore equivalents |
| Files importing mockData | 2 (down from 17) | Fixed to use DataContext |
| Dead code (never imported) | `sendMockEmail`, subscriber system | Removed |
| Shadowed imports | `getUserById` in DocumentReviewPage | Cleaned |

### 9.3 Files Removed

| File | Reason |
|------|--------|
| `src/data/mockData.js` | All exports replaced by Firestore-backed DataContext |
| `src/data/` (directory) | Empty after mockData.js removal |
| `public/vite.svg` | Replaced by `uwc_logo.svg` |

### 9.4 Impact

- **Bundle size**: Reduced by removing 627 lines of unused code
- **Bug fix**: Notifications now persist to Firestore instead of vanishing in-memory
- **Maintainability**: Single source of truth for data operations (DataContext + firestore.js)
- **No regressions**: Build verified at 711 modules (down from 712 — the removed mockData.js)

---

## 10. Challenges Faced

### 10.1 PDF Worker Configuration (react-pdf + Vite)

**Problem**: react-pdf requires a PDF.js web worker. The default CDN URL approach failed because:
- The CDN URL for pdfjs-dist v5.4.296 returned a 404
- Vite's asset handling doesn't automatically resolve worker imports

**Solution**: Import the worker file directly using Vite's `?url` suffix:
```javascript
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
```

**Lesson**: Always use local worker files bundled with the library version to avoid CDN version skew.

### 10.2 Firebase Storage Region Mismatch

**Problem**: Firestore was created in `europe-west1`, but Firebase Storage's default bucket was auto-created in `us-central1`. Firebase requires both services to share a region for optimal performance, and cross-region access is not supported on the free Spark plan.

**Solution**: Documents are served as static files from Vite's `public/` directory. This avoids Storage entirely while still providing realistic document viewing and annotation.

**Trade-off**: No runtime upload capability — documents must be pre-generated. Acceptable for a demo/evaluation system.

### 10.3 Missing PDF Files in Seed Data

**Problem**: The document version seed data (`seed-document-versions.mjs`) referenced 19 unique document URLs, but the document generator (`upload-documents.mjs`) only produced 13 files. This caused 6 PDFs to fail to load in the viewer.

**Root Cause**: The document generator's `DOCUMENT_MAP` was written before the version seed data was finalised, resulting in a mismatch.

**Solution**: Created `generate-missing-pdfs.mjs` to generate the 6 missing files using the same pdf-lib pipeline and UWC branding helpers.

**Lesson**: Always validate data references end-to-end — seed scripts should be treated as a connected pipeline with integrity checks.

### 10.4 Annotation Seed Data Reference Errors

**Problem**: Two of five seeded annotations referenced non-existent documents (`Ethics_Clearance.pdf` and `Budget_Proposal.xlsx`), causing them to not display in the viewer.

**Solution**: Fixed the `documentName` fields to match actual file names (`Ethics_Clearance_Application.pdf` and `Ethics_Application_v1.pdf`).

### 10.5 Mock Data Notification Bug

**Problem**: After the Firebase migration, notifications in `DocumentReviewPage.jsx` and `AnnotatedDocViewer.jsx` were still being written to the **in-memory mock array** instead of Firestore. This meant:
- Notifications appeared to work during the same session (the in-memory array was accessible)
- But they were invisible in the Header's notification dropdown (which reads from Firestore)
- And they were lost on page refresh

**Root Cause**: During the Firebase migration, these two files (added later) were inadvertently wired to the old `mockData.js` import instead of the `DataContext` API.

**Solution**: Replaced `import { addNotification } from '../data/mockData'` with destructured `addNotification` from `useData()` in both files.

**Lesson**: When migrating from a mock layer to a real backend, establish a lint rule or import restriction to prevent imports from the deprecated module.

### 10.6 Avatar Component Size Prop Mismatch

**Problem**: The `Avatar` component accepted string sizes (`'sm'`, `'md'`, `'lg'`) which map to CSS classes. `DocumentReviewPage` was passing numeric pixel values (`size={28}`, `size={32}`), resulting in invalid CSS classes like `avatar-28`.

**Solution**: Updated the Avatar component to detect numeric sizes and apply inline `width`/`height`/`fontSize` styles, while preserving the string-based class system for other consumers.

---

## 11. Lessons Learned

### 11.1 Architecture & Design

1. **API surface preservation matters**: The Firebase migration succeeded because `DataContext` preserved the exact same function signatures as `mockData.js`. When adding new features (DocumentReview, Annotations), the same pattern should be followed — new Firestore modules should match the context API.

2. **Serverless trade-offs are real**: The Firebase Storage region issue forced a pivot to static document serving. In a production system, this would need to be resolved — either by recreating the project with aligned regions or by using a multiregion bucket.

3. **Draft → Send pattern is essential for review workflows**: Sending individual notifications per annotation creates noise. The batch workflow pattern (draft → review → confirm & send) is a UX pattern worth adopting for any multi-item review process.

### 11.2 React & Frontend

4. **Component prop contracts should be typed**: The Avatar size bug would have been caught immediately with TypeScript or PropTypes. Even in a JSX-only project, documenting expected prop types in comments is valuable.

5. **PDF.js worker versioning is fragile**: The worker file must exactly match the pdfjs-dist version. CDN URLs can break silently when versions update. Using Vite's `?url` import for local files eliminates this risk.

6. **Portal rendering for overlay components**: `AnnotatedDocViewer` renders via `createPortal` to `document.body` to avoid z-index stacking context issues with the sidebar/header. This is essential for full-screen overlay components.

### 11.3 Data & Backend

7. **Composite Firestore indexes must be pre-created**: Queries combining `where()` + `orderBy()` require composite indexes. These manifest as runtime errors in the browser console with a clickable link to create the index. Always test queries in dev before deployment.

8. **Seed data is infrastructure**: Treat seed scripts as first-class code with referential integrity checks. A `validate-seed-data.mjs` script that verifies all document URLs resolve to actual files would have prevented the missing PDF issue.

9. **Real-time subscriptions are powerful but require cleanup**: Every `onSnapshot` listener creates a persistent WebSocket connection. Components must return the unsubscribe function from `useEffect` cleanup to prevent memory leaks and duplicate listeners.

### 11.4 Process

10. **Incremental verification prevents compound errors**: Running `npm run build` after each major change catches import errors, missing modules, and syntax issues early — before they compound with other changes.

11. **Mock data should have an expiry date**: The mock layer was valuable for rapid prototyping but became a liability after migration. A migration checklist that tracks "files still importing from mock" would have caught the notification bug sooner.

---

## 12. Design Science Alignment

This iteration advances the artefact through the DSRM cycle:

| DSRM Phase | Activity |
|------------|----------|
| **Problem Identification** | Document review and annotation are core academic workflows that were missing from the prototype |
| **Objective Definition** | Enable text-level feedback, version management, and reliable cross-user notifications |
| **Design & Development** | This changelog documents the construction of 3 major subsystems (viewer, annotations, notifications) |
| **Demonstration** | 19 sample documents, 7 version histories, and 5 annotations enable controlled demonstration |
| **Evaluation** | The live system enables usability testing with real document interaction, measurable notification delivery, and end-to-end workflow validation |

### Artefact Quality Metrics

| Metric | Value |
|--------|-------|
| Production build modules | 711 |
| Firestore collections | 9 |
| Demo users | 7 (across 4 roles) |
| Sample documents | 19 (PDF, DOCX, XLSX) |
| Notification trigger points | 13 distinct actions |
| Total source files | ~50 |
| Lines of CSS | ~2,500+ |
| Dead code removed | 627 lines (mockData.js) |

---

## 13. File Inventory

### Files Created in This Iteration

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/AnnotatedDocViewer.jsx` | ~885 | Full-screen PDF viewer with annotations |
| `src/components/AnnotatedDocViewer.css` | ~700 | Viewer styles including draft, confirm modal |
| `src/firebase/annotations.js` | ~175 | Annotation CRUD + batch confirm/send |
| `src/firebase/documentVersions.js` | ~200 | Version control Firestore operations |
| `src/pages/DocumentReviewPage.jsx` | ~980 | Version control UI, comments, feedback |
| `src/pages/DocumentReviewPage.css` | ~350 | Review page styles |
| `scripts/seed-document-versions.mjs` | ~360 | Version history seed data |
| `scripts/seed-annotations.mjs` | ~170 | Annotation seed data |
| `scripts/generate-missing-pdfs.mjs` | ~250 | Missing PDF generator |

### Files Modified in This Iteration

| File | Change |
|------|--------|
| `src/components/common/index.jsx` | Avatar component: numeric size support |
| `src/components/layout/Sidebar.jsx` | UWC logo image replacing text |
| `src/components/layout/layout.css` | Logo img styling |
| `src/pages/LoginPage.jsx` | UWC logo image replacing text |
| `src/pages/LoginPage.css` | Logo img styling |
| `index.html` | UWC favicon + page title |
| `firestore.rules` | Rules for annotations collection |

### Files Removed

| File | Reason |
|------|--------|
| `src/data/mockData.js` | Fully replaced by Firestore-backed DataContext |
| `public/vite.svg` | Replaced by UWC logo |

---

---

# Iteration 4 — Help System, Guided Tours, Dark/Light Mode & Specification Comparison

> **Date**: February 2026  
> **Scope**: Help & Documentation page, interactive guided tours, theme system, comprehensive dark mode, system vs specification analysis

---

## 14. Dark/Light Mode (Theme System)

### 14.1 Problem Statement

The portal had a single light theme with no user preference support. Extended use by academics (supervisors reviewing documents, coordinators processing queues) required reduced eye strain options.

### 14.2 Solution: ThemeContext

A dedicated `ThemeContext.jsx` provides:

- **State**: `theme` (string: `'light'` | `'dark'`), `setTheme(t)`, `toggleTheme()`
- **Persistence**: `localStorage` key `pgportal-theme`
- **DOM integration**: Sets `data-theme` attribute on `document.documentElement`, enabling CSS cascade
- **Provider**: Wraps the app in `App.jsx` above the Router

### 14.3 CSS Implementation Strategy

1. **CSS custom properties** in `:root` define the light theme (default)
2. A `[data-theme="dark"]` selector block overrides all 40+ custom properties (backgrounds, borders, text, shadows, status colours)
3. **Element-level overrides** (100+ selectors) handle elements that use hardcoded colours, inline styles, or component-specific implementations that can't rely on variables alone

**Categories of dark overrides:**
- Global: body, scrollbars, sidebar, header, search  
- Forms: inputs, selects, textareas, placeholders, focus rings
- Tables: th, td, zebra striping
- Modals: overlay backdrop, modal card
- Components: filter chips, tabs, notification dropdown, empty states
- Pages: calendar, toast, login form, annotation viewer, signature pad, file upload zone

### 14.4 Settings Integration

`SettingsPage.jsx` now has an **Appearance** tab (alongside Profile, Notifications, Security) with:
- Two visual cards (Light Mode with sun icon, Dark Mode with moon icon)
- Active state ring on the currently selected theme
- Instant theme apply on click (no save button needed)

---

## 15. Guided Tour Engine

### 15.1 Problem Statement

The portal serves four user roles with distinct workflows. New users (particularly students joining each academic year) need onboarding without external documentation.

### 15.2 Solution: GuidedTour Context

A context-based overlay system (`GuidedTour.jsx`, ~250 lines) providing:

**Core Architecture:**
```
TourProvider (wraps Layout)
├── State: activeTour, stepIndex, highlight rect, tooltip position
├── positionStep()
│   ├── Find DOM element by CSS selector
│   ├── scrollIntoView({ behavior: 'smooth', block: 'center' })
│   ├── Wait 350ms for scroll to settle
│   ├── Compute bounding rect with padding
│   └── Calculate tooltip position (bottom/top/left/right/center)
├── Route navigation (useNavigate) for cross-page tours
├── Click-to-proceed: attach click listener to target element
├── Window resize: reposition on viewport change
└── TourOverlay (portal to document.body)
    ├── SVG mask backdrop with rectangular cutout
    ├── Highlight ring (gold pulse animation)
    ├── Tooltip card (title, content, step counter)
    ├── Progress dots (active/completed states)
    └── Navigation buttons (Previous, Next, End Tour)
```

**Key Design Decisions:**
- **SVG mask cutout** — a full-viewport SVG `<rect>` with a `<mask>` exclusion creates a dark backdrop with a transparent window over the highlighted element. This approach works regardless of the element's z-index or stacking context.
- **Fixed dark tooltip** — the tooltip uses a dark background (`#1a2332`) with white text and gold (`#C5A55A`) accents, ensuring readability in both light and dark page themes.
- **Route-aware steps** — each step can specify a `route` property. If the current page differs, the engine navigates first, then waits 500ms for the DOM to settle before positioning the highlight.

### 15.3 Walkthrough Definitions

`walkthroughs.js` (~350 lines) defines 13 walkthroughs grouped into categories:

**Full System Tours (per role):**

| Tour | Steps | Covers |
|------|-------|--------|
| Full Student Tour | 15 | Dashboard → Requests → Submit → Tracker → Calendar → Progress → Help → Settings → Dark mode |
| Full Supervisor Tour | 11 | Dashboard → Requests → Review → Documents → Calendar → Students → Help → Settings |
| Full Coordinator Tour | 11 | Dashboard → Requests → FHD/SHD → Tracker → Calendar → Students → Audit → Help → Settings |
| Full Admin Tour | 11 | Dashboard → Analytics → Requests → Audit → Roles → Calendar → Students → Help → Settings |

**Task-Specific Tours:**

| Tour | Steps | Purpose |
|------|-------|---------|
| Change Theme | 5 | Settings → Appearance tab → select mode |
| Submit Request | 6 | Navigate → New Request → Select type → Fill → Upload → Submit |
| Review Request | 6 | Navigate → Select request → View detail → Review → Sign → Approve |
| Track Submissions | 5 | Navigate → Tracker → Select request → View workflow → Check timer |
| Use Calendar | 4 | Navigate → Month view → Click day → Create event |
| Manage Notifications | 5 | Settings → Notifications tab → Toggle preferences |
| Annotate Documents | 5 | Open document → Select text → Add comment → Save → Send |
| Manage Roles | 4 | Navigate → View users → Change role → Save |
| View Audit Logs | 4 | Navigate → Search → Filter dates → Export CSV |
| View Analytics | 4 | Navigate → View charts → Summary stats → Status breakdown |

**Helper function**: `getToursForRole(role)` filters tours to only show those relevant to the user's role.

---

## 16. Help & Documentation Page

### 16.1 Problem Statement

Users need self-service help without leaving the portal. The system is complex enough that a static FAQ is insufficient — guides and interactive tours are needed.

### 16.2 Solution: HelpPage

`HelpPage.jsx` (~400 lines) with three tabs and universal search:

**Tab 1 — FAQs:**
- 7 categories: General, HD Requests, Documents & Reviews, Notifications, Settings & Appearance, Calendar & Tracking, Administration
- 20+ questions with expandable answers
- Answers include inline tour-launch buttons (e.g., "Take the Change Theme tour" inside a dark mode FAQ)
- Search filters across all categories

**Tab 2 — Guides:**
- 6 static guides, role-filtered using `useAuth()`:
  1. *HD Workflow Guide* — Full lifecycle explanation (all roles)
  2. *Document Review & Annotation* — Version control + PDF annotation (supervisor/coordinator/admin)
  3. *Getting Started as a Student* — First-time student onboarding
  4. *Getting Started as a Supervisor* — Supervisor workflow overview
  5. *Customising Your Appearance* — Theme switching guide (all roles)
  6. *System Governance & Reporting* — Audit logs + analytics (admin)
- Expandable cards with markdown content rendering (h2, h3, lists, bold, italic, code)

**Tab 3 — Interactive Walkthroughs:**
- Featured card at top with the full role-specific system tour (navy gradient, gold accents)
- Category-grouped grid of individual task tours
- Each card shows step count, description, and "Start Tour" button
- Launches via `useTour().startTour()` — tour immediately begins with overlay

### 16.3 Navigation

`Sidebar.jsx` updated: `HiOutlineQuestionMarkCircle` icon added to **all 4 role** nav arrays as "Help & Docs" → `/help`.

---

## 17. System vs Specification Analysis

A dedicated comparison document was created at `docs/SYSTEM_VS_SPECIFICATION.md` providing:

- Feature-by-feature evaluation against every section of the Functional Specification
- Three-tier rating: ✅ Fully Implemented, ⚠️ Partially Implemented, ❌ Not Implemented
- Summary matrix: **46 fully implemented (73%), 13 partially (21%), 4 not implemented (6%)**
- Documented rationale for every deviation or omission
- Catalogue of 9 features implemented **beyond** the specification

---

## 18. Iteration 4 — File Inventory

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/context/ThemeContext.jsx` | ~40 | Dark/light mode state with localStorage persistence |
| `src/context/GuidedTour.jsx` | ~250 | Tour engine: overlay, highlight, auto-scroll, cross-page |
| `src/context/GuidedTour.css` | ~160 | Tour overlay, highlight ring, tooltip styles |
| `src/pages/HelpPage.jsx` | ~400 | Help & Docs page (FAQs, guides, walkthroughs) |
| `src/pages/HelpPage.css` | ~300 | Help page styles |
| `src/pages/walkthroughs.js` | ~350 | 13 walkthrough step definitions |
| `docs/SYSTEM_VS_SPECIFICATION.md` | ~300 | Feature comparison vs Functional Specification |

### Files Modified

| File | Change |
|------|--------|
| `src/index.css` | Added `--bg-secondary`, full `[data-theme="dark"]` variable block, 100+ element overrides |
| `src/App.jsx` | ThemeProvider wrapper, HelpPage import, `/help` route, CSS-var loading screen |
| `src/components/layout/Sidebar.jsx` | Help & Docs nav item added to all 4 role menus |
| `src/components/layout/Layout.jsx` | Wrapped in TourProvider |
| `src/pages/SettingsPage.jsx` | Appearance tab with theme selection cards |
| `README.md` | Updated features, project structure, routes, documentation links |
| `docs/DEVELOPMENT_CHANGELOG.md` | Added Iteration 4 section |

### Build Metrics

| Metric | Before | After |
|--------|--------|-------|
| Production build modules | 711 | 717 |
| Source files | ~50 | ~57 |
| CSS overrides (dark mode) | 0 | 100+ |
| Guided tour definitions | 0 | 13 |
| FAQ entries | 0 | 20+ |
| Static guides | 0 | 6 |

---

## 19. Design Science Alignment (Iteration 4)

| DSRM Phase | Activity |
|------------|----------|
| **Problem Identification** | Users lack onboarding experience; no self-service help; no theme preferences; no formal spec traceability |
| **Objective Definition** | Provide interactive onboarding, comprehensive help, theme customisation, and formal specification comparison |
| **Design & Development** | This section documents the construction of 4 subsystems (tour engine, help page, theme system, spec analysis) |
| **Demonstration** | 13 walkthroughs, 20+ FAQs, 6 guides, full dark/light mode enable controlled demonstration |
| **Evaluation** | Guided tours enable usability testing without facilitator guidance; spec comparison enables completeness evaluation |

---

*Document updated as part of the PostGrad Portal Design Science Research artefact development (Iteration 4).*
