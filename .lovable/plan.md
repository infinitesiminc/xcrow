

# Homepage Refresh — Showcase the AI Scouting Mission

## Problem
The current homepage uses a generic "Scout. Battle. Conquer." 3-step loop that doesn't reflect the actual 4-phase mission system (Discover → Experiment → Challenge → Master) or the key gameplay components users engage with in-app: NPC encounters, Guardian Trials, castle upgrades, territory conquest, and the quest journal.

## Proposed Changes

### 1. Replace "How It Works" 3-step with the 4-Phase Mission Journey
Replace the current Scout/Battle/Conquer cards (lines 232–297) with a **4-phase vertical timeline** matching the real mission architecture:

| Phase | Gameplay shown | Visual |
|---|---|---|
| **Discover** | Talk to Role NPCs on the world map, scout territories, collect skill intel | NPC encounter screenshot/illustration |
| **Experiment** | Enter AI-powered simulations, earn Bronze/Silver on skills, build castle foundations | Simulation briefing screenshot |
| **Challenge** | Face Guardian Trials, reach Gold tier, unlock boss battles | Boss battle preview image |
| **Master** | Conquer 10+ skills, reach Platinum, build Citadels, claim territories | Territory conquest/celebration visual |

Each phase card shows: phase number, icon, title, description, and a relevant screenshot. A connecting vertical line with milestone dots ties them together.

### 2. Add "Key Gameplay" showcase section (new, after mission phases)
A horizontal scrolling strip or 2×3 grid of gameplay feature cards:

- **🗺️ World Map** — "Explore 8 territories with 183 skills"
- **🗣️ NPC Encounters** — "Talk to role NPCs to scout skill intel"
- **⚔️ Quest Simulations** — "AI-powered tasks from real job data"
- **🏰 Castle Progression** — "Evolve castles from Ruins to Citadel"
- **👹 Guardian Trials** — "Boss battles that test strategic oversight"
- **📜 Quest Journal** — "Track missions, intel, and battle record"

Each card: icon, title, one-line description. Keeps it scannable.

### 3. Streamline existing sections
- **Remove** "Who Is This For" (lines 499–548) — the game speaks for itself; focus on student-first positioning already in hero
- **Remove** standalone "Rank Ladder" (lines 461–497) — detail players discover in-game
- **Merge** Social Proof stats into the Company Marquee section header
- **Keep** Castle Progression, Territory Map, Boss Battle, Social Arena, Final CTA

### 4. Update Hero copy
- Headline: "183 skills. 4 phases. 1 mission." → "Master the AI frontier."
- Subline: "Discover roles, experiment with quests, challenge guardians, and master your territory — built from 100,000+ real jobs."
- CTA buttons: "Begin Your Mission" (primary) + "See How It Works" (secondary)

### 5. Final section order (10 → 9 sections)

```text
1. Hero (updated copy + mission framing)
2. Social Proof stats + Company Marquee (merged)
3. The Mission — 4-Phase Journey (NEW, replaces 3-step)
4. Key Gameplay Features (NEW, compact grid)
5. Boss Battle Showcase (keep)
6. Castle Progression (keep)
7. Territory Map (keep)
8. Social Arena (keep)
9. Final CTA (keep)
```

### Technical Details

**File**: `src/pages/Index.tsx`
- Remove `RANK_LADDER` constant and its section (~lines 115–497)
- Remove "Who Is This For" section (~lines 499–548)
- Move social proof stats into company marquee section header
- Add `MISSION_PHASES` constant array with 4 phases (icon, title, desc, color)
- Add `GAMEPLAY_FEATURES` constant array with 6 feature cards
- New section components rendered inline (no new files needed)
- Reuse existing assets: `simBriefing`, `simVictory`, `heroConquer`, `bossBattlePreview`
- Phase colors map to territory CSS variables for visual consistency

