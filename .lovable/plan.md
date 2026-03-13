

## Problem

The simulator assumes users already know the job. It drops them into a scenario with zero context — no explanation of the role, industry terms, or what good looks like. Users exploring unfamiliar careers get a confusing experience instead of learning what the job feels like.

## Solution

Add a **briefing phase** before the chat begins, and redesign the AI prompts to be pedagogical rather than evaluative.

### Changes

**1. Edge function (`supabase/functions/sim-chat/index.ts`) — Richer compile prompt**

Update `handleCompile` to generate additional context fields:
- `briefing`: 3-4 sentences explaining the role, what this task involves day-to-day, key terms the user should know, and what "good" looks like. Written for a complete beginner.
- `tips`: 2-3 bullet-point hints the user can reference during the chat.
- Update `openingMessage` prompt to instruct the AI to naturally weave in context (e.g. "As you know, in abuse investigations we typically start by...") so users learn terminology organically.

Update `handleChat` system prompt to:
- Act as a **patient mentor**, not just a colleague — explain industry jargon when the user seems unfamiliar.
- Offer gentle guidance if the user is stuck ("Here's how we'd typically approach this...").
- Provide realistic context in responses so users absorb how the job works.

**2. Simulator modal (`src/components/SimulatorModal.tsx`) — Briefing screen**

Add a new phase `"briefing"` between `loading` and `chat`:
- Shows the scenario title and the `briefing` text explaining the task context.
- Shows `tips` as collapsible hints the user can peek at during the chat.
- "Start Simulation" button transitions to `chat` phase.
- Tips remain accessible via a small toggle/icon during the chat phase.

**3. Client lib (`src/lib/simulator.ts`) — Updated types**

Add `briefing: string` and `tips: string[]` to `SimSession` interface.

### Flow

```text
[Practice button] → Loading → Briefing screen → Chat (with tips toggle) → Score
                                 ↑
                          "Here's what this task is about,
                           key terms, and what to aim for"
```

### Prompt Design (compile)

The key change is instructing the AI to generate beginner-friendly context:

> "Assume the user has ZERO experience in this industry. Generate a briefing that explains: (1) what this task involves in plain language, (2) 3-4 key terms they'll encounter, (3) what a good response looks like. Also generate 2-3 actionable tips. The opening message should naturally introduce context so the user learns by doing."

The chat system prompt shifts from "stay in character, don't break it" to "be a supportive mentor who explains things naturally while staying in a realistic scenario."

