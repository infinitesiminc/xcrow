

## Horizontally Scrollable Task Cards with Hero Images

### Layout Redesign

Replace the current two-column (tasks left / skills right) layout with a new stacked layout:

1. **Tasks** — Full-width horizontal carousel of visually rich cards with hero illustrations
2. **Skills** — Displayed below the carousel, filtered by the currently selected task card

### Task Cards

Each card (~280px wide, ~320px tall) in a horizontally scrollable row:

```text
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  ░░░ hero image ░░░ │  │  ░░░ hero image ░░░ │  │  ░░░ hero image ░░░ │
│  ░░░░░░░░░░░░░░░░░░ │  │  ░░░░░░░░░░░░░░░░░░ │  │  ░░░░░░░░░░░░░░░░░░ │
│                     │  │                     │  │                     │
│  Task Name          │  │  Task Name          │  │  Task Name          │
│  Short description  │  │  Short description  │  │  Short description  │
│  [Human+AI] [Trend] │  │  [AI-driven] [Trend]│  │  [Human-led] [Trend]│
│         ▶ Practice  │  │         ▶ Practice  │  │         ▶ Practice  │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
         ← scroll →
```

**Hero images**: Generated via a gradient + icon approach (no external images needed). Each card gets a unique gradient based on its `impactLevel` and a large thematic icon (e.g. Bot, User, Shield) from Lucide, creating an attractive visual header without requiring actual photos.

- `low` impact → soft green/blue gradient
- `medium` impact → amber/orange gradient  
- `high` impact → red/pink gradient

Clicking a card selects it (highlighted ring). Scroll via native CSS `overflow-x: auto` with `snap-x snap-mandatory` for smooth snapping.

### Skills Display

Skills move to a **full-width section below the carousel**, shown as a responsive grid (3 columns on desktop, 1 on mobile):

```text
── Skills for "Abuse Investigation" ──────────────────
┌──────────┐  ┌──────────┐  ┌──────────┐
│ AI Tools │  │ Human    │  │ New      │
│ Skill 1  │  │ Skill 1  │  │ Skill 1  │
│ Skill 2  │  │ Skill 2  │  │          │
└──────────┘  └──────────┘  └──────────┘
```

- When no task is selected: shows all skills grouped by category
- When a task card is clicked: filters to related skills with a "Show all" reset link
- Same expandable `CompactSkill` cards already in use

### Technical Changes

**`src/pages/Analysis.tsx`**:
- Replace the `grid-cols-1 lg:grid-cols-5` two-column layout with a stacked layout
- Task section becomes a horizontal scroll container with `flex overflow-x-auto gap-4 snap-x snap-mandatory pb-4` and custom scrollbar styling
- Each task card rendered as a fixed-width card (~280px) with a gradient hero header area containing a large Lucide icon
- Skills section rendered below as a full-width `grid grid-cols-1 md:grid-cols-3 gap-4`
- Remove the `isMobile` conditional for skills — same layout works for both
- Add a mapping from `TaskState` / `AIImpactLevel` to gradient classes and hero icons

**`src/index.css`** (minor):
- Add subtle custom scrollbar styling for the horizontal scroll area

