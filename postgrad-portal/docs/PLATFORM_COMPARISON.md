# Platform Comparison — Firebase Spark vs Firebase Blaze vs Microsoft Azure

> **Project**: UWC Postgraduate Request Portal
> **Context**: Academic Research Project (Design Science Research Methodology)
> **Date**: February 2026
> **Purpose**: Evaluate current infrastructure limitations and analyse production-readiness pathways via Firebase Blaze (paid tier) and Microsoft Azure

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Implementation Overview (Firebase Spark)](#2-current-implementation-overview-firebase-spark)
3. [Current System Limitations](#3-current-system-limitations)
4. [Option A — Firebase Blaze (Pay-as-You-Go)](#4-option-a--firebase-blaze-pay-as-you-go)
5. [Option B — Microsoft Azure](#5-option-b--microsoft-azure)
6. [Feature-by-Feature Platform Comparison](#6-feature-by-feature-platform-comparison)
7. [Cost Analysis](#7-cost-analysis)
8. [Regional Availability &amp; POPIA Compliance](#8-regional-availability--popia-compliance)
9. [Migration Effort Assessment](#9-migration-effort-assessment)
10. [Recommended Approach](#10-recommended-approach)
11. [Conclusion](#11-conclusion)

---

## 1. Executive Summary

The PostGrad Portal is currently deployed on **Firebase Spark (free tier)**, which has been ideal for rapid prototyping and design science iteration. However, several production-critical features are unavailable on the Spark plan, including server-side compute (Cloud Functions), automated scheduling, and storage with correct regional alignment.

This document evaluates two production pathways:

| Pathway                   | Summary                                                                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Firebase Blaze**  | Upgrade the existing Firebase project to the pay-as-you-go plan. Unlocks Cloud Functions, Cloud Storage, Cloud Scheduler, and Firebase Extensions. Preserves the entire existing codebase with minimal changes.       |
| **Microsoft Azure** | Migrate to Azure infrastructure (Static Web Apps, Cosmos DB, Azure Functions, Azure AD B2C). Provides South African data centres, POPIA-compliant data residency, and native university Active Directory integration. |

**Recommendation**: A **phased approach** — upgrade to Firebase Blaze immediately to resolve current limitations (low cost, zero code migration), then plan a strategic Azure migration for production deployment where POPIA compliance and institutional integration are required.

---

## 2. Current Implementation Overview (Firebase Spark)

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                   │
│  React 19 SPA + Vite 7 + react-router-dom            │
│  ├── Firebase Auth SDK (email/password)               │
│  ├── Firestore SDK (real-time subscriptions)          │
│  ├── EmailJS SDK (client-side email delivery)         │
│  ├── react-pdf (PDF viewer + annotations)             │
│  └── docx library (client-side DOCX export)           │
└──────────────┬────────────────────────────────────────┘
               │ HTTPS
┌──────────────▼────────────────────────────────────────┐
│              Firebase (europe-west1)                    │
│  ├── Firebase Authentication (7 demo users)            │
│  ├── Cloud Firestore (11 collections, real-time)       │
│  ├── Firebase Hosting (global CDN, SSL, custom domain) │
│  ├── Firestore Security Rules (role-based access)      │
│  └── ✗ Cloud Functions (NOT AVAILABLE — Spark plan)    │
│  └── ✗ Cloud Storage (REGION MISMATCH — not usable)    │
│  └── ✗ Cloud Scheduler (NOT AVAILABLE — Spark plan)    │
└────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer      | Technology                       | Version          |
| ---------- | -------------------------------- | ---------------- |
| Framework  | React (JSX, no TypeScript)       | 19.2.0           |
| Build Tool | Vite                             | 7.3.1            |
| Routing    | react-router-dom                 | 6.30.3           |
| Auth       | Firebase Authentication          | email/password   |
| Database   | Cloud Firestore                  | NoSQL, real-time |
| Email      | EmailJS (@emailjs/browser)       | Client-side      |
| PDF Viewer | react-pdf + pdfjs-dist           | 10 / 5.4         |
| Icons      | react-icons/hi2                  | Heroicons v2     |
| Dates      | date-fns                         | 4                |
| Styling    | Standard CSS + custom properties | UWC brand        |

### Firestore Collections (11)

| Collection           | Records | Purpose                                 |
| -------------------- | ------- | --------------------------------------- |
| `users`            | 7       | User profiles linked to Firebase Auth   |
| `hdRequests`       | 12      | HD requests with full workflow state    |
| `calendarEvents`   | 24      | Calendar entries (deadlines, meetings)  |
| `milestones`       | 20      | Student academic milestones             |
| `notifications`    | ~50+    | Per-user real-time notifications        |
| `studentProfiles`  | 3       | Extended academic profiles              |
| `auditLogs`        | 40+     | System activity audit trail             |
| `documentVersions` | 7       | Document version history                |
| `annotations`      | 5+      | PDF text annotations with reply threads |
| `formTemplates`    | 20      | HD request form template definitions    |
| `formSubmissions`  | ~0+     | Submitted form responses                |

---

## 3. Current System Limitations

The following limitations stem directly from the Firebase Spark plan constraints and impact 13 of the 63 specification requirements (categorised as "partially implemented" in the System vs Specification analysis):

### 3.1 No Server-Side Compute (Cloud Functions)

**Impact**: Critical
**Affected Features**:

| Feature                                                     | Current Workaround                         | Limitation                                                         |
| ----------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| **Access code timer enforcement** (48/72-hour expiry) | Timer displayed in UI with "expired" badge | No automatic lockout — users can still act on expired codes       |
| **Stagnation auto-escalation**                        | "Overdue" filter and visual badges         | No automatic escalation after N days; requires manual intervention |
| **Scheduled reminders**                               | Stagnation indicators displayed on hover   | No automated email/notification reminders on a schedule            |
| **Server-side validation**                            | Firestore Security Rules (declarative)     | Cannot run complex business logic validation server-side           |
| **PDF generation**                                    | Client-side jsPDF/docx                     | Cannot generate PDFs server-side for archival or email attachments |
| **Data aggregation**                                  | Client-side computation in DataContext     | No background jobs for analytics pre-computation                   |

**Root Cause**: Cloud Functions require the Blaze (paid) plan. The Spark plan only supports client-side code and Firestore Security Rules.

### 3.2 No Cloud Storage (Region Mismatch)

**Impact**: High
**Affected Features**:

| Feature                                           | Current Workaround                         | Limitation                                                  |
| ------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| **Document uploads**                        | Static files in Vite `public/` directory | No runtime upload capability — all documents pre-generated |
| **Google Drive integration** (Spec §2.4.5) | Not implemented                            | Cannot store/retrieve documents dynamically                 |
| **Form attachment uploads**                 | File input in form builder (UI only)       | Files cannot be persisted to cloud storage                  |

**Root Cause**: Firestore was created in `europe-west1`, but the default Cloud Storage bucket was auto-created in `us-central1`. Firebase requires both services in the same region for the Spark plan. The Storage bucket region cannot be changed after creation.

### 3.3 No Automated Scheduling

**Impact**: Medium
**Affected Features**:

| Feature                                         | Current Workaround                       | Limitation                                             |
| ----------------------------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| **Calendar sync** (Google Calendar, iCal) | Events stored in Firestore only          | No server-side sync with external calendar services    |
| **Daily digest emails**                   | Individual emails per action via EmailJS | No batch digest or scheduled summary emails            |
| **Data cleanup**                          | Admin-only seed/reseed page              | No automatic archival of old requests or notifications |

**Root Cause**: Cloud Scheduler and Pub/Sub require the Blaze plan. Cron-style triggers need Cloud Functions as the execution target.

### 3.4 Client-Side Email (EmailJS)

**Impact**: Medium
**Affected Features**:

| Limitation                        | Description                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------- |
| **Rate limits**             | EmailJS free tier: 200 emails/month, 2 email requests/second                 |
| **Sender reputation**       | Emails sent via shared EmailJS infrastructure; may be flagged as spam        |
| **Template flexibility**    | Limited to EmailJS template variables; no rich HTML templating               |
| **Reliability**             | No retry mechanism; failures are caught but not retried                      |
| **Security**                | Public key exposed in client-side code (by design, but limits trust model)   |
| **No server-side triggers** | Cannot send emails from Cloud Functions (e.g., on Firestore document writes) |

### 3.5 Spark Plan Quotas

| Resource          | Spark Limit | Current Usage Estimate               | Risk |
| ----------------- | ----------- | ------------------------------------ | ---- |
| Firestore reads   | 50,000/day  | ~500–2,000/day (7 users, real-time) | Low  |
| Firestore writes  | 20,000/day  | ~50–200/day                         | Low  |
| Firestore storage | 1 GiB       | ~10–50 MB                           | Low  |
| Hosting bandwidth | 10 GB/month | < 1 GB/month                         | Low  |
| Auth DAUs         | 3,000/day   | 7 users                              | Low  |

**Assessment**: For the current demo/research scope (7 users, evaluation testing), Spark quotas are more than adequate. The limits would become constraining at approximately **200+ concurrent daily users** or with high-frequency real-time subscriptions.

---

## 4. Option A — Firebase Blaze (Pay-as-You-Go)

### 4.1 What Changes

The Blaze plan **retains all Spark free quotas** and adds pay-per-use billing for overages. The following services become available:

| Service                       | Capability Unlocked                             | Free Allocation on Blaze         |
| ----------------------------- | ----------------------------------------------- | -------------------------------- |
| **Cloud Functions**     | Server-side Node.js/Python/Go/Java/C# functions | 2M invocations/month, 400K GB-s  |
| **Cloud Storage**       | File uploads/downloads with security rules      | 5 GB storage, 1 GB/day downloads |
| **Cloud Scheduler**     | Cron-style scheduled jobs                       | 3 jobs/month free                |
| **Pub/Sub**             | Asynchronous messaging                          | 10 GB/month                      |
| **Cloud Tasks**         | Asynchronous task execution                     | —                               |
| **Firebase Extensions** | Pre-built backend logic modules                 | —                               |
| **Secret Manager**      | Secure secret storage                           | —                               |

### 4.2 Features Resolved by Blaze Upgrade

| Current Limitation                      | Blaze Solution                                                                   | Implementation Effort                                               |
| --------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Access code timer enforcement** | Cloud Function triggered on Firestore write; Cloud Scheduler for periodic checks | **Medium** — ~2–3 days                                      |
| **Stagnation auto-escalation**    | Cloud Scheduler + Cloud Function to query overdue requests daily                 | **Medium** — ~1–2 days                                      |
| **Scheduled reminders**           | Cloud Scheduler cron → Cloud Function → email via nodemailer/SendGrid          | **Low** — ~1 day                                             |
| **Server-side email**             | Cloud Functions + nodemailer or Firebase Extensions (Trigger Email)              | **Low** — ~1 day (replaces EmailJS)                          |
| **Document uploads**              | Cloud Storage with Firestore Security Rules integration                          | **Medium** — ~2–3 days (re-create bucket in correct region) |
| **PDF server-side generation**    | Cloud Function with puppeteer or pdf-lib                                         | **Medium** — ~2 days                                         |
| **Analytics pre-computation**     | Cloud Function triggered on writes → update aggregation documents               | **Low** — ~1 day                                             |
| **Data cleanup/archival**         | Cloud Scheduler → Cloud Function to archive old records                         | **Low** — ~1 day                                             |

**Total Estimated Effort**: ~2–3 weeks of development to implement all server-side features.

### 4.3 Additional Google Services Available on Blaze

With the Blaze plan, the project can integrate additional Google Cloud Platform services:

| Service                                  | Use Case for PostGrad Portal                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| **Google Cloud Identity Platform** | SAML/OIDC federation for university SSO (requires GCP Identity Platform upgrade)     |
| **Google Workspace APIs**          | Google Calendar sync, Google Drive integration, Google Chat (resolves §4.3 in spec) |
| **Cloud Run**                      | Deploy containerised backend services if Cloud Functions are insufficient            |
| **BigQuery**                       | Advanced analytics on historical request data                                        |
| **Cloud Logging + Monitoring**     | Production-grade observability (beyond Firebase console)                             |
| **Firebase App Check**             | Protect backend resources from abuse                                                 |
| **Firebase Remote Config**         | Dynamic configuration without redeployment                                           |

### 4.4 Blaze — What It Does NOT Solve

| Limitation                             | Why Blaze Doesn't Help                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **No South African data centre** | GCP has no Africa region; Firestore stays in `europe-west1` (~150ms latency from Cape Town)                  |
| **POPIA data residency**         | Personal data cannot be stored in South Africa on any Firebase/GCP plan                                        |
| **University AD SSO**            | Possible via Identity Platform SAML federation but requires GCP-side configuration + university IT cooperation |
| **Enterprise governance**        | Limited compared to Azure (no equivalent of Azure Policy, Management Groups, Conditional Access)               |
| **Vendor lock-in**               | Firestore data model, Security Rules syntax, and SDK are Firebase-specific                                     |

---

## 5. Option B — Microsoft Azure

### 5.1 Proposed Azure Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                   │
│  React 19 SPA + Vite 7 + MSAL.js                    │
│  ├── Azure AD B2C SDK (@azure/msal-browser)          │
│  ├── Cosmos DB SDK (or REST API via Azure Functions)  │
│  ├── SignalR client (for real-time)                   │
│  └── Application Insights SDK (monitoring)            │
└──────────────┬────────────────────────────────────────┘
               │ HTTPS
┌──────────────▼────────────────────────────────────────┐
│         Azure (South Africa North — Johannesburg)      │
│  ├── Azure Static Web Apps (React SPA hosting + CDN)   │
│  ├── Azure AD B2C (auth — email/password + SAML SSO)   │
│  ├── Azure Cosmos DB (NoSQL, Change Feed, serverless)  │
│  ├── Azure Functions (timer triggers, HTTP triggers)   │
│  ├── Azure Blob Storage (document uploads/storage)     │
│  ├── Azure Communication Services (email delivery)     │
│  ├── Azure SignalR Service (real-time push)             │
│  ├── Application Insights (monitoring + logging)       │
│  └── Azure Key Vault (secrets management)              │
└────────────────────────────────────────────────────────┘
```

### 5.2 Service-by-Service Mapping

| Current (Firebase)             | Azure Replacement                                                                | Migration Complexity                                                                                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firebase Authentication        | **Azure AD B2C** (Microsoft Entra External ID)                             | **High** — complete auth rewrite: replace `firebase/auth` SDK with `@azure/msal-browser`, reconfigure protected routes, rewrite `AuthContext.jsx`                |
| Cloud Firestore                | **Azure Cosmos DB** (NoSQL API, serverless)                                | **High** — rewrite all 11 collections' CRUD operations, replace `onSnapshot()` with Change Feed + SignalR, rewrite security from declarative rules to API-level RBAC |
| Firestore Security Rules       | **Azure Functions middleware** + Cosmos DB resource tokens                 | **High** — move from declarative rules to imperative server-side authorization                                                                                         |
| Firebase Hosting               | **Azure Static Web Apps**                                                  | **Low** — minimal config change; Vite build output deploys to SWA                                                                                                      |
| EmailJS (client-side)          | **Azure Communication Services** or **SendGrid via Azure Functions** | **Medium** — rewrite `emailService.js` to call Azure Functions endpoint                                                                                              |
| Static documents (`public/`) | **Azure Blob Storage**                                                     | **Medium** — upload existing files, update document URL references                                                                                                     |
| N/A (missing)                  | **Azure Functions** (timer triggers for scheduling)                        | **New** — build from scratch (comparable to Cloud Functions work)                                                                                                      |
| N/A (missing)                  | **Azure SignalR Service** (real-time push)                                 | **New** — significant new infrastructure to replace Firestore's native real-time                                                                                       |

### 5.3 Features Resolved by Azure Migration

| Current Limitation                      | Azure Solution                                                             |
| --------------------------------------- | -------------------------------------------------------------------------- |
| **No African data centre**        | Azure South Africa North (Johannesburg) — ~5–20ms latency from Cape Town |
| **POPIA data residency**          | All personal data stored in South Africa                                   |
| **Access code timer enforcement** | Timer-triggered Azure Functions                                            |
| **Stagnation auto-escalation**    | Timer-triggered Azure Functions                                            |
| **Scheduled reminders**           | Timer-triggered Azure Functions + Azure Communication Services             |
| **Document uploads**              | Azure Blob Storage in South Africa North                                   |
| **University SSO**                | Azure AD B2C with SAML federation to university Active Directory           |
| **Enterprise governance**         | Azure RBAC, Azure Policy, Management Groups, Conditional Access            |
| **Email reliability**             | Azure Communication Services (100 free/day) or SendGrid (25K free/month)   |
| **Production monitoring**         | Application Insights with custom dashboards                                |

### 5.4 Azure — What It Does NOT Provide Easily

| Limitation                               | Why Azure Is Harder                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Real-time client subscriptions** | No Firestore-like `onSnapshot()` — requires Azure SignalR Service + Change Feed processing via Azure Functions. Significant additional infrastructure and code. |
| **Rapid prototyping**              | Azure requires more boilerplate: resource groups, service principals, connection strings, MSAL configuration                                                       |
| **Offline persistence**            | No built-in offline-first data sync like Firestore's enablePersistence(). Would need custom service worker + IndexedDB implementation.                             |
| **Simple security rules**          | Firestore Security Rules are declarative and powerful. Azure requires imperative middleware in Azure Functions.                                                    |
| **Development iteration speed**    | Firebase emulator suite provides fast local development. Azure development requires more tooling setup (Azurite, Azure Functions Core Tools, etc.)                 |

---

## 6. Feature-by-Feature Platform Comparison

### 6.1 Core Infrastructure

| Feature                      | Firebase Spark (Current)                        | Firebase Blaze                                                                                          | Microsoft Azure                                                          |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Hosting**            | Firebase Hosting (global CDN, SSL, 10 GB/month) | Same + unlimited bandwidth ($0.15/GB)                                                                   | Azure Static Web Apps (100 GB/month free)                                |
| **Database**           | Firestore (1 GiB, 50K reads/day)                | Firestore (pay-per-use, unlimited)                                                                      | Cosmos DB (1000 RU/s + 25 GB free tier) or serverless                    |
| **Authentication**     | Firebase Auth (3K DAU, email/password)          | Firebase Auth (50K MAU free, then $0.0055/MAU) | Azure AD B2C (50K auth/month free, then $0.00325/auth) |                                                                          |
| **Serverless compute** | ❌ Not available                                | ✅ Cloud Functions (2M invocations/month free)                                                          | ✅ Azure Functions (1M executions/month free)                            |
| **File storage**       | ❌ Region mismatch                              | ✅ Cloud Storage (5 GB free)                                                                            | ✅ Blob Storage ($0.018/GB/month)                                        |
| **Email delivery**     | EmailJS (200/month free, client-side)           | Cloud Functions + nodemailer/SendGrid                                                                   | Azure Communication Services (100/day free) or SendGrid (25K/month free) |
| **Scheduling/Cron**    | ❌ Not available                                | ✅ Cloud Scheduler (3 jobs free)                                                                        | ✅ Timer-triggered Azure Functions                                       |
| **Real-time push**     | ✅ Native `onSnapshot()` (built-in)           | ✅ Same                                                                                                 | ⚠️ Requires SignalR Service + Change Feed                              |

### 6.2 Developer Experience

| Factor                      | Firebase Spark                                                | Firebase Blaze                         | Microsoft Azure                                                                        |
| --------------------------- | ------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| **Setup time**        | Minutes                                                       | Minutes (enable billing)               | Hours to days                                                                          |
| **SDK complexity**    | Single package (`firebase`)                                 | Same +`firebase-admin` for functions | Multiple SDKs (`@azure/msal-browser`, `@azure/cosmos`, `@azure/functions`, etc.) |
| **Local development** | Firebase Emulator Suite (auth, firestore, hosting, functions) | Same                                   | Azurite + Azure Functions Core Tools + Azure Static Web Apps CLI                       |
| **Deployment**        | `firebase deploy` (one command)                             | Same                                   | `swa deploy` or CI/CD pipeline (GitHub Actions)                                      |
| **Learning curve**    | Low (web developer friendly)                                  | Low–Medium (add Cloud Functions)      | Medium–High (enterprise concepts, IAM, resource groups)                               |
| **Documentation**     | Excellent, tutorial-focused                                   | Same                                   | Comprehensive but enterprise-oriented                                                  |

### 6.3 Security & Compliance

| Factor                              | Firebase Spark                                                 | Firebase Blaze                       | Microsoft Azure                                               |
| ----------------------------------- | -------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| **Data residency**            | europe-west1 (Belgium)                                         | europe-west1 (Belgium)               | **South Africa North (Johannesburg)**                   |
| **POPIA compliance**          | ⚠️ Data in EU — requires GDPR-POPIA alignment documentation | ⚠️ Same                            | ✅ In-country data residency                                  |
| **SSO (SAML/OIDC)**           | ❌ (requires Identity Platform upgrade)                        | ⚠️ Possible with Identity Platform | ✅ Native Azure AD B2C SAML federation                        |
| **Multi-factor auth**         | ❌ (Spark)                                                     | ✅ SMS-based ($0.01/verification)    | ✅ SMS, authenticator, FIDO2, certificate                     |
| **Role-based access**         | Firestore Security Rules (client-evaluated)                    | Same + Cloud Functions middleware    | Azure RBAC + API-level authorization                          |
| **Audit logging**             | Custom collection in Firestore                                 | Same + Cloud Logging                 | Azure Monitor + Log Analytics + Sentinel                      |
| **Compliance certifications** | SOC 1/2/3, ISO 27001                                           | Same + HIPAA (with BAA)              | SOC 1/2/3, ISO 27001, HIPAA, FedRAMP, PCI DSS,**POPIA** |
| **Penetration testing**       | Limited (Google Cloud policies)                                | Same                                 | Supported with notification                                   |

### 6.4 Scalability & Performance

| Factor                           | Firebase Spark                                       | Firebase Blaze                  | Microsoft Azure                            |
| -------------------------------- | ---------------------------------------------------- | ------------------------------- | ------------------------------------------ |
| **Max users (free tier)**  | ~200 DAU comfortably                                 | ~50K MAU free, then pay-per-use | ~50K auth/month free                       |
| **Database throughput**    | 50K reads/day limit                                  | Auto-scales (pay-per-use)       | Cosmos DB: 1000 RU/s free, then auto-scale |
| **Latency from Cape Town** | ~150–200ms (europe-west1)                           | ~150–200ms (europe-west1)      | **~5–20ms (South Africa North)**    |
| **Multi-region**           | Single-region on Spark                               | Multi-region available          | Multi-region with geo-replication          |
| **CDN**                    | Firebase Hosting CDN (global, includes Africa edges) | Same                            | Azure Front Door + Static Web Apps CDN     |
| **Offline support**        | ✅ Built-in Firestore persistence                    | Same                            | ❌ Requires custom implementation          |

### 6.5 Integration & Ecosystem

| Factor                         | Firebase Spark                      | Firebase Blaze                             | Microsoft Azure                                       |
| ------------------------------ | ----------------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| **Calendar sync**        | ❌                                  | ✅ Google Calendar API via Cloud Functions | ✅ Microsoft Graph API (Outlook Calendar)             |
| **Document management**  | ❌                                  | ✅ Google Drive API via Cloud Functions    | ✅ SharePoint / OneDrive via Graph API                |
| **Chat integration**     | ❌                                  | ⚠️ Google Chat API (requires Workspace)  | ✅ Microsoft Teams integration                        |
| **Notification hub**     | ❌                                  | ✅ Firebase Cloud Messaging (push)         | ✅ Azure Notification Hubs                            |
| **AI/ML services**       | ❌                                  | ✅ Vertex AI, Gemini API                   | ✅ Azure OpenAI, Cognitive Services                   |
| **CI/CD**                | Firebase CLI + GitHub Actions       | Same                                       | Azure DevOps, GitHub Actions (native SWA integration) |
| **University ecosystem** | Independent (no institution tie-in) | Google Workspace integration possible      | **Native Microsoft 365 / Active Directory**     |

---

## 7. Cost Analysis

### 7.1 Scenario: Current State (7 Demo Users, Evaluation Testing)

| Cost Component          | Firebase Spark                                       | Firebase Blaze                                  | Azure |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------- | ----- |
| Hosting                 | $0 | $0 (within free quota)                          | $0 (SWA Free plan)                              |       |
| Database                | $0 | $0 (within free quota)                          | $0 (Cosmos DB free tier)                        |       |
| Authentication          | $0 | $0 (within free quota)                          | $0 (< 50K auth/month)                           |       |
| Serverless compute      | N/A                                                  | $0 (within free quota) | $0 (within free quota) |       |
| Email                   | $0 (EmailJS free) | $0 (SendGrid free via extension) | $0 (ACS 100/day free)                           |       |
| Storage                 | N/A                                                  | $0 (within free quota) | $0 (minimal)           |       |
| **Monthly Total** | **$0** | **$0**                          | **$0**                                    |       |

### 7.2 Scenario: Departmental Pilot (50–100 Users)

| Cost Component          | Firebase Spark                                                        | Firebase Blaze                                        | Azure                 |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- | --------------------- |
| Hosting                 | $0 (may approach limits) | $0–$2 | $0 (SWA Free)                     |                                                       |                       |
| Database                | ⚠️ May exceed daily read limit                                      | $0–$5 (pay-per-use)                                  | $0 (free tier covers) |
| Authentication          | $0 | $0 (< 50K MAU)                                                   | $0 (< 50K auth)                                       |                       |
| Serverless compute      | N/A                                                                   | $0 (within free quota) | $0 (within free quota)       |                       |
| Email                   | ⚠️ EmailJS 200/month limit                                          | $0 (SendGrid free 100/day) | $0 (ACS + SendGrid free) |                       |
| Storage                 | N/A                                                                   | $0–$1                                                | $0–$1                |
| **Monthly Total** | **$0** (with limitations) | **$0–$8** | **$0–$1** |                                                       |                       |

### 7.3 Scenario: Faculty-Wide Production (500–1,000 Users)

| Cost Component          | Firebase Spark                | Firebase Blaze                                      | Azure                          |
| ----------------------- | ----------------------------- | --------------------------------------------------- | ------------------------------ |
| Hosting                 | ❌ Exceeds free limits        | $5–$15                                             | $9 (SWA Standard)              |
| Database                | ❌ Exceeds daily limits       | $10–$30 (Firestore ops)                            | $5–$25 (Cosmos DB serverless) |
| Authentication          | ⚠️ DAU limits               | $0–$5 (< 50K MAU likely)                           | $0–$3                         |
| Serverless compute      | N/A                           | $0–$5 (Cloud Functions)                            | $0–$5 (Azure Functions)       |
| Email                   | ❌ Far exceeds EmailJS limits | $0–$5 (SendGrid free)                              | $0–$5 (SendGrid free)         |
| Storage                 | N/A                           | $1–$3                                              | $1–$3                         |
| Monitoring              | N/A                           | $0 (Firebase console) | $0 (App Insights 5 GB free) |                                |
| **Monthly Total** | **Not viable**          | **$16–$63**                                  | **$15–$50**             |

### 7.4 Scenario: University-Wide (5,000+ Users)

| Cost Component          | Firebase Blaze          | Azure (Enterprise Agreement)                  |
| ----------------------- | ----------------------- | --------------------------------------------- |
| Database                | $50–$150               | $30–$100 (reserved capacity discounts)       |
| Hosting/CDN             | $15–$50                | $9–$30 (Front Door at scale)                 |
| Authentication          | $5–$25                 | $0–$15 (Azure AD with institutional license) |
| Serverless compute      | $5–$20                 | $5–$20                                       |
| Email                   | $5–$15                 | $5–$15                                       |
| Storage                 | $3–$10                 | $3–$10                                       |
| Monitoring              | $0–$10 (Cloud Logging) | $0–$10 (App Insights)                        |
| **Monthly Total** | **$83–$280**     | **$52–$200**                           |

**Key Insight**: Azure becomes more cost-effective at scale due to reserved capacity pricing, enterprise agreements, and institutional Microsoft licensing that many universities already hold.

---

## 8. Regional Availability & POPIA Compliance

### 8.1 Data Centre Locations

| Region                             | Firebase / Google Cloud                           | Microsoft Azure                                                                         |
| ---------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **South Africa**             | ❌ No data centres                                | ✅**South Africa North** (Johannesburg) + **South Africa West** (Cape Town) |
| **Nearest to SA (Firebase)** | europe-west1 (Belgium, ~150–200ms)               | N/A                                                                                     |
| **Africa**                   | ❌ No data centres on continent                   | ✅ South Africa (2 regions)                                                             |
| **Europe**                   | ✅ Multiple (Belgium, Netherlands, Finland, etc.) | ✅ Multiple                                                                             |

### 8.2 POPIA Implications

The **Protection of Personal Information Act (POPIA)** is South Africa's data protection law (effective July 2021). Key requirements relevant to the PostGrad Portal:

| POPIA Principle                            | Firebase (Current)                                                                                                                                 | Firebase Blaze                                 | Azure (SA Region)                                                            |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| **Processing limitation** (§9–12)  | ✅ Firestore Security Rules limit access                                                                                                           | ✅ Same + server-side rules                    | ✅ Azure RBAC + API middleware                                               |
| **Purpose specification** (§13–14) | ✅ Application logic                                                                                                                               | ✅ Same                                        | ✅ Same                                                                      |
| **Information quality** (§16)       | ✅ Application logic                                                                                                                               | ✅ Same                                        | ✅ Same                                                                      |
| **Security safeguards** (§19)       | ✅ Firebase infrastructure (Google Cloud)                                                                                                          | ✅ Same + Cloud Functions security             | ✅ Azure security (SOC, ISO, POPIA-cert)                                     |
| **Trans-border transfer** (§72)     | ⚠️**Data stored in Belgium** — requires adequate protection in recipient country (EU has adequate protection, but creates legal overhead) | ⚠️ Same                                      | ✅**Data stored in South Africa** — no trans-border transfer required |
| **Data subject rights** (§23–25)   | ⚠️ No automated data export/deletion tools                                                                                                       | ⚠️ Same (but Cloud Functions could automate) | ⚠️ Same (but Azure has compliance tooling)                                 |

**Assessment**: Firebase stores personal data (student names, emails, academic records, thesis titles, supervisor relationships) in Belgium. While EU–SA adequacy exists, POPIA §72 requires explicit justification for trans-border transfers. Azure's South African data centres eliminate this requirement entirely.

### 8.3 Latency Impact

| Operation                      | Firebase (europe-west1)        | Azure (South Africa North)          |
| ------------------------------ | ------------------------------ | ----------------------------------- |
| Firestore read                 | ~150–200ms                    | ~5–20ms (Cosmos DB)                |
| Auth token validation          | ~100–150ms                    | ~5–10ms                            |
| Real-time subscription message | ~150–250ms                    | ~10–30ms (via SignalR)             |
| Static asset load (CDN)        | ~20–50ms (CDN edge in Africa) | ~10–30ms (CDN edge + origin in SA) |

At the current scale, the latency difference is perceptible but not blocking. At production scale with real-time features, the 10x latency improvement from Azure's local region would significantly improve user experience.

---

## 9. Migration Effort Assessment

### 9.1 Firebase Spark → Firebase Blaze

| Task                                            | Effort                | Risk                                             |
| ----------------------------------------------- | --------------------- | ------------------------------------------------ |
| Enable Blaze billing                            | 5 minutes             | None — free quotas preserved                    |
| Set up budget alerts                            | 30 minutes            | None                                             |
| Create Cloud Storage bucket (correct region)    | 1 hour                | Low — may need to re-create in `europe-west1` |
| Migrate static documents to Cloud Storage       | 2–4 hours            | Low                                              |
| Implement Cloud Functions for timer enforcement | 2–3 days             | Medium                                           |
| Implement scheduled reminders                   | 1–2 days             | Low                                              |
| Replace EmailJS with server-side email          | 1 day                 | Low                                              |
| Add Firebase App Check                          | 1 day                 | Low                                              |
| **Total**                                 | **~2–3 weeks** | **Low–Medium**                            |

**Code changes**: Minimal to existing codebase. New Cloud Functions are additive. Storage migration requires URL updates. EmailJS replacement requires rewriting `emailService.js` and adding a Cloud Function endpoint.

### 9.2 Firebase → Microsoft Azure

| Task                                                                                                             | Effort                 | Risk           |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------- |
| Set up Azure subscription + resource group                                                                       | 2–4 hours             | Low            |
| Configure Azure Static Web Apps                                                                                  | 2–4 hours             | Low            |
| Set up Azure AD B2C                                                                                              | 1–2 days              | Medium         |
| Rewrite `AuthContext.jsx` (Firebase → MSAL)                                                                   | 2–3 days              | High           |
| Rewrite `App.jsx` protected routes                                                                             | 1 day                  | Medium         |
| Set up Azure Cosmos DB (NoSQL)                                                                                   | 1 day                  | Low            |
| Migrate Firestore data → Cosmos DB                                                                              | 2–3 days              | High           |
| Rewrite all Firestore CRUD (`firestore.js`, `formTemplates.js`, `annotations.js`, `documentVersions.js`) | 5–7 days              | High           |
| Replace `onSnapshot()` with SignalR + Change Feed                                                              | 3–5 days              | Very High      |
| Rewrite `DataContext.jsx` (subscriptions)                                                                      | 2–3 days              | High           |
| Rewrite Firestore Security Rules as API middleware                                                               | 2–3 days              | High           |
| Set up Azure Blob Storage                                                                                        | 1 day                  | Low            |
| Migrate documents to Blob Storage                                                                                | 1 day                  | Low            |
| Set up Azure Functions (timer triggers, email)                                                                   | 2–3 days              | Medium         |
| Set up Azure Communication Services or SendGrid                                                                  | 1 day                  | Low            |
| Configure Application Insights                                                                                   | 1 day                  | Low            |
| End-to-end testing                                                                                               | 3–5 days              | Medium         |
| **Total**                                                                                                  | **~6–10 weeks** | **High** |

**Code changes**: Major rewrite of authentication, data layer, and real-time subscription system. The React component layer (pages, UI components, form system) would remain largely unchanged, but all data plumbing (~2,000+ lines across 6 Firebase modules and 2 context files) must be rewritten.

---

## 10. Recommended Approach

### Phase 1: Immediate — Upgrade to Firebase Blaze (Week 1)

**Objective**: Resolve all current limitations with minimal code changes and zero migration risk.

| Action                                                  | Timeline | Impact                           |
| ------------------------------------------------------- | -------- | -------------------------------- |
| Enable Blaze billing with $25/month spending cap        | Day 1    | Unlocks all services             |
| Set up budget alerts at $5, $15, $25                    | Day 1    | Cost protection                  |
| Create Cloud Storage bucket in `europe-west1`         | Day 1    | Resolves storage issue           |
| Migrate static documents to Cloud Storage               | Day 2–3 | Runtime document uploads enabled |
| Deploy Cloud Function for access code timer enforcement | Week 1   | Resolves §4.1 spec gap          |

**Estimated Monthly Cost**: $0–$5 (demo scale stays within free quotas)

### Phase 2: Short-Term — Server-Side Features (Weeks 2–4)

**Objective**: Implement all features that were blocked by the Spark plan, completing the "partially implemented" spec items.

| Action                                                  | Timeline  | Impact                                 |
| ------------------------------------------------------- | --------- | -------------------------------------- |
| Cloud Function: stagnation auto-escalation (daily cron) | Week 2    | Resolves spec §3.3                    |
| Cloud Function: scheduled email reminders               | Week 2    | Resolves spec §2.4.3                  |
| Replace EmailJS with Cloud Function + SendGrid          | Week 2–3 | Better reliability, no client exposure |
| Cloud Function: server-side PDF generation              | Week 3    | Archival-quality PDFs                  |
| Firebase Extensions: Trigger Email on Firestore writes  | Week 3    | Automated notification pipeline        |
| Firebase App Check                                      | Week 4    | Abuse protection                       |

**Outcome**: All 13 "partially implemented" spec items move to "fully implemented". Specification compliance rises from **73% fully implemented** to **~90% fully implemented**.

### Phase 3: Medium-Term — Azure Strategic Migration (Months 3–6)

**Objective**: Plan and execute migration to Azure for production deployment with POPIA compliance and institutional integration.

**Prerequisites**:

1. University IT department engagement (Azure subscription, AD federation)
2. UWC ICT governance approval for Azure resource provisioning
3. Data migration strategy and rollback plan

| Action                                                   | Timeline   | Impact                              |
| -------------------------------------------------------- | ---------- | ----------------------------------- |
| Prototype Azure AD B2C auth flow                         | Month 3    | Validate SSO with university AD     |
| Set up Cosmos DB with migrated schema                    | Month 3    | Validate data model and performance |
| Implement SignalR real-time layer                        | Month 4    | Replace Firestore subscriptions     |
| Rewrite data layer (`firestore.js` → `cosmosdb.js`) | Month 4–5 | Core migration work                 |
| Rewrite auth context (Firebase → MSAL)                  | Month 5    | Auth migration                      |
| End-to-end testing + UAT                                 | Month 5–6 | Validation                          |
| Production cutover                                       | Month 6    | Go-live                             |

**Rationale for Phase 3 timing**: The Firebase Blaze upgrade (Phase 1–2) resolves all immediate functional gaps. The Azure migration is a strategic decision for production deployment — it should not block the design science evaluation which requires a functional, complete system.

### Decision Matrix

| Criterion                 | Weight | Firebase Blaze | Azure          |
| ------------------------- | ------ | -------------- | -------------- |
| Development speed         | 25%    | ★★★★★     | ★★★☆☆     |
| Feature completeness      | 20%    | ★★★★☆     | ★★★★★     |
| POPIA compliance          | 20%    | ★★☆☆☆     | ★★★★★     |
| Cost at research scale    | 15%    | ★★★★★     | ★★★★☆     |
| Institutional integration | 10%    | ★★☆☆☆     | ★★★★★     |
| Real-time capability      | 10%    | ★★★★★     | ★★★☆☆     |
| **Weighted Score**  | 100%   | **3.90** | **4.05** |

The scores are remarkably close because each platform excels in different areas. Firebase wins on development speed and real-time — both critical for the research/evaluation phase. Azure wins on compliance and institutional fit — both critical for production deployment. **The phased approach captures the best of both.**

---

## 11. Conclusion

### Current State Assessment

The PostGrad Portal on **Firebase Spark** is a successful research prototype that demonstrates 94% of specification requirements. The free tier was the right choice for rapid DSRM iteration, enabling five development iterations without infrastructure cost.

### Production Readiness

| Path                       | Suitability                                               | When                                |
| -------------------------- | --------------------------------------------------------- | ----------------------------------- |
| **Stay on Spark**    | ✅ Adequate for evaluation, demo, and research submission | Now                                 |
| **Upgrade to Blaze** | ✅ Resolves all server-side limitations; minimal effort   | Immediate (recommended)             |
| **Migrate to Azure** | ✅ Required for institutional production deployment       | After DSRM evaluation (3–6 months) |

### Final Recommendation

1. **For the research project**: Upgrade to Firebase Blaze ($0–$5/month) to complete all specification features and demonstrate a fully functional artefact
2. **For UWC institutional adoption**: Plan an Azure migration that provides South African data residency (POPIA compliance), Active Directory SSO (institutional integration), and enterprise governance (IT management)
3. **The codebase is migration-ready**: The clean separation of concerns (Firebase modules in `src/firebase/`, contexts in `src/context/`, UI in `src/pages/` and `src/components/`) means the Azure migration would rewrite the data and auth layers without touching the UI/form system

The phased approach minimises risk, maximises research value, and provides a clear path to production. The design science artefact can be fully evaluated on Firebase Blaze, and the platform comparison analysis provides the institutional stakeholders with the information needed to fund and authorise an Azure migration.

---

*Document created as part of the PostGrad Portal Design Science Research artefact evaluation (Iteration 5).*

---

## References & Sources

The technical comparisons, pricing data, compliance assessments, and migration recommendations in this document were compiled from the following sources:

### Firebase & Google Cloud Platform

1. **Firebase Pricing** — Google. *Firebase Pricing*. Google LLC, 2024. Available at: [https://firebase.google.com/pricing](https://firebase.google.com/pricing). Accessed: February 2026. (Spark plan quotas: 1 GiB Firestore storage, 50K reads/day, 20K writes/day, 5 GB Cloud Storage, 10 GB/month hosting bandwidth.)
2. **Firebase Authentication Limits** — Google. *Firebase Authentication Usage Limits*. Available at: [https://firebase.google.com/docs/auth/limits](https://firebase.google.com/docs/auth/limits). Accessed: February 2026.
3. **Cloud Firestore Quotas** — Google. *Cloud Firestore Quotas and Limits*. Available at: [https://firebase.google.com/docs/firestore/quotas](https://firebase.google.com/docs/firestore/quotas). Accessed: February 2026.
4. **Cloud Functions for Firebase** — Google. *Cloud Functions for Firebase*. Available at: [https://firebase.google.com/docs/functions](https://firebase.google.com/docs/functions). Accessed: February 2026. (Blaze-only requirement for Cloud Functions.)
5. **Firebase Hosting** — Google. *Firebase Hosting Documentation*. Available at: [https://firebase.google.com/docs/hosting](https://firebase.google.com/docs/hosting). Accessed: February 2026.
6. **Firebase Security Rules** — Google. *Cloud Firestore Security Rules*. Available at: [https://firebase.google.com/docs/firestore/security/get-started](https://firebase.google.com/docs/firestore/security/get-started). Accessed: February 2026.
7. **GCP Region Availability** — Google. *Cloud Locations*. Available at: [https://cloud.google.com/about/locations](https://cloud.google.com/about/locations). Accessed: February 2026. (Nearest region to South Africa: europe-west1, Belgium.)

### Microsoft Azure

8. **Azure Static Web Apps** — Microsoft. *Azure Static Web Apps Documentation*. Microsoft Corporation, 2024. Available at: [https://learn.microsoft.com/en-us/azure/static-web-apps/](https://learn.microsoft.com/en-us/azure/static-web-apps/). Accessed: February 2026.
9. **Azure Active Directory B2C** — Microsoft. *Azure AD B2C Documentation*. Available at: [https://learn.microsoft.com/en-us/azure/active-directory-b2c/](https://learn.microsoft.com/en-us/azure/active-directory-b2c/). Accessed: February 2026. (SAML/OIDC federation capabilities for institutional SSO integration.)
10. **Azure Cosmos DB for NoSQL** — Microsoft. *Azure Cosmos DB Documentation*. Available at: [https://learn.microsoft.com/en-us/azure/cosmos-db/](https://learn.microsoft.com/en-us/azure/cosmos-db/). Accessed: February 2026. (400 RU/s free tier, NoSQL API.)
11. **Azure Functions** — Microsoft. *Azure Functions Documentation*. Available at: [https://learn.microsoft.com/en-us/azure/azure-functions/](https://learn.microsoft.com/en-us/azure/azure-functions/). Accessed: February 2026. (Consumption plan: 1M executions/month free.)
12. **Azure Blob Storage** — Microsoft. *Azure Blob Storage Documentation*. Available at: [https://learn.microsoft.com/en-us/azure/storage/blobs/](https://learn.microsoft.com/en-us/azure/storage/blobs/). Accessed: February 2026. (Lifecycle management policies, tiered storage.)
13. **Azure Communication Services** — Microsoft. *Azure Communication Services - Email*. Available at: [https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview). Accessed: February 2026. (Institutional-grade email delivery with branding control.)
14. **Azure SignalR Service** — Microsoft. *Azure SignalR Service Documentation*. Available at: [https://learn.microsoft.com/en-us/azure/azure-signalr/](https://learn.microsoft.com/en-us/azure/azure-signalr/). Accessed: February 2026. (Real-time messaging as replacement for Firestore real-time listeners.)
15. **Azure Application Insights** — Microsoft. *Application Insights Overview*. Available at: [https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview). Accessed: February 2026. (Performance monitoring, user analytics, anomaly detection.)
16. **Azure Key Vault** — Microsoft. *Azure Key Vault Documentation*. Available at: [https://learn.microsoft.com/en-us/azure/key-vault/](https://learn.microsoft.com/en-us/azure/key-vault/). Accessed: February 2026.
17. **Azure Regions** — Microsoft. *Azure Geographies*. Available at: [https://azure.microsoft.com/en-us/explore/global-infrastructure/geographies/](https://azure.microsoft.com/en-us/explore/global-infrastructure/geographies/). Accessed: February 2026. (South Africa North and South Africa West regions for POPIA-compliant data residency.)
18. **Azure Pricing Calculator** — Microsoft. *Azure Pricing Calculator*. Available at: [https://azure.microsoft.com/en-us/pricing/calculator/](https://azure.microsoft.com/en-us/pricing/calculator/). Accessed: February 2026. (Used for cost estimates in §8 Cost Analysis.)

### Legal & Compliance

19. **Protection of Personal Information Act (POPIA)** — Republic of South Africa. *Act No. 4 of 2013: Protection of Personal Information Act*. Government Gazette, Vol. 581, No. 37067, 26 November 2013. Available at: [https://www.gov.za/documents/protection-personal-information-act](https://www.gov.za/documents/protection-personal-information-act). Accessed: February 2026.
    - **§9–12**: Conditions for lawful processing of personal information (cited in POPIA compliance analysis)
    - **§13–14**: Direct marketing and automated decision-making restrictions
    - **§16**: Notification requirements for cross-border data transfers
    - **§19**: Security safeguards for responsible parties
    - **§23–25**: Data subject rights (access, correction, deletion)
    - **§72**: Cross-border transfer provisions (adequate level of protection requirement)
20. **General Data Protection Regulation (GDPR)** — European Parliament and Council of the European Union. *Regulation (EU) 2016/679*. Official Journal of the European Union, 4 May 2016. Available at: [https://gdpr-info.eu/](https://gdpr-info.eu/). Accessed: February 2026. (Referenced for GDPR adequacy decisions and cross-border transfer framework comparison.)
21. **GDPR Adequacy Decisions** — European Commission. *Adequacy Decisions*. Available at: [https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en). Accessed: February 2026. (South Africa not yet recognised as having adequate protections under GDPR.)

### Research Methodology

22. **Peffers, K., Tuunanen, T., Rothenberger, M.A. and Chatterjee, S.** (2007). *A Design Science Research Methodology for Information Systems Research*. Journal of Management Information Systems, 24(3), pp.45–77. DOI: [10.2753/MIS0742-1222240302](https://doi.org/10.2753/MIS0742-1222240302). (DSRM framework guiding the iterative development approach.)

### Project Sources

23. **Functional Specification** — *Postgraduate Request Portal – Functional Specification*, Faculty of Natural Sciences, University of the Western Cape, 2026. (Internal project document; original specification against which feature parity and compliance gaps are assessed.)
24. **PostGrad Portal Codebase** — Source code repository, including `src/firebase/` (data layer), `src/context/` (state management), `src/pages/` and `src/components/` (UI layer). Architecture analysis based on actual code inspection.
