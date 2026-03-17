

## Problem

The current sidebar has 3 groups with 7 items that feel disconnected from the actual user workflow:

```text
Current:
├─ Diagnose
│  ├─ Role Explorer      (browse roles, start sims)
│  ├─ AI Exposure Map    (score distributions)
│  └─ ATS Sync           (import jobs)
├─ Upskill & Monitor
│  ├─ Team Progress      (dashboard)
│  └─ Action Center      (interventions)
└─ Workspace
   ├─ Members
   └─ Settings
```

Issues:
- "Diagnose" vs "Upskill & Monitor" is an internal taxonomy, not how a user thinks
- "Role Explorer" doesn't communicate simulations
- "AI Exposure Map" is jargon
- ATS Sync (a setup/import action) sits alongside daily-use pages
- Too many groups for 7 items — feels fragmented

## Proposed Sidebar

Consolidate into 2 groups that follow the natural workflow: **do the work** and **manage the workspace**.

```text
Proposed:
├─ Platform                        (no group label, or "Dashboard")
│  ├─ 📊 Overview          /hr/team-progress
│  ├─ 🔍 Roles & Sims      /hr/simulations
│  ├─ 📈 Exposure Map       /hr/score-distributions
│  ├─ ⚡ Action Center      /hr/action-center
│  └─ 🔄 Import Roles      /hr/ats-sync
├─ Workspace
│  ├─ 👥 Members            /hr/members
│  └─ ⚙️ Settings           /hr/settings
└─ (Superadmin — unchanged)
```

Key changes:
1. **Merge "Diagnose" and "Upskill"** into a single workflow group — the user's mental model is "my team's AI readiness," not two separate phases
2. **Rename items** for clarity:
   - "Role Explorer" → "Roles & Simulations" (makes the simulation path obvious)
   - "Team Progress" → "Overview" (it's the landing/dashboard page)
   - "ATS Sync" → "Import Roles" (action-oriented)
3. **Reorder** to match workflow: Overview first (see the big picture), then Roles, Exposure, Action Center, Import
4. Keep **Workspace** group for admin/settings (Members, Settings)

## Technical Changes

**Single file edit:** `src/components/HRSidebar.tsx`
- Replace the 3 item arrays with 2 arrays (platform + workspace)
- Update titles and icons
- Remove the "Diagnose" and "Upskill & Monitor" group labels, replace with single "Platform" or unlabeled group

No route changes, no database changes, no other files affected.

