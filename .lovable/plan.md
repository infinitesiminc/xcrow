

## Problem

My Journey (career reach map, skill profile, progress) lives at `/settings?section=roles` — buried behind the avatar menu. Users explore roles and practice tasks on the homepage but never see the cumulative impact of their work unless they manually navigate to Settings.

## Options

### Option A — Journey Tab on Homepage (Recommended)
Add a persistent "My Journey" tab/toggle on the homepage itself. When active, the right panel (desktop) or a full-screen view (mobile) shows the Career Reach Map and skill progress instead of role previews. The user can flip between "Explore" and "My Journey" without leaving the page.

**Pros**: Zero navigation friction; progress is one click away from where they practice.
**Cons**: Adds complexity to the Index page; right panel does double duty.

### Option B — Post-Simulation Bridge + Navbar Shortcut
After completing a simulation, show a completion card CTA ("See your progress →") that navigates to `/settings`. Also add a small progress indicator (e.g., a ring or number) in the Navbar that links directly to My Journey.

**Pros**: Lightweight; doesn't restructure the homepage.
**Cons**: Journey is still on a separate page; requires conscious navigation.

### Option C — Dedicated `/journey` Route
Extract My Journey from Settings into its own top-level route (`/journey`). Add it to the Navbar. Post-simulation CTAs link there. Settings keeps only Profile/Security/Danger.

**Pros**: Clean separation; Journey gets first-class status; shareable URL.
**Cons**: One more route; duplicates some Settings code initially.

---

## Recommendation: Option C + B bridge

Combine a dedicated `/journey` page with post-simulation CTAs. This gives Journey first-class status while creating natural bridges from the practice flow.

### Implementation steps

1. **Create `/journey` route** — Extract `JourneyDashboard` and `CareerReachMap` from Settings into a new `src/pages/Journey.tsx`. Settings "My Journey" section redirects to `/journey`.

2. **Add Journey to Navbar** — Add a "My Journey" nav item (with a small progress indicator showing tasks practiced) visible only to signed-in users, between Explore and the avatar.

3. **Post-simulation CTA** — On the SimulatorModal completion screen (the "done" phase), add a "View My Journey" button alongside "Next Task" and "Practice Again".

4. **Toast nudge** — After simulation completion, show a subtle toast: "Nice work — your career map updated" with a clickable link to `/journey`.

5. **Update Settings** — Replace the "My Journey" section in Settings with a link/redirect to `/journey`. Keep Profile, Security, Danger Zone in Settings.

### Files to create/modify
- **New**: `src/pages/Journey.tsx` — standalone page wrapping `JourneyDashboard` + `CareerReachMap`
- **Edit**: `src/App.tsx` — add `/journey` route
- **Edit**: `src/components/Navbar.tsx` — add Journey nav item for signed-in users
- **Edit**: `src/components/SimulatorModal.tsx` — add "View My Journey" CTA on completion screen + toast
- **Edit**: `src/pages/Settings.tsx` — remove/redirect My Journey section

