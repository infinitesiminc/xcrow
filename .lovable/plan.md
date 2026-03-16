

## The Problem

The current homepage presents Diagnose → Upskill → Plan as three sequential steps — a **process description**. This undersells the product because:

1. It reads like a consulting engagement, not an autonomous system
2. It misses the **continuous loop** — the platform doesn't stop after "Plan," it keeps adapting
3. It doesn't connect to what a CEO/Board actually cares about: **workforce competitiveness as AI accelerates**
4. The framing is tactical ("task-level scoring") when it should be strategic ("your workforce becomes more valuable every week")

## Strategic Reframe

The homepage narrative should shift from **"Here's our 3-step process"** to **"We run an autonomous system that continuously adapts your workforce to AI disruption."**

The audience hierarchy:
- **Board/CEO**: "Are we competitive? Are we exposed?" → They need to see this as **risk governance**, like a financial audit but for human capital
- **Head of People/CHRO**: "How do I transform 5,000 people without disruption?" → They need to see the **autonomous loop** that runs without manual L&D overhead  
- **CFO**: "What's the ROI?" → They need to see **measurable outcomes**, not training hours

## Plan

### 1. Replace "Three phases. One platform." section with "The Adaptive Workforce Engine"

Instead of 3 sequential cards, build a **continuous loop visual** with an animated cycle diagram at the center:

```text
        ┌─── Map ───┐
        │            │
    Adapt          Assess
        │            │
        └── Train ───┘
```

- **Map**: Every role, every task — scored for AI exposure in minutes
- **Assess**: Calibrated simulations measure readiness across 4 pillars
- **Train**: Targeted practice closes gaps autonomously — no manual L&D
- **Adapt**: Scores below threshold trigger automatic re-simulation with coaching

The loop visual animates continuously (rotating highlight around the cycle), reinforcing that this isn't a one-time audit — it's a **living system**.

Each node expands on hover/click to show the existing mini-visuals (DiagnoseVisual, UpskillVisual, PlanVisual — repurposed).

### 2. Rewrite the Hero for C-suite resonance

**Current**: "Every workforce will transition. We make it measurable."  
**New**: "AI is rewriting every role. We make your workforce ready — continuously."

**Sub-copy** shift from audit language to competitive advantage:  
"The companies that win won't just adopt AI tools. They'll have a workforce that knows how to work alongside them. Our platform maps exposure, runs calibrated simulations, and autonomously adapts your people — every week, not every quarter."

### 3. Add a new "Why Now" section before the loop

A punchy 3-column section that frames the urgency for board-level readers:

| AI models ship quarterly | L&D plans ship annually | The gap is your risk |
|---|---|---|

Short copy: "Every quarter, AI capabilities leap forward. Your workforce plans update once a year. That gap is where competitors take your market share. We close it with a system that adapts as fast as AI does."

### 4. Reframe proof points for strategic value

**Current**: Tactical metrics (time-to-competency, savings)  
**New**: Strategic outcomes that boards care about:

- "62% faster role adaptation" → keeps the metric but reframe as competitive speed
- "3.2× faster than traditional L&D" → reframe as "Continuous vs. annual"  
- "$4.1M savings" → reframe as "Risk reduced" with context about attrition/mis-hiring in AI transition

### 5. Replace the linear flow indicator

Remove the `Diagnose → Upskill → Plan` arrow bar. Replace with a single line:  
**"Not a project. A system. It runs continuously."**

### 6. Update CTA language

**Current**: "Don't guess. Measure."  
**New**: "Your competitors are adapting. Are you?" — more urgency, more strategic.

### Files Changed

- **`src/pages/Enterprise.tsx`** — Full rewrite of the workflow section (loop visual replaces 3-card layout), hero copy, proof points reframe, "Why Now" section, CTA updates. The DiagnoseVisual/UpskillVisual/PlanVisual components are kept but repositioned as expandable details within loop nodes.

