// ============================================
// Help & Documentation Page
// FAQs, Static Guides, Interactive Walkthroughs
// ============================================

import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTour } from '../context/GuidedTour';
import { Card, CardHeader, CardBody } from '../components/common';
import { getToursForRole, TOUR_CATEGORIES } from './walkthroughs.jsx';
import {
  HiOutlineQuestionMarkCircle,
  HiOutlineBookOpen,
  HiOutlinePlay,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineAcademicCap,
  HiOutlineCog6Tooth,
  HiOutlineDocumentText,
  HiOutlineBell,
  HiOutlineShieldCheck,
  HiOutlineClipboardDocumentList,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlinePaintBrush,
  HiOutlineUserGroup,
  HiOutlineStar,
} from 'react-icons/hi2';
import './HelpPage.css';

/* ════════════════════════════════════════
   FAQ DATA
   ════════════════════════════════════════ */
const FAQ_DATA = [
  {
    category: 'Key Terms & Acronyms',
    icon: <HiOutlineAcademicCap />,
    items: [
      {
        q: 'What does HD stand for?',
        a: '**HD** stands for **Higher Degree**. It refers to postgraduate qualifications such as Master\'s and Doctoral degrees. HD requests are the administrative submissions required to register, progress, or complete these programmes.',
      },
      {
        q: 'What is the FHD?',
        a: '**FHD** stands for **Faculty Higher Degrees** committee. This is the faculty-level body that reviews and approves HD requests after coordinator review. FHD decisions can be:\n\n• **Approved** — request is automatically forwarded to SHD\n• **Recommended** — SHD review is required\n• **Referred back** — returned for amendments',
      },
      {
        q: 'What is the SHD?',
        a: '**SHD** stands for **Senate Higher Degrees** committee. This is the university-level body that provides final approval for HD requests. SHD is the last stage before a request is fully approved.',
      },
      {
        q: 'What does RBAC mean?',
        a: '**RBAC** stands for **Role-Based Access Control**. The portal uses RBAC to ensure users only see pages and actions relevant to their role (Student, Supervisor, Coordinator, or Admin).',
      },
      {
        q: 'What is the review pipeline?',
        a: 'The review pipeline is the sequence of approval stages an HD request passes through:\n\n1. **Draft** — created by the student\n2. **Submitted** — sent to supervisor\n3. **Supervisor Review** — supervisor evaluates\n4. **Co-Supervisor Review** — if applicable\n5. **Coordinator Review** — programme-level check\n6. **FHD** — Faculty Higher Degrees committee\n7. **SHD** — Senate Higher Degrees committee\n8. **Approved** — fully approved',
      },
    ],
  },
  {
    category: 'General',
    icon: <HiOutlineQuestionMarkCircle />,
    items: [
      {
        q: 'What is the PostGrad Portal?',
        a: 'The PostGrad Portal is a digital governance platform for managing postgraduate Higher Degree (HD) administrative processes at the University of the Western Cape. It provides role-based access for students, supervisors, coordinators, and administrators to manage submissions, reviews, and approvals.',
      },
      {
        q: 'Who can use the portal?',
        a: 'The portal supports four user roles:\n\n1. **Students** — submit HD requests, track progress, and view academic history\n2. **Supervisors** — review student submissions, provide feedback, and sign requests\n3. **Coordinators** — oversee the programme, manage committee decisions, and audit processes\n4. **Administrators** — manage users, view analytics, and ensure system governance',
      },
      {
        q: 'How do I log in?',
        a: 'Use your registered email address and password on the login page. If you\'ve forgotten your password, use the "Forgot Password" option to receive a reset link via email.',
      },
    ],
  },
  {
    category: 'HD Requests',
    icon: <HiOutlineDocumentText />,
    items: [
      {
        q: 'How do I submit a new HD request?',
        a: 'Navigate to **My Requests** from the sidebar, then click the **"New Request"** button. Select the request type, fill in the required fields, attach supporting documents, and click Submit. Your request will be sent to your supervisor for review.',
        tourLink: 'submit-request',
      },
      {
        q: 'What are the different request types?',
        a: 'The portal supports several HD request types:\n\n• **Registration** — initial programme registration\n• **Title Registration** — thesis title registration\n• **Progress Report** — periodic progress updates\n• **Extension** — request for additional time\n• **Leave of Absence** — temporary leave from studies\n• **Supervisor Change** — change of supervisor request\n• **Examination Entry** — entry for examination',
      },
      {
        q: 'How long does the approval process take?',
        a: 'Each stage in the review pipeline has expected turnaround times. Supervisors typically review within 48 hours. The full pipeline from submission to final approval depends on committee meeting schedules. You can track exactly where your request is on the **Progress Tracker** page.',
        tourLink: 'track-submissions',
      },
      {
        q: 'What happens if my request is referred back?',
        a: 'If your request is referred back, you\'ll receive a notification with the reason. You can then make the necessary amendments and resubmit. The revised submission goes through the review pipeline again.',
      },
      {
        q: 'Can I view submitted forms in read-only mode?',
        a: 'Yes. On the **HD Requests** page, select any request and click **"View Submitted Form"** (or **"View Form Template"** if no data has been submitted yet). The full multi-section form is displayed in **read-only mode** — all fields are visible but not editable. Every role (Student, Supervisor, Coordinator, Admin) can view all sections of the form, regardless of which role a section is assigned to.',
      },
    ],
  },
  {
    category: 'Documents & Reviews',
    icon: <HiOutlineClipboardDocumentList />,
    items: [
      {
        q: 'How do I view document feedback?',
        a: 'Open any request and navigate to the **Document Review** area. You can see version history, comments, feedback ratings, and all reviewer decisions in one place.',
      },
      {
        q: 'When can I use document annotations?',
        a: 'Annotations are enabled for **thesis-related request types** only. Open a thesis-related document in Document Review and use the annotated viewer to leave precise, text-level feedback.',
        tourLink: 'annotate-documents',
      },
      {
        q: 'How does document versioning work?',
        a: 'Each time you submit or re-upload documents, a new version is created. Previous versions are preserved as read-only records. Reviewers can compare versions and track changes over time.',
      },
    ],
  },
  {
    category: 'Notifications',
    icon: <HiOutlineBell />,
    items: [
      {
        q: 'How do notifications work?',
        a: 'The portal sends both **in-app notifications** (visible via the bell icon in the header) and **email notifications** for important events like status changes, new reviews, comments, and deadline reminders.',
        tourLink: 'manage-notifications',
      },
      {
        q: 'Can I customise my notification preferences?',
        a: 'Yes! Go to **Settings** then the **Notifications** tab to toggle different notification categories on or off. You can control alerts for status changes, deadlines, committee decisions, and new review requests.',
        tourLink: 'manage-notifications',
      },
    ],
  },
  {
    category: 'Settings & Appearance',
    icon: <HiOutlineCog6Tooth />,
    items: [
      {
        q: 'How do I switch between light and dark mode?',
        a: 'Go to **Settings** and select either Light or Dark mode. You can also use the theme toggle button (sun/moon icon) in the header bar. The change applies instantly and is saved locally, so it persists across sessions.',
        tourLink: 'change-theme',
      },
      {
        q: 'How do I change my password?',
        a: 'Navigate to **Settings** then the **Security** tab. Enter your current password, then your new password (minimum 8 characters), and confirm it. Click "Update Password" to save.',
      },
      {
        q: 'Can I update my profile information?',
        a: 'Go to **Settings** then the **Profile** tab. You can update your name, programme details, and supervisor assignments. Your email and role are managed by the system administrator.',
      },
    ],
  },
  {
    category: 'Calendar & Tracking',
    icon: <HiOutlineCalendarDays />,
    items: [
      {
        q: 'How do I use the Calendar?',
        a: 'The dashboard calendar widget shows important dates including HD submission deadlines, committee meetings, and faculty events. Use month navigation and event controls directly in the widget.',
        tourLink: 'use-calendar',
      },
      {
        q: 'What is the Progress Tracker?',
        a: 'The Progress Tracker combines submission pipeline tracking and milestone history in one place. Use filters to focus on statuses and reveal detailed timelines only when needed.',
        tourLink: 'track-submissions',
      },
    ],
  },
  {
    category: 'Administration',
    icon: <HiOutlineShieldCheck />,
    items: [
      {
        q: 'How do I manage user roles? (Admin only)',
        a: 'Navigate to **Role Management** from the sidebar. You can view all users, change their roles, and manage access permissions. All role changes are logged in the audit trail.',
        tourLink: 'manage-roles',
      },
      {
        q: 'How do I create a single user? (Admin only)',
        a: 'On the **Role Management** page, click **"Create User"**. Fill in the first name, surname, email, role, and any optional fields (title, student number, organisation). Generate a temporary password and click **Create User**. The user receives an Auth account and portal profile.',
      },
      {
        q: 'How do I bulk-import users from a CSV file? (Admin only)',
        a: 'On the **Role Management** page, click **"Import CSV"**. Upload a CSV file with the required columns: `firstName`, `surname`, `email`, `role`. Optional columns: `title`, `studentNumber`, `organization`.\n\nValid roles: `student`, `supervisor`, `coordinator`, `admin`, `external`, `examiner`.\n\nThe system validates every row before importing. Valid rows are created with auto-generated temporary passwords. A results summary shows which users were created and which failed.\n\nYou can download a sample CSV template directly from the import dialog.',
        tourLink: 'csv-import',
      },
      {
        q: 'What CSV format is required for bulk user import?',
        a: 'The CSV file must:\n\n• Have a **header row** with column names\n• Include **required columns**: `firstName`, `surname`, `email`, `role`\n• Optionally include: `title`, `studentNumber`, `organization`\n• Use **comma-separated values** (standard CSV)\n• Emails must be **unique** within the file and not already registered\n• Roles must be one of: `student`, `supervisor`, `coordinator`, `admin`, `external`, `examiner`\n\n**Example:**\n```\nfirstName,surname,email,role,title,studentNumber,organization\nJohn,Doe,john@uwc.ac.za,student,,,3847562\nDr. Jane,Smith,jane@uwc.ac.za,supervisor,Dr.,,\n```',
      },
      {
        q: 'How do I access audit logs? (Coordinator/Admin)',
        a: 'Go to **Audit Logs** from the sidebar. Filter by user, action type, or date range to find specific system events. The audit trail records every significant action for governance and compliance.',
        tourLink: 'view-audit-logs',
      },
      {
        q: 'How do I view system analytics? (Admin only)',
        a: 'Navigate to **Analytics** from the sidebar. View charts showing submission trends, processing times, approval rates, and user activity patterns.',
        tourLink: 'view-analytics',
      },
    ],
  },
];

