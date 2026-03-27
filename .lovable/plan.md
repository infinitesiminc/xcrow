

# Disruption Arena — Realistic Startup Simulation

## Core Philosophy

A real startup doesn't just "battle a CEO" — it goes through a rigorous process of discovery, validation, building, and fundraising. The game should mirror this journey so users develop actual startup muscle memory.

## The Real Startup Journey (7 Acts)

```text
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Act 1   │ → │ Act 2   │ → │ Act 3   │ → │ Act 4   │
│ SCOUT   │   │VALIDATE │   │ BUILD   │   │ LAUNCH  │
│ Find the│   │ Talk to │   │ Lean    │   │ GTM &   │
│ target  │   │ market  │   │ Canvas  │   │ Traction│
└─────────┘   └─────────┘   └─────────┘   └─────────┘
      ↓                                         ↓
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Act 5   │ → │ Act 6   │ → │ Act 7   │
│ DEFEND  │   │ PITCH   │   │ FINAL   │
│ Moat vs │   │ VC Q&A  │   │ Score & │
│ counter │   │ & Deck  │   │ Report  │
└─────────┘   └─────────┘   └─────────┘
```

**Why 7 acts instead of 3:**
The current 3-act structure (Scout/Build/Pitch) bundles too much into Act 2. Real startups go through distinct phases that each require different thinking. The current `DisruptVentureBuild` already has 5 canvases (Lean Canvas, Market Sizing, GTM, Unit Economics, Moat) — these should each be their own meaningful act, not chat threads inside one component.

## Revised Act Structure

### Act 1: Scout the Target (existing battle — keep as-is)
- Chat with incumbent CEO using 6-step disruption framework
- Score: disruption strategy quality (40% weight)

### Act 2: Customer Discovery
- NEW: AI plays potential customers in the beachhead niche
- User must conduct customer interviews to validate problem/solution fit
- Key questions: "Would you pay for this?" "How do you solve this today?" "What's your biggest frustration?"
- Score: quality of insights extracted, problem validation strength

### Act 3: Venture Architecture
- Refactor current `DisruptVentureBuild` — just Lean Canvas + Unit Economics
- AI co-founder helps build the core business model
- Score: canvas completeness and viability of economics

### Act 4: Go-to-Market
- Refactored from current GTM canvas
- User designs launch strategy: channel selection, pricing model, first 100 customers plan
- AI challenges with real-world execution concerns
- Score: specificity and feasibility of GTM plan

### Act 5: Competitive Defense
- Refactored from current Moat Defense canvas
- The incumbent CEO "counter-attacks" — announces they're building the same thing
- User must articulate why the incumbent literally cannot respond effectively
- Score: strength of moat argument

### Act 6: Investor Pitch
- Keep existing pitch generation + VC Q&A
- AI VCs ask hard questions about the business
- Score: pitch clarity, defensibility of answers

### Act 7: Mission Debrief
- Combined scorecard across all acts
- Startup "valuation" calculated from weighted scores
- Strengths/weaknesses breakdown
- "Founder Profile" badge (e.g., "The Strategist", "The Hustler", "The Visionary")
- Save to portfolio, return to hub

## UI Structure

### Mission Hub (replaces lobby)
- Hero: "100 Incumbents. Build Your Startup Portfolio."
- No classroom mode — removed entirely
- 3-section layout:
  1. **Your Portfolio** — cards showing missions attempted/completed with scores
  2. **Industry Map** — 22 clusters with progress indicators
  3. **How It Works** — 7-act journey explained visually

### Mission Card (per incumbent)
- 7-act progress rail (dots connected by line)
- Each dot: locked / current / completed with score
- Resume or start button
- Overall "startup score" when complete

### Mission Progress Bar (sticky during acts)
- Shows all 7 acts as connected steps
- Current act highlighted, completed acts checked
- Back to hub button

### Act Intro Screen (before each act)
- Act number, name, icon
- "What you'll do" — 2-3 bullets
- "Startup skill you'll develop" — e.g., "Customer empathy", "Financial modeling"
- "Begin" button

## Technical Plan

