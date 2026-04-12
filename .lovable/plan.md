

## Plan: Slim Top Bar for Research & Personas

**Goal**: Replace the full-height Research Summary, Company Overview, Personas cards, and Target Domains with a single compact bar. Details expand in a drawer/popover on click.

### Current Problem
After research completes, ~600px of vertical space is consumed by the summary card, company overview, persona cards, and target domains — pushing the leads table below the fold.

### Design

```text
┌──────────────────────────────────────────────────────┐
│ 🔬 maquoketa.net  │ 2 personas │ 3 competitors │ 7 targets │ 00:30s │ [▾ Details] │
└──────────────────────────────────────────────────────┘
│                                                      │
│              LEADS TABLE (full height)               │
│                                                      │
```

- **Single bar** (~40px) shows: domain, persona count, competitor count, target count, elapsed time, and a "Details" toggle.
- **Persona quick-actions**: Each persona rendered as a small pill/chip inside the bar with a "Find Leads" button on hover/click.
- **Expand drawer**: Clicking "Details" opens a Sheet/Drawer from the right (or a collapsible panel below the bar) showing the full Company Overview, Competitors, Personas with pain points/triggers, and Target Domains — identical to current content.

### Files to Change

1. **`src/components/leadgen/ResearchBar.tsx`** (NEW)
   - Compact horizontal bar component replacing `ResearchSummaryCard` + `PersonasSection` in the post-research state.
   - Contains persona chips with "Find Leads" action inline.
   - "Details" button opens a `Sheet` with the full research report.

2. **`src/pages/LeadGen.tsx`**
   - Replace the `showResearchSummary` block and the personas block with the new `ResearchBar`.
   - The `ResearchSection` (input + progress) remains as-is for the initial/running state.
   - After research completes: render `ResearchBar` + `LeadsTableSection` only.

3. **`src/components/leadgen/PersonasSection.tsx`**
   - Keep the component but it will now only render inside the details drawer, not inline on the dashboard.

4. **`src/components/leadgen/ResearchSummaryCard.tsx`**
   - Content moves into the details drawer. The top-level collapsible bar is replaced by `ResearchBar`.

### Behavior
- Research running → show `ResearchSection` (input + phases) as today
- Research complete → show slim `ResearchBar` (one line) + leads table gets full remaining height
- Click "Details" on bar → Sheet slides in with full report, personas, competitors, domains
- Click persona chip "Find Leads" → triggers `onFindLeads` as today (opens chat)