/* ════════════════════════════════════════
   STATIC GUIDES DATA
   ════════════════════════════════════════ */
const GUIDES = [
  {
    id: 'hd-workflow',
    title: 'HD Request Workflow',
    icon: <HiOutlineDocumentText />,
    description: 'Understanding the complete HD request lifecycle from submission to approval.',
    roles: ['student', 'supervisor', 'coordinator', 'admin'],
    content: `## HD Request Workflow

The Higher Degree request follows a structured multi-stage pipeline:

### 1. Draft
- Student creates a new HD request
- Fills in required fields and attaches documents
- Can save as draft before submitting

### 2. Submit to Supervisor
- Student submits the request
- Supervisor receives a notification (in-app + email)
- Request status changes to "Submitted to Supervisor"

### 3. Supervisor Review
- Supervisor opens the request and reviews documents
- Can add comments, annotations, and formal feedback
- Options: **Approve** (forward to coordinator) or **Request Changes** (send back to student)

### 4. Co-Supervisor Review (if applicable)
- If a co-supervisor is assigned, the request is forwarded for their review and signature

### 5. Coordinator Review
- Coordinator reviews the signed request
- Prepares for Faculty Board submission
- Can approve, request changes, or escalate

### 6. Faculty Higher Degrees (FHD) Board
- Coordinator records the FHD outcome:
  - **Approved** — automatically advances to SHD
  - **Recommended** — advances with recommendation
  - **Referred Back** — returned for amendments

### 7. Senate Higher Degrees (SHD) Board
- Final approval authority
- Outcomes: **Approved** or **Referred Back**

### 8. Approved
- Request is fully approved
- Reference number is assigned
- Final documents are locked and archived
- All stakeholders are notified`,
  },
  {
    id: 'document-review-guide',
    title: 'Document Review & Annotations',
    icon: <HiOutlineClipboardDocumentList />,
    description: 'How to review documents, add annotations, and provide structured feedback.',
    roles: ['supervisor', 'coordinator'],
    content: `## Document Review Guide

### Opening a Document for Review
1. Navigate to any HD request
2. Click the **"Review Documents"** button or select a version
3. Click on any PDF document to open the full-screen viewer

### Adding Comments
- Use the comments section below the document grid
- Comments are threaded — you can reply to existing comments
- Each comment is tagged with your role and timestamp

### Creating PDF Annotations
1. In the PDF viewer, select text by clicking and dragging
2. A floating **"Annotate"** button appears
3. Click it, choose a highlight colour, and type your comment
4. Click **Save** — the annotation is saved as a draft

### Batch Sending Annotations
- Annotations are drafts until you send them
- The sidebar shows **"Review & Send (N drafts)"** when you have unsent annotations
- Click to review all drafts in a confirmation modal
- **"Confirm & Send"** sends all at once — the student receives a single notification

### Providing Formal Feedback
- Click **"Submit Feedback"** to rate the submission
- Rate on 5 criteria: Research Quality, Academic Writing, Methodology, Completeness, Formatting
- Add a recommendation (Approve / Request Changes) and detailed comments

### Version Management
- Each document upload creates a new version
- Previous versions become read-only ("superseded")
- You can compare feedback across versions`,
  },
  {
    id: 'getting-started-student',
    title: 'Getting Started (Students)',
    icon: <HiOutlineAcademicCap />,
    description: 'A quick-start guide for new students setting up and using the portal.',
    roles: ['student'],
    content: `## Getting Started as a Student

### First Steps
1. **Log in** with the credentials provided by your coordinator
2. **Explore your Dashboard** — it shows your pending requests, upcoming deadlines, and recent activity
3. **Update your Profile** — go to Settings to verify your name and department are correct

### Key Pages for Students
- **My Requests** — create, view, and track HD requests
- **Submission Tracker** — visual pipeline of your submissions
- **Calendar** — important dates and deadlines
- **Academic Progress** — your registration history and milestones
- **Settings** — profile, notifications, theme, and password

### Submitting Your First Request
1. Go to **My Requests**
2. Click **"New Request"**
3. Select the request type
4. Fill in all required fields
5. Attach supporting documents
6. Click **Submit**

### Tracking Your Submission
- Use the **Submission Tracker** to see where your request is in the pipeline
- You'll receive notifications at each stage transition
- Comments and feedback from reviewers appear on the request detail page

### Tips
- Keep your documents organized and properly named
- Check notifications regularly
- Respond promptly to reviewer feedback
- Use the Calendar to stay aware of deadlines`,
  },
  {
    id: 'getting-started-supervisor',
    title: 'Getting Started (Supervisors)',
    icon: <HiOutlineUserGroup />,
    description: 'Introduction to supervisor responsibilities and tools in the portal.',
    roles: ['supervisor'],
    content: `## Getting Started as a Supervisor

### Your Responsibilities
- Review student HD requests
- Provide feedback and annotations on documents
- Approve or request changes on submissions
- Monitor student progress

### Key Pages for Supervisors
- **Dashboard** — overview of pending reviews and student activity
- **Review Requests** — all requests assigned to you
- **My Students** — students under your supervision
- **Submission Tracker** — pipeline view of student submissions

### Review Workflow
1. Receive notification of new submission
2. Open the request from **Review Requests**
3. Review documents (use annotations for detailed feedback)
4. Add comments or formal feedback
5. **Approve** to forward to coordinator, or **Request Changes** to send back

### Using Document Annotations
- Open any PDF in the document viewer
- Select text and click "Annotate"
- Add as many annotations as needed (saved as drafts)
- Use "Review & Send" to batch-send all annotations at once`,
  },
  {
    id: 'appearance-guide',
    title: 'Customising Appearance',
    icon: <HiOutlinePaintBrush />,
    description: 'How to change themes and customise your portal experience.',
    roles: ['student', 'supervisor', 'coordinator', 'admin'],
    content: `## Customising Your Appearance

### Light & Dark Mode
The portal supports both light and dark themes:

1. Click the **sun/moon icon** in the header bar to toggle instantly
2. Or go to **Settings**, then the **Appearance** tab to select your preference

### Theme Details
- **Light Mode** — clean, bright interface with white backgrounds
- **Dark Mode** — darker tones that are easier on the eyes, especially at night

### Persistence
Your theme preference is saved locally in your browser. It persists across sessions — you won't need to set it again unless you clear your browser data.

### Accessibility
Both themes maintain proper contrast ratios for readability. The gold accent colour (UWC brand) adapts for visibility in both modes.`,
  },
  {
    id: 'admin-governance-guide',
    title: 'System Governance (Admin)',
    icon: <HiOutlineShieldCheck />,
    description: 'Administrative tools for governance, compliance, and system oversight.',
    roles: ['admin'],
    content: `## System Governance Guide

### Role Management
- Navigate to **Role Management** to view all system users
- You can change user roles (Student, Supervisor, Coordinator, Admin)
- All role changes are recorded in the audit trail

### Audit Logs
- The **Audit Logs** page records every significant system action
- Filter by user, action type, date range, or resource
- Use for compliance reporting, dispute resolution, and oversight

### Analytics
- **Analytics** provides data visualisation of system performance
- View submission trends, processing times, and approval rates
- Useful for programme reviews and stakeholder reporting

### Calendar Management
- Create and manage institution-wide events and deadlines
- Events are visible to all relevant users based on their role`,
  },
  {
    id: 'csv-import-guide',
    title: 'Bulk User Import (CSV)',
    icon: <HiOutlineUserGroup />,
    description: 'How to prepare a CSV file and bulk-create user accounts in the portal.',
    roles: ['admin'],
    content: `## Bulk User Import via CSV

### Overview
Administrators can create multiple user accounts at once by uploading a CSV (Comma-Separated Values) file. This is ideal for onboarding cohorts of students, adding new staff, or migrating users from another system.

### CSV File Format

Your CSV must include a **header row** followed by one row per user.

**Required columns** (case-insensitive):
| Column | Description |
|--------|-------------|
| firstName | User's first name |
| surname | User's surname / last name |
| email | Unique email address (used for login) |
| role | One of: student, supervisor, coordinator, admin, external, examiner |

**Optional columns:**
| Column | Description |
|--------|-------------|
| title | Academic title (e.g. Prof., Dr., Mr., Ms.) — applies to supervisor/coordinator/admin |
| studentNumber | Student number — applies to student role only |
| organization | Organisation / affiliation — applies to external/examiner roles only |

### Example CSV
\`\`\`
firstName,surname,email,role,title,studentNumber,organization
John,Doe,john.doe@uwc.ac.za,student,,,3847562
Jane,Smith,jane.smith@uwc.ac.za,supervisor,Dr.,,
External,Reviewer,reviewer@uct.ac.za,examiner,Prof.,,University of Cape Town
Alice,Johnson,alice.j@uwc.ac.za,coordinator,Ms.,,
\`\`\`

### Step-by-Step Import Process

1. Go to **Role Management** from the sidebar
2. Click the **"Import CSV"** button (next to "Create User")
3. Optionally click **"Download CSV Template"** to get a pre-formatted file
4. Click **"Select CSV File"** and choose your CSV
5. The system parses and validates every row:
   - **Valid** rows show a green checkmark
   - **Invalid** rows show a warning with the specific error (missing fields, invalid email, duplicate, unknown role)
6. Review the preview table — invalid rows will be skipped automatically
7. Click **"Import Users"** to begin creation
8. A progress bar shows real-time progress
9. After completion, a results summary shows:
   - **Successfully created** users with their temporary passwords
   - **Failed** users with error messages

### Important Notes
- Each user receives an auto-generated **temporary password** displayed in the results
- Users must change their password on first login
- Duplicate emails (within the CSV or already in the system) are rejected
- The import processes users **sequentially** to ensure reliable account creation
- You can copy individual temporary passwords from the results table`,
  },
];

