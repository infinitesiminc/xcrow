

# Redesign: Unified Flash Account Dashboard

## Current State (What Exists Today)

The left panel has **4 tabs** — Pipeline, Market, M&A, Detail — each serving a different purpose but fragmenting the user's workflow:

| Tab | Content | Problem |
|-----|---------|---------|
| **Pipeline** | Search, stage/type filters, garage discovery controls, account list | Cluttered with scan controls; filters rarely changed |
| **Market** | Geo drill-down analytics (Country→State→City), operator leaderboard | Separate analytics silo; doesn't connect to accounts |
| **M&A** | Acquisition scoring table for 100 operators | Duplicate of Pipeline data with different lens |
| **Detail** | Account info, contacts, locations, activity | Only visible after selecting; user loses context |

**Data audit** (124 accounts in DB):
- 124 have coordinates + website
- 101 have revenue, ownership, founded year
- 100 have ownership_type
- 79 have current_vendor
- **0 contacts saved** (generated on-demand via Apollo but not persisted yet)

---

## Proposed Design: Single-View Dashboard

Remove tabs entirely. Replace with a **two-section left panel**:

```text
┌──────────────────────────┬─────────────────────────────┐
│  LEFT PANEL (440px)      │                             │
│                          │                             │
│  ┌─ SEARCH BAR ────────┐ │                             │
│  │ 🔍 Search accounts  │ │                             │
│  └──────────────────────┘ │                             │
│                          │         MAP                 │
│  ┌─ ACCOUNT LIST ──────┐ │    (auto-zooms on select)   │
│  │ Metropolis    ●  85  │ │                             │
│  │ LAZ Parking   ●  72  │ │                             │
│  │ ABM Parking   ●  68  │ │                             │
│  │ ...                  │ │                             │
│  └──────────────────────┘ │                             │
│ ─── OR when selected ─── │                             │
│  ┌─ ACCOUNT DETAIL ────┐ │                             │
│  │ ← Back to list      │ │                             │
│  │ Metropolis           │ │                             │
│  │ Revenue · Ownership  │ │                             │
│  │ [Find Contacts]      │ │                             │
│  │ Contact cards...     │ │                             │
│  └──────────────────────┘ │                             │
│                          │                             │
│  ┌─ DATA PIPELINE ─────┐ │                             │
│  │ Collapsible section  │ │                             │
│  │ Coverage bars + chat │ │                             │
│  └──────────────────────┘ │                             │
└──────────────────────────┴─────────────────────────────┘
```

### Section 1: Accounts (top, scrollable)

**Default state — Account List:**
- Single search bar (searches name, city, vendor, revenue)
- Compact sortable list showing: Name, HQ City, Stage badge, M&A score badge
- Click any row → map auto-zooms to HQ, panel switches to detail view

**Selected state — Account Detail:**
- Back arrow returns to list
- Account header: name, stage, ownership, revenue, vendor
- "Find Decision-Makers" button → generates leads inline
- Contact cards appear below as they stream in
- Notes, linked locations collapsible

### Section 2: Data Pipeline (bottom, collapsible)

A compact section showing data coverage + AI enrichment chat:
- **Coverage bars**: visual progress for key fields across all 124 accounts
  - Coordinates: 124/124 (100%)
  - Revenue: 101/124 (81%)
  - Ownership: 100/124 (81%)
  - Vendor: 79/124 (64%)
  - Contacts: 0/124 (0%)
- **AI Chat input**: "Enrich missing vendors" or "Generate contacts for all targets" — triggers batch operations
- Garage discovery controls move here (they're data pipeline operations)

### What Gets Removed

- **Pipeline tab** → becomes the default account list (filters simplified to search only; stage/type chips become inline toggles)
- **Market tab** → removed from sidebar; market analytics accessible via a floating button on the map or future dedicated page
- **M&A tab** → removed as separate view; M&A score becomes a column in the unified account list
- **Detail tab** → becomes inline detail view (replaces list when account selected)

---

## Technical Changes

### 1. `src/pages/FlashParkingMap.tsx`
- Remove `Tabs` component and `activeTab` state
- Replace with `selectedAccountId` controlling list-vs-detail view
- Add `viewportHint` update when account is selected (pan to `hqLat/hqLng`, zoom 12)
- Move garage discovery controls into collapsible "Data Pipeline" section at bottom
- Remove Market and M&A tab imports

### 2. `src/components/enterprise/AccountListView.tsx` (new)
- Search bar + inline stage/type chip filters
- Sortable compact list with columns: Name, City, Stage, Score
- M&A score calculated inline (reuse `scoreTarget` from MAStrategyPanel)
- Click handler calls parent's `onSelectAccount`

### 3. `src/components/enterprise/AccountDetailInline.tsx` (new)
- Back button + account header
- Merges key fields from AccountDetailPanel (overview, contacts, find-contacts button)
- Streamlined single-scroll layout (no internal tabs)

### 4. `src/components/enterprise/DataPipelineSection.tsx` (new)
- Coverage progress bars computed from account data
- AI chat input for batch enrichment commands
- Garage discovery controls (scan, enrich capacity) relocated here
- Collapsible by default

### 5. Cleanup
- `MAStrategyPanel.tsx` — keep `scoreTarget` function, export it; remove the full panel component (or keep for future board view)
- `MarketPanel.tsx` — keep for potential future use, remove from sidebar
- `AccountDetailPanel.tsx` — refactor into `AccountDetailInline.tsx`

