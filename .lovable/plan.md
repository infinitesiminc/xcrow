

## Unified Journey System: Goal-Locked Territory + Context-Driven Chat

### The Core Narrative

Your skill map is a **territory map**. Each of the 26 skills is a hex/tile. Practiced skills are "claimed" (lit up in category color). Unpracticed adjacent skills are "frontiers" (dim, explorable). Skills required by your target roles but unclaimed are **"contested zones"** — high-value territory the market demands.

The chat doesn't just discover roles — it reads your territory and coaches you on where to expand next.

---

### Q1: Goal-Locked Personalization

**How it works:**

1. **Onboarding change**: After career stage + job title, add a step: "Pick 1-3 roles you want to be ready for." Pull from `jobs` table or let them type freeform. Store as a new `target_roles` JSONB column on `profiles`.

2. **Skill tree reacts**: For each target role, look up its `job_task_clusters` → extract `skill_names` → highlight those skills on the territory map as **"objective markers"**. Skills outside all target roles are still visible but muted — available for organic exploration.

3. **Coverage metric**: "You cover 6/14 skills needed for Product Manager at Stripe." This replaces generic XP as the primary progress indicator in the Player HUD.

4. **Quest log adapts**: Instead of generic "Hot Skills," show "Skills your target roles need that you haven't practiced." Instead of generic "Role Unlocks," show "How close you are to each target role."

**Data flow:**
```text
profiles.target_roles → job_task_clusters.skill_names → 
  filter SKILL_TAXONOMY → highlight on territory map
```

No new tables needed — just a JSONB column on `profiles` storing `[{job_id, title, company}]`.

---

### Q2: Territory Expansion Story

**Visual model (center panel redesign):**

- Replace the branching skill tree with a **hex grid or bubble cluster** where proximity = category relatedness
- Three visual states per tile:
  - **Claimed** (practiced, XP > 0): Full color, category glow
  - **Frontier** (adjacent to claimed, or in target role): Dim outline, pulsing border — "available to explore"
  - **Undiscovered** (no connection to anything practiced): Dark silhouette with lock icon
- **Contested zones**: Frontier tiles that are also in-demand by market AND required by target roles get a special marker (flame icon or ring)

**Human Edges as territory bonuses:**
- When you claim a skill that has a Human Edge, the edge appears as a "bonus" badge on that tile
- Edges are the "rare loot" of territory expansion — you don't just get XP, you unlock something AI can't replicate
- Player HUD shows edges as collected trophies, not a separate list

**Progression feel:**
- Territory % = skills claimed / skills needed for target roles
- Each simulation "claims" or "levels up" a tile
- Visual reward: tile animates from dim → lit when first practiced

---

### Q3: Journey Drives Chat Context

**How chat becomes territory-aware:**

1. **Pass journey state to career-chat edge function**: When user opens chat, include:
   - `target_roles`: their goal roles
   - `active_skills`: skills with XP > 0
   - `frontier_skills`: skills adjacent to active that are in target roles
   - `weakest_skill`: lowest XP among target-role skills

2. **Chat system prompt enhancement**: Add a section like:
   ```
   The user's territory map shows they've practiced: [Strategy, Data Analysis, Writing].
   Their target role "Product Manager" needs: [Strategy, Stakeholder Mgmt, Project Mgmt, Data Analysis, Design UX].
   Unpracticed gaps: [Stakeholder Mgmt, Project Mgmt, Design UX].
   Suggest roles and tasks that would help them claim these frontier territories.
   ```

3. **Chat responses reference the map**:
   - "This role would help you claim **Stakeholder Management** — one of 3 frontiers for your PM goal"
   - "You're 2 skills away from full coverage on Product Manager"
   - When user completes a sim, chat can say "Territory expanded! You just claimed Design & UX"

4. **Skill tree nodes link back to chat**: Click a frontier tile → "Explore roles that build this skill" → opens chat with pre-filled prompt

**No bidirectional sync complexity** — chat simply reads journey state on each message. Journey updates happen via simulation completions (existing flow). Chat is the scout, journey is the map.

---

### End-to-End UX Flow

```text
ONBOARDING
  "What roles interest you?" → Pick 1-3 target roles
  ↓
HOMEPAGE CHAT (/)
  Chat reads your territory + targets
  "You need Stakeholder Mgmt for PM — here are 3 roles to practice it"
  → User clicks role card → Preview panel → Launch simulation
  ↓
SIMULATION
  Complete task → Earn XP → Skill tile claims/levels up
  → Human Edge unlocked as bonus
  → "Territory expanded" celebration
  ↓
MISSION CONTROL (/journey)
  Territory map shows progress toward target roles
  Contested zones highlight urgent gaps
  Quest log shows: "3 more skills to cover PM at Stripe"
  Click frontier tile → "Explore roles for this skill" → back to chat
  ↓
LOOP CONTINUES
```

---

### Implementation Scope

1. **DB**: Add `target_roles jsonb default '[]'` to `profiles`
2. **Onboarding**: Add target role picker step (search `jobs` table)
3. **Journey center panel**: Redesign from branching tree → territory map (hex/bubble cluster)
4. **Player HUD**: Replace generic stats with target-role coverage %
5. **Intel Feed**: Replace generic hot skills with goal-specific gap skills
6. **career-chat edge function**: Add journey context to system prompt
7. **HomepageChat**: Pass journey state when sending messages
8. **Skill tile interaction**: Click frontier → pre-fill chat prompt

### What This Does NOT Change
- Simulation engine (untouched)
- XP/level system (untouched)
- Skill taxonomy (untouched)
- Database schema for completions/bookmarks (untouched)

