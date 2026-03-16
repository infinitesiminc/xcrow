

## Current State

**Database is fully populated:**
- 400 Anthropic jobs imported, all 400 analyzed with `augmented_percent` scores (range 10–64%, avg 42%)
- 3,714 task clusters with `ai_exposure_score` values across 12 departments
- No real employee/simulation data exists (no workspace members, no completed simulations)

**Pages status:**
- `/hr/ats-sync` — Works correctly, shows 400 jobs
- `/hr/simulations` (SimulationBuilder) — Works correctly, shows all 400 jobs with analysis status
- `/hr/score-distributions` — Works correctly with paginated fetch, shows all analyzed jobs
- `/learning-path` — Works correctly, shows task clusters for any selected job
- `/hr/team-progress` — **Broken/empty**: DeploymentFunnel shows all zeros, ExecutiveBrief and DeptScorecard receive empty arrays, no employee data to display

## Plan

The only page that needs work is **Team Progress**. Since there are no real employees, we need to generate mock data **from the actual 400 jobs in the database** (not hardcoded). The approach:

### 1. Rewrite `src/data/demo-team-progress.ts` → fetch-based mock generator

Replace the hardcoded demo data file with a function that:
- Fetches all 400 jobs + their task clusters from the database
- Assigns 1 mock employee per job (deterministic names from a seeded pool)
- Marks ~70% (~280) as "started" with realistic simulation completions
- Generates 1-4 completed simulation records per started employee using real task cluster names from their job
- Produces realistic scores: `tool_awareness_score`, `human_value_add_score`, `adaptive_thinking_score`, `domain_judgment_score` (seeded random, 35-95 range)
- Calculates department-level trends (4-week sparkline data, deltas, weakest pillars)
- Exports `DemoProgressRow[]`, `DemoEmployee[]`, `DeptTrendData[]`, and funnel stats

### 2. Update `src/pages/hr/TeamProgress.tsx`

- Import the new async generator function
- In the main `useEffect`, call it to get mock progress rows, dept trends, and funnel stats
- Pass real dept trends to `ExecutiveBrief` and `DeptScorecard` (currently empty arrays)
- Update `DeploymentFunnel` to accept dynamic funnel stats instead of `EMPTY_FUNNEL`
- Merge mock progress with any real DB progress rows

### 3. Keep existing sub-components unchanged

`ExecutiveBrief`, `DeptScorecard`, `ReadinessPillars`, `AdaptiveInsights`, `Leaderboard`, and `UserDetailSheet` all already work with `ProgressRow[]` and `DeptTrendData[]` — they just need non-empty data.

### Key details

- Mock data is generated client-side from real DB records (no new tables or edge functions needed)
- Deterministic seeded random ensures consistent names/scores across page loads
- Funnel: 400 imported → 400 analyzed → 400 activated → ~280 started
- All department names come from actual `jobs.department` values (Sales, Engineering, AI/Research, etc.)

