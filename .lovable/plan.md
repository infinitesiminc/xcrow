

# Inline Job Cards in Chat + RPG Territory Map

## Problem Statement
1. **Eye-switching fatigue**: On desktop, role cards appear in the right panel while the chat is on the left — users must constantly shift focus between panels.
2. **Territory map feels flat**: The current skill territory is a table of categorized pill buttons — functional but not immersive or game-like.

---

## Part 1: Inline Job Cards in Chat

**Current behavior**: On desktop, `inlineCards={false}` — role results only appear in the right panel's `BatchedRoleCarousel`. On mobile, `inlineCards={true}` already shows them inline.

**Proposed change**: Always render role cards inline in the chat stream (both mobile and desktop), with a richer inline card design.

### Changes
- **`Index.tsx`**: Set `inlineCards={true}` for desktop too. Keep the right panel carousel as a persistent "history" but make inline cards the primary interaction point.
- **`InlineRoleCarousel` → `InlineChatRoleCards`**: Redesign the inline cards to be more contextual within chat:
  - Wider cards (fill chat width, 2-column grid instead of horizontal scroll)
  - Show salary range if available
  - Show augmented score as a compact bar
  - "Practice" and "View Details" quick actions directly on the card
  - Clicking "View Details" opens the role in the right panel (or full-screen on mobile)
  - Clicking "Practice" jumps straight to simulation
- **`HomepageChat.tsx`**: Update the roles rendering block to use the new grid layout

### Result
Users see job cards right where the AI mentions them — no eye-switching needed. The right panel becomes a secondary "pinned role" view.

---

## Part 2: RPG Territory Map

Replace the current table/pill layout with an isometric or top-down RPG-style map rendered in canvas/SVG.

### Design Concept
```text
┌──────────────────────────────────────────┐
│           SKILL TERRITORY MAP            │
│                                          │
│    ┌───┐        ┌───┐     ┌───┐         │
│    │🏰│───path──│⚡│─────│🔬│         │
│    │Tech│        │ AI │     │Res│         │
│    └───┘        └───┘     └───┘         │
│      │            │                      │
│    path         path                     │
│      │            │                      │
│    ┌───┐        ┌───┐     ┌───┐         │
│    │🗣│        │📊│─────│🎨│         │
│    │Comm│        │Anly│     │Cre│         │
│    └───┘        └───┘     └───┘         │
│                   │                      │
│                 ┌───┐                    │
│                 │⚖│                    │
│                 │Comp│                    │
│                 └───┘                    │
└──────────────────────────────────────────┘
```

### Approach: SVG-based Hex/Island Map (no heavy 3D library)

Each skill category becomes an **island/region** on a hand-drawn style map. Individual skills are **nodes** within each region connected by paths.

- **Regions**: 6 category islands arranged in a hex-like layout, each with a distinct terrain theme (tech = circuit city, creative = art studio, leadership = castle, etc.)
- **Skill Nodes**: Circular nodes within each region. Visual states:
  - **Claimed** (bright, glowing, animated pulse) — skills with XP
  - **Frontier** (semi-visible, dashed border) — adjacent to claimed
  - **Undiscovered** (fog/cloud overlay, locked icon)
  - **Contested** (flame animation, pulsing border) — in-demand target skills
- **Paths**: SVG lines connecting related skills, lit up as you progress
- **Player Avatar**: A small crow icon sitting on the last-practiced skill
- **Growth Rings**: Keep the 3-ring indicator (Foundation/AI/Human Edge) as a mini overlay on each node
- **Interactions**: Click a node to zoom in and see details + practice CTA. Pan/zoom the whole map.

### Technical Implementation
- **`TerritoryMap.tsx`** (new): Main SVG-based map component using `framer-motion` for animations
- **`territory/IslandRegion.tsx`** (new): Renders a category island with its skill nodes
- **`territory/SkillNode.tsx`** (new): Individual skill node with state-based visuals
- **`territory/MapPaths.tsx`** (new): SVG path connections between nodes
- **`lib/territory-layout.ts`** (new): Pre-computed positions for each skill node in the map layout — hex-grid coordinates per category region
- Pan/zoom via CSS transforms + wheel/drag handlers (no heavy library needed)
- Fog-of-war effect using SVG masks/filters for undiscovered areas
- Keep `TerritoryGrid` as fallback for accessibility/compact views

### Why SVG over Canvas/Three.js
- Works with existing framer-motion animations
- Accessible (DOM nodes are clickable, tooltips work natively)
- No heavy dependencies
- Performant for 31 nodes
- Responsive and sharp at any resolution

---

## Implementation Order
1. Inline chat cards (smaller change, immediate UX win)
2. Territory map layout engine (position calculations)
3. Territory map rendering (SVG islands, nodes, paths)
4. Fog-of-war + animations
5. Integration with existing skill data and click handlers

