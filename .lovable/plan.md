
# Minimum-Click Lead Hunter UX

## Problem
Users must click each niche individually to see leads and trigger actions. No unified view.

## Solution: "All Leads First" Design

### Layout Change
```
┌─────────────────────────────────────────────────────────┐
│  ICP INSIGHTS (collapsible)                             │
│  🌐 site.com · 4 pages · Summary...                    │
├─────────────────────────────────────────────────────────┤
│  [Generate All] [Enrich All] [Score All] [Draft] [CSV]  │
│  Filter: [All ▾] [New ▾] [Search...]                   │
├─────────────────────────────────────────────────────────┤
│  ☐  NAME    TITLE    COMPANY   NICHE     EMAIL  STAGE   │
│  ☐  Jane    CEO      Acme      SaaS HR   j@..   new    │
│  ☐  Bob     CTO      Beta      Fintech   b@..   new    │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

### Key Changes

1. **Remove sidebar entirely** — niches become a filterable column in the table, not a navigation tree
2. **Add "Niche" column** to lead table — users see all leads grouped/filterable by niche inline
3. **"Generate All" button** — one click auto-seeds leads for ALL persona niches (replaces per-niche +Batch)
4. **Niche dropdown filter** above table — optional filter, defaults to "All Niches"
5. **Checkbox selection** on rows — select specific leads for bulk Enrich/Score/Draft
6. **Auto-seed on discovery** — after ICP mapping, immediately generate 1 lead per persona niche (already partially implemented)

### Files Affected

| File | Change |
|------|--------|
| `src/pages/Leadgen.tsx` | Remove SidebarProvider/AppSidebar, add "Generate All" handler |
| `src/components/leadgen/LeadgenDashboard.tsx` | Remove sidebar dependency, add niche filter dropdown, update toolbar |
| `src/components/leadgen/LeadPipeline.tsx` | Add Niche column, checkbox selection, niche filter dropdown |
| `src/components/leadgen/NicheSidebar.tsx` | Delete (no longer used) |
| `src/components/leadgen/AppSidebar.tsx` | Delete (no longer used) |
