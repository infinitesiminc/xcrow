

# Pivot /disrupt → AI Software Factory

## Concept

Replace the 6-act guided journey with a **live agent dashboard**. User describes their idea → AI agent runs autonomously through all stages (market research, business model, tech architecture, landing page, MVP scaffold) → user watches progress in real-time and gets a deployable starter project.

## New Flow

```text
┌─────────────────────────────────────────────────┐
│  1. INTAKE (30 seconds)                         │
│  "Describe your startup idea or pick a target"  │
│  → 3-5 quick questions (market, audience, name) │
├─────────────────────────────────────────────────┤
│  2. AGENT DASHBOARD (autonomous, ~2 min)        │
│  Live progress panel showing agent working:     │
│                                                 │
│  ✅ Market Research     — pain points found     │
│  ✅ Business Model      — lean canvas done      │
│  🔄 Tech Architecture   — choosing stack...     │
│  ⬚ Landing Page Copy   — queued                │
│  ⬚ MVP Blueprint       — queued                │
│  ⬚ Launch Playbook     — queued                │
│                                                 │
│  Each step expands to show live AI output       │
│  User can chat with agent while it works        │
├─────────────────────────────────────────────────┤
│  3. LAUNCHPAD (results)                         │
│  Exportable artifacts + "Deploy" actions        │
│  - Lean Canvas card                             │
│  - Landing page preview                         │
│  - Tech stack recommendation                    │
│  - 30-day launch plan                           │
│  - Pitch deck outline                           │
│  - "Create Lovable Project" button              │
└─────────────────────────────────────────────────┘
```

## UI Design

**Single page, three states:**

1. **Intake** — centered card with idea input + optional target picker (reuse existing incumbent data). Quick questions appear inline after first submit.

2. **Agent Dashboard** — two columns:
   - **Left**: Live agent log (streaming text showing what agent is doing, with chat input at bottom so user can steer)
   - **Right**: Pipeline progress (6 stages as expandable cards, each fills with content as agent completes it)

3. **Launchpad** — grid of artifact cards with export/copy actions. "Start building with Lovable" CTA.

## 6 Agent Stages

| Stage | Agent Task | Output |
|-------|-----------|--------|
| 1. Market Intel | Analyze incumbent weaknesses, find pain points | Pain Point Report card |
| 2. Business Model | Generate lean canvas, pricing model, unit economics | Lean Canvas card |
| 3. Tech Blueprint | Recommend stack, AI integrations, architecture | Tech Stack card |
| 4. Landing Page | Write hero copy, features, CTA, social proof | Landing Page Preview card |
| 5. Launch Plan | 30-day timeline with specific channels and tactics | Launch Checklist card |
| 6. Pitch Summary | 5-slide pitch outline with key metrics | Pitch Deck card |

## Technical Approach

### Files Modified

**1. `src/pages/Disrupt.tsx` — Major rewrite**
- Replace 1100-line file with ~500 lines
- Three phase states: `intake` | `running` | `complete`
- `IntakeScreen`: idea textarea + optional incumbent picker, quick follow-up questions
- `AgentDashboard`: left=streaming agent log + chat, right=pipeline cards
- `LaunchpadScreen`: artifact grid with export actions
- Remove all act-specific component imports, sidebar navigation, mission progress

**2. `supabase/functions/disruption-battle/index.ts` — New `factory` action**
- Single streaming endpoint that runs all 6 stages sequentially
- Each stage outputs structured markers: `[STAGE:market-intel:START]`, `[STAGE:market-intel:COMPLETE]`
- Content between markers is the artifact for that stage
- One long-running AI call with a mega-prompt that produces all 6 sections

**3. New: `src/components/disrupt/FactoryPipeline.tsx`**
- Pipeline visualization component
- 6 expandable cards showing stage status (queued → running → complete)
- Each card expands to show generated content with copy/export buttons
- Animated progress indicators

**4. New: `src/components/disrupt/LaunchpadGrid.tsx`**
- Grid of completed artifact cards
- Each card: title, summary preview, "Copy" and "Export" buttons
- Landing page card has a live HTML preview
- "Create Lovable Project" CTA at bottom

**5. Delete/deprecate existing act components**
- `DisruptCustomerDiscovery.tsx`, `DisruptVentureBuild.tsx`, `DisruptGTM.tsx`, `DisruptMoatDefense.tsx`, `DisruptPitchBattle.tsx`, `DisruptMissionDebrief.tsx` — no longer used
- Keep files but remove imports from Disrupt.tsx

### Edge Function Strategy

Instead of 6 separate AI calls, the factory runs **one streaming call** with a structured mega-prompt:

```
You are an AI Startup Factory. Given this idea and target market, produce a complete startup blueprint.

Output format — use these exact markers:
[STAGE:market-intel:START]
...market research content...
[STAGE:market-intel:COMPLETE]
[STAGE:business-model:START]
...lean canvas content...
[STAGE:business-model:COMPLETE]
...etc for all 6 stages
```

Frontend parses markers in real-time to update pipeline cards as they complete.

### State Management

- `factoryState`: `{ phase, idea, targetIncumbent?, stages: Record<stageId, { status, content }>, agentLog: string[] }`
- localStorage persistence so user can return to completed factory runs
- No database writes needed (all client-side for MVP)

## Copy Changes

- Page title: "AI Venture Lab" → **"Software Factory"**
- Tagline: "From idea to launchpad in 2 minutes"
- SEO: "AI-powered startup builder — instant market research, business model, and MVP blueprint"

## What Gets Simpler

- 1100 lines → ~500 lines
- 6 separate components → 2 new focused components
- 6 edge function actions → 1 `factory` action
- Complex act navigation → linear 3-phase flow
- No sidebar, no act scoring, no mission progress tracking

