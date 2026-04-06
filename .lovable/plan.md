
# AI Lead Strategist: Guided Conversation with Pill Suggestions

## Problem
The chat AI currently responds with generic text ("Adjust your strategy cards and hit Generate") — it doesn't guide users toward actionable lead gen criteria. Users have to know what to ask.

## Solution
Redesign the AI's role as a **Lead Strategist** that proactively guides users through a decision tree using clickable pill suggestions. The AI drives the conversation, not the user.

## AI Persona & System Prompt

**Role**: You are a B2B lead generation strategist. Your job is to help the user define exactly who to target.

**Behavior**:
1. **Open with a strategic question** — not "how can I help?" but a specific first question based on the ICP data already analyzed
2. **One decision per message** — each AI response asks ONE question with 2-4 clickable options
3. **Build criteria incrementally** — each answer narrows the search, AI confirms and asks the next dimension
4. **End with a generate action** — once enough criteria are set, AI suggests generating leads

## Conversation Flow Example

```
AI: "I found 4 verticals for Mobile Notary Services. 
     Which market do you want to target first?"
     [Real Estate] [Legal Services] [Healthcare] [Insurance]

User clicks: [Real Estate]

AI: "Great — Real Estate it is. What seniority level?"
     [C-Suite] [VP/Director] [Manager] [All levels]

User clicks: [VP/Director]

AI: "Any geographic focus?"
     [New York] [San Francisco] [Chicago] [No preference]

User clicks: [No preference]

AI: "Perfect. Ready to find Real Estate VPs/Directors 
     who need notary services?"
     [🔍 Generate 5 leads] [Refine more]
```

## Technical Changes

### 1. `src/components/academy/StrategyChat.tsx`
- **New system prompt** with lead strategist persona + ICP context injected
- **Parse AI responses for pill suggestions** — AI returns structured format: text + options in `[[option1|option2|option3]]` syntax
- **Render pills as clickable buttons** below each AI message
- **Clicking a pill** sends it as user message (no typing needed)
- **"Generate" pill** triggers `onGenerate` callback passed from parent
- **Auto-send opening message** on mount — AI initiates the conversation
- Keep free-text input available for power users

### 2. `src/components/academy/CompanyExplorer.tsx`
- Pass `onGenerateLeads` callback to StrategyChat
- When AI conversation concludes with generate action, trigger lead gen with accumulated criteria

### 3. Edge function `leadgen-chat`
- Update system prompt to enforce the guided format
- AI must end each response with `[[Option A|Option B|Option C]]` for clickable options
- AI must use ICP data (verticals, personas, products) to generate relevant options

## Pill Rendering Logic
```
AI response: "Which vertical?\n[[Real Estate|Legal|Healthcare]]"
→ Parse: { text: "Which vertical?", pills: ["Real Estate", "Legal", "Healthcare"] }
→ Render: text bubble + row of clickable pill buttons below
```
