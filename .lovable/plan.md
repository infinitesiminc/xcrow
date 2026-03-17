

## Simulation Experience Review: What Went Wrong

### The Problem You Hit

You said **"I am not sure"** and the coach responded by:
1. Giving a generic one-liner ("That's a perfectly natural starting point!")
2. Immediately jumping to "Ready for the next scenario?" with the insight card
3. **Completely skipping the coaching/scaffolding step** — the whole point of the simulation

This defeats the purpose. A coach who moves on when someone says "I'm not sure" isn't coaching — they're just running a slideshow.

### Root Cause: Two Issues

**1. No handling for uncertain/low-effort responses**

The `buildCoachingChatSystem` function in `sim-chat/index.ts` has a rigid 3-turn structure:
- Turn 0 (posInRound 0): Feedback + Probe — assumes user gave a substantive answer
- Turn 1 (posInRound 1): Insight card + "Ready for next?"
- Turn 2 (posInRound 2): New scenario

The system prompt at Turn 0 says *"Start with what's genuinely good about their thinking. Be specific — reference their actual words."* But when the user says "I'm not sure," there's nothing to reference, so the AI collapses turns 0+1 into one response and skips ahead.

**2. No scaffolding logic**

The system has no instruction for what to do when users express uncertainty, give very short answers, or say "I don't know." A good coach would break the problem down, offer a starting framework, or ask a simpler question first.

### What Should Happen Instead

When a user says "I'm not sure" / "I don't know" / gives a very short response:

```text
Current flow:                    Target flow:
User: "I'm not sure"            User: "I'm not sure"
Coach: Generic + skip ahead →   Coach: "No worries! Let's break it down.
                                  Think about just one piece: the client
                                  mentioned 200+ documents. What's your
                                  first concern with that volume?"
                                User: "Accuracy I guess"
                                Coach: "Exactly — with that many docs,
                                  hallucination risk is real. What would
                                  you do to verify the answers are correct?"
                                  ... (continues scaffolding until substantive)
```

### Proposed Fix

**File: `supabase/functions/sim-chat/index.ts`** — Modify `buildCoachingChatSystem`

1. **Add uncertainty detection to Turn 0 instructions**: Before the standard feedback+probe flow, add explicit handling:

```
IMPORTANT: If the user expresses uncertainty ("I'm not sure", "I don't know", very short/vague answer under 15 words), do NOT move on. Instead:
- Normalize it: "Totally fair — this is complex territory."
- Break the scenario into ONE smaller, concrete piece they can grab onto.
- Ask a simpler, more specific question about just that piece.
- Do NOT give the answer. Help them find a starting thread.
- Do NOT include 🤖, 💡, or "Ready for next" — stay in coaching mode.
```

2. **Add a scaffolding turn type**: When the AI detects uncertainty at Turn 0, the response should NOT advance the turn counter. The next exchange should still be Turn 0 (feedback+probe), giving the user another chance to engage substantively before moving to the insight card.

**File: `src/components/SimulatorModal.tsx`** — Adjust turn advancement logic

3. **Don't auto-advance turns on short responses**: Currently `turnCount` increments on every send. Add logic: if the user's message is very short (under ~20 chars) and the AI response doesn't contain insight markers (🤖/💡) or "Ready for next", don't increment `turnCount`. This keeps the micro-turn position at "probe" rather than advancing to "insight."

4. **Add a "Help me think" quick-reply button**: When the scenario is first presented, show a subtle button like "Help me think through this" alongside the text input. This sends a structured prompt that triggers the scaffolding path explicitly.

### Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/sim-chat/index.ts` | Add uncertainty-detection instructions to Turn 0 system prompt; add scaffolding turn logic |
| `src/components/SimulatorModal.tsx` | Smart turn-advancement (don't advance on short/uncertain responses); add "Help me think" quick-reply |

No database changes. No new routes.

