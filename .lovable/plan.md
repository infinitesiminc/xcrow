

# Make /disrupt 100% Practical — Real Data, Real Tools, Real Customers

## Problem

The current 6-act journey has two major issues:
1. **Act 1 (Discover)** uses fake AI-generated "customer personas" — interviewing imaginary people teaches nothing practical
2. Several acts are chat-based exercises that feel academic rather than actionable

A real founder doesn't interview AI customers. They read G2 reviews, check Reddit complaints, analyze pricing pages, and talk to real people on LinkedIn/Twitter.

## Redesign Philosophy

Every act should produce a **real artifact** the founder could use in their actual startup. No roleplay with fake personas. Instead: AI helps you find, analyze, and synthesize real-world data.

## Updated 6-Act Journey

| Act | Current | New (Practical) | Real Output |
|-----|---------|-----------------|-------------|
| 1 Discover | Interview 3 fake AI personas | **Customer Pain Mining** — AI helps you find and analyze real G2 reviews, Reddit threads, Twitter complaints, and app store reviews about the incumbent | Pain Point Report with real quotes and sources |
| 2 Architect | Chat about Lean Canvas | **SaaS Model Workshop** — Guided canvas builder with AI challenging each section, producing an exportable one-pager | Lean Canvas PDF |
| 3 Launch | Chat about GTM channels | **Launch Checklist Builder** — Concrete, timed 30-day launch plan with specific channels, copy templates, and milestone targets | 30-Day Launch Plan |
| 4 Defend | Roleplay as CEO fighting back | **Competitive War Game** — AI analyzes the incumbent's likely responses using real acquisition history, product roadmap signals, and pricing moves | Competitive Response Matrix |
| 5 Pitch | Generate fake pitch deck + VC Q&A | **Pitch Deck Builder** — Step-by-step pitch construction with AI coaching on each slide, producing a real exportable deck summary | 5-Slide Pitch Summary |
| 6 Debrief | Score card | **Founder Readiness Report** — Comprehensive assessment with specific next steps, resource links, and a shareable startup brief | Startup One-Pager |

## Key Change: Act 1 (Discover) → Customer Pain Mining

This is the biggest rewrite. Replace `DisruptCustomerDiscovery.tsx` entirely.

**New flow:**
1. AI automatically searches for real customer complaints about the incumbent (using its knowledge of G2 reviews, Reddit threads, common pain points)
2. Presents findings as structured cards: each card = one pain point with real-world evidence
3. User rates/ranks pain points by severity and opportunity size
4. AI helps synthesize top pain points into a "Customer Pain Report"
5. User can ask follow-up questions to dig deeper into any pain point

**No fake persona interviews.** Instead: AI acts as a research analyst who has already done the homework and presents findings for the founder to evaluate and prioritize.

**UI structure:** Same two-column layout used elsewhere — chat on left for Q&A, pain point cards on right that populate progressively.

## Files Modified

### 1. `src/components/disrupt/DisruptCustomerDiscovery.tsx` — Full rewrite
- Remove PERSONAS array and fake interview flow
- New component: `CustomerPainMining`
- Left: AI research chat (ask questions, dig deeper)
- Right: Pain Point cards that populate as AI discovers them
- Each card: pain point title, severity badge, evidence quotes, source type (G2/Reddit/Twitter)
- Bottom: "Generate Pain Report" button when 3+ pain points identified
- Completion: score based on number of pain points found and quality of synthesis

### 2. `supabase/functions/disruption-battle/index.ts` — Update `customer-discovery` action
- Rename to `customer-pain-mining` (keep old name as alias for backward compat)
- New system prompt: AI acts as a market research analyst, not a fake customer
- Prompt instructs AI to surface real complaints, pricing frustrations, feature gaps, and churn signals
- AI outputs structured pain points using markers like `[PAIN:severity:title]` for the frontend to parse into cards
- Follow-up messages let user drill into specific pain points

### 3. `src/pages/Disrupt.tsx` — Minor updates
- Update ACTS array: Act 2 subtitle from "Interview Users" to "Find Real Pain Points", description updated
- Update the act component mapping to use renamed component

### 4. `src/components/disrupt/DisruptGTM.tsx` — Minor copy updates
- Update section descriptions to be more actionable (specific channel tactics, not generic prompts)
- Change opening message to focus on producing a concrete 30-day plan

### 5. `src/components/disrupt/DisruptMissionDebrief.tsx` — Minor copy updates
- Update ACT_LABELS to match new act names

## No structural changes
- Same sidebar navigation
- Same 6-act flow
- Same streaming chat infrastructure
- Same localStorage progress tracking
- Same edge function routing (one action name change)

## Scope
~3 files with significant changes, ~2 files with minor copy updates. One component rewrite (CustomerDiscovery → CustomerPainMining). One edge function prompt rewrite.

