

## Problem
The analysis page has 5 stacked full-width sections that create excessive vertical scrolling. The "Practice this task" button is always visible inside each expanded task row, adding clutter. There are no section icons, making it harder to scan.

## Redesigned Layout

### Structure: Tabs instead of vertical stack

Replace the 5 sequential sections with a **tabbed layout** below the hero card. This keeps the page to ~1 screen height.

**Always visible (top):**
- Header (back button + job title) -- unchanged
- Risk Gauge card with stat pills -- unchanged (this is the "hero")

**Tabbed sections (below hero):**
Each tab gets an icon + label for scannability.

| Tab | Icon | Content |
|-----|------|---------|
| Tasks | `ListChecks` | Task table (practice button hidden until task expanded) |
| Pathways | `Route` | Career pathways cards |  
| Action Plan | `Target` | 3-step plan + skill accordions |
| Context | `BarChart3` | Industry benchmark + curated skills + role context |

### Key changes

1. **Tabs component** -- Use existing `src/components/ui/tabs.tsx` (already in project). Four tabs with icon + label.

2. **Section icons** -- Add a Lucide icon next to each section heading inside the tab content for visual anchoring.

3. **Practice button collapsed** -- In `TaskTable.tsx`, move the "Practice this task" button so it only appears when a task row is expanded (it's already inside the expanded section, but we should verify). Remove any duplicate practice buttons outside the accordion.

4. **CTA banner** -- Move inside the tab panel or place it as a slim sticky footer bar instead of a full-width card at the bottom.

### Files to modify

- **`src/pages/Analysis.tsx`** -- Replace the 4 `motion.div` sections (Task Breakdown, Career Pathways, Action Plan, Role Context) with a single `<Tabs>` component. Add icons to tab triggers. Keep hero card above tabs.

- **`src/components/analysis/TaskTable.tsx`** -- Confirm practice button is only in expanded state (it already is -- no change needed).

- **`src/components/analysis/ActionPlan.tsx`** -- No structural change, just rendered inside a tab now.

- **`src/components/analysis/CareerPathways.tsx`** -- No structural change.

### Visual result
- Page goes from ~5 screens of scrolling to ~1.5 screens
- Each section is one click away via tabs
- Icons on every tab for quick scanning
- Practice buttons stay hidden until the user deliberately expands a task

