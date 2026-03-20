

## Fully Context-Aware AI Chat + Right Panel Sync

### Problem
The chat AI and right panel (territory, my roles, role preview) operate independently. When a user opens a role in "My Roles", asks about it in chat, or finishes a simulation, the AI has no awareness of what the user is looking at or has just done. This creates a disconnected experience.

### Solution: Bidirectional Context Bridge

Pass a **live "view context"** from the right panel into every chat message so the AI always knows what the user is seeing. The AI can then reference the specific role, suggest practice, summarize progress, and guide next steps.

### Architecture

```text
┌─────────────────────┐         ┌──────────────────────┐
│   Left: Chat        │◄───────►│  Right: Panel State   │
│                     │ viewCtx │  (territory/role/sim) │
│  HomepageChat       │────────►│                      │
│  sends viewContext  │         │  selectedRole        │
│  with every message │         │  rightTab            │
│                     │         │  lastSimResult       │
└─────────────────────┘         └──────────────────────┘
        │
        ▼
  career-chat edge fn
  (system prompt includes viewContext)
```

### Changes

**1. Pass view context from Index → HomepageChat → edge function**

Add a new prop `viewContext` to `HomepageChat` containing:
- `activePanel`: "territory" | "roles" | "role-preview"
- `selectedRole`: `{ title, company, jobId }` if a role is open
- `selectedTab`: "saved" | "practiced" (if on My Roles)
- `lastSimResult`: `{ taskName, jobTitle, scores }` if user just finished a sim

In `Index.tsx`, build this object from existing state (`rightTab`, `selectedRole`) and pass it down.

In `HomepageChat.sendMessage()`, include `viewContext` in the request body alongside `journeyContext`.

**2. Update edge function system prompt with view context**

In `career-chat/index.ts`, append a `## CURRENT VIEW CONTEXT` block to the system prompt:
- "Student is currently viewing: [role title] at [company]" → AI can answer questions about that specific role
- "Student is browsing their saved/practiced roles" → AI can proactively summarize progress
- "Student just completed a simulation: [task] for [role] with scores [X]" → AI congratulates and suggests next steps

Add instructions: "When the student has a role open, assume questions like 'what should I practice' refer to THAT role. When they just finished a sim, acknowledge their progress before moving on."

**3. Auto-inject sim completion context**

In `Index.tsx`, add a `lastSimResult` state that gets set when a simulation completes (via `SimulatorModal.onComplete` callback). This is already partially wired through `RolePreviewPanel`. Add a callback prop that bubbles up to Index.

When `lastSimResult` is set, it's included in `viewContext` so the next chat message gets full awareness. Clear it after the AI acknowledges it (or after 2 messages).

**4. Right panel reacts to AI actions**

When AI calls `check_readiness` for a role, emit a new SSE event `{ type: "focus_role", jobId, title, company }`. The frontend handles this by:
- Switching to role preview if the role is in discovered batches
- Or showing a mini readiness summary inline in chat

When AI calls `search_roles`, the existing `role_cards` event already updates the right panel. No change needed here.

**5. "My Roles" → chat integration improvements**

Currently clicking a role in My Roles triggers `onAskChat("How ready am I for [role]?")`. Enhance this:
- Also set `selectedRole` so the right panel shows the role preview
- The `viewContext` automatically includes this role, so the AI knows the user clicked it from their saved/practiced list (not from search)
- AI can say "I see you've practiced this role before — let me check your latest progress"

**6. System prompt additions**

Add to the career-chat system prompt:
```
## VIEW-AWARE COACHING
When viewContext is provided:
- If a role is selected, assume questions refer to that role unless stated otherwise
- If the student just completed a sim, acknowledge it and suggest the next task
- If they're browsing "practiced" roles, proactively mention how they've grown
- If they're on "saved" roles, help them prioritize which to practice first
- Connect everything back to their territory: "This sim just claimed your Data Analysis tile!"
```

### Files to modify
- `src/pages/Index.tsx` — build viewContext, add lastSimResult state, pass to HomepageChat
- `src/components/HomepageChat.tsx` — accept viewContext prop, send with each message, handle focus_role events
- `supabase/functions/career-chat/index.ts` — consume viewContext in system prompt, emit focus_role events
- `src/components/territory/MyRolesPanel.tsx` — also set selectedRole when clicking (not just askChat)

### What this enables (user scenarios)
1. **"What is the PM role I practiced before?"** → AI sees practiced tasks in journeyContext, references specific sims
2. **User opens a saved role → asks "should I practice this?"** → AI sees the role in viewContext, runs readiness check automatically
3. **User finishes a sim → returns to chat** → AI says "Nice work on Customer Feedback Synthesis! You just claimed Communication. Next up: try Roadmap Planning to claim Strategy."
4. **User clicks a role from My Roles** → role preview opens + AI gets context that this is a saved/practiced role

