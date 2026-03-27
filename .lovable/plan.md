

# Disruption Arena — Full 3-Act MBA Simulation

## Overview

Transform the current single-phase disruption battle into a complete **3-act startup simulation** that teaches MBA students the full journey from opportunity identification to investor pitch.

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   ACT 1: SCOUT  │ ──▶ │  ACT 2: BUILD   │ ──▶ │  ACT 3: PITCH   │
│  (Current game)  │     │ Venture Architect│     │  Pitch Battle   │
│  6-step disrupt  │     │ Lean Canvas, GTM │     │ VC Q&A + Vote   │
│  framework       │     │ Unit Economics   │     │ Class ranking   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Act 2: Venture Architecture (New)

After conquering the 6 disruption steps, teams enter a structured startup-building phase. AI acts as a **co-founder advisor** (not adversary) through 5 sequential canvases:

1. **Lean Canvas** — AI helps draft; team must challenge and refine each section (Problem, Solution, Metrics, Unfair Advantage, Channels, Cost/Revenue)
2. **Market Sizing** — TAM/SAM/SOM estimation with AI data assistance; team defends methodology
3. **Go-to-Market Playbook** — AI proposes 3 GTM strategies; team picks one and justifies
4. **Unit Economics** — CAC, LTV, burn rate modeling; AI stress-tests assumptions
5. **Moat Defense** — Team articulates why their startup survives the incumbent's counter-attack

Each canvas produces a structured JSON output stored on the team record. AI provides streaming feedback like Act 1.

## Act 3: Pitch Battle (New)

Teams present their startup to the class:

1. **Auto-generated Pitch Deck** — AI compiles a 5-slide summary from Acts 1+2 data (Problem, Solution, Market, Traction Plan, Ask)
2. **VC Q&A Mode** — AI plays "VC panel" asking tough questions; other teams can also submit questions via a live question queue
3. **Class Vote** — All non-presenting teams rate each pitch (1-5 stars) on Viability, Clarity, and Defensibility
4. **Final Scoring** — Weighted: 40% AI battle score (Act 1) + 30% venture architecture quality (Act 2) + 30% pitch vote (Act 3)

## Technical Plan

### Database Changes
- Add columns to `disrupt_teams`: `venture_canvas` (jsonb), `pitch_data` (jsonb), `class_votes` (jsonb), `act` (int default 1)
- New table `disrupt_votes` for class voting: `id`, `room_id`, `voter_id`, `team_id`, `viability`, `clarity`, `defensibility`, `created_at`

### Edge Function Updates
- Extend `disruption-battle` with new actions:
  - `"venture"` — AI co-founder advisor for Act 2 canvases (streaming)
  - `"generate-pitch"` — Compiles pitch deck data from Acts 1+2
  - `"vc-qa"` — AI VC panel Q&A (streaming)
  - `"final-score"` — Combines all 3 act scores

### New Components
- `DisruptVentureBuild.tsx` — 5-canvas venture architecture interface with progress sidebar
- `DisruptPitchBattle.tsx` — Pitch presentation view with auto-deck, VC Q&A chat, and class voting
- `DisruptFinalScoreboard.tsx` — Enhanced scoreboard showing 3-act breakdown

### Game Flow Changes
- `disrupt_rooms.status` gets new values: `"venture"`, `"pitching"`, `"voting"`
- Host controls act transitions (Start Battle → Start Building → Start Pitching → Show Results)
- Timer resets per act (configurable by host)
- Real-time sync continues via Supabase Realtime for all new phases

### Phase Transitions (Host-controlled)
```text
lobby → drafting → battling → venture → pitching → voting → completed
```

## Scope

~6 files modified/created. Reuses existing streaming infrastructure and RPG styling. The venture and pitch phases follow the same chat-with-AI pattern as Act 1, keeping the UX consistent.

