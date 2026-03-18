## Problem

The **enlarged overlay** (full-screen task list) has no progress indicator showing how many tasks the user has completed. The breakdown view has one, but when returning from a simulation to the enlarged view, users can't see their overall progress.

## Plan

### Add a progress bar to the enlarged overlay and also change practice button to reflect task progress

In `src/components/RolePreviewPanel.tsx`, add a compact progress row between the hero section and the task list header (around line 217):

- Show a slim progress bar with "{completedCount}/{tasks.length} practiced" text
- Only render when `completedCount > 0` (same pattern as breakdown view, line 311)
- Use the same styling as the breakdown view's progress bar for consistency
- Additionally, the `closeSimulation` function (line 160) should trigger `fetchCompletions()` so the progress updates immediately when returning from a simulation 

### Files changed

- `src/components/RolePreviewPanel.tsx`
  - Add progress bar in enlarged overlay between hero row and task heading
  - Call `fetchCompletions()` inside `closeSimulation` to refresh completion state on return