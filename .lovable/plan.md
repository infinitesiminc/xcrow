

# Transform /leadgen into AI-Guided ICP Chat

## What We're Building

Replace the current form-based leadgen page with a conversational chat interface where AI guides the user step-by-step through ICP building before running lead discovery. The chat collects context iteratively (business URL, target market, buyer persona, geography) to produce higher-quality search queries.

## Architecture

```text
┌─────────────────────────────────┐
│  /leadgen (Chat UI)             │
│  ┌───────────────────────────┐  │
│  │ AI: "What's your website?"│  │
│  │ User: "example.com"       │  │
│  │ AI: "Who do you sell to?" │  │
│  │ User: "SMB restaurant..." │  │
│  │ AI: "What region?"        │  │
│  │ ...                       │  │
│  │ AI: "Here are 5 leads..." │  │
│  └───────────────────────────┘  │
│  [input bar]                    │
└─────────────────────────────────┘
        │
        ▼ SSE stream
┌─────────────────────────────────┐
│ leadgen-scout edge function     │
│ - Accepts full conversation     │
│ - AI determines next step       │
│ - When ICP is complete:         │
│   scrape → search → extract     │
│ - Streams responses back        │
└─────────────────────────────────┘
```

## Plan

### 1. Create new edge function `leadgen-chat`
- Accepts `{ messages: {role, content}[] }` (full conversation history)
- System prompt instructs AI to act as a lead gen consultant who guides through 4 phases:
  1. **Business Understanding** — ask for website, scrape it, confirm what the business does
  2. **Buyer Persona** — who buys (job titles, company size, industry)
  3. **Targeting** — geography, budget tier, urgency signals
  4. **Confirmation** — summarize ICP, ask user to confirm before searching
- Uses tool calling: when AI decides ICP is complete, it calls a `run_lead_search` tool that triggers the Firecrawl pipeline (reusing existing logic)
- Streams responses via SSE for real-time chat feel
- Returns lead results as a special SSE event `{ type: "leads", leads: [...] }`

### 2. Rewrite `src/pages/Leadgen.tsx` as a chat page
- Full-screen chat layout (similar to existing `HomepageChat` / `UnifiedChatDock` patterns)
- Message list with user/assistant bubbles, markdown rendering for AI responses
- Input bar at bottom with send button
- Initial AI greeting message auto-sent on mount
- When `leads` event arrives, render lead cards inline in the chat
- Keep WhatsApp delivery as an optional action button on the lead cards
- Phone number collected conversationally (AI asks when leads are ready to deliver)

### 3. Keep existing `leadgen-scout` as internal utility
- Extract the scrape → search → extract pipeline into a helper called by `leadgen-chat`
- No changes to Firecrawl logic itself

## Technical Details

**Edge function (`leadgen-chat/index.ts`)**:
- Model: `google/gemini-3-flash-preview` for fast conversational responses
- System prompt encodes the 4-phase ICP flow with clear transition rules
- Tool definition: `run_lead_search(website, icp_summary, search_queries)` — triggered by AI when ready
- On tool call: execute Firecrawl pipeline, return leads as structured SSE event
- Streams all other responses as standard OpenAI-compatible SSE

**Frontend (`Leadgen.tsx`)**:
- State: `messages[]`, `leads[]`, `isStreaming`
- SSE parsing reuses existing patterns from `ChatContext.tsx`
- Lead cards rendered inline with contact details + WhatsApp send button
- No authentication required (public access)

