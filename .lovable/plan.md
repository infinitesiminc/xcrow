

## Problem

Two different data sources and task counts for the same role:

1. **RoleFeed overlay** (screenshot 1): Queries `job_task_clusters` table with `.limit(5)` — shows 5 tasks
2. **Analysis page** (screenshot 2): Calls the `analyze-job` edge function which generates tasks via AI on-the-fly — returns 7+ tasks independently

These are completely separate data pipelines producing different task lists for the same role.

## Alignment Strategy

The RoleFeed overlay should serve as a **preview** that funnels users into the full Analysis experience — not a parallel task browser. The fix is two-fold:

### 1. Remove the hard `.limit(5)` in RoleFeed

Change the task clusters query in `RoleFeed.tsx` (line 227) to fetch all tasks (up to ~10), matching what the analysis page shows. This ensures consistency when users see the same role in both views.

### 2. Redesign the Analysis page for TikTok-style continuity

The current Analysis page is a long scrollable list — it breaks the immersive card-based flow. Redesign it as a **vertical card stack** where each task is a full-screen swipeable card:

- **Card 1 (Hero)**: Role name, company, readiness score, AI summary (reuse the summarize-role function)
- **Cards 2-N (Tasks)**: One task per card, full-screen. Shows task name, AI exposure score as a large visual gauge, priority badge, and a prominent "Practice" CTA button. Swipe up to next task.
- **Final Card**: Completion summary — tasks done, readiness score, bookmark CTA

This transforms the Analysis page from a menu into a swipeable discovery experience consistent with the RoleFeed.

### Files to change

| File | Change |
|---|---|
| `src/components/RoleFeed.tsx` | Remove `.limit(5)` on task clusters query |
| `src/pages/Analysis.tsx` | Replace scrollable list with vertical swipeable card stack (one task per screen), add hero card with role summary, add completion card at end |

### Technical approach for the card stack

- Use `framer-motion` drag gestures (already in the project) for vertical swipe navigation
- Track current card index in state, snap to cards on swipe
- Each card uses `h-[calc(100dvh-env(safe-area-inset-bottom))]` for full-screen feel
- Keep the SimulatorModal launch on tap — tapping "Practice" on a task card opens the sim
- Progress indicator: small dots or a thin progress bar at top showing position in the stack

