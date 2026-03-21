


## Consolidate Deep Dive into Unified Page + Skill Map + Chat Integration

### What Changes

**1. Create `TaskCard.tsx` — unified L1+L2 card** ✅
Single card component that always shows L1 (exposure score, description, practice button) and conditionally reveals L2 (collapse summary, new human role, disrupting tech badges, ghost skill drops, L2 sim button) when `timeHorizon > 0` and prediction exists. Score badge lerps between current and future. L2 section can also be manually expanded via a "See Future" toggle even at `timeHorizon === 0`.

**2. Refactor `RoleDeepDive.tsx` — remove tabs, single scroll** ✅
Replaced `<Tabs>` with vertical flow: Time Slider → Hero Stats → Role Summary → Task Cards → Disrupting Tech Bar → Skill Map CTA → Sign-in CTA.

**3. L2 gating behind L1 milestone** ✅
TimeAxisSlider locks future positions for logged-in users with 0 completed sims. Lock icon + tooltip.

**4. Chat connector** ✅
Floating "Ask about this role" FAB → Sheet with career-chat integration and full role context.

**5. Delete tab files** ✅
Removed OverviewTab.tsx, TaskXRayTab.tsx, FutureViewTab.tsx.
