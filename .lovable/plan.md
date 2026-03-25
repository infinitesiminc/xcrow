
# Three-Act User Journey + Calibrated Matching Algorithm

## Architecture: Three Acts

```
ACT 1: UPSKILL (Skill Forge + Map)     → Practice skills via sims
ACT 2: SCOUT (New tab)                  → Discover jobs ranked by fit
ACT 3: CAMPAIGN (New tab)               → Track applications + portfolio
```

Tab bar: `Skill Forge | Scout | Kingdoms | Codex | Allies`

---

## Calibrated Matching Algorithm

### Data Reality (verified 2026-03-25 after backfill)

| Metric | Value | Implication |
|--------|-------|-------------|
| Total jobs | 21,698 | Large pool |
| Jobs with task clusters + skill_names | 3,870 | **Primary matching surface** |
| Jobs with canonical_skill_id links | **2,927** | Expanded via backfill |
| Total skill→job links | **4,833** | Up from 642 |
| Avg canonical skills per linked job | ~1.7 | Decent for overlap scoring |
| Jobs with department data | 16,973 (78%) | Good secondary signal |
| Jobs with company_id | 21,405 (99%) | Good for familiarity signal |

### Three Matching Layers

#### Layer 1: Skill ID Resolution (User → Canonical)

User's `completed_simulations.skills_earned[].skill_id` falls into two buckets:

**Bucket A — Direct canonical match (~20 IDs):**
These skill_ids ARE canonical_future_skills.id values. Direct lookup.

**Bucket B — Generic category IDs (~19 IDs) requiring a static mapping:**
```
code-dev          → ["ai-code-review", "ai-code-audit-optimization", "algorithm-development"]
data-analysis     → ["critical-data-analysis", "data-architecture-design", "data-integrity-management"]
team-mgmt         → ["ai-collaboration-management", "ai-human-teaming-collaboration"]
testing-qa        → ["test-strategy", "ai-model-auditing-validation"]
strategy          → ["strategic-planning", "strategic-analytical-thinking", "strategic-oversight-innovation"]
design-ux         → ["interaction-design-for-ai-products", "creative-direction-innovation"]
system-design     → ["distributed-systems-architecture", "ai-agent-architecture-orchestration"]
writing-docs      → ["ai-content-strategy-governance", "ai-content-curation-editing"]
ai-ml             → ["ai-framework-expertise", "ai-tool-integration-mastery"]
critical-thinking → ["strategic-problem-solving", "critical-ai-evaluation", "critical-systems-evaluation-thinking"]
financial-modeling→ ["financial-narrative-crafting", "proactive-cost-optimization", "performance-modeling-optimization"]
sales             → ["ai-enhanced-negotiation-ethics", "complex-deal-negotiation", "consultative-communication"]
stakeholder-mgmt  → ["stakeholder-communication", "stakeholder-empathy-in-the-ai-age"]
risk-assessment   → ["ai-risk-compliance-assessment", "predictive-risk-assessment"]
regulatory        → ["compliance-strategy", "policy-tech-translation"]
research          → ["ethical-ai-research", "trend-forecasting"]
presentation      → ["consultative-communication", "creative-direction-innovation"]
devops            → ["distributed-systems-architecture", "performance-modeling-optimization"]
vendor-mgmt       → ["ai-vendor-evaluation", "complex-deal-negotiation"]
```

Static map in `src/lib/skill-id-map.ts`.

#### Layer 2: Job Skill Resolution (Job → Canonical)

**Path A — Direct canonical links (2,927 jobs):**
`job_future_skills WHERE canonical_skill_id IS NOT NULL`

**Path B — Fuzzy match from task cluster skill_names (3,870 jobs):**
`job_task_clusters.skill_names[]` compared against `canonical_future_skills.name + aliases`
- Exact match (case-insensitive) ✅
- Substring containment > 60% similarity ✅
- Reject generic terms (Python, SQL, etc.) ❌

#### Layer 3: Composite Match Score

```
Score = (50% × Skill Overlap) + (25% × Task Familiarity) + (25% × Department Affinity)
```

**Skill Overlap (50%):**
`|user_canonical_skills ∩ job_canonical_skills| / |job_canonical_skills|`

**Task Familiarity (25%):**
Compare user's completed sim task_names against job's task cluster names.

**Department Affinity (25%):**
Compare user's sim departments against job department.

**Threshold:** Jobs below 10% are filtered out.

### Performance Strategy

**MVP (client-side — current implementation):**
1. Fetch user's completed_simulations (already cached in MapPage)
2. Resolve user's canonical skill set via static map
3. Fetch top ~200 jobs with task clusters + canonical skills via single RPC
4. Score client-side, sort, paginate

---

## Implementation Status

### Phase 1: Foundation ✅
- [x] Backfill canonical skill links (2,927 jobs, 4,833 links)
- [x] Update demand_count/job_count counters
- [ ] Create `src/lib/skill-id-map.ts`
- [ ] Create `src/lib/match-engine.ts`

### Phase 2: Scout Tab (Act 2) 🔄
- [ ] Create `src/components/territory/ScoutPanel.tsx`
- [ ] Add Scout tab to MapPage tab bar
- [ ] Job cards with company logo, match %, department, skills overlap

### Phase 3: Campaign Tab (Act 3)
- [ ] Migration: `job_applications` table + RLS
- [ ] Create `src/components/territory/CampaignPanel.tsx`
- [ ] Status tracker (Interested → Applied → Interview → Offer)

### Phase 4: Battle Record (Portfolio)
- [ ] Shareable public profile with proven skills

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
```
