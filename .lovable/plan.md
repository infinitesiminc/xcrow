

# Rethinking Data for Account Development

## The Problem

Right now, data is scattered across disconnected layers that don't talk to each other:

- **Accounts** are hardcoded in JS files — can't track progress, add notes, or change stages
- **Discovered garages** sit in the DB but aren't linked to accounts — a LAZ Parking garage doesn't connect to the LAZ Parking account
- **Decision-makers** found via "Find Contacts" live in React state — gone on page refresh
- **Market stats** are informational but don't feed into account prioritization
- **No activity history** — no record of outreach attempts, stage changes, or notes

## The Vision: Account-Centric Data Model

Everything flows toward one goal: **move an account from Whitespace → Target → Active Partner**. Every data layer should serve that pipeline.

```text
┌─────────────────────────────────────────────────────┐
│                    ACCOUNT                          │
│  (the central entity everything connects to)        │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Contacts │  │ Locations│  │ Activity Timeline │  │
│  │ (leads)  │  │ (garages)│  │ (notes, outreach) │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│                                                     │
│  Stage: whitespace → target → engaged → active      │
│  Score: auto-calculated from signals                │
│  Territory: geo-linked to map                       │
└─────────────────────────────────────────────────────┘
```

## What Changes

### 1. Accounts move to the database
Create a `flash_accounts` table that mirrors the current static data but adds mutable fields: stage progression, owner assignment, priority score, and notes. Seed it from the existing JS arrays via migration. The static files become read-only fallbacks.

### 2. Garages link to accounts
Add an `account_id` column to `discovered_garages`. When a garage's `operator_guess` matches an account name, auto-link them. This lets you see "LAZ Parking has 47 locations in LA" directly on the account card.

### 3. Contacts persist per account
Create a `flash_account_contacts` table that stores decision-makers found via "Find Decision-Makers". No more losing them on refresh. Each contact links to an account and tracks outreach status.

### 4. Activity timeline per account
Create a `flash_account_activities` table for notes, stage changes, outreach logs, and system events (e.g., "3 new garages discovered in territory"). This gives a CRM-like timeline on every account detail panel.

### 5. Account scoring from signals
Auto-calculate an account priority score based on: number of locations discovered, total capacity, market share in territory, whether contacts have been found, and recency of activity. Surface this as a sortable column in the sidebar.

### 6. Market stats feed account strategy
The MarketPanel's operator leaderboard becomes actionable — clicking an operator navigates to their account, showing linked garages, contacts, and activity. Market share data enriches the account card.

## Database Schema

```sql
-- Core account table (seeded from static data)
CREATE TABLE flash_accounts (
  id text PRIMARY KEY,
  name text NOT NULL,
  account_type text NOT NULL,        -- airport, large_venue, fleet_operator
  stage text NOT NULL DEFAULT 'whitespace',
  hq_city text, hq_lat float8, hq_lng float8,
  estimated_spaces text, facility_count text,
  focus_area text, website text, differentiator text,
  current_vendor text,
  annual_revenue text, employee_count text, founded int,
  priority_score int DEFAULT 0,
  owner_id uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Link garages to accounts
ALTER TABLE discovered_garages ADD COLUMN account_id text REFERENCES flash_accounts(id);

-- Persisted contacts per account
CREATE TABLE flash_account_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text REFERENCES flash_accounts(id) ON DELETE CASCADE,
  name text NOT NULL, title text, email text, phone text,
  linkedin text, score int, reason text,
  outreach_status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Activity timeline
CREATE TABLE flash_account_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text REFERENCES flash_accounts(id) ON DELETE CASCADE,
  user_id uuid, activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

## UI Impact

### Account Detail Panel (enhanced)
- **Header**: Account name, stage badge (now editable), priority score
- **Tabs**: Overview | Contacts | Locations | Activity
  - **Overview**: Current info + market position (locations in territory, market share)
  - **Contacts**: Persisted decision-makers with outreach status tracking
  - **Locations**: Linked garages from discovered_garages, with capacity/rating
  - **Activity**: Timeline of notes, outreach, stage changes, discoveries

### Sidebar Account List
- Sortable by priority score (auto-calculated)
- Stage changes are now persistent and tracked
- Badge showing contact count and linked location count

### Market Panel → Account Navigation
- Clicking an operator in the leaderboard opens their account
- Market share data appears on the account card

## Implementation Steps

1. **Create DB tables** — `flash_accounts`, `flash_account_contacts`, `flash_account_activities` with RLS policies (superadmin-only)
2. **Seed accounts** — Migration SQL that inserts all current static accounts into `flash_accounts`
3. **Update FlashParkingMap** — Read accounts from DB instead of static arrays; fall back to static if DB is empty
4. **Persist contacts** — After "Find Decision-Makers" completes, save results to `flash_account_contacts`; load on panel open
5. **Link garages to accounts** — Add `account_id` to discovered_garages; run a matching function on operator_guess
6. **Add activity logging** — Log stage changes, contact discoveries, and manual notes
7. **Account scoring** — DB function that calculates priority from linked data
8. **Enhanced detail panel** — Tabbed layout with Overview/Contacts/Locations/Activity

## Files Changed
- `supabase/migrations/` — New tables, seed data, scoring function
- `src/pages/FlashParkingMap.tsx` — Read from DB, persist contacts, activity logging
- `src/components/enterprise/ContextPanel.tsx` — Tabbed detail view
- `src/components/enterprise/MarketPanel.tsx` — Operator → account navigation
- `src/data/flash-prospects.ts` — Keep as fallback/seed source only