/* ════════════════════════════════════════
   HELP PAGE COMPONENT
   ════════════════════════════════════════ */
export default function HelpPage() {
  const { user } = useAuth();
  const { startTour } = useTour();
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState({});
  const [expandedGuide, setExpandedGuide] = useState(null);

  const role = user?.role || 'student';

  // Get role-specific tours
  const availableTours = useMemo(() => getToursForRole(role), [role]);

  // Group tours by category
  const toursByCategory = useMemo(() => {
    const grouped = {};
    availableTours.forEach(tour => {
      const cat = tour.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(tour);
    });
    return grouped;
  }, [availableTours]);

  // Filter FAQs by role and search
  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.map(cat => ({
      ...cat,
      items: cat.items.filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      }),
    })).filter(cat => cat.items.length > 0);
  }, [searchQuery]);

  // Filter guides by role and search
  const filteredGuides = useMemo(() => {
    return GUIDES.filter(g => {
      if (!g.roles.includes(role)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q) || g.content.toLowerCase().includes(q);
    });
  }, [role, searchQuery]);

  const toggleFAQ = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setExpandedFAQ(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartTour = (tour) => {
    startTour(tour);
  };

  const renderMarkdown = (text) => {
    // Simple markdown renderer for guides
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="help-guide-h2">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="help-guide-h3">{line.slice(4)}</h3>;
        if (line.startsWith('- ')) return <li key={i} className="help-guide-li">{renderInline(line.slice(2))}</li>;
        if (/^\d+\.\s/.test(line)) return <li key={i} className="help-guide-li help-guide-ol">{renderInline(line.replace(/^\d+\.\s/, ''))}</li>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="help-guide-p">{renderInline(line)}</p>;
      });
  };

  const renderInline = (text) => {
    // Bold and italic inline
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
      if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="help-inline-code">{part.slice(1, -1)}</code>;
      return part;
    });
  };

  const renderFAQAnswer = (text, tourLink) => {
    const lines = text.split('\n');
    return (
      <div className="help-faq-answer">
        {lines.map((line, i) => {
          if (line.startsWith('• ') || line.startsWith('- ')) return <li key={i}>{renderInline(line.slice(2))}</li>;
          if (/^\d+\.\s/.test(line)) return <li key={i} className="help-guide-ol">{renderInline(line.replace(/^\d+\.\s/, ''))}</li>;
          if (line.trim() === '') return <br key={i} />;
          return <p key={i}>{renderInline(line)}</p>;
        })}
        {tourLink && (
          <button className="help-start-tour-inline" onClick={() => {
            const tour = availableTours.find(t => t.id === tourLink);
            if (tour) handleStartTour(tour);
          }}>
            <HiOutlinePlay /> Start Interactive Walkthrough
          </button>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'faq', label: 'FAQs', icon: <HiOutlineQuestionMarkCircle /> },
    { id: 'guides', label: 'Guides', icon: <HiOutlineBookOpen /> },
    { id: 'walkthroughs', label: 'Interactive Walkthroughs', icon: <HiOutlinePlay /> },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Help & Documentation</h1>
          <p>Find answers, read guides, and take interactive walkthroughs</p>
        </div>
      </div>

      {/* Search */}
      <div className="help-search-wrapper">
        <HiOutlineMagnifyingGlass className="help-search-icon" />
        <input
          type="text"
          className="help-search-input"
          placeholder="Search FAQs, guides, and walkthroughs..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="help-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`help-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── FAQs Tab ── */}
      {activeTab === 'faq' && (
        <div className="help-section animate-fade-in">
          {filteredFAQs.length === 0 ? (
            <div className="help-empty">
              <HiOutlineQuestionMarkCircle />
              <p>No FAQs match your search. Try a different query.</p>
            </div>
          ) : (
            filteredFAQs.map((cat, catIdx) => (
              <div key={catIdx} className="help-faq-category">
                <div className="help-faq-category-header">
                  <span className="help-faq-category-icon">{cat.icon}</span>
                  <h2>{cat.category}</h2>
                </div>
                <div className="help-faq-list">
                  {cat.items.map((item, itemIdx) => {
                    const key = `${catIdx}-${itemIdx}`;
                    const isOpen = expandedFAQ[key];
                    return (
                      <div key={key} className={`help-faq-item ${isOpen ? 'open' : ''}`}>
                        <button className="help-faq-question" onClick={() => toggleFAQ(catIdx, itemIdx)}>
                          <span>{item.q}</span>
                          {isOpen ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
                        </button>
                        {isOpen && renderFAQAnswer(item.a, item.tourLink)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Guides Tab ── */}
      {activeTab === 'guides' && (
        <div className="help-section animate-fade-in">
          {filteredGuides.length === 0 ? (
            <div className="help-empty">
              <HiOutlineBookOpen />
              <p>No guides match your search or role.</p>
            </div>
          ) : (
            <div className="help-guides-grid">
              {filteredGuides.map(guide => (
                <div
                  key={guide.id}
                  className={`help-guide-card ${expandedGuide === guide.id ? 'expanded' : ''}`}
                >
                  <button
                    className="help-guide-card-header"
                    onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                  >
                    <div className="help-guide-card-icon">{guide.icon}</div>
                    <div className="help-guide-card-info">
                      <h3>{guide.title}</h3>
                      <p>{guide.description}</p>
                    </div>
                    {expandedGuide === guide.id ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
                  </button>
                  {expandedGuide === guide.id && (
                    <div className="help-guide-content animate-fade-in">
                      {renderMarkdown(guide.content)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Walkthroughs Tab ── */}
      {activeTab === 'walkthroughs' && (
        <div className="help-section animate-fade-in">
          {/* Featured: Full tour */}
          <div className="help-featured-tour">
            <div className="help-featured-tour-content">
              <div className="help-featured-badge"><HiOutlineStar /> Recommended</div>
              <h2>Complete {role.charAt(0).toUpperCase() + role.slice(1)} System Tour</h2>
              <p>Take a comprehensive guided tour of every feature available to you. This walkthrough covers all pages, key actions, and tips.</p>
              <button
                className="btn btn-gold btn-lg"
                onClick={() => {
                  const fullTour = availableTours.find(t => t.id.startsWith('full-'));
                  if (fullTour) handleStartTour(fullTour);
                }}
              >
                <HiOutlinePlay /> Start Complete Tour
              </button>
            </div>
          </div>

          {/* Individual walkthroughs by category */}
          {Object.entries(toursByCategory)
            .filter(([cat]) => cat !== 'getting_started')
            .map(([catKey, tours]) => {
              const catConfig = TOUR_CATEGORIES[catKey] || { label: catKey, icon: <HiOutlineClipboardDocumentList /> };
              return (
                <div key={catKey} className="help-tour-category">
                  <h3 className="help-tour-category-title">
                    <span>{catConfig.icon}</span> {catConfig.label}
                  </h3>
                  <div className="help-tour-grid">
                    {tours.map(tour => (
                      <div key={tour.id} className="help-tour-card">
                        <div className="help-tour-card-info">
                          <h4>{tour.title}</h4>
                          <p>{tour.description}</p>
                          <div className="help-tour-meta">
                            <span>{tour.steps.length} steps</span>
                          </div>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStartTour(tour)}
                        >
                          <HiOutlinePlay /> Start
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
