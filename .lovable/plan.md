

## Vertical Opportunity Scorecard

### Problem
Users see individual company cards and sub-vertical whitespace pills, but there's no vertical-level summary that answers: **"Which vertical has the best AI-native opportunity right now?"** The data exists but isn't synthesized.

### Available Signals (no new data needed)
From `company_vertical_map` + enriched metrics already in the database:

| Signal | Source | What it tells you |
|--------|--------|-------------------|
| Open sub-verticals | whitespace counts | Niches with zero disruptors |
| Disruptor funding stage | `estimated_funding` | Are existing challengers early or scaled? |
| Disruptor ARR | `estimated_arr` | Revenue traction of challengers |
| Disruptor headcount | `estimated_employees` | Team size signals maturity |
| Incumbent density | incumbent count | Size of the market to attack |
| Incumbent age/status | hardcoded data | Older/public = more vulnerable |

### Approach: Vertical Summary Cards

Add a **collapsible scorecard** at the top of each vertical section that synthesizes these signals into a readable opportunity snapshot:

```text
┌─────────────────────────────────────────────────────┐
│ 🏢 CRM & Sales                    Score: ██████░░ 7/10 │
│                                                       │
│ 🟢 3 open niches  🟡 2 low-comp  🔴 2 crowded       │
│ 🏛️ 12 incumbents  ⚔️ 8 disruptors (avg: Seed-A)    │
│ 💰 Avg disruptor ARR: <$5M  👥 Avg: 10-50           │
│                                                       │
│ Verdict: Early-stage disruptors, many open niches.   │
│ Strong opportunity for AI-native entry.               │
└─────────────────────────────────────────────────────┘
```

### Opportunity Score Formula
Computed from existing data, no AI calls:

1. **Whitespace ratio** (0-4): `openNiches / totalNiches * 4`
2. **Disruptor immaturity** (0-3): Lower avg funding/employees = higher score (early = opportunity)
3. **Market size** (0-3): More incumbents = bigger market to attack

Total: 0-10 scale, displayed as a simple bar.

### Plan

#### 1. Extend `useVerticalMap` hook with vertical-level opportunity metrics
- Aggregate disruptor funding/ARR/employee signals per vertical
- Compute avg disruptor maturity (parse strings like "$5M", "10-50" into ordinal buckets)
- Compute opportunity score per vertical
- Add to `VerticalStats` interface

#### 2. Add Vertical Opportunity Summary card in Disrupt browse view
- Compact card between vertical header and sub-vertical pills
- Shows: open niche count, disruptor maturity summary, incumbent count, opportunity score bar
- One-line "verdict" text generated from the score components
- Clickable to expand/collapse details

#### 3. Sort verticals by opportunity score when Whitespace toggle is on
- Currently verticals sort by ID; with whitespace mode, sort by opportunity score descending
- Highest-opportunity verticals float to top

### Technical Details

**Hook** (`src/hooks/use-vertical-map.ts`):
- Add `opportunityScore: number` and `disruptorMaturity: { avgFunding: string; avgSize: string; count: number }` to `VerticalStats`
- Parse `estimated_funding` strings into ordinal: Seed=1, A=2, B=3, C+=4, Public=5
- Parse `estimated_employees` into ordinal: 1-10=1, 10-50=2, 50-200=3, 200+=4
- Compute weighted score

**UI** (`src/pages/Disrupt.tsx`):
- New inline `OpportunityCard` component (~40 lines)
- Modify whitespace sort to use opportunity score
- No new files, no database changes, no edge functions

