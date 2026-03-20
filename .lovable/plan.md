

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

---

## Bidirectional Context Bridge (View-Aware Chat)

**Status: Implemented**

### What was built:

1. **ViewContext interface** (`HomepageChat.tsx`): Exported type with `activePanel`, `selectedRole`, `selectedTab`, `lastSimResult`
2. **Index.tsx**: Builds a `viewContext` memo from current right-panel state (`rightTab`, `selectedRole`, `myRolesTab`, `lastSimResult`) and passes to both mobile/desktop `HomepageChat` instances
3. **HomepageChat**: Accepts `viewContext` prop, sends it in every chat request body alongside `journeyContext`
4. **career-chat edge function**: Consumes `viewContext`, appends a `## CURRENT VIEW CONTEXT` block to system prompt:
   - If role is open → "Student is viewing [role], assume questions refer to it"
   - If browsing My Roles → "Help prioritize which to practice"
   - If sim just completed → "Acknowledge progress, suggest next task"
5. **MyRolesPanel**: Reports tab changes (`saved`/`practiced`) via new `onTabChange` callback

### User Scenarios Enabled
- Open a saved role → ask "should I practice this?" → AI knows which role
- Finish a sim → next chat message gets congratulations + next steps
- Browse practiced roles → AI proactively summarizes growth
- Territory view → AI references skill gaps naturally
