

# Remap: Skill Map as the Single Mental Model

## Vision

Everything a student does — chatting, exploring roles, practicing tasks — feeds into one thing: **their Skill Map**. The Skill Map replaces the bullseye/4-pillar system with something intuitive and gamified. The pitch: "Build your skill map. Land jobs before you graduate."

## What Changes

### 1. Replace 4-Pillar Scoring with Skill-Based XP

**Current**: Simulations score users on 4 abstract pillars (Tool Awareness, Human Value-Add, Adaptive Thinking, Domain Judgment). These are stored in `completed_simulations` and displayed nowhere meaningful to users.

**New**: Each simulation maps to 1-3 **skills** from the existing 26-skill taxonomy. Completing a simulation earns **XP** toward those skills. No numeric scores shown — just skill levels (Beginner → Developing → Proficient → Expert) with progress bars.

**Changes**:
- **DB migration**: Add `skills_earned jsonb` column to `completed_simulations` (array of `{skill_id, xp}` objects). Keep the 4-pillar columns for backward compat but stop displaying them.
- **`supabase/functions/sim-chat/index.ts`**: In `handleScore`, after existing scoring, map the task to skills using the taxonomy keyword matcher and return `skillsEarned` in the response.
- **`src/components/SimulatorModal.tsx`**: 
  - Remove 4-pillar score display from done screen
  - Replace with animated "Skills Earned" cards showing which skills gained XP
  - Add satisfying level-up animation when a skill crosses a threshold
  - Save `skills_earned` to the completion record

### 2. Redesign Journey Page as the Skill Map

**Current**: Journey shows a bullseye visualization (complex, abstract) with stats ribbon.

**New**: Journey becomes the **Skill Map** — a visual grid/garden of skills organized by category. Each skill is a tile that fills up as the user practices. Simple, scannable, gamified.

**Changes**:
- **`src/pages/Journey.tsx`**: Rename to "My Skill Map" in navbar and page title
- **`src/components/settings/JourneyDashboard.tsx`**: Replace the CareerReachMap with a new **SkillMapGrid** component:
  - 6 category sections (Technical, Analytical, Communication, Leadership, Creative, Compliance)
  - Each skill = a card with: name, level indicator (1-5 dots or progress ring), XP bar, spectrum color based on AI exposure
  - Skills the user has practiced glow/elevate; unpracticed ones are muted
  - Tapping a skill shows: which tasks built it, which roles need it, suggested next task
- **Stats ribbon**: Keep but simplify — "12 Skills · 3 Leveled Up · 27 Tasks Practiced"
- Remove "Suggested Next" skill cards (move that logic into the map itself)

### 3. Simplify the Simulation Experience

**Current**: Briefing → Learning Objectives sidebar → Scaffolding tiers → 4-pillar score → Review screen. Too much cognitive overhead.

**New**: Streamlined flow — Brief intro → Conversation → Skill XP earned. No visible "objectives" or "scaffolding tiers" to the user (keep them in the backend for AI coaching quality).

**Changes**:
- **`src/components/SimulatorModal.tsx`**:
  - Remove the objectives sidebar toggle button from header
  - Remove `ObjectiveChecklist` component visibility (keep internally for AI)
  - Remove scaffolding tier labels from chat
  - Remove `UnmetObjectivesReview` screen — when user finishes, go straight to scoring
  - Simplify done screen: animated skill cards earned + "Continue" CTA
  - Add streak counter: "3-day streak" if applicable
- **`src/lib/simulator.ts`**: Keep scoring API as-is internally but transform output for UI

### 4. Skill Map Preview on Homepage

**Current**: `SkillSuggestionCards` shows 3 cards with "X roles closer" messaging (complex).

**New**: Show a mini skill map preview — the user's top 5 skills as small progress rings with a "Continue building" CTA. Simple, visual, motivating.

**Changes**:
- **`src/components/SkillSuggestionCards.tsx`**: Rewrite to show mini skill progress rings from `completed_simulations` data, grouped by recent activity. "You're leveling up Strategy — keep going" messaging.

### 5. Chat Coach Framing

**Current**: Career-chat prompt focuses on role exploration.

**New**: Add skill-map awareness to the coach. After showing roles, the coach says things like "Practicing the Strategy task here would level up your Strategy skill — you're 2 tasks away from Proficient."

**Changes**:
- **`supabase/functions/career-chat/index.ts`**: Update SYSTEM_PROMPT to reference the skill map mental model. Add instruction: "When suggesting roles, mention which skills the student would build and their current level if known."

### 6. Role Preview → Skill Connection

**Current**: RolePreviewPanel shows tasks with AI exposure scores.

**New**: Each task also shows which skills it builds. "Practice this → +Strategy, +Stakeholder Management"

**Changes**:
- **`src/components/RolePreviewPanel.tsx`**: Add skill pills below each task using the taxonomy keyword matcher. Use spectrum colors.

## Technical Details

### Skill XP Calculation
```text
Each completed simulation = base 100 XP
Split across matched skills (e.g., 2 skills = 50 XP each)
Level thresholds: 0→Beginner, 100→Developing, 300→Proficient, 600→Expert
```

### Skill Map Data Flow
```text
completed_simulations (existing rows) 
  → aggregate by skill using taxonomy keyword matcher
  → compute XP per skill
  → render as SkillMapGrid
```

No new tables needed — we compute skill XP from existing `completed_simulations` by matching `task_name` and `job_title` to taxonomy keywords. The new `skills_earned` column is optional optimization.

### Files Modified
| File | Change |
|------|--------|
| `src/pages/Journey.tsx` | Rename to "Skill Map", update data fetching |
| `src/components/settings/JourneyDashboard.tsx` | Replace CareerReachMap with SkillMapGrid |
| `src/components/settings/CareerReachMap.tsx` | Deprecate (keep file, stop importing) |
| `src/components/SimulatorModal.tsx` | Remove objectives UI, simplify done screen to skill XP |
| `src/components/SkillSuggestionCards.tsx` | Rewrite as mini skill progress rings |
| `src/components/RolePreviewPanel.tsx` | Add skill pills to task cards |
| `src/components/Navbar.tsx` | Rename "My Journey" → "Skill Map" |
| `supabase/functions/career-chat/index.ts` | Update prompt with skill map framing |
| `supabase/functions/sim-chat/index.ts` | Add skill mapping to score response |
| DB migration | Add `skills_earned jsonb` to `completed_simulations` |

### What We Keep (Backend Only)
- 4-pillar scoring stays in the backend for AI coaching quality
- Learning objectives stay for AI prompt engineering
- Scaffolding tiers stay for pedagogical scaffolding
- These are invisible to the user — they just see "skills earned"

