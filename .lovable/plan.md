
## Plan: Interactive Niche Funnel Map

### Concept
Replace the narrow sidebar with a **full-width funnel flowchart** that visualizes the ICP discovery journey as a top-down drill-down:

```
┌─────────────────────────────────────────────────────┐
│  YOUR MARKET                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ 3PL &    │  │ E-comm & │  │ Industrial│           │
│  │ Logistics│  │ DTC      │  │ & Mfg    │           │
│  └────┬─────┘  └──────────┘  └──────────┘           │
│       │                                              │
│  ┌────▼──────────────────────────┐                   │
│  │ Mid-Market 3PLs               │  ← selected      │
│  │ 12 leads · [Find More] [Enrich]│                  │
│  └────┬──────────────────────────┘                   │
│       │                                              │
│  ┌────▼─────┐  ┌──────────┐  ┌──────────┐           │
│  │ Ops      │  │ Tech     │  │ C-Suite  │           │
│  │ Leaders  │  │ Buyers   │  │ Sponsors │           │
│  └──────────┘  └──────────┘  └──────────┘           │
├─────────────────────────────────────────────────────┤
│  Pipeline / Activity tabs (filtered to active niche) │
└─────────────────────────────────────────────────────┘
```

### How It Works
1. **Level 1 — Industry Verticals**: Top row shows root niches as clickable cards
2. **Level 2 — Segments**: Clicking a vertical expands its child niches below
3. **Level 3 — Personas**: Clicking a segment shows persona-level targeting
4. Each card shows: name, description snippet, lead count badge, and quick-action buttons
5. Clicking a card both selects it as active niche (filtering pipeline below) AND can trigger "Find Leads" directly
6. Connected by animated SVG lines showing the funnel path
7. Breadcrumb trail at top: "All → 3PL & Logistics → Mid-Market 3PLs"

### Layout Change
- Remove `NicheSidebar` from the left column
- The funnel map becomes the **top section** of `LeadgenDashboard`, above pipeline tabs
- Pipeline below fills remaining height
- Chat FAB stays bottom-right

### New Component
- `src/components/leadgen/NicheFunnelMap.tsx` — the interactive funnel visualization

### Files to Edit
- `src/components/leadgen/NicheFunnelMap.tsx` — new file
- `src/components/leadgen/LeadgenDashboard.tsx` — embed funnel map, remove sidebar dependency
- `src/pages/Leadgen.tsx` — remove NicheSidebar, pass full width to dashboard
