

## Role Detail Page Redesign — Personal Report Card

### What's Missing Today

The current Analysis page is **informative but not actionable**. It shows tasks, skills, and stats but lacks:
- A single "replacement risk" score that creates urgency
- A clear verdict (Upskill / Pivot / Leverage) with reasoning
- ESCO career pathways showing where skills transfer
- A structured action plan — numbered steps, not just a skill list
- Comparative context — how this role stacks up against others
- Timeline framing — what happens in 6, 12, 24 months

### Redesigned Page Structure (Top → Bottom)

**Section 1 — Risk Score Hero** (replaces current hero)
- Large circular gauge: "Agent Replacement Risk: 38%" with color (green/amber/red)
- Verdict banner below: "Our recommendation: **Upskill**" with icon and one-line reasoning
- Three stat pills kept but repositioned as supporting evidence beneath the verdict
- Company snapshot stays inline

**Section 2 — Evidence: Task Breakdown** (replaces current carousel)
- Switch from horizontal carousel to a **vertical task table/list** — scannable at a glance
- Each row: task name | current state badge | trend arrow | impact level | disruption score (X/8)
- Sort by disruption score descending — most at-risk tasks first
- Mini inline heatmap bar per task (color-coded) for instant visual scanning
- Click a task to expand: description + related skills + Practice button
- Summary bar at top: "3 tasks trending to full AI | 2 already AI-driven | 3 safely human"

**Section 3 — Career Pathways (NEW — ESCO data)**
- Call `fetchCareerPathways(jobTitle)` on load
- Show top 3-4 alternative roles with:
  - Skill overlap percentage (progress bar)
  - Shared skills (green badges) vs new skills needed (amber badges)
  - One-click to analyze that role
- Framing: "Your skills already transfer to these roles"

**Section 4 — Your Action Plan (NEW — replaces raw skills grid)**
- 3 numbered steps derived from the data:
  - Step 1: Based on highest-priority skill recommendation
  - Step 2: Based on most at-risk task that needs practice
  - Step 3: Based on career pathway with highest overlap
- Each step has: headline, description, primary CTA (resource link or Practice button)
- Keeps the existing skill categories (AI Tools, Human Skills, New Capabilities) as expandable sections below the action plan

**Section 5 — Role Context (NEW)**
- Small card: "How this role compares" — show this role's position relative to the 30-role average
- Mini bar showing agent risk vs average, with percentile label ("Higher risk than 73% of roles")
- Link to heatmap for full comparison

### Technical Implementation

1. **New component: `RiskGauge`** — circular SVG gauge with animated fill, accepts `risk` number and `verdict` string
2. **New component: `CareerPathways`** — calls `fetchCareerPathways()`, handles loading state, renders pathway cards
3. **New component: `ActionPlan`** — derives 3 steps from `JobAnalysisResult` + ESCO data
4. **New component: `TaskTable`** — vertical list replacing the carousel, with expand/collapse rows
5. **New component: `RoleContext`** — calculates percentile against all 30 prebuilt roles
6. **Refactor `Analysis.tsx`** — compose the new sections, add ESCO data fetch alongside existing analysis fetch, compute agent risk using same formula as heatmap (55% automation + 25% augmented + 20% new skills)

### Data Flow
- Agent risk + verdict: computed client-side from existing `summary` data (same formula as Heatmap)
- Career pathways: new async call to `fetchCareerPathways(jobTitle)` via the existing ESCO edge function
- Action plan: derived from skills (highest priority), tasks (most at-risk), and pathways (highest overlap)
- Role comparison: computed from `prebuiltRoles` data — no new API calls

