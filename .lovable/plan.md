

## Simulation Progression: 3 Fixed Quests + Level 2 Future Sims

### Overview

Level 1 sims teach current AI tools via Learn→Apply loops. Level 2 unlocks **new simulation scenarios** set in a future where AI has already collapsed the task — the user practices the evolved human role (oversight, validation, strategic direction).

### Architecture

```text
LEVEL 1 (Default)                    LEVEL 2 (Unlocked)
───────────────────                  ─────────────────────────────
"Use Gemini to profile data"         "AI Agents now auto-profile all
                                      datasets. You validate, catch
                                      bias, and direct the pipeline."

3 quests, Learn→Apply               3 quests, Learn→Apply
Current AI tools                     Future human-in-the-loop role
Earn XP                              Earn XP + "Future Vision" badge

Unlock: Anyone                       Unlock: 3+ sims same role OR
                                     score ≥80% on any sim in role
```

### Phase 1 Changes (This Implementation)

#### 1. `supabase/functions/sim-chat/index.ts`

**Fix rounds to 3:**
- Set `MIN_ROUNDS = 3`, `MAX_ROUNDS = 3`
- Update compile prompt: "This simulation has exactly 3 rounds, one per objective"
- Remove dynamic end logic in `buildLearnApplySystem`

**Add Level 2 compile mode:**
- New payload field: `level: 1 | 2` (default 1)
- When `level === 2`, the compile prompt changes dramatically:
  - Instead of "learn current AI tools", it says: "The task has been largely automated. Teach the user the NEW human role."
  - Uses `task_future_predictions` data (passed from frontend) to ground scenarios: collapse summary, disrupting tech, new human role
  - Objectives shift to: validating AI output, strategic oversight, catching edge cases AI misses
  - Opening message format same (scenario + lesson + 2 options) but content is future-focused

#### 2. `src/components/SimulatorModal.tsx`

**Remove quest dividers:**
- Delete `isNewScenario` block and "New Quest" UI
- Keep `Quest X/3` header counter and progress bar

**Add Level 2 support:**
- Accept new prop: `level?: 1 | 2` and `futurePrediction?: FuturePrediction`
- Pass `level` and prediction data to `compileSession()`
- When `level === 2`, header shows "⚡ Level 2 — Future Scenario" badge

**Restructure done-phase into 2-card layout:**

Card 1 — **Next Battle:**
- If `onNextBattle` exists: show next unplayed task + "Continue Campaign"
- If standalone: show "Explore More Roles"
- Campaign progress bar (X/Y conquered)

Card 2 — **Level 2 Preview / Launch:**
- If user hasn't unlocked Level 2: show teaser with collapse risk + "Complete X more quests to unlock"
- If unlocked but hasn't done Level 2 for this task: show "🔮 Try Level 2" CTA with prediction summary
- If already in Level 2: show "Explore Future Map" CTA linking to Territory Map

**Level 2 unlock check (client-side):**
- After scoring, query `completed_simulations` count for this `job_title`
- If count ≥ 3 OR current score ≥ 80%: Level 2 is unlocked
- Fetch `task_future_predictions` for this task to populate the Level 2 card

#### 3. `src/lib/simulator.ts`

- Add `level` parameter to `compileSession()` and `SimSession` types
- Pass `futurePrediction` data in compile payload when level === 2

#### 4. `src/components/analysis/FutureTaskPreview.tsx`

- Update the "Try Level 2" button to launch SimulatorModal with `level: 2` and prediction data (currently it just calls `onStartSim` without level context)

### What stays the same
- Learn→Apply 2-beat pedagogy (both levels use it)
- 3 objectives per sim (1:1 with rounds)
- XP system, skill earning, objective tracking
- Score ring and battle report
- Intel advantage integration
- RPG theming

### Files changed
1. `supabase/functions/sim-chat/index.ts` — Fix to 3 rounds, add Level 2 compile branch
2. `src/components/SimulatorModal.tsx` — Remove dividers, add Level 2 props/UI, restructure done-phase
3. `src/lib/simulator.ts` — Add level param to types and compile call
4. `src/components/analysis/FutureTaskPreview.tsx` — Wire Level 2 sim launch with prediction data

