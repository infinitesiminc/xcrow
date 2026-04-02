

# ICP Map UI — Evaluated Against Full E2E Workflow

## The User Journey (E2E)

```text
Step 1: DISCOVER — Enter website URL → AI maps ICP tree (verticals → segments → personas)
Step 2: ORIENT   — See the full ICP structure, understand "who are my ideal buyers?"
Step 3: SELECT   — Pick a niche node to focus on
Step 4: ACT      — Find leads / Enrich / Score / Draft outreach for that node
Step 5: MANAGE   — Pipeline tab: view leads, update status, draft emails
Step 6: ITERATE  — Switch to a different niche node, repeat steps 3-5
```

## How Each Option Serves This Workflow

### Option A — Vertical Tree (Org-chart)
- **Step 2 (Orient)**: Excellent — spatial layout makes hierarchy instantly clear
- **Step 3 (Select)**: Good — click any node
- **Step 4 (Act)**: Awkward — action buttons need to float near the selected node or live in a separate bar, breaking the spatial layout
- **Step 6 (Iterate)**: Poor — wide trees force horizontal scrolling; jumping between distant nodes is slow
- **Verdict**: Beautiful for presentation, poor for repeated daily use

### Option B — Indented Tree List
- **Step 2 (Orient)**: Good — hierarchy is clear via indentation, all visible at once
- **Step 3 (Select)**: Excellent — single click, instant highlight
- **Step 4 (Act)**: Excellent — action buttons can appear inline or in a right panel; the compact list leaves room for the pipeline below
- **Step 6 (Iterate)**: Excellent — switching nodes is a single click, no scrolling. Collapse branches you're done with
- **Verdict**: Best for the workflow. Fast, compact, leaves maximum space for the pipeline/activity tabs that follow

### Option C — Horizontal Sankey
- **Step 2 (Orient)**: Beautiful but overwhelming with many nodes
- **Step 3-4 (Select/Act)**: Clunky — selecting a "band" isn't as precise as clicking a node
- **Step 6 (Iterate)**: Slow — visual complexity grows linearly with niches
- **Verdict**: Data-viz showpiece, wrong tool for an action-oriented workflow

### Option D — Nested Cards Grid (fully expanded)
- **Step 2 (Orient)**: Decent — all cards visible, but parent-child relationships blur across rows
- **Step 3-4 (Select/Act)**: Same as current, just all shown at once
- **Step 6 (Iterate)**: Better than current (no progressive reveal) but still noisy
- **Verdict**: Incremental improvement, doesn't solve the core clarity problem

## Recommendation: Option B — Indented Tree List

It wins on every step that matters for repeated daily use:
- Fastest node switching (Step 6 — the most frequent action)
- Most screen-efficient (leaves room for Pipeline/Activity below)
- Clearest hierarchy (Step 2)
- Natural home for action buttons (Step 4)

## Implementation Plan

**Single file change**: `src/components/leadgen/NicheFunnelMap.tsx` (full rewrite of rendering, keep tree-building logic)

### What changes
1. Replace the layered card grid + connector SVG with an indented tree list
2. Each node shows: indent marker, label, lead count badge, and expand/collapse chevron
3. Clicking a node selects it (highlights it, filters pipeline below)
4. Action buttons (Find Leads, Enrich, Score, Draft, Export) appear in a compact bar below the selected node
5. "All Niches" button at top to clear selection
6. Layer type icons (Building, Target, Users) shown inline as small colored icons before labels
7. Expand/collapse all toggle in the header

### Layout
```text
┌─────────────────────────────────────────┐
│ 🔽 Expand All          All Niches (47) │  ← header
├─────────────────────────────────────────┤
│ ▼ 🏢 Fintech                    12     │
│   ▼ 🎯 Neobanks                  5     │
│     • 👤 CTO / VP Engineering    3     │  ← selected
│     ├─ [Find] [Enrich] [Draft]  ───────│  ← action bar
│     • 👤 Head of Product         2     │
│   ▶ 🎯 Crypto Exchanges          4     │
│   ▶ 🎯 Insurtech                 3     │
│ ▶ 🏢 Healthcare                  8     │
│ ▶ 🏢 SaaS Infra                 15     │
├─────────────────────────────────────────┤
│ Pipeline │ Activity                     │  ← existing tabs
│ [lead rows filtered to selected node]   │
└─────────────────────────────────────────┘
```

### Files affected

| File | Action |
|------|--------|
| `src/components/leadgen/NicheFunnelMap.tsx` | Rewrite rendering to indented tree list |

No other files change — the component's props interface stays identical.

