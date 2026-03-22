

## RPG Mini-Quest Reveal — Pre-Simulation Intel Gathering

### The Problem
The current progressive reveal uses clinical "Step 1 / Step 2" labels. It needs RPG flavor, XP rewards, and randomness to create a hook before the player enters the actual simulation.

### Design: Two Mini-Quests with XP & Randomness

Instead of "steps", the player completes two **Intel Quests** before the main battle. Each awards a small XP bounty and includes a random element.

```text
┌─────────────────────────────────────┐
│  🗺️ INTEL QUEST: Scout the Threat  │
│  "The Crow has spotted movement..."  │
│  Reward: +5-15 XP (random)          │
│  [Scout Now →]                       │
└─────────────────────────────────────┘
         ↓ (after clicking)
   Threat data animates in with
   a "loot reveal" shimmer effect
   XP toast: "+12 XP — Intel Gathered"
         ↓
┌─────────────────────────────────────┐
│  🔓 INTEL QUEST: Decode the Arsenal │
│  "Ancient scrolls reveal skills..." │
│  Reward: +5-15 XP (random)          │
│  [Decode Now →]                      │
└─────────────────────────────────────┘
         ↓ (after clicking)
   Skills animate in with staggered
   card flip / loot-drop effect
   XP toast: "+8 XP — Arsenal Unlocked"
         ↓
┌─────────────────────────────────────┐
│  ⚔️ Accept Quest (main CTA)         │
│  Now boosted with intel context      │
└─────────────────────────────────────┘
```

### Randomness Hooks

1. **Random XP bounty**: Each intel quest awards 5-15 XP (rolled on click). Displayed with a brief "dice roll" animation (number cycling for ~0.5s before landing). This creates variable reward — the core dopamine hook in games.

2. **Random flavor text**: Each quest card picks from a pool of 3-4 RPG phrases so repeat visits feel fresh:
   - Scout: "The Crow spotted movement..." / "Dark clouds gather over this territory..." / "Your scouts report incoming threats..."
   - Decode: "Ancient scrolls reveal hidden skills..." / "A merchant offers forbidden knowledge..." / "The War Council has new intelligence..."

### Technical Changes

**File: `src/components/role/TaskDetailPanel.tsx`**
- Replace "Step 1/Step 2" labels with quest names: "Scout the Threat" / "Decode the Arsenal"
- Add random XP roll on click (5-15 range, `Math.floor(Math.random() * 11) + 5`)
- Add XP earned display with brief number-cycling animation
- Pick random flavor text from arrays using `useMemo` (stable per mount)
- Swap `Eye`/`Lock` icons for `Compass`/`Scroll` (more RPG-appropriate)
- After both quests complete, the bottom CTA text changes from "Accept Quest" to "⚔️ Begin Battle — Intel Advantage Active" to reward completion

**File: `src/lib/castle-levels.ts`** (no changes needed — XP here is for post-simulation skill progression, separate from intel XP)

### What Stays the Same
- The actual data revealed (threat intel, future skills) is identical
- Framer Motion animations for content reveal
- The main "Accept Quest" / "Begin Battle" CTA at bottom
- Skeleton loading states while predictions load

### Implementation: Single file edit
All changes are contained in `TaskDetailPanel.tsx`. No new files, no database changes.

