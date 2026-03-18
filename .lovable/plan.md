

## Rethinking Auth Flow and Personal Hub

### Current state

- **Dashboard.tsx** is 178 lines of dead code (4-tab layout: Overview, Saved Roles, Practice, Progress). Route `/dashboard` redirects to `/`.
- **ProfileSheet.tsx** is the active personal hub (slide-out from avatar). Shows interest graph, engagement stats, skill depth — data-heavy, analytical tone.
- **Auth.tsx** hard-redirects to `/hr/team-progress` after login — wrong destination for B2C users.
- **AuthModal** correctly caches pending bookmarks in sessionStorage, but doesn't preserve navigation context.

### Plan

#### 1. Fix post-login navigation — "return to where they were"

**Auth.tsx** (dedicated page):
- Replace the hard redirect to `/hr/team-progress` with logic that checks for a `redirect` search param or falls back to `/`
- Pattern: `/auth?redirect=/analysis?title=Software+Engineer`

**AuthModal** (overlay):
- No navigation change needed — modal closes and user stays on current page
- Already works correctly since it doesn't navigate

**Auth trigger points** (Navbar, bookmark save, sim launch):
- When opening AuthModal, no change needed (context preserved)
- When redirecting to `/auth` page, append current location as `?redirect=...`

#### 2. Kill Dashboard.tsx and redesign ProfileSheet as celebration-first hub

**Delete**: `src/pages/Dashboard.tsx` and the 4 hub tab components (`OverviewTab`, `SavedRolesTab`, `PracticeTab`, `ProgressTab`)

**Redesign ProfileSheet** with a progress-celebration personality:

```text
┌─────────────────────────────┐
│  Avatar + Name              │
│  "Software Engineer @ Acme" │
├─────────────────────────────┤
│  🎯 Journey so far          │
│  ┌───┐ ┌───┐ ┌───┐         │
│  │ 5 │ │ 3 │ │12 │         │
│  │exp│ │sav│ │pra│         │
│  └───┘ └───┘ └───┘         │
├─────────────────────────────┤
│  🏆 Milestones              │
│  ✓ First role explored      │
│  ✓ Completed 5 tasks        │
│  ○ Explore 10 roles         │
├─────────────────────────────┤
│  📚 Saved Roles (3)         │
│  · Software Engineer → ▶    │
│  · Product Manager   → ▶    │
├─────────────────────────────┤
│  ⚙ Settings  │  Sign out   │
└─────────────────────────────┘
```

**Sections**:

1. **Header** — avatar initials, display name, job title @ company (keep existing)

2. **Journey stats** — three compact counters: Roles Explored, Saved, Tasks Practiced. Animated count-up on open. Replaces the current 4-stat grid.

3. **Milestones** — unlockable achievements derived from existing data:
   - First role explored (analysis_history.length >= 1)
   - First task practiced (completed_simulations.length >= 1)
   - Saved 3 roles (bookmarked_roles.length >= 3)
   - Practiced 5 tasks (unique task count >= 5)
   - Explored 10 roles (analysis_history.length >= 10)
   Show checkmarks for completed, hollow circles for next milestone. Celebratory, no scores.

4. **Saved Roles** — compact list of bookmarked roles, tap to navigate to analysis. Replace the dense interest graph with this simpler view.

5. **Footer** — Settings link + Sign out (keep existing)

**What gets removed from ProfileSheet**: Interest graph visualization, skill depth accordion, recommendation engine. These are powerful but analytical — they clash with the celebration direction. Can be re-introduced later as a "deep dive" view if needed.

#### 3. Clean up routing

- Remove `/dashboard` redirect from App.tsx (no longer needed once Dashboard.tsx is deleted)
- Remove lazy import of Dashboard
- Keep `/settings` route as-is

### Files changed

| File | Action |
|------|--------|
| `src/pages/Auth.tsx` | Fix redirect to use `?redirect=` param, fallback to `/` |
| `src/components/ProfileSheet.tsx` | Full redesign — celebration milestones, simplified stats, saved roles list |
| `src/pages/Dashboard.tsx` | Delete |
| `src/components/hub/OverviewTab.tsx` | Delete |
| `src/components/hub/SavedRolesTab.tsx` | Delete |
| `src/components/hub/PracticeTab.tsx` | Delete |
| `src/components/hub/ProgressTab.tsx` | Delete |
| `src/App.tsx` | Remove dashboard redirect and dead imports |

No database changes needed — all data already exists in `analysis_history`, `completed_simulations`, `bookmarked_roles`.

