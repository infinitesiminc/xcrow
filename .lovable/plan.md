

# Lead CRM Dashboard — Design Plan

## Overview
Add a persistent Lead CRM dashboard accessible from `/leadgen` when the user is signed in. Currently, leads only exist in-memory during a chat session — they disappear on refresh. The dashboard will persist leads to the database and provide a CRM-like interface for managing outreach.

## Architecture

```text
┌──────────────────────────────────────────────────┐
│  /leadgen (signed in)                            │
│  ┌──────────┐  ┌────────────────────────────────┐│
│  │ Sidebar   │  │  Tab View                     ││
│  │           │  │  [Pipeline] [Chat] [Activity]  ││
│  │ • Pipeline│  │                                ││
│  │ • Chat    │  │  Pipeline tab:                 ││
│  │ • Activity│  │  KPI cards (total, emailed,    ││
│  │           │  │  replied, conversion %)        ││
│  │           │  │  Lead table with status,       ││
│  │           │  │  filters, bulk actions         ││
│  │           │  │                                ││
│  │           │  │  Chat tab:                     ││
│  │           │  │  (existing chat + panel UI)    ││
│  │           │  │                                ││
│  │           │  │  Activity tab:                 ││
│  │           │  │  Email send log + timestamps   ││
│  └──────────┘  └────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

## Step-by-step

### 1. Create `saved_leads` database table
New migration with columns: `id`, `user_id`, `name`, `title`, `company`, `email`, `phone`, `linkedin`, `website`, `address`, `source`, `email_confidence`, `summary`, `reason`, `photo_url`, `status` (enum: new/contacted/replied/won/lost), `created_at`, `updated_at`. RLS: users can CRUD their own leads only.

### 2. Create `outreach_log` table
Tracks each email/action per lead: `id`, `user_id`, `lead_id` (FK to saved_leads), `channel` (email/sms), `subject`, `body`, `sent_at`, `status` (sent/opened/bounced). RLS: users own rows only.

### 3. Auto-save leads from chat
When leads arrive in the chat stream, upsert them into `saved_leads` (deduplicate on user_id + email + company). This replaces the in-memory-only accumulation.

### 4. Build `LeadgenDashboard` component
A tabbed layout replacing the current full-page chat:
- **Pipeline tab**: KPI stat cards (total leads, contacted, reply rate) + a searchable/filterable table of all saved leads with status badges, quick actions (draft email, change status), and bulk export (CSV).
- **Chat tab**: The existing chat + side panel UI, now persisting discovered leads automatically.
- **Activity tab**: Chronological log of all outreach actions pulled from `outreach_log`.

### 5. Update `Leadgen.tsx` routing
Signed-in users see the dashboard with tabs. Signed-out users see the existing chat-only experience (or auth prompt).

### 6. Wire email sending to `outreach_log`
After `handleSendEmail` succeeds, insert a row into `outreach_log` linking the lead_id, subject, body, and timestamp.

## Files to create/edit
- **New migration**: `saved_leads` + `outreach_log` tables with RLS
- **New**: `src/components/leadgen/LeadgenDashboard.tsx` — tabbed layout
- **New**: `src/components/leadgen/LeadPipeline.tsx` — KPI cards + lead table
- **New**: `src/components/leadgen/ActivityLog.tsx` — outreach history
- **Edit**: `src/pages/Leadgen.tsx` — integrate dashboard for authed users
- **Edit**: `src/components/leadgen/LeadCard.tsx` — add status selector
- **Edit**: `src/components/leadgen/LeadsPanel.tsx` — save leads on arrival

