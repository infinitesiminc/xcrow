

# Layout Redesign: Horizontal Strip + Chat/Leads Split

## New Layout Structure

```text
┌──────────────────────────────────────────────────────┐
│ Header (company name, back button, progress)         │
├──────────────────────────────────────────────────────┤
│ TOP STRIP — horizontal scroll                        │
│ [Product1] [Product2] | [Location] [Vertical] ...    │
│ (product cards left, strategy cards right, scrollable)│
├──────────────────────────────────────────────────────┤
│ LEFT (narrow ~320px)  │  RIGHT (flex-1, wide)        │
│                       │                              │
│ AI Chat Panel         │  Lead List                   │
│ - messages            │  - vertical filter chips     │
│ - file upload         │  - search bar                │
│ - text input          │  - lead cards (scrollable)   │
│                       │  - pagination                │
│                       │  - +5 more button            │
└──────────────────────────────────────────────────────┘
```

## Changes

### 1. `GTMTreeView.tsx` — Full-mode layout restructure
- Remove the current 2-column (Products | Leads) layout in full mode
- Replace with:
  - **Top horizontal strip**: A single scrollable row containing product selector cards on the left and strategy cards on the right, separated by a divider. Products are small selectable chips; strategy cards are the existing toggle cards but rendered inline horizontally.
  - **Bottom split**: Left narrow panel (chat) + right wide panel (leads list with vertical filters, search, pagination)
- Strategy cards + chat input move INTO GTMTreeView (or GTMTreeView accepts them as children/slots)
- The framework-only mode keeps existing layout (no leads, no chat)

### 2. `CompanyExplorer.tsx` — Merge strategy into explore phase
- In `explore` phase, pass strategy state and chat into GTMTreeView instead of rendering them separately
- The `strategy-chat` phase merges into the explore view — no separate phase needed after first batch
- Pass `StrategyChatPanel`-like functionality as props or render it as a child component within the left panel

### 3. `StrategyChatPanel.tsx` — Refactor into two pieces
- **Strategy cards**: Extract into a separate horizontal strip component (or inline render in GTMTreeView top strip)
- **Chat panel**: Keep as a standalone narrow chat component for the left column
- Both share state via props lifted to CompanyExplorer

### Files to modify
- `src/components/academy/GTMTreeView.tsx` — Major layout rewrite for full mode
- `src/components/academy/CompanyExplorer.tsx` — Wire strategy + chat into explore phase
- `src/components/academy/StrategyChatPanel.tsx` — Split into strip cards + chat column

