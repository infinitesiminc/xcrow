

## HR Dashboard Restructure — Mission-Aligned Audit

### Core Mission (lens)
1. **Diagnose** — See AI exposure across all jobs
2. **Upskill** — Collect employee AI readiness via simulations
3. **Act** — Identify who needs help and how, in real time

### Current State (6 sidebar items)

| Page | What it does | Mission alignment |
|---|---|---|
| Team Progress | Executive brief, funnel, dept scorecard, pillars, leaderboard | **Upskill + Act** — strong |
| Score Distributions | AI exposure histograms, all-jobs chart, dept/location/task breakdowns | **Diagnose** — strong |
| ATS Sync | Import companies/jobs from ATS | **Diagnose** (setup step) |
| Simulation Builder | Browse 400 jobs, queue auto-analysis, launch learning paths | **Diagnose + Upskill** — overlap |
| Members | List workspace members, remove | **Admin** — utility |
| Workspace Settings | Create workspace, join code | **Admin** — utility |
| Invite (Join Code) | Alias for Workspace Settings | **Redundant** |

### Problems Identified

1. **No clear workflow funnel.** A Head of HR at Anthropic lands on Team Progress but the three-phase journey (Diagnose → Upskill → Act) is not reflected in nav order or grouping.

2. **Simulation Builder and Score Distributions are disconnected.** Both serve "Diagnose" but sit as separate pages. The builder is also the entry point for "Upskill" (clicking a job → learning path → simulation), creating confusion about where diagnosis ends and upskilling begins.

3. **Invite page is a duplicate** of Workspace Settings — wasted nav slot.

4. **ATS Sync is a setup/plumbing page** mixed in with analytics pages. It should be secondary.

5. **No "Action Center" or real-time intervention view.** The Adaptive Insights section is buried inside Team Progress's overview tab. A Head of HR needs a dedicated place to see "who is struggling right now" and take action.

6. **Score Distributions back button navigates to /products/simulation-builder** (public route) instead of staying in HR layout.

### Proposed Restructure

Reorganize the sidebar into **mission-phase groups** with clear labels:

```text
┌─────────────────────────────┐
│  DIAGNOSE                   │
│    ○ Role Explorer          │  ← renamed Simulation Builder
│    ○ Score Distributions    │
│    ○ ATS Sync               │
│                             │
│  UPSKILL & MONITOR          │
│    ○ Team Progress          │  ← executive brief + leaderboard
│    ○ Action Center          │  ← NEW: extracted from Team Progress
│                             │
│  WORKSPACE                  │
│    ○ Members                │
│    ○ Settings               │  ← absorbs Join Code / Invite
└─────────────────────────────┘
```

### Detailed Changes

#### 1. Sidebar restructure (`HRSidebar.tsx`)
- Group items under three `SidebarGroup` labels: **Diagnose**, **Upskill & Monitor**, **Workspace**.
- Remove the separate "Invite" group (it's just an alias for Settings).
- Rename "Simulation Builder" → "Role Explorer" (better reflects its diagnostic purpose of browsing and analyzing roles).
- Add "Action Center" nav item.

#### 2. New page: Action Center (`src/pages/hr/ActionCenter.tsx`)
- Extract `AdaptiveInsights` component (bottleneck tasks + employees needing coaching) from Team Progress into its own dedicated page.
- Add real-time employee status: who is currently in a simulation, who just failed, who hasn't started.
- Add quick-action buttons: "Nudge Employee", "View Learning Path", "Assign Simulation".
- This becomes the page the Head of HR checks daily for "what needs my attention right now."

#### 3. Fix Score Distributions back button
- Change the back button in `ScoreDistributions.tsx` to navigate to `/hr/simulations` (the HR layout sibling) instead of `/products/simulation-builder`.

#### 4. Remove InvitePage route duplication
- Remove the `/hr/invite` route and sidebar item. Join code management stays in Workspace Settings where it already lives.

#### 5. Set default landing to Role Explorer
- Change the HR index route from Team Progress to Role Explorer, since the first thing a new HR admin does is diagnose (import jobs → see exposure). Once the org has data, they naturally progress to Team Progress and Action Center.
- Alternatively, keep Team Progress as default but add a prominent "Getting Started" state that guides through Diagnose → Upskill → Act.

#### 6. Route updates (`App.tsx`)
- Add route for `/hr/action-center` → `ActionCenter`.
- Remove `/hr/invite` route.
- Keep all other routes intact.

### Implementation Order
1. Restructure sidebar groups and labels
2. Create Action Center page (extract + enhance AdaptiveInsights)
3. Fix Score Distributions back-nav
4. Remove Invite route duplication
5. Update HR index default route

