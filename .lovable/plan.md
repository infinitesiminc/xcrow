

# Seed Boss Battle Markers on the Map

## Problem
The `FutureIsland.tsx` rendering only checks `isLevel2` and shows a generic gold diamond for all L2 skills. It doesn't visually differentiate between **boss available** (pulsing challenge marker) and **boss completed** (evolved crown node). The variables `isBossAvailable` and `isBossCompleted` are computed but never used in the render logic.

## What Changes

### `src/components/territory/FutureIsland.tsx`
Replace the single `isLevel2` diamond rendering block (lines ~210-273) with three distinct states:

1. **Boss Completed** (`isBossCompleted`): Gold circle with crown 👑 emoji, amber glow ring, elevated stroke — the "evolved" trophy state
2. **Boss Available** (`isBossAvailable`): Pulsing diamond with ⚔️ BOSS badge, animated glow pulse — impossible to miss on the map
3. **Normal L1**: Current circle rendering (unchanged)

Also update the tooltip content to show "⚔️ Boss Battle Available!" or "👑 Conquered" based on state.

### `src/pages/MapPage.tsx`
The `DEMO_LEVEL2_SKILLS` set already seeds 12 skills as L2-eligible. No changes needed — the boss markers will appear automatically for these demo skills since `level2CompletedIds` starts empty (making all 12 show as "boss available").

## Visual Result
On first load, ~12 skills across the map will show pulsing diamond ⚔️ boss markers instead of normal circles, creating visible map events that draw the user in.

