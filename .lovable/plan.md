

## Problem

The current simulation teaches users *how to do a task* (generic mentoring), but the core value of this product is the **AI replacement lens**. Users need to understand how AI is changing this specific task and what they should do about it. Also, the simulation treats everyone as a beginner — professionals and students need different framing.

## Solution: AI-Aware Practice Mode

### 1. Add Experience Level Selection (Briefing Screen)

Before starting, ask the user to self-select:
- **Exploring** — "I'm new to this field" (student/career changer)
- **Practicing** — "I already do this job" (professional)

This selection gets passed to the backend and adjusts the AI's tone, depth, and framing.

### 2. Restructure Rounds Around the AI Replacement Lens

Instead of generic "learn the task" MCQs, each round follows this structure:

**Round pattern:**
1. Present a realistic scenario for this task
2. Ask: "How would you handle this?" (MCQ with 3 options)
3. After answer, reveal: **"Here's how AI handles this today"** — a short explanation of what AI tools can already do for this specific sub-task
4. Then the key question: "Given that AI can do X, what's the human's most valuable contribution here?" or "How would you use AI as a tool while adding human judgment?"

This teaches the task AND the AI context simultaneously.

### 3. Pass Task Metadata to the Simulator

Currently `SimulatorModal` only receives `taskName`, `jobTitle`, `company`. We need to also pass the task's `currentState`, `trend`, and `impactLevel` from the analysis data so the AI can tailor its responses.

### 4. Update Scoring Categories

Replace generic categories with AI-readiness focused ones:
- **AI Tool Awareness** — Did they recognize where AI applies?
- **Human Value-Add** — Did they identify what humans uniquely contribute?
- **Adaptive Thinking** — Can they envision working alongside AI?
- **Domain Judgment** — Do they understand the task's nuances?

### Technical Changes

**Files to modify:**

1. **`src/types/analysis.ts`** — No changes needed, task metadata types already exist.

2. **`src/pages/Analysis.tsx`** — Pass full task object (not just task name) to SimulatorModal. Find matching task from `result.tasks` when setting `simTask`.

3. **`src/components/SimulatorModal.tsx`**:
   - Add `taskState`, `taskTrend`, `taskImpactLevel` to props
   - Add experience level selector to BriefingScreen (two-button choice)
   - Pass experience level to `compileSession` and `chatTurn`

4. **`src/lib/simulator.ts`**:
   - Update `compileSession` signature to accept `experienceLevel` and task AI metadata
   - Update `chatTurn` to pass `experienceLevel`

5. **`supabase/functions/sim-chat/index.ts`**:
   - **`handleCompile`**: Rewrite prompt to frame simulation around AI impact. Briefing explains how AI is affecting this task today. Tips focus on human+AI collaboration.
   - **`handleChat`**: Rewrite system prompt so each round teaches the task through the AI replacement lens. Adjust tone based on experience level (simplified for explorers, peer-level for practitioners).
   - **`handleScore`**: Replace scoring categories with AI-readiness metrics.

### UX Flow (Updated)

```text
┌─────────────────────────────────────┐
│  Briefing Screen                     │
│                                      │
│  "Contract Drafting"                 │
│  AI Impact: Human+AI → Growing AI    │
│                                      │
│  [I'm exploring]  [I do this job]    │
│                                      │
│  → Begin Practice                    │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Round N                             │
│                                      │
│  📖 Scenario: [realistic situation]  │
│  🤔 How would you approach this?     │
│     A) ...  B) ...  C) ...           │
│                                      │
│  → After answer:                     │
│  🤖 AI Today: [what AI can do here]  │
│  💡 Human Edge: [why humans matter]  │
│                                      │
│  🔄 Next scenario? (yes/no)          │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Score Card                          │
│                                      │
│  AI Tool Awareness      78/100       │
│  Human Value-Add         85/100      │
│  Adaptive Thinking       72/100      │
│  Domain Judgment          80/100     │
└─────────────────────────────────────┘
```

