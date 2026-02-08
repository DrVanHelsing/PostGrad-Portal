# PostGrad Portal – Firebase Migration Changelog

> **Project**: Postgraduate Request Portal  
> **Context**: Academic Research Project (Design Science Research Methodology)  
> **Date**: June 2025  
> **Scope**: Migration from in-memory mock data layer to Firebase (Authentication + Cloud Firestore)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design Rationale](#2-design-rationale)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Changes](#4-architecture-changes)
5. [Files Created](#5-files-created)
6. [Files Modified](#6-files-modified)
7. [Data Model](#7-data-model)
8. [Authentication Architecture](#8-authentication-architecture)
9. [Real-Time Data Architecture](#9-real-time-data-architecture)
10. [Seed Data & Demo Accounts](#10-seed-data--demo-accounts)
11. [Automation Scripts](#11-automation-scripts)
12. [Migration Decisions & Trade-Offs](#12-migration-decisions--trade-offs)
13. [Current Status & Remaining Work](#13-current-status--remaining-work)

---

## 1. Overview

The PostGrad Portal is a React-based university postgraduate administration system supporting four user roles: **Student**, **Supervisor**, **Coordinator**, and **Admin**. Prior to this migration, the application relied entirely on an in-memory mock data layer (`mockData.js`, ~627 lines) that simulated CRUD operations with JavaScript arrays and objects. Data was volatile — lost on every page refresh.

This changelog documents the **complete migration from mock data to Firebase**, introducing:

- **Firebase Authentication** (email/password) replacing simulated login
- **Cloud Firestore** replacing the in-memory data store with persistent, real-time data
- **Real-time subscriptions** (`onSnapshot`) so all connected clients receive live updates
- **Automation scripts** for repeatable provisioning and seeding

This migration constitutes a core **design science artefact iteration** — transforming a functional prototype into a production-capable system while preserving all existing UI behaviour.

---

## 2. Design Rationale

### 2.1 Why Firebase?

| Criterion | Rationale |
|-----------|-----------|
| **Serverless architecture** | No backend server required — the React SPA communicates directly with Firebase services, reducing infrastructure complexity for an academic project |
| **Real-time capability** | Firestore's `onSnapshot` listeners provide live data propagation — essential for multi-role collaboration (e.g., supervisor approves a request → student sees it immediately) |
| **Authentication as a service** | Firebase Auth handles credential storage, password hashing, rate limiting, and password reset — eliminating the need to implement security-sensitive features manually |
| **Rapid prototyping** | Firebase's client SDK allows direct integration without REST API boilerplate, accelerating the design-build-evaluate cycle central to Design Science Research |
| **Scalability** | Firestore is a managed NoSQL database that scales automatically, allowing the artefact to transition from prototype to production without re-architecture |
| **Academic suitability** | Free tier (Spark plan) provides sufficient resources for demonstration and evaluation phases |

### 2.2 Design Science Alignment

This migration follows the **Design Science Research Methodology (DSRM)** framework (Peffers et al., 2007):

- **Problem Identification**: The mock data layer prevented realistic evaluation — no persistence, no concurrency, no authentication
- **Objective Definition**: Enable persistent data, secure authentication, and real-time multi-user interaction
- **Design & Development**: This changelog documents the artefact construction phase
- **Demonstration**: The seeded demo accounts enable controlled demonstration with realistic workflows
- **Evaluation**: The live system enables usability testing, workflow validation, and performance measurement with real users

---

## 3. Technology Stack

### 3.1 Pre-Migration

| Layer | Technology |
|-------|-----------|
| Frontend | React 19.2.0, Vite, react-router-dom 6.30.3 |
| State | In-memory JavaScript objects (`mockData.js`) |
| Auth | Simulated (hardcoded credentials, instant login) |
| Persistence | None (data lost on refresh) |

### 3.2 Post-Migration

| Layer | Technology |
|-------|-----------|
| Frontend | React 19.2.0, Vite 7.3.1, react-router-dom 6.30.3 |
| State | Firestore real-time subscriptions via React Context |
| Auth | Firebase Authentication (email/password) |
| Persistence | Cloud Firestore (NoSQL document database) |
| SDK | Firebase JS SDK v12.9.0 |
| CLI | Firebase CLI v15.5.1 (project management & deployment) |

### 3.3 Dependencies Added

```json
{
  "firebase": "^12.9.0"
}
```

Installed via `npm install firebase` — adds the Firebase JS SDK as the sole new production dependency.

---

## 4. Architecture Changes

### 4.1 Before: Mock Data Architecture

```
App.jsx
├── AuthContext (simulated login/logout)
└── Pages
    ├── import { mockUsers, mockHDRequests, ... } from '../data/mockData'
    └── Direct array manipulation (push, filter, map)
```

- **No separation** between data access and UI logic
- **No persistence** — every refresh resets to hardcoded defaults
- **No authentication** — login accepted any matching email/password from the mock array
- **No real-time sync** — single-tab, single-user only

### 4.2 After: Firebase Architecture

```
App.jsx
├── BrowserRouter
│   └── AuthProvider (Firebase Auth + onAuthStateChanged)
│       └── DataProvider (Firestore onSnapshot subscriptions)
│           └── AppRoutes
│               ├── /login → LoginPage
│               ├── /seed → SeedPage (public)
│               └── /* → ProtectedRoute → Layout → Pages
│                   └── useData() hook (reads from DataContext)
```

- **AuthProvider** wraps the entire app; manages Firebase Auth state via `onAuthStateChanged`
- **DataProvider** subscribes to 7 Firestore collections; provides data + mutation functions
- **Pages** access data exclusively through the `useData()` hook — no direct Firestore imports
- **Real-time**: Firestore `onSnapshot` listeners push updates to all connected clients
- **Persistent**: All data survives page refreshes and browser restarts
- **Secure**: Firebase Auth enforces authentication; Firestore rules can enforce authorization

---

## 5. Files Created

### 5.1 `src/firebase/config.js`

**Purpose**: Firebase app initialization and service exports.

**Contents**:
- Imports `initializeApp`, `getAuth`, `getFirestore` from the Firebase SDK
- Defines the Firebase configuration object (API key, project ID, etc.)
- Initialises the Firebase app and exports `auth`, `db`, and `app` singletons

**Reasoning**: Centralises Firebase configuration in a single module. All other Firebase-consuming modules import from here, ensuring a single app instance (Firebase best practice — avoids duplicate initialisation errors).

---

### 5.2 `src/firebase/collections.js`

**Purpose**: Constants for Firestore collection names.

**Contents**:
```javascript
export const COLLECTIONS = {
  USERS: 'users',
  HD_REQUESTS: 'hdRequests',
  CALENDAR_EVENTS: 'calendarEvents',
  MILESTONES: 'milestones',
  NOTIFICATIONS: 'notifications',
  STUDENT_PROFILES: 'studentProfiles',
  AUDIT_LOGS: 'auditLogs',
};
```

**Reasoning**: Prevents typos in collection name strings scattered across the codebase. A single source of truth for collection names makes renaming collections a one-line change. This mirrors the constants pattern already used for roles in `utils/constants.js`.

---

### 5.3 `src/firebase/firestore.js` (~540 lines)

**Purpose**: Comprehensive Firestore CRUD service — the data access layer.

**Contents**:
- **Timestamp helpers**: `convertTimestamps()` (Firestore → JS Date) and `convertDates()` (JS Date → Firestore Timestamp) — recursive, handles nested objects and arrays
- **Real-time subscriptions**: `subscribeToCollection()` and `subscribeToUserNotifications()` — returns unsubscribe functions
- **User operations**: `getUserByEmail()`, `updateUserRole()`
- **HD Request workflow**: `createHDRequest()`, `submitToSupervisor()`, `validateAccessCode()`, `supervisorApprove()`, `coSupervisorSign()`, `referBack()`, `forwardToFHD()`, `recordFHDOutcome()`, `recordSHDOutcome()`, `resubmitRequest()`, `nudgeStudent()`
- **Calendar/Milestones**: `addCalendarEventDoc()`, `updateCalendarEventDoc()`, `deleteCalendarEventDoc()`, `addMilestoneDoc()`
- **Notifications**: `addNotificationDoc()`, `markNotificationsRead()`, `markNotificationRead()`
- **Student profiles**: `updateStudentProfile()`
- **Utilities**: `generateAccessCode()`, `exportToCSV()`, `downloadCSV()`
- **Audit logging**: Integrated into mutation functions — every write includes an audit log entry

**Reasoning**: This module mirrors the mock data API surface exactly. Every function that existed conceptually in `mockData.js` has a Firestore equivalent. This 1:1 mapping minimised changes in page components — they call the same logical operations, just backed by Firestore instead of in-memory arrays.

**Design decisions**:
- Mutations accept an `allUsers` parameter for audit log name resolution (resolving user IDs to display names at write time, not read time)
- All functions are `async` and return consistent result objects
- Timestamp conversion is handled at the service layer so pages work with plain JS Dates
- `writeBatch` is used for multi-document operations (seeding, bulk updates) to ensure atomicity

---

### 5.4 `src/context/DataContext.jsx` (~296 lines)

**Purpose**: React context that provides real-time Firestore data and mutation functions to all components.

**Contents**:
- Subscribes to all 7 Firestore collections via `onSnapshot` in a `useEffect` on mount
- User-specific notification subscription filtered by `userId`
- Wraps all `firestore.js` mutation functions with `useCallback` for stable references
- Provides query helper functions: `getRequestsByStudent()`, `getStudentProfile()`, `getStudentsByDepartment()`, etc.
- Exports data using `mock*` naming convention (see reasoning below)
- Exposes a `loading` state for initial data fetch
- Exports the `useData()` hook for page consumption

**Reasoning**: This context acts as the **single source of truth** for all application data. By centralising subscriptions here:
- Pages don't manage their own Firestore listeners (avoiding subscription leaks)
- Data is shared across all components (no redundant reads)
- The mutation API is uniform and accessible from any component
- Cleanup (unsubscribing) happens automatically when the provider unmounts

**Key design decision — `mock*` naming prefix**:
The context exports data as `mockUsers`, `mockHDRequests`, etc. — matching the original import names used throughout all 14 page components. This was a deliberate migration strategy:
```javascript
// Before (in pages):
import { mockUsers, mockHDRequests } from '../data/mockData';

// After (in pages):
const { mockUsers, mockHDRequests } = useData();
```
By keeping the same variable names, page-level destructuring required minimal changes. The `mock` prefix is a legacy naming artefact that can be renamed in a future refactoring pass.

---

### 5.5 `src/pages/SeedPage.jsx` (~360 lines)

**Purpose**: Admin utility page for populating Firestore with demo data and creating Firebase Auth users.

**Contents**:
- 7 user records with all profile fields
- HD request documents with full workflow state (draft, submitted, approved, etc.)
- Calendar events, milestones, student profiles, notifications, audit logs
- Creates Firebase Auth accounts via `createUserWithEmailAndPassword()`
- Seeds all 7 collections via `writeBatch()` for atomic writes
- "Check Data" button to verify collection document counts
- Progress feedback UI with status messages

**Reasoning**: A dedicated seed page was chosen over a CLI-only approach because:
1. It runs in the browser with the same Firebase SDK configuration — no duplicate config maintenance
2. It's accessible to non-technical users (evaluators, examiners) during demonstrations
3. It provides visual feedback during the seeding process
4. It integrates naturally into the SPA routing model
5. It can be easily restricted (e.g., to admin role only) in production

**Route**: `/seed` (public — no authentication required for initial setup)

---

### 5.6 `scripts/setup-firebase.mjs` (~435 lines)

**Purpose**: Automated Firebase project provisioning via Google Cloud REST APIs.

**Capabilities**:
- Retrieves OAuth tokens from the Firebase CLI's cached credentials
- Enables the Firestore API (`firestore.googleapis.com`)
- Attempts to create the Firestore `(default)` database (multiple API approaches)
- Configures Firestore security rules (test mode — open access)
- Enables Email/Password sign-in in Firebase Auth
- Checks for existing Auth users and Firestore data

**Reasoning**: Scripted provisioning ensures the Firebase project configuration is **repeatable and documented** — critical for Design Science Research where the artefact must be reproducible. The script replaces manual Firebase Console clicks with verifiable automated steps.

**Limitation**: Database creation requires GCP `datastore.databases.create` permission, which was unavailable under the university-managed Google Workspace account. This step must be performed manually in the Firebase Console.

---

### 5.7 `scripts/seed-firebase.mjs` (~347 lines)

**Purpose**: Node.js CLI script for seeding Firebase Auth users and Firestore collections.

**Capabilities**:
- Creates 7 Auth users with `createUserWithEmailAndPassword()`
- Seeds all 7 Firestore collections with demo data
- Checks for existing data before seeding (idempotent)
- Uses the Firebase client SDK (same config as the web app)

**Reasoning**: A CLI seed script complements `SeedPage.jsx` by enabling headless/automated seeding — useful for CI/CD pipelines, testing resets, or deployment automation. The script uses the client SDK (not Admin SDK) to avoid requiring service account credentials.

---

### 5.8 `scripts/test-firestore.mjs`

**Purpose**: Minimal Firestore connectivity test.

**Contents**: Attempts a single document write and read to verify Firestore is accessible.

**Reasoning**: Created to diagnose why the seed script was hanging — confirmed that the Firestore database had not yet been created (writes never resolve against a non-existent database).

---

## 6. Files Modified

### 6.1 `src/context/AuthContext.jsx` — Complete Rewrite

**Before**: Simulated authentication using hardcoded mock user lookup. Login was synchronous and accepted any matching email/password pair from `mockData.js`.

**After**: Full Firebase Authentication integration:
- `onAuthStateChanged()` listener establishes auth state on app load
- `signInWithEmailAndPassword()` for login
- `signOut()` for logout  
- `sendPasswordResetEmail()` for forgot-password functionality
- Firestore user profile lookup by email on successful auth
- Proper error handling with user-friendly messages (maps Firebase error codes to readable text)
- `authLoading` state prevents UI flash before auth state resolves

**Exports**: `user`, `firebaseUser`, `isAuthenticated`, `authLoading`, `login`, `logout`, `resetPassword`

**Reasoning**: The AuthContext was rewritten entirely because the authentication model fundamentally changed — from synchronous array lookup to asynchronous Firebase Auth. The `onAuthStateChanged` pattern is Firebase's recommended approach for persistent auth state.

---

### 6.2 `src/App.jsx`

**Changes**:
1. Added `DataProvider` wrapper around routes (inside `AuthProvider`)
2. Added `SeedPage` import and public route at `/seed`
3. Added `AuthLoadingScreen` component — displays a loading indicator while `onAuthStateChanged` resolves
4. `authLoading` check prevents rendering routes before auth state is determined

**Reasoning**:
- `DataProvider` must be inside `AuthProvider` because it uses `useAuth()` to get the current user for notification filtering
- `AuthLoadingScreen` prevents a brief flash of the login page for users with valid sessions (Firebase restores auth state asynchronously from IndexedDB)
- The `/seed` route is outside `ProtectedRoute` so it's accessible before any users exist

---

### 6.3 `src/pages/LoginPage.jsx`

**Changes**:
1. `handleSubmit` → `async` function using `await login(email, password)` from AuthContext
2. `handleDemoLogin` → `async` function, default password changed to `Portal@2026`
3. Added forgot-password flow using `resetPassword(forgotEmail)` from AuthContext
4. Added loading state → submit button disabled during authentication
5. Password field validation (minimum length, required)

**Reasoning**: The login page had to become async because Firebase Auth is a network operation. The demo login password was changed from mock credentials to the actual Firebase Auth password. Forgot-password was added because Firebase Auth provides this capability natively.

---

### 6.4 All 14 Page/Dashboard Components

The following files were all modified with the same pattern:

| File | Change |
|------|--------|
| `src/pages/Dashboard.jsx` | `useData()` replaces `mockData` import |
| `src/pages/HDRequestsPage.jsx` | `useData()` replaces `mockData` import |
| `src/pages/SubmissionTracker.jsx` | `useData()` replaces `mockData` import |
| `src/pages/CalendarPage.jsx` | `useData()` replaces `mockData` import |
| `src/pages/StudentsPage.jsx` | `useData()` replaces `mockData` import |
| `src/pages/AuditLogsPage.jsx` | `useData()` replaces `mockData` import |
| `src/pages/SettingsPage.jsx` | `useData()` replaces `mockData` import |
| `src/pages/AnalyticsPage.jsx` | `useData()` replaces `mockData` import |
| `src/pages/RoleManagementPage.jsx` | `useData()` replaces `mockData` import |
| `src/pages/AcademicProgressPage.jsx` | `useData()` replaces `mockData` import |
| `src/pages/dashboards/StudentDashboard.jsx` | `useData()` replaces `mockData` import |
| `src/pages/dashboards/SupervisorDashboard.jsx` | `useData()` replaces `mockData` import |
| `src/pages/dashboards/CoordinatorDashboard.jsx` | `useData()` replaces `mockData` import |
| `src/pages/dashboards/AdminDashboard.jsx` | `useData()` replaces `mockData` import |
| `src/components/layout/Header.jsx` | Notifications from `DataContext` |

**Pattern applied in every file**:

```diff
- import { mockUsers, mockHDRequests, ... } from '../data/mockData';
+ import { useData } from '../context/DataContext';

  function SomePage() {
+   const { mockUsers, mockHDRequests, ... } = useData();
    // ... rest of component unchanged
  }
```

**Reasoning**: The `useData()` hook returns data in the same shape and naming as the original mock imports. This migration strategy was chosen to **minimise page-level code changes** — reducing risk of introducing bugs across 14+ files. The actual data source changed (Firestore), but the component API contract remained identical.

**Additional change**: Several pages previously depended on a `useDataRefresh` / `tick` mechanism to re-render after mutations. This was replaced by Firestore's `onSnapshot` subscriptions which automatically trigger React state updates when data changes — eliminating manual refresh logic.

---

## 7. Data Model

### 7.1 Collection Schema

#### `users`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID (e.g., `student-001`) |
| `email` | string | University email address |
| `name` | string | Full display name |
| `role` | string | One of: `student`, `supervisor`, `coordinator`, `admin` |
| `studentNumber` | string | *(students only)* University student number |
| `department` | string | Academic department |

#### `hdRequests`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `studentId` | string | Reference to `users` document |
| `studentName` | string | Denormalized student name |
| `title` | string | Request title |
| `type` | string | Request type (e.g., `title-registration`, `ethics-application`) |
| `status` | string | Workflow state (`draft`, `submitted-to-supervisor`, `supervisor-approved`, etc.) |
| `accessCode` | string | 6-char code for supervisor access |
| `createdAt` | Timestamp | Creation date |
| `updatedAt` | Timestamp | Last modification date |
| `supervisorId` | string | Assigned supervisor |
| `comments` | array | Array of `{ author, authorName, text, date, action }` |
| `signatures` | array | Array of `{ signer, name, role, date, signature }` |
| `formData` | object | Form-specific data fields |

#### `calendarEvents`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `title` | string | Event title |
| `date` | Timestamp | Event date |
| `type` | string | Event type (e.g., `deadline`, `meeting`, `milestone`) |
| `description` | string | Event description |
| `department` | string | Related department |

#### `milestones`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `studentId` | string | Reference to student |
| `title` | string | Milestone title |
| `description` | string | Milestone description |
| `dueDate` | Timestamp | Due date |
| `status` | string | `pending`, `completed`, `overdue` |
| `completedDate` | Timestamp | *(optional)* Completion date |

#### `notifications`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `userId` | string | Target user |
| `message` | string | Notification text |
| `type` | string | Notification category |
| `read` | boolean | Read status |
| `createdAt` | Timestamp | Creation date |
| `link` | string | *(optional)* Navigation target |

#### `studentProfiles`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `studentId` | string | Reference to student |
| `degreeType` | string | `masters` or `phd` |
| `registrationYear` | number | Year of registration |
| `expectedCompletion` | string | Expected completion date |
| `researchTitle` | string | Thesis/dissertation title |
| `supervisorId` | string | Primary supervisor |
| `progressPercentage` | number | Overall progress (0–100) |

#### `auditLogs`
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID |
| `userId` | string | Actor who performed the action |
| `userName` | string | Denormalized actor name |
| `action` | string | Action performed |
| `target` | string | Entity acted upon |
| `details` | string | Human-readable description |
| `timestamp` | Timestamp | When the action occurred |

### 7.2 Design Decisions

- **Denormalization**: Names are stored alongside IDs (e.g., `studentName` in `hdRequests`) to avoid join-like reads. This follows Firestore best practice for read-heavy workloads.
- **Timestamps**: Stored as Firestore `Timestamp` objects (not ISO strings) to enable server-side ordering and range queries. Converted to JS `Date` objects at the service layer.
- **Document IDs**: Seeded with meaningful IDs (e.g., `student-001`, `req-001`) for readability. Runtime-created documents use Firestore auto-generated IDs.

---

## 8. Authentication Architecture

### 8.1 Flow

```
User enters email/password
    │
    ▼
LoginPage.handleSubmit()
    │
    ▼
AuthContext.login(email, password)
    │
    ▼
Firebase signInWithEmailAndPassword()
    │
    ├── Success → getUserByEmail(email) → Firestore lookup
    │                │
    │                ├── Profile found → setUser(profile), setIsAuthenticated(true)
    │                └── No profile → signOut(), error message
    │
    └── Failure → Map error code to user-friendly message
```

### 8.2 Session Persistence

Firebase Auth persists sessions in **IndexedDB** by default. On page reload:

```
App mounts → AuthProvider mounts → onAuthStateChanged fires
    │
    ├── Firebase has cached session → fbUser exists
    │       │
    │       ▼
    │   Fetch Firestore profile → setUser(profile)
    │
    └── No cached session → setUser(null) → redirect to /login
```

The `authLoading` state in AuthContext prevents the UI from rendering until this async check completes, avoiding a flash of the login page for authenticated users.

### 8.3 Error Handling

| Firebase Error Code | User Message |
|---------------------|-------------|
| `auth/user-not-found` | "Invalid email or password" |
| `auth/wrong-password` | "Invalid email or password" |
| `auth/invalid-credential` | "Invalid email or password" |
| `auth/too-many-requests` | "Too many failed attempts. Please try again later." |
| Other | Raw error message |

---

## 9. Real-Time Data Architecture

### 9.1 Subscription Model

DataContext establishes Firestore `onSnapshot` listeners on mount:

```javascript
useEffect(() => {
  const unsubs = [];
  unsubs.push(subscribeToCollection(COLLECTIONS.USERS, setUsers));
  unsubs.push(subscribeToCollection(COLLECTIONS.HD_REQUESTS, setHDRequests));
  unsubs.push(subscribeToCollection(COLLECTIONS.CALENDAR_EVENTS, setCalendarEvents));
  // ... all 7 collections
  return () => unsubs.forEach(fn => fn());  // cleanup on unmount
}, []);
```

Each subscription:
1. Listens for document changes (added, modified, removed)
2. Converts Firestore Timestamps to JS Dates
3. Updates React state via the corresponding setter
4. React re-renders all consuming components automatically

### 9.2 Mutation Flow

```
Page calls mutation (e.g., createHDRequest)
    │
    ▼
DataContext wrapper (adds allUsers for audit resolution)
    │
    ▼
firestore.js function (Firestore write + audit log)
    │
    ▼
Firestore updates document(s)
    │
    ▼
onSnapshot listener fires → state updates → UI re-renders
```

**Key insight**: Pages never need to manually refresh data after mutations. The `onSnapshot` subscription automatically reflects changes — this eliminates the `useDataRefresh` / `tick` pattern used with mock data.

### 9.3 Notification Filtering

Notifications are subscribed per-user:

```javascript
subscribeToUserNotifications(userId, setNotifications);
```

This uses a Firestore `where('userId', '==', currentUserId)` query, so each user only receives their own notifications — reducing unnecessary data transfer and improving privacy.

---

## 10. Seed Data & Demo Accounts

### 10.1 User Accounts

| Email | Password | Role | Name |
|-------|----------|------|------|
| `student@uwc.ac.za` | `Portal@2026` | Student | Thabo Molefe |
| `student2@uwc.ac.za` | `Portal@2026` | Student | Naledi Khumalo |
| `student3@uwc.ac.za` | `Portal@2026` | Student | Sipho Dlamini |
| `supervisor@uwc.ac.za` | `Portal@2026` | Supervisor | Prof. Sarah van der Berg |
| `supervisor2@uwc.ac.za` | `Portal@2026` | Supervisor | Dr. James Nkosi |
| `coordinator@uwc.ac.za` | `Portal@2026` | Coordinator | Dr. Fatima Patel |
| `admin@uwc.ac.za` | `Portal@2026` | Admin | Linda Mkhize |

### 10.2 Seeding Methods

| Method | Use Case |
|--------|----------|
| **SeedPage** (`/seed` route) | Browser-based, visual feedback, accessible to non-technical users |
| **seed-firebase.mjs** (CLI) | Headless, scriptable, suitable for automation or resets |

Both methods:
- Check for existing data before seeding (idempotent)
- Create Firebase Auth accounts and Firestore documents
- Use the same seed data definition
- Produce all 7 collection types with realistic inter-references

---

## 11. Automation Scripts

### 11.1 `scripts/setup-firebase.mjs`

| Step | Action | Status |
|------|--------|--------|
| 1 | Retrieve OAuth token from Firebase CLI credentials | ✅ Operational |
| 2 | Enable Firestore API on the GCP project | ✅ Operational |
| 3 | Create Firestore `(default)` database | ⚠️ Requires elevated GCP permissions |
| 4 | Set Firestore security rules (test mode) | ✅ Operational |
| 5 | Enable Email/Password authentication | ✅ Operational |
| 6 | Check for existing Auth users | ✅ Operational |

### 11.2 `scripts/seed-firebase.mjs`

| Step | Action | Status |
|------|--------|--------|
| 1 | Check for existing Firestore data | ⏳ Pending DB creation |
| 2 | Create 7 Firebase Auth users | ✅ Completed |
| 3 | Seed `users` collection | ⏳ Pending DB creation |
| 4 | Seed `hdRequests` collection | ⏳ Pending DB creation |
| 5 | Seed `calendarEvents` collection | ⏳ Pending DB creation |
| 6 | Seed `milestones` collection | ⏳ Pending DB creation |
| 7 | Seed `notifications` collection | ⏳ Pending DB creation |
| 8 | Seed `studentProfiles` collection | ⏳ Pending DB creation |
| 9 | Seed `auditLogs` collection | ⏳ Pending DB creation |

---

## 12. Migration Decisions & Trade-Offs

### 12.1 Client SDK vs Admin SDK

**Decision**: Use the Firebase **client SDK** for seed scripts (not the Admin SDK).

**Trade-off**: The client SDK requires creating Auth users through `createUserWithEmailAndPassword` (which triggers rate limits and session state), whereas the Admin SDK can create users directly. However, the client SDK approach avoids requiring a service account JSON file — which the university-managed account may not be able to generate.

### 12.2 `mock*` Naming Convention in DataContext

**Decision**: Export live Firestore data under the legacy `mock*` names (`mockUsers`, `mockHDRequests`, etc.).

**Trade-off**: The naming is misleading (data is no longer mocked), but it eliminated changes across 14+ page components. A future refactoring pass can rename these to `users`, `hdRequests`, etc.

### 12.3 Denormalized Names

**Decision**: Store display names alongside user IDs in documents (e.g., `studentName` in `hdRequests`).

**Trade-off**: Data duplication, but eliminates the need for client-side joins at read time. This aligns with Firestore's recommendation for read-heavy, write-light workloads. Name changes require propagation to referencing documents.

### 12.4 Test-Mode Security Rules

**Decision**: Deploy open security rules (`allow read, write: if true`) during development.

**Trade-off**: No security — any authenticated or unauthenticated client can read and write all data. This is acceptable for development and demonstration phases. Production deployment must implement proper role-based rules.

### 12.5 Single DataContext for All Collections

**Decision**: Subscribe to all 7 collections in a single `DataProvider`.

**Trade-off**: Every collection loads on app start, regardless of the current page. This simplifies the architecture but may impact performance with large datasets. Future optimization could implement lazy subscriptions (only subscribe when a page needs the data).

### 12.6 Fire-and-Forget Mutations

**Decision**: Mutation functions (e.g., `createHDRequest`) are async but pages don't await them for UI updates.

**Trade-off**: The `onSnapshot` listener updates the UI automatically when Firestore confirms the write. This provides eventual consistency — there may be a brief moment between the user action and the UI update. However, it simplifies the component code significantly and avoids manual state management.

---

## 13. Current Status & Remaining Work

### 13.1 Completed

| Item | Status |
|------|--------|
| Firebase SDK installed (`firebase@^12.9.0`) | ✅ |
| Firebase configuration module (`config.js`) | ✅ |
| Collection constants (`collections.js`) | ✅ |
| Firestore CRUD service (`firestore.js`, ~540 lines) | ✅ |
| DataContext with real-time subscriptions (`DataContext.jsx`, ~296 lines) | ✅ |
| AuthContext rewritten for Firebase Auth (`AuthContext.jsx`, ~107 lines) | ✅ |
| SeedPage created (`SeedPage.jsx`, ~360 lines) | ✅ |
| App.jsx updated (providers, loading screen, seed route) | ✅ |
| All 14 page components migrated to `useData()` | ✅ |
| LoginPage updated (async login, forgot password, loading state) | ✅ |
| Firebase CLI logged in (3848958@myuwc.ac.za) | ✅ |
| Firestore API enabled on GCP project | ✅ |
| Email/Password authentication enabled | ✅ |
| Firestore security rules set (test mode) | ✅ |
| 7 Firebase Auth users created | ✅ |
| Setup automation script (`setup-firebase.mjs`) | ✅ |
| Seed automation script (`seed-firebase.mjs`) | ✅ |
| Connectivity test script (`test-firestore.mjs`) | ✅ |

### 13.2 Blocked

| Item | Blocker | Resolution |
|------|---------|------------|
| Firestore database creation | University Google Workspace account lacks `datastore.databases.create` GCP permission | Create manually in Firebase Console once permissions are granted |
| Firestore data seeding | Depends on database creation | Run `node scripts/seed-firebase.mjs` or visit `/seed` after DB exists |

### 13.3 Future Work

| Item | Priority | Description |
|------|----------|-------------|
| Create Firestore database | **High** | Manual action in Firebase Console |
| Seed Firestore collections | **High** | Run seed script after DB is created |
| End-to-end testing | **High** | Login with demo accounts, verify all CRUD operations |
| Firestore security rules | **Medium** | Replace test-mode rules with role-based access control |
| Rename `mock*` exports | **Low** | Rename to `users`, `hdRequests`, etc. across all pages |
| Lazy collection subscriptions | **Low** | Only subscribe to collections when they're needed |
| Error boundaries | **Low** | Add React error boundaries for Firestore connection failures |
| Environment variables | **Low** | Move Firebase config to `.env` file |

---

## Appendix A: File Inventory

### New Files (8)

| File | Lines | Purpose |
|------|-------|---------|
| `src/firebase/config.js` | 23 | Firebase initialization |
| `src/firebase/collections.js` | 14 | Collection name constants |
| `src/firebase/firestore.js` | ~540 | Firestore CRUD service |
| `src/context/DataContext.jsx` | ~296 | Real-time data context |
| `src/pages/SeedPage.jsx` | ~360 | Admin seed utility page |
| `scripts/setup-firebase.mjs` | ~435 | Automated Firebase setup |
| `scripts/seed-firebase.mjs` | ~347 | CLI seed script |
| `scripts/test-firestore.mjs` | ~30 | Connectivity test |

### Modified Files (17)

| File | Change Type |
|------|-------------|
| `src/context/AuthContext.jsx` | Complete rewrite |
| `src/App.jsx` | Structural additions |
| `src/pages/LoginPage.jsx` | Async login + forgot password |
| `src/pages/Dashboard.jsx` | `useData()` migration |
| `src/pages/HDRequestsPage.jsx` | `useData()` migration |
| `src/pages/SubmissionTracker.jsx` | `useData()` migration |
| `src/pages/CalendarPage.jsx` | `useData()` migration |
| `src/pages/StudentsPage.jsx` | `useData()` migration |
| `src/pages/AuditLogsPage.jsx` | `useData()` migration |
| `src/pages/SettingsPage.jsx` | `useData()` migration |
| `src/pages/AnalyticsPage.jsx` | `useData()` migration |
| `src/pages/RoleManagementPage.jsx` | `useData()` migration |
| `src/pages/AcademicProgressPage.jsx` | `useData()` migration |
| `src/pages/dashboards/StudentDashboard.jsx` | `useData()` migration |
| `src/pages/dashboards/SupervisorDashboard.jsx` | `useData()` migration |
| `src/pages/dashboards/CoordinatorDashboard.jsx` | `useData()` migration |
| `src/pages/dashboards/AdminDashboard.jsx` | `useData()` migration |
| `src/components/layout/Header.jsx` | Notifications from DataContext |

### Unchanged Files (at time of Firebase migration)

| File | Reason |
|------|--------|
| `src/utils/constants.js` | Role constants unchanged |
| `src/utils/helpers.js` | Utility functions unchanged |
| `src/index.css` | Styles unchanged |
| `src/main.jsx` | Entry point unchanged |
| `src/components/layout/Layout.jsx` | Layout structure unchanged |

> **Note (Post-Migration Update):** The following files listed as "unchanged" in the original migration have since been modified or removed in subsequent iterations:
> - `src/data/mockData.js` — **Deleted**. All consumer imports were migrated to `DataContext`, and the file was removed entirely (627 lines of dead code).
> - `src/components/layout/Sidebar.jsx` — Modified to use UWC logo `<img>` in place of text.
> - `src/components/layout/layout.css` — Modified for logo `<img>` styling.
> - `src/components/common/index.jsx` — Modified to support numeric `size` prop on Avatar component.
> - Several CSS files — Modified for Document Review, Annotation Viewer, and login page styling.
>
> See [DEVELOPMENT_CHANGELOG.md](DEVELOPMENT_CHANGELOG.md) for the full record of post-migration changes.

---

## Appendix B: Firebase Project Details

| Property | Value |
|----------|-------|
| Project ID | `pg-portal1` |
| Project Number | `757138632732` |
| API Key | `AIzaSyBu7YrBJg_eNGqUlXIGCzNltScSQKYLp28` |
| Auth Domain | `pg-portal1.firebaseapp.com` |
| Storage Bucket | `pg-portal1.firebasestorage.app` |
| App ID | `1:757138632732:web:b564e133fba3a6f8862fd9` |
| Firebase CLI Account | `3848958@myuwc.ac.za` |
| Firebase Plan | Spark (free tier) |
| Auth Provider | Email/Password |
| Firestore Location | `europe-west1` |

---

*Document generated as part of the PostGrad Portal Design Science Research artefact development process.*
