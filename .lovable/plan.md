

## Public Anthropic Case Study with Guided Demo Walkthrough

### What we're building

A new public page at `/case-study/anthropic` (no auth required) that walks visitors through the platform's end-to-end value using real Anthropic data. It follows a B2B product-led growth pattern: a multi-step guided tour with read-only snapshots of each platform phase (Diagnose, Upskill, Plan), ending with a CTA to book a demo or sign up.

### Architecture

```text
/case-study/anthropic (public, no auth)
┌─────────────────────────────────────┐
│  Hero: "See how Anthropic maps      │
│  AI readiness across 200+ roles"    │
│  [Start the Tour]                   │
└─────────────────────────────────────┘
         ↓ step-by-step guided flow
┌─────────────────────────────────────┐
│ Step 1: ATS Import                  │
│  → Static snapshot of Anthropic     │
│    roles grouped by department      │
│                                     │
│ Step 2: AI Exposure Map             │
│  → Read-only heatmap / score dist   │
│    using real Anthropic job data     │
│                                     │
│ Step 3: Task-Level Drill-down       │
│  → Example role with task breakdown │
│    and AI exposure scores           │
│                                     │
│ Step 4: Simulation Preview          │
│  → Sample simulation question       │
│    with scoring pillars explained   │
│                                     │
│ Step 5: Team Progress Dashboard     │
│  → Mock executive brief with demo   │
│    readiness data                   │
│                                     │
│ Step 6: Action Center               │
│  → Bottleneck tasks + coaching view │
│                                     │
│ CTA: Book a Demo / Try Free         │
└─────────────────────────────────────┘
```

### Implementation plan

1. **Create `src/pages/CaseStudy.tsx`** -- A single-page guided walkthrough component with:
   - A stepper/progress bar at the top (step 1 of 6)
   - Each step renders a self-contained "snapshot" card with a title, narrative text, and a read-only visualization
   - Navigation: Back / Next buttons, plus a step indicator
   - Final step has CTA buttons (Book a Demo, Sign Up)
   - Uses `framer-motion` for step transitions (consistent with Enterprise page)
   - No authentication required -- all data is either fetched from public Anthropic jobs in the DB or hardcoded demo snapshots

2. **Create snapshot sub-components** in `src/components/case-study/`:
   - `StepATSImport.tsx` -- Fetch Anthropic jobs from DB (public read), show department grouping
   - `StepExposureMap.tsx` -- Reuse `bucketize` logic from ScoreDistributions, render read-only bar charts
   - `StepTaskDrilldown.tsx` -- Fetch one example role's `job_task_clusters`, show task table
   - `StepSimPreview.tsx` -- Static mockup of a simulation question with pillar scoring
   - `StepTeamProgress.tsx` -- Hardcoded demo data mirroring the executive brief view
   - `StepActionCenter.tsx` -- Hardcoded bottleneck tasks and coaching preview

3. **Add route** in `App.tsx`: `/case-study/anthropic` with Navbar + Footer, no auth guard

4. **Add navigation link** -- Add "See Case Study" button on the Enterprise landing page in the hero or proof points section

5. **RLS consideration** -- The `companies` and `jobs` tables likely already allow public reads or we query via the edge function. If RLS blocks unauthenticated reads, we add a read-only policy for rows where `company.name = 'Anthropic'`.

### Key design decisions
- **No auth wall** -- the entire point is public lead generation
- **Real data where possible** (Anthropic jobs from DB), demo data for employee-level views
- **Step-by-step modal/page flow** rather than a long scroll -- creates engagement and mirrors the actual product experience
- **Each step has context text** explaining what the HR admin would do at this stage, making it educational

