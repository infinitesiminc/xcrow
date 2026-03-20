

## Unified Journey System: Goal-Locked Territory + Context-Driven Chat

**Status: Implemented**

### What was built:

1. **DB**: Added `target_roles jsonb default '[]'` to `profiles`
2. **Onboarding**: New "Set your goals" step — pick 1-3 target roles from jobs table search
3. **Territory Map** (center panel): Skills show as Claimed/Frontier/Undiscovered tiles. "Contested zones" (HOT badge) for target-role gaps with market demand. Click frontier → "Explore roles for this skill" links to chat.
4. **Player HUD** (left panel): Territory coverage % bar showing claimed/total for target roles. Goal roles listed. Human edges shown as collected trophies.
5. **Quest Log** (right panel): Frontier Skills (target-role gaps) replace generic hot skills. Target Progress shows per-role coverage %. AI Dispatches unchanged.
6. **Career-chat edge function**: Accepts `journeyContext` with target roles, active skills, frontier skills, weakest skill, coverage %. System prompt enhanced with territory-aware coaching instructions.
7. **HomepageChat**: Fetches user profile + simulations on mount, builds journey context, passes to career-chat API.

### Data Flow
```
profiles.target_roles → job_task_clusters.skill_names →
  Territory Map (claimed/frontier/undiscovered) →
  Player HUD (coverage %) + Quest Log (gap skills) →
  Chat (journey context in system prompt)
```

### Territory States
- **Claimed**: XP > 0, full category color
- **Frontier**: In target role or no targets set, dashed border, explorable
- **Undiscovered**: Not in target roles, locked icon, muted
- **Contested**: Frontier + in target roles, HOT badge, pulsing dot, flame icon
