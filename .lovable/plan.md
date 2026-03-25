
# Three-Act User Journey + Calibrated Matching Algorithm

## Architecture: Three Acts

```
ACT 1: UPSKILL (Skill Forge + Map)     → Practice skills via sims
ACT 2: SCOUT (New tab)                  → Discover jobs ranked by fit
ACT 3: CAMPAIGN (New tab)               → Track applications + portfolio
```

Tab bar: `Skill Forge | Scout | Campaign | Codex | Allies`

---

## Calibrated Matching Algorithm

### Data Reality (verified via DB queries)

| Metric | Value | Implication |
|--------|-------|-------------|
| Total jobs | 21,698 | Large pool |
| Jobs with task clusters + skill_names | 3,870 | **Primary matching surface** |
| Jobs with canonical_skill_id links | 392 | Too sparse alone |
| Avg skills per task cluster | 3.07 | Decent gradient |
| Earned skill_ids that match canonical IDs directly | 20/39 | **51% direct match rate** |
| Earned skill_ids that are generic categories | 19/39 | Need manual mapping |
| Jobs with department data | 16,973 (78%) | Good secondary signal |
| Jobs with company_id | 21,405 (99%) | Good for familiarity signal |

### Three Matching Layers

#### Layer 1: Skill ID Resolution (User → Canonical)

User's `completed_simulations.skills_earned[].skill_id` falls into two buckets:

**Bucket A — Direct canonical match (20 IDs):**
These skill_ids ARE canonical_future_skills.id values. Direct lookup, no fuzzy matching.
Examples: `ai-assessment-oversight`, `ethical-ai-alignment`, `strategic-analytical-thinking`

**Bucket B — Generic category IDs (19 IDs) requiring a static mapping:**
```
code-dev          → ["AI Code Review", "AI Code Audit & Optimization", "Algorithm Development"]
data-analysis     → ["Critical Data Analysis", "Data Architecture Design", "Data Integrity Management"]
team-mgmt         → ["AI Collaboration Management", "AI-Human Teaming & Collaboration"]
testing-qa        → ["Test Strategy", "AI Model Auditing & Validation"]
strategy          → ["Strategic Planning", "Strategic Analytical Thinking", "Strategic Oversight & Innovation"]
design-ux         → ["Interaction Design for AI Products", "Creative Direction & Innovation"]
system-design     → ["Distributed Systems Architecture", "AI Agent Architecture & Orchestration"]
writing-docs      → ["AI Content Strategy & Governance", "AI Content Curation & Editing"]
ai-ml             → ["AI Framework Expertise", "AI Tool Integration & Mastery"]
critical-thinking → ["Strategic Problem Solving", "Critical AI Evaluation", "Critical Systems Evaluation & Thinking"]
financial-modeling→ ["Financial Narrative Crafting", "Proactive Cost Optimization", "Performance Modeling & Optimization"]
sales             → ["AI-Enhanced Negotiation & Ethics", "Complex Deal Negotiation", "Consultative Communication"]
stakeholder-mgmt  → ["Stakeholder Communication", "Stakeholder Empathy in the AI Age"]
risk-assessment   → ["AI Risk & Compliance Assessment", "Predictive Risk Assessment"]
regulatory        → ["Compliance Strategy", "Policy-Tech Translation"]
research          → ["Ethical AI Research", "Trend Forecasting"]
presentation      → ["Consultative Communication", "Creative Direction & Innovation"]
devops            → ["Distributed Systems Architecture", "Performance Modeling & Optimization"]
vendor-mgmt       → ["AI Vendor Evaluation", "Complex Deal Negotiation"]
```

This static map lives in `src/lib/skill-id-map.ts`. It maps each generic skill_id to an array of canonical_future_skills.id values.

**Resolution function:** For a user, collect all `skills_earned` across their `completed_simulations`, then:
1. If skill_id exists in `canonical_future_skills.id` → add directly
2. If skill_id is in the static map → add all mapped canonical IDs
3. Result: `Set<canonical_skill_id>` representing user's proven skills

