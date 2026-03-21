

## Consolidate Deep Dive into Unified Page + Skill Map + Chat Integration

### What Changes

**1. Create `TaskCard.tsx` — unified L1+L2 card**
Single card component that always shows L1 (exposure score, description, practice button) and conditionally reveals L2 (collapse summary, new human role, disrupting tech badges, ghost skill drops, L2 sim button) when `timeHorizon > 0` and prediction exists. Score badge lerps between current and future. L2 section can also be manually expanded via a "See Future" toggle even at `timeHorizon === 0`. Cards sorted by display score.

**2. Refactor `RoleDeepDive.tsx` — remove tabs, single scroll**
Replace the `<Tabs>` system with a vertical flow:
- **Time Axis Slider** (stays sticky below header)
- **Hero Stats** — ReadinessRing + 3 stat cards (inlined from OverviewTab), morphing with slider
- **Role Summary** — contextual text (from OverviewTab)
- **Task Cards** — unified list using new `TaskCard`
- **Disrupting Tech Bar** — collapsible summary of all unique techs from predictions
- **Skills Section** — merged current skills + ghost future skills from predictions
- **Skill Map CTA** — "View Your Skill Territory" button linking to `/journey` with skill context
- **Sign-in CTA** (if not authed)

Move `ReadinessRing` and `StatCard` helpers into `RoleDeepDive.tsx` directly.

**3. L2 gating behind L1 milestone**
The time slider's future positions (2-3Y, 5+Y) are locked until the user has completed at least 1 simulation for this role. Visual lock icon on the slider stops with a tooltip: "Practice a task to unlock Future View." This ensures users understand L1 before accessing L2. The gate only applies to logged-in users who haven't practiced; anonymous users see predictions ungated (to hook them).

**4. Skill Map integration**
After the task cards section, add a compact "Your Skills for This Role" strip:
- Show skills from `result.skills` matched against the user's skill territory data
- Each skill shows its castle tier/level if the user has XP, or a ghost state if not
- Clicking a skill navigates to `/journey` with that skill focused
- When `timeHorizon > 0`, ghost future skills from predictions appear alongside with dashed borders

**5. Chat connector**
Add a floating "Ask about this role" button (bottom-right) that opens a slide-up chat panel using the existing `career-chat` edge function. The chat receives role context automatically:
- `jobTitle`, `company`, `timeHorizon` position, `completedCount`, `predictions` summary
- This lets the AI answer questions like "What should I practice first?" or "How will this role change?" with full context
- Reuses the `HomepageChat` message rendering pattern (TypewriterMarkdown) but in a sheet/drawer

**6. Delete tab files**
Remove `OverviewTab.tsx`, `TaskXRayTab.tsx`, `FutureViewTab.tsx` — absorbed into the unified page and `TaskCard`.

### Files

| Action | File |
|--------|------|
| Create | `src/components/role/TaskCard.tsx` |
| Create | `src/components/role/RoleChat.tsx` (slide-up chat panel) |
| Refactor | `src/pages/RoleDeepDive.tsx` |
| Modify | `src/components/role/TimeAxisSlider.tsx` (add lock states) |
| Delete | `src/components/role/OverviewTab.tsx` |
| Delete | `src/components/role/TaskXRayTab.tsx` |
| Delete | `src/components/role/FutureViewTab.tsx` |

### Technical Notes

- `TaskCard` props: `task`, `prediction`, `timeHorizon`, `isCompleted`, `onPractice`, `jobTitle`, `company`. Uses `lerp` + `exposureStyle` for score morphing. L2 section uses `AnimatePresence` for expand/collapse.
- L2 gate: `const l2Unlocked = !user || completedCount >= 1`. TimeAxisSlider receives `locked` prop to disable clicks on stops 1 and 2.
- RoleChat: Opens as a `Sheet` (from shadcn). Sends messages to `career-chat` with `viewContext` containing `{ page: "role-deep-dive", jobTitle, company, timeHorizon, completedCount, predictionsSummary }`.
- Skill strip: Fetches user's `completed_simulations` to compute skill XP via `aggregateSkillXP`, then matches against `result.skills` by name/keyword.

