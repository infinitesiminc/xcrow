

## Simulation Pedagogy Overhaul: Learn → Apply Loop

### Problem
The current simulation uses a Socratic "quiz first, teach if stuck" model with a 3-turn cycle (probe → deeper probe → insight). This causes:
- Repeated "help me" clicks (disengagement)
- AI interrogation loops despite anti-interrogation patches
- Cognitive overload from 3 long multiple-choice options
- Even experienced AI users struggle → students would quit immediately

### New Framework: Teach-Then-Test

Each round becomes a tight **2-beat loop**:

```text
┌─────────────────────────────────────────┐
│  BEAT 1: LEARN (AI teaches)             │
│  📖 Scenario (2 sentences)              │
│  💡 Mini-lesson: "Here's the key        │
│     insight: [tool + technique]"         │
│  🤖 Pro tip: 1 sentence                 │
├─────────────────────────────────────────┤
│  BEAT 2: APPLY (User picks)             │
│  Two options only:                      │
│  A) Strong approach (correct)           │
│  B) Common misconception               │
│  → User picks → AI confirms/corrects   │
│  → Insight card → Next round            │
└─────────────────────────────────────────┘
```

**Why this works:**
- Teaching BEFORE quizzing removes the "I don't know" problem entirely
- 2 options instead of 3 = binary decision, dramatically less friction
- No open-ended questions at baseline difficulty = no interrogation loops
- Each round completes in 2 messages instead of 3-6

### Difficulty Progression (Future)
- **Level 1** (default): Teach → 2 choices (current plan)
- **Level 2** (after data): Teach → 3 choices with reasoning required
- **Level 3** (advanced): Scenario → open-ended → feedback

For now, all users start at Level 1.

### Technical Changes

#### 1. Refactor `sim-chat/index.ts` — Chat system prompt

**Replace the 3-position turn cycle** (`posInRound = turnCount % 3`) with a **2-position cycle**:

- **Position 0 (LEARN + QUIZ)**: AI presents scenario, teaches the concept, then offers exactly 2 options. This is the AI's turn — no user input needed before teaching.
- **Position 1 (EVALUATE + ADVANCE)**: User picked A or B. AI confirms/corrects in 2 sentences, shows insight card (🤖 + 💡), then immediately presents the NEXT round's scenario + lesson + 2 options.

This means each user message triggers one response that both closes the current round AND opens the next — keeping pace fast.

**Remove/simplify:**
- The `NEEDS_DEPTH` tag and depth gate (no more probing loops)
- The anti-interrogation rule (no longer needed — AI never asks open-ended questions at Level 1)
- The 3-tier scaffolding system (replaced by teach-first design)
- The quality gate for short responses (2-option selection is always valid)
- Recovery mode (teach-first prevents the stuck state)

**Keep:**
- Objective evaluation tags (`OBJ_EVAL`)
- Dynamic round management (min/max rounds)
- Tool version context
- Intel advantage integration

#### 2. Refactor `sim-chat/index.ts` — Compile prompt

Update the `openingMessage` instruction to follow the new format:
- Scenario + mini-lesson + 2 options (not just scenario + "how would you approach this?")

#### 3. Update `SimulatorModal.tsx` — Turn counting

- Change turn cycle from `% 3` to `% 2`
- Remove `NEEDS_DEPTH` handling (turns always advance)
- Simplify scaffolding tier tracking (no longer drives behavior)

#### 4. Update compile prompt objectives

Keep 3 objectives but instruct the AI that each objective's round must follow Learn→Apply format with binary choices.

### What stays the same
- RPG theming and UI
- XP system and battle reports
- Objective tracking and `OBJ_EVAL` tags
- Intel advantage loop
- Celebration-first scoring
- Wave counter UI

### Summary of files changed
1. `supabase/functions/sim-chat/index.ts` — Major prompt rewrite for Learn→Apply loop
2. `src/components/SimulatorModal.tsx` — Simplify turn cycle logic

