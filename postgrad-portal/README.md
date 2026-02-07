# UWC PostGrad Portal

A role-based postgraduate request management system for the **University of the Western Cape**. Built with React 19 + Vite, standard CSS, and a reactive mock data store.

---

## Features

### Four User Roles
| Role | Capabilities |
|---|---|
| **Student** | Create/submit HD requests, track submissions, manage milestones, view academic progress |
| **Supervisor** | Review requests, approve/refer back, sign digitally, nudge students, view student details |
| **Coordinator** | Manage all requests, forward to Faculty/Senate Boards, record outcomes, export agendas |
| **Admin** | System overview, analytics, role management, audit logs, dataset exports |

### Core Functionality
- **HD Request Workflow** — Full lifecycle from draft → supervisor review → co-supervisor sign → coordinator → Faculty Board → Senate Board → approved
- **Access Code System** — Secure supervisor access via generated 6-character codes with expiry
- **Digital Signatures** — Draw or type signature pad for approval actions
- **Submission Tracker** — Visual workflow progress bar with owner tracking and response timers
- **Nudge System** — Supervisors can send reminder notifications to students
- **Committee Exports** — CSV export of Faculty/Senate Board agendas with student number, degree, and supervisor
- **Refer-Back Workflow** — 24-hour amendment timer when requests are referred back
- **Calendar** — Full CRUD calendar with month view, role-based auto-filtering, and event types
- **Milestones** — Students can log academic milestones (conferences, publications, etc.)
- **Audit Logs** — Searchable activity log with date filtering and CSV export
- **Analytics Dashboard** — Bar charts for request status/type distribution, summary statistics
- **Role Management** — Admin interface to reassign user roles
- **Overdue Monitoring** — "Overdue Only" filter on requests page for coordinators/admins
- **Notifications** — Bell icon with unread count, mark-read, and link navigation

---

## Tech Stack

| | |
|---|---|
| **Framework** | React 19 (JSX, no TypeScript) |
| **Build Tool** | Vite 7 |
| **Routing** | react-router-dom 6 |
| **Icons** | react-icons/hi2 (Heroicons v2) |
| **Dates** | date-fns 4 |
| **Styling** | Standard CSS with custom properties |
| **State** | Reactive mock store (subscribe/notify) + React Context |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Demo Accounts

| Email | Role |
|---|---|
| `student@uwc.ac.za` | Student |
| `supervisor@uwc.ac.za` | Supervisor |
| `coordinator@uwc.ac.za` | Coordinator |
| `admin@uwc.ac.za` | Admin |

> Any password works — authentication is mocked.

---

## Project Structure

```
src/
├── App.jsx                       # Routes & protected route wrapper
├── main.jsx                      # Entry point
├── index.css                     # Global styles & CSS variables
├── components/
│   ├── common/                   # Shared UI (Card, Modal, StatusBadge, Avatar, etc.)
│   │   ├── index.jsx
│   │   ├── common.css
│   │   └── SignaturePad.jsx
│   └── layout/                   # App shell (sidebar, header, outlet)
│       ├── Layout.jsx
│       ├── Header.jsx
│       ├── Sidebar.jsx
│       └── layout.css
├── context/
│   └── AuthContext.jsx           # Auth provider, useAuth(), useDataRefresh()
├── data/
│   └── mockData.js               # Reactive store, mock data, mutation functions
├── pages/
│   ├── Dashboard.jsx             # Role-based dashboard router
│   ├── HDRequestsPage.jsx        # Request list, detail modal, all workflow actions
│   ├── SubmissionTracker.jsx     # Visual workflow progress tracker
│   ├── CalendarPage.jsx          # Month calendar with CRUD
│   ├── StudentsPage.jsx          # Student directory with edit modal
│   ├── AcademicProgressPage.jsx  # Student's historical view
│   ├── AnalyticsPage.jsx         # Admin analytics with charts
│   ├── AuditLogsPage.jsx         # Searchable audit log
│   ├── RoleManagementPage.jsx    # Admin role assignment
│   ├── LoginPage.jsx             # Login + forgot password
│   ├── SettingsPage.jsx          # Profile, notifications, password
│   └── dashboards/               # Role-specific dashboard views
│       ├── StudentDashboard.jsx
│       ├── SupervisorDashboard.jsx
│       ├── CoordinatorDashboard.jsx
│       └── AdminDashboard.jsx
└── utils/
    ├── constants.js              # Status configs, labels, workflow states
    └── helpers.js                # Date formatting, utilities
```

---

## Routes

| Path | Component | Access |
|---|---|---|
| `/login` | LoginPage | Public |
| `/dashboard` | Dashboard (role-based) | All |
| `/requests` | HDRequestsPage | All |
| `/tracker` | SubmissionTracker | All |
| `/calendar` | CalendarPage | All |
| `/students` | StudentsPage | Supervisor, Coordinator, Admin |
| `/progress` | AcademicProgressPage | Student |
| `/audit` | AuditLogsPage | Coordinator, Admin |
| `/analytics` | AnalyticsPage | Admin |
| `/roles` | RoleManagementPage | Admin |
| `/settings` | SettingsPage | All |

---

## Brand

- **UWC Navy:** `#003366`
- **UWC Gold:** `#C5A55A`
