

## Full-Page Job Deep Dive with Level 1 + Level 2 on a Time Axis

### Problem
Currently, Level 1 (task breakdown + AI exposure) and Level 2 (future predictions) live on the same flat `/analysis` page. Level 2 is hidden behind per-task "See Future" buttons. There's no unified timeline view showing how a role evolves from today → near-future → far-future. The page needs to become a proper deep-dive destination.

### Architecture

```text
/role/:jobTitle                    ← New route (SEO-friendly, shareable)
  ┌─────────────────────────────────────────────────┐
  │  Sticky Header: Job Title, Company, Bookmark    │
  ├─────────────────────────────────────────────────┤
  │  Hero: Readiness Ring + Stats + Time Slider     │
  │  ┌──────────────────────────────────────┐       │
  │  │  ◄─── TODAY ──── 2-3Y ──── 5Y+ ───► │       │
  │  └──────────────────────────────────────┘       │
  ├─────────────────────────────────────────────────┤
  │  Tabs: Overview │ Task X-Ray │ Future View      │
  ├─────────────────────────────────────────────────┤
  │                                                 │
  │  [Tab content — see below]                      │
  │                                                 │
  └─────────────────────────────────────────────────┘
```

### Plan

#### 1. Create new full-page `RoleDeepDive.tsx`
A new page component at `/role/:jobTitle` that replaces the current `/analysis` as the primary deep-dive. The existing `/analysis` route redirects here.

**Three tabs:**
- **Overview** — Hero stats, readiness ring, role summary, quick stats (risk %, augmented %, task count). Shows the "time slider" that morphs stats between today and predicted future.
- **Task X-Ray (Level 1)** — Current task cards with AI exposure scores, practice buttons. Reuses existing task card UI.
- **Future View (Level 2)** — All tasks shown on a timeline axis. Each task displayed as a row with columns: Today State → Predicted State → New Human Role. Batch-fetches predictions for all tasks at once instead of one-by-one.

#### 2. Time Axis Slider Component
A horizontal slider at the top that controls the "lens" across all tabs:
- **Today** — Shows Level 1 data as-is (current AI exposure, current tasks)
- **2-3 Years** — Blends Level 1 + Level 2 predictions, highlights tasks at collapse risk
- **5+ Years** — Full Level 2 mode, shows predicted future state, new human roles, future skills

When the slider moves, task cards animate their scores from current → predicted values.

#### 3. Batch Future Prediction
Create a new edge function `batch-predict-future` that accepts an array of task clusters and returns all predictions in one call (instead of N separate calls to `predict-task-future`). This makes the Future View tab load in one request.

#### 4. Future View Tab Layout
A timeline-oriented layout for all tasks:
```text
Task Name          │ Today (L1)      │ Future (L2)        │ Action
───────────────────┼─────────────────┼────────────────────┼──────────
Code Review        │ 🤖 72% AI      │ ⚡ 95% — Collapses │ L2 Sim
Stakeholder Mgmt   │ 💪 25% AI      │ 🟢 35% — Evolves  │ Practice
System Design      │ 🤖 60% AI      │ ⚡ 85% — Transforms│ L2 Sim
```

Each row expandable to show: collapse summary, new human role, disrupting tech, future skills (ghost drops).

#### 5. Route + Navigation Updates
- Add route `/role/:jobTitle` in `App.tsx`
- Redirect `/analysis` → `/role/:jobTitle` with query params mapped
- Homepage role cards link to `/role/[title]?company=X`
- RolePreviewPanel "Full Analysis" button links here

#### 6. Persist Level 2 Predictions
Store predictions in a new `task_future_predictions` table so they don't need re-generation on every visit:
- `job_id`, `cluster_name`, `prediction` (jsonb), `created_at`
- Cache for 30 days, then refresh

### Technical Details

**New files:**
- `src/pages/RoleDeepDive.tsx` — Main page component with 3 tabs
- `src/components/role/TimeAxisSlider.tsx` — Horizontal time slider
- `src/components/role/FutureViewTab.tsx` — Timeline table for Level 2
- `src/components/role/OverviewTab.tsx` — Hero + summary stats
- `src/components/role/TaskXRayTab.tsx` — Existing task cards refactored
- `supabase/functions/batch-predict-future/index.ts` — Batch prediction endpoint

**Database migration:**
- Create `task_future_predictions` table with columns: `id`, `job_id` (uuid), `cluster_name` (text), `prediction` (jsonb), `created_at`, `expires_at`
- RLS: public read, service_role write

**Existing page handling:**
- `/analysis` route becomes a redirect to `/role/:title`
- `RolePreviewPanel` gains a "Deep Dive" button linking to the full page

