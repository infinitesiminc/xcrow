

## Sub-Vertical Deduplication Audit

### Findings

Total unique sub-verticals: **~600** across 19 verticals. Many are near-duplicates created by the AI classifier treating minor wording differences as distinct niches. Here are the worst offenders:

```text
Vertical                  SVs   Estimated after dedup   Reduction
Healthcare & Wellness     88    ~30                     66%
Marketing & Analytics     75    ~25                     67%
E-commerce & Payments     58    ~22                     62%
Accounting & Finance      53    ~20                     62%
CRM & Sales               38    ~12                     68%
HR & Recruiting           38    ~12                     68%
```

### Specific Duplicate Clusters (examples)

**CRM & Sales** — 38 → ~12:
- AI Sales Agent / AI Sales Assistant / AI Sales Associate / AI Sales Development → **"AI Sales Agent"**
- AI Outbound Sales Automation / AI Sales Outbound Automation → **"Outbound Sales Automation"**
- AI Sales Lead Generation / AI Sales Prospecting / AI Prospect List Generation / Lead Generation & Intent Signals → **"Lead Generation"**
- AI Outbound Phone Operations / AI Outbound Voice Agents (Financial Services) / AI SMS/Voice Sales Assistant → **"Voice Sales Agent"**
- Enterprise CRM / SMB CRM / Sales CRM / Open-Source CRM / Personal CRM / AI CRM Automation → **"CRM Platform"**
- Staffing dupes pattern repeats in **HR**: Staffing & Recruiting / Staffing & Recruiting Platform / Staffing & Recruitment / Staffing & Recruitment Software (4 identical entries)

**Healthcare** — 88 → ~30:
- AI Drug Discovery / AI-powered Drug Discovery → identical
- Telehealth × 7 variants (by specialty) → **"Telehealth"** + **"Specialty Telehealth"**
- Healthcare Revenue Cycle Management / Healthcare Revenue Cycle Automation / AI Revenue Cycle Management → one
- Medical Billing / Medical Billing Automation / AI Patient Billing & Collections → one
- 4 Mental Health variants → one

**Finance** — 53 → ~20:
- FinOps × 4 (Analytics, Automation, AI/Cloud Cost, AI FinOps Automation) → one
- Neobank × 4 (Latin America, Budgeting, Expats, Inclusive) → one
- Accounting × 5 (AI, Cloud, Free, SMB, Bookkeeping & Tax) → one

### Approach: AI-Powered Merge via Edge Function

Build a `dedup-subverticals` edge function that:

1. **Fetches** all distinct `(vertical_id, sub_vertical)` grouped by vertical
2. **Sends each vertical's list** to Gemini with a structured tool call: "Group these sub-verticals into canonical clusters. Return `{ clusters: [{ canonical_name, members[] }] }`"
3. **Executes SQL updates** — for each cluster, picks the canonical name and runs `UPDATE company_vertical_map SET sub_vertical = $canonical WHERE sub_vertical = ANY($members) AND vertical_id = $vid`
4. **Cleans up** `subvertical_agent_scores` — deletes orphaned rows and re-maps scored entries to new canonical names

### Plan

1. **Create edge function** `supabase/functions/dedup-subverticals/index.ts`
   - Iterates verticals one at a time
   - AI call per vertical to cluster sub-verticals
   - Updates `company_vertical_map.sub_vertical` in-place
   - Deletes orphaned `subvertical_agent_scores` rows
   - Returns summary: `{ vertical, before, after, merged[] }`

2. **No UI changes needed** — the hook and cards will automatically show fewer, cleaner niches after the data is merged

### Technical Details

- Single new file: `supabase/functions/dedup-subverticals/index.ts`
- Uses service role key for direct DB updates
- Rate-limited AI calls (one per vertical, 19 calls total)
- Idempotent — safe to run multiple times
- No migration needed — updating existing column values only

