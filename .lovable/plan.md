

## Mission Control Center — /journey Redesign

Transform the current scrollable Journey page into a **non-scrollable, full-viewport gaming-style dashboard** that acts as the command center for the entire student experience.

### Design Concept

A fixed-height viewport (100vh minus navbar) divided into panels using CSS Grid. Dark glassmorphism with neon spectrum accents — the same gaming style used on the bubble map and school detail pages.

```text
┌─────────────────────────────────────────────────────┐
│  NAVBAR (56px)                                      │
├──────────┬──────────────────────┬───────────────────┤
│          │                      │                   │
│  STATS   │   SKILL MAP GRID    │  INTEL FEED       │
│  COLUMN  │   (26 skills,       │                   │
│          │    compact tiles)    │  • Hot Skills     │
│  • Level │                     │    (market demand  │
│  • XP    │                     │     not in school) │
│  • Rank  │                     │                   │
│  • Edges │                     │  • AI Drops       │
│    count │                     │    (new model      │
│          │                     │     releases)     │
│  ────────│                     │                   │
│  HUMAN   │                     │  • Role Unlocks   │
│  EDGES   │                     │    (new roles      │
│  (compact│                     │     you can reach) │
│   list)  │                     │                   │
│          │                     │                   │
├──────────┴──────────────────────┴───────────────────┤
│  AI TICKER BAR (model releases flying across)       │
└─────────────────────────────────────────────────────┘
```

### Layout: 3-Column Grid

- **Left column (~200px)**: Player stats card + Human Edges mini-list (scrollable within panel)
- **Center column (flex)**: Compact skill map grid — smaller tiles, all 26 visible without scrolling
- **Right column (~240px)**: Intel feed with 3 sections stacked (each internally scrollable)

### Panel Details

**Left — Player HUD**
- Neon-bordered glassmorphic card
- Total XP, active skills count, level-ups, tasks practiced
- Human edges as compact chip list (discovered vs locked)
- CTA: "Start Exploring" if empty

**Center — Skill Map**
- Reuse `SkillMapGrid` logic but with much smaller tiles (~60px) to fit all 26 in viewport
- Category headers as thin dividers, not full sections
- Click still opens detail sheet
- Gaming card style: dark glass tiles with neon glow on active skills

**Right — Intel Feed** (3 stacked panels)
1. **Hot Skills** — fetch `get_market_skill_demand` RPC, cross-reference with user's skills to show gaps. No school data needed — purely "market wants X, you haven't practiced it yet." Neon pink accent for urgency.
2. **AI Drops** — reuse `FRONTIER_RELEASES` data from StickyTicker, show as a compact live feed with flying animation or scrolling list. Red/destructive accent.
3. **Role Unlocks** — based on user's current skills, show roles they're close to matching (from saved/bookmarked roles or computed from skill coverage). Purple/cyan accent.

**Bottom — Ticker Bar**
- Compact version of StickyTicker showing AI model releases flying across

### Data Sources (all existing, no new DB tables)
- User skills: `completed_simulations` → `aggregateSkillXP()` (existing)
- Market demand: `get_market_skill_demand` RPC (existing)
- AI releases: `FRONTIER_RELEASES` constant (existing)
- Role unlocks: `bookmarked_roles` + skill matching (existing)

### Responsive
- On mobile: stack into a vertical scrollable layout (mobile can't fit 3 columns)
- On desktop: strict `h-[calc(100vh-56px)] overflow-hidden` grid

### Files Changed

1. **`src/pages/Journey.tsx`** — Replace with full-viewport grid layout, remove Footer, add `overflow-hidden`
2. **`src/components/settings/JourneyDashboard.tsx`** — Major rewrite into `MissionControl` component with 3-column grid
3. **New `src/components/journey/PlayerHUD.tsx`** — Left column: stats + edges
4. **New `src/components/journey/CompactSkillGrid.tsx`** — Center: tiny gaming-style skill tiles
5. **New `src/components/journey/IntelFeed.tsx`** — Right column: hot skills, AI drops, role unlocks
6. **Remove** `CurriculumGapBanner` and `SchoolTeaser` imports (no longer gated behind school signup)

### Gaming Style Applied
- Dark gradient background (`hsl(240 10% 4%)` → `hsl(240 8% 8%)`)
- 3px neon spectrum top-border on each panel
- Glassmorphic panel backgrounds with `backdrop-blur`
- Neon glow on active elements
- Monospace numbers, Space Grotesk headings
- Ambient blur orbs behind panels

