

# Progression System Explainer Page

## What We're Building

A visually rich marketing page at `/progression` that explains the unified 3-layer progression framework to users. Uses the Dark Fantasy RPG aesthetic with animated sections, clear visual hierarchy, and interactive elements.

## Page Structure

### 1. Hero Section
- Headline: "Your Path to Mastery" with Cinzel typography
- Subhead: "Every simulation ripples through your entire career map"
- Animated flow diagram: `Sim → Skill Rings → Castle → Kingdom → Rank`

### 2. Layer 1: Skill Castles (The Atom)
- Visual: Animated castle evolving through 4 tiers (Ruins → Outpost → Fortress → Citadel)
- 3-Ring diagram showing Foundation / AI Mastery / Human Edge with colored arcs
- Explanation: L1 sims fill the AI Mastery ring, L2 sims fill the Human Edge ring, Foundation is passive
- Castle tier table with emoji, XP thresholds, and ring requirements

### 3. Layer 2: Kingdoms (Per Role)
- Visual: 4-stage kingdom progression cards (Scouted → Contested → Fortified → Conquered)
- Explanation: Kingdom tier is driven by how many linked skill castles you've leveled up
- Callout: "Fortified unlocks Level 2 content" as a gate indicator
- Skill checklist preview showing linked castles per role

### 4. Layer 3: Player Rank (Aggregate)
- Visual: Rank badges in a horizontal ladder (Recruit → Explorer → Strategist → Commander → Legend)
- Requirements listed per rank (castles + kingdoms needed)
- Emphasis on breadth over grinding

### 5. The Ripple Effect (Summary)
- Animated chain showing how one sim completion cascades upward through all 3 layers
- "Every action has a clear, visible ripple effect up the chain"

### 6. CTA
- "Start Your First Battle" button linking to the map page

## Technical Details

### Files Created
- `src/pages/Progression.tsx` — new page component (~400 lines)

### Files Modified
- `src/App.tsx` — add route `/progression`
- `src/components/Navbar.tsx` — optionally add nav link

### Design Patterns
- Follows `SimulationDesign.tsx` pattern: sectioned layout with `fadeUp` motion animations
- Uses existing UI components: Card, Badge, Progress, Button
- Reuses `GrowthRings` component for the 3-ring visual
- RPG aesthetic: stone textures, Cinzel headings, territory colors
- Fully responsive with mobile-first approach

