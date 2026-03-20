

## Reorganize Admin Sidebar — Schools Section

The user wants three clearly separated concerns in the Schools sidebar:

1. **Data Operations** — curriculum extraction, scraping status, pipeline management (currently inside SchoolDetailPage tabs)
2. **Skills Gap Analysis** — cross-school skills gap (already a standalone page)
3. **School Accounts** — the school list/table for managing individual accounts (already exists)

### Current state
- "Analytics" → pipeline KPIs dashboard
- "Skills Gap" → cross-school gap analysis
- "All Schools" → school accounts table

### Proposed sidebar restructure

```text
Schools
  ├─ Data Ops        → /admin/schools/data-ops    (NEW — extraction status across schools)
  ├─ Skills Gap      → /admin/schools/skills-gap   (exists)
  └─ Accounts        → /admin/schools               (rename from "All Schools")
```

The current "Analytics" page (pipeline funnel, KPIs, Carnegie breakdown) gets folded into the Accounts page as a summary header or moved into Data Ops since it tracks scrape coverage and pipeline stages — both operational concerns.

### Changes

1. **Rename sidebar items** in `HRSidebar.tsx`:
   - "Analytics" → "Data Ops" with `Database` icon → `/admin/schools/data-ops`
   - "Skills Gap" stays as-is
   - "All Schools" → "Accounts" with `GraduationCap` icon

2. **Create `src/pages/admin/SchoolDataOpsPage.tsx`** — new standalone page combining:
   - The existing `SchoolAnalyticsDashboard` (pipeline funnel, scrape coverage, KPIs)
   - A table of recent extraction jobs with status indicators
   - This replaces the current analytics page route

3. **Update routing in `App.tsx`**:
   - `/admin/schools/data-ops` → `SchoolDataOpsPage`
   - Remove `/admin/schools/analytics` route (or redirect to data-ops)
   - `/admin/schools/skills-gap` → stays
   - `/admin/schools` → `SchoolsPage` (Accounts)

4. **Update `SchoolsPage.tsx`** heading from "All Schools" to "School Accounts"

### Files touched
- `src/components/HRSidebar.tsx` — update menu items and icons
- `src/pages/admin/SchoolDataOpsPage.tsx` — new page (wraps existing `SchoolAnalyticsDashboard`)
- `src/pages/admin/SchoolAnalyticsPage.tsx` — remove or redirect
- `src/pages/admin/SchoolsPage.tsx` — rename heading
- `src/App.tsx` — update routes

