# PostGrad Portal – Development Changelog & Research Notes

> **Project**: Postgraduate Request Portal  
> **Context**: Academic Research Project (Design Science Research Methodology)  
> **Date**: February 2026  
> **Scope**: Document Review, Annotation Engine, Notifications, Dynamic Forms, Form Builder, External Users, Alerts & Nudges

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
14. [Dark/Light Mode (Theme System)](#14-darklight-mode-theme-system)
15. [Guided Tour Engine](#15-guided-tour-engine)
16. [Help & Documentation Page](#16-help--documentation-page)
17. [System vs Specification Analysis](#17-system-vs-specification-analysis)
18. [Iteration 4 — File Inventory](#18-iteration-4--file-inventory)
19. [Design Science Alignment (Iteration 4)](#19-design-science-alignment-iteration-4)
20. [Dynamic Form System](#20-dynamic-form-system)
21. [Admin Form Builder](#21-admin-form-builder)
22. [Header/Footer Visual Editor](#22-headerfooter-visual-editor)
23. [Fullscreen Document Preview](#23-fullscreen-document-preview)
24. [DOCX Export Service](#24-docx-export-service)
25. [Iteration 5 — File Inventory](#25-iteration-5--file-inventory)
26. [Design Science Alignment (Iteration 5)](#26-design-science-alignment-iteration-5)
27. [Email Notification Wiring](#27-email-notification-wiring)
28. [UserPicker Component](#28-userpicker-component)
29. [External User & Examiner Role Support](#29-external-user--examiner-role-support)
30. [Persistent Notification Alerts](#30-persistent-notification-alerts)
31. [DataContext Enhancement: getUsersByRole](#31-datacontext-enhancement-getusersbyRole)
32. [UI Consistency Fixes](#32-ui-consistency-fixes)
33. [Iteration 6 — File Inventory](#33-iteration-6--file-inventory)
34. [Design Science Alignment (Iteration 6)](#34-design-science-alignment-iteration-6)

---

## 1. Overview

This document records the development iterations of the PostGrad Portal, building upon the Firebase migration documented in [FIREBASE_MIGRATION_CHANGELOG.md](FIREBASE_MIGRATION_CHANGELOG.md). The artefact has progressed through **six DSRM iterations**:

- **Iteration 1** — UI Prototype: React SPA with mock data, all 4 roles, complete workflow UI
- **Iteration 2** — Firebase Migration: Persistent data, real authentication, real-time subscriptions
- **Iteration 3** — Document Review + Notifications: Annotation engine, version control, email integration, cleanup
- **Iteration 4** — Help System + Theming + Docs: Guided tours, Help & Docs page, dark/light mode, spec comparison
- **Iteration 5** — Dynamic Form System: 20 prebuilt HD templates, DynamicFormRenderer (15 field types), Admin Form Builder with drag-and-drop, header/footer visual editor, fullscreen preview, DOCX export
- **Iteration 6** — Notification Wiring + External Users: Complete email wiring (11/13 functions active), UserPicker component, external/examiner role support (6 roles), persistent notification alert banners, UI consistency fixes

### Design Science Iteration

| Iteration | Focus | Key Deliverable |
|-----------|-------|-----------------|
| 1 | UI Prototype | React SPA with mock data, all 4 roles, complete workflow UI |
| 2 | Firebase Migration | Persistent data, real authentication, real-time subscriptions |
| 3 | Document Review + Notifications | Annotation engine, version control, email integration, cleanup |
| 4 | Help System + Theming + Docs | Guided tours, Help & Docs page, dark/light mode, spec comparison |
| 5 | Dynamic Forms + Form Builder | 20 templates, 15 field types, visual editor, header/footer customisation |
| 6 | External Users + Alerts | 6-role system, UserPicker, persistent alerts, full email wiring |

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

---

---

# Iteration 5 — Dynamic Form System, Form Builder, Header/Footer Editor & Fullscreen Preview

> **Date**: February 2026  
> **Scope**: 20 prebuilt HD request templates, dynamic form renderer, admin Form Builder with drag-and-drop, header/footer visual editor, fullscreen document preview, DOCX export service

---

## 20. Dynamic Form System

### 20.1 Problem Statement

The original system captured HD requests as flat metadata fields (type, description, file attachments). The functional specification references formal university forms (HDR-001 through HDR-020) with structured sections, signature blocks, weighted tables, and conditional fields. Students needed to fill these forms within the portal rather than using external tools.

### 20.2 Solution: Template-Driven Form Architecture

A schema-driven form system was built where each HD request type is defined by a JSON template stored in Firestore. Templates describe sections, fields, validation rules, conditional visibility, and layout properties.

**Firestore Collection: `formTemplates`**
```
formTemplates/{templateId}
├── templateId: string (e.g., 'hdr-001')
├── name: string (e.g., 'Annual Progress Report')
├── formCode: string (e.g., 'HDR-001')
├── description: string
├── category: string (e.g., 'progress', 'registration', 'examination')
├── academicLevel: string[] (e.g., ['masters', 'doctoral'])
├── estimatedTime: string (e.g., '20-30 min')
├── version: string (e.g., '2026.1')
├── status: 'active' | 'draft' | 'archived'
├── layout: {
│   header: { logoUrl, lines[], formTitle, formCode }    // legacy flat header
│   headerConfig: { elements[], bgColor, textColor, ... } // new element-based header
│   footerConfig: { elements[], bgColor, textColor, ... } // new element-based footer
│   spacing: string
│   pageSize: string
│   printReady: boolean
│   }
├── sections: [{
│   id, title, description, collapsible, locked, lockedMessage,
│   condition: { field, operator, value },
│   fields: [{
│       id, type, label, required, placeholder, helpText, options[],
│       colSpan, autoPopulate, condition, rows, columns, weightKey,
│       signerRole, signerLabel, dateLabel
│   }]
│   }]
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

### 20.3 Prebuilt Templates

20 prebuilt templates were defined in `src/firebase/prebuiltTemplates.js` (~1,289 lines), corresponding to every official UWC HD form:

| Template ID | Form Code | Name | Sections | Fields |
|-------------|-----------|------|----------|--------|
| hdr-001 | HDR-001 | Annual Progress Report | 6 | 15+ |
| hdr-002 | HDR-002 | Research Proposal Approval | 5 | 12+ |
| hdr-003 | HDR-003 | Extension of Registration | 5 | 10+ |
| hdr-004 | HDR-004 | Ethics Clearance Application | 6 | 14+ |
| hdr-005 | HDR-005 | Change of Thesis Title | 4 | 8+ |
| hdr-006 | HDR-006 | Examiner Nomination | 5 | 12+ |
| hdr-007 | HDR-007 | Leave of Absence | 4 | 8+ |
| hdr-008 | HDR-008 | Change of Supervisor | 5 | 10+ |
| hdr-009 | HDR-009 | Withdrawal from Programme | 4 | 7+ |
| hdr-010 | HDR-010 | Re-admission Application | 5 | 10+ |
| hdr-011 | HDR-011 | Title Registration | 4 | 9+ |
| hdr-012 | HDR-012 | Interim Progress Report | 5 | 11+ |
| hdr-013 | HDR-013 | Funding Application | 5 | 11+ |
| hdr-014 | HDR-014 | Conference Attendance | 4 | 9+ |
| hdr-015 | HDR-015 | Publication Declaration | 4 | 8+ |
| hdr-016 | HDR-016 | Upgrade Masters to PhD | 5 | 12+ |
| hdr-017 | HDR-017 | Downgrade PhD to Masters | 5 | 11+ |
| hdr-018 | HDR-018 | Thesis Submission Intention | 4 | 8+ |
| hdr-019 | HDR-019 | External Examiner Report Response | 4 | 9+ |
| hdr-020 | HDR-020 | Graduation Clearance | 5 | 10+ |

All templates share the `UWC_HEADER` constant for consistent institutional branding (UWC logo, university/faculty/department lines, form title and code).

### 20.4 Field Types

The form system supports 15 field types, each rendered by `FormFieldRenderer.jsx`:

| Type | Description | Special Properties |
|------|-------------|-------------------|
| `text` | Single-line text input | `autoPopulate` (studentName, studentNumber, etc.) |
| `textarea` | Multi-line text area | — |
| `select` | Dropdown select | `options[]` |
| `radio` | Radio button group | `options[]` |
| `checkbox` | Checkbox group | `options[]` |
| `date` | Date picker | — |
| `email` | Email input with validation | — |
| `tel` | Phone number input | — |
| `number` | Numeric input | — |
| `file` | File upload zone | — |
| `keywords` | Tag input for keywords | Uses `KeywordsTagInput` component |
| `table` | Data table | `columns[]` |
| `weighted-table` | Assessment table with scores | `rows[]`, `columns[]`, `weightKey` |
| `repeater-group` | Repeatable field group | `fields[]` (nested field definitions) |
| `signature` | Digital signature block | `signerRole`, `signerLabel`, `dateLabel` |

### 20.5 Key Components

| Component | Lines | Purpose |
|-----------|-------|---------|
| `DynamicFormRenderer.jsx` | ~450 | Master renderer: document header/footer, sections, field delegation, conditional visibility, auto-population, locked sections |
| `FormFieldRenderer.jsx` | ~300 | Field-type dispatcher: renders the correct input/control based on `field.type` |
| `FormSignatureBlock.jsx` | ~120 | Signature capture (draw/type) with SignaturePad integration |
| `KeywordsTagInput.jsx` | ~80 | Tag-style input for keyword/tag fields |
| `WeightedTableField.jsx` | ~150 | Assessment table with weighted scoring and auto-total |
| `RepeaterGroupField.jsx` | ~100 | Dynamic add/remove repeatable field groups |
| `LockedSectionOverlay.jsx` | ~40 | Visual overlay for locked sections with lock icon and message |

### 20.6 Conditional Logic

Fields and sections support conditional visibility:

```javascript
// Section-level condition
{ condition: { field: 'registrationType', operator: 'equals', value: 'doctoral' } }

// Field-level condition
{ condition: { field: 'hasCoSupervisor', operator: 'equals', value: 'yes' } }
```

The `evaluateCondition(condition, formData)` function (exported from `DynamicFormRenderer`) is used by both the renderer and external consumers.

### 20.7 Auto-Population

Fields with `autoPopulate` are automatically filled from the authenticated user context:

| Key | Source |
|-----|--------|
| `studentName` | `currentUser.displayName` |
| `studentNumber` | `currentUser.studentNumber` or user profile |
| `email` | `currentUser.email` |
| `faculty` | User profile `faculty` field |
| `department` | User profile `department` field |
| `programme` | User profile `programme` field |
| `currentDate` | Formatted current date |

---

## 21. Admin Form Builder

### 21.1 Problem Statement

Admins needed the ability to customise form templates without editing code. Adding/removing fields, reordering sections, and adjusting template metadata should be possible through a visual interface.

### 21.2 Solution: FormBuilderPage

A full-screen builder (`FormBuilderPage.jsx`, ~900+ lines) accessible at `/form-builder` with three-panel layout:

```
┌─────────────────────────────────────────────────────────┐
│ Top Toolbar: Save/Discard/Seed/Preview/Exit             │
├──────────┬──────────────────────────┬───────────────────┤
│ Template │ Editor Panel             │ Live Preview      │
│ List     │                          │                   │
│          │ Tabs: Sections | Header  │ (DynamicForm      │
│ (search  │        | Footer          │  Renderer)        │
│  filter) │                          │                   │
│          │ ┌──────────────────────┐ │                   │
│          │ │ Section cards with   │ │                   │
│          │ │ drag-drop reorder,   │ │                   │
│          │ │ field editors,       │ │                   │
│          │ │ condition editors    │ │                   │
│          │ └──────────────────────┘ │                   │
└──────────┴──────────────────────────┴───────────────────┘
```

**Features:**
- Template CRUD with auto-save (3-second debounce)
- Drag-and-drop section reordering
- Field CRUD within sections (add, edit, duplicate, remove, reorder)
- Template metadata editing (name, code, category, academic level, estimated time, version, status)
- Live preview panel using `DynamicFormRenderer`
- Fullscreen preview popup with fullscreen modal
- Seed All Templates button (loads all 20 prebuilt templates to Firestore)
- Professional toolbar with HiOutline* Heroicon icons
- 3-tab editor: Sections & Fields, Header, Footer

### 21.3 Form Template CRUD

`src/firebase/formTemplates.js` (~363 lines) provides:

| Function | Purpose |
|----------|---------|
| `getFormTemplates()` | Fetch all templates, ordered by `formCode` |
| `getFormTemplate(id)` | Get single template by ID |
| `createFormTemplate(data)` | Create new template (auto-generates ID) |
| `updateFormTemplate(id, updates)` | Partial update (supports nested dot-paths) |
| `deleteFormTemplate(id)` | Delete template |
| `setFormTemplate(id, data)` | Set template with specific ID (for seeding) |
| `subscribeToFormTemplates(callback)` | Real-time `onSnapshot` subscription |
| `submitFormResponse(response)` | Submit filled form response to `formSubmissions` collection |
| `getFormSubmissions(templateId)` | Fetch submissions for a template |
| `subscribeToFormSubmissions(callback)` | Real-time submissions subscription |

---

## 22. Header/Footer Visual Editor

### 22.1 Problem Statement

All 20 form templates shared the same hardcoded UWC header with no visual footer. Admins needed the ability to fully customise document headers and footers — adding images, text labels, dates, titles, and separator lines — and apply consistent branding across all templates at once.

### 22.2 Solution: Element-Based Schema

A new element-based schema replaces the flat header structure, stored as `layout.headerConfig` and `layout.footerConfig` in each template:

```javascript
{
  headerConfig: {
    elements: [
      { type: 'image', src: '/uwc_logo.svg', alt: 'UWC', height: 60, align: 'center', opacity: 1 },
      { type: 'text', content: 'University of the Western Cape', fontSize: 14, fontWeight: '700', align: 'center', letterSpacing: 1, uppercase: true, color: '' },
      { type: 'separator' },
      { type: 'title' },    // auto-renders template formTitle
      { type: 'label' },    // auto-renders template formCode
      { type: 'date', format: 'MMMM yyyy' }
    ],
    bgColor: '#003366',     // UWC Navy
    textColor: '#ffffff',
    padding: 24,
    showAccentBar: true,
    accentColor: '#C5A55A'  // UWC Gold
  },
  footerConfig: {
    elements: [
      { type: 'separator' },
      { type: 'text', content: 'University of the Western Cape – Postgraduate Administration', fontSize: 10, align: 'center' },
      { type: 'text', content: 'Private Bag X17, Bellville, 7535, South Africa', fontSize: 9, align: 'center' },
      { type: 'date', format: 'dd MMMM yyyy' }
    ],
    bgColor: '#f8f9fa',
    textColor: '#6c757d',
    padding: 16,
    showAccentBar: false,
    accentColor: '#C5A55A'
  }
}
```

### 22.3 Element Types

| Type | Properties | Rendering |
|------|------------|-----------|
| `image` | `src`, `alt`, `height`, `align`, `opacity` | `<img>` with configurable styles; supports base64 data URLs from upload |
| `text` | `content`, `fontSize`, `fontWeight`, `align`, `letterSpacing`, `uppercase`, `color` | `<div>` with inline styles |
| `title` | (inherits from template `formTitle`) | Bold title text from the current template |
| `label` | (inherits from template `formCode`) | Code/label text with muted styling |
| `date` | `format` | Formatted current date (supports `MMMM yyyy`, `dd/MM/yyyy`, etc.) |
| `separator` | — | Styled `<hr>` divider |

### 22.4 HeaderFooterEditor Component

`HeaderFooterEditor.jsx` (~320 lines) provides a full visual editor:

- **Element list** — drag cards to reorder, click to expand property editor
- **Add element toolbar** — 6 buttons to add each element type
- **Per-element property editor** — font size, weight, alignment, opacity, letter spacing, uppercase toggle, colour picker, image upload
- **Global settings** — background colour, text colour, padding slider, accent bar toggle and colour
- **Live preview** — `HeaderFooterPreview` sub-component renders elements with exact inline styles
- **Image upload** — FileReader converts images to base64 data URLs for embedding
- **Apply to All Templates** — button triggers batch Firestore update across all templates
- **Reset to Default** — restores UWC-branded default header/footer

### 22.5 Backward Compatibility

`DynamicFormRenderer.jsx` was updated with dual-schema support:

```
DocumentHeader rendering logic:
  1. If layout.headerConfig exists → render element-based header (new system)
  2. Else if layout.header exists → render legacy flat header (logoUrl, lines[])
  3. Else → render nothing
```

This ensures all 20 existing templates continue to render correctly until their headerConfig is added via the editor.

### 22.6 Apply to All Templates

The `handleApplyToAll(zone)` function in FormBuilderPage:
1. Reads current headerConfig or footerConfig from the editing template
2. Iterates all templates in the DataContext
3. Calls `updateFormTemplate(id, { 'layout.headerConfig': config })` for each
4. Uses Firestore dot-path notation for nested field updates
5. Shows success/error toast on completion

---

## 23. Fullscreen Document Preview

### 23.1 Problem Statement

Form fill modals and the Form Builder preview panel were constrained to their container sizes, making it difficult to review forms at full document scale.

### 23.2 Solution: Fullscreen Modal Enhancement

The shared `Modal` component (`src/components/common/index.jsx`) was enhanced with:

- `fullscreen` prop — when true, applies `modal-fullscreen` CSS (100vw × 100vh, no border-radius)
- `onToggleFullscreen` prop — renders an expand/collapse toggle button in the modal header
- `modal-header-actions` wrapper for consistent button layout

**Integration points:**

| Location | Component | State Variable | Effect |
|----------|-----------|----------------|--------|
| HD Requests Page | Form Fill Modal | `formFullscreen` | Toggles form fill modal between normal and fullscreen |
| Form Builder Page | Preview Popup | `showPreviewFullscreen` | Opens DynamicFormRenderer in a fullscreen modal overlay |

---

## 24. DOCX Export Service

A client-side DOCX export service was implemented to allow filled forms to be downloaded as Microsoft Word documents. The service uses the `docx` library to generate structured documents with:

- UWC-branded header (logo, university name, form title)
- Section headings mapped to Word heading styles
- Field values rendered as label-value pairs
- Table fields rendered as Word tables
- Signature blocks with placeholder text

---

## 25. Iteration 5 — File Inventory

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/forms/DynamicFormRenderer.jsx` | ~450 | Master form renderer with section/field delegation, conditional logic, auto-population, header/footer |
| `src/components/forms/FormFieldRenderer.jsx` | ~300 | Field-type dispatcher (15 field types) |
| `src/components/forms/FormSignatureBlock.jsx` | ~120 | Digital signature capture with draw/type modes |
| `src/components/forms/KeywordsTagInput.jsx` | ~80 | Tag input for keyword fields |
| `src/components/forms/WeightedTableField.jsx` | ~150 | Weighted assessment table with scoring |
| `src/components/forms/RepeaterGroupField.jsx` | ~100 | Dynamic repeatable field groups |
| `src/components/forms/LockedSectionOverlay.jsx` | ~40 | Locked section visual overlay |
| `src/components/forms/HeaderFooterEditor.jsx` | ~320 | Visual header/footer designer with element CRUD, drag-drop, image upload, live preview |
| `src/components/forms/HeaderFooterEditor.css` | ~290 | Header/footer editor styles |
| `src/components/forms/document-form.css` | ~400 | Form fill document styling (print-ready, sections, fields, signatures, footer) |
| `src/components/forms/index.js` | ~10 | Forms barrel export |
| `src/firebase/formTemplates.js` | ~363 | Firestore CRUD for templates and submissions |
| `src/firebase/prebuiltTemplates.js` | ~1,289 | 20 prebuilt template definitions |
| `src/pages/FormBuilderPage.jsx` | ~900+ | Full-screen admin form builder with 3-panel layout, 3-tab editor |
| `src/pages/FormBuilderPage.css` | ~350 | Form builder full-screen layout styles |
| `src/services/docxExportService.js` | ~200 | Client-side DOCX generation from filled forms |
| `scripts/seed-form-templates.mjs` | ~50 | Seed script for loading prebuilt templates to Firestore |

### Files Modified

| File | Change |
|------|--------|
| `src/App.jsx` | Added `/form-builder` route (outside Layout for full-screen), FormBuilderPage import |
| `src/components/layout/Sidebar.jsx` | Added "Form Builder" nav item for admin role |
| `src/context/DataContext.jsx` | Added `formTemplates` real-time subscription, exposed template/submission CRUD |
| `src/pages/HDRequestsPage.jsx` | Integrated DynamicFormRenderer for form fill, fullscreen toggle, form submission workflow |
| `src/components/common/index.jsx` | Modal: added `fullscreen`, `onToggleFullscreen` props, header actions wrapper |
| `src/components/common/common.css` | Added fullscreen modal styles (`modal-fullscreen`, `modal-overlay-fullscreen`) |
| `src/components/forms/DynamicFormRenderer.jsx` | Added element-based header/footer rendering, dual-schema backward compatibility |
| `src/components/forms/document-form.css` | Added footer styles |
| `src/pages/FormBuilderPage.jsx` | Added header/footer editor tabs, Apply to All, fullscreen preview |
| `src/pages/FormBuilderPage.css` | Added editor tab styles |

### Build Metrics

| Metric | Before (Iteration 4) | After (Iteration 5) |
|--------|----------------------|----------------------|
| Production build modules | 717 | 732 |
| Source files | ~57 | ~74 |
| Prebuilt form templates | 0 | 20 |
| Field types supported | 0 | 15 |
| Form component files | 0 | 11 |
| Firestore collections | 9 | 11 (+ formTemplates, formSubmissions) |

---

## 26. Design Science Alignment (Iteration 5)

| DSRM Phase | Activity |
|------------|----------|
| **Problem Identification** | HD request forms were captured as flat metadata; no structured, university-standard form filling existed. Admins had no visual template management tool. Headers/footers were not customisable. |
| **Objective Definition** | Enable structured form completion for all 20 HD request types within the portal; provide admin-facing template management with visual editing; support consistent institutional branding across all documents |
| **Design & Development** | This section documents the construction of the dynamic form system (renderer, field components, template CRUD), the Form Builder (full-screen visual editor), and the header/footer customisation engine |
| **Demonstration** | 20 prebuilt templates enable immediate form filling across all HD request types; Form Builder enables real-time template customisation; header/footer editor shows branding propagation across all templates |
| **Evaluation** | The system enables: (1) student usability testing with real university forms, (2) admin workflow evaluation through template management, (3) institutional compliance assessment through branding controls |

### Updated Artefact Quality Metrics

| Metric | Value |
|--------|-------|
| Production build modules | 732 |
| Firestore collections | 11 |
| Demo users | 7 (across 4 roles) |
| Sample documents | 19 (PDF, DOCX, XLSX) |
| Prebuilt form templates | 20 |
| Form field types | 15 |
| Notification trigger points | 13 distinct actions |
| Total source files | ~74 |
| Lines of CSS | ~4,000+ |
| Guided tour definitions | 13 |

---

*Document updated as part of the PostGrad Portal Design Science Research artefact development (Iteration 5).*

---

---

# Iteration 6 — Notification Wiring, UserPicker, External Users, Alerts & Nudges

> **Date**: February 2026  
> **Scope**: Complete email notification wiring, reusable UserPicker component, external user/examiner role support, persistent notification alert banners, workflow fixes, UI consistency

---

## 27. Email Notification Wiring

### 27.1 Problem Statement

The `emailService.js` module contained 13 email functions (core `sendEmail` + 12 convenience helpers), but only a subset were actually called from the application. Five key functions — `sendSectionHandoffEmail`, `sendSectionReferBackEmail`, `sendFormCompletionEmail`, `sendEscalationEmail`, and `sendDeadlineReminderEmail` — were defined but never imported or triggered. This meant that several important workflow transitions produced in-app notifications but no email delivery.

### 27.2 Solution

All five unused email functions were imported into `HDRequestsPage.jsx` and wired to the appropriate workflow trigger points:

| Email Function | Trigger Point | Recipients |
|----------------|--------------|------------|
| `sendSectionHandoffEmail` | Co-supervisor signs off | Coordinator + Student |
| `sendSectionReferBackEmail` | Coordinator refers back via supervisor | Supervisor |
| `sendFormCompletionEmail` | Student submits a new form | Supervisor |
| `sendEscalationEmail` | Request forwarded to Faculty Board | Student + Admin |
| `sendRequestSubmittedEmail` | (already wired) | Supervisor |
| `sendRequestApprovedEmail` | (already wired) | Student + Coordinator |
| `sendReferredBackEmail` | (already wired) | Student |
| `sendFinalApprovalEmail` | (already wired) | Student |
| `sendNudgeEmail` | (already wired) | Student |

### 27.3 Complete Email Coverage Table

| Workflow Action | In-App Notification | Email Notification | Email Function |
|----------------|--------------------|--------------------|----------------|
| Student submits to supervisor | ✅ | ✅ | `sendFormCompletionEmail` + `sendRequestSubmittedEmail` |
| Supervisor approves | ✅ | ✅ | `sendRequestApprovedEmail` |
| Supervisor refers back | ✅ | ✅ | `sendReferredBackEmail` |
| Co-supervisor signs → coordinator | ✅ | ✅ | `sendSectionHandoffEmail` |
| Coordinator refers back → supervisor | ✅ | ✅ | `sendSectionReferBackEmail` |
| Coordinator forwards to Faculty Board | ✅ | ✅ | `sendEscalationEmail` |
| FHD outcome recorded | ✅ | ✅ | `sendFinalApprovalEmail` (or `sendReferredBackEmail` on referral) |
| Supervisor nudges student | ✅ | ✅ | `sendNudgeEmail` |
| Comment on document version | ✅ | ✅ | `sendEmail` (generic) |
| Annotations batch sent | ✅ | ✅ | `sendEmail` (generic) |

**Remaining unused functions** (reserved for future server-side automation):
- `sendDeadlineReminderEmail` — requires scheduled trigger (Firebase Cloud Functions)
- `sendLinkedFormRequiredEmail` — for future linked form chain feature

---

## 28. UserPicker Component

### 28.1 Problem Statement

When supervisors forward requests or coordinators assign reviewers, the system previously used hard-coded user IDs (`'supervisor-001'`, `'coordinator-001'`). This created a brittle dependency and prevented dynamic user selection within the workflow.

### 28.2 Solution: Reusable UserPicker Modal

A new reusable component (`src/components/common/UserPicker.jsx`, ~196 lines) provides a searchable, filterable user selection modal.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | — | Controls modal visibility |
| `onClose` | fn() | — | Close handler |
| `onSelect` | fn(user) | — | Called when a user is picked |
| `users` | array | `[]` | User objects `{ id, name, email, role, department }` |
| `title` | string | `'Select User'` | Modal title |
| `roleFilter` | string[] | `null` | Restrict to specific roles |
| `excludeIds` | string[] | `[]` | User IDs to exclude from the list |
| `selectedId` | string | `null` | Currently selected user ID (highlighted) |

**Features:**
- **Search** — filters by name, email, or department (case-insensitive)
- **Role filter chips** — clickable role badges to narrow by role, dynamically generated from the user list
- **Avatar display** — shows user initials/avatar, full name, email, department, and role badge
- **Selected highlight** — green check + border on the currently selected user
- **Empty state** — friendly message when no users match the current filter

### 28.3 Integration in HDRequestsPage

The HD Requests page now includes a **supervisor/coordinator selection bar** at the top of the form fill modal:

```
┌─────────────────────────────────────────────────────┐
│ Supervisor: [Prof. Sarah van der Berg] [Change]     │
│ Coordinator: [Dr. Fatima Patel]       [Change]      │
├─────────────────────────────────────────────────────┤
│ Form content (DynamicFormRenderer)                   │
└─────────────────────────────────────────────────────┘
```

- **Supervisor selection** — defaults to `profile.supervisorId`; clicking "Change" opens UserPicker filtered to `['supervisor']`
- **Coordinator selection** — auto-detected from the users collection; clicking "Change" opens UserPicker filtered to `['coordinator']`
- Submission is **blocked** with an alert if no supervisor is selected
- Selected user IDs are stored with the request as `supervisorId` and `coordinatorId`

---

## 29. External User & Examiner Role Support

### 29.1 Problem Statement

The system originally supported four roles: student, supervisor, coordinator, and admin. University workflows involve additional participants — external examiners who review theses and external users who may contribute to specific forms.

### 29.2 Solution: Six-Role System

Two new roles were added: `external` and `examiner`.

**Constants updates** (`src/utils/constants.js`):

```javascript
export const ROLE_LABELS = {
  student: 'Student',
  supervisor: 'Supervisor',
  coordinator: 'Coordinator',
  admin: 'Administrator',
  external: 'External User',    // NEW
  examiner: 'Examiner',         // NEW
};

export const CREATABLE_ROLES = {
  student: 'Student',
  supervisor: 'Supervisor',
  coordinator: 'Coordinator',
  admin: 'Administrator',
  external: 'External User',    // NEW
  examiner: 'Examiner',         // NEW
};
```

### 29.3 Role Management Page Updates

`RoleManagementPage.jsx` was enhanced to support the new roles:

- **Create user form** — includes all 6 roles in the role dropdown (from `CREATABLE_ROLES`)
- **Organisation field** — conditional input shown when role is `external` or `examiner`, allows recording the user's institution or organisation
- **Firestore user document** — external/examiner users are stored with `isExternal: true` and `organization: '...'`
- **Role badge styling** — external users shown with "(Ext)" suffix and teal badge colour
- **Filter chips** — all 6 roles available as filter options in the user list

### 29.4 Navigation & Dashboard Integration

| Component | Change |
|-----------|--------|
| `Sidebar.jsx` | Added `external` nav items: Dashboard, My Forms, Settings, Help |
| `Sidebar.jsx` | Added `examiner` nav items: Dashboard, Review Requests, Settings, Help |
| `Dashboard.jsx` | `external` role → uses StudentDashboard; `examiner` role → uses SupervisorDashboard |
| `HDRequestsPage.jsx` | External/examiner users see requests where `currentOwner === user.id` or `examinerId === user.id` |
| `HDRequestsPage.jsx` | "New Form" button shown for external/examiner roles |

### 29.5 Section Roles

The `SECTION_ROLE_COLORS` constant in `constants.js` defines 6 section-level roles for the dynamic form system:

| Section Role | Colour Theme | Purpose |
|-------------|-------------|---------|
| `student` | Info (blue) | Sections filled by the student |
| `supervisor` | Purple | Sections filled by the supervisor |
| `co_supervisor` | Indigo | Sections filled by the co-supervisor |
| `coordinator` | Orange | Sections filled by the coordinator |
| `admin` | Danger (red) | Sections requiring admin completion |
| `examiner` | Teal | Sections filled by an external examiner |

---

## 30. Persistent Notification Alerts

### 30.1 Problem Statement

In-app notifications in the header bell dropdown are easy to miss. Critical actions (overdue requests, approaching deadlines, referred-back items) needed prominent, persistent visibility on the main workspace.

### 30.2 Solution: NotificationAlerts Component

A new component (`src/components/common/NotificationAlerts.jsx`, ~202 lines) renders persistent, colour-coded alert banners above page content.

**Alert Types:**

| Alert | Trigger Condition | Severity | Icon |
|-------|-------------------|----------|------|
| Overdue Request | Timer expired, request owned by current user | Danger (red) | ExclamationTriangle |
| Deadline Approaching | < 6 hours remaining on timer, owned by user | Warning (amber) | Clock |
| Action Required | Request in `referred_back` status, owned by user | Info (blue) | BellAlert |
| Incomplete Draft | Student's draft older than 3 days (72h) | Info (blue) | BellAlert |
| Pending Review | Request in `submitted_to_supervisor` / `supervisor_review`, assigned to user as supervisor | Info (blue) | BellAlert |

**Features:**
- **Colour-coded severity** — danger (red border + background), warning (amber), info (blue); uses design token CSS variables
- **Dismissible per-request** — clicking ✕ dismisses alerts for that specific request ID (session-only, reappears on reload)
- **Maximum 5 shown** — remaining alerts counted and shown as "+ N more alerts"
- **Navigation button** — "View" button navigates to `/requests` page
- **Zero-state** — component returns `null` when no alerts exist (no empty space)
- **Real-time** — recalculates from `mockHDRequests` whenever data changes

### 30.3 Integration Points

| Page | Location | Purpose |
|------|----------|---------|
| `Dashboard.jsx` | Above role-specific dashboard | All roles see alerts on their personalised dashboard |
| `HDRequestsPage.jsx` | Above request list | Contextual reminders while browsing requests |

---

## 31. DataContext Enhancement: getUsersByRole

### 31.1 Problem Statement

Multiple components needed to query users by role (e.g., get all supervisors for the UserPicker). Without a centralised helper, each component would need to filter the users array independently.

### 31.2 Solution

A new `getUsersByRole(...roles)` callback was added to `DataContext.jsx`:

```javascript
const getUsersByRole = useCallback(
  (...roles) => mockUsers.filter(u => roles.includes(u.role)),
  [mockUsers]
);
```

- Accepts one or more role strings: `getUsersByRole('supervisor')`, `getUsersByRole('supervisor', 'coordinator')`
- Returns an array of user objects matching any of the specified roles
- Memoised with `useCallback` to prevent unnecessary re-renders
- Exposed in the DataContext value and added to the `useMemo` dependency array

---

## 32. UI Consistency Fixes

### 32.1 FormBuilder Modal Size Prop

The header/footer editor modals in `FormBuilderPage.jsx` were using `size="lg"` — which is not a valid prop value for the custom `Modal` component. The correct values are `small`, `large`, or `default`. Updated both header and footer editor modals to `size="large"`.

---

## 33. Iteration 6 — File Inventory

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/common/UserPicker.jsx` | ~196 | Reusable user selection modal with search, role filter chips, avatar display |
| `src/components/common/NotificationAlerts.jsx` | ~202 | Persistent alert banners for overdue, deadline, referred-back, draft, pending review |

### Files Modified

| File | Change |
|------|--------|
| `src/utils/constants.js` | Added `external`/`examiner` to `ROLE_LABELS`; added `CREATABLE_ROLES` export |
| `src/pages/RoleManagementPage.jsx` | 6 roles, organisation field for external/examiner, `isExternal` flag, teal badges |
| `src/pages/HDRequestsPage.jsx` | Imported 5 email functions + UserPicker + NotificationAlerts; supervisor/coordinator picker bar; dynamic user IDs; external/examiner visibility |
| `src/context/DataContext.jsx` | Added `getUsersByRole()` callback helper; exposed in context value |
| `src/pages/Dashboard.jsx` | Added NotificationAlerts, `useNavigate` import, external/examiner dashboard routing |
| `src/components/layout/Sidebar.jsx` | Added external/examiner nav items (Dashboard, Forms, Review, Settings, Help) |
| `src/pages/FormBuilderPage.jsx` | Fixed `size="lg"` → `size="large"` on header/footer editor modals |

### Build Metrics

| Metric | Before (Iteration 5) | After (Iteration 6) |
|--------|----------------------|----------------------|
| Production build modules | 732 | 734 |
| Source files | ~74 | ~76 |
| User roles (auth) | 4 | 6 |
| Section roles (forms) | 4 | 6 |
| Email functions wired | 8 | 11 (+ 2 reserved for automation) |
| New reusable components | 0 | 2 (UserPicker, NotificationAlerts) |

---

## 34. Design Science Alignment (Iteration 6)

| DSRM Phase | Activity |
|------------|----------|
| **Problem Identification** | Incomplete email notification coverage, hard-coded user IDs, no external user support, lack of persistent action visibility |
| **Objective Definition** | Wire all email functions to workflow triggers, introduce dynamic user selection, add 2 new roles with full navigation support, surface urgent actions as persistent alerts |
| **Design & Development** | This section documents 2 new components (UserPicker, NotificationAlerts), 5 email wiring points, 2 new roles with 6-file integration, and UI fixes |
| **Demonstration** | All cross-user actions now trigger both in-app + email notifications; UserPicker enables realistic user selection; alerts surface overdue/deadline actions visually |
| **Evaluation** | Complete notification audit shows 100% coverage of cross-user workflow actions; 6-role system supports full university organisational structure |

### Updated Artefact Quality Metrics

| Metric | Value |
|--------|-------|
| Production build modules | 734 |
| Firestore collections | 11 |
| Demo users | 7 (across 4 base roles; 6 role types supported) |
| Sample documents | 19 (PDF, DOCX, XLSX) |
| Prebuilt form templates | 20 |
| Form field types | 15 |
| User roles (authentication) | 6 |
| Section roles (forms) | 6 |
| Notification trigger points | 13 distinct actions |
| Email functions (wired) | 11 of 13 (2 reserved for scheduled automation) |
| Alert types | 5 (overdue, deadline, action required, draft, pending review) |
| Total source files | ~76 |
| Lines of CSS | ~4,000+ |
| Guided tour definitions | 13 |

---

*Document updated as part of the PostGrad Portal Design Science Research artefact development (Iteration 6).*

---

## References & Sources

The technical decisions, library selections, architecture patterns, and implementation details documented in this changelog were informed by the following sources:

### Primary Source

1. **Functional Specification** — *Postgraduate Request Portal – Functional Specification*, Faculty of Natural Sciences, University of the Western Cape, 2026. (Internal project document guiding all feature implementation decisions across Iterations 1–5.)

### Research Methodology

2. **Peffers, K., Tuunanen, T., Rothenberger, M.A. and Chatterjee, S.** (2007). *A Design Science Research Methodology for Information Systems Research*. Journal of Management Information Systems, 24(3), pp.45–77. DOI: [10.2753/MIS0742-1222240302](https://doi.org/10.2753/MIS0742-1222240302). (DSRM framework structuring the five iterative development cycles documented in this changelog.)
3. **Hevner, A.R., March, S.T., Park, J. and Ram, S.** (2004). *Design Science in Information Systems Research*. MIS Quarterly, 28(1), pp.75–105. DOI: [10.2307/25148625](https://doi.org/10.2307/25148625). (Design science guidelines informing artefact evaluation criteria.)

### Core Framework & Build Tools

4. **React Documentation** — React Team. *React Documentation*. Meta Platforms, Inc., 2024. Available at: [https://react.dev/](https://react.dev/). Accessed: February 2026. (React 19.2 — core UI framework.)
5. **Vite Documentation** — Evan You et al. *Vite: Next Generation Frontend Tooling*. 2024. Available at: [https://vite.dev/](https://vite.dev/). Accessed: February 2026. (Vite 7.3.1 — build tool and dev server.)
6. **React Router** — Remix Software, Inc. *React Router Documentation*. Available at: [https://reactrouter.com/](https://reactrouter.com/). Accessed: February 2026. (Client-side routing with role-based guards.)

### Firebase Platform

7. **Firebase Documentation** — Google. *Firebase Documentation*. Google LLC, 2024. Available at: [https://firebase.google.com/docs](https://firebase.google.com/docs). Accessed: February 2026. (Authentication, Cloud Firestore, Cloud Storage, Hosting, Security Rules, Emulator Suite.)
8. **Firebase Pricing** — Google. *Firebase Pricing*. Available at: [https://firebase.google.com/pricing](https://firebase.google.com/pricing). Accessed: February 2026. (Spark plan free tier quotas and Blaze plan pricing informing architecture decisions throughout all iterations.)
9. **Cloud Firestore Data Model** — Google. *Cloud Firestore Data Model*. Available at: [https://firebase.google.com/docs/firestore/data-model](https://firebase.google.com/docs/firestore/data-model). Accessed: February 2026. (Document/collection structure guiding the 11-collection data architecture.)

### Document Processing Libraries

10. **react-pdf** — Wojciech Maj. *react-pdf: Display PDFs in your React app*. npm, 2024. Available at: [https://www.npmjs.com/package/react-pdf](https://www.npmjs.com/package/react-pdf). Accessed: February 2026. (PDF viewing within the AnnotatedDocViewer and document review system.)
11. **PDF.js** — Mozilla. *PDF.js: A general-purpose, web standards-based platform for parsing and rendering PDFs*. Available at: [https://mozilla.github.io/pdf.js/](https://mozilla.github.io/pdf.js/). Accessed: February 2026. (Underlying rendering engine for react-pdf.)
12. **jsPDF** — James Hall et al. *jsPDF: Client-side JavaScript PDF generation*. Available at: [https://www.npmjs.com/package/jspdf](https://www.npmjs.com/package/jspdf). Accessed: February 2026. (Client-side PDF generation for form exports.)
13. **docx** — Dolan Miu. *docx: Easily generate and modify .docx files with JS/TS*. Available at: [https://www.npmjs.com/package/docx](https://www.npmjs.com/package/docx). Accessed: February 2026. (Client-side DOCX export service for institutional Word document generation.)
14. **ExcelJS** — ExcelJS Contributors. *ExcelJS: Excel Workbook Manager*. Available at: [https://www.npmjs.com/package/exceljs](https://www.npmjs.com/package/exceljs). Accessed: February 2026. (Excel file generation for analytics data export.)

### Communication & Notification

15. **EmailJS** — EmailJS. *Send Email Directly From Your Code*. Available at: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/). Accessed: February 2026. (Client-side email notification workaround for Firebase Spark plan limitation — no Cloud Functions available.)

### UI Libraries & Utilities

16. **react-icons** — React Icons Contributors. *react-icons: Popular icons in your React projects*. Available at: [https://react-icons.github.io/react-icons/](https://react-icons.github.io/react-icons/). (Heroicons, FontAwesome, and Material Design icon sets.)
17. **date-fns** — Sasha Koss et al. *date-fns: Modern JavaScript Date Utility Library*. Available at: [https://date-fns.org/](https://date-fns.org/). Accessed: February 2026. (Date formatting and manipulation throughout the portal.)
18. **react-big-calendar** — Jason Quense et al. *react-big-calendar*. Available at: [https://www.npmjs.com/package/react-big-calendar](https://www.npmjs.com/package/react-big-calendar). Accessed: February 2026. (Calendar view for milestone tracking.)
19. **react-beautiful-dnd** — Atlassian. *react-beautiful-dnd: Beautiful and accessible drag and drop for lists*. Available at: [https://www.npmjs.com/package/react-beautiful-dnd](https://www.npmjs.com/package/react-beautiful-dnd). Accessed: February 2026. (Drag-and-drop field reordering in Form Builder.)
20. **Recharts** — Recharts Contributors. *Recharts: A composable charting library built on React components*. Available at: [https://recharts.org/](https://recharts.org/). Accessed: February 2026. (Dashboard analytics visualisations.)
21. **html2canvas** — Niklas von Hertzen. *html2canvas: Screenshots with JavaScript*. Available at: [https://www.npmjs.com/package/html2canvas](https://www.npmjs.com/package/html2canvas). Accessed: February 2026. (DOM-to-canvas for PDF annotation overlays.)

### Deployment & Hosting

22. **Vercel** — Vercel Inc. *Vercel Documentation*. Available at: [https://vercel.com/docs](https://vercel.com/docs). Accessed: February 2026. (Deployment platform with SPA rewrite configuration via `vercel.json`.)

### Code Quality

23. **ESLint** — OpenJS Foundation. *ESLint: Find and fix problems in your JavaScript code*. Available at: [https://eslint.org/](https://eslint.org/). Accessed: February 2026.

### Legal & Compliance

24. **Protection of Personal Information Act (POPIA)** — Republic of South Africa. *Act No. 4 of 2013: Protection of Personal Information Act*. Government Gazette, Vol. 581, No. 37067, 26 November 2013. Available at: [https://www.gov.za/documents/protection-personal-information-act](https://www.gov.za/documents/protection-personal-information-act). Accessed: February 2026. (Data protection requirements informing security rules, audit logging, and data residency considerations.)
