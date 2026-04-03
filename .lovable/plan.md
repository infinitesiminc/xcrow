

# Lead Hunter — Streamlined Single-Page Workflow Layout

## Current Problem
The layout splits ICP map and pipeline into stacked sections, requiring scrolling. The niche tree takes significant vertical space before the user even sees leads. Actions are buried inside tree nodes.

## Proposed Layout

```text
┌──────────────────────────────────────────────────────────┐
│ [website url input] ───────────────── [Map ICP]  (hero)  │
└──────────────────────────────────────────────────────────┘
                         ↓ after discovery ↓
┌─────────────┬────────────────────────────────────────────┐
│  SIDEBAR    │  ACTION BAR                                │
│  (240px)    │  [Find] [Enrich] [Score] [Draft] [Export]  │
│             ├────────────────────────────────────────────┤
│ All Leads   │                                            │
│ ▶ Healthcare│  LEAD TABLE (dense rows)                   │
│   ├ Clinics │  NAME  TITLE  COMPANY  EMAIL  STAGE  ···   │
│   └ Pharma  │  ─────────────────────────────────────     │
│ ▶ SaaS      │  row row row row row                       │
│   ├ Infra   │  row row row row row                       │
│   └ DevTool │  row row row row row                       │
│             │                                            │
│ ─────────── │                                            │
│ ⚙ Settings  │  click row → Lead Detail Drawer opens →   │
└─────────────┴────────────────────────────────────────────┘
│  💬 AI Chat FAB (bottom-right, existing)                 │
└──────────────────────────────────────────────────────────┘
```

**Flow**: Website URL → Discovery → Sidebar shows niche tree, main area shows lead table. Select a niche in sidebar → table filters. Action bar at top of table applies to selected niche.

## What Changes

### 1. New: `AppSidebar` component
- Minimal collapsible sidebar using existing `shadcn/sidebar` primitives
- Three sections: niche tree (reuse `NicheSidebar` logic), divider, Settings link
- Collapses to icons on toggle
- Replaces the `NicheFunnelMap` as the primary niche navigation

### 2. Rewrite: `LeadgenDashboard`
- Remove `NicheFunnelMap` from the dashboard
- Add **action toolbar** above the lead table: Find, Enrich, Score, Draft All, Export — bound to `activeNiche`
- Remove Pipeline/Activity tabs — merge Activity into the Lead Detail Drawer's outreach section
- Keep `LeadPipeline` as the main content (already has table-like cards; convert to actual table in a follow-up)

### 3. Update: `Leadgen.tsx` page layout
- Wrap post-discovery UI in `SidebarProvider` + `Sidebar` + main content area
- Move `contextBar` into the sidebar header (company name + stats)
- Keep discovery hero as full-screen (no sidebar until ICP is mapped)
- Keep floating chat FAB and Lead Detail Drawer unchanged

### Files affected

| File | Change |
|------|--------|
| `src/components/leadgen/AppSidebar.tsx` | **New** — sidebar with niche tree + settings |
| `src/components/leadgen/LeadgenDashboard.tsx` | Remove NicheFunnelMap, add action toolbar, remove tabs |
| `src/pages/Leadgen.tsx` | Wrap in SidebarProvider, restructure layout |
| `src/components/leadgen/NicheFunnelMap.tsx` | No change (kept for potential reuse, just unused) |

