

## Whitespace Discovery for /disrupt

### Problem
Users see a flat list of incumbents per vertical but have no way to spot where the best startup opportunities are — sub-verticals where incumbents dominate but few disruptors exist.

### Data Available
The `company_vertical_map` table already has `sub_vertical`, `role` (incumbent/disruptor/transitioning), and company references. Current query results show rich sub-vertical breakdowns (e.g., "CRM & Sales" has 7 sub-verticals with incumbents like "Enterprise CRM", "Sales Engagement" etc., and 31 disruptors scattered across many niches).

**Whitespace signal**: Sub-verticals with high incumbent count but low/zero disruptor count = opportunity. Sub-verticals crowded with disruptors = competitive.

### Plan

#### 1. Extend `useVerticalMap` hook to compute sub-vertical whitespace scores

Add per-sub-vertical counts (`incumbent`, `disruptor`, `transitioning`) to the existing `SubVertical` interface. Derive a simple whitespace label:
- **"Open"** — incumbents present, zero disruptors
- **"Low competition"** — incumbent:disruptor ratio > 2:1
- **"Crowded"** — more disruptors than incumbents

#### 2. Add an expandable sub-vertical breakdown per vertical on the browse page

Below each vertical header (where badges already show totals), add a collapsible row of sub-vertical pills. Each pill shows:
- Sub-vertical name
- Incumbent count / Disruptor count
- Color-coded: green = open whitespace, amber = low competition, red = crowded

Clicking a sub-vertical pill filters the incumbent cards below to only that sub-vertical's companies (or scrolls to them).

#### 3. Add a "Show Whitespace" toggle/filter

A single toggle at the top filter bar (next to "All" and vertical pills) that, when active:
- Sorts verticals by whitespace opportunity (most open sub-verticals first)
- Hides crowded sub-verticals
- Highlights open/low-competition sub-verticals visually

#### 4. Show sub-vertical context on incumbent cards

When a sub-vertical is selected/filtered, show a small context line on each incumbent card: "1 of 2 incumbents · 0 disruptors in this niche" — making the whitespace tangible.

### Technical Details

**Hook changes** (`src/hooks/use-vertical-map.ts`):
- Add `counts: { incumbent, disruptor, transitioning }` to `SubVertical` interface
- Compute counts during the existing aggregation loop
- Add a `whitespace` computed field per sub-vertical

**UI changes** (`src/pages/Disrupt.tsx`):
- Add collapsible sub-vertical pill row under each vertical header
- Add "Whitespace" toggle to top filter bar
- Filter/sort logic based on sub-vertical selection and whitespace mode
- No new components needed — all inline in existing browse phase

**No database changes required** — all data already exists in `company_vertical_map`.

