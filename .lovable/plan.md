

# Robust Learning Objective Enforcement for Simulations

## Problem Analysis

After reviewing the full simulation pipeline (`sim-chat/index.ts` edge function + `SimulatorModal.tsx`), I identified these failure points:

1. **Objective tagging is unreliable** — The AI is asked to include `[OBJECTIVE_MET:id]` tags, but LLMs frequently forget or omit them, making client-side tracking inconsistent.
2. **No objective-aware round routing** — New scenarios are presented sequentially without checking which objectives remain uncovered. The AI is told to "steer toward uncovered objectives" but has no enforcement mechanism.
3. **Premature exit is too easy** — Users can click "End Quest" at any time, and `handleFinishAttempt` skips the review screen entirely (line 692-695).
4. **Scoring is disconnected from live tracking** — The final `scoreSession` re-evaluates objectives from scratch on the transcript, so the live checklist and the final report can disagree.
5. **No minimum engagement guarantee** — A user can give one-word answers through all rounds and still complete the simulation.

## Solution: Objective-Gated Simulation Loop

```text
┌─────────────┐
│  BRIEFING   │  Shows 3 objectives clearly
└──────┬──────┘
       ▼
┌─────────────────────────────────────────┐
│  CHAT LOOP (Round N)                    │
│                                         │
│  1. AI presents scenario targeting      │
│     FIRST UNMET objective               │
│  2. User responds                       │
│  3. Quality Gate: [NEEDS_DEPTH] if weak │
│  4. AI evaluates + tags [OBJ_MET:id]   │
│  5. Insight card shown                  │
│  6. Decision point:                     │
│     ├─ Unmet objectives remain → Next   │
│     ├─ All met + min rounds → Victory   │
│     └─ Max rounds hit → Forced finish   │
└─────────────────────────────────────────┘
       ▼
┌─────────────────────────────────────────┐
│  FINISH GATE (new)                      │
│  If unmet objectives & rounds < max:    │
│  → Show UnmetObjectivesReview screen    │
│  → "Fight On" or "Retreat & Score"      │
└─────────────────────────────────────────┘
       ▼
┌─────────────┐
│   SCORING   │  Server validates objectives
└─────────────┘
```

## Changes

### 1. Edge Function: Structured Objective Targeting (sim-chat/index.ts)

**Scenario generation (posInRound === 2):**
- Change the new-scenario instruction to explicitly name the target objective ID: `"Your next scenario MUST target objective: [id] — [label]"`.
- Pass the first unmet objective ID from `objectiveStatus` so the AI doesn't have to guess.

**Feedback turn (posInRound === 0):**
- Add a mandatory evaluation step: after giving feedback, the AI must output a structured tag: `[OBJ_EVAL:objective_id:PASS]` or `[OBJ_EVAL:objective_id:FAIL]` — replacing the current optional `[OBJECTIVE_MET]` tag.
- This makes objective evaluation a required part of every feedback turn, not optional.

**Insight turn (posInRound === 1):**
- If the current round's objective was FAIL'd, instruct the AI to briefly explain what mastery would look like before showing the insight card — turning a miss into a teaching moment.

### 2. Client: Deterministic Objective Tracking (SimulatorModal.tsx)

**Replace tag-based tracking with structured evaluation:**
- Parse `[OBJ_EVAL:id:PASS]` and `[OBJ_EVAL:id:FAIL]` tags from every feedback turn.
- Update `objectiveStatus` deterministically — only PASS marks an objective as met.
- Send the `currentTargetObjective` ID to the edge function so it knows which objective this round is testing.

**Enforce finish gate:**
- Restore the review screen: when user clicks "End Quest" and unmet objectives remain with rounds left, show `UnmetObjectivesReview` (currently bypassed at line 692-695).
- Only allow direct finish if: all objectives met, OR max rounds reached.

**Auto-advance objective targeting:**
- Track `currentObjectiveIndex` — after an objective is met, automatically target the next unmet one.
- Pass this as `targetObjectiveId` in the `chatTurn` payload.

### 3. Edge Function: Scoring Alignment (handleScore)

- Pass the live `objectiveStatus` from the client to the scoring function.
- The scorer should use the live tracking as ground truth and only override if the transcript clearly contradicts it.
- This prevents disagreements between the live checklist and final report.

### 4. Victory Flow

- When all 3 objectives are met during chat, show an inline celebration banner: "All objectives conquered!" with a pulsing "Battle Report" button.
- Remove the "Next Wave" button — no more aimless rounds after victory.

## Technical Details

**New payload field for chatTurn:**
```typescript
targetObjectiveId?: string  // ID of the objective this round is testing
```

**New tags (replacing OBJECTIVE_MET):**
```
[OBJ_EVAL:tool_selection:PASS]    // Objective met
[OBJ_EVAL:tool_selection:FAIL]    // Not yet met
[TARGET_OBJ:tool_selection]       // Confirms which objective AI is testing
```

**Files to modify:**
- `supabase/functions/sim-chat/index.ts` — Objective-targeted prompts, mandatory eval tags
- `src/components/SimulatorModal.tsx` — Deterministic tracking, finish gate, victory flow
- `src/lib/simulator.ts` — Add `targetObjectiveId` to `chatTurn` signature

