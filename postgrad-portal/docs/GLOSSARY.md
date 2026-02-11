# PostGrad Portal – Glossary of Terms

> **Project**: UWC Postgraduate Request Portal  
> **Date**: February 2026  
> **Purpose**: Comprehensive reference defining all terms, acronyms, phrases, frameworks, libraries, and technical concepts used throughout the project documentation and codebase.

---

## Table of Contents

1. [Academic & University Terms](#1-academic--university-terms)
   - 1.1 [Institutional Terms](#11-institutional-terms)
   - 1.2 [Roles](#12-roles)
   - 1.3 [Degree Programmes](#13-degree-programmes)
   - 1.4 [HD Request Types & Form Codes](#14-hd-request-types--form-codes)
   - 1.5 [Committee & Workflow Terms](#15-committee--workflow-terms)
   - 1.6 [Academic Documents & Milestones](#16-academic-documents--milestones)
2. [Technology & Framework Terms](#2-technology--framework-terms)
   - 2.1 [Core Stack](#21-core-stack)
   - 2.2 [Firebase / Google Cloud](#22-firebase--google-cloud)
   - 2.3 [Microsoft Azure](#23-microsoft-azure)
   - 2.4 [Web Standards & Protocols](#24-web-standards--protocols)
3. [Libraries & Packages](#3-libraries--packages)
   - 3.1 [Production Dependencies](#31-production-dependencies)
   - 3.2 [Development Dependencies](#32-development-dependencies)
   - 3.3 [External Services](#33-external-services)
4. [Architecture & Design Patterns](#4-architecture--design-patterns)
   - 4.1 [Application Architecture](#41-application-architecture)
   - 4.2 [React Patterns](#42-react-patterns)
   - 4.3 [Data Patterns](#43-data-patterns)
   - 4.4 [UI Patterns](#44-ui-patterns)
5. [Project-Specific Terms](#5-project-specific-terms)
   - 5.1 [Core Features](#51-core-features)
   - 5.2 [Components & Pages](#52-components--pages)
   - 5.3 [Workflow States](#53-workflow-states)
   - 5.4 [Firestore Collections](#54-firestore-collections)
   - 5.5 [Branding & Theming](#55-branding--theming)
6. [Security & Compliance](#6-security--compliance)
   - 6.1 [Data Protection Laws](#61-data-protection-laws)
   - 6.2 [Security Mechanisms](#62-security-mechanisms)
   - 6.3 [Compliance Standards](#63-compliance-standards)
7. [Research Methodology](#7-research-methodology)
   - 7.1 [DSRM Concepts](#71-dsrm-concepts)
   - 7.2 [Evaluation Terms](#72-evaluation-terms)
8. [Deployment & Infrastructure](#8-deployment--infrastructure)
   - 8.1 [Hosting & Plans](#81-hosting--plans)
   - 8.2 [Regions & Data Residency](#82-regions--data-residency)
   - 8.3 [Build & Configuration](#83-build--configuration)
   - 8.4 [Pricing & Operations](#84-pricing--operations)

---

## 1. Academic & University Terms

### 1.1 Institutional Terms

| Term | Definition |
|------|-----------|
| **UWC** | **University of the Western Cape** — a public research university in Bellville, Cape Town, South Africa. The institution for which this portal was designed. |
| **Faculty of Natural Sciences** | The specific UWC faculty under which the postgraduate HD request process operates. Referenced in form headers and branding throughout the portal. |
| **Faculty Board** | Alternate name for the FHD committee in the portal's user interface. The label displayed in status badges and workflow steps (e.g. "Faculty Board Pending"). |
| **Senate Board** | Alternate name for the SHD committee in the portal's user interface. Represents the highest decision-making body for HD requests within UWC's governance structure. |
| **Department** | An organisational sub-unit of the Faculty to which a student belongs. Captured in form templates and student profiles (e.g. Computer Science, Biotechnology). |
| **Student Number** | A unique numeric identifier assigned to each student by UWC. Used as a primary identifier in form templates, student profiles, and audit records. |

### 1.2 Roles

| Term | Definition |
|------|-----------|
| **Student** | The primary portal user role. Students initiate HD requests, complete forms, upload documents, track submissions through the committee cycle, and record academic milestones. They can only view and interact with their own data. |
| **Supervisor** | An academic staff member assigned to mentor and guide a postgraduate student's research. Supervisors review HD requests, provide feedback, add annotations to documents, digitally sign forms, and can "nudge" students via notifications. A student may have one primary supervisor and one or more co-supervisors. |
| **Co-Supervisor** | A secondary supervisor who participates in the review workflow after the primary supervisor. Co-supervisors can review and sign HD requests but cannot edit them. When multiple co-supervisors exist, signing proceeds sequentially with a new access code generated for each. |
| **Coordinator** | The Postgraduate Coordinator — a senior academic or administrator who oversees the HD process at programme or faculty level. Coordinators have visibility into all students' submissions, can export committee agendas (CSV), update student records (thesis titles, supervisors), record FHD/SHD outcomes, and manage calendar events. |
| **Administrator** / **Admin** | A system governance role with full read access to all portal data. Admins manage user roles, access the Form Builder and Seed tools, view audit logs and analytics, configure notification settings, and can re-provision the database with demo data. |
| **Examiner** | A role referenced in examination-related form templates (e.g. Appointment of Examiners, Examiner Summary CV). Examiners are external or internal academics nominated to evaluate a student's thesis. They do not have direct portal login access in the current implementation. |
| **HD Secretary** | The administrative person who receives finalised submissions for scheduling at committee meetings. Referenced in the Functional Specification §2.3.2 as the destination for coordinator-exported submission packages. |

### 1.3 Degree Programmes

| Term | Definition |
|------|-----------|
| **MSc** | **Master of Science** — a postgraduate research degree. One of the degree types available in form template dropdowns. |
| **MSc (Structured)** | A variant Master of Science programme with a coursework component alongside the research thesis. Distinguished from the pure research MSc in form templates. |
| **PhD** | **Doctor of Philosophy** — the highest postgraduate research degree. The most common degree type in the portal's HD request workflows. |
| **DPhil** | **Doctor of Philosophy** (alternate designation). Some institutions and departments use "DPhil" rather than "PhD"; both are included in form template options for compatibility. |
| **MA** | **Master of Arts** — a postgraduate research degree in humanities or social sciences. |
| **MCom** | **Master of Commerce** — a postgraduate research degree in business or economics disciplines. |

### 1.4 HD Request Types & Form Codes

The portal supports 20 official UWC Higher Degrees forms, each identified by a unique code:

| Code | Form Name | Description |
|------|-----------|-------------|
| **HDR-001** | Title Registration | Formal registration of a student's thesis title with the faculty. Initiates the student's official research record. |
| **HDR-002** | Progress Report | Periodic report (typically annual) documenting a student's research progress, milestones achieved, and supervisor assessments. |
| **HDR-003** | Intention to Submit | Declaration of a student's intent to submit their thesis for examination within the coming semester. |
| **HDR-004** | Extension of Registration | Request for additional registration time beyond the standard degree duration. Requires justification and supervisor endorsement. |
| **HDR-005** | Leave of Absence | Formal request for temporary leave from studies (medical, personal, or professional reasons). |
| **HDR-006** | Appointment of Examiners | Nomination of internal and external examiners for thesis evaluation. Includes proposed examiner details and justification. |
| **HDR-007** | Examiner Summary CV | Abbreviated curriculum vitae for each nominated examiner, demonstrating their expertise in the student's research area. |
| **HDR-008** | Change of Examiners | Request to replace one or more previously appointed examiners. Requires rationale and new nominee details. |
| **HDR-009** | Appointment of Arbiter | Formal appointment of an independent arbiter when examination reports are in significant disagreement. |
| **HDR-010** | Addition of Co-Supervisor | Request to add a co-supervisor to the student's supervisory team. Includes the proposed co-supervisor's details and expertise rationale. |
| **HDR-011** | Removal of Supervisor / Co-Supervisor | Request to remove a supervisor or co-supervisor from the supervisory team. Requires documented reasons and student/supervisor signatures. |
| **HDR-012** | Change of Thesis Title | Request to modify the registered thesis title. Common when research direction evolves during the degree. |
| **HDR-013** | Change of Supervisor / Co-Supervisor | Request to replace (rather than add or remove) a supervisor. Different from HDR-010/011 as it is a swap. |
| **HDR-014** | Readmission | Application for readmission after a period of deregistration or absence without approved leave. |
| **HDR-015** | Upgrade Masters to Doctoral | Request to convert a Master's registration to a doctoral programme, typically when research scope warrants a higher degree. |
| **HDR-016** | MOU (Memorandum of Understanding) | Inter-institutional agreement for collaborative supervision or shared research resources. |
| **HDR-017** | Prospective Supervisor Profile (ROTT) | **Register of Thesis Titles** — a supervisor profile form documenting research interests, current students, and available supervision capacity. |
| **HDR-018** | Supervisor Summative Report | Supervisor's comprehensive assessment of a student's overall progress and readiness for thesis submission. |
| **HDR-019** | NS Higher Degrees Cover | Faculty of Natural Sciences-specific cover form accompanying HD submissions to the committee. |
| **HDR-020** | FHD Submissions Checklist | Administrative checklist ensuring all required documents and approvals are present before committee consideration. |

### 1.5 Committee & Workflow Terms

| Term | Definition |
|------|-----------|
| **HD** | **Higher Degree** — the umbrella term for the postgraduate administrative processes managed by the portal. An "HD request" is a formal submission that moves through the approval workflow. |
| **FHD** | **Faculty Higher Degrees** — the faculty-level committee that reviews and makes initial decisions on HD requests. Possible outcomes: Approved, Recommended (to SHD), or Referred Back. |
| **FHDC** | **Faculty Higher Degrees Committee** — the full formal name of the FHD committee. appears in document headers and form templates. |
| **SHD** | **Senate Higher Degrees** — the senate-level committee that reviews requests recommended by FHD. SHD is the final decision authority. The system auto-advances to SHD when FHD outcome is "Approved" or "Recommended." |
| **HD Committee Cycle** | The complete multi-stage approval workflow a request follows: Draft → Submitted to Supervisor → Supervisor Review → Co-Supervisor Review → Coordinator Review → FHD → SHD → Approved/Recommended/Referred Back. |
| **Access Code** | A randomly generated 6-character alphanumeric code (e.g. `A3K9P2`) that secures each handoff step in the review workflow. When a student submits to a supervisor, or a supervisor forwards to a co-supervisor, a unique access code is generated and shared only with the sender and recipient. The code verifies that the correct person is acting on the request. |
| **Access Code Timer** | A countdown timer attached to each access code, typically 48 hours for supervisor review and 72 hours for general access. The timer is displayed in the UI but not automatically enforced server-side (enforcement requires Cloud Functions on the Blaze plan). An "expired" badge appears when the timer reaches zero. |
| **Approved** | A terminal committee outcome indicating the HD request has been fully endorsed. The request becomes read-only. |
| **Recommended** | An FHD outcome indicating the request is forwarded to SHD for final decision. Distinct from "Approved" in that further review is required. |
| **Referred Back** | A committee outcome indicating the request has deficiencies and is returned to the supervisor/student for amendment. Triggers a 24-hour amendment window. |
| **Reference Number** | A tracking identifier assigned by the coordinator after a committee decision (e.g. "FHD-2026-001"). Used for institutional record-keeping and cross-referencing. |
| **Refer-Back Workflow** | The process that occurs when a request is referred back by the committee: the coordinator records a reason, the supervisor receives a notification, and a 24-hour amendment timer begins. After amendment, the request re-enters the review cycle. |
| **Nudge** | A supervisor-initiated action that sends a reminder notification (both in-app and email) to a student, prompting them to take action on a pending request or milestone. |
| **Stagnation Alert** / **Stagnation Indicator** | A visual warning displayed when a request has remained in the same workflow state beyond an expected threshold. Helps coordinators and administrators identify bottlenecked submissions. |
| **Overdue Monitoring** | A filter available to coordinators and administrators that shows only requests exceeding their expected processing time. Accessible via the "Overdue Only" toggle on the HD Requests page. |
| **Committee Export** | CSV export functionality for coordinators to generate Faculty Board or Senate Board meeting agendas, including student names, student numbers, degree programmes, supervisors, submission dates, and current statuses. |
| **Digital Signature** | An electronic signature captured via the `SignaturePad` component, supporting both draw (freehand canvas) and type (cursive font preview) modes. Stored as image data within the request record. |

### 1.6 Academic Documents & Milestones

| Term | Definition |
|------|-----------|
| **Research Proposal** | A document outlining the student's intended research scope, methodology, and objectives. Typically submitted with early-stage HD requests. |
| **Literature Review** | A scholarly survey of existing research relevant to the student's thesis topic. Often a chapter or standalone document submitted for progress review. |
| **Ethics Clearance** | Formal approval from the university's ethics committee confirming the research meets ethical standards. Required before data collection begins. |
| **Ethics Application** | The form submitted to the ethics committee requesting clearance. Includes research design, participant information, and risk assessments. |
| **Informed Consent** | A document or form ensuring research participants are fully informed about the study and agree to participate voluntarily. Required for ethics clearance. |
| **Data Collection** | The phase of research involving gathering primary data (surveys, experiments, interviews). Relevant forms may require proof that ethics clearance was obtained before this phase. |
| **Academic Transcript** | An official university-issued record of a student's academic history, grades, and credits. May be required as a supporting document for certain HD requests. |
| **Turnitin Report** | A plagiarism detection report generated by the Turnitin software service, indicating the percentage of a document's content that matches existing sources. Required with thesis submissions. |
| **Medical Certificate** | A document from a healthcare provider supporting a Leave of Absence request due to medical reasons. |
| **Publication Evidence** | Proof of academic publications (journal articles, conference papers) submitted to support progress reports or examination readiness. |
| **Examiner Nomination** | The formal proposal of external or internal examiners for thesis evaluation, submitted via the Appointment of Examiners form. |
| **Supervisor Feedback** | Written commentary from the supervisor on a student's work. Captured in the Document Review system as structured comments or annotations. |
| **Milestones** | Academic and professional development achievements tracked for each student. Types include: conferences attended, journal club presentations, publications, workshops, and training courses. Stored in the Firestore `milestones` collection. |
| **Journal Club** | A regular academic gathering where members present and discuss published research papers. Recorded as a milestone type in the portal. |
| **Progress Report** | Both a form type (HDR-002) and a concept — a periodic assessment of a student's research trajectory, including completed work, challenges, and plans. |
| **Supported** / **Supported with Reservations** / **Not Supported** | The three possible supervisor recommendation values on a form, indicating the supervisor's endorsement level for the request. |
| **Recommended to FHD** / **Not Recommended** | Coordinator recommendation values indicating whether the request should proceed to the Faculty Higher Degrees Committee. |

---

## 2. Technology & Framework Terms

### 2.1 Core Stack

| Term | Definition |
|------|-----------|
| **React** | A JavaScript library for building user interfaces, developed by Meta. The portal uses React 19.2.0 with functional components and hooks (no class components). React enables the component-based architecture where each UI element is an independent, reusable piece. |
| **React 19** | The specific major version of React used. React 19 introduces automatic batching improvements, new hooks, and enhanced concurrent rendering. The portal leverages React 19's stable features without TypeScript. |
| **JSX** | **JavaScript XML** — a syntax extension that allows writing HTML-like markup directly within JavaScript code. React components return JSX, which is transformed into `React.createElement()` calls at build time by the Vite plugin. Example: `<button onClick={handleClick}>Submit</button>`. |
| **Vite** | A modern JavaScript build tool created by Evan You (creator of Vue.js). Vite 7.x provides near-instant dev server startup using native ES modules, Hot Module Replacement (HMR), and optimised production builds using Rollup. The portal uses Vite 7.3.1 as its build system. |
| **Node.js** | A JavaScript runtime built on Chrome's V8 engine that allows running JavaScript on the server/desktop. Required for development tooling (npm, Vite dev server, seed scripts). The project requires Node.js 18 or higher. |
| **npm** | **Node Package Manager** — the default package manager for Node.js. Used to install dependencies (`npm install`), run scripts (`npm run dev`), and manage the `package.json` configuration. |
| **CSS** | **Cascading Style Sheets** — the standard styling language for the web. The portal uses vanilla CSS (no preprocessors like SASS) with CSS custom properties (variables) for theming. |
| **JavaScript** / **JS** | The programming language used throughout the portal. All source code is plain JavaScript (`.js` / `.jsx` files) — no TypeScript is used at runtime, though `@types/react` is included as a development dependency for editor IntelliSense. |
| **HTML** | **HyperText Markup Language** — the standard markup for web pages. The portal's entry point is `index.html`, which loads the React application. |
| **JSON** | **JavaScript Object Notation** — a lightweight data interchange format. Used for form template schemas (prebuiltTemplates.js), Firestore document structures, package.json configuration, and API communication. |
| **ECMAScript** | The official standardisation of JavaScript by ECMA International. The portal targets ECMAScript 2020 (ES2020) as configured in ESLint, and uses ES Modules (`import`/`export`) rather than CommonJS (`require`). |
| **ES Modules** / **ESM** | **ECMAScript Modules** — the modern JavaScript module system using `import` and `export` keywords. The project declares `"type": "module"` in `package.json`, meaning all `.js` files are treated as modules by Node.js and Vite. |

### 2.2 Firebase / Google Cloud

| Term | Definition |
|------|-----------|
| **Firebase** | Google's Backend-as-a-Service (BaaS) platform that provides authentication, database, storage, hosting, and more — without requiring developers to manage server infrastructure. The portal uses Firebase SDK v12.9.0. |
| **Firebase Authentication** / **Firebase Auth** | Firebase's identity service. The portal uses email/password authentication. Key methods include `signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged` (state listener), and `sendPasswordResetEmail`. User UIDs from Auth are linked to Firestore user documents. |
| **Cloud Firestore** / **Firestore** | A flexible, scalable NoSQL cloud database from Google. Data is organised in collections (like tables) containing documents (like rows) with fields (like columns). The portal uses 11 Firestore collections. Key features used: real-time subscriptions (`onSnapshot`), compound queries, security rules, and offline persistence. |
| **Firebase Hosting** | Google's global CDN-backed static site hosting service. Provides automatic SSL certificates, custom domain support, and single-page application (SPA) routing via `rewrites`. Configured in `firebase.json`. |
| **Firebase Storage** / **Cloud Storage** | Object storage service for files (images, documents, PDFs). The portal configured Storage but encountered a region mismatch issue — the Firestore project was in `europe-west1` (Belgium) while the auto-created Storage bucket was in `us-central1`. Documents are currently served from `public/documents/` instead. |
| **Cloud Functions** | Server-side serverless compute on Google Cloud, triggered by HTTP requests, Firestore events, or schedules. **Not available on the Firebase Spark (free) plan.** This limitation affects automated timer enforcement, background email sending, and scheduled stagnation checks. |
| **Cloud Scheduler** | A Google Cloud service for running tasks on a cron schedule (e.g. daily at 08:00). Would be used for automated stagnation reminders and access code expiry enforcement. Requires Blaze plan. |
| **Pub/Sub** | **Publish/Subscribe** — a Google Cloud asynchronous messaging service. Enables event-driven architectures where producers publish messages to topics and subscribers process them independently. Referenced in the platform comparison as a Blaze-plan feature. |
| **Cloud Tasks** | A Google Cloud service for managing asynchronous task execution with retry logic. Would complement scheduled reminders and background processing. |
| **Firebase Extensions** | Pre-built backend logic that can be installed into Firebase projects (e.g. "Send Email with SendGrid" extension). Available on Blaze plan only. |
| **Firebase App Check** | A security feature that verifies incoming requests originate from genuine app installations, protecting backend resources from abuse and scraping. |
| **Firebase Remote Config** | A service for changing app behaviour and appearance remotely without deploying a new version. Could be used for feature flags or announcement banners. |
| **Firebase Cloud Messaging** / **FCM** | A cross-platform push notification service for web and mobile. Would enable real-time browser push notifications beyond the current in-app notification bell. |
| **Firebase Emulator Suite** | A set of local emulators that replicate Firebase services (Auth, Firestore, Functions, Hosting, Storage) on a developer's machine. Enables offline development and testing without incurring cloud costs. |
| **firebase-admin** | The Firebase Admin SDK for server-side (Node.js) usage. Provides privileged access to Firestore, Auth, and Storage with elevated permissions. Used in Cloud Functions or backend scripts. |
| **Google Cloud Platform** / **GCP** | Google's cloud computing infrastructure underlying Firebase. Firebase services run on GCP, and upgrading to the Blaze plan unlocks direct access to GCP services like Cloud Run, BigQuery, and Cloud Logging. |
| **Cloud Run** | A GCP service for running containerised applications. Potential alternative to Cloud Functions for more complex server-side logic. |
| **BigQuery** | Google Cloud's serverless data warehouse for large-scale analytics. Could be used for advanced reporting on portal usage data. |
| **Cloud Logging** / **Cloud Monitoring** | GCP's observability services for centralized log aggregation and metric tracking. Available on Blaze plan. |
| **Vertex AI** / **Gemini API** | Google Cloud's AI/ML platform and generative AI API. Mentioned as a potential integration for intelligent form assistance or automated document review. |
| **Google Workspace APIs** | APIs for Google's productivity suite (Drive, Calendar, Chat, Gmail). The Functional Specification references Google Drive (§2.4.5) and Google Chat (§4.3) integrations, which were not implemented due to OAuth/Workspace permission requirements. |
| **Google Calendar** | Google's calendar service. The specification mentions future integration for syncing committee meeting dates and submission deadlines. |
| **Google Drive** | Google's cloud document storage. Specified as the document repository (§2.4.5) but replaced with local document serving due to Firebase Storage region mismatch. |
| **Google Chat** | Google's team messaging platform. Specified for supervisor-student discussion (§4.3) but not implemented due to Workspace API permission requirements. |

### 2.3 Microsoft Azure

These terms appear in the Platform Comparison document evaluating Azure as a production migration target:

| Term | Definition |
|------|-----------|
| **Microsoft Azure** | Microsoft's cloud computing platform, evaluated as the production deployment target for the portal. Offers South African data centres (Johannesburg, Cape Town), which is critical for POPIA compliance. |
| **Azure Static Web Apps** / **SWA** | An Azure service for hosting static sites and single-page applications with integrated API support via Azure Functions. The React SPA would be deployed here. |
| **Azure AD B2C** | **Azure Active Directory Business-to-Consumer** — an identity service for customer/student-facing applications. Supports email/password, social login, and federation with institutional directories. |
| **Microsoft Entra External ID** | The new branding for Azure AD B2C under Microsoft's Entra identity platform. Same capability, updated naming. |
| **Azure Cosmos DB** | Microsoft's globally distributed NoSQL database, evaluated as the Firestore alternative. Offers an API-for-NoSQL that provides similar document-oriented data modelling. Key metric: **RU/s** (Request Units per second) for throughput. |
| **RU/s** | **Request Units per second** — the throughput metric for Azure Cosmos DB. Each database operation (read, write, query) consumes a measurable number of Request Units. Throughput is provisioned or autoscaled in RU/s. |
| **Azure Functions** | Microsoft's serverless compute platform, equivalent to Firebase Cloud Functions. Supports HTTP triggers, timer triggers (for scheduled tasks like stagnation checks), and queue triggers. Available in the Azure free tier. |
| **Azure Blob Storage** | Azure's object storage service for unstructured data (files, documents, images). The equivalent of Firebase Storage / Google Cloud Storage. |
| **Azure Communication Services** / **ACS** | An Azure service for sending transactional emails, SMS, and real-time communication. Would replace EmailJS for email notifications in a production deployment. |
| **Azure SignalR Service** / **SignalR** | An Azure service for real-time bidirectional communication between server and clients. Would replace Firestore's `onSnapshot` real-time subscriptions in an Azure deployment. |
| **Application Insights** | An Azure monitoring service for application performance management (APM). Provides request tracking, error diagnostics, and usage analytics. |
| **Azure Key Vault** | A secure secrets management service for storing API keys, connection strings, and certificates. Replaces the current `import.meta.env` client-side environment variables for sensitive configuration. |
| **MSAL.js** / **@azure/msal-browser** | **Microsoft Authentication Library** — the client-side SDK for authenticating users against Azure AD / Entra. Equivalent to Firebase Auth's client SDK. |
| **Azure Front Door** | A global CDN and load balancer with built-in SSL and DDoS protection. Provides the CDN layer equivalent to Firebase Hosting's global distribution. |
| **Azure Monitor** / **Log Analytics** / **Sentinel** | Azure's observability stack: Monitor for metrics and alerts, Log Analytics for log querying (KQL), and Sentinel for security information and event management (SIEM). |
| **Azure Policy** / **Management Groups** | Azure governance services for enforcing organisational compliance rules across resources and subscriptions. |
| **Azure RBAC** | Azure's built-in Role-Based Access Control for managing who can access Azure resources (distinct from the application-level RBAC the portal implements). |
| **Azure DevOps** | Microsoft's CI/CD and project management platform. Provides build pipelines, release management, and artifact hosting. |
| **Microsoft Graph API** | A unified API for accessing Microsoft 365 services (Outlook mail, Calendar, Teams, SharePoint, OneDrive). Would enable institution-wide integration. |
| **Microsoft Teams** | Microsoft's collaboration and chat platform. Could replace the specified Google Chat integration. |
| **SharePoint** / **OneDrive** | Microsoft's document management and cloud storage services, accessible via the Graph API. Could replace Google Drive for document repository requirements. |
| **Azure Notification Hubs** | A scalable push notification service for web, iOS, and Android. Azure equivalent of Firebase Cloud Messaging. |
| **Azure OpenAI** / **Cognitive Services** | Azure's AI services providing access to GPT models and other ML capabilities. Potential future integration for intelligent form assistance. |

### 2.4 Web Standards & Protocols

| Term | Definition |
|------|-----------|
| **HTTPS** | **HyperText Transfer Protocol Secure** — HTTP encrypted with TLS/SSL. All portal communication uses HTTPS. Firebase Hosting and Azure SWA provide automatic HTTPS with managed SSL certificates. |
| **SSL** / **TLS** | **Secure Sockets Layer** / **Transport Layer Security** — cryptographic protocols that encrypt data in transit between the browser and server. "SSL" is the colloquial term; modern implementations use TLS 1.2 or 1.3. |
| **CDN** | **Content Delivery Network** — a geographically distributed network of servers that caches and serves static content (HTML, CSS, JS, images) from locations close to the user, reducing latency. Firebase Hosting uses Google's global CDN. |
| **REST API** | **Representational State Transfer** — an architectural style for web APIs using HTTP methods (GET, POST, PUT, DELETE) with stateless request/response patterns. Azure services expose REST APIs; Firestore uses a real-time SDK rather than REST. |
| **OAuth 2.0** | An authorisation framework that allows applications to access user accounts on third-party services. The standard protocol for Google Chat, Google Drive, and Azure AD integrations. |
| **SAML** | **Security Assertion Markup Language** — an XML-based standard for exchanging authentication and authorisation data between an identity provider (like a university's AD) and a service provider (like the portal). Used for enterprise SSO. |
| **OIDC** | **OpenID Connect** — an identity layer built on top of OAuth 2.0 that provides user authentication (proving *who* the user is) alongside authorisation. Used by Azure AD B2C and Google Identity Platform. |
| **SSO** | **Single Sign-On** — an authentication scheme allowing users to log in once (e.g. with their university credentials) and access multiple applications without re-authenticating. Would be implemented via SAML/OIDC federation with UWC's Active Directory. |
| **SVG** | **Scalable Vector Graphics** — an XML-based vector image format. Used for the UWC logo (`uwc_logo.svg`) to ensure crisp rendering at any size, and for the guided tour mask overlay effect. |
| **HTML5 History API** | The browser API that enables SPA routing without full page reloads. `react-router-dom`'s `BrowserRouter` uses `history.pushState()` and `history.replaceState()` to update the URL bar while React handles the rendering. |
| **IndexedDB** | A browser-based NoSQL database for storing large amounts of structured data. Referenced as a potential offline storage mechanism for the portal. Firestore's `enablePersistence()` uses IndexedDB internally. |
| **Service Worker** | A browser script that runs in the background, enabling offline support, push notifications, and background sync. Would be needed for a Progressive Web App (PWA) version of the portal. |
| **iCal** | **Internet Calendar** format (`.ics`) — a standard for exchanging calendar data. Mentioned in the specification as a future integration for exporting committee meeting dates. |
| **Blob** | **Binary Large Object** — a data type representing raw binary data in the browser. Libraries like jsPDF return Blobs for generated PDF files, which can then be downloaded or displayed. |

---

## 3. Libraries & Packages

### 3.1 Production Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| **react** | 19.2.0 | The core React library for building component-based UIs. Provides hooks (`useState`, `useEffect`, `useContext`, etc.), the virtual DOM, and reconciliation algorithm. |
| **react-dom** | 19.2.0 | The React renderer for web browsers. Provides `createRoot()` for mounting the app and `createPortal()` for rendering components outside the normal DOM hierarchy (used by Modal and GuidedTour). |
| **react-router-dom** | 6.30.3 | The routing library for React SPAs. Provides `BrowserRouter`, `Routes`, `Route`, `Navigate`, `useNavigate`, `useLocation`, `useParams`, and `Outlet` for declarative, client-side navigation. |
| **firebase** | 12.9.0 | The Firebase JavaScript client SDK. Sub-modules used: `firebase/app` (initialisation), `firebase/auth` (authentication), `firebase/firestore` (database), and `firebase/storage` (file storage). |
| **react-pdf** | 10.3.0 | A React component library for displaying PDF documents. Uses Mozilla's PDF.js under the hood. The portal's `AnnotatedDocViewer` renders PDFs page-by-page with text layer support for annotation selection. |
| **pdfjs-dist** | 5.4 | **PDF.js** — Mozilla's JavaScript PDF rendering engine. A peer dependency of `react-pdf`. Processes PDF files and generates a text layer (`<span>` elements for each text segment) that enables text selection and highlight overlays. |
| **react-icons** | 5.5.0 | A consolidated icon library providing popular icon sets as React components. The portal exclusively uses the **Heroicons v2** set via `react-icons/hi2` (e.g. `HiOutlineDocumentText`, `HiOutlinePencilSquare`). |
| **@emailjs/browser** | 4.4.1 | The EmailJS client-side SDK for sending emails directly from the browser without a backend server. The portal uses it for all notification emails (submission confirmations, review requests, annotations, nudges). Limited to 200 emails/month on the free tier with a 2 requests/second rate limit. |
| **date-fns** | 4.1.0 | A modern JavaScript date utility library. Used in `helpers.js` for formatting dates, calculating relative times, and parsing timestamps. Preferred over the heavier Moment.js library. |
| **jsPDF** | 4.1.0 | A client-side JavaScript library for generating PDF documents. The portal's `pdfService.js` uses it to create printable PDF exports of HD requests with UWC branding, structured tables, and form data. |
| **jspdf-autotable** | 5.0.7 | A jsPDF plugin that auto-generates formatted tables in PDF documents. Used to render form data fields, weighted assessment tables, and submission summaries in PDF exports. |
| **docxtemplater** | 3.67.6 | A library for generating Word documents from templates. Uses PizZip for docx file manipulation. Part of the DOCX export toolchain. |
| **PizZip** / **pizzip** | 3.2.0 | A JavaScript library for reading, creating, and manipulating ZIP files. Required by docxtemplater since `.docx` files are ZIP archives containing XML. |
| **file-saver** | 2.0.5 | A client-side library for saving files. Provides the `saveAs(blob, filename)` function used to trigger browser download dialogs for generated PDFs and DOCX files. |

### 3.2 Development Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| **vite** | 7.2.4 | The build tool and dev server. In development, Vite serves files with native ES module imports and Hot Module Replacement (HMR). For production, it bundles the app using Rollup with tree-shaking, code splitting, and minification. |
| **@vitejs/plugin-react** | 5.1.1 | The official Vite plugin for React. Enables JSX transformation (converting JSX to JavaScript) and Fast Refresh (component-level HMR that preserves state during development). |
| **docx** | 9.5.1 | A library for programmatically creating Word documents from scratch (as opposed to template-based generation). Used in `docxExportService.js` to build structured DOCX files with headings, paragraphs, tables, headers, footers, and images. Key classes: `Document`, `Packer`, `Paragraph`, `TextRun`, `Table`, `TableRow`, `TableCell`, `Header`, `Footer`. |
| **eslint** | 9.39.1 | A static analysis tool for identifying problematic patterns in JavaScript code. The portal uses ESLint's flat config format (`eslint.config.js`) with plugins for React Hooks and React Refresh. |
| **eslint-plugin-react-hooks** | 7.0.1 | An ESLint plugin that enforces the Rules of Hooks — ensuring hooks are called at the top level and only from React functions. Prevents common bugs like conditional hook calls. |
| **eslint-plugin-react-refresh** | 0.4.24 | An ESLint plugin that ensures components are compatible with React Fast Refresh (HMR). Warns when component exports might prevent proper hot replacement during development. |
| **globals** | 16.5.0 | A package providing lists of global JavaScript variables for different environments (browser, Node.js). Used in `eslint.config.js` to tell ESLint about browser globals like `window`, `document`, and `console`. |
| **@types/react** / **@types/react-dom** | 19.2.x | TypeScript type definitions for React. Although the project uses plain JavaScript, these packages provide IntelliSense (autocomplete, type hints, documentation) in VS Code and other editors that support JSDoc-based type inference. |
| **pdf-lib** | 1.17.1 | A low-level PDF creation and modification library. Used in seed/generation scripts (`generate-docs-pdf.mjs`) to create realistic sample PDF documents for testing, not in the main application. |
| **exceljs** | 4.4.0 | A library for reading, creating, and streaming Excel spreadsheets. Used in seed scripts to generate sample `.xlsx` files (e.g. budget templates, data collection instruments). |

### 3.3 External Services

| Service | Description |
|---------|-------------|
| **EmailJS** | A third-party email delivery service that enables sending emails directly from client-side JavaScript without a backend. The portal sends transactional notifications (submission confirmations, review requests, annotation alerts, nudge reminders) via EmailJS. Configuration requires three environment variables: Service ID, Template ID, and Public Key. Free tier: 200 emails/month, 2 requests/second. |
| **Turnitin** | A plagiarism detection and academic integrity service used by universities. Not directly integrated but referenced as a document type — Turnitin Reports are uploaded as supporting documents with thesis submissions. |
| **JotForms** | An online form builder service originally specified (§2.1.1) for HD request data capture. **Replaced** in the implementation by the native Dynamic Form System, which provides tighter integration, offline capability, consistent UWC branding, and full control over validation. |

---

## 4. Architecture & Design Patterns

### 4.1 Application Architecture

| Term | Definition |
|------|-----------|
| **SPA** | **Single-Page Application** — a web application that loads a single HTML page and dynamically updates content via JavaScript as the user navigates. The portal renders entirely in the browser using React; only the initial `index.html` and JavaScript bundle are fetched from the server. Navigation between pages (Dashboard, HD Requests, Students, etc.) happens client-side without full page reloads. |
| **RBAC** | **Role-Based Access Control** — a security model where access permissions are assigned to roles rather than individual users. The portal uses four roles (Student, Supervisor, Coordinator, Admin), each with distinct permissions. Enforced via `ProtectedRoute` in `App.jsx` and Firestore Security Rules. |
| **CRUD** | **Create, Read, Update, Delete** — the four basic operations on persistent data. Applied to HD requests, calendar events, form templates, milestones, and notifications throughout the portal. |
| **State Machine** | A computational model where a system exists in exactly one state at any time, with defined transitions between states. The HD request workflow is a state machine: each request has a single status (`draft`, `submitted_to_supervisor`, `supervisor_review`, etc.) and transitions follow strict rules. State changes are logged in the audit trail. |
| **Serverless** | An architecture model where the cloud provider manages all server infrastructure. The developer writes application code without provisioning, scaling, or maintaining servers. Firebase (Spark) provides serverless authentication, database, and hosting. Azure Functions provide serverless compute. |
| **NoSQL** | **Not Only SQL** — a category of databases that don't use the traditional relational table/row/column model. Firestore is a document-oriented NoSQL database where data is stored in collections of JSON-like documents. Advantages: flexible schemas, horizontal scaling, real-time subscriptions. |
| **Client-Side Rendering** / **CSR** | A rendering strategy where the browser downloads JavaScript, executes it, and constructs the page DOM. All portal rendering happens client-side — the server delivers static files only. Contrasts with Server-Side Rendering (SSR) used by frameworks like Next.js. |
| **Event-Driven Architecture** | A pattern where actions trigger events that other components react to. In the portal, submitting a request triggers notification creation and email sending; annotations trigger notification events; workflow state changes trigger audit log entries. |
| **Schema-Driven Forms** | An architecture where form layout and validation are defined by JSON schema objects rather than hardcoded JSX. The portal's 20 form templates are JSON schemas interpreted by `DynamicFormRenderer`, enabling template changes without code modifications. |
| **Modular Codebase** | The separation of code into distinct, focused directories: `context/` (state management), `pages/` (views), `components/` (shared UI), `firebase/` (data layer), `services/` (email/PDF), `utils/` (constants/helpers). This structure supports the Single Responsibility Principle. |

### 4.2 React Patterns

| Term | Definition |
|------|-----------|
| **Context** / **React Context** | React's built-in global state management API. The portal uses four contexts: `AuthContext` (authentication state), `DataContext` (Firestore data and operations), `ThemeContext` (dark/light mode), and `TourProvider` (guided walkthrough state). Contexts eliminate "prop drilling" by making state available to any descendant component. |
| **Provider Pattern** | A React pattern where a Context Provider component wraps the application tree, making its value available to all children via `useContext()`. The portal nests providers: `ThemeProvider` → `AuthProvider` → `DataProvider` → `TourProvider` → `App`. |
| **Protected Route** | A route-wrapping component (`ProtectedRoute` in `App.jsx`) that checks authentication status and role before rendering the target page. If the user is not authenticated, they're redirected to `/login`. If their role doesn't match `allowedRoles`, they see an access-denied state. |
| **Custom Hooks** | Functions that encapsulate reusable logic using React hooks. The portal defines `useAuth()` (returns auth state and methods), `useData()` (returns Firestore data and CRUD functions), and other context-consuming hooks. |
| **Barrel Export** | A pattern where an `index.js` or `index.jsx` file re-exports components from a directory, simplifying imports. `components/common/index.jsx` exports `Modal`, `Card`, `StatusBadge`, `Avatar`, `EmptyState`, `LoadingSpinner`, and `SignaturePad`. `components/forms/index.js` exports all form-related components. |
| **createPortal** | A React DOM function that renders a component outside its parent DOM hierarchy, directly into a specified DOM node (typically `document.body`). Used by `Modal` (to escape `overflow: hidden` containers) and `GuidedTour` (to render overlay on top of everything). |
| **React Hooks** | Functions used in functional React components to manage state and side effects. Hooks used in the portal: `useState` (local state), `useEffect` (side effects/lifecycle), `useCallback` (memoised callbacks), `useMemo` (memoised values), `useRef` (mutable refs), `useContext` (context consumption), `useNavigate` (programmatic routing), `useLocation` (current URL). |
| **Fast Refresh** / **HMR** | **Hot Module Replacement** — a Vite development feature that updates React components in the browser without losing state when source files are saved. Enables rapid iteration during development. Configured via `@vitejs/plugin-react`. |

### 4.3 Data Patterns

| Term | Definition |
|------|-----------|
| **Real-Time Subscriptions** | Firestore's `onSnapshot()` pattern where the client registers a listener on a collection or document and receives automatic updates whenever data changes. The portal's `DataContext` subscribes to all 11 collections on mount, providing instant UI updates when any user modifies data. |
| **Subcollection vs Embedded Array** | A Firestore data modelling decision. Subcollections are separate nested collections that require additional reads; embedded arrays store related data within the parent document. The portal chose embedded arrays for comments and feedback (fewer reads, simpler subscriptions) at the cost of the 1MB document size limit. |
| **Batch Update** | A Firestore operation that atomically writes multiple changes in a single round-trip. Used in the annotation "confirm and send" workflow to update all draft annotations to "sent" status simultaneously. |
| **Auto-Save with Debounce** | A UX pattern where changes are automatically saved after a delay. The Form Builder uses a 3-second debounce: after each edit, a timer starts; if another edit occurs within 3 seconds, the timer resets. The save only fires when the user stops editing for 3 seconds. |
| **Immutable Versions** | A data integrity pattern where each document version is preserved and cannot be modified after creation. When changes are requested, a new version is created; the previous version's status becomes "superseded." |
| **Singleton** | A design pattern ensuring only one instance of an object exists. The Firebase app and Firestore/Auth/Storage instances are initialised once in `config.js` and reused throughout the application — never re-created per component. |

### 4.4 UI Patterns

| Term | Definition |
|------|-----------|
| **Drag-and-Drop** | A UI interaction pattern where users click and hold an element, move it to a new position, and release. Used in the Form Builder for reordering form sections and in the Header/Footer Editor for reordering elements. Implemented using the HTML5 Drag and Drop API (`draggable`, `onDragStart`, `onDragOver`, `onDragEnd`). |
| **Popover** | A small overlay UI element that appears near a user interaction target. In the PDF Annotation Engine, an "Annotate" button popover appears near the text selection when the user highlights text. |
| **Overlay** | A full-screen or partial-screen layer rendered on top of the main content. Used for the guided tour system (SVG mask with spotlight cutout), locked section indicators, and modal backgrounds. |
| **SVG Mask Highlighting** | The guided tour technique where a full-screen SVG with a darkened background has a transparent "cutout" that reveals the target element. Creates a spotlight effect that draws user attention to the highlighted area. |
| **Status Badge** | A small coloured label indicating the current state of a request, document version, or annotation (e.g. "Draft" in amber, "Approved" in green, "Under Review" in blue). Implemented as the `StatusBadge` component. |
| **Colour Picker** | A UI control for selecting colours. Used in the annotation system (highlight colour selection) and Header/Footer Editor (gradient presets, custom colour inputs). Uses the native HTML `<input type="color">` element. |
| **Star Rating** | A visual rating control using 1–5 stars. Used in the document feedback system for the five evaluation criteria (Research Quality, Academic Writing, Methodology, Completeness, Formatting). |

---

## 5. Project-Specific Terms

### 5.1 Core Features

| Term | Definition |
|------|-----------|
| **PostGrad Portal** | The formal name of the application — "UWC Postgraduate Request Portal." A web-based system for digitising the Faculty of Natural Sciences' Higher Degree administrative processes. |
| **Dynamic Form System** | The schema-driven form rendering engine supporting 15 field types and 20 prebuilt templates (HDR-001 through HDR-020). Forms are defined as JSON schemas interpreted by `DynamicFormRenderer`. Supports auto-population, conditional visibility, locked sections, weighted tables, repeater groups, and digital signatures. |
| **Form Builder** | A full-screen admin-only page (`/form-builder`) for visually editing form template schemas. Features a three-panel layout (template list, editor, live preview), drag-and-drop section reordering, field CRUD, template metadata editing, and auto-save with 3-second debounce. |
| **Header/Footer Editor** | An element-based visual editor for customising document headers and footers in form templates. Supports 6 element types (image, text, title, label, date, separator) with per-element property editing. Features gradient preset swatches, custom colour pickers, angle sliders, and "Apply to All Templates" branding propagation. |
| **PDF Annotation Engine** | A full-screen PDF viewer (`AnnotatedDocViewer`) with text-selection-based annotations, colour-coded highlights, reply threads, resolve/reopen functionality, and a batch "draft → confirm → send" workflow. Built on `react-pdf`. |
| **Document Review & Version Control** | A system (`DocumentReviewPage`) for managing multiple versions of uploaded documents. Each version is immutable with comments, structured feedback (5-criteria ratings), and a status workflow (submitted → under review → changes/approved → superseded). |
| **Submission Tracker** | A visual progress bar component (`SubmissionTracker`) showing the multi-step HD request workflow. Highlights the current step, shows timestamps and response timers, and indicates the current "owner" (which role is responsible for the next action). |
| **Guided Tour System** | An overlay-based walkthrough engine (`GuidedTour`) providing step-by-step interactive tutorials. Features SVG mask highlighting, auto-scrolling, click-to-proceed advancement, and cross-page navigation. 13 tours total: 4 full-system tours (one per role) and 9 task-specific tours. |
| **Notification System** | Combines in-app notifications (Firestore `notifications` collection with real-time subscription, bell icon, unread count, mark-as-read) and email notifications (EmailJS for all cross-user actions). |
| **DOCX Export** | Client-side Microsoft Word document generation from filled form data using the `docx` library. Exports include a UWC-branded header, structured sections, field values, tables, and signature placeholders. |
| **Seed / Re-Seed** | Database provisioning functionality. Seed scripts (`scripts/seed-firebase.mjs`, `reseed-firebase.mjs`) and the admin Seed Page (`/admin/seed`) populate Firestore with demo data: 7 user accounts, HD requests, calendar events, milestones, notifications, document versions, annotations, and form templates. |
| **Dark/Light Mode** | A complete dual-theme system managed by `ThemeContext`. The user's preference is persisted in `localStorage` under the key `pgportal-theme`. The `data-theme` HTML attribute triggers CSS custom property overrides for all components. |

### 5.2 Components & Pages

| Component / Page | Description |
|-----------------|-------------|
| **DynamicFormRenderer** | The core form rendering component that interprets JSON template schemas and renders appropriate form fields. |
| **FormFieldRenderer** | A dispatcher component that maps field `type` values (text, textarea, select, radio, checkbox, date, email, tel, number, file, keywords, table, weighted-table, repeater-group, signature) to their corresponding input components. |
| **FormSignatureBlock** | A component for capturing digital signatures within forms, wrapping the `SignaturePad` component with form-specific layout. |
| **KeywordsTagInput** | A tag-style input component where users type keywords and press Enter to add them as removable tags. |
| **WeightedTableField** | A table component with configurable criteria rows and weighting. Used for assessment rubrics in certain HD forms. |
| **RepeaterGroupField** | A dynamic field group that allows users to add or remove multiple instances of a set of fields (e.g. multiple publications, multiple co-supervisors). |
| **LockedSectionOverlay** | A semi-transparent overlay rendered over form sections that are locked (read-only) for the current user's role, with a lock icon and explanatory text. |
| **SignaturePad** | A dual-mode signature component supporting draw (HTML Canvas freehand drawing) and type (cursive font preview with text input) modes. |
| **AnnotatedDocViewer** | The full-screen PDF viewer with annotation capabilities (~885 lines). Sub-components include `HighlightOverlay` and `AnnotationCard`. |
| **HeaderFooterPreview** | A live preview sub-component within the Header/Footer Editor that renders the current configuration with real styles and content. |
| **ProtectedRoute** | A routing wrapper component in `App.jsx` that enforces authentication and role-based access before rendering the target page. |
| **StudentDashboard** / **SupervisorDashboard** / **CoordinatorDashboard** / **AdminDashboard** | Four role-specific dashboard components providing tailored overview cards, statistics, and action links for each user role. |

### 5.3 Workflow States

The HD request state machine defines these states (from `constants.js`):

| State Key | Display Label | Description |
|-----------|--------------|-------------|
| `draft` | Draft | The request has been started but not yet submitted. Editable by the student. |
| `submitted_to_supervisor` | Submitted | The student has submitted the request and an access code has been generated for the supervisor. |
| `supervisor_review` | Supervisor Review | The primary supervisor is actively reviewing, editing, or signing the request. |
| `co_supervisor_review` | Co-Supervisor Review | The request has been forwarded to the co-supervisor(s) for sequential review and signing. |
| `coordinator_review` | Coordinator Review | The postgraduate coordinator is reviewing the fully signed request before committee submission. |
| `fhd_pending` | Faculty Board Pending | The request is on the FHD committee agenda, awaiting a decision. |
| `shd_pending` | Senate Board Pending | The request is on the SHD committee agenda (either auto-advanced from FHD "Approved" or via FHD "Recommended"). |
| `approved` | Approved | The request has been fully approved by the relevant committee. Terminal state — the request becomes read-only. |
| `recommended` | Recommended | The request has been recommended (a variant of approval with conditions). Terminal state. |
| `referred_back` | Referred Back | The committee has returned the request for amendments. A 24-hour amendment window begins, and the request re-enters the review cycle. |

### 5.4 Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `users` | User profiles with `uid`, `name`, `email`, `role`, and metadata. Linked to Firebase Authentication UIDs. |
| `hdRequests` | Higher Degree request records with status, type, student/supervisor references, access codes, form data, timestamps, and workflow history. |
| `calendarEvents` | Calendar entries with title, date, description, type (deadline, meeting, event), and role visibility. |
| `milestones` | Student academic milestones (conferences, publications, training) with dates and descriptions. |
| `notifications` | In-app notification records with recipient, type, message, read status, and navigation link. Real-time subscription delivers instant updates to the notification bell. |
| `studentProfiles` | Extended student information including degree programme, thesis title, enrolment year, and supervisor assignments. |
| `auditLogs` | Timestamped records of every significant system action: who did what, when, from which state to which state. Powers the admin Audit Logs page with search and CSV export. |
| `documentVersions` | Document version records with version number, status, uploaded files, comments (array), and structured feedback (array). |
| `annotations` | PDF text annotations with selected text, page number, highlight colour, comment, replies (array), status (draft/sent), and resolved flag. |
| `formTemplates` | JSON schema definitions for form templates. Each document contains the template type, title, sections with fields, and header/footer configuration. |
| `formSubmissions` | Saved form data submissions linked to HD requests and form templates, with field values and submission metadata. |

### 5.5 Branding & Theming

| Term | Definition |
|------|-----------|
| **UWC Navy** (`#003366`) | The primary brand colour used throughout the portal for headers, navigation, accent elements, and form backgrounds. Defined as `--uwc-navy` in CSS custom properties. |
| **UWC Gold** (`#C5A55A` / `#CC9900`) | The secondary brand colour used for accent bars, highlights, hover effects, and decorative elements. `#C5A55A` is the primary shade; `#CC9900` is an alternate. Defined as `--uwc-gold`. |
| **CSS Custom Properties** / **CSS Variables** | Named variables defined in CSS using `--variable-name` syntax and consumed via `var(--variable-name)`. The portal defines 50+ variables for colours, typography, spacing, and shadows, enabling the dark/light theme system. |
| **`data-theme` Attribute** | An HTML attribute set on the `<html>` element (`data-theme="dark"` or `data-theme="light"`) that triggers CSS selector overrides for all themed elements. |
| **`pgportal-theme`** | The `localStorage` key storing the user's theme preference ("dark" or "light"). Read on app initialisation by `ThemeContext` to restore the preferred theme. |
| **Inter** | The sans-serif typeface used throughout the portal's web interface. Specified via `var(--font-family, 'Inter', sans-serif)`. |
| **Times New Roman** | The serif typeface used in generated DOCX exports to match academic document conventions. |
| **Helvetica** | The sans-serif typeface used in generated PDF exports via jsPDF. |
| **Heroicons v2** | The icon design system used throughout the portal, accessed via `react-icons/hi2`. Provides outline-style icons (e.g. `HiOutlineDocumentText`, `HiOutlineArrowPath`) for UI elements. |
| **Gradient Presets** | A set of 10 predefined background gradients in the Header/Footer Editor (UWC Navy, Dark Navy, Ocean, Slate, Charcoal, Forest, Burgundy, Solid Navy, Light Grey, White) providing one-click branding options. |

---

## 6. Security & Compliance

### 6.1 Data Protection Laws

| Term | Definition |
|------|-----------|
| **POPIA** | **Protection of Personal Information Act** — South Africa's comprehensive data protection legislation, effective since 1 July 2021. Modelled on the EU's GDPR, it regulates how personal information is collected, processed, stored, and shared. Key principles include purpose specification, processing limitation, information quality, security safeguards, and data subject participation rights. The portal handles student personal information (names, student numbers, contact details, academic records) and must comply with POPIA. |
| **GDPR** | **General Data Protection Regulation** — the European Union's data protection regulation (effective May 2018). POPIA is substantially aligned with GDPR. Relevant because the portal's Firestore data currently resides in `europe-west1` (Belgium), which is within the EU. |
| **Trans-Border Data Transfer** | POPIA §72 restricts the transfer of personal information outside South Africa unless the recipient country provides adequate data protection. This is a key consideration for the Firebase deployment (data in Belgium) and drives the recommendation for Azure's South Africa regions. |
| **Data Residency** | The physical geographic location where personal data is stored. Critical for POPIA compliance. Firebase Spark plan data is in `europe-west1` (Belgium); Azure offers `South Africa North` (Johannesburg) and `South Africa West` (Cape Town). |
| **Processing Limitation** | POPIA §9–12 — personal information may only be processed for a specific, explicitly defined purpose, and processing must be adequate, relevant, and not excessive. |
| **Purpose Specification** | POPIA §13–14 — the purpose for which personal information is collected must be clearly defined at or before the time of collection. |
| **Information Quality** | POPIA §16 — the responsible party must take reasonable steps to ensure personal information is complete, accurate, and not misleading. |
| **Security Safeguards** | POPIA §19 — appropriate technical and organisational measures must be implemented to prevent loss, damage, or unauthorised access to personal information. |
| **Data Subject Rights** | POPIA §23–25 — individuals have the right to access their information, request corrections, and object to processing. The portal supports this via role-based data access and the admin audit trail. |

### 6.2 Security Mechanisms

| Term | Definition |
|------|-----------|
| **Firestore Security Rules** | Declarative rules written in `firestore.rules` that execute on Google's servers to control read/write access to Firestore documents. Rules use the `request.auth` object to verify authentication and user claims. The portal defines helper functions (`isAuthenticated()`, `isAdmin()`, `isCoordinator()`, `isStaff()`) for role checking. |
| **Storage Security Rules** | Similar to Firestore rules but for Cloud Storage, defined in `storage.rules`. The portal enforces a 10MB upload size limit (`request.resource.size < 10 * 1024 * 1024`) and requires authentication for all reads and writes. |
| **Role-Based Access** | The application-level RBAC system. Each user document in Firestore has a `role` field. The `ProtectedRoute` component checks this field against allowed roles for each page. The sidebar navigation dynamically filters items based on the current user's role. |
| **Audit Log** / **Audit Trail** | A comprehensive, timestamped record of every significant system action. Each entry logs: actor (user ID, name, role), action type, target entity, timestamp, previous state, new state, and additional metadata. Stored in the `auditLogs` Firestore collection. Powers the admin Audit Logs page with search, date filtering, and CSV export. |
| **Access Code Security** | The 6-character alphanumeric access codes ensure that only the intended recipient can act on a request during each workflow handoff. Codes are generated randomly, visible only to sender and recipient, and have expiry timestamps. |
| **Multi-Factor Authentication** / **MFA** | Authentication requiring two or more verification methods (password + SMS code, authenticator app, or FIDO2 key). Not implemented in the current Firebase Auth setup but supported by Azure AD B2C for production deployment. |
| **FIDO2** | A passwordless authentication standard using hardware security keys or biometrics (fingerprint, face recognition). Supported by Azure AD B2C / Entra for enterprise authentication scenarios. |
| **Conditional Access** | An Azure AD feature that enforces access policies based on conditions (location, device, risk level). Can require MFA for certain actions or block access from untrusted locations. |

### 6.3 Compliance Standards

| Term | Definition |
|------|-----------|
| **SOC 1 / SOC 2 / SOC 3** | **Service Organization Controls** — audit frameworks that evaluate a service provider's controls over financial reporting (SOC 1), security/availability/processing integrity/confidentiality/privacy (SOC 2), and general-use reporting (SOC 3). Both Firebase/GCP and Azure hold SOC certifications. |
| **ISO 27001** | An international standard for Information Security Management Systems (ISMS). Requires organisations to systematically manage sensitive information. Both cloud platforms are ISO 27001 certified. |
| **HIPAA** | **Health Insurance Portability and Accountability Act** — a US law protecting health information. While not directly applicable to UWC, it indicates a cloud provider's capability for handling sensitive data. Azure offers HIPAA BAAs (Business Associate Agreements). |
| **FedRAMP** | **Federal Risk and Authorization Management Program** — a US government programme for standardizing cloud security assessment. Indicates a high security bar. Azure has FedRAMP High authorization. |
| **PCI DSS** | **Payment Card Industry Data Security Standard** — security standards for handling credit card data. Both cloud platforms are PCI DSS compliant. Not directly relevant to the portal but demonstrates provider security maturity. |

---

## 7. Research Methodology

### 7.1 DSRM Concepts

| Term | Definition |
|------|-----------|
| **DSRM** | **Design Science Research Methodology** — the core research methodology guiding this project. DSRM focuses on creating and evaluating IT artefacts (systems, models, methods) that address identified problems. It follows iterative cycles of design, development, and evaluation. |
| **Artefact** | In Design Science Research, the designed and developed system that addresses the research problem. The PostGrad Portal is the artefact — a purpose-built IT system for digitising postgraduate HD administrative processes. |
| **Iteration** | A complete DSRM cycle of design, build, and evaluate. The portal has undergone five iterations: (1) UI Prototype with mock data, (2) Firebase Migration for persistence, (3) Document Review + Notifications, (4) Help System + Theming + Documentation, (5) Dynamic Forms + Form Builder + Platform Evaluation. |
| **Functional Specification** | The authoritative requirements document authored as part of the research process. It defines user roles, system modules, workflow logic, committee decision logic, suggested enhancements, and non-functional requirements. All implementation decisions trace back to this specification. |
| **Rapid Prototyping** | An approach where a functional prototype is built quickly to test concepts, gather feedback, and iterate. Firebase's serverless nature enabled rapid prototyping of the portal without backend infrastructure setup. |

### 7.2 Evaluation Terms

| Term | Definition |
|------|-----------|
| **Traceability** | The ability to link each implemented feature back to its originating specification requirement. The `SYSTEM_VS_SPECIFICATION.md` document provides a systematic traceability analysis for all 63 specification requirements. |
| **Completeness** | An evaluation criterion measuring how many specification requirements have been addressed. The portal achieves 94% completeness (73% fully implemented, 21% partially implemented). |
| **Fidelity** | An evaluation criterion measuring how closely the implementation matches the specification's intent. Even "partially implemented" features preserve the core functional intent; limitations are in automated enforcement (timers, schedulers) rather than user-facing capability. |
| **Transparency** | An evaluation criterion measuring how clearly the system's behaviour and rationale are documented. Supported by the audit trail, guided tours, help documentation, and this comprehensive documentation suite. |
| **Specification Compliance** | The measured percentage of requirements met. The summary matrix shows 46/63 fully implemented (73%), 13/63 partially (21%), 4/63 not implemented (6%). |
| **Beyond-Spec Features** | Features implemented that go beyond the original Functional Specification, added based on DSRM iteration findings, usability analysis, or modern application best practices. Currently 14+ beyond-spec features (PDF Annotation Engine, Dark Mode, Form Builder, Guided Tours, etc.). |
| **User Acceptance Testing** / **UAT** | The evaluation phase where end users (students, supervisors, coordinators, administrators) interact with the system and validate that it meets their needs. Planned as Phase 3 of the recommended Azure migration (from the Platform Comparison). |
| **Decision Matrix** | A weighted comparison table used to objectively evaluate alternatives against defined criteria. Used in the Platform Comparison to evaluate Firebase Spark vs. Blaze vs. Azure with weighted scores for cost, features, compliance, and developer experience. |
| **Edge Cases** | Unusual or boundary scenarios that the system must handle correctly (e.g. a student with no supervisor, a request with zero co-supervisors, committee outcomes for already-approved requests). |
| **ERD** | **Entity Relationship Diagram** — a diagram showing the relationships between data entities (users, requests, documents, notifications, etc.). Recommended in the Functional Specification for documenting the data model. |
| **User Stories** / **Epics** | Agile requirement formats. A user story describes a feature from the user's perspective ("As a supervisor, I want to annotate PDFs so I can give precise feedback"). An epic is a collection of related user stories. Referenced in the Functional Specification's additional insights. |

---

## 8. Deployment & Infrastructure

### 8.1 Hosting & Plans

| Term | Definition |
|------|-----------|
| **Firebase Spark Plan** | The free tier of Firebase. Provides: 1GB Firestore storage, 50K reads/20K writes per day, 1GB Firebase Hosting, 10GB bandwidth/month, 50K Auth verifications/month. **Limitations**: no Cloud Functions, no Cloud Scheduler, no Extensions, no Pub/Sub. This is the portal's current deployment plan. |
| **Firebase Blaze Plan** | Firebase's pay-as-you-go plan. Includes everything in Spark plus: Cloud Functions, Cloud Scheduler, Pub/Sub, Cloud Tasks, Extensions, unlimited Firestore operations (billed), 10GB free Hosting, and higher Auth limits. Recommended as an intermediate upgrade before Azure migration. |
| **Vercel** | A cloud platform optimised for deploying frontend applications. The portal includes a `vercel.json` configuration with rewrites (`/(.*) → /index.html`) for SPA routing and `dist` as the output directory. |
| **Firebase Hosting** | Google's global CDN-backed static file hosting. The portal's `firebase.json` configures SPA rewrites (all routes → `index.html`) and specifies `dist` as the deploy directory. |

### 8.2 Regions & Data Residency

| Term | Definition |
|------|-----------|
| **europe-west1** | A Google Cloud region in **Belgium**. The portal's Firestore database is currently located here. While within the EU (GDPR-compliant), it is geographically distant from South Africa (~9,500km), introducing 150–200ms latency and raising POPIA trans-border transfer questions. |
| **us-central1** | A Google Cloud region in **Iowa, USA**. The Firebase Storage bucket was auto-created here despite the Firestore project being in europe-west1, causing a cross-region mismatch that is suboptimal for performance. |
| **South Africa North** (Johannesburg) | An Azure data centre region. Provides <5ms latency for South African users and addresses POPIA data residency requirements. Recommended as the primary production region. |
| **South Africa West** (Cape Town) | An Azure data centre region suitable for disaster recovery (paired with South Africa North). Provides geographic redundancy within the country. |
| **Geo-Replication** | Distributing data copies across multiple geographic regions for low-latency global access and disaster recovery. Azure Cosmos DB supports multi-region writes and automatic failover. |

### 8.3 Build & Configuration

| Term | Definition |
|------|-----------|
| **`import.meta.env`** | Vite's mechanism for exposing environment variables to client-side code. Variables prefixed with `VITE_` in `.env` files are available via `import.meta.env.VITE_*`. Used for Firebase and EmailJS configuration. |
| **`.env`** / **`.env.example`** | Environment variable files. `.env` contains actual secrets (not committed to git); `.env.example` lists required variables with placeholder values for developer reference. |
| **`dist`** | The output directory Vite generates during a production build (`npx vite build`). Contains the minified HTML, CSS, and JavaScript files ready for deployment. Both `vercel.json` and `firebase.json` reference this directory. |
| **`firebase.json`** | The Firebase project configuration file. Specifies hosting settings (public directory, SPA rewrites, headers), Firestore rules file path, and Storage rules file path. |
| **`firestore.rules`** | The Firestore Security Rules file. Written in Firebase's custom rules language, it controls which users can read/write which documents. Deployed via `firebase deploy --only firestore:rules`. |
| **`storage.rules`** | The Cloud Storage Security Rules file. Controls file upload/download access and enforces a 10MB size limit. |
| **`vercel.json`** | Vercel deployment configuration. Contains `rewrites` for SPA routing (all paths → `/index.html`) and specifies `dist` as the output directory. |
| **`vite.config.js`** | The Vite build configuration. Imports `@vitejs/plugin-react` for JSX transformation and Fast Refresh, and can define build options, aliases, and proxy settings. |
| **`eslint.config.js`** | ESLint flat configuration file (ESLint 9+ format). Defines JavaScript/JSX linting rules, browser globals, React Hooks rules, and React Refresh compatibility checks. |
| **`rules_version`** | The version identifier at the top of Firestore and Storage rules files (currently `'2'`). Specifies which rules language features are available. |

### 8.4 Pricing & Operations

| Term | Definition |
|------|-----------|
| **DAU** | **Daily Active Users** — a metric counting unique users per day. Relevant for Firebase Authentication (Spark: 50K DAU limit) and capacity planning. |
| **MAU** | **Monthly Active Users** — a metric counting unique users per month. Used in Firebase Blaze billing for Auth ($0.0055/MAU after 50K free) and in Azure AD B2C pricing (50K free/month). |
| **Free Tier** | The no-cost allocation of cloud services. Firebase Spark plan is a free tier; Azure also provides free tier quotas (400 RU/s Cosmos DB, 250K function executions/month, 100GB bandwidth). |
| **Pay-As-You-Go** | A billing model where you only pay for resources consumed, with no upfront commitment. Firebase Blaze plan and most Azure services use this model. |
| **Reserved Capacity** | An Azure pricing option where committing to a specific level of resource consumption (e.g. Cosmos DB RU/s) for one or three years yields a 20–65% discount over pay-as-you-go rates. |
| **Spending Cap** / **Budget Alerts** | Cost control mechanisms. Firebase allows budget alerts (email when approaching a threshold). Azure supports both budget alerts and spending caps that can automatically stop resources when a limit is reached. |
| **Enterprise Agreement** | A volume licensing agreement between Microsoft and large organisations (like universities). Provides discounted Azure pricing, dedicated support, and compliance commitments. UWC may already have an Enterprise Agreement through TENET (South Africa's academic network). |
| **SLA** | **Service Level Agreement** — a formal commitment from a cloud provider guaranteeing a minimum uptime percentage (e.g. 99.9% or 99.99%). Both Firebase and Azure provide SLAs for their respective services. |
| **Uptime** | The percentage of time a service is operational and accessible. The Functional Specification targets 99% uptime, which is easily met by both Firebase and Azure. |
| **CI/CD** | **Continuous Integration / Continuous Deployment** — automated pipelines that build, test, and deploy code changes. Azure DevOps, GitHub Actions, and Firebase CLI all support CI/CD workflows. The portal currently deploys manually via `firebase deploy` or Vercel git integration. |
| **GitHub Actions** | GitHub's built-in CI/CD service. Can automate building, testing, and deploying the portal on every git push. Referenced in the Platform Comparison for Azure SWA deployment. |
| **Phased Approach** | A recommended strategy for migrating from Firebase to Azure in stages rather than all at once: Phase 1 (infrastructure), Phase 2 (parallel running), Phase 3 (UAT + data migration), Phase 4 (production cutover). |
| **Production Cutover** | The moment when the primary system switches from the old platform (Firebase) to the new platform (Azure). Usually follows parallel operation and UAT phases. |
| **Vendor Lock-In** | A situation where an organisation becomes dependent on a specific cloud provider, making it costly or complex to switch. Mitigated by using standard data formats, abstracting provider-specific APIs, and documenting migration paths. |
| **Latency** | The time delay between a user action and the system's response. Current Firebase latency from South Africa: 150–200ms (database in Belgium). Expected Azure latency: 5–20ms (database in Johannesburg). |
| **Cron** / **Timer Triggers** | Scheduled job patterns. A cron expression defines when a job runs (e.g. `0 8 * * *` = daily at 08:00). Azure Functions support timer triggers with cron expressions; Firebase Cloud Scheduler provides equivalent functionality. |
| **HTTP Triggers** | Serverless function invocations triggered by HTTP requests. Azure Functions and Firebase Cloud Functions both support HTTP triggers for building API endpoints. |
| **Service Principal** | An Azure identity used by applications and services (not humans) to authenticate against Azure resources. Has specific permissions granted via Azure RBAC. |
| **Resource Group** | An Azure logical container that holds related resources (functions, databases, storage accounts) for a single application or environment. Simplifies management, billing, and access control. |
| **Connection Strings** | Configuration strings containing the endpoint, credentials, and options needed to connect to a database or service. Used for Cosmos DB, Azure Storage, and other Azure services. The portal currently uses Firebase config keys via `import.meta.env`. |

---

## Cross-Reference Index

For quick lookup, here are abbreviations and their full forms used throughout the documentation:

| Abbreviation | Full Form |
|-------------|-----------|
| ACS | Azure Communication Services |
| AD | Active Directory |
| APM | Application Performance Management |
| BaaS | Backend-as-a-Service |
| BAA | Business Associate Agreement |
| CDN | Content Delivery Network |
| CI/CD | Continuous Integration / Continuous Deployment |
| CRUD | Create, Read, Update, Delete |
| CSR | Client-Side Rendering |
| CSS | Cascading Style Sheets |
| CTA | Call to Action |
| DAU | Daily Active Users |
| DOCX | Microsoft Word Document Format |
| DSRM | Design Science Research Methodology |
| ERD | Entity Relationship Diagram |
| ES / ESM | ECMAScript / ECMAScript Modules |
| FCM | Firebase Cloud Messaging |
| FHD | Faculty Higher Degrees |
| FHDC | Faculty Higher Degrees Committee |
| GCP | Google Cloud Platform |
| GDPR | General Data Protection Regulation |
| HD | Higher Degree |
| HMR | Hot Module Replacement |
| HTML | HyperText Markup Language |
| HTTPS | HyperText Transfer Protocol Secure |
| iCal | Internet Calendar |
| JSON | JavaScript Object Notation |
| JSX | JavaScript XML |
| MAU | Monthly Active Users |
| MFA | Multi-Factor Authentication |
| MOU | Memorandum of Understanding |
| MSAL | Microsoft Authentication Library |
| NoSQL | Not Only SQL |
| npm | Node Package Manager |
| OIDC | OpenID Connect |
| PCI DSS | Payment Card Industry Data Security Standard |
| PDF | Portable Document Format |
| POPIA | Protection of Personal Information Act |
| RBAC | Role-Based Access Control |
| REST | Representational State Transfer |
| ROTT | Register of Thesis Titles |
| RU/s | Request Units per second |
| SAML | Security Assertion Markup Language |
| SHD | Senate Higher Degrees |
| SIEM | Security Information and Event Management |
| SLA | Service Level Agreement |
| SPA | Single-Page Application |
| SSL | Secure Sockets Layer |
| SSO | Single Sign-On |
| SVG | Scalable Vector Graphics |
| SWA | Static Web Apps |
| TLS | Transport Layer Security |
| UAT | User Acceptance Testing |
| UWC | University of the Western Cape |
| XLSX | Microsoft Excel Spreadsheet Format |

---

*This glossary covers 300+ terms across academic, technical, project-specific, security, research, and infrastructure domains. For implementation-level details on any term, see the referenced source file in the codebase or the corresponding documentation in the `docs/` directory.*

---

## References & Sources

The definitions, descriptions, and technical details in this glossary were compiled from the following primary and secondary sources:

### Primary Sources (Project-Specific)

1. **Functional Specification** — *Postgraduate Request Portal – Functional Specification*, Faculty of Natural Sciences, University of the Western Cape, 2026. (Internal project document defining all requirements, roles, workflow logic, and committee decision processes.)
2. **PostGrad Portal Codebase** — Source code at `src/`, `scripts/`, and configuration files (`package.json`, `firebase.json`, `firestore.rules`, `storage.rules`, `vite.config.js`, `vercel.json`, `eslint.config.js`). All library names, versions, and API usage verified against the live codebase.
3. **DEVELOPMENT_CHANGELOG.md** — Internal development log documenting iterations 1–5 of the DSRM artefact, including architecture decisions, component designs, and implementation details.
4. **SYSTEM_VS_SPECIFICATION.md** — Specification compliance analysis mapping 63 requirements to implementation status with traceability notes.
5. **PLATFORM_COMPARISON.md** — Firebase Spark vs Blaze vs Azure evaluation with cost analysis, migration effort assessment, and POPIA compliance review.

### Secondary Sources (Technology & Frameworks)

6. **React Documentation** — React Team. *React Documentation*. Meta Platforms, Inc., 2024. Available at: [https://react.dev/](https://react.dev/). Accessed: February 2026.
7. **Vite Documentation** — Evan You et al. *Vite: Next Generation Frontend Tooling*. 2024. Available at: [https://vite.dev/](https://vite.dev/). Accessed: February 2026.
8. **Firebase Documentation** — Google. *Firebase Documentation*. Google LLC, 2024. Available at: [https://firebase.google.com/docs](https://firebase.google.com/docs). Accessed: February 2026. (Covers Authentication, Cloud Firestore, Cloud Storage, Cloud Functions, Hosting, Security Rules, Emulator Suite, and pricing plans.)
9. **Cloud Firestore Data Model** — Google. *Cloud Firestore Data Model*. Available at: [https://firebase.google.com/docs/firestore/data-model](https://firebase.google.com/docs/firestore/data-model). Accessed: February 2026.
10. **Firebase Pricing** — Google. *Firebase Pricing*. Available at: [https://firebase.google.com/pricing](https://firebase.google.com/pricing). Accessed: February 2026. (Spark plan quotas, Blaze plan free allocations, and per-use billing rates.)
11. **Microsoft Azure Documentation** — Microsoft. *Azure Documentation*. Microsoft Corporation, 2024. Available at: [https://learn.microsoft.com/en-us/azure/](https://learn.microsoft.com/en-us/azure/). Accessed: February 2026. (Covers Static Web Apps, Azure AD B2C, Cosmos DB, Azure Functions, Blob Storage, Communication Services, SignalR, Application Insights, Key Vault.)
12. **Azure Cosmos DB Documentation** — Microsoft. *Azure Cosmos DB for NoSQL*. Available at: [https://learn.microsoft.com/en-us/azure/cosmos-db/](https://learn.microsoft.com/en-us/azure/cosmos-db/). Accessed: February 2026.
13. **Azure AD B2C Documentation** — Microsoft. *Azure Active Directory B2C Documentation*. Available at: [https://learn.microsoft.com/en-us/azure/active-directory-b2c/](https://learn.microsoft.com/en-us/azure/active-directory-b2c/). Accessed: February 2026.

### Secondary Sources (Libraries & Packages)

14. **react-pdf** — Wojciech Maj. *react-pdf: Display PDFs in your React app*. npm, 2024. Available at: [https://www.npmjs.com/package/react-pdf](https://www.npmjs.com/package/react-pdf). Accessed: February 2026.
15. **PDF.js** — Mozilla. *PDF.js: A general-purpose, web standards-based platform for parsing and rendering PDFs*. Available at: [https://mozilla.github.io/pdf.js/](https://mozilla.github.io/pdf.js/). Accessed: February 2026.
16. **EmailJS** — EmailJS. *Send Email Directly From Your Code*. Available at: [https://www.emailjs.com/docs/](https://www.emailjs.com/docs/). Accessed: February 2026.
17. **date-fns** — Sasha Koss et al. *date-fns: Modern JavaScript Date Utility Library*. Available at: [https://date-fns.org/](https://date-fns.org/). Accessed: February 2026.
18. **jsPDF** — James Hall et al. *jsPDF: Client-side JavaScript PDF generation*. Available at: [https://www.npmjs.com/package/jspdf](https://www.npmjs.com/package/jspdf). Accessed: February 2026.
19. **docx** — Dolan Miu. *docx: Easily generate and modify .docx files with JS/TS*. Available at: [https://www.npmjs.com/package/docx](https://www.npmjs.com/package/docx). Accessed: February 2026.
20. **react-router-dom** — Remix Software, Inc. *React Router Documentation*. Available at: [https://reactrouter.com/](https://reactrouter.com/). Accessed: February 2026.
21. **react-icons** — React Icons Contributors. *react-icons: Popular icons in your React projects*. Available at: [https://react-icons.github.io/react-icons/](https://react-icons.github.io/react-icons/). Accessed: February 2026.
22. **ESLint** — OpenJS Foundation. *ESLint: Find and fix problems in your JavaScript code*. Available at: [https://eslint.org/](https://eslint.org/). Accessed: February 2026.

### Secondary Sources (Legal & Compliance)

23. **Protection of Personal Information Act (POPIA)** — Republic of South Africa. *Act No. 4 of 2013: Protection of Personal Information Act*. Government Gazette, Vol. 581, No. 37067, 26 November 2013. Available at: [https://www.gov.za/documents/protection-personal-information-act](https://www.gov.za/documents/protection-personal-information-act). Accessed: February 2026.
24. **General Data Protection Regulation (GDPR)** — European Parliament and Council of the European Union. *Regulation (EU) 2016/679 on the protection of natural persons with regard to the processing of personal data*. Official Journal of the European Union, 4 May 2016. Available at: [https://gdpr-info.eu/](https://gdpr-info.eu/). Accessed: February 2026.

### Secondary Sources (Research Methodology)

25. **Design Science Research Methodology (DSRM)** — Peffers, K., Tuunanen, T., Rothenberger, M.A. and Chatterjee, S. (2007). *A Design Science Research Methodology for Information Systems Research*. Journal of Management Information Systems, 24(3), pp.45–77. DOI: [10.2753/MIS0742-1222240302](https://doi.org/10.2753/MIS0742-1222240302).
26. **Hevner, A.R., March, S.T., Park, J. and Ram, S.** (2004). *Design Science in Information Systems Research*. MIS Quarterly, 28(1), pp.75–105. DOI: [10.2307/25148625](https://doi.org/10.2307/25148625).
