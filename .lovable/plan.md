

# Pipeline UX Redesign — Outreach-Driven Feedback Loop

## User Journey

```text
URL Input → Research (compact) → Personas surface → Leads auto-seed
    → AI Chat guides next steps → Find contacts → Draft outreach
        → Track sends/replies/wins/losses → Persona accuracy scores
            → Next research uses feedback as context
```

The feedback loop is organic: persona quality is measured by **actual outreach outcomes** (replied, won, lost) on leads tagged with that persona — not by thumbs up/down votes.

## What Gets Built

### 1. `ResearchProgressCompact.tsx` (new)
Single-viewport card replacing the scrolling `ICPResearchStream` during generation:
- Horizontal 4-dot stepper (DNA → ICP → Competitors → Pipeline)
- Current phase label + animated pulse indicator
- **Persona chips**: as Phase 2 streams, show persona labels as badges (e.g. "VP Ops · Parking"). These persist through Phases 3-4.
- Live ticker: single auto-replacing line of latest finding
- Elapsed timer in corner
- No scrolling needed

### 2. Add `persona_tag` to `saved_leads` table (migration)
- `ALTER TABLE saved_leads ADD COLUMN persona_tag text` — links each lead back to the persona that sourced it
- When leads are generated from a persona-targeted search, the persona label is stored on the lead
- This enables: "show me all VP Ops leads" and outcome tracking per persona

### 3. Auto-seed + auto-transition in `TenantAccountMap.tsx`
When research completes:
1. Auto-upsert all `researchTargets` into `flash_accounts` (staggered, no Apollo trigger)
2. Switch left panel from progress card → `AccountListView`
3. Each account row shows matched persona badge from Phase 2
4. Inject summary message into chat with interactive pills

### 4. Chat external message injection (`TenantSetupChat`)
- Add `externalMessages` prop — array merged into chat state
- Render `[[pill text]]` in markdown as clickable buttons
- Pill handlers:
  - `[[Find contacts for all]]` → batch Apollo across seeded accounts
  - `[[Show research details]]` → open Dialog with full `ICPResearchStream`
  - `[[Run another domain]]` → reset state
- After contacts found, chat suggests: `[[Draft outreach for top 5]]`

### 5. Persona-tagged outreach flow
- When drafting email for a lead, pass `persona_tag` to the draft-outreach edge function so the email tone matches the persona
- `outreach_log` already tracks `status` (sent/replied/bounced) — no schema change needed
- When lead status changes to `won`/`lost`/`replied`, the system has the full chain: persona → lead → outreach → outcome

### 6. Persona performance dashboard (chat-queryable)
- New DB function `get_persona_performance(workspace_key text)` that aggregates:
  ```sql
  SELECT sl.persona_tag,
         COUNT(*) as total_leads,
         COUNT(*) FILTER (WHERE sl.status = 'contacted') as contacted,
         COUNT(*) FILTER (WHERE sl.status = 'replied') as replied,
         COUNT(*) FILTER (WHERE sl.status = 'won') as won,
         COUNT(*) FILTER (WHERE sl.status = 'lost') as lost
  FROM saved_leads sl
  WHERE sl.workspace_key = _workspace_key AND sl.persona_tag IS NOT NULL
  GROUP BY sl.persona_tag
  ```
- User can ask chat: "Which personas are converting?" → AI calls this function and reports back
- Results like "VP Ops: 60% reply rate vs CTO: 15%" inform next research cycle

### 7. Feedback into next research
- When `startResearch` is called, query `get_persona_performance` and inject results into the Perplexity prompt:
  ```
  Previous campaign data: VP Operations had 60% reply rate (best performer).
  CTO/Technical roles had 15% reply rate (underperforming).
  Weight your persona recommendations accordingly.
  ```
- This closes the loop: outreach results directly improve future persona targeting

### 8. Wrap `ICPResearchStream` in Dialog
- Full scrollable report available on-demand via "Show research details" pill
- Not shown by default during generation

## Database Changes
1. **Migration**: `ALTER TABLE saved_leads ADD COLUMN persona_tag text`
2. **Migration**: Create function `get_persona_performance(text)` returning persona stats
3. No changes to `flash_account_activities` or `outreach_log` schema (already sufficient)

## Files

| Action | File |
|--------|------|
| Create | `src/components/enterprise/ResearchProgressCompact.tsx` |
| Modify | `src/pages/TenantAccountMap.tsx` — state machine, auto-seed, chat injection |
| Modify | `src/components/enterprise/ICPResearchStream.tsx` — wrap in Dialog export |
| Modify | `supabase/functions/draft-outreach/index.ts` — accept persona_tag for tone |
| Modify | `supabase/functions/perplexity-research/index.ts` — accept prior persona performance |
| Modify | `src/components/leadgen/useLeadsCRUD.ts` — pass persona_tag on lead creation |
| Migration | Add `persona_tag` column + `get_persona_performance` function |

