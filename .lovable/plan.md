

# Two-Column Discovery + Briefing Redesign

## What Changes

Merge **Discovery Chat** and **Briefing Chat** into a single unified **AI Strategist Chat** with a two-column layout: chat on the left, dynamic context cards on the right. The right panel updates based on conversation state — showing industry overview cards initially, then company intel cards once a target is selected.

## Layout

```text
┌──────────────────────────────────────────────────────┐
│  Left Column (55%)         │  Right Column (45%)      │
│  ┌──────────────────────┐  │  ┌────────────────────┐  │
│  │ AI Strategist Chat   │  │  │ Context Panel      │  │
│  │                      │  │  │                    │  │
│  │ Streaming chat with  │  │  │ Phase 1: Industry  │  │
│  │ single persistent    │  │  │ suggestion cards   │  │
│  │ conversation         │  │  │                    │  │
│  │                      │  │  │ Phase 2: Company   │  │
│  │                      │  │  │ intel cards once   │  │
│  │                      │  │  │ target selected    │  │
│  │                      │  │  │                    │  │
│  │ [Input bar]          │  │  │ [Launch Sim CTA]   │  │
│  └──────────────────────┘  │  └────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

On mobile: stacks vertically (chat on top, context panel collapses to a sticky bottom sheet).

## Right Panel Context Cards

**Before target selected (discovery phase):**
- Quick industry cluster cards (clickable grid of 22 clusters)
- "Trending targets" card showing 3-4 hot incumbents
- Quick prompt chips

**After target selected (briefing phase):**
- **Company Overview Card** — Name, age, industry, disruption vector badge
- **Business Model Card** — Revenue model, key metrics (from AI briefing data + static data)
- **Vulnerability Card** — Why this company is prone to disruption
- **AI Opportunity Card** — The asymmetric angle and beachhead niche
- **7-Act Journey Preview Card** — Visual act rail showing what's ahead
- **Alternative Targets Strip** — Switch to other companies in same cluster
- **"Launch Simulation" CTA button**

## Flow Changes

1. Remove separate `discovery` and `briefing` phases — merge into single `strategist` phase
2. Single chat thread throughout: user explores interests → AI suggests targets → user picks one → AI auto-generates briefing intel → context cards populate on right
3. When AI mentions a company, parse `[SELECT:ID:Name]` markers and render selection buttons in chat AND highlight matching card on right panel
4. Once target confirmed, right panel transitions from industry cards to company intel cards
5. "Launch Simulation" button appears on right panel only after briefing content loads

## Files Modified

1. **`src/pages/Disrupt.tsx`**
   - Replace `discovery` + `briefing` phases with single `strategist` phase
   - Remove `BriefingChat` and `DiscoveryChat` components
   - Add new `StrategistView` component with two-column ResizablePanelGroup layout
   - Add `ContextPanel` component that renders different card sets based on state
   - Merge discovery/briefing message state into single `strategistMessages`
   - When user selects target via `[SELECT:ID:Name]`, auto-trigger briefing content fetch and populate right panel cards
   - Single `sendStrategistMessage` function that routes to `discovery` or `briefing` action based on whether a target is selected

2. **No edge function changes** — reuses existing `discovery` and `briefing` actions as-is

## Technical Details

- Two-column uses `ResizablePanelGroup` (already in project) with `direction="horizontal"`
- Right panel cards use existing `Card`, `Badge`, `ScrollArea` components
- Company data cards are populated from static `DisruptionIncumbent` fields (vulnerability, asymmetricAngle, beachheadNiche, etc.) — no extra AI call needed for basic intel
- AI briefing response is parsed into sections and displayed as cards using markdown section headers as delimiters
- Mobile breakpoint (`< 768px`): single column with context as collapsible section above input

