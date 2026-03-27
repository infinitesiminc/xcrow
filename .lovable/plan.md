

# Reframe /disrupt — AI Software Startup Incubator

## New Positioning

From "Disruption Arena" (generic 22-industry battle game) to **"AI Venture Lab"** — a guided startup simulation product that university incubators give students to learn how to identify software opportunities and launch AI-powered startups.

**Core thesis**: AI has collapsed the cost and time to build software from months/$100K+ to days/$100. Anyone can now disrupt incumbent software companies. This product teaches students HOW.

## What Changes

### 1. Reframe the narrative and data

**Current**: 22 industry clusters with 100 generic incumbents (Legal, Healthcare, FinTech, etc.)
**New**: Focus exclusively on **software companies** ripe for AI disruption. The 22 clusters become software verticals (SaaS CRM, Project Management, Design Tools, Analytics, HR Tech, MarTech, DevTools, etc.)

Update `src/data/disruption-incumbents.ts`:
- Rename clusters to software verticals (e.g., "CRM & Sales" → Salesforce, HubSpot; "Design Tools" → Adobe, Figma; "Project Management" → Asana, Monday; "Accounting" → QuickBooks, Xero)
- Each incumbent gets software-specific fields: pricing model, tech stack age, API openness, AI integration status, annual revenue, market cap
- Add new field `aiDisruptionThesis` — specifically why AI makes this company vulnerable NOW
- Keep the same interface shape so all downstream components work

### 2. Rebrand the page and welcome experience

**Current welcome**: "Welcome to the Disruption Arena... find a company to disrupt"
**New welcome**: "Welcome to AI Venture Lab — the software industry is being rebuilt from scratch. AI tools now let a solo founder ship in days what used to take a team of 20. Let's find YOUR opportunity."

Update `src/pages/Disrupt.tsx`:
- Page title: "AI Venture Lab" (SEO + Helmet)
- Strategist opening message reframed around software + AI opportunity
- Quick prompt chips: "I want to build a better CRM", "What SaaS tools have the worst UX?", "Show me overpriced enterprise software", "B2B tools ripe for unbundling"
- Context panel header: "Software Market Map" instead of "Industry Map"
- Cards reframed: "Pricing Model" card, "AI Vulnerability" card, "Build Cost Estimate" card (how fast/cheap you could build an MVP with AI)

### 3. Update the 7-Act journey for software startups

The acts stay the same structure but descriptions become software-specific:

| Act | Current | New (Software-Focused) |
|-----|---------|----------------------|
| 1 Scout | "Battle incumbent CEO" | "Analyze the software incumbent — pricing, features, reviews, churn signals" |
| 2 Discover | "Interview AI customers" | "Interview frustrated users of the incumbent software — find the feature gap" |
| 3 Architect | "Lean Canvas" | "Design your SaaS model — pricing tiers, tech stack, AI features, build timeline" |
| 4 Launch | "GTM strategy" | "Launch playbook — Product Hunt, Reddit, cold outreach, content strategy" |
| 5 Defend | "Moat defense" | "Why can't the incumbent just add AI? Defend your speed and focus advantage" |
| 6 Pitch | "Face VCs" | "Pitch to investors — ARR projections, unit economics, AI leverage story" |
| 7 Debrief | "Founder report" | "Startup readiness score — idea viability, founder-market fit, execution plan" |

### 4. Update edge function prompts

`supabase/functions/disruption-battle/index.ts`:
- `discovery` action system prompt: Reframe as software market advisor. Reference specific SaaS metrics (ARR, churn, NPS, G2 reviews, pricing)
- `briefing` action: Focus on software business model analysis, pricing structure, feature gaps, AI integration status
- `battle` action: CEO now defends their software moat — platform lock-in, enterprise contracts, data gravity
- All other actions get minor prompt tweaks to reference "software startup" instead of generic "startup"

### 5. Incubator-friendly packaging

Add to the welcome/context panel:
- "Built for university startup incubators" badge
- "What you'll learn" card: Customer discovery, SaaS business modeling, GTM for software, AI-first product design, investor pitching
- Completion generates a "Venture Summary" PDF-ready output (reuses existing debrief data)

## Files Modified

1. **`src/data/disruption-incumbents.ts`** — Replace 22 generic clusters with ~15 software verticals, ~60-80 software incumbents. Add `aiDisruptionThesis` and `pricingModel` fields to interface. Keep same interface shape.

2. **`src/pages/Disrupt.tsx`** — Rebrand copy (title, welcome message, prompt chips, card labels). Update ACTS descriptions. Update SEO metadata.

3. **`supabase/functions/disruption-battle/index.ts`** — Update system prompts for `discovery`, `briefing`, `battle`, and other actions to reference software industry and AI building tools.

4. **`src/components/disrupt/DisruptMissionDebrief.tsx`** — Update founder profile labels to software-specific titles (e.g., "SaaS Visionary", "Technical Founder", "Growth Hacker")

5. **`src/components/disrupt/DisruptVentureBuild.tsx`** — Update canvas descriptions to be SaaS-specific (e.g., "SaaS Pricing Model" instead of generic "Unit Economics")

6. **`src/components/disrupt/DisruptGTM.tsx`** — Update GTM sections to software channels (Product Hunt, developer communities, content marketing)

## No structural changes

- Same two-column strategist layout
- Same 7-act flow and phase machine
- Same streaming chat infrastructure
- Same localStorage progress tracking
- Same edge function action routing (just prompt updates)
- All existing components reused with updated copy only

## Scope

~6 files modified. Primarily copy/data changes. One data file rewrite (incumbents). No new components, database tables, or edge functions.

