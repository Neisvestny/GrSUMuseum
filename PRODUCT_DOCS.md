# Product Documentation — Department Website v2

> **Version:** 1.0  
> **Status:** Pre-production  
> **Deadline:** August 2025  
> **Deployment:** On-premise, university server

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Target Audience](#2-target-audience)
3. [Feature Descriptions](#3-feature-descriptions)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Permissions Matrix](#5-permissions-matrix)
6. [Business Flows](#6-business-flows)
7. [User Journeys](#7-user-journeys)
8. [Admin Flows](#8-admin-flows)
9. [Edge Cases](#9-edge-cases)
10. [UX Requirements](#10-ux-requirements)

---

## 1. Product Vision

### Problem Statement

The current department website is a static or legacy system with no CMS, making it difficult for non-technical staff to update content. News goes stale. Staff profiles are outdated. Materials are hard to find. The department has no unified digital presence that prospective students, enrolled students, and faculty can rely on.

### Vision Statement

A fast, SEO-optimised public website for the department that presents the institution professionally and can be independently maintained by faculty — no developer needed for day-to-day content. A clean, structured CMS lets editors publish news, manage staff profiles, and organise methodical materials. The system integrates with the university's own API to pull live schedule data, removing manual schedule maintenance entirely.

### Goals

**For the public (visitors, prospective students, enrolled students):**

The website should load fast, rank in search engines, and give visitors everything they need: news about department life, staff contacts and schedules, downloadable study materials, and a working contact form.

**For the department (editors, administrators):**

Managing content should require no technical knowledge. Logging in, writing a news article, uploading a photo, attaching a PDF — these should be as simple as using Google Docs. Changes should be reflected on the site within minutes.

**For the institution:**

All data stays on university servers. No cloud subscriptions, no GDPR risk from third-party analytics, no vendor lock-in. The system runs on the existing server, uses open-source software, and can be maintained by whoever inherits the project.

### Success Metrics

The product can be considered successful when:

- News published in the CMS appears on the site within 5 minutes of saving
- A new editor can independently publish their first article within 30 minutes of receiving credentials
- Staff profiles and schedules are accurate and up to date
- The site scores above 90 on Google Lighthouse (Performance, SEO)
- Zero unhandled server errors per week (tracked via Sentry)
- The solo developer can deploy a fix in under 15 minutes

### Non-goals (MVP)

The following are explicitly out of scope for the initial release:

- Student authentication or personal accounts
- Multilingual support (BY / EN) — architecture supports it, feature deferred to Phase 2
- A visual drag-and-drop page builder — pages can be created, but block editing is deferred
- Forum, comments, or any user-generated content beyond the contact form
- Video hosting — videos are embedded via YouTube links
- Mobile app

---

## 2. Target Audience

### Primary Audiences

**Prospective Students**

High school graduates or transfer students researching the department. They arrive via search engines or university portal links. They need: a clear description of what the department offers, information about faculty, and contact details. They are not logged in and will never create an account. Their first impression is formed in seconds — page load speed and visual quality matter.

**Enrolled Students**

Students currently studying in the department. They return regularly to find: teacher schedules and office hours, methodical materials and reading lists for their courses, news about exams, deadlines, and events. They may bookmark specific staff profile pages. They use the site on mobile.

**Faculty & Researchers**

Department staff who want to see their own profile presented accurately, find a colleague's contact, or check published news. They may use the contact form to reach the administration. Some of them will become editors or admins.

**University Administration**

Occasional visitors who review the site for compliance, quality, or audit purposes. They care about professional presentation, accurate information, and that data does not leave university infrastructure.

### Secondary Audiences

**Search Engines**

Google, Yandex, and other crawlers are treated as a technical audience. Every public page must be crawlable, indexable, and well-structured. SSR, semantic HTML, and correct meta tags are product requirements, not optional optimisations.

**Other Departments / Partner Institutions**

May link to specific staff profiles or news articles. Deep links must be stable and never return 404 for existing published content.

---

## 3. Feature Descriptions

### 3.1 Public Website

#### News Feed

The news section is the primary dynamic content area. It shows a paginated, reverse-chronological list of published articles. Each article has a title, excerpt, cover image, date, author name, and tags. Clicking an article opens the full article page with rich text content.

Tags act as filters — clicking a tag shows all articles with that tag. The feed supports basic URL-based filtering so links to filtered views can be shared and bookmarked.

There is no comment section. Articles are read-only for visitors.

#### Staff Directory

A grid or list of published staff profiles. Each profile card shows name, photo, position, and a link to the full profile page.

The full profile page shows:

- Display name (preferring manual override over university API data if set)
- Photo
- Position / title
- Email and phone (preferring manual override)
- Biography (rich text, optional)
- Current week's schedule, loaded dynamically from the university API and cached

The schedule is the most technically complex part of the public site. It proxies through the NestJS API which caches university API responses for 1 hour. If the university API is unavailable, the cached version is shown with a visual indicator that the data may be stale. If no cache exists, an appropriate error state is displayed.

#### Methodical Materials

Each staff profile can have associated methodical materials — primarily PDF documents for courses. Materials are listed on the staff profile with title and subject.

For each material, the system attempts to automatically extract a table of topics from the PDF (headings parsed by a background job). If extraction succeeds, topics are listed as a structured outline. If extraction fails, the PDF is still available for download and the editor can enter topics manually.

#### Static & Dynamic Pages

The site has a set of informational pages — About, Contacts, etc. These are managed in the CMS. In the MVP, pages are edited as rich text. The architecture supports a block-based page builder for Phase 2.

The About and Contacts pages are expected to be set up once and updated infrequently.

#### Contact Form

A simple form on the Contacts page. Fields: sender name, sender email, subject (optional), message body. No CAPTCHA in MVP (rate limiting is handled at the Nginx level). On submission, a confirmation message is shown. The message is saved to the database and appears in the admin inbox.

#### Search

A search bar is available on the public site. It queries PostgreSQL full-text search across news titles and content. Staff names are searched using trigram fuzzy matching (tolerant of typos). Results are ranked by relevance. There is no separate search page — results appear inline or as a dropdown, with a link to a full results page.

---

### 3.2 CMS (Admin Panel)

The CMS is a single-page application accessible at `/admin`. It is visible only to authenticated users.

#### Dashboard

A summary page shown after login. Shows:

- Count of unpublished (draft) news articles
- Count of unread messages in inbox
- Any materials with failed PDF parsing
- Recent audit log entries (last 10 actions)
- Status indicators for background queue (pending / processing / failed jobs)

#### News Management

Editors can create, edit, preview, publish, unpublish, and delete news articles.

The news editor uses a rich text interface (Tiptap) supporting: headings, paragraphs, bold/italic/underline, links, inline images, blockquotes, and unordered/ordered lists. Images inserted into articles are picked from the Media Library or uploaded directly.

An article has a draft state and a published state. Drafts are not visible on the public site. Publishing triggers a Next.js cache revalidation for the news list and the specific article path.

Articles support tags. Tags are created on the fly when typing in the tag field — there is no separate tag management page in MVP.

#### Staff Management

Editors can create, edit, and publish staff profiles.

Creating a staff profile can be done in two ways:

**Import from university API** — the editor enters the university teacher ID, and the system fetches existing data (name, email, phone, position) and pre-fills the form. The imported data is stored as `api_*` fields and is not automatically refreshed.

**Manual creation** — all fields filled in manually, no university ID required.

After creation (by either method), the editor can set override values for any field. Override values always take precedence over API values on the public site.

The editor can upload a profile photo. The photo is processed in a background job: resized to a maximum of 1920px, converted to WebP, and a 400×400 thumbnail is generated.

Staff profiles have a `is_published` toggle. Unpublished profiles are not visible on the public site but exist in the system.

`sort_order` controls the display order in the staff directory.

#### Materials Management

Accessible from a staff profile in the CMS. Editors can:

- Upload a PDF and attach it to a staff member
- Set a title and subject
- View the automatically extracted topics (or see a failed/pending status)
- Manually add, edit, or delete topics if auto-extraction failed or was incomplete

Materials cannot be uploaded independently — they must be attached to a staff member.

#### Page Management

Editors can create and edit informational pages. Each page has a slug, title, SEO metadata (meta title, meta description), and a `is_published` toggle.

In MVP, page content is managed as a single rich text block. The block-based page builder is deferred to Phase 2.

Pages can be reordered (sort_order). The navigation order on the public site reflects this order.

#### Media Library

A shared library of all uploaded files: images, PDFs, and videos. Editors can browse, search by filename or type, and delete files. Deletion is soft — the file is marked for removal but not immediately deleted from MinIO (a background job clears it after 7 days, allowing recovery if a mistake is made).

When uploading images, the original file is stored temporarily while a background job processes it to WebP. The library shows the processed version once ready.

File upload limits: 50MB per file. Accepted types: JPEG, PNG, WebP, GIF, PDF, MP4, WebM.

#### Messages / Inbox

All contact form submissions appear here. Each message shows: sender name, sender email, subject, body, and the received timestamp.

Messages have a status: NEW, IN_PROGRESS, or CLOSED. Editors with at least MODERATOR role can:

- Read any message
- Add a reply (stored in the system; in Phase 2 this triggers a Telegram notification)
- Change the status

Replies are stored but not sent by email in MVP. The reply text is visible in the admin panel.

#### Audit Log

Super Admins can view a chronological log of all significant actions: who created, edited, published, or deleted what, and when. Each entry records the user, action type, entity affected, a snapshot of changed fields, and the IP address.

The log is read-only and never truncated.

#### User Management

Super Admins can create, edit, deactivate, and delete admin user accounts. Fields: name, email, password (set on creation, changeable), role.

Users can be deactivated (blocked from logging in) without being deleted. This preserves audit history and authorship records.

---

### 3.3 System & Infrastructure Features

#### Authentication

Session-based JWT authentication. Editors log in with email and password. On successful login, an access token (15-minute TTL) is returned in the response body and stored in JavaScript memory. A refresh token (7-day TTL) is set as an HttpOnly cookie.

Automatic silent refresh — when the access token expires, the frontend transparently requests a new one using the refresh cookie. The user never sees a logged-out state during an active session unless the refresh token also expires or is revoked.

Refresh token rotation — every refresh invalidates the old refresh token and issues a new one. If a stolen token is reused, all sessions for that user are immediately revoked.

#### Schedule Proxy & Cache

The `/api/v1/schedule/:teacherId` endpoint proxies requests to the university API at `api.grsu.by`. Responses are cached in Redis with a 1-hour TTL. If the university API is slow or unavailable:

- The cached version is returned if available, with a `_stale: true` flag in the response
- If no cache exists at all, a 503 error is returned to the frontend, which displays a user-friendly "schedule unavailable" state

#### Background Processing

Two background queues run as part of the NestJS process:

**PDF Extract Queue** — when a PDF is uploaded as a material, a job is enqueued to download the file from MinIO, extract text, parse headings into topics, and save them to the database. Retries 3 times with exponential backoff (1s, 4s, 16s). On final failure, the material is marked FAILED and the editor is notified in the dashboard.

**Image Resize Queue** — when an image is uploaded, a job resizes it, converts to WebP, generates a thumbnail, and updates the media record. Retries 2 times. Original file is deleted from MinIO after successful processing.

#### Analytics

Umami is deployed alongside the main application. A lightweight script tag is injected into all public pages. Analytics data is stored on the university server — no data leaves the institution. The analytics dashboard is accessible separately from the CMS.

#### Monitoring

Uptime Kuma monitors the health of all services (public website, API, PostgreSQL, Redis, MinIO) and sends a Telegram notification to the developer if any service goes down.

---

## 4. User Roles & Permissions

There are three admin roles. All roles require authenticated login. There are no public-facing user accounts.

### SUPER_ADMIN

The most privileged role. Intended for the system administrator or department head. Has full control over all content, settings, and user accounts.

Responsibilities:

- Create and manage admin user accounts (including assigning roles)
- Delete any content (news, staff, pages, media)
- Restore soft-deleted records
- View the full audit log
- Access the background job queue dashboard
- Manage site settings (if implemented)

There should be at least one SUPER_ADMIN account at all times. The system should prevent a Super Admin from deleting their own account if it's the last one.

### EDITOR

The standard content management role. Intended for faculty members or a designated content manager. Can manage all content but cannot manage other users or delete anything permanently.

Responsibilities:

- Create and edit news articles
- Publish and unpublish news articles
- Manage staff profiles (create, edit, publish/unpublish)
- Upload and manage files in the Media Library
- Manage methodical materials and their topics
- Create and edit pages
- Read and reply to messages from the contact form

An EDITOR cannot: delete news, staff, pages, or media permanently (only a SUPER_ADMIN can delete). They also cannot manage user accounts or view the full audit log.

### MODERATOR

A restricted role intended for staff members who need to monitor and respond to contact form submissions but should not have access to content editing.

Responsibilities:

- Read all contact form messages
- Add replies to messages and change their status

A MODERATOR can view the dashboard (showing inbox stats) but cannot create, edit, or delete any content.

---

## 5. Permissions Matrix

| Action | PUBLIC | MODERATOR | EDITOR | SUPER_ADMIN |
|--------|:------:|:---------:|:------:|:-----------:|
| **Public Site** | | | | |
| View public pages, news, staff, search | ✅ | ✅ | ✅ | ✅ |
| Submit contact form | ✅ | ✅ | ✅ | ✅ |
| View staff schedule | ✅ | ✅ | ✅ | ✅ |
| Download materials (PDF) | ✅ | ✅ | ✅ | ✅ |
| **Authentication** | | | | |
| Login to CMS | — | ✅ | ✅ | ✅ |
| Refresh own session | — | ✅ | ✅ | ✅ |
| Logout | — | ✅ | ✅ | ✅ |
| **News** | | | | |
| List all news (including drafts) | — | — | ✅ | ✅ |
| Create news article | — | — | ✅ | ✅ |
| Edit any news article | — | — | ✅ | ✅ |
| Publish / Unpublish news | — | — | ✅ | ✅ |
| Delete news (soft delete) | — | — | — | ✅ |
| Restore deleted news | — | — | — | ✅ |
| **Staff** | | | | |
| List all staff (including unpublished) | — | — | ✅ | ✅ |
| Create staff profile | — | — | ✅ | ✅ |
| Edit any staff profile | — | — | ✅ | ✅ |
| Publish / Unpublish staff profile | — | — | ✅ | ✅ |
| Delete staff profile (soft delete) | — | — | — | ✅ |
| **Materials** | | | | |
| Upload materials / PDFs | — | — | ✅ | ✅ |
| Edit material topics | — | — | ✅ | ✅ |
| Delete material | — | — | — | ✅ |
| **Pages** | | | | |
| Create and edit pages | — | — | ✅ | ✅ |
| Publish / Unpublish pages | — | — | ✅ | ✅ |
| Delete pages (soft delete) | — | — | — | ✅ |
| **Media Library** | | | | |
| Upload files | — | — | ✅ | ✅ |
| Browse and search media | — | — | ✅ | ✅ |
| Delete media (soft delete) | — | — | — | ✅ |
| **Messages** | | | | |
| View message inbox | — | ✅ | ✅ | ✅ |
| Reply to messages / change status | — | ✅ | ✅ | ✅ |
| **Users** | | | | |
| List admin users | — | — | — | ✅ |
| Create admin user | — | — | — | ✅ |
| Edit user role / deactivate | — | — | — | ✅ |
| Delete admin user | — | — | — | ✅ |
| **System** | | | | |
| View audit log | — | — | — | ✅ |
| View queue job dashboard | — | — | — | ✅ |
| View site analytics (Umami) | — | — | — | ✅ |

---

## 6. Business Flows

### 6.1 Content Publication Flow

This is the primary operational flow for all content types. The steps below describe news publication; the same structure applies to staff profiles and pages.

```
Editor logs in
  │
  ├─ Opens CMS Dashboard
  │   └─ Sees count of drafts and pending messages
  │
  ├─ Navigates to News → New Article
  │
  ├─ Writes article
  │   ├─ Enters title
  │   ├─ Writes content in rich text editor
  │   ├─ Optionally: adds excerpt, cover image, tags
  │   └─ Saves as Draft (auto-generated slug)
  │
  ├─ Previews article (opens draft in new tab via preview URL)
  │
  ├─ Clicks Publish
  │   ├─ Article: is_published = true, published_at = now()
  │   ├─ Next.js ISR revalidation triggered for /news and /news/[slug]
  │   ├─ Audit log entry created
  │   └─ Article appears on public site within seconds
  │
  └─ Done
```

**Unpublishing:** The reverse — article moves back to draft state, revalidation triggered, removed from public list. Article is not deleted.

**Deletion (SUPER_ADMIN only):** Soft delete. Article is hidden from all views but remains in the database. Can be restored within 30 days via the audit log / restore function.

---

### 6.2 Staff Profile Management Flow

```
Editor navigates to Staff → New Profile
  │
  ├─ Option A: Import from University API
  │   ├─ Editor enters university teacher ID
  │   ├─ System calls NestJS → university API
  │   ├─ API returns name, email, phone, position
  │   ├─ Fields pre-filled in form
  │   └─ Editor reviews and adjusts as needed
  │
  └─ Option B: Manual Entry
      └─ Editor fills all fields manually
  │
  ├─ Editor uploads profile photo
  │   ├─ File uploaded to MinIO (original)
  │   ├─ Image resize job enqueued
  │   └─ Processed WebP available within seconds
  │
  ├─ Editor saves as draft (is_published = false)
  │
  ├─ Editor publishes profile
  │   └─ Profile appears in public staff directory
  │
  └─ Editor optionally adds materials
      ├─ Uploads PDF
      ├─ System stores PDF in MinIO
      ├─ PDF extract job enqueued
      └─ Topics appear in CMS once extraction completes
```

---

### 6.3 Contact Form → Inbox Flow

```
Visitor fills in contact form on /contacts
  │
  ├─ Client-side validation (required fields, valid email)
  │
  ├─ POST /api/v1/messages
  │   ├─ Server-side validation (rate limiting: Nginx)
  │   ├─ Message saved to database (status: NEW)
  │   └─ 200 response with success confirmation
  │
  ├─ Visitor sees confirmation message on page
  │
  │ [Later]
  │
  ├─ Editor/Moderator logs into CMS
  │   └─ Dashboard shows unread message count
  │
  ├─ Opens Messages → sees NEW message with badge
  │
  ├─ Reads message
  │   └─ Status changes to IN_PROGRESS
  │
  ├─ Types reply text
  │   └─ Clicks "Save Reply" → reply stored, status → CLOSED
  │
  └─ Reply text is stored in system (not emailed in MVP)
      └─ Phase 2: Telegram notification triggers on new message
```

---

### 6.4 Schedule Data Flow

```
Visitor opens /staff/[slug] (staff profile page)
  │
  ├─ Next.js server component renders page
  │
  ├─ Calls GET /api/v1/schedule/:teacherId
  │
  ├─ NestJS ScheduleService:
  │   ├─ Checks Redis: key = schedule:{teacherId}:{week}
  │   │
  │   ├─ Cache HIT → returns cached JSON (fast)
  │   │
  │   └─ Cache MISS:
  │       ├─ Calls university API (api.grsu.by)
  │       │
  │       ├─ Success:
  │       │   ├─ Stores result in Redis (TTL: 1 hour)
  │       │   └─ Returns data to frontend
  │       │
  │       └─ Failure (API down):
  │           ├─ Checks Redis for stale cache
  │           ├─ Stale found → returns with _stale: true flag
  │           └─ No cache → returns 503
  │
  └─ Frontend renders schedule or shows error state
```

---

### 6.5 PDF Material Processing Flow

```
Editor uploads PDF for a staff member
  │
  ├─ Multipart form upload → NestJS MediaController
  │   ├─ MIME type validated (application/pdf only)
  │   ├─ Size checked (max 50MB)
  │   └─ File stored in MinIO: documents/{staffId}/{timestamp}.pdf
  │
  ├─ Material record created in DB
  │   └─ parse_status = PENDING
  │
  ├─ PDF extract job enqueued in BullMQ
  │
  │ [Background worker picks up job]
  │
  ├─ Worker downloads PDF from MinIO
  ├─ Extracts text with pdf-parse
  ├─ Parses structure: headings become topics
  │
  ├─ Success path:
  │   ├─ Topics saved to material_topics table
  │   └─ parse_status = DONE
  │
  └─ Failure path (all 3 retries exhausted):
      ├─ parse_status = FAILED
      ├─ parse_error = error message
      └─ Editor sees warning in CMS: "Topic extraction failed — please add topics manually"
```

---

### 6.6 Authentication Flow

```
Editor navigates to /admin/login
  │
  ├─ Enters email + password
  │
  ├─ POST /api/v1/auth/login
  │   ├─ Email looked up in DB
  │   ├─ bcrypt.compare(password, hash) — timing-safe
  │   ├─ Failure → 401, generic message ("Invalid credentials")
  │   └─ Success:
  │       ├─ Access token generated (JWT, 15 min, stored in JS memory)
  │       ├─ Refresh token generated (opaque, 7 days, set as HttpOnly cookie)
  │       └─ Refresh token hash stored in DB + Redis
  │
  ├─ Frontend stores access token in memory (Zustand store)
  │
  ├─ User accesses CMS — Bearer token sent on every API request
  │
  │ [After 15 minutes]
  │
  ├─ API returns 401 on expired access token
  ├─ Frontend intercepts → POST /api/v1/auth/refresh (cookie sent automatically)
  ├─ New access token issued, refresh token rotated
  └─ Original request retried transparently
  │
  │ [On logout]
  │
  ├─ POST /api/v1/auth/logout
  ├─ Refresh token deleted from DB and Redis
  ├─ Cookie cleared
  └─ In-memory access token discarded → redirected to /admin/login
```

---

## 7. User Journeys

### 7.1 Prospective Student: Finding Information About a Teacher

**Entry point:** Google search for "teacher name + department + university"

The student lands on `/staff/[slug]`. They see the teacher's photo, name, and position immediately (SSR, no loading state). They scroll down to find email and office hours. The schedule section shows the current week. They click the email link to start composing an email in their mail client.

**Key quality attributes:** Fast first paint, no layout shift, all text content visible without JavaScript (SSR), mobile-friendly layout.

**Alternative entry:** Student arrives at the homepage, navigates to Staff, uses the search bar to find the teacher by name (fuzzy matching handles typos).

---

### 7.2 Enrolled Student: Downloading Course Materials

**Entry point:** Bookmarked staff profile or search

The student opens the teacher's profile. At the bottom of the page they see a "Materials" section listing uploaded courses. Each entry shows the course title, subject, and an expandable list of topics. There's a "Download PDF" button next to each material.

Clicking Download opens the PDF directly (signed URL from MinIO, valid for a limited time). The student reads it in the browser or saves it locally.

**Key quality attributes:** Materials visible without login. Download link works immediately. If the topic list wasn't auto-extracted, the section still shows the PDF download (topics are optional context, not a blocker).

---

### 7.3 Editor: Publishing a News Article

**Entry point:** Receives an email/message asking them to post about an upcoming conference.

The editor navigates to `/admin`, sees the login screen, enters their credentials. They are redirected to the dashboard. They click "New Article" in the News section.

They type the title "International Conference on Applied Mathematics — 2025". They paste a prepared text into the rich text editor, formatting some lines as headings and adding a link to the conference website. They upload the conference poster as a cover image (drag and drop or file picker). They add the tag "conferences".

They click "Save Draft" and then "Preview" to check how it looks on the public-facing layout. They spot a typo, go back, fix it, save again.

They click "Publish". The article immediately appears on the homepage news feed and the `/news` list. They copy the URL and send it to colleagues.

**Key quality attributes:** Autosave or at minimum a clear save action that confirms success. Preview that shows exactly the public appearance. Publish is a single click after saving.

---

### 7.4 Super Admin: Onboarding a New Editor

The head of department wants to give a newly hired faculty member access to manage the department news.

The Super Admin logs into the CMS and navigates to Users. They click "Add User". They enter the new editor's name, email, and a temporary password. They set the role to EDITOR. They click Save.

They tell the new editor their email and temporary password and ask them to log in and change their password.

The editor logs in, sees the dashboard, and can immediately start creating content.

**Key quality attributes:** User creation is a single form. Role dropdown is clearly labelled. Newly created accounts are active by default.

---

### 7.5 Moderator: Responding to a Contact Form Submission

A department secretary with MODERATOR role logs in to check messages.

They see on the dashboard that there are 3 new messages. They navigate to Messages. The list shows sender name, subject preview, and how long ago the message arrived. NEW messages have a blue badge.

They open the first message — a question about enrolment documents. They read the body. They type a reply in the reply text area: "Dear [name], please send your documents to the admissions office at..."

They click "Send Reply". The status changes to CLOSED. The reply is saved.

**Key quality attributes:** Clear NEW / IN_PROGRESS / CLOSED status indicators. Reply field is prominent. No accidental data loss if the user navigates away (confirmation dialog or autosave).

---

## 8. Admin Flows

### 8.1 Logging In

The login screen is the only unauthenticated page under `/admin`. It contains an email field, a password field, and a "Sign In" button. There is no "Remember me" option — sessions last 7 days by default.

On failed login (wrong password, inactive account, or non-existent email), the error message is always generic: "Invalid email or password." This prevents user enumeration.

After 5 failed login attempts from the same IP within 1 minute, the auth endpoint is rate-limited (Nginx zone `auth: 5r/m`). The user sees a "Too many attempts, please try again in a minute" message.

There is no "Forgot password" flow in MVP. Password resets are done by a SUPER_ADMIN via the Users management screen.

### 8.2 Dashboard

The dashboard is the first screen after login. It is a summary view designed to answer: "What needs my attention right now?"

Components:

- **Draft Articles** — count of unpublished news articles with a link to the news list filtered to drafts
- **Unread Messages** — count of NEW messages with a link to the inbox
- **Failed Jobs** — count of materials with `parse_status = FAILED`, with a link to affected materials
- **Recent Activity** — last 10 audit log entries (action, entity, who, when), visible to SUPER_ADMIN only
- **System Health** — live indicators for API, database, and Redis status (liveness check)

The dashboard does not auto-refresh. A manual refresh button is available.

### 8.3 News List

The admin news list shows all articles (published and draft). Columns: title, status badge (Published / Draft), author name, published date (or "—" for drafts), tags, and action buttons.

Sorting: by date descending by default. Filterable by status (All / Published / Drafts) and by tag.

Row actions: Edit, Preview (opens public URL in new tab), Publish/Unpublish toggle, Delete (SUPER_ADMIN only).

Bulk actions (Phase 2): bulk publish, bulk unpublish.

Pagination: 20 items per page.

### 8.4 News Editor

A full-page editor. Two-column layout on desktop: main editing area on the left, sidebar with metadata on the right.

Left area:

- Title field (large, prominent)
- Excerpt field (optional, used for news card preview text)
- Rich text editor (Tiptap): toolbar with formatting controls, link insertion, image insertion from media library

Right sidebar:

- Status toggle: Draft / Published
- Publish button (or Unpublish if currently published)
- Cover image picker (opens media library overlay or upload)
- Tags input (comma-separated or tag pill input, creates new tags on the fly)
- SEO preview (shows how the article will appear in Google search — title + excerpt)
- Dates: Created, Last Modified, Published At (read-only)
- Author (read-only, set to current user)
- Permalink (slug, auto-generated, editable by SUPER_ADMIN only to prevent broken links)

Auto-save: saves draft automatically every 60 seconds if changes are present. A "Last saved" timestamp is shown.

### 8.5 Staff List

Shows all staff records (published and unpublished). Columns: photo thumbnail, name (display name), position, published status, sort order, actions.

Sortable by name, status, sort order. Filterable by published status.

Drag-and-drop reordering (using `sort_order` field) is available in Phase 2. In MVP, sort order is set as a numeric input in the edit form.

Row actions: Edit, Preview (opens public profile), Publish/Unpublish, Delete (SUPER_ADMIN only).

### 8.6 Staff Editor

Full-page form. Sections:

**Basic Information**

- University ID (import trigger — when filled and saved, system fetches from university API)
- Name (override) — if blank, API name is used
- Email (override) — if blank, API email is used
- Phone (override) — if blank, API phone is used
- Position / Title (override) — if blank, API position is used
- Biography (rich text, optional)

**Photo**

- Upload area (drag and drop)
- Preview of current photo and thumbnail
- Processing status indicator ("Processing..." while resize job is running)

**Publication Settings**

- Published toggle
- Sort order (numeric input)

**Materials** (sub-section, tabbed or scrollable below)

- List of attached materials with parse status indicator
- "Upload PDF" button
- Each material: title, subject, edit topics button

### 8.7 Media Library

A grid view of all uploaded files. Filterable by type (images / PDFs / videos) and searchable by filename.

Each item: thumbnail (for images), filename, size, upload date, uploader name.

Clicking an item opens a detail panel showing: full preview, public URL (copyable), dimensions (for images), upload metadata. Action buttons: Copy URL, Delete (SUPER_ADMIN only).

Upload: drag files onto the page or click "Upload Files". Multiple files can be uploaded simultaneously. Progress indicators per file. On complete, items appear in the grid.

The media library is also accessible as an overlay when inserting images in the news or page editors.

### 8.8 Messages Inbox

A table of contact form submissions. Columns: sender name, email, subject, preview of first line, status badge, received date.

Sorted by date descending. Filterable by status.

Clicking a row opens a detail panel (or full-page view). Shows the full message. Below the message: reply text area, "Save Reply" button, and status selector.

Unread/new messages are visually distinct (bold text, blue dot).

### 8.9 User Management (SUPER_ADMIN)

A simple list of all admin users. Columns: name, email, role, status (Active / Inactive), last login, created date.

Actions per user: Edit (name, email, role), Reset Password, Deactivate / Reactivate, Delete.

Editing a user's own account: a Super Admin can edit themselves, but cannot change their own role to a lower privilege level (prevents accidental self-lockout). Cannot delete own account if they are the last SUPER_ADMIN.

Password reset: generates a temporary password displayed once in the UI. The editor must change it on next login. (Password change flow is in Phase 2 — in MVP the admin sets it directly.)

### 8.10 Audit Log (SUPER_ADMIN)

A chronological table of all tracked actions. Columns: timestamp, user, action, entity type, entity name/title, IP address.

Filterable by: user, action type, entity type, date range.

Clicking a row expands it to show `old_values` and `new_values` JSON (pretty-printed diff of what changed).

The log is read-only. There is no way to delete entries from the UI or API.

---

## 9. Edge Cases

### Authentication & Sessions

**Simultaneous sessions** — A user can be logged in on multiple devices (multiple refresh tokens in the DB). Logging out on one device only revokes that device's session.

**Stolen refresh token** — If a refresh token is used after already being rotated (reuse detection), all sessions for that user are immediately revoked. The user is logged out everywhere and must log in again. A security warning is logged in the audit log.

**Account deactivated mid-session** — If a user's account is deactivated while they are logged in, their next access token refresh will fail (the rotateRefreshToken function checks `isActive`). They will be silently logged out within 15 minutes.

**Last Super Admin account** — Attempting to delete or deactivate the last SUPER_ADMIN account returns an error: "Cannot deactivate the last Super Admin." This is enforced at the service level.

**Concurrent login from new device** — Allowed. The user sees multiple active sessions if a session management UI is added in Phase 2.

### Content Management

**Duplicate slug on publish** — Slugs are auto-generated from the title. If two articles have the same title, a numeric suffix is appended (`conference-2025`, `conference-2025-2`). The editor can see and modify the slug in the editor sidebar (SUPER_ADMIN only in MVP).

**Editing a published article** — Changes to a published article are saved immediately. A revalidation is triggered so the public page updates within the ISR window (typically within seconds). There is no separate draft/revision history in MVP — the most recent save is always the live version.

**Unpublishing a news article that is linked externally** — The slug and URL remain stable. If the article is later republished, it returns at the same URL. If it is deleted, a 404 is returned — there is no redirect management in MVP.

**Image upload during rich text editing** — If an image is inserted into an article body before the resize job completes, the article is saved with the original URL. Once the job completes, the media record is updated with the WebP URL, but the article's stored HTML still contains the original URL. To address this: the editor should upload images to the media library and wait for processing before inserting (the media library shows a "Processing" badge). Alternatively, insert the image and save — the public page will show the original until the job completes and the editor re-selects the processed version.

**Staff profile with no photo** — A default avatar placeholder is shown on both the admin list and the public directory. This is a static image, not a generated one.

**Staff without university ID** — Valid. Not all staff may be in the university system. Manual creation works without a university ID. The schedule section is hidden on the public profile for staff without a `universityId`.

**Material PDF is corrupted or password-protected** — `pdf-parse` will fail. The job will retry 3 times. On final failure, `parse_status = FAILED` and `parse_error` shows the specific error. The PDF is still downloadable. The editor is prompted to enter topics manually.

**Large PDF** — Files up to 50MB are accepted. The BullMQ job processes asynchronously, so upload response is fast. Very long PDFs (hundreds of pages) may take longer to parse; the worker handles this gracefully and the topic extraction may be partial (max 50 topics extracted).

**Two editors editing the same article simultaneously** — Last write wins. There is no real-time collaboration or conflict detection in MVP. If two editors save the same article close together, the later save overwrites the earlier one. This is acceptable given the small team size.

### Schedule Proxy

**University API returns unexpected format** — The schedule service should wrap parsing in a try/catch. If the response shape changes unexpectedly, the error is logged, the endpoint returns a 503, and the frontend shows the error state. No stale cache is poisoned.

**University API is down at page load** — If there is no cached version, the schedule section shows: "Schedule temporarily unavailable. Please check back later." The rest of the staff profile page renders normally — the schedule failure does not block the page.

**Teacher has no university ID** — The schedule endpoint is not called. The schedule section is hidden entirely on the public profile.

**User requests a week far in the future or past** — The cache key includes the date range. Unusual date ranges will miss cache and hit the university API directly. This is acceptable — these requests are rare.

### File Storage

**MinIO unavailable during upload** — The upload will fail. The NestJS controller returns a 503. The frontend shows an upload error to the editor. No partial record is created in the database.

**MinIO unavailable during job processing** — The BullMQ job will fail and retry. If MinIO comes back before retries are exhausted, the job succeeds on retry. If MinIO is down for longer than the backoff window, the job is marked FAILED and the editor is notified.

**File deleted from MinIO but record exists in DB** — Can happen if the deletion job fails after marking the DB record for deletion. The media record will still show in the library as "deleted" (soft-deleted, invisible to editors), and the cron job will retry deletion. If the file is truly gone from MinIO, the deletion attempt silently succeeds.

### Search

**Empty search query** — Returns an empty result set, not all records. This is intentional to prevent accidental full-table scans from the search endpoint.

**Search query with special characters** — The FTS query uses `plainto_tsquery('russian', $1)` which handles most special characters gracefully. The input is never passed raw to SQL.

**No search results** — The UI shows "No results found for '[query]'" with a suggestion to check spelling or try a different term.

### Background Jobs

**Redis unavailable** — BullMQ depends on Redis. If Redis is down, no new jobs can be enqueued. The upload still saves the file to MinIO and creates the DB record, but the processing job is not queued. Uptime Kuma detects the Redis outage and alerts the developer. On Redis recovery, jobs that were attempted before the outage will not be automatically re-queued — this edge case requires manual intervention (a utility script to re-enqueue PENDING materials).

**Worker process crashes mid-job** — BullMQ marks the job as stalled after a timeout and re-queues it. The worker picks it up on restart. The processor is idempotent for both PDF extraction (deletes existing topics before inserting) and image resize (overwrites MinIO objects).

---

## 10. UX Requirements

### General Principles

**Speed is a feature.** The public site must be perceived as instant. Server-side rendered pages, aggressive HTTP caching, and next/image optimisation are non-negotiable. No visible layout shift. No content flicker on first load.

**The CMS must be learnable in one session.** A faculty member with no technical background should be able to publish their first news article without asking for help. Error messages must be written in plain language, not HTTP codes.

**Consistency over creativity.** The admin UI uses a consistent component library (shadcn/ui). Every save action looks the same. Every delete action requires confirmation. Every error appears in the same place. Editors should never have to hunt for functionality.

**Progressive disclosure.** Advanced options (SEO metadata, custom slug, sort order) are available but secondary. The primary task — writing and publishing — is the most prominent path.

---

### Public Site UX

**Page Load Performance**

- Largest Contentful Paint (LCP): under 2.5 seconds on a 4G connection
- Cumulative Layout Shift (CLS): under 0.1
- First Contentful Paint (FCP): under 1.5 seconds
- All images use `next/image` for automatic sizing and WebP conversion
- No third-party scripts that block rendering except Umami analytics (which is async and lightweight)

**Navigation**

The main navigation is always visible on desktop. On mobile, it collapses to a hamburger menu. The current section is visually highlighted. The department name / logo in the header links to the homepage.

Breadcrumbs are shown on inner pages (e.g., News > Article Title) for context and SEO.

**News Feed**

- Cards show: cover image (with aspect ratio preserved), title, excerpt (max 2 lines, truncated), date, author, tag badges
- Clicking anywhere on the card navigates to the article
- Tags in cards are clickable and filter the feed
- Pagination is numeric (Previous / 1 / 2 / 3 / Next), not infinite scroll — URLs are bookmarkable and shareable

**Staff Directory**

- Default layout: 3-column grid on desktop, 2-column on tablet, 1-column on mobile
- Sorting: by `sort_order` (set by editors)
- No client-side filtering in MVP (a search bar for staff is available from the main search)

**Staff Profile**

The schedule section defaults to the current week. Navigation arrows allow moving to the next/previous week. A "Today" button returns to the current week. If the schedule is loading (network delay), a skeleton loader is shown in place of the timetable.

**Contact Form**

- Client-side validation with inline error messages (not alert boxes)
- Submit button shows a loading state while the request is in flight
- Success state replaces the form with a confirmation message (no page navigation)
- On network error, an error message is shown and the form remains filled so the user does not lose their text

**404 and Error Pages**

- 404 page: friendly message, link to homepage, search bar
- 500 page: friendly message, no technical details exposed to users
- Both pages maintain the site header and footer (they feel like part of the site, not broken states)

---

### Admin (CMS) UX

**Layout**

Persistent left sidebar for navigation on desktop. Top bar with user name, role badge, and logout button. Main content area. On mobile, the sidebar collapses to an icon bar.

Navigation items in sidebar: Dashboard, News, Staff, Pages, Media, Messages, Users (SUPER_ADMIN only), Audit Log (SUPER_ADMIN only).

Unread message count is shown as a badge on the Messages nav item.

**Forms and Validation**

- All form validation errors appear inline, below the relevant field, in red
- Required fields are marked with an asterisk
- The primary action button (Save, Publish) is always in a consistent position (bottom-right of the form or top of the sidebar)
- Destructive actions (Delete, Unpublish) require a confirmation dialog: "Are you sure you want to [action]? This [can be undone / cannot be undone]."
- For Delete: the confirmation dialog names the specific item ("Delete 'Conference 2025'?") to prevent accidental deletions

**Feedback**

- Every save action shows a toast notification: green "Saved successfully" or red "Failed to save. Please try again."
- Toasts auto-dismiss after 5 seconds but can be dismissed manually
- Long operations (PDF processing, image resize) show a progress indicator or status badge that updates without requiring page refresh (polling)

**Rich Text Editor (Tiptap)**

Toolbar: Bold, Italic, Underline, Strikethrough | Heading 1, Heading 2, Heading 3 | Bullet list, Numbered list | Blockquote | Link | Insert image (opens media library) | Clear formatting

The editor auto-formats pasted text (strips extraneous HTML from Word/Google Docs). Pasting a plain URL detects if it's a YouTube link and offers to embed it.

Images in the editor show as inline with a resize handle (Phase 2). In MVP, images are full-width by default.

Keyboard shortcuts follow platform conventions (Cmd/Ctrl+B for bold, etc.).

**Media Library Overlay**

When inserting an image from the rich text editor, a modal overlay opens showing the media library grid. The editor can search, filter by type, and click to select. A "Upload new file" button is available inside the overlay. Selecting an image inserts it into the editor at the cursor position and closes the overlay.

**Responsive Admin**

The CMS is designed primarily for desktop use. On tablets, the layout adapts to a single-column form view with a collapsible sidebar. On mobile, editing functionality is accessible but not optimised — the expectation is that editing is done on desktop.

**Empty States**

Every list view has a designed empty state: a clear illustration or icon, a brief message ("No articles yet"), and a primary action button ("Create first article"). Empty states are never blank white boxes.

**Loading States**

Every data fetch shows a skeleton loader (not a spinner) that matches the shape of the expected content. This prevents layout jump when content loads.

**Session Expiry**

When the session expires (both access and refresh tokens expired), the next API request returns a 401. The frontend intercepts this, stores the current URL, redirects to `/admin/login`, and shows a notice: "Your session has expired. Please log in again." After login, the user is redirected back to the page they were on.

---

### Accessibility

- All interactive elements are keyboard-navigable (Tab order is logical)
- Focus states are clearly visible (not removed)
- Images have meaningful alt text (set by editors in the media library and rich text editor)
- Color contrast meets WCAG AA for all text
- Form labels are properly associated with inputs
- Error messages are linked to their fields via `aria-describedby`
- The site is tested with a screen reader for the primary public pages (homepage, news article, staff profile)

---

### Internationalisation Readiness

The MVP is Russian-language only. The codebase is structured for future addition of Belarusian (BY) and English (EN) without schema changes:

- All `title`, `content`, `bio` fields store the current (RU) value
- `next-intl` is configured from day one with RU as the default locale
- URL structure will be `/ru/news/...`, `/by/news/...` when multilingual support is added
- Date and number formatting uses locale-aware utilities
- Editors are informed not to hard-code Russian-language strings in page blocks — all UI strings go through the translation layer even if only one language exists today

---

*End of Product Documentation v1.0*