#### Layer 2: Job Skill Resolution (Job → Canonical)

For each job, determine which canonical skills it requires:

**Path A — Direct canonical links (392 jobs):**
`job_future_skills WHERE canonical_skill_id IS NOT NULL` → direct lookup

**Path B — Fuzzy match from task cluster skill_names (3,870 jobs):**
`job_task_clusters.skill_names[]` fuzzy-matched against `canonical_future_skills.name`

Matching rules (tested against real data):
- Exact match (case-insensitive): "Strategic Planning" → Strategic Planning ✅
- Similarity > 0.6: "Emotional Intelligence" → "Emotional Intelligence & Empathy" (0.79) ✅
- Similarity > 0.6: "Data Analysis" → "Critical Data Analysis" (0.61) ✅
- Reject similarity ≤ 0.6: "Python" → anything (0.07) ❌
- Reject similarity ≤ 0.6: "SQL" → anything (0.06) ❌

This fuzzy matching runs server-side via a new DB function `match_job_canonical_skills(job_id)` or is precomputed in a materialized view for performance.

**Optimization:** Create a **lookup table** `job_canonical_skill_map` that caches job_id → canonical_skill_id[] relationships. Populated by a one-time backfill + trigger on new job_task_clusters inserts.

#### Layer 3: Composite Match Score

For each job, compute:

```
Score = (50% × Skill Overlap) + (25% × Task Familiarity) + (25% × Department Affinity)
```

**Skill Overlap (50%):**
`|user_canonical_skills ∩ job_canonical_skills| / |job_canonical_skills|`
If job has 0 canonical skills resolved, this component = 0.

**Task Familiarity (25%):**
Compare user's `completed_simulations.task_name` values against `job_task_clusters.cluster_name` for the job.
Use case-insensitive substring/similarity matching.
Score = matched_clusters / total_clusters for the job.

**Department Affinity (25%):**
Compare user's `completed_simulations.department` and `completed_simulations.job_title` against `jobs.department`.
If user has practiced sims in the same department → 1.0, related department → 0.5, unrelated → 0.

**Final score range:** 0–100%. Jobs below 10% are filtered out.

### Performance Strategy

**Option A (MVP — client-side):**
1. Fetch user's completed_simulations (already cached)
2. Resolve user's canonical skill set via static map
3. Fetch top ~200 jobs with their task clusters + canonical skills in a single RPC
4. Score client-side, sort, paginate

**Option B (Scale — server-side RPC):**
Create `match_jobs_for_user(user_id, limit, offset)` that runs the composite scoring in SQL.

**Start with Option A**, migrate to B when needed.

---

## Implementation Order

### Phase 1: Foundation
- [ ] Create `src/lib/skill-id-map.ts` (static generic→canonical mapping)
- [ ] Create `src/lib/match-engine.ts` (skill resolution + composite scoring)

### Phase 2: Scout Tab (Act 2)
- [ ] Create `src/components/territory/ScoutPanel.tsx`
- [ ] Update `src/pages/MapPage.tsx` — add Scout tab, rename Kingdoms
- [ ] Remove `onLaunchSim` from `MyRolesPanel` and `AlliesPanel`

### Phase 3: Campaign Tab (Act 3)
- [ ] Migration: `job_applications` table + RLS
- [ ] Create `src/components/territory/CampaignPanel.tsx`
- [ ] Update MapPage with Campaign tab

### Phase 4: Battle Record (Portfolio)
- [ ] Enhance `PublicProfile.tsx` with proven skills display
- [ ] Add shareable link generation

---

## Database Changes Needed

### New table: `job_applications`
```sql
CREATE TYPE public.application_status AS ENUM ('interested', 'applied', 'interview', 'offer', 'rejected');

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'interested',
  notes text,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
-- Users can only CRUD their own rows
```

### Future optimization: `job_canonical_skill_cache` materialized view
Precompute job→canonical skill mappings from both `job_future_skills` and fuzzy-matched `job_task_clusters.skill_names`. Refresh periodically.
