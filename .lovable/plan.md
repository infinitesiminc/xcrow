

## Scaling the Column Browser for High-Volume Leads

**Problem**: A company like HubSpot with 10 products, multiple verticals, and conquest targets can easily produce 100-500+ leads from Apollo. Scrolling through a flat list in column 4 becomes unusable.

### Design Additions

**1. Search + Filter Bar per Column**
Each column gets a compact input at the top:
- Products column: filter by name
- Verticals column: filter by segment
- Companies column: toggle Customer/Conquest, search by name
- Leads column: search by name/title, filter by role (DM/Champion), filter by type (Customer/Conquest)

**2. Virtual Scrolling for Leads Column**
Use `react-window` (lightweight virtualizer) for column 4 when lead count exceeds ~50. Only renders visible rows, keeping DOM light even with 500+ leads.

**3. Count Badges + Summary Row**
Each selectable card shows a count badge of children below it:
- Product card: "47 leads" badge
- Vertical card: "12 leads" badge  
- Company card: "5 leads" badge

A summary bar at the top of each column shows: "Showing 23 of 147 leads"

**4. Pagination Fallback**
If virtual scroll feels heavy, paginate leads column at 25 per page using the existing `Pagination` component.

**5. Bulk Actions Bar**
When leads exceed 20, show a "Save all to pipeline" button at the bottom of the leads column to batch-import into the leadgen pipeline.

### Technical Plan

```text
Column Layout (unchanged)
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ ┌──────────┐
│ Products │→│Verticals │→│Companies │→│ [🔍 Search...  ] │→│  Detail  │
│          │ │          │ │          │ │ [DM|Champ|All]   │ │          │
│ P1 (47)  │ │ SaaS (12)│ │ Acme (5) │ │ Showing 12/147   │ │ Full     │
│ P2 (31)  │ │ Health(8)│ │ Zen  (3) │ │ ┌──────────────┐ │ │ Profile  │
│ ...      │ │ ...      │ │ ...      │ │ │ virtual list │ │ │          │
│          │ │          │ │          │ │ │ or paginated │ │ │          │
│          │ │          │ │          │ │ └──────────────┘ │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────────────┘ └──────────┘
```

### Files Changed

**`src/components/academy/GTMTreeView.tsx`** — Full rewrite:
- 5-column master-detail layout with `ScrollArea` per column
- Search input + role filter in leads column header
- Count badges on all cards
- Pagination (25/page) for leads column using existing `Pagination` component
- Summary bar showing filtered vs total counts

**`src/components/academy/CompanyExplorer.tsx`** — Minor:
- Remove horizontal overflow wrapper, tree self-contains its scroll

**`package.json`** — No new deps needed (pagination component exists, `ScrollArea` exists)

No backend changes required.

