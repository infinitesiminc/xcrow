

## Redesign: Enriched Role Cards and Three-Section Detail Overlay

### My Take

Your three dimensions are spot-on. The current experience is metric-forward — gauges and percentages that mean nothing without context. The fix isn't adding more data to the card surface (that makes it worse). Instead:

- **Cards should tease**, not explain. Add just enough to answer "what is this job?" at a glance — a 1-line description and a task signal.
- **The overlay should teach.** That's where the three dimensions live as structured sections, not tabs (tabs hide content behind clicks — sections let users scroll and absorb).
- **Plain English over percentages.** "72% AI-Augmented" means nothing to a marketing intern. "Most of your work will use AI tools" does.

### What Changes

**1. Data Layer (`src/pages/Index.tsx`)**
- Add `description` and `seniority` to the jobs query (already in DB, just not fetched).
- Fetch task cluster counts per job via a second lightweight query: `SELECT job_id, count(*), count(*) FILTER (WHERE ai_exposure_score >= 60) FROM job_task_clusters GROUP BY job_id`. This gives us "8 tasks, 3 AI-led" per card without fetching full cluster data.
- Extend the `RoleCard` interface with `description`, `seniority`, `taskCount`, `aiTaskCount`.

**2. Card Surface (`RoleFeed.tsx` — DesktopGrid cards)**
- Below company/location line, add a truncated description (1 line, ~80 chars, italic, muted).
- Replace the tag badge row with a richer bottom: `⚡ 8 tasks · 3 AI-led` pill next to the department tag.
- Keep the generative gradient header and metric pills (they work as visual hooks).

**3. Detail Overlay (`RoleFeed.tsx` — RoleDetailOverlay)**
Replace the current layout (image + 3 gauges + generic sentence + button) with three scrollable sections:

**Section A: "What is this role"**
- Full description from DB (or fallback generic sentence if null).
- Metadata row: seniority, department, work mode, location.
- Company name + logo.

**Section B: "Key responsibilities"**  
- For analyzed jobs (taskCount > 0): show top 3-5 task cluster names + descriptions (fetched on overlay open via a targeted query to `job_task_clusters` by matching job title/company).
- For unanalyzed jobs: show a "Run full analysis to see tasks" CTA button linking to `/analysis`.

**Section C: "AI in this role"**
- Three stat rows with plain-English labels:
  - `{risk}% of tasks could be automated`
  - `{augmented}% of work enhanced by AI tools`
  - `{aiOpportunity} AI tools to master`
- Small horizontal progress bars instead of circular gauges (cleaner at this size).
- If task clusters exist, show per-task AI exposure mini-bars for top 3 tasks.

**4. Mobile Feed (`MobileFeed`)**
- Replace center gauges with a single summary line: "8 tasks · 3 AI-led · 72% augmented".
- Add 1-line description below company name.
- Tap-to-expand opens the same three-section overlay.

### Data Flow

```text
Index.tsx
  ├── Paginated fetch: jobs + description + seniority
  ├── Aggregate fetch: job_task_clusters counts grouped by job_id
  └── Merge into RoleCard[] with taskCount, aiTaskCount, description, seniority

RoleFeed.tsx
  ├── Cards: show description + task signal
  └── Overlay open → fetch job_task_clusters WHERE job_id matches
       └── Render 3 sections
```

### Files Changed
- `src/pages/Index.tsx` — enriched query + task cluster aggregation
- `src/components/RoleFeed.tsx` — card layout, overlay redesign, mobile layout

### Scope
- No migrations needed (all data exists)
- One new lightweight query for task cluster counts
- One on-demand query when overlay opens (for task details)