### Files Modified

**`src/pages/Disrupt.tsx`** — Major rewrite:
- Remove all team/classroom/lobby code
- Remove `DisruptLobby` import and usage
- New phases: `hub | cluster | act1-intro | act1 | act1-score | act2-intro | act2 | act2-score | act3-intro | act3 | act3-score | act4-intro | act4 | act4-score | act5-intro | act5 | act5-score | act6-intro | act6 | act6-score | act7`
- New inline components: `MissionHub`, `MissionCard`, `MissionProgressBar`, `ActIntro`
- localStorage progress tracking per incumbent
- Auto-advance between acts with score display

**`src/components/disrupt/DisruptCustomerDiscovery.tsx`** — NEW:
- Act 2 component — AI plays 3 different customer personas
- User conducts discovery interviews
- Structured around: Problem validation, willingness to pay, current alternatives
- Uses existing streaming infrastructure via `disruption-battle` edge function with new `customer-discovery` action

**`src/components/disrupt/DisruptVentureBuild.tsx`** — Refactor:
- Reduce from 5 canvases to 2 (Lean Canvas + Unit Economics)
- This becomes Act 3 only

**`src/components/disrupt/DisruptGTM.tsx`** — NEW:
- Act 4 component — GTM strategy builder
- Refactored from what was the GTM canvas inside VentureBuild
- AI challenges channel selection, pricing, first-100-customers plan

**`src/components/disrupt/DisruptMoatDefense.tsx`** — NEW:
- Act 5 component — the incumbent fights back
- Same CEO persona from Act 1 returns, now announces they're copying your idea
- User must defend their moat

**`src/components/disrupt/DisruptPitchBattle.tsx`** — Minor refactor:
- Remove team voting UI (no classroom mode)
- Solo-only: generate deck + VC Q&A
- This becomes Act 6

**`src/components/disrupt/DisruptMissionDebrief.tsx`** — NEW:
- Act 7 component — final scorecard
- Weighted score across all 6 acts
- Founder profile assignment
- Save to localStorage portfolio

**`supabase/functions/disruption-battle/index.ts`** — Add actions:
- `customer-discovery`: AI plays customer personas for Act 2
- `gtm-challenge`: AI challenges GTM plan for Act 4
- `moat-counterattack`: Incumbent CEO fights back for Act 5
- `final-debrief`: Calculate weighted final score + founder profile for Act 7

### Files Removed (from active use)
- `DisruptLobby.tsx` — no longer imported (keep file, just unused)
- `DisruptDraft.tsx` — no longer imported
- `DisruptTeamBattle.tsx` — no longer imported
- `DisruptScoreboard.tsx` — no longer imported
- `DisruptFinalScoreboard.tsx` — no longer imported

### No Database Changes
- All solo progress in localStorage
- Edge function additions are backward-compatible

### Implementation Order
1. Rewrite `Disrupt.tsx` with hub + 7-act phase machine + progress tracking
2. Create `DisruptCustomerDiscovery.tsx` (Act 2)
3. Refactor `DisruptVentureBuild.tsx` (Act 3 — fewer canvases)
4. Create `DisruptGTM.tsx` (Act 4)
5. Create `DisruptMoatDefense.tsx` (Act 5)
6. Refactor `DisruptPitchBattle.tsx` (Act 6 — solo only)
7. Create `DisruptMissionDebrief.tsx` (Act 7)
8. Update edge function with new actions

### Startup Skills Taught Per Act
| Act | Skill | Real-World Equivalent |
|-----|-------|-----------------------|
| 1 - Scout | Market analysis, competitive intelligence | Industry research phase |
| 2 - Discover | Customer development, empathy | Mom Test interviews |
| 3 - Architect | Business model design, financial modeling | Lean Canvas workshop |
| 4 - Launch | Channel strategy, pricing, growth hacking | Pre-launch planning |
| 5 - Defend | Competitive strategy, moat building | Board strategy session |
| 6 - Pitch | Storytelling, investor psychology | Demo Day preparation |
| 7 - Debrief | Self-assessment, pattern recognition | Founder retrospective |

