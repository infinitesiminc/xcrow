

## End-to-End Product Flow for University Students

### The Problem with the Current Flow

Right now the homepage opens straight into a **role feed** (a grid/swipe of enterprise jobs). The search bar is hidden behind a floating action button that opens a full-screen overlay. This works for a returning power user browsing roles, but for a first-time university student it's disorienting — they don't know what they're looking at or why they should care.

### Proposed Flow (5 stages)

```text
┌─────────────────────────────────────────────────┐
│  1. HOMEPAGE — Search-first hero                │
│  ┌───────────────────────────────────────────┐   │
│  │  "What career are you exploring?"         │   │
│  │  [ Search bar — always visible ]          │   │
│  │  Trending roles below (pill chips)        │   │
│  └───────────────────────────────────────────┘   │
│  Role Feed sits BELOW the hero (scroll down)     │
├─────────────────────────────────────────────────┤
│  2. ANALYSIS — Swipeable task cards              │
│  Hero card → Task cards → Completion card        │
│  Each task has "Practice" CTA                    │
├─────────────────────────────────────────────────┤
│  3. SIMULATION — Chat-based practice             │
│  Modal overlay, AI conversation                  │
│  Completion → save to profile                    │
├─────────────────────────────────────────────────┤
│  4. PROFILE SHEET — Progress & saved roles       │
│  Slide-out from avatar: history, bookmarks,      │
│  readiness scores, interest graph                │
├─────────────────────────────────────────────────┤
│  5. AUTH — Modal (deferred until needed)          │
│  Triggered on bookmark, practice, or save        │
│  Post-auth: onboarding (job title + school)      │
└─────────────────────────────────────────────────┘
```

### Stage 1: Search-First Homepage

**What changes:**
- Add a **hero section** above the existing role feed with the `RoleSearchAutocomplete` component rendered inline (not in an overlay).
- Hero copy: "What career are you exploring?" with a subtitle like "Search 100M+ roles. See which tasks AI will change."
- The `CompanyPills` trending chips stay directly below the search bar.
- The existing role feed grid/swipe becomes a "Discover" section below, scrollable.
- Remove the full-screen search overlay and the floating search FAB — the search bar is always reachable by scrolling to top.

**Technical approach:**
- Restructure `Index.tsx`: add a hero `<section>` with the search bar above the `<RoleFeed>` component.
- Change the page from `h-[calc(100vh-3.5rem)]` fixed height to a normal scrolling page.
- `RoleFeed` no longer needs `onOpenSearch` prop — remove the FAB.
- On mobile, the hero section becomes the first screen; scroll down reveals the feed.

### Stage 2: Analysis Page (no changes needed)

The current swipeable card-based analysis page already works well:
- Hero card with role summary and readiness score
- Individual task cards with AI exposure scores
- "Practice" button on each task → opens simulator
- Completion card at the end with bookmark CTA

This is already optimized for the student flow. No structural changes needed.

### Stage 3: Simulation (no changes needed)

The `SimulatorModal` chat-based practice flow is already functional and triggered from task cards.

### Stage 4: Profile Sheet (no changes needed)

The `ProfileSheet` slide-out already shows saved roles, analysis history, and progress. This is the "hub" for returning users.

### Stage 5: Auth (minor tweak)

**What changes:**
- Update the `OnboardingModal` to ask for **school/university** instead of (or in addition to) company website, since the target user is a student.
- Add a "university" field to the profiles table (or repurpose the existing `company` field with a label change).

### Summary of Code Changes

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Replace full-screen overlay with inline hero section containing search bar. Remove overlay state/logic. Change layout from fixed-height to scrolling. |
| `src/components/RoleFeed.tsx` | Remove `onOpenSearch` prop, `SearchFAB` component. Make the feed work as a scrollable section rather than a full-viewport container. |
| `src/components/RoleSearchAutocomplete.tsx` | No changes needed — already works as an inline component. |
| `src/components/OnboardingModal.tsx` | Change "Company website" label to "University / School" for student context. |

### What This Achieves

- **First-time student** lands on the page → immediately sees the search bar → types their dream job → gets an AI analysis with tasks → practices a simulation → creates an account to save progress.
- **Returning student** scrolls past the hero to browse the feed, or uses the search bar again, or opens their profile sheet to continue where they left off.
- Zero friction before the "aha moment" (seeing the analysis). Auth is deferred until they want to save something.

