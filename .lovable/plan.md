

# Rethinking the AI Assistant for Maximum Utility

## Problem

The current floating chat is **disconnected from the workflow**. It:
- Hardcodes `website: "xcrow.com"` regardless of the user's actual workspace
- Has no awareness of which section the user is on (Research / Personas / Leads)
- Cannot take actions — it only talks
- Duplicates the guided flow that the UI already handles (enter domain → research → personas → find leads)
- Is a generic chatbot when users need a **contextual co-pilot**

## Design Principle

The assistant should be a **context-aware action bar** — it knows where you are, what you've done, and can do things for you.

## Proposed Redesign

### 1. Make the assistant workspace-aware

Pass the current workspace key, active section, research report, and leads into `PipelineChat`. The system prompt dynamically includes:
- Current workspace domain
- Research status (not started / running / complete)
- Number of leads, personas found
- Active section the user is viewing

### 2. Section-specific smart prompts

Instead of a generic greeting, show **contextual action chips** based on where the user is:

| Section | Chips shown |
|---------|------------|
| Research (empty) | "What does this tool do?" / "Paste a URL for me" |
| Research (complete) | "Summarize findings" / "What verticals look best?" |
| Personas | "Find leads for all personas" / "Which persona has highest ROI?" |
| Leads | "Draft emails for top 5" / "Export leads" / "Find more like these" |

### 3. Give the assistant real actions (tool calls)

Connect the chat to actual functions it can trigger on behalf of the user:
- **Navigate**: Switch the active section (`setActiveSection`)
- **Find leads**: Trigger `handleFindLeads` for a specific persona
- **Draft email**: Open the draft modal for a specific lead
- **Export**: Trigger CSV export
- **Start research**: Kick off research for a domain

The edge function already supports tool calls (`run_lead_search`, `generate_leads`, etc.) — the frontend just needs to wire the callbacks.

### 4. Replace generic system prompt with live context

Instead of `"You are the Xcrow Lead Gen assistant"`, inject:

```
You are the user's lead gen co-pilot.

CURRENT STATE:
- Workspace: {workspaceKey}
- Section: {activeSection}
- Research: {complete/running/not started}
- Personas found: {count} — {list}
- Leads in pipeline: {count}
- Leads without email: {count needing enrichment}

You can take these actions:
- navigate_to(section) — switch view
- find_leads(persona_title) — search Apollo
- draft_email(lead_name) — open email composer
- export_csv() — download leads
- start_research(domain) — begin ICP analysis
```

### 5. Simplify the UI — inline action confirmations

When the assistant proposes an action, render it as a confirmation card (not just text):

```
┌─────────────────────────────┐
│ 🔍 Find leads for "VP Ops"  │
│ in Healthcare vertical       │
│                              │
│  [Do it]    [Adjust]         │
└─────────────────────────────┘
```

## Files to Change

| File | Change |
|------|--------|
| `src/pages/LeadGen.tsx` | Pass workspace context, callbacks, and section state into `PipelineChat`; handle action messages from chat |
| `src/components/leadgen/FloatingChat.tsx` | No structural change needed |
| `supabase/functions/leadgen-chat/index.ts` | Add action tools the assistant can call; update system prompt to accept dynamic context |
| `src/pages/LeadGen.tsx` (PipelineChat) | Rewrite to use contextual chips, dynamic system prompt, and action card rendering |

## What This Achieves

- The assistant becomes a **shortcut layer** — users can type "find leads for healthcare" instead of navigating to Personas → clicking Find Leads
- It provides **proactive suggestions** based on actual state ("You have 12 leads without emails — want me to enrich them?")
- It reduces clicks for power users while still being educational for beginners
- Every interaction drives toward the user's goal: **getting outreach-ready leads**

