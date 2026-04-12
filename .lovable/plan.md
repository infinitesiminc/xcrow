

## Plan: Consolidate LeadGen into Single-Screen Dashboard + Docked Chat

### What changes

Replace the current tab-switching layout (Research → Personas → Leads as separate views) with a single scrollable dashboard showing all content simultaneously, with a permanently docked chat panel on the right.

### Layout structure

```text
┌─────────────┬──────────────────────────────┬──────────────────┐
│  Sidebar    │  Main Dashboard (scrollable) │  Docked Chat     │
│  (workspaces│                              │  (always visible) │
│   + nav)    │  ┌─ Company Summary ───────┐ │                  │
│             │  │ Maquoketa Research...    │ │  AI Co-pilot     │
│             │  └─────────────────────────┘ │                  │
│             │  ┌─ Personas (cards row) ──┐ │  [messages]      │
│             │  │ Special Ops │ ISR & Sur │ │                  │
│             │  └─────────────────────────┘ │                  │
│             │  ┌─ Leads Table ───────────┐ │                  │
│             │  │ Name │ Title │ Company  │ │  [input box]     │
│             │  └─────────────────────────┘ │                  │
└─────────────┴──────────────────────────────┴──────────────────┘
```

### Files to modify

1. **`src/pages/LeadGen.tsx`** — Remove `activeSection` tab switching and `renderSection()`. Render all three sections (research/personas/leads) vertically in a single scrollable column. Replace `FloatingChat` with a docked right panel (`w-80 border-l`) that is always visible on desktop, collapsible on mobile.

2. **`src/components/leadgen/ResearchSection.tsx`** — Make it work inline: when research is complete, collapse to a compact summary card (company name + status). When not started or running, show the domain input + streaming phases as today.

3. **`src/components/leadgen/PersonasSection.tsx`** — Render as a horizontal card row instead of a grid, more compact for inline display. "Find Leads" button still opens chat-first discovery.

4. **`src/components/leadgen/LeadsTableSection.tsx`** — Render inline below personas. Show empty state with prompt to use chat when no leads exist.

5. **`src/components/leadgen/FloatingChat.tsx`** — Remove floating bubble/overlay. Convert to a simple docked panel component that takes full height of the right column. On mobile, switch to a bottom sheet or full-screen overlay triggered by a FAB.

6. **`src/components/leadgen/LeadGenSidebar.tsx`** — Simplify: remove Pipeline nav items (Research/Personas/Leads) since they're no longer separate views. Keep only workspace list + settings. Optionally add anchor-scroll links.

### Key behaviors

- **Research phase**: Domain input + streaming phases visible in main column. Chat docked on right shows welcome message.
- **Research complete**: Summary card collapses, personas appear below, chat auto-greets with context.
- **Find Leads**: Button on persona card opens discovery conversation in docked chat. Results appear in leads table below in real-time.
- **Mobile**: Chat becomes a floating overlay (current behavior). Dashboard stacks vertically.
- **No section switching needed** — everything scrolls naturally, chat provides the interactive layer.

### What stays the same

- Workspace management in sidebar
- Chat-first discovery flow and system prompt
- All edge functions unchanged
- DraftEmailModal unchanged
- LeadsCRUD hook unchanged

