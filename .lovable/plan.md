

## Two-Column Layout for Analysis Page

The page currently stacks everything vertically in a single `max-w-3xl` column, making it long. A two-column layout will let users see tasks and skills side-by-side, reducing scroll depth significantly.

### Layout Design

```text
┌─────────────────────────────────────────────────┐
│  Header (full width)                            │
│  Company Snapshot (full width)                  │
│  Summary Stats + Distribution Bar (full width)  │
├────────────────────┬────────────────────────────┤
│  LEFT COLUMN       │  RIGHT COLUMN              │
│  Task Cards        │  Skills Panel              │
│  (each task with   │  (grouped by category,     │
│   state/trend/     │   highlights when a task   │
│   impact badges)   │   is hovered/selected)     │
│                    │                            │
│                    │  Additional Skills at      │
│                    │  bottom of right column    │
├────────────────────┴────────────────────────────┤
│  Save CTA (full width)                          │
└─────────────────────────────────────────────────┘
```

### Technical Changes

**`src/pages/Analysis.tsx`** — single file change:

1. **Widen container** from `max-w-3xl` to `max-w-6xl`.

2. **Add interaction state** — `selectedTaskIndex` (number | null) to track which task the user clicked/hovered.

3. **Two-column grid** after the distribution bar:
   - `grid grid-cols-1 lg:grid-cols-2 gap-6`
   - **Left column**: Task cards (simplified — remove the inline related-skills section from each card). Each card gets an `onClick` to set `selectedTaskIndex`.
   - **Right column**: Sticky skills panel (`sticky top-6`). Shows skills filtered to the selected task, or all skills grouped by category when nothing is selected. Includes orphan skills at the bottom.

4. **Responsive**: On mobile (`< lg`), falls back to single column with skills still inline under tasks (current behavior).

### User Experience
- Clicking a task highlights it and filters the right panel to show only that task's related skills.
- Clicking the same task again deselects it, showing all skills.
- The right panel stays visible as users scroll through tasks (sticky positioning).

