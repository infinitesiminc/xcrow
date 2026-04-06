## Drag-to-Target Lead Generation Cards

### Concept
After discovery, display Product and Vertical/Buyer Role cards in two full-width scrollable rows above the lead table. Users drag cards into a "Target Zone" to compose their lead search criteria. AI provides real-time feedback on estimated success rate and recommended actions.

### Architecture Changes

**1. Unify data sources**
- Currently /leadgen uses `leadgen-scout` (produces flat niches), while /leadhunter uses `gtm-analyze` (produces products + mappings + buyer roles)
- **Change**: After `leadgen-scout` discovery, also call `gtm-analyze` to get structured product/mapping data for the card UI
- Store GTM tree data in state alongside existing niche data

**2. New component: `TargetingCards.tsx`**
- Two horizontal scrollable rows: **Products** and **Verticals & Buyer Roles**
- Cards match the existing GTMTreeView framework-only card design (same styling)
- Each card is draggable (HTML5 drag & drop)

**3. New component: `TargetZone.tsx`**
- Drop zone below the card rows, above the lead table
- Shows dropped cards as chips: e.g. "Stripe Payments" + "E-commerce & Retail" + "Head of Payments"
- Real-time AI feedback panel:
  - Estimated discovery success rate (e.g. "~85% match likelihood")
  - Recommended next card to add
  - "Generate Leads" CTA button
- Calls a lightweight AI endpoint to score the current targeting combo

**4. Replace ICPInsightsPanel**
- The collapsible ICP tree panel gets replaced by the card rows + target zone
- Company summary stays as a compact banner above everything

**5. Lead generation flow**
- User drags cards → AI shows feedback → User clicks "Generate" → Leads appear in table below
- Each generated batch is tagged with the targeting combo for filtering

### Files to create/modify
- `src/components/leadgen/TargetingCards.tsx` (new)
- `src/components/leadgen/TargetZone.tsx` (new)
- `src/components/leadgen/LeadgenDashboard.tsx` (replace ICPInsightsPanel with new cards)
- `src/pages/Leadgen.tsx` (add GTM analysis call, pass data down)
- `supabase/functions/leadgen-chat/index.ts` (add targeting score endpoint or inline it)
