

# ICP Map Page — Auto-Seed Leads + Insights Panel + Table View

## What We're Building

After ICP discovery, the system auto-generates 1 sample lead per persona niche. Users see exactly which URLs were analyzed and why. Leads display in a dense table. Two new actions let users scale: **"Generate More"** (batch of 5 per niche) and **"Find Lookalikes"** (from a single lead row).

## Layout

```text
┌─────────────┬──────────────────────────────────────────────┐
│  SIDEBAR    │  ICP INSIGHTS (collapsible)                  │
│  (niches)   │  🌐 site.com · 4 pages analyzed              │
│             │  ✓ /about → Company signals                  │
│             │  ✓ /solutions → Product data                 │
│             │  Summary: "SaaS for logistics..."            │
│             ├──────────────────────────────────────────────┤
│             │  [+Batch] [Enrich] [Score] [Draft] [Export]  │
│             ├──────────────────────────────────────────────┤
│             │  NAME   TITLE   COMPANY  EMAIL  STAGE  ACT   │
│             │  ───────────────────────────────────────────  │
│             │  row  (👤 icon for Lookalike)                 │
│             │  row                                          │
└─────────────┴──────────────────────────────────────────────┘
```

## Changes

### 1. Edge function: return `pages_analyzed` metadata
**File**: `supabase/functions/leadgen-scout/index.ts`

The function already tracks `bestPages` and `pageResults`. Add a `pages_analyzed` array to the response:
```json
{ "url": "https://site.com/about", "path": "/about", "category": "about" }
```

Build this from the existing `pageResults` array plus the homepage. Include in the final `json()` response alongside existing fields.

### 2. Auto-seed 1 lead per persona niche after discovery
**File**: `src/pages/Leadgen.tsx`

After `handleDiscover` successfully returns niches, automatically trigger `handleFindLeads` for each **persona-level** niche (leaf nodes). The existing `handleFindLeads` already calls `leadgen-chat` and upserts results. We limit the prompt to request exactly 1 lead per call.

Add a new function `handleAutoSeed` that:
- Filters niches to `niche_type === "persona"` 
- Calls `handleFindLeads` for each (sequentially to avoid rate limits)
- Shows a progress toast: "Seeding 1 lead per niche (3/8)..."

Also capture `data.pages_analyzed` from scout response into new state `pagesAnalyzed`.

### 3. New component: `ICPInsightsPanel`
**File**: `src/components/leadgen/ICPInsightsPanel.tsx`

Collapsible panel above the action bar showing:
- Website URL (clickable link)
- Pages analyzed count + list with path and category
- Company summary + ICP summary
- Chevron toggle to collapse

Props: `websiteUrl`, `pagesAnalyzed`, `companySummary`, `icpSummary`, `pagesScraped`

### 4. Replace lead cards with table rows
**File**: `src/components/leadgen/LeadPipeline.tsx`

Replace the `<Card>` loop with a `<Table>` using existing `shadcn/table` components:
- Columns: Avatar+Name, Title, Company, Email, Stage (dropdown), Actions
- Actions column: Draft email button + **"Lookalike"** button (Users icon)
- Each row clickable → opens Lead Detail Drawer
- Keep KPI cards and filter bar above

### 5. "Generate More" batch action
**File**: `src/components/leadgen/LeadgenDashboard.tsx` + `src/pages/Leadgen.tsx`

Replace the "Find" button with **"+Batch"** — calls `handleFindLeads` with a modified prompt requesting 5 leads. Same SSE flow, just different prompt text.

### 6. "Find Lookalikes" per-lead action
**File**: `src/pages/Leadgen.tsx` + `src/components/leadgen/LeadPipeline.tsx`

New handler `handleFindLookalikes(lead)`:
- Takes a single lead's name, title, company as context
- Sends to `leadgen-chat` with prompt: "Find 3 people similar to [name] at [company] ([title]) — same industry, role, company size"
- Upserts results with same `niche_tag`

Exposed as a button (Users icon) in the Actions column of the table.

### 7. Dashboard integration
**File**: `src/components/leadgen/LeadgenDashboard.tsx`

- Add `ICPInsightsPanel` above the action bar
- Pass through new props: `pagesAnalyzed`, `companySummary`, `icpSummary`, `websiteUrl`
- Rename "Find" → "+Batch" in action bar
- Add `onFindLookalikes` prop, pass down to `LeadPipeline`

## Files Affected

| File | Action |
|------|--------|
| `supabase/functions/leadgen-scout/index.ts` | Add `pages_analyzed` to response |
| `src/components/leadgen/ICPInsightsPanel.tsx` | **New** — collapsible discovery insights |
| `src/components/leadgen/LeadPipeline.tsx` | Cards → table rows + lookalike button |
| `src/components/leadgen/LeadgenDashboard.tsx` | Add insights panel, rename Find → +Batch |
| `src/pages/Leadgen.tsx` | Auto-seed logic, pagesAnalyzed state, lookalikes handler |

