

# Preconfigured Quick-Action Buttons in Chat

## Problem
Currently, the chat panel requires users to type everything manually. The strategy strip has pills but they're disconnected from the chat. Users must know what to type.

## Solution
Replace the empty chat state with **contextual quick-action buttons** derived from the ICP data. These are clickable chips that auto-send a pre-built prompt into the chat, triggering lead generation with zero typing.

```text
┌─────────────────────────┐
│ AI Strategy Chat        │
├─────────────────────────┤
│                         │
│  Quick actions:         │
│                         │
│  📍 Locations           │
│  [New York] [London]    │
│  [San Francisco] [+]    │
│                         │
│  🎯 Verticals           │
│  [Healthcare] [Fintech] │
│  [Manufacturing]        │
│                         │
│  👤 Personas            │
│  [VP Sales] [CTO]       │
│  [Head of Ops]          │
│                         │
│  🔫 Strategies          │
│  [Competitor customers] │
│  [Lookalike companies]  │
│  [Upload brochure]      │
│                         │
├─────────────────────────┤
│ [📎] [Ask anything...] [→]│
└─────────────────────────┘
```

Clicking a chip (e.g. "Healthcare") auto-sends: `"Find 5 decision makers in the Healthcare vertical"` — no typing needed. Multi-select chips combine: clicking "Healthcare" then "New York" sends `"Find 5 decision makers in Healthcare vertical in New York"`.

## Changes

### 1. `src/components/academy/StrategyChat.tsx`
- Accept new props: `treeData: GTMTreeData` (to extract verticals, personas, competitors)
- Add state for selected quick-actions: `selectedQuickActions: Record<string, string[]>`
- When no messages exist, render grouped quick-action chips instead of placeholder text
- **Location group**: Pre-populate with common cities + a custom text input chip
- **Vertical group**: Pulled from `treeData.mappings` unique verticals
- **Persona group**: Pulled from `treeData.mappings` DM roles
- **Strategy group**: Static options — "Competitor's customers", "Lookalike discovery", "Upload brochure"
- Clicking a chip toggles it (multi-select within group, single-select across some groups)
- A floating "Generate leads →" button appears when any chip is selected
- Clicking Generate auto-composes a natural language prompt from selections and sends it as a user message
- After first message sent, chips collapse into a thin re-expandable row

### 2. `src/components/academy/CompanyExplorer.tsx`
- Pass `treeData` to `StrategyChat` component

### 3. `src/components/academy/StrategyStrip.tsx`
- Keep as-is for product selection in the top strip
- Strategy cards remain but now mirror chat quick-actions (clicking a strip card also activates in chat)

## Interaction Flow
1. User sees ICP framework → clicks "Define strategy"
2. Chat panel shows categorized quick-action chips
3. User taps [Healthcare] + [New York] + [VP Sales]
4. Clicks "Generate 5 leads →"
5. System auto-sends: "Find 5 Healthcare decision makers (VP Sales level) in New York"
6. Chat streams response, leads appear in right panel
7. Chips collapse; user can expand again or type freely for refinement

