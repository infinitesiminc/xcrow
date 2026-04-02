

## Plan: Redesign Leadgen Layout for Better E2E Flow

### Current Problems
From the screenshot: the NicheSidebar is narrow (224px) causing text truncation, the ICP action card is buried at the bottom and gets cut off, and the floating chat dock overlaps the sidebar. The overall flow feels cramped and disconnected.

### User E2E Flow

```text
┌──────────────────────────────────────────────────────────┐
│ Navbar                                                   │
├──────┬───────────────────────────────────────────────────┤
│Niche │  ICP Action Bar (when niche selected)             │
│Tree  │  ┌─────────────────────────────────────────────┐  │
│      │  │ "Mid-Market 3PLs" · 12 leads                │  │
│ All  │  │ [Find Leads] [Enrich] [Score] [Draft] [CSV] │  │
│ 3PL  │  └─────────────────────────────────────────────┘  │
│ DTC  │───────────────────────────────────────────────────│
│ Med  │  Pipeline / Activity tabs                         │
│ ...  │  ┌────────┬────────┬─────────┬─────────┐         │
│      │  │  New   │Contact │Qualified│  Won    │         │
│      │  │ cards  │ cards  │ cards   │ cards   │         │
│      │  └────────┴────────┴─────────┴─────────┘         │
├──────┴───────────────────────────────────────────────────┤
│  [💬 Chat FAB — bottom-right]                            │
└──────────────────────────────────────────────────────────┘
```

### Changes

**1. Move ICP Action Card out of sidebar → inline toolbar in main content area**
- Remove `ICPActionCard` from inside `NicheSidebar`'s ScrollArea
- Add an ICP Action Bar at the top of `LeadgenDashboard` (horizontal strip) that shows when a niche is selected
- Displays: niche name, description, lead count, then horizontal button row (Find Leads, Enrich, Score, Draft, Export)
- This gives the buttons full width and visibility

**2. Slim down NicheSidebar to pure navigation**
- Remove ICP action card rendering from sidebar
- Remove all action handler props (`onFindLeads`, `onEnrichLeads`, etc.) from `NicheSidebar`
- Keep tree structure, collapsed mode, niche selection — that's it
- Width stays at `w-56` but content no longer overflows

**3. Move FAB to bottom-right**
- Change floating chat button from `left-6` → `right-6` and chat panel from `left-4` → `right-4`
- Prevents overlap with the niche sidebar

**4. Pass ICP actions to LeadgenDashboard**
- `LeadgenDashboard` receives the active niche info + action handlers
- Renders the horizontal ICP bar above the tabs when a niche is active

### Files to Edit
- `src/components/leadgen/NicheSidebar.tsx` — remove ICP card, remove action props
- `src/components/leadgen/LeadgenDashboard.tsx` — add ICP action bar at top
- `src/pages/Leadgen.tsx` — rewire props, move FAB to right side

