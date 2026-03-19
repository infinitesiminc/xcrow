

# Schools Analytics Dashboard — Design Plan

## Context
We have 4,177 US institutions imported from IPEDS with metadata (state, Carnegie class, enrollment, HBCU flag, pipeline_stage). The goal is a sales pipeline analytics view.

## Dashboard Layout

### 1. Top KPI Row (4 cards)
- **Total Institutions** — count of all schools
- **Scraped** — schools with at least one curriculum scrape completed
- **Customers** — schools with pipeline_stage = 'customer' or plan_status = 'active' with seats > 0
- **HBCUs** — count of HBCU institutions

### 2. Pipeline Funnel (horizontal bar or stacked bar)
- Breakdown by `pipeline_stage`: Prospect → Contacted → Scraped → Demo → Customer
- Each segment color-coded, clickable to filter the table below

### 3. Two-Column Charts Row
- **Left: Institution Type Distribution** — Pie/donut chart of Carnegie classifications (R1, R2, Master's, Baccalaureate, Associate's, etc.)
- **Right: Geographic Heatmap / Top States** — Bar chart of top 15 states by school count, with scrape coverage overlay

### 4. Scrape Coverage & AI Readiness
- **Scrape Progress** — X of Y schools scraped, with progress bar
- **Avg AI Readiness** — For scraped schools, average AI readiness score from skills gap analysis
- **Top Skill Gaps** — Aggregated across all scraped schools, showing most common missing skills

### 5. Filterable Data Table (replaces current card view)
- Columns: Name, State, Carnegie Class, Enrollment, Pipeline Stage, Scrape Status, Programs, AI Readiness Score
- Search by name, filter by state/Carnegie/pipeline_stage/HBCU
- Sortable columns, pagination (50 per page)
- Row actions: View details, trigger scrape, change pipeline stage

## Technical Approach

### Files to create/modify:
1. **`src/pages/admin/SchoolsPage.tsx`** — Restructure with Tabs: "Analytics" (default) and "All Schools" (table)
2. **`src/components/admin/SchoolAnalyticsDashboard.tsx`** — New component for KPIs, charts, funnel
3. **`src/components/admin/SchoolsDataTable.tsx`** — New component replacing card view with filterable table
4. Keep existing `SchoolsTab.tsx` logic for CRUD/scrape actions, refactor into table row actions

### Data queries:
- All data comes from `school_accounts` table (already has all IPEDS fields)
- Join with `school_curricula` for scrape status counts
- Join with `school_courses` for program counts and AI readiness aggregation
- All queries use existing superadmin RLS policies

### Charts:
- Use existing `recharts` library (already in project via `src/components/ui/chart.tsx`)
- Pipeline funnel: horizontal BarChart
- Carnegie distribution: PieChart
- State breakdown: vertical BarChart

### Design:
- Follow existing dark-mode admin aesthetic from TaskAnalyticsPage
- Use same Card/Badge/Tabs patterns
- Neon accent colors consistent with brand palette

